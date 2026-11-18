// Hand-tuned procedural 16x16 pixel-art block textures packed in one atlas (original art, no game assets).
import * as THREE from "three";

export const TILE = 16;
export const TILES = [
  "grassTop", "grassSide", "dirt", "coarseDirt", "path", "stone", "gravel", "logSide", "logTop", "leaves",
  "tallGrass", "flowerRed", "flowerYellow", "stubble", "clay", "planks", "cobble", "plaster", "roofTile", "fern",
] as const;
export type TileName = (typeof TILES)[number];
const COLS = 8;
const ROWS = Math.ceil(TILES.length / COLS);

function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const pick = (pal: RGB[], v: number) => pal[Math.max(0, Math.min(pal.length - 1, Math.floor(v * pal.length)))];

type Px = (x: number, y: number, c: RGB | null) => void;
const PAINT: Record<TileName, (px: Px, r: () => number) => void> = {
  grassTop: (px, r) => {                                   // dry September grass, gold with olive
    const pal = ["#7f8a3a", "#93983f", "#a9a24a", "#bba95a", "#8c9440", "#6f7f34"].map(hex);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(pal, (r() + r()) / 2));
    for (let k = 0; k < 10; k++) px(Math.floor(r() * 16), Math.floor(r() * 16), hex("#d6c46e"));
  },
  grassSide: (px, r) => {
    const dirt = ["#6e4c33", "#7d583b", "#8a6444", "#5f412c"].map(hex), grass = ["#9c9a44", "#b5a64a", "#a39a42", "#8f8a3a"].map(hex);
    for (let x = 0; x < 16; x++) {
      const lip = 3 + (r() < 0.45 ? 1 : 0) + (r() < 0.2 ? 1 : 0);
      for (let y = 0; y < 16; y++) px(x, y, y < lip ? pick(grass, r()) : pick(dirt, r()));
    }
  },
  dirt: (px, r) => { const p = ["#6e4c33", "#7d583b", "#8a6444", "#5f412c", "#93704f"].map(hex); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(p, r())); },
  coarseDirt: (px, r) => { const p = ["#6e4c33", "#5a4030", "#8a6444", "#7a7066", "#93704f"].map(hex); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(p, r())); },
  path: (px, r) => {
    const p = ["#9a7e55", "#a88a5e", "#8c7149", "#b39668"].map(hex);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(p, (r() + r()) / 2));
    for (let k = 0; k < 6; k++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 15); px(x, y, hex("#77634a")); px(x + 1, y, hex("#77634a")); }
  },
  stone: (px, r) => {
    const p = ["#7a7a7a", "#858585", "#6e6e6e", "#919191"].map(hex);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(p, (r() + r() + r()) / 3));
    for (let k = 0; k < 5; k++) { let x = Math.floor(r() * 16), y = Math.floor(r() * 16); for (let s = 0; s < 4; s++) { px(x, y, hex("#5e5e5e")); x = (x + 1) % 16; if (r() < 0.4) y = (y + 1) % 16; } }
  },
  gravel: (px, r) => { const p = ["#8d8680", "#a39b93", "#6f6965", "#b8b0a6", "#7e776f"].map(hex); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(p, r())); },
  logSide: (px, r) => {
    const p = ["#3d342a", "#4a3f32", "#56493a", "#332b22"].map(hex);
    for (let x = 0; x < 16; x++) { const base = r(); for (let y = 0; y < 16; y++) px(x, y, pick(p, base * 0.7 + r() * 0.3)); }
    for (let k = 0; k < 4; k++) px(Math.floor(r() * 16), Math.floor(r() * 16), hex("#2e2216"));
  },
  logTop: (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      px(x, y, d > 6.5 ? hex("#4e3a24") : Math.floor(d) % 2 ? hex("#a3834f") : hex("#8f7044"));
    }
  },
  leaves: (px, r) => {                                     // late-summer greens with yellowing, holes = alpha
    const p = ["#3f5a22", "#4c6b28", "#587a2e", "#36501d", "#6d8434", "#8c8a33"].map(hex);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, r() < 0.14 ? null : pick(p, r() * r() * 1.2 + r() * 0.2));
  },
  tallGrass: (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, null);
    const p = ["#a39a42", "#b5a64a", "#c9b860", "#8f8a3a", "#d6c46e"].map(hex);
    for (let b = 0; b < 7; b++) {
      let x = 1 + Math.floor(r() * 14); const h = 6 + Math.floor(r() * 9); const c = pick(p, r());
      for (let y = 15; y > 15 - h; y--) { px(x, y, c); if (r() < 0.18) x = Math.max(0, Math.min(15, x + (r() < 0.5 ? -1 : 1))); }
    }
  },
  flowerRed: (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, null);
    for (let y = 8; y < 16; y++) px(7, y, hex("#4c6b28")); px(6, 11, hex("#4c6b28")); px(8, 12, hex("#4c6b28"));
    for (const [x, y] of [[6, 6], [7, 5], [8, 6], [7, 7], [6, 7], [8, 7]]) px(x, y, hex("#b8322c")); px(7, 6, hex("#3a1a10"));
  },
  flowerYellow: (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, null);
    for (let y = 9; y < 16; y++) px(8, y, hex("#587a2e")); px(9, 12, hex("#587a2e"));
    for (const [x, y] of [[7, 7], [8, 6], [9, 7], [8, 8], [7, 8], [9, 8]]) px(x, y, hex("#e2c23a")); px(8, 7, hex("#a8661c"));
  },
  stubble: (px, r) => {                                    // harvested wheat field: rows of pale stalks on earth
    const soil = ["#7d6040", "#8a6c48", "#6e5236"].map(hex), st = ["#d8c27a", "#c8b06a", "#e2d08c"].map(hex);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, (x % 4 === 1 || x % 4 === 2) && r() < 0.75 ? pick(st, r()) : pick(soil, r()));
  },
  clay: (px, r) => { const p = ["#a4705a", "#b37d63", "#99674f", "#c08a70"].map(hex); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(p, (r() + (y % 5) / 5) / 2)); },
  planks: (px, r) => {
    const p = ["#8a6438", "#9a7142", "#7b5830", "#a57b4a"].map(hex);
    for (let y = 0; y < 16; y++) { const row = Math.floor(y / 4); for (let x = 0; x < 16; x++) px(x, y, y % 4 === 3 || (x === (row % 2 ? 4 : 11)) ? hex("#5b3f22") : pick(p, r() * 0.5 + row * 0.12)); }
  },
  cobble: (px, r) => {
    const p = ["#7a7a7a", "#8e8e8e", "#686868", "#a0a0a0"].map(hex);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const cx = Math.floor((x + (Math.floor(y / 4) % 2) * 2) / 4), cy = Math.floor(y / 4);
      const edge = (x + (Math.floor(y / 4) % 2) * 2) % 4 === 0 || y % 4 === 0;
      px(x, y, edge ? hex("#4a4a4a") : pick(p, ((cx * 7 + cy * 13) % 10) / 10 * 0.6 + r() * 0.4));
    }
  },
  plaster: (px, r) => { const p = ["#d9cdb4", "#cfc2a6", "#e3d8c0", "#c6b89c"].map(hex); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(p, (r() + r()) / 2)); },
  roofTile: (px, r) => {
    const p = ["#9a4a32", "#a8553a", "#8a412c", "#b5603f"].map(hex);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, y % 4 === 3 ? hex("#5e2a1c") : pick(p, r() * 0.6 + (x % 4) / 8));
  },
  fern: (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, null);
    const c = ["#4c6b28", "#587a2e", "#6d8434"].map(hex);
    for (let y = 4; y < 16; y++) { px(7, y, c[1]); px(8, y, c[0]); if (y % 2 === 0) { const w = Math.floor((16 - y) / 3) + 1; for (let k = 1; k <= w; k++) { px(7 - k, y + (k > 2 ? 1 : 0), c[2]); px(8 + k, y + (k > 2 ? 1 : 0), c[2]); } } }
  },
};

