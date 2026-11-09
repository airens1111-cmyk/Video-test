"""Generate the Georgian voiceover with edge-tts and build word timings.

edge-tts returns only sentence boundaries for ka-GE voices, so each sentence is
synthesised separately (exact sentence timing), and word timings inside a
sentence are estimated: proportional to character count, then snapped to the
pauses found in the audio loudness envelope at punctuation marks.

Usage: python3 tools/tts.py   (run from video/)
Reads data/script.json and the voice block in src/config.ts.
Writes public/voice.wav and data/timings.json.
"""
import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

import numpy as np
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
LEAD = 0.6          # silence before first sentence (title on screen)
GAP_SENTENCE = 0.32 # between sentences of one scene
GAP_SCENE = 0.75     # between scenes
TAIL = 3.6           # outro after the last word


def load_json(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return json.load(f)


async def synth(text, voice, rate, pitch, out_mp3):
    proxy = os.environ.get("HTTPS_PROXY")
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, proxy=proxy)
    await c.save(out_mp3)


def decode(mp3):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", mp3, "-ar", str(SR), "-ac", "1", "-f", "s16le", "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def envelope_db(x, hop=0.01):
    n = int(SR * hop)
    frames = len(x) // n
    rms = np.sqrt(np.mean(x[: frames * n].reshape(frames, n) ** 2, axis=1) + 1e-12)
    return 20 * np.log10(rms), hop


def trim(x):
    db, hop = envelope_db(x)
    thr = db.max() - 40
    idx = np.where(db > thr)[0]
    a = max(0, int((idx[0] * hop - 0.02) * SR))
    b = min(len(x), int(((idx[-1] + 1) * hop + 0.04) * SR))
    return x[a:b]


def gaps(x, min_len=0.05):
    """Internal pauses (start, end) in seconds."""
    db, hop = envelope_db(x)
    thr = db.max() - 32
    quiet = db < thr
    out, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if i > 0 and j < len(quiet) and (j - i) * hop >= min_len:
                out.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    return out


PUNCT = ",.:;?!—"


def weight(w):
    return len(re.sub(r"[^\w]", "", w)) + 1.5


def word_times(words, dur, pauses, env=None):
    """Proportional split with anchors at punctuation-matched pauses."""
    ws = [weight(w) for w in words]
    total = sum(ws)
    cum = np.cumsum([0] + ws) / total
    # anchors: index of word after which a pause is expected
    anchors = []  # (word_idx, pause_start, pause_end)
    used = set()
    for i, w in enumerate(words[:-1]):
        if w[-1] in PUNCT:
            est = cum[i + 1] * dur
            best = None
            for k, (ps, pe) in enumerate(pauses):
                if k in used:
                    continue
                d = abs((ps + pe) / 2 - est)
                if d < 0.35 * dur and (best is None or d < best[0]):
                    best = (d, k)
            if best:
                used.add(best[1])
                anchors.append((i, *pauses[best[1]]))
    anchors.sort()
    # segments between anchors
    segs = []
    start_w, start_t = 0, 0.0
    for (i, ps, pe) in anchors:
        segs.append((start_w, i + 1, start_t, ps))
        start_w, start_t = i + 1, pe
    segs.append((start_w, len(words), start_t, dur))
    out = [None] * len(words)
    for a, b, t0, t1 in segs:
        sw = ws[a:b]
        tot = sum(sw)
        t = t0
        for k, wgt in enumerate(sw):
            d = (t1 - t0) * wgt / tot
            out[a + k] = [t, t + d]
            t += d
    # snap boundaries inside a segment to the nearest loudness dip (±120 ms)
    if env is not None:
        db, hop = env
        anchor_words = {i for i, _, _ in anchors}
        for i in range(len(words) - 1):
            if i in anchor_words:
                continue
            b = out[i][1]
            lo = max(0, int((b - 0.12) / hop))
            hi = min(len(db) - 1, int((b + 0.12) / hop))
            # keep order with neighbours
            lo = max(lo, int((out[i][0] + 0.08) / hop))
            hi = min(hi, int((out[i + 1][1] - 0.08) / hop))
            if hi > lo:
                j = lo + int(np.argmin(db[lo:hi + 1]))
                nb = (j + 0.5) * hop
                out[i][1] = nb
                out[i + 1][0] = nb
    out = [[round(a, 3), round(b, 3)] for a, b in out]
    return out, len(anchors), sum(1 for w in words[:-1] if w[-1] in PUNCT)


