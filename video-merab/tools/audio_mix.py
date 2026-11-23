"""Mix the voiceover with an original ambient music bed and transition SFX.

Everything is synthesised from scratch (no third-party audio), so there are no
licensing issues. Music is side-chain ducked under the voice so narration stays
clear. Reads public/voice.wav + data/timings.json, writes public/mix.wav.
"""
import json
import os
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000


def read_wav(path):
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(1)
    assert sr == SR, f"voice sample rate {sr} != {SR}"
    return x


def adsr(n, a, r):
    env = np.ones(n)
    a = int(a * SR)
    r = int(r * SR)
    if a:
        env[:a] = np.linspace(0, 1, a)
    if r:
        env[-r:] = np.linspace(1, 0, r)
    return env


def lowpass(x, cutoff):
    # one-pole low-pass
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def pad_chord(freqs, dur):
    """Soft detuned pad for one chord."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for fr in freqs:
        for det in (-0.4, 0.0, 0.5):
            out += np.sin(2 * np.pi * (fr + det) * t)
    out /= len(freqs) * 3
    # slow shimmer
    out *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.2 * t)
    out *= adsr(n, 0.6, 0.9)
    return out


def music_bed(total):
    # A minor progression: Am - F - C - G, two bars each, loop
    chords = {
        "Am": [110.0, 220.0, 261.63, 329.63],
        "F": [87.31, 174.61, 220.0, 261.63],
        "C": [130.81, 196.0, 261.63, 329.63],
        "G": [98.0, 196.0, 246.94, 293.66],
    }
    seq = ["Am", "F", "C", "G"]
    bar = 3.4  # seconds per chord
    buf = np.zeros(int(total * SR) + 2 * SR)
    pos = 0.0
    i = 0
    while pos < total:
        name = seq[i % len(seq)]
        seg = pad_chord(chords[name], bar + 0.9)  # overlap tails
        s = int(pos * SR)
        e = min(len(buf), s + len(seg))
        buf[s:e] += seg[: e - s]
        pos += bar
        i += 1
    buf = buf[:int(total * SR)]
    buf = lowpass(buf, 1400)
    # soft sub pulse on a slow beat (~71 bpm)
    beat = 60 / 71
    t = np.arange(len(buf)) / SR
    sub = np.zeros(len(buf))
    k = 0
    while k * beat < total:
        s = int(k * beat * SR)
        n = int(0.5 * SR)
        tt = np.arange(n) / SR
        env = np.exp(-tt * 7)
        ping = np.sin(2 * np.pi * 55 * tt) * env
        e = min(len(sub), s + n)
        sub[s:e] += ping[: e - s]
        k += 1
    buf = buf * 0.9 + sub * 0.12
    peak = np.abs(buf).max()
    if peak > 0:
        buf /= peak
    return buf


def whoosh(dur=0.45):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = np.random.default_rng(1).standard_normal(n)
    # sweep a band-ish feel: low-pass with rising cutoff via envelope on noise
    env = np.sin(np.pi * t / dur) ** 2
    y = lowpass(noise, 800) * env
    y += lowpass(noise, 3000) * env * 0.4 * (t / dur)
    y /= np.abs(y).max() + 1e-9
    return y


def chime():
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for fr, a in [(880, 1.0), (1320, 0.5), (1760, 0.3)]:
        y += a * np.sin(2 * np.pi * fr * t) * np.exp(-t * 2.2)
    y /= np.abs(y).max()
    return y


def main():
    voice = read_wav(os.path.join(ROOT, "public", "voice.wav"))
    timings = json.load(open(os.path.join(ROOT, "data", "timings.json"), encoding="utf-8"))
    total = len(voice) / SR

    music = music_bed(total)[:len(voice)]
    if len(music) < len(voice):
        music = np.pad(music, (0, len(voice) - len(music)))

    # side-chain duck: compute a smooth voice envelope
    env = np.abs(voice)
    win = int(0.05 * SR)
    env = np.convolve(env, np.ones(win) / win, mode="same")
    env /= env.max() + 1e-9
    duck = 1.0 - 0.75 * np.clip(env * 3, 0, 1)  # music dips where voice is

    mix = voice * 1.0 + music * 0.16 * duck

    # transition whooshes at each scene start (except the first)
    wh = whoosh()
    for sc in timings["scenes"][1:]:
        s = int((sc["start"] - 0.22) * SR)
        if s < 0:
            s = 0
        e = min(len(mix), s + len(wh))
        mix[s:e] += wh[: e - s] * 0.22

    # gentle chime at the outro avatar
    ch = chime()
    out_s = int((total - 3.0) * SR)
    e = min(len(mix), out_s + len(ch))
    mix[out_s:e] += ch[: e - out_s] * 0.12

    peak = np.abs(mix).max()
    if peak > 0.99:
        mix *= 0.99 / peak
    out = os.path.join(ROOT, "public", "mix.wav")
    with wave.open(out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
    print("mix", round(total, 1), "s  peak", round(float(np.abs(mix).max()), 3),
          "voiceRMS", round(float(np.sqrt((voice ** 2).mean())), 3),
          "musicRMS", round(float(np.sqrt((music ** 2).mean())), 3))


if __name__ == "__main__":
    main()
