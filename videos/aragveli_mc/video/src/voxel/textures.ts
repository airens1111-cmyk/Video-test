// Procedural "pixel" textures (16x16, nearest filtering). All original, generated from seeds.
import * as THREE from "three";
import { rng } from "./random";

type Painter = (px: (x: number, y: number, c: string) => void, r: () => number) => void;

const cache = new Map<string, THREE.CanvasTexture>();

export function pixelTexture(key: string, size: number, paint: Painter): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = rng(hash(key));
  paint((x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); }, r);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const grey = (v: number) => { const k = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${k},${k},${k})`; };
const rgb = (r: number, g: number, b: number) => `rgb(${r | 0},${g | 0},${b | 0})`;

/** Neutral noisy texture: tinted by instance colour. */
export const noiseTex = (key: string, lo = 0.72, hi = 1.0) =>
  pixelTexture("noise" + key, 16, (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, grey(lo + (hi - lo) * r()));
  });

export const grassTop = () => pixelTexture("grassTop", 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = 0.75 + r() * 0.25;
    px(x, y, rgb(95 * v, 140 * v, 62 * v));
  }
});
export const grassSide = () => pixelTexture("grassSide", 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = 0.75 + r() * 0.25;
    const lip = y < 3 + (r() < 0.4 ? 1 : 0);
    px(x, y, lip ? rgb(95 * v, 140 * v, 62 * v) : rgb(120 * v, 86 * v, 58 * v));
  }
});
export const dirt = () => pixelTexture("dirt", 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = 0.72 + r() * 0.28; px(x, y, rgb(120 * v, 86 * v, 58 * v)); }
});
export const stone = () => pixelTexture("stone", 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = 0.6 + r() * 0.3; px(x, y, rgb(128 * v, 128 * v, 132 * v)); }
});
export const wood = () => pixelTexture("wood", 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = 0.7 + 0.2 * Math.sin(x * 1.7 + r()) + r() * 0.1; px(x, y, rgb(110 * v, 78 * v, 46 * v)); }
});
export const leaves = () => pixelTexture("leaves", 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = 0.55 + r() * 0.45; px(x, y, r() < 0.08 ? rgb(30, 50, 25) : rgb(60 * v, 110 * v, 45 * v)); }
});

/** Face on the +z side of the head: eyes, brows, beard. Tinted by skin colour. */
export const faceTex = (beard: boolean) => pixelTexture("face" + beard, 8, (px, r) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, grey(0.92 + r() * 0.08));
  for (let x = 0; x < 8; x++) { px(x, 0, grey(0.35)); px(x, 1, grey(0.35)); }   // hair line
  px(1, 3, "#fff"); px(2, 3, grey(0.12)); px(5, 3, grey(0.12)); px(6, 3, "#fff"); // eyes
  px(1, 2, grey(0.4)); px(2, 2, grey(0.4)); px(5, 2, grey(0.4)); px(6, 2, grey(0.4)); // brows
  px(3, 4, grey(0.78)); px(4, 4, grey(0.78));                                    // nose
  if (beard) {
    for (let y = 5; y < 8; y++) for (let x = 1; x < 7; x++) px(x, y, grey(0.28 + r() * 0.08));
    for (let x = 0; x < 8; x++) if (x < 1 || x > 6) px(x, 5, grey(0.3));
    px(3, 6, grey(0.6)); px(4, 6, grey(0.6));                                    // mouth gap
  } else { px(2, 6, grey(0.5)); px(3, 6, grey(0.5)); px(4, 6, grey(0.5)); px(5, 6, grey(0.5)); }
});
export const hairTex = () => pixelTexture("hair", 8, (px, r) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, y < 4 ? grey(0.3 + r() * 0.1) : grey(0.9 + r() * 0.1));
});

/** Georgian chokha-like coat: cartridge-pocket rows (gazyri) on the chest, belt. Tinted by coat colour. */
export const chokhaTex = () => pixelTexture("chokha", 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, grey(0.78 + r() * 0.14));
  for (let y = 1; y < 8; y += 2) for (const x of [2, 3, 4, 11, 12, 13]) px(x, y, grey(0.42));
  for (let y = 0; y < 16; y++) { px(7, y, grey(0.55)); px(8, y, grey(0.55)); }
  for (let x = 0; x < 16; x++) { px(x, 10, grey(0.2)); px(x, 11, grey(0.25)); }
  px(7, 10, "#d8b048"); px(8, 10, "#d8b048"); px(7, 11, "#d8b048"); px(8, 11, "#d8b048");
});
/** Qajar-army coat: long tunic, wide sash. */
export const tunicTex = () => pixelTexture("tunic", 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, grey(0.8 + r() * 0.14));
  for (let x = 0; x < 16; x++) for (const y of [9, 10, 11]) px(x, y, rgb(230, 205, 130));
  for (let y = 0; y < 9; y++) { px(10, y, grey(0.6)); }
  for (let x = 0; x < 16; x++) px(x, 15, grey(0.55));
});
export const metalTex = () => pixelTexture("metal", 8, (px, r) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, grey(0.65 + r() * 0.3));
  px(1, 1, "#fff"); px(2, 1, "#fff");
});
export const shieldTex = (side: "geo" | "qaj") => pixelTexture("shield" + side, 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    let v = 0.75 + r() * 0.1;
    if (d > 6.6) v = 0.45;                         // rim
    if (d < 1.6) v = 1.0;                          // boss
    px(x, y, grey(v));
  }
  if (side === "geo") for (let i = 4; i < 12; i++) { px(i, 7, grey(0.35)); px(i, 8, grey(0.35)); px(7, i, grey(0.35)); px(8, i, grey(0.35)); }
  else for (let a = 0; a < 16; a++) { const x = Math.round(7.5 + 4.2 * Math.cos(a / 16 * 6.283)); const y = Math.round(7.5 + 4.2 * Math.sin(a / 16 * 6.283)); px(x, y, grey(0.4)); }
});
export const horseTex = () => pixelTexture("horse", 16, (px, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, grey(0.8 + r() * 0.15));
});

/** Banners: Georgian = deep red field with a gold cross; Qajar army = green field with gold border. */
export const bannerTex = (side: "geo" | "qaj") => pixelTexture("banner" + side, 32, (px, r) => {
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const n = 0.9 + r() * 0.1;
    if (side === "geo") {
      const cross = (x >= 13 && x <= 18) || (y >= 13 && y <= 18);
      px(x, y, cross ? rgb(225 * n, 180 * n, 70 * n) : rgb(150 * n, 22 * n, 28 * n));
    } else {
      const border = x < 3 || y < 3 || x > 28 || y > 28;
      px(x, y, border ? rgb(225 * n, 185 * n, 80 * n) : rgb(30 * n, 105 * n, 60 * n));
    }
  }
});