def load_voice():
    """Read the voice block from src/config.ts (single source of truth)."""
    with open(os.path.join(ROOT, "src", "config.ts"), encoding="utf-8") as f:
        src = f.read()
    block = re.search(r"voice:\s*\{(.*?)\}", src, re.S).group(1)
    get = lambda k: re.search(k + r':\s*"([^"]+)"', block).group(1)
    return {"voice": get("name"), "rate": get("rate"), "pitch": get("pitch")}


def main():
    script = load_json("data/script.json")
    voice = load_voice()
    tmp = os.path.join(ROOT, ".tts_cache")
    os.makedirs(tmp, exist_ok=True)
    pieces, timeline = [], []
    t = LEAD
    pieces.append(np.zeros(int(LEAD * SR), np.float32))
    stats = [0, 0]
    for si, sc in enumerate(script["scenes"]):
        # the first scene owns the lead-in, so its title is on the cover frame
        scene = {"id": sc["id"], "start": 0.0 if si == 0 else round(t, 3), "sentences": []}
        for k, text in enumerate(sc["sentences"]):
            key = hashlib.sha1(json.dumps([text, voice], ensure_ascii=False).encode()).hexdigest()[:16]
            mp3 = os.path.join(tmp, f"{key}.mp3")
            # a truncated stream can yield almost no audio: require a plausible length
            min_dur = 0.035 * len(text)
            x = None
            for attempt in range(5):
                try:
                    if attempt or not os.path.exists(mp3):
                        asyncio.run(synth(text, voice["voice"], voice["rate"], voice["pitch"], mp3))
                    x = trim(decode(mp3))
                    if len(x) / SR >= min_dur:
                        break
                    print(f"retry {sc['id']}/{k}: only {len(x)/SR:.2f}s", file=sys.stderr)
                except Exception as e:  # network hiccup
                    print("retry", e, file=sys.stderr)
                x = None
            if x is None:
                sys.exit(f"TTS failed for {sc['id']} sentence {k}")
            dur = len(x) / SR
            words = text.split()
            wt, hit, want = word_times(words, dur, gaps(x), envelope_db(x))
            stats[0] += hit
            stats[1] += want
            scene["sentences"].append({
                "text": text, "start": round(t, 3), "end": round(t + dur, 3),
                "words": [{"w": w, "start": round(t + a, 3), "end": round(t + b, 3)}
                          for w, (a, b) in zip(words, wt)],
            })
            pieces.append(x)
            t += dur
            last_sentence = k == len(sc["sentences"]) - 1
            gap = GAP_SENTENCE if not last_sentence else GAP_SCENE
            if si == len(script["scenes"]) - 1 and last_sentence:
                gap = TAIL
            pieces.append(np.zeros(int(gap * SR), np.float32))
            t += gap
        scene["end"] = round(t, 3)
        timeline.append(scene)
    audio = np.concatenate(pieces)
    os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
    wav_path = os.path.join(ROOT, "public", "voice.wav")
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes())
    out = {
        "voice": voice, "sampleRate": SR, "duration": round(len(audio) / SR, 3),
        "method": "per-sentence edge-tts synthesis; word times proportional to "
                  "character count, snapped to loudness-envelope pauses at punctuation",
        "punctuationPausesMatched": f"{stats[0]}/{stats[1]}",
        "scenes": timeline,
    }
    with open(os.path.join(ROOT, "data", "timings.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("duration", out["duration"], "pauses matched", out["punctuationPausesMatched"])


if __name__ == "__main__":
    main()
