"""Pixel-art character skins (64x64, standard box unwrap: base + overlay layer) and tall-headgear
accessory textures, painted procedurally from historical references (see sources.md, "Costumes").
All art is original; only the common 64x64 box-unwrap layout is shared with other voxel games.

Usage: python3 tools/skins.py  ->  video/public/skins/<id>.png, <id>_acc.png, skins.json
"""
import json
import os
import random

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "video", "public", "skins")

# part: (origin x, y, w, h, d, overlay origin x, y)
PARTS = {
    "head": (0, 0, 8, 8, 8, 32, 0),
    "body": (16, 16, 8, 12, 4, 16, 32),
    "rarm": (40, 16, 4, 12, 4, 40, 32),
    "larm": (32, 48, 4, 12, 4, 48, 48),
    "rleg": (0, 16, 4, 12, 4, 0, 32),
    "lleg": (16, 48, 4, 12, 4, 0, 48),
}
SIDES = ("top", "bottom", "right", "front", "left", "back")


def face_rect(ox, oy, w, h, d, side):
    return {"top": (ox + d, oy, w, d), "bottom": (ox + d + w, oy, w, d), "right": (ox, oy + d, d, h),
            "front": (ox + d, oy + d, w, h), "left": (ox + d + w, oy + d, d, h), "back": (ox + 2 * d + w, oy + d, w, h)}[side]


def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def mul(c, k):
    return (max(0, min(255, int(c[0] * k))), max(0, min(255, int(c[1] * k))), max(0, min(255, int(c[2] * k))), c[3])


class Skin:
    def __init__(self, seed):
        self.img = np.zeros((64, 64, 4), np.uint8)
        self.r = random.Random(seed)

    def paint(self, part, sides, fn, layer="base"):
        """fn(u, v, w, h, side) -> rgba or None (keep)."""
        ox, oy, w, h, d, lx, ly = PARTS[part]
        if layer == "over":
            ox, oy = lx, ly
        for s in (SIDES if sides == "all" else sides):
            x0, y0, fw, fh = face_rect(ox, oy, w, h, d, s)
            for v in range(fh):
                for u in range(fw):
                    c = fn(u, v, fw, fh, s)
                    if c is not None:
                        self.img[y0 + v, x0 + u] = c

    def cloth(self, base, k=0.08):
        """Noisy fabric colour with slight vertical shading."""
        def f(u, v, w, h, s):
            sh = 1.0 + (self.r.random() - 0.5) * 2 * k - (0.10 if s == "bottom" else 0) + (0.06 if s == "top" else 0)
            sh *= 1.0 - 0.10 * (v / max(1, h - 1)) if s not in ("top", "bottom") else 1.0
            return mul(hexc(base), sh)
        return f

    def shade_edges(self):
        for part, (ox, oy, w, h, d, lx, ly) in PARTS.items():
            for (bx, by) in ((ox, oy), (lx, ly)):
                for side in ("right", "front", "left", "back"):
                    x0, y0, fw, fh = face_rect(bx, by, w, h, d, side)
                    for v in range(fh):
                        for u in range(fw):
                            px = self.img[y0 + v, x0 + u]
                            if px[3] == 0:
                                continue
                            k = 1.0
                            if v == fh - 1: k *= 0.82
                            if v == 0 and part != "head": k *= 1.06
                            if u == 0 or u == fw - 1: k *= 0.9
                            self.img[y0 + v, x0 + u, :3] = np.clip(px[:3].astype(float) * k, 0, 255).astype(np.uint8)

    def fill_base_holes(self, fallback=(90, 70, 55, 255)):
        """The base layer must be opaque everywhere a box face maps (holes show the inside of the box)."""
        for part, (ox, oy, w, h, d, lx, ly) in PARTS.items():
            for side in SIDES:
                x0, y0, fw, fh = face_rect(ox, oy, w, h, d, side)
                region = self.img[y0:y0 + fh, x0:x0 + fw]
                region[region[..., 3] == 0] = fallback

    def save(self, path):
        self.fill_base_holes()
        self.shade_edges()
        Image.fromarray(self.img, "RGBA").save(path)


def tex(r, base, k=0.1):
    return mul(hexc(base), 1 + (r.random() - 0.5) * 2 * k)


