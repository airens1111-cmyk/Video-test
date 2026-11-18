"""English voiceover with edge-tts: phrase-by-phrase synthesis, real pauses, exact word timings.

edge-tts does not accept custom SSML <break>, so every phrase between pause marks
is synthesised separately and joined with silence of the requested length.
Word timings come from edge-tts WordBoundary events (exact for en-* voices).

Text markup:  [p] short pause, [P] long pause, {KING} ... {/KING} line read by the king voice.

Usage:
  python3 tools/tts.py --text-file in.txt --voice en-GB-RyanNeural --out out.wav --timings out.json
"""
import argparse
import asyncio
import json
import os
import re
import subprocess

import numpy as np
import edge_tts

SR = 48000
PAUSE = {"p": 0.38, "P": 0.6}


async def synth_phrase(text, voice, rate, pitch):
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch,
                             boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
    audio, words = bytearray(), []
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append({"w": ch["text"], "t0": ch["offset"] / 1e7, "t1": (ch["offset"] + ch["duration"]) / 1e7})
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", "pipe:0", "-ar", str(SR), "-ac", "1", "-f", "s16le", "-"],
                         input=bytes(audio), check=True, capture_output=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
    return x, words


def trim(x, words):
    """Cut leading/trailing silence; shift word times accordingly."""
    a = np.abs(x)
    thr = max(a.max() * 0.01, 1e-4)
    idx = np.where(a > thr)[0]
    s = max(0, idx[0] - int(0.02 * SR)); e = min(len(x), idx[-1] + int(0.06 * SR))
    off = s / SR
    return x[s:e], [{**w, "t0": max(0, w["t0"] - off), "t1": max(0, w["t1"] - off)} for w in words]


def parse(text):
    """-> list of (speaker, phrase, pause_after)."""
    out, speaker = [], "narrator"
    for tok in re.split(r"(\[p\]|\[P\]|\{KING\}|\{/KING\}|\n\n)", text):
        if tok in ("[p]", "[P]"):
            if out: out[-1][2] = max(out[-1][2], PAUSE[tok[1]])
        elif tok == "{KING}": speaker = "king"
        elif tok == "{/KING}": speaker = "narrator"
        elif tok == "\n\n":
            if out: out[-1][2] = max(out[-1][2], 0.9)
        else:
            t = " ".join(tok.split())
            if t: out.append([speaker, t, 0.12])
    return out


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text-file", required=True)
    ap.add_argument("--voice", default="en-GB-RyanNeural")
    ap.add_argument("--rate", default="-10%")
    ap.add_argument("--pitch", default="-3Hz")
    ap.add_argument("--king-voice", default="en-GB-ThomasNeural")
    ap.add_argument("--king-rate", default="-14%")
    ap.add_argument("--king-pitch", default="-6Hz")
    ap.add_argument("--lead", type=float, default=0.5)
    ap.add_argument("--out", required=True)
    ap.add_argument("--timings")
    a = ap.parse_args()
    phrases = parse(open(a.text_file, encoding="utf-8").read())
    chunks, words, t = [np.zeros(int(a.lead * SR), np.float32)], [], a.lead
    for spk, ph, pause in phrases:
        v, r, p = (a.king_voice, a.king_rate, a.king_pitch) if spk == "king" else (a.voice, a.rate, a.pitch)
        x, ws = trim(*(await synth_phrase(ph, v, r, p)))
        for w in ws:
            words.append({"word": w["w"], "start": round(t + w["t0"], 3), "end": round(t + w["t1"], 3), "speaker": spk})
        chunks += [x, np.zeros(int(pause * SR), np.float32)]
        t += len(x) / SR + pause
    y = np.concatenate(chunks)
    y = y / max(1e-6, np.abs(y).max()) * 0.89
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0", a.out],
                   input=y.astype(np.float32).tobytes(), check=True)
    if a.timings:
        json.dump({"duration": round(len(y) / SR, 3), "words": words}, open(a.timings, "w"), indent=1)
    print(f"{a.out}: {len(y)/SR:.1f}s, {len(words)} words")


if __name__ == "__main__":
    asyncio.run(main())
