"""Re-voice ONE scene with ElevenLabs and splice it into the existing voiceover.

Use when the text of a single scene changed: the other scenes keep their
recorded audio, so no characters are spent on them and their prosody stays.

    ELEVENLABS_API_KEY=... python3 tools/revoice_scene.py s04
    python3 tools/audio_mix.py

Reads data/script.json (new text) and the current public/voice.wav +
data/timings.json, replaces that scene's audio, matches its loudness to the
old take, shifts the timings of later scenes and rewrites both files.
"""
import base64
import json
import os
import re
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts_eleven import ROOT, SR, GAP_SCENE, TAIL, PAD_IN, PAD_OUT, load_voice, synth, decode  # noqa: E402


def read_wav(path):
    with wave.open(path, "rb") as w:
        assert w.getframerate() == SR and w.getnchannels() == 1
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0


def main():
    sid = sys.argv[1]
    script = json.load(open(os.path.join(ROOT, "data", "script.json"), encoding="utf-8"))["scenes"]
    tpath = os.path.join(ROOT, "data", "timings.json")
    timings = json.load(open(tpath, encoding="utf-8"))
    si = next(i for i, s in enumerate(script) if s["id"] == sid)
    sc, old = script[si], timings["scenes"][si]
    assert old["id"] == sid

    voice = load_voice()
    text = " ".join(sc["sentences"])
    prev_text = " ".join(script[si - 1]["sentences"]) if si else None
    next_text = " ".join(script[si + 1]["sentences"]) if si + 1 < len(script) else None
    data = synth(text, voice, prev_text, next_text)
    al = data.get("alignment") or data["normalized_alignment"]
    cs, ce = al["character_start_times_seconds"], al["character_end_times_seconds"]
    if "".join(al["characters"]) != text:
        sys.exit("alignment text mismatch")
    tempo = float(voice["tempo"])
    audio = decode(base64.b64decode(data["audio_base64"]), tempo)
    cs = [x / tempo for x in cs]
    ce = [x / tempo for x in ce]
    a0 = max(0.0, cs[0] - PAD_IN)
    a1 = min(len(audio) / SR, ce[-1] + PAD_OUT)
    clip = audio[int(a0 * SR): int(a1 * SR)]

    voice_wav = read_wav(os.path.join(ROOT, "public", "voice.wav"))
    last = si == len(script) - 1
    gap = TAIL if last else GAP_SCENE
    o0 = old["start"] if si else old["sentences"][0]["start"] - PAD_IN
    o1 = old["end"] - gap
    old_clip = voice_wav[int(o0 * SR): int(o1 * SR)]
    rms = lambda x: float(np.sqrt(np.mean(x ** 2))) if len(x) else 0.0
    if rms(clip) > 0:
        clip = clip * (rms(old_clip) / rms(clip))  # same loudness as the old take

    new_audio = np.concatenate([voice_wav[: int(o0 * SR)], clip, voice_wav[int(o1 * SR):]])
    delta = round(len(clip) / SR - (o1 - o0), 3)
    off = o0 - a0
    words = [{"w": m.group(), "start": round(cs[m.start()] + off, 3), "end": round(ce[m.end() - 1] + off, 3), "_c": (m.start(), m.end())}
             for m in re.finditer(r"\S+", text)]
    sentences, pos = [], 0
    for s_text in sc["sentences"]:
        s0 = text.index(s_text, pos)
        s1 = s0 + len(s_text)
        pos = s1
        ws = [{k: w[k] for k in ("w", "start", "end")} for w in words if s0 <= w["_c"][0] < s1]
        sentences.append({"text": s_text, "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
    timings["scenes"][si] = {"id": sid, "start": old["start"], "end": round(old["end"] + delta, 3), "sentences": sentences}
    for later in timings["scenes"][si + 1:]:
        later["start"] = round(later["start"] + delta, 3)
        later["end"] = round(later["end"] + delta, 3)
        for s in later["sentences"]:
            s["start"] = round(s["start"] + delta, 3)
            s["end"] = round(s["end"] + delta, 3)
            for w in s["words"]:
                w["start"] = round(w["start"] + delta, 3)
                w["end"] = round(w["end"] + delta, 3)
    timings["duration"] = round(len(new_audio) / SR, 3)

    with wave.open(os.path.join(ROOT, "public", "voice.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(new_audio, -1, 1) * 32767).astype(np.int16).tobytes())
    json.dump(timings, open(tpath, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{sid}: {o1 - o0:.2f}s -> {len(clip) / SR:.2f}s (shift {delta:+.3f}s), total {timings['duration']}s")


if __name__ == "__main__":
    main()