# ------------------------------------------------------------------ building blocks
def head_base(S, skin, hair, eyes="#3a2a1e", age=0.0, beard=None, beard_col=None, moustache=True, hair_long=False, brow=None):
    r = S.r
    S.skin_tone = skin
    brow = brow or hair

    def f(u, v, w, h, s):
        c = tex(r, skin, 0.05)
        if s == "top":
            return tex(r, hair, 0.12)
        if s == "bottom":
            return mul(hexc(skin), 0.8)
        if s == "front":
            if v <= 1:
                return tex(r, hair, 0.12)
            if v == 2 and u in (1, 2, 5, 6):
                return tex(r, brow, 0.1)
            if v == 3:
                if u in (1, 6):
                    return hexc("#f2efe8")
                if u in (2, 5):
                    return hexc(eyes)
            if v == 4 and u in (3, 4):
                return mul(hexc(skin), 0.86)                 # nose shadow
            if age > 0.5 and v == 4 and u in (1, 6):
                return mul(hexc(skin), 0.88)                 # wrinkles under the eyes
            if v == 6 and u in (3, 4):
                return hexc("#5a2c24")                        # mouth
            if v == 5 and u in (2, 5):
                return mul(hexc(skin), 0.92)
            return c
        # sides and back: hair band, ears
        if v <= (6 if (s == "back" or hair_long) else 2):
            return tex(r, hair, 0.12)
        if s in ("left", "right") and v == 3 and u in (3, 4):
            return mul(hexc(skin), 0.9)
        return c
    S.paint("head", "all", f)
    if beard:
        bc = beard_col or hair

        def b(u, v, w, h, s):
            if s == "front":
                if moustache and v == 5 and 1 <= u <= 6 and u not in (3, 4):
                    return tex(r, bc, 0.12)
                if moustache and v == 5 and u in (3, 4):
                    return tex(r, bc, 0.1)
                if beard == "full" and v >= 6 and not (v == 6 and u in (3, 4)):
                    return tex(r, bc, 0.14)
                if beard == "full" and v == 4 and u in (0, 7):
                    return tex(r, bc, 0.14)
                if beard == "short" and v == 7 and 1 <= u <= 6:
                    return tex(r, bc, 0.14)
                return None
            if s in ("left", "right") and beard == "full" and v >= 4 and ((s == "right" and u >= 4) or (s == "left" and u <= 3)):
                return tex(r, bc, 0.14)
            if s == "bottom" and beard == "full":
                return tex(r, bc, 0.14)
            return None
        S.paint("head", "all", b)


def hands(S, part, skin):
    def f(u, v, w, h, s):
        if s == "bottom":
            return tex(S.r, skin, 0.05)
        if v >= h - 3 and s != "top":
            return mul(tex(S.r, skin, 0.05), 0.95 if v == h - 3 else 1.0)
        return None
    S.paint(part, "all", f)


def sleeves(S, col, cuff=None, k=0.08, length=9):
    for p in ("rarm", "larm"):
        hands(S, p, getattr(S, "skin_tone", "#c9946c"))
        cl = S.cloth(col, k)
        S.paint(p, "all", lambda u, v, w, h, s: cl(u, v, w, h, s) if (s == "top" or v < length) else None)
        if cuff:
            S.paint(p, "all", lambda u, v, w, h, s: tex(S.r, cuff, 0.06) if s not in ("top", "bottom") and v == length - 1 else None)


def legs(S, trousers, boots, boot_h=5, toe=None):
    for p in ("rleg", "lleg"):
        tr = S.cloth(trousers, 0.07)

        def f(u, v, w, h, s, tr=tr):
            if s == "bottom":
                return mul(hexc(boots), 0.7)
            if s != "top" and v >= h - boot_h:
                c = tex(S.r, boots, 0.08)
                if v == h - boot_h:
                    c = mul(c, 1.15)                          # boot top highlight
                if v == h - 1:
                    c = mul(c, 0.75)                          # sole
                return c
            return tr(u, v, w, h, s)
        S.paint(p, "all", f)


