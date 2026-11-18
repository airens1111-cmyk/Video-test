"""Pixel-art held items (extruded in 3D by the renderer): Georgian sabre (khmali), Persian shamshir, khanjali dagger.
Original sprites, rasterised from a curved centre line with outline / edge / core shading.

Usage: python3 tools/items.py -> video/public/items/<id>.png + items.json
"""
import json
import math
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "video", "public", "items")


def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def blade_sprite(n, guard, tip, pommel, curve, width, steel, guard_col, grip_col, pommel_col, guard_len=2.5, grip_wraps=True):
    img = np.zeros((n, n, 4), np.uint8)
    gx, gy = guard; tx, ty = tip
    L = math.hypot(tx - gx, ty - gy); dx, dy = (tx - gx) / L, (ty - gy) / L; px_, py_ = -dy, dx
    pts = []
    for k in range(200):
        t = k / 199
        off = curve * math.sin(math.pi * t * 0.9) * t
        w = width * (1 - 0.75 * t ** 1.6) + 0.35
        pts.append((gx + dx * L * t + px_ * off, gy + dy * L * t + py_ * off, w, t))
    core, edge, outline = hexc(steel[0]), hexc(steel[1]), hexc(steel[2])
    for y in range(n):
        for x in range(n):
            cx, cy = x + 0.5, y + 0.5
            best = None
            for (bx, by, w, t) in pts:
                d = math.hypot(cx - bx, cy - by) / w
                if best is None or d < best[0]:
                    best = (d, t, (cx - bx) * px_ + (cy - by) * py_)
            d, t, side = best
            if (cx - gx) * dx + (cy - gy) * dy < 0.6:
                continue                                         # nothing of the blade behind the guard
            if d < 0.55:
                img[y, x] = core if side > -0.2 else edge          # bright back, darker cutting edge
            elif d < 1.0:
                img[y, x] = edge
            elif d < 1.45:
                img[y, x] = outline
    # crossguard
    for s in np.linspace(-guard_len, guard_len, 24):
        x, y = int(gx + px_ * s), int(gy + py_ * s)
        if 0 <= x < n and 0 <= y < n:
            img[y, x] = hexc(guard_col[0] if abs(s) < guard_len - 0.6 else guard_col[1])
    # grip and pommel
    pxp, pyp = pommel
    steps = 16
    for k in range(1, steps + 1):
        t = k / steps
        x, y = int(gx - dx * 0.8 + (pxp - gx + dx * 0.8) * t), int(gy - dy * 0.8 + (pyp - gy + dy * 0.8) * t)
        if 0 <= x < n and 0 <= y < n and img[y, x, 3] == 0 or (0 <= x < n and 0 <= y < n and tuple(img[y, x]) != hexc(guard_col[0])):
            img[y, x] = hexc(grip_col[1] if (grip_wraps and (x + y) % 3 == 0) else grip_col[0])
    for (ox, oy) in ((0, 0), (1, 0), (0, 1)):
        x, y = pxp + ox - 1, pyp + oy
        if 0 <= x < n and 0 <= y < n:
            img[y, x] = hexc(pommel_col)
    return img


ITEMS = [
    # id, sprite, grip pixel (in the hand), scale (sprite px in skin px)
    ("khmali", lambda: blade_sprite(20, (7, 12), (18, 1), (2, 17), curve=0.9, width=1.25,
                                    steel=("#e6eaee", "#a3abb4", "#3b3f46"), guard_col=("#c9a54a", "#8a6a2a"),
                                    grip_col=("#3a2418", "#6a4a2a"), pommel_col="#c9c2b2"), (4, 15), 1.0),
    ("shamshir", lambda: blade_sprite(20, (7, 12), (18, 3), (2, 17), curve=-3.4, width=1.05,
                                      steel=("#eef0f2", "#b0b6bd", "#3b3f46"), guard_col=("#d8b450", "#8a6a2a"),
                                      grip_col=("#2a1c14", "#c9a54a"), pommel_col="#d8b450", guard_len=2.0), (4, 15), 1.0),
    ("khanjali", lambda: blade_sprite(14, (5, 9), (12, 2), (2, 12), curve=0.0, width=1.5,
                                      steel=("#e6eaee", "#a3abb4", "#3b3f46"), guard_col=("#c9c2b2", "#8a8478"),
                                      grip_col=("#2a1c14", "#c9c2b2"), pommel_col="#c9c2b2", guard_len=1.6), (3, 11), 0.7),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    meta = []
    for iid, fn, grip, scale in ITEMS:
        img = fn()
        Image.fromarray(img, "RGBA").save(os.path.join(OUT, iid + ".png"))
        meta.append({"id": iid, "size": img.shape[0], "grip": list(grip), "scale": scale})
        print(iid)
    json.dump(meta, open(os.path.join(OUT, "items.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
