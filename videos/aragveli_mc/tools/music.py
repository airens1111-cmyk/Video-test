"""Original music, synthesised with numpy (no samples, no existing melodies).

  mourning_A  : salamuri-like flute melody over a drone and a soft choir pad (D, natural minor with slides)
  mourning_B  : three-voice "Georgian-style" choral polyphony in parallel fourths/fifths (D, Phrygian colour),
                salamuri enters in the second half
  battle_bed  : war drums + low horns ostinato

Usage: python3 tools/music.py OUTDIR [--dur 30]
"""
import os
import sys

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
rng = np.random.default_rng(1795)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(n):
    return np.arange(n) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def bp(x, f0, q):
    lo, hi = f0 / (1 + 0.5 / q), f0 * (1 + 0.5 / q)
    return sosfilt(butter(2, [lo, min(hi, SR / 2 - 100)], "band", fs=SR, output="sos"), x)


def adsr(n, a=0.05, r=0.2, curve=1.0):
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** curve
    if nr: e[n - nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e


def reverb(x, secs=2.8, wet=0.35, seed=0):
    """Stereo reverb: convolution with decaying, filtered noise IRs."""
    r = np.random.default_rng(seed)
    n = int(secs * SR)
    env = np.exp(-6.9 * t_axis(n) / secs)
    out = []
    for ch in range(2):
        ir = r.standard_normal(n) * env
        ir = lp(ir, 5000)
        ir[: int(0.012 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        out.append(fftconvolve(x, ir)[: len(x)])
    dry = np.stack([x, x])
    return (1 - wet) * dry + wet * np.stack(out) * 1.2


# ---------------------------------------------------------------- instruments
def salamuri(notes, bpm, total):
    """notes: list of (midi|None, beats, scoop_cents). Continuous phase, glides between notes."""
    beat = 60 / bpm
    n = int(total * SR)
    f = np.zeros(n); amp = np.zeros(n)
    t = 0.0
    prev = None
    for m, b, scoop in notes:
        d = b * beat
        i0, i1 = int(t * SR), min(n, int((t + d) * SR))
        if i0 >= n: break
        L = i1 - i0
        if m is None:
            if prev is not None: f[i0:i1] = mtof(prev)
            t += d; continue
        ft = np.full(L, mtof(m))
        tt = t_axis(L)
        if prev is not None:                       # legato glide from previous note
            g = min(L, int(0.11 * SR))
            ft[:g] = mtof(prev) * (mtof(m) / mtof(prev)) ** (np.linspace(0, 1, g) ** 0.6)
        if scoop:                                   # "pulling" intonation: start below, lean into pitch
            g = min(L, int(0.32 * SR))
            ft[:g] *= 2 ** ((-scoop * (1 - np.linspace(0, 1, g)) ** 2) / 1200)
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.1 * tt) * np.clip((tt - 0.35) / 0.6, 0, 1)
        f[i0:i1] = ft * vib
        e = adsr(L, a=0.07, r=min(0.25, d * 0.3), curve=0.7) * (0.85 + 0.15 * np.clip(tt / d, 0, 1))
        amp[i0:i1] = np.maximum(amp[i0:i1], e)
        prev = m
        t += d
    f[f == 0] = mtof(62)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.32 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph) + 0.06 * np.sin(4 * ph) + 0.03 * np.sin(5 * ph))
    breath = bp(rng.standard_normal(n), 1800, 1.2) * 0.12 + bp(rng.standard_normal(n), 900, 3) * 0.08
    amp = lp(amp, 30)
    return (tone * 0.5 + breath * (0.6 + 0.4 * np.sin(ph * 0 + 1))) * amp


def saw_stack(freq, n, detune=(0.0,), harm=24):
    tt = t_axis(n)
    y = np.zeros(n)
    for dc in detune:
        f0 = freq * 2 ** (dc / 1200)
        for k in range(1, harm + 1):
            if f0 * k > 9000: break
            y += np.sin(2 * np.pi * f0 * k * tt + rng.uniform(0, 6.28)) / k
    return y / len(detune)


VOWEL = {"a": [(700, 1.0, 6), (1220, 0.5, 8), (2600, 0.25, 10)],
         "o": [(450, 1.0, 6), (800, 0.45, 8), (2830, 0.12, 10)],
         "u": [(325, 1.0, 6), (700, 0.3, 8), (2530, 0.08, 10)]}