def skirt(S, col, rows=6, trim=None, slit=True, layer="over"):
    """Long coat (chokha / qaba) skirt over the upper legs, on the overlay layer."""
    for p in ("rleg", "lleg"):
        def f(u, v, w, h, s, p=p):
            if s in ("top", "bottom") or v >= rows:
                return None
            if slit and s == "front" and ((p == "rleg" and u == w - 1) or (p == "lleg" and u == 0)) and v >= 2:
                return None                                   # front opening
            c = tex(S.r, col, 0.08)
            if trim and v == rows - 1:
                return tex(S.r, trim, 0.08)
            return mul(c, 1 - 0.05 * v)
        S.paint(p, "all", f, layer)


def torso(S, col, k=0.08):
    S.paint("body", "all", S.cloth(col, k))
    # subtle fold lines on the back and sides
    S.paint("body", ["back"], lambda u, v, w, h, s: mul(hexc(col), 0.85) if u in (2, 5) and v > 7 else None)


def belt(S, col="#2a1e16", buckle="#c9c2b2", row=7, dagger=True):
    def f(u, v, w, h, s):
        if s in ("top", "bottom"):
            return None
        if v == row:
            if s == "front" and u in (3, 4):
                return hexc(buckle)
            return tex(S.r, col, 0.1)
        if dagger and s == "front" and u == 4 and row < v <= row + 3:
            return hexc("#2b2622") if v < row + 3 else hexc("#b8b4ac")   # khanjali hilt + sheath tip
        if dagger and s == "front" and u == 4 and v == row + 4:
            return hexc("#8a8478")
        return None
    S.paint("body", "all", f, "over")


def gazyri(S, holder="#d9d2c0", cap="#a8a090", rows=(1, 2, 3, 4)):
    """Cartridge holders on both breasts (chokha)."""
    def f(u, v, w, h, s):
        if s == "front" and v in rows and u in (1, 2, 5, 6):
            return hexc(cap) if u in (1, 6) else hexc(holder)
        return None
    S.paint("body", ["front"], f, "over")


def chokha_front(S, col, inner="#e6dfcf"):
    """V-neck opening showing the beshmet/shirt, centre seam."""
    def f(u, v, w, h, s):
        if s != "front":
            return None
        if v <= 3 and u in (3, 4) and v <= 3 - abs(u - 3.5) + 1:
            return tex(S.r, inner, 0.05)
        if v > 7 and u in (3, 4):
            return mul(tex(S.r, col, 0.05), 0.8)
        return None
    S.paint("body", ["front"], f)