let atlas: THREE.CanvasTexture | null = null;
export function getAtlas() {
  if (atlas) return atlas;
  const c = document.createElement("canvas");
  c.width = COLS * TILE; c.height = ROWS * TILE;
  const g = c.getContext("2d")!;
  TILES.forEach((name, i) => {
    const ox = (i % COLS) * TILE, oy = Math.floor(i / COLS) * TILE;
    const r = rng(1795 + i * 977);
    PAINT[name]((x, y, col) => {
      if (!col) { g.clearRect(ox + x, oy + y, 1, 1); return; }
      g.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; g.fillRect(ox + x, oy + y, 1, 1);
    }, r);
  });
  atlas = new THREE.CanvasTexture(c);
  atlas.magFilter = THREE.NearestFilter; atlas.minFilter = THREE.NearestMipmapNearestFilter;
  atlas.generateMipmaps = true; atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 4;
  return atlas;
}

/** UV rect of a tile (with a half-texel inset against bleeding). */
export function uvRect(name: TileName) {
  const i = TILES.indexOf(name);
  const W = COLS * TILE, H = ROWS * TILE, e = 0.02;
  const u0 = ((i % COLS) * TILE + e) / W, u1 = ((i % COLS) * TILE + TILE - e) / W;
  const v1 = 1 - (Math.floor(i / COLS) * TILE + e) / H, v0 = 1 - (Math.floor(i / COLS) * TILE + TILE - e) / H;
  return [u0, v0, u1, v1] as const;
}
