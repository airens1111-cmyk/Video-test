// Terrain as instanced face quads: quadtree LOD tiles (5 m .. 80 m columns), only visible faces emitted.
import * as THREE from "three";
import { BLOCK, TerrainData } from "./data";
import { distToPolyline, ISANI, KALA, P2, pointInPoly, ROADS } from "./locations";

export const T_DRY = 0, T_PASTURE = 1, T_FARM = 2, T_VINE = 4, T_ORCHARD = 5, T_FOREST = 6, T_ROCK = 7, T_BANK = 8,
  T_ROAD = 9, T_CITY = 10, T_RIVERBED = 11, T_SNOW = 12, T_ALPINE = 13, T_SCREE = 14;

const vnoise = (x: number, z: number) => {
  const h = (i: number, j: number) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return (h(xi, zi) * (1 - u) + h(xi + 1, zi) * u) * (1 - v) + (h(xi, zi + 1) * (1 - u) + h(xi + 1, zi + 1) * u) * v;
};

/** Land use per point (18th-century reading of the real relief; rules are a stylisation). */
export function landUse(d: TerrainData, x: number, z: number): number {
  if (d.isWater(x, z)) return T_RIVERBED;
  const region = d.meta.name;
  const dr = d.riverDist(x, z);
  const s = d.slope(x, z, 8);
  if (region === "aragvi") {
    const y = d.surface(x, z) / 1.5 + d.meta.base_elev_m;
    if (dr < 14) return T_BANK;
    if (s > 1.25) return T_ROCK;
    if (y > 1850) return s > 0.8 ? T_SCREE : T_ALPINE;
    if (dr < 260 && s < 0.25) return vnoise(x / 60, z / 60) > 0.45 ? T_FARM : T_PASTURE;
    if (s > 0.45 || vnoise(x / 220, z / 220) > 0.42) return T_FOREST;
    return T_ALPINE;
  }
  if (dr < 22) return T_BANK;
  for (const r of ROADS) if (distToPolyline(x, z, r) < 3.5) return T_ROAD;
  if (pointInPoly(x, z, KALA) || pointInPoly(x, z, ISANI)) return T_CITY;
  if (s > 0.95) return T_ROCK;
  const n = vnoise(x / 180, z / 180);
  if (s > 0.6) return n > 0.55 ? T_FOREST : T_ROCK;
  if (dr < 420 && s < 0.18) return n > 0.35 ? T_ORCHARD : T_FARM;
  const gz = d.surface(x, z + 8) - d.surface(x, z - 8);           // >0: slope rises to the south, faces north
  if (s > 0.12 && s < 0.5 && gz < -2 && n > 0.3) return T_VINE;    // south-facing slopes
  if (s < 0.14) return n > 0.62 ? T_DRY : T_FARM;
  if (s < 0.6 && vnoise(x / 90 + 7, z / 90) > 0.72) return T_FOREST;
  return n > 0.5 ? T_PASTURE : T_DRY;
}

export const TILE_CELLS = 32;
export const MAX_LEVEL = 4;

export interface TileGeom { key: string; count: number; matrices: Float32Array; types: Float32Array; tops: Float32Array; water: { count: number; matrices: Float32Array }; center: THREE.Vector3; radius: number }

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const UP = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const SIDES = [
  { dx: 1, dz: 0, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)) },
  { dx: -1, dz: 0, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)) },
  { dx: 0, dz: 1, q: new THREE.Quaternion() },
  { dx: 0, dz: -1, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)) },
];

const cache = new Map<string, TileGeom>();