def choir_voice(midi_seq, total, vowel="a", detune=(-9, -3, 4, 10), gain=1.0):
    """midi_seq: list of (start_s, dur_s, midi). Each note: detuned saws through vowel formants."""
    n = int(total * SR)
    y = np.zeros(n)
    for st, d, m in midi_seq:
        i0 = int(st * SR); L = min(n - i0, int(d * SR))
        if L <= 0: continue
        src = saw_stack(mtof(m), L, detune)
        src *= 1 + 0.004 * np.sin(2 * np.pi * 5.4 * t_axis(L))
        form = sum(g * bp(src, f0, q) for f0, g, q in VOWEL[vowel])
        y[i0:i0 + L] += form * adsr(L, a=min(1.4, d * 0.35), r=min(1.6, d * 0.4), curve=1.6)
    return y * gain


def drone(midis, total, cutoff=500):
    n = int(total * SR)
    tt = t_axis(n)
    y = sum(saw_stack(mtof(m), n, (-4, 0, 5), harm=14) for m in midis)
    y = lp(y, cutoff)
    swell = 0.75 + 0.25 * np.sin(2 * np.pi * tt / 11.0 - 1.5)
    return y * swell * adsr(n, a=3.0, r=3.0)


def drum(n_len, f_hi=110, f_lo=45, decay=0.45, noise=0.25):
    tt = t_axis(n_len)
    f = f_lo + (f_hi - f_lo) * np.exp(-tt / 0.045)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / decay)
    click = lp(rng.standard_normal(n_len), 3500) * np.exp(-tt / 0.012) * noise
    skin = bp(rng.standard_normal(n_len), 220, 1.5) * np.exp(-tt / 0.09) * 0.3
    return body + click + skin


def frame_drum(n_len):
    tt = t_axis(n_len)
    return (bp(rng.standard_normal(n_len), 900, 1.0) * np.exp(-tt / 0.06) * 0.7
            + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / 0.1) * 0.4)


def horn(m, d, n_total, st):
    n = int(n_total * SR)
    y = np.zeros(n)
    i0 = int(st * SR); L = min(n - i0, int(d * SR))
    tt = t_axis(L)
    f = mtof(m) * (1 - 0.03 * np.exp(-tt / 0.15))
    ph = 2 * np.pi * np.cumsum(f) / SR
    bright = np.clip(tt / 0.9, 0, 1) * 0.8 + 0.2
    s = np.zeros(L)
    for k in range(1, 18):
        s += np.sin(k * ph) / k * np.exp(-k * (1.3 - bright) * 0.45)
    s = lp(s, 2200)
    y[i0:i0 + L] = s * adsr(L, a=0.35, r=0.9, curve=1.3)
    return y


# ---------------------------------------------------------------- pieces
def norm(st, peak=0.89):
    return st / np.abs(st).max() * peak


def mourning_A(total):
    bpm = 56
    D4, E4, F4, G4, A4, Bb4, C5, D5 = 62, 64, 65, 67, 69, 70, 72, 74
    mel = [(None, 4, 0),
           (A4, 2, 60), (G4, 1, 0), (F4, 1, 0), (E4, 2, 80), (D4, 3, 0), (None, 1, 0),
           (D4, 1, 0), (F4, 1, 0), (G4, 1, 0), (A4, 2, 50), (Bb4, 1, 0), (A4, 3, 90), (None, 1, 0),
           (C5, 1.5, 70), (Bb4, 0.5, 0), (A4, 1, 0), (G4, 1, 0), (F4, 1, 40), (E4, 1, 0), (F4, 1, 0), (E4, 1, 60),
           (D4, 5, 0)]
    fl = salamuri(mel, bpm, total)
    dr = drone([38, 45], total)
    beat = 60 / bpm
    chords = [(0, 8, [50, 57, 62]), (8, 6, [48, 55, 60]), (14, 6, [46, 53, 58]), (20, 4, [48, 55, 60]), (24, 10, [50, 57, 62])]
    pad = sum(choir_voice([(s * beat, d * beat + 0.6, m)], total, "o", gain=0.5)
              for s, d, ms in chords for m in ms)
    mix = 0.55 * reverb(fl, 3.2, 0.42, 1) + 0.33 * reverb(dr, 2.0, 0.2, 2) + 0.42 * reverb(pad, 3.5, 0.5, 3)
    fade = adsr(mix.shape[1], a=1.2, r=3.0)
    return norm(mix * fade)


