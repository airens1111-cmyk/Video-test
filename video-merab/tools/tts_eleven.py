"""Georgian voiceover with ElevenLabs (exact word timings from the API).

Each scene is synthesised in one request (natural prosody across its
sentences) with /with-timestamps, which returns the start/end time of every
character. Word and sentence times are taken from those character times.

Usage (from video/):
    ELEVENLABS_API_KEY=... python3 tools/tts_eleven.py
The key is read from the environment only; it is never written to the repo.
Writes public/voice.wav and data/timings.json. Responses are cached in
.tts_cache/ (git-ignored) so re-runs do not spend characters.
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.request
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
LEAD = 0.5       # silence before the first word
GAP_SCENE = 0.5   # between scenes
TAIL = 3.2       # outro after the last word
PAD_IN, PAD_OUT = 0.04, 0.12


def load_voice():
    with open(os.path.join(ROOT, "src", "config.ts"), encoding="utf-8") as f:
        src = f.read()
    block = re.search(r"\bvoice:\s*\{(.*?)\}", src, re.S).group(1)
    get = lambda k: re.search(k + r':\s*"([^"]+)"', block).group(1)
    return {k: get(k) for k in ("provider", "name", "id", "model", "language", "tempo")}


def synth(text, voice, prev_text, next_text):
    key = os.environ.get("ELEVENLABS_API_KEY")
    cache_dir = os.path.join(ROOT, ".tts_cache")
    os.makedirs(cache_dir, exist_ok=True)
    body = {"text": text, "model_id": voice["model"], "language_code": voice["language"]}
    if prev_text:
        body["previous_text"] = prev_text
    if next_text:
        body["next_text"] = next_text
    h = hashlib.sha1(json.dumps([body, voice["id"]], ensure_ascii=False).encode()).hexdigest()[:16]
    path = os.path.join(cache_dir, f"el_{h}.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    if not key:
        sys.exit("ELEVENLABS_API_KEY is not set")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice['id']}/with-timestamps?output_format=mp3_44100_128"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.loads(r.read())
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    return data


def decode(mp3_bytes, tempo=1.0):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "pipe:0", "-af", f"atempo={tempo}",
                          "-ar", str(SR), "-ac", "1", "-f", "s16le", "-"],
                         input=mp3_bytes, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def main():
    with open(os.path.join(ROOT, "data", "script.json"), encoding="utf-8") as f:
        script = json.load(f)
    voice = load_voice()
    scenes = script["scenes"]
    pieces = [np.zeros(int(LEAD * SR), np.float32)]
    t = LEAD
    out_scenes = []
    for si, sc in enumerate(scenes):
        text = " ".join(sc["sentences"])
        prev_text = " ".join(scenes[si - 1]["sentences"]) if si else None
        next_text = " ".join(scenes[si + 1]["sentences"]) if si + 1 < len(scenes) else None
        data = synth(text, voice, prev_text, next_text)
        al = data.get("alignment") or data["normalized_alignment"]
        chars = al["characters"]
        cs, ce = al["character_start_times_seconds"], al["character_end_times_seconds"]
        if "".join(chars) != text:
            sys.exit(f"alignment text mismatch in {sc['id']}")
        tempo = float(voice["tempo"])
        audio = decode(base64.b64decode(data["audio_base64"]), tempo)
        cs = [x / tempo for x in cs]
        ce = [x / tempo for x in ce]
        a0 = max(0.0, cs[0] - PAD_IN)
        a1 = min(len(audio) / SR, ce[-1] + PAD_OUT)
        clip = audio[int(a0 * SR): int(a1 * SR)]
        off = t - a0  # global time = local time + off
        # words from character spans
        words, i = [], 0
        for m in re.finditer(r"\S+", text):
            words.append({"w": m.group(), "start": round(cs[m.start()] + off, 3), "end": round(ce[m.end() - 1] + off, 3),
                          "_c": (m.start(), m.end())})
        sentences, pos = [], 0
        for s_text in sc["sentences"]:
            s0 = text.index(s_text, pos)
            s1 = s0 + len(s_text)
            pos = s1
            ws = [{k: w[k] for k in ("w", "start", "end")} for w in words if s0 <= w["_c"][0] < s1]
            sentences.append({"text": s_text, "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
        start = 0.0 if si == 0 else round(t, 3)
        pieces.append(clip)
        t += len(clip) / SR
        gap = TAIL if si == len(scenes) - 1 else GAP_SCENE
        pieces.append(np.zeros(int(gap * SR), np.float32))
        t += gap
        out_scenes.append({"id": sc["id"], "start": start, "end": round(t, 3), "sentences": sentences})
    audio = np.concatenate(pieces)
    peak = np.abs(audio).max()
    if peak > 0:
        audio = audio * (0.89 / peak)  # about -1 dBFS peak
    os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
    with wave.open(os.path.join(ROOT, "public", "voice.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes())
    out = {"voice": voice, "sampleRate": SR, "duration": round(len(audio) / SR, 3),
           "method": "ElevenLabs with-timestamps, one request per scene; word times from character alignment",
           "scenes": out_scenes}
    with open(os.path.join(ROOT, "data", "timings.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("duration", out["duration"])
    for s in out_scenes:
        print(s["id"], s["start"], s["end"], round(s["end"] - s["start"], 1))


if __name__ == "__main__":
    main()