def mail(S, part, rows, base="#7d8085", layer="over"):
    """Mail (chain) texture: checker of light/dark rings."""
    def f(u, v, w, h, s):
        if s in ("top",) and part != "head":
            return tex(S.r, base, 0.1)
        if s == "bottom":
            return None
        if v not in rows:
            return None
        ring = (u + (v // 1) % 2) % 2 == 0
        k = 1.12 if ring else 0.86
        if v % 2 == 1 and u % 2 == 1:
            k = 0.94
        return mul(hexc(base), k * (1 + (S.r.random() - 0.5) * 0.1))
    S.paint(part, "all", f, layer)


def papakha(S, col="#2a2420", rows=3):
    def f(u, v, w, h, s):
        if s == "bottom":
            return None
        if s == "top":
            return mul(hexc(col), 1.0 + (S.r.random() - 0.5) * 0.5)
        if v < rows:
            curl = 1.0 + (0.35 if (u * 3 + v * 5 + S.r.randint(0, 2)) % 4 == 0 else -0.1 * S.r.random())
            return mul(hexc(col), curl)
        return None
    S.paint("head", "all", f, "over")


def felt_cap(S, col="#8a8070", band="#5a2a22"):
    def f(u, v, w, h, s):
        if s == "bottom":
            return None
        if s == "top":
            return tex(S.r, col, 0.08)
        if v == 0:
            return tex(S.r, col, 0.08)
        if v == 1:
            return tex(S.r, band, 0.08) if (u % 3) else hexc("#c8b06a")
        return None
    S.paint("head", "all", f, "over")


def helmet_mail(S, steel="#9aa0a6", mail_c="#7d8085", face_open=True):
    def f(u, v, w, h, s):
        if s == "bottom":
            return None
        if s == "top":
            return mul(hexc(steel), 1.15 if (u in (3, 4) or S.r.random() < 0.2) else 1.0)
        if v <= 1:
            return mul(hexc(steel), 1.1 if v == 0 else 0.85)
        if s == "front" and face_open:
            if v >= 7 and 1 <= u <= 6:
                return mul(hexc(mail_c), 1.15 if (u + v) % 2 == 0 else 0.8)
            return None
        return mul(hexc(mail_c), 1.15 if (u + v) % 2 == 0 else 0.8)   # aventail on sides and back
    S.paint("head", "all", f, "over")


def sash_diagonal(S, col="#5a72c8"):
    """Order ribbon from the right shoulder to the left hip (as in the 18th-c. portrait)."""
    def f(u, v, w, h, s):
        if s == "front" and abs((u + 0.5) - (7.5 - v * 0.75)) < 1.2:
            return mul(hexc(col), 1.1 if (u + v) % 3 == 0 else 0.95)
        if s == "back" and abs((u + 0.5) - (v * 0.75)) < 1.2:
            return mul(hexc(col), 0.9)
        return None
    S.paint("body", ["front", "back"], f, "over")


def gold_braid(S, coat, gold="#c9a54a"):
    """Horizontal gold cords across the chest (frogging, as on the royal portrait)."""
    def f(u, v, w, h, s):
        if s == "front" and 1 <= v <= 6 and v % 2 == 1 and u not in (3, 4):
            return mul(hexc(gold), 1.1 if u in (0, 7) else 0.95)
        if s == "front" and 1 <= v <= 6 and v % 2 == 1 and u in (3, 4):
            return hexc("#e0c870")
        return None
    S.paint("body", ["front"], f, "over")


def ermine(S, parts=("body", "rarm", "larm")):
    def f(u, v, w, h, s):
        if s == "bottom":
            return None
        if s == "top" or v <= 1:
            c = hexc("#eeeae2")
            if (u * 7 + v * 3) % 9 == 0:
                c = hexc("#1c1a18")
            return mul(c, 1 - 0.06 * S.r.random())
        return None
    for p in parts:
        S.paint(p, "all", f, "over")


def embroidery_crosses(S, col="#b8322c", col2="#e2c23a"):
    """Khevsur-style embroidered tunic: crosses and bands on the chest and hem."""
    def f(u, v, w, h, s):
        if s != "front":
            if s in ("back", "left", "right") and v in (10, 11):
                return mul(hexc(col), 0.9)
            return None
        if v in (10, 11):
            return hexc(col) if (u + v) % 2 else hexc(col2)
        if (u, v) in ((1, 2), (0, 3), (1, 3), (2, 3), (1, 4), (6, 2), (5, 3), (6, 3), (7, 3), (6, 4)):
            return hexc(col)
        if v == 0:
            return hexc(col2)
        return None
    S.paint("body", ["front", "back", "left", "right"], f, "over")


def armbands(S, gold="#d0b050", gem="#3aa080"):
    for p in ("rarm", "larm"):
        def f(u, v, w, h, s):
            if s in ("top", "bottom"):
                return None
            if v in (2, 3):
                return hexc(gem) if (u == 1 and v == 2) else hexc(gold)
            return None
        S.paint(p, "all", f, "over")


def wide_sash(S, a="#c0492e", b="#e2a23a", row=6):
    def f(u, v, w, h, s):
        if s in ("top", "bottom") or not (row <= v <= row + 2):
            return None
        return hexc(a) if (u + v) % 3 else hexc(b)
    S.paint("body", "all", f, "over")


# ------------------------------------------------------------------ accessory textures (tall hats)
def acc_box(img, ox, oy, w, h, d, fn):
    for s in SIDES:
        x0, y0, fw, fh = face_rect(ox, oy, w, h, d, s)
        for v in range(fh):
            for u in range(fw):
                c = fn(u, v, fw, fh, s)
                if c is not None:
                    img[y0 + v, x0 + u] = c


# ------------------------------------------------------------------ characters
SKIN_TONES = ["#d9a77f", "#c9946c", "#e2b48c", "#b9845e"]


def erekle(seed=1):
    S = Skin(seed)
    coat = "#26302a"
    head_base(S, "#d8a47e", "#cfcac2", eyes="#4a3626", age=1.0, beard="full", beard_col="#d6d2ca", brow="#bcb6ac")
    torso(S, coat, 0.05)
    sleeves(S, coat, cuff="#c9a54a", k=0.05, length=9)
    hands(S, "rarm", "#d8a47e"); hands(S, "larm", "#d8a47e")
    legs(S, "#22201e", "#3a2a1e", boot_h=5)
    skirt(S, coat, rows=7, trim="#c9a54a")
    gold_braid(S, coat)
    sash_diagonal(S)
    ermine(S)
    belt(S, "#2a1e16", "#d8c070", row=7)
    # tall wrapped dark hat with gold bands (accessory 9x6x9 px)
    acc = np.zeros((32, 64, 4), np.uint8)
    def hat(u, v, w, h, s):                   # dark wrapped headdress with gold-embroidered bands (portrait)
        if s in ("top", "bottom"):
            return mul(hexc("#2a2622"), 1.15 if (u + v) % 3 == 0 else 1.0)
        if v in (1, 4):
            return hexc("#d4b45a") if (u + v) % 3 else hexc("#a88a3a")
        return mul(hexc("#2e2a25"), 1.12 if (u - v) % 3 == 0 else 0.92)   # diagonal folds of the wrap
    acc_box(acc, 0, 0, 9, 6, 9, hat)
    return S, acc, {"hat": {"size": [9, 6, 9], "uv": [0, 0], "offset": [0, 7.5, 0]}}


def aragveli(seed, variant):
    S = Skin(seed)
    r = random.Random(seed)
    tone = SKIN_TONES[seed % 4]
    hair = r.choice(["#2a1e16", "#3a2a1e", "#1e1814", "#4a3424"])
    head_base(S, tone, hair, eyes=r.choice(["#3a2a1e", "#4a5a3a", "#2a3a4a"]), beard=r.choice(["full", "short"]), beard_col=hair)
    if variant == "mail":                     # mail hauberk over an embroidered woollen tunic, felt cap
        torso(S, "#3a2c3a", 0.08)
        sleeves(S, "#3a2c3a", k=0.08)
        legs(S, "#2a2420", "#3a2a1e", boot_h=4)
        mail(S, "body", range(0, 12)); mail(S, "rarm", range(0, 8)); mail(S, "larm", range(0, 8))
        skirt(S, "#7d8085", rows=5, slit=False)
        mail(S, "rleg", range(0, 5)); mail(S, "lleg", range(0, 5))
        embroidery_crosses(S)
        felt_cap(S)
        belt(S, "#3a2618", "#b8b4ac", row=7)
    elif variant == "chokha":                 # dark chokha with cartridge holders, sheepskin papakha
        col = r.choice(["#3a302a", "#4a3428", "#33343e"])
        torso(S, col); sleeves(S, col, cuff=None)
        legs(S, "#1e1c1a", "#2e2018", boot_h=5)
        chokha_front(S, col)
        skirt(S, col, rows=7)
        gazyri(S)
        papakha(S, r.choice(["#2a2420", "#3a3028", "#1c1a18"]))
        belt(S)
    else:                                     # older highlander with felt cloak (burka) and cap
        torso(S, "#4a3a2a"); sleeves(S, "#4a3a2a")
        legs(S, "#2a2420", "#3a2a1e", boot_h=4)
        skirt(S, "#4a3a2a", rows=6)
        burka = "#1c1a18"
        S.paint("body", ["back", "left", "right", "top"], lambda u, v, w, h, s: mul(hexc(burka), 1.0 + (S.r.random() - 0.5) * 0.2), "over")
        S.paint("body", ["front"], lambda u, v, w, h, s: mul(hexc(burka), 1.05) if u in (0, 7) else None, "over")
        for p in ("rarm", "larm"):
            S.paint(p, "all", lambda u, v, w, h, s: mul(hexc(burka), 1.0 + (S.r.random() - 0.5) * 0.2) if s != "bottom" and v < 7 else None, "over")
        felt_cap(S, "#6a6052", "#3a2a22")
        belt(S)
    return S, None, {}


def georgian_soldier(seed, col):
    S = Skin(seed)
    tone = SKIN_TONES[seed % 4]
    head_base(S, tone, "#2a1e16", beard="short", beard_col="#2a1e16")
    torso(S, col); sleeves(S, col)
    legs(S, "#1e1c1a", "#2e2018", boot_h=5)
    chokha_front(S, col)
    skirt(S, col, rows=7)
    gazyri(S)
    papakha(S, "#2a2420")
    belt(S)
    return S, None, {}


def imeretian(seed):
    S = Skin(seed)
    head_base(S, SKIN_TONES[(seed + 1) % 4], "#3a2a1e", beard=None, moustache=True)
    col = "#5a4a3a"
    torso(S, col); sleeves(S, col)
    legs(S, "#2a2622", "#3a2a1e", boot_h=4)
    chokha_front(S, col, inner="#d8cdb8")
    skirt(S, col, rows=6)
    belt(S, "#3a2618")
    # small round cloth cap (papanaki) on the crown — stylised
    S.paint("head", ["top"], lambda u, v, w, h, s: hexc("#3a3a44") if 1 <= u <= 6 and 1 <= v <= 6 else None, "over")
    S.paint("head", ["front", "back", "left", "right"], lambda u, v, w, h, s: hexc("#4a4a56") if v == 0 and 1 <= u <= w - 2 else None, "over")
    S.paint("head", "all", lambda u, v, w, h, s: (tex(S.r, "#3a2a1e", 0.1) if s == "front" and v == 5 and u in (1, 2, 5, 6) else None), "over")
    return S, None, {}


def qajar_infantry(seed):
    S = Skin(seed)
    r = random.Random(seed)
    tone = SKIN_TONES[(seed + 2) % 4]
    head_base(S, tone, "#1e1814", beard="full", beard_col="#1e1814")
    col = r.choice(["#2f4a7a", "#3a5a3a", "#6a3a2a", "#4a4a6a"])
    torso(S, col); sleeves(S, col, cuff="#c8b890")
    legs(S, "#c8bca0", "#3a2a1e", boot_h=4)     # light baggy trousers, short boots
    skirt(S, col, rows=8, slit=True)
    wide_sash(S, "#b8a070", "#8a6a3a", row=6)
    # felt conical cap (kolah namadi) as accessory
    acc = np.zeros((32, 64, 4), np.uint8)
    acc_box(acc, 0, 0, 7, 5, 7, lambda u, v, w, h, s: mul(hexc("#3a3028"), 1.1 if (u + v) % 3 == 0 else 0.95))
    return S, acc, {"hat": {"size": [7, 5, 7], "uv": [0, 0], "offset": [0, 6.5, 0]}}


def qajar_cavalry(seed):
    S = Skin(seed)
    tone = SKIN_TONES[(seed + 3) % 4]
    head_base(S, tone, "#1e1814", beard="full", beard_col="#1e1814")
    col = "#6a2a2a"
    torso(S, col); sleeves(S, col)
    legs(S, "#3a3a44", "#2a1e16", boot_h=6)
    mail(S, "body", range(0, 12), base="#8a8d92"); mail(S, "rarm", range(0, 9), base="#8a8d92"); mail(S, "larm", range(0, 9), base="#8a8d92")
    skirt(S, "#8a8d92", rows=5, slit=True)
    wide_sash(S, "#2a5a4a", "#c9a54a", row=7)
    helmet_mail(S)
    # helmet spike (accessory)
    acc = np.zeros((32, 64, 4), np.uint8)
    acc_box(acc, 0, 0, 2, 4, 2, lambda u, v, w, h, s: hexc("#b8bcc2"))
    return S, acc, {"hat": {"size": [2, 4, 2], "uv": [0, 0], "offset": [0, 6, 0]}}


def agha_mohammad(seed=7):
    """After the contemporary portrait dated 1795: tall striped headdress with a jewelled ornament,
    long hair at the sides, beardless face, lavender-blue robe, jewelled armbands, patterned sash, dagger."""
    S = Skin(seed)
    head_base(S, "#d6b08e", "#1c1816", eyes="#2a2018", age=0.8, beard=None, moustache=False, hair_long=True, brow="#2a2420")
    robe = "#8a86b8"
    torso(S, robe, 0.06); sleeves(S, robe, k=0.06)
    legs(S, "#7a76a6", "#3a2a2a", boot_h=3)
    skirt(S, robe, rows=10, slit=True, trim="#c9a54a")
    S.paint("body", ["front"], lambda u, v, w, h, s: hexc("#c9a54a") if u in (3, 4) and v >= 2 else None, "over")   # gold edging
    armbands(S)
    wide_sash(S, "#c05a3a", "#e2b04a", row=7)
    belt(S, "#8a3a2a", "#e2c060", row=6, dagger=True)
    acc = np.zeros((32, 64, 4), np.uint8)

    def hat(u, v, w, h, s):
        if s == "top":
            return hexc("#b03a3a")
        if s == "bottom":
            return hexc("#2a3a7a")
        if s == "front" and v in (3, 4) and u in (3, 4, 5):
            return hexc("#e2c060") if u != 4 else hexc("#3aa080")                     # jewelled ornament
        if v == h - 1:
            return hexc("#c9a54a")                                                     # gold rim
        if (u + v) % 4 == 0:
            return hexc("#d8b856")                                                     # diagonal gold bands
        return mul(hexc("#23367a"), 1.08 if (u * 3 + v) % 5 == 0 else 1.0)
    acc_box(acc, 0, 0, 9, 8, 9, hat)
    return S, acc, {"hat": {"size": [9, 8, 9], "uv": [0, 0], "offset": [0, 8.5, 0]}}


def bodyguard(seed):
    S = Skin(seed)
    head_base(S, SKIN_TONES[seed % 4], "#2a1e16", beard="full", beard_col="#2a1e16")
    col = "#5a1e22"
    torso(S, col); sleeves(S, col)
    legs(S, "#1e1c1a", "#2e2018", boot_h=5)
    mail(S, "body", range(0, 7), base="#8a8d92")
    chokha_front(S, col)
    skirt(S, col, rows=7)
    helmet_mail(S, steel="#a8acb2")
    belt(S, "#2a1e16", "#d8c070")
    return S, None, {}


CHARACTERS = [
    ("erekle_ii", "King Erekle II (aged 75)", erekle, {}, "portrait, mid–late 18th c. (Commons, PD); grey beard for his age — stylisation"),
    ("aragveli_mail", "Aragvian highlander — mail", aragveli, {"seed": 11, "variant": "mail"}, "highland mail hauberk + embroidered tunic (ethnographic, 19th c. records) — Б"),
    ("aragveli_chokha", "Aragvian highlander — chokha", aragveli, {"seed": 12, "variant": "chokha"}, "chokha with gazyri, papakha (Pshavi, Mtiuleti) — А/Б"),
    ("aragveli_elder", "Aragvian elder — burka", aragveli, {"seed": 13, "variant": "elder"}, "felt cloak (burka), felt cap — Б"),
    ("georgian_soldier", "Kartli-Kakheti soldier", georgian_soldier, {"seed": 21, "col": "#3a2430"}, "Kartli-Kakheti chokha: black, dark red or blue — А"),
    ("imeretian_soldier", "Imeretian soldier", imeretian, {"seed": 31}, "Imeretian dress, small cap — stylisation"),
    ("royal_guard", "King's bodyguard", bodyguard, {"seed": 41}, "mail under chokha, helmet with aventail — Б"),
    ("qajar_infantry", "Qajar army infantryman", qajar_infantry, {"seed": 51}, "long coat, sash, felt cap (kolah namadi, 1845 depiction) — Б"),
    ("qajar_cavalry", "Qajar army horseman", qajar_cavalry, {"seed": 61}, "mail, helmet with aventail, sash — Б (cavalry was the core of the army — А)"),
    ("agha_mohammad_khan", "Agha Mohammad Khan", agha_mohammad, {}, "contemporary portrait dated 1795 (Commons, PD) — А"),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    meta = []
    for cid, name, fn, kw, note in CHARACTERS:
        S, acc, extra = fn(**kw)
        S.save(os.path.join(OUT, cid + ".png"))
        if acc is not None:
            Image.fromarray(acc, "RGBA").save(os.path.join(OUT, cid + "_acc.png"))
        meta.append({"id": cid, "name": name, "basis": note, "acc": extra})
        print(cid)
    json.dump(meta, open(os.path.join(OUT, "skins.json"), "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