def mourning_B(total):
    """Three-voice polyphony: bass drone, middle voice leads, top voice in fourths/fifths, unison cadences."""
    sec = 2.1  # seconds per note
    mid = [62, 63, 65, 63, 62, 62, 65, 67, 69, 67, 65, 63, 62, 62]
    top = [69, 68, 70, 68, 69, 67, 70, 72, 74, 72, 70, 68, 67, 69]   # mostly 4th/5th above, closing on the 5th
    seq = lambda notes: [(i * sec, sec + 0.35, m) for i, m in enumerate(notes)]
    bass = choir_voice([(0, total, 50)], total, "u", gain=0.9) + choir_voice([(0, total, 38)], total, "u", gain=0.5)
    m_v = choir_voice(seq(mid), total, "a", gain=0.9)
    t_v = choir_voice(seq(top), total, "a", detune=(-6, 2, 8), gain=0.6)
    bpm = 60 / sec * 1.0
    fl = salamuri([(None, 7, 0), (74, 1, 80), (72, 0.5, 0), (70, 0.5, 0), (69, 1.5, 60), (67, 0.5, 0), (65, 1, 0),
                   (63, 1, 90), (62, 2.5, 0)], bpm, total)
    mix = 0.45 * reverb(bass, 3.0, 0.4, 4) + 0.5 * reverb(m_v, 3.4, 0.45, 5) + 0.38 * reverb(t_v, 3.4, 0.5, 6) \
        + 0.42 * reverb(fl, 3.4, 0.45, 7)
    return norm(mix * adsr(mix.shape[1], a=2.0, r=3.0))


def battle_bed(total):
    bpm = 92
    beat = 60 / bpm
    n = int(total * SR)
    L = np.zeros(n); R = np.zeros(n)
    big = drum(int(1.2 * SR), 95, 38, 0.6, 0.35)
    mid = drum(int(0.8 * SR), 150, 70, 0.3, 0.3)
    pattern = [(0, "big"), (1.5, "mid"), (2, "big"), (2.75, "mid"), (3, "mid"), (3.5, "mid")]
    bar = 0
    while bar * 4 * beat < total - 0.5:
        for pos, kind in pattern:
            i = int((bar * 4 + pos) * beat * SR)
            if i >= n: continue
            s = big if kind == "big" else mid
            j = min(n, i + len(s))
            pan = 0.5 if kind == "big" else (0.35 if pos % 1 else 0.65)
            L[i:j] += s[: j - i] * (1 - pan) * 1.4; R[i:j] += s[: j - i] * pan * 1.4
        for k in range(8):                           # frame drums, 8ths
            i = int((bar * 4 + k * 0.5) * beat * SR)
            if i >= n: continue
            fd = frame_drum(int(0.3 * SR)) * (0.5 if k % 2 else 0.8)
            j = min(n, i + len(fd)); L[i:j] += fd[: j - i] * 0.35; R[i:j] += fd[: j - i] * 0.45
        bar += 1
    hrn = np.zeros(n)
    for st, d, ms in [(0.0, 5.0, [38, 45]), (6.5, 4.0, [41, 48]), (10.5, 5.5, [38, 45, 50]),
                      (17.0, 3.5, [43, 50]), (20.8, 4.0, [41, 48]), (25.0, 5.0, [38, 45, 50])]:
        for m in ms:
            if st < total: hrn += horn(m, min(d, total - st), total, st)
    hrn = reverb(hrn, 2.6, 0.4, 8)
    drums = np.stack([L, R])
    drums = 0.8 * drums + 0.2 * reverb((L + R) / 2, 1.8, 1.0, 10)
    mix = drums * 0.9 + hrn * 0.55
    return norm(mix * adsr(n, a=0.4, r=2.0))


def write(path, st):
    import subprocess
    x = np.ascontiguousarray(st.T.astype(np.float32))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "pipe:0",
                    "-c:a", "pcm_s16le", path], input=x.tobytes(), check=True)
    print(path, f"{st.shape[1]/SR:.1f}s")


if __name__ == "__main__":
    out = sys.argv[1]
    dur = float(sys.argv[3]) if len(sys.argv) > 3 else 30.0
    os.makedirs(out, exist_ok=True)
    write(os.path.join(out, "mourning_A_salamuri.wav"), mourning_A(dur))
    write(os.path.join(out, "mourning_B_choir.wav"), mourning_B(dur))
    write(os.path.join(out, "battle_bed.wav"), battle_bed(dur))