/** Builds one tile: level L has columns of size BLOCK*2^L, TILE_CELLS^2 columns. ox, oz = tile min corner. */
export function buildTile(d: TerrainData, L: number, ox: number, oz: number): TileGeom {
  const key = `${d.meta.name}:${L}:${ox}:${oz}`;
  const hit = cache.get(key); if (hit) return hit;
  const c = BLOCK * 2 ** L, N = TILE_CELLS;
  const H = new Float32Array((N + 2) * (N + 2));
  const top = (i: number, j: number) => H[(i + 1) * (N + 2) + (j + 1)];
  for (let i = -1; i <= N; i++) for (let j = -1; j <= N; j++) {
    const x = ox + (j + 0.5) * c, z = oz + (i + 0.5) * c;
    H[(i + 1) * (N + 2) + (j + 1)] = Math.floor(d.surface(x, z) / BLOCK) * BLOCK;
  }
  const mats: number[] = [], types: number[] = [], tops: number[] = [], wm: number[] = [];
  const push = (pos: THREE.Vector3, q: THREE.Quaternion, sx: number, sy: number, type: number, t: number) => {
    _m.compose(pos, q, _s.set(sx, sy, 1)); for (const v of _m.elements) mats.push(v); types.push(type); tops.push(t);
  };
  const skirt = L > 0 ? c * 1.5 : BLOCK * 2;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = ox + (j + 0.5) * c, z = oz + (i + 0.5) * c;
    if (!d.inside(x, z)) continue;
    const T = top(i, j);
    const type = landUse(d, x, z);
    push(_p.set(x, T, z), UP, c, c, type, T);
    for (const sd of SIDES) {
      const ni = i + sd.dz, nj = j + sd.dx;
      const border = ni < 0 || nj < 0 || ni >= N || nj >= N;
      const Tn = Math.min(top(ni, nj), border ? T - skirt : Infinity);
      if (Tn >= T) continue;
      const hgt = T - Tn;
      push(_p.set(x + sd.dx * c / 2, T - hgt / 2, z + sd.dz * c / 2), sd.q, c, hgt, type, T);
    }
    if (type === T_RIVERBED) {
      const wl = Math.round(d.waterLevel(x, z) / 0.625) * 0.625;
      _m.compose(_p.set(x, Math.max(wl, T + 0.4), z), UP, _s.set(c, c, 1)); for (const v of _m.elements) wm.push(v);
    }
  }
  const size = N * c;
  const cy = top(N >> 1, N >> 1);
  const g: TileGeom = {
    key, count: types.length, matrices: new Float32Array(mats), types: new Float32Array(types), tops: new Float32Array(tops),
    water: { count: wm.length / 16, matrices: new Float32Array(wm) },
    center: new THREE.Vector3(ox + size / 2, cy, oz + size / 2), radius: size * 0.75 + 300,
  };
  if (cache.size > 900) cache.delete(cache.keys().next().value!);
  cache.set(key, g);
  return g;
}

/** Quadtree selection from a camera position (deterministic per frame). */
export function selectTiles(d: TerrainData, cam: THREE.Vector3, opts: { k?: number; minLevel?: number } = {}) {
  const k = opts.k ?? 1.7, minLevel = opts.minLevel ?? 0;
  const out: { L: number; ox: number; oz: number }[] = [];
  const rootSize = TILE_CELLS * BLOCK * 2 ** MAX_LEVEL;
  const x0 = -d.halfW, z0 = -d.halfH;
  const nx = Math.ceil(d.meta.width / rootSize), nz = Math.ceil(d.meta.height / rootSize);
  const visit = (L: number, ox: number, oz: number) => {
    const size = TILE_CELLS * BLOCK * 2 ** L;
    if (ox > d.halfW || oz > d.halfH || ox + size < -d.halfW || oz + size < -d.halfH) return;
    const cx = Math.max(ox, Math.min(cam.x, ox + size)), cz = Math.max(oz, Math.min(cam.z, oz + size));
    const dist = Math.hypot(cam.x - cx, cam.z - cz, Math.max(0, cam.y - 150) * 0.6);
    if (L > minLevel && dist < size * k) {
      const h = size / 2;
      visit(L - 1, ox, oz); visit(L - 1, ox + h, oz); visit(L - 1, ox, oz + h); visit(L - 1, ox + h, oz + h);
    } else out.push({ L, ox, oz });
  };
  for (let a = 0; a < nz; a++) for (let b = 0; b < nx; b++) visit(MAX_LEVEL, x0 + b * rootSize, z0 + a * rootSize);
  return out;
}

export const QUAD = new THREE.PlaneGeometry(1, 1);
export type { P2 };
