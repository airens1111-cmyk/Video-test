// "Film set" terrain at 1 m blocks around the action: real relief (SRTM, x1.5) + micro detail,
// meshed into chunk geometry with per-vertex ambient occlusion (only exposed faces).
import * as THREE from "three";
import { TerrainData } from "../world/data";
import { distToPolyline, ROADS } from "../world/locations";
import { TileName, uvRect } from "./atlas";

export const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, PATH = 4, COARSE = 5, STUBBLE = 6, GRAVEL = 7, CLAY = 8, LOG = 9, LEAVES = 10, COBBLE = 11;

const hash = (a: number, b: number, c = 0) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x: number, z: number, seed = 0) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return (hash(xi, zi, seed) * (1 - u) + hash(xi + 1, zi, seed) * u) * (1 - v) + (hash(xi, zi + 1, seed) * (1 - u) + hash(xi + 1, zi + 1, seed) * u) * v;
}

export interface SetSpec { cx: number; cz: number; size: number; seed?: number; hero?: [number, number][]; clear?: [number, number, number][] }

export class VoxelSet {
  x0: number; z0: number; S: number; baseY: number;
  H: Int16Array; top: Uint8Array;                 // column height (blocks) and top block type
  sparse = new Map<number, number>();            // trees etc: key -> type
  sprites: { x: number; y: number; z: number; tile: TileName; s: number }[] = [];
  constructor(public d: TerrainData, public spec: SetSpec) {
    const S = (this.S = spec.size);
    this.x0 = Math.round(spec.cx - S / 2); this.z0 = Math.round(spec.cz - S / 2);
    this.baseY = Math.floor(d.surface(spec.cx, spec.cz)) - 40;
    this.H = new Int16Array(S * S); this.top = new Uint8Array(S * S);
    this.build();
  }
  key(x: number, y: number, z: number) { return ((y + 64) * 4096 + (z + 64)) * 4096 + (x + 64); }
  idx(x: number, z: number) { return z * this.S + x; }
  h(x: number, z: number) { x = Math.max(0, Math.min(this.S - 1, x)); z = Math.max(0, Math.min(this.S - 1, z)); return this.H[this.idx(x, z)]; }
  solid(x: number, y: number, z: number) {
    if (y < this.h(x, z)) return true;
    return this.sparse.has(this.key(x, y, z));
  }
  /** World y (m) of the ground top at world x,z (for cameras). */
  groundY(wx: number, wz: number) { return this.baseY + this.h(Math.floor(wx - this.x0), Math.floor(wz - this.z0)); }

  private build() {
    const { S, d, x0, z0 } = this;
    for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) {
      const wx = x0 + x + 0.5, wz = z0 + z + 0.5;
      const micro = (vnoise(wx / 38, wz / 38, 1) - 0.5) * 3.2 + (vnoise(wx / 17, wz / 17, 2) - 0.5) * 1.0;
      this.H[this.idx(x, z)] = Math.round(d.surface(wx, wz) - this.baseY + micro);
    }
    const Hm = new Int16Array(this.H);                       // 3x3 median: no lone 1-block bumps or pits
    for (let z = 1; z < S - 1; z++) for (let x = 1; x < S - 1; x++) {
      const v: number[] = [];
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) v.push(this.H[this.idx(x + dx, z + dz)]);
      v.sort((a, b) => a - b); Hm[this.idx(x, z)] = v[4];
    }
    this.H = Hm;
    for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) {
      const wx = x0 + x + 0.5, wz = z0 + z + 0.5, h = this.h(x, z);
      const steep = Math.max(Math.abs(h - this.h(x + 1, z)), Math.abs(h - this.h(x - 1, z)), Math.abs(h - this.h(x, z + 1)), Math.abs(h - this.h(x, z - 1)));
      let t = GRASS;
      let road = Infinity; for (const r of ROADS) road = Math.min(road, distToPolyline(wx, wz, r));
      const pid = [Math.floor(wx / 46), Math.floor(wz / 64)];
      const parcel = hash(pid[0], pid[1], 5);
      if (road < 1.6) t = PATH;
      else if (road < 2.6) t = hash(x, z, 3) < 0.5 ? COARSE : GRASS;
      else if (steep >= 3) t = hash(x, z, 4) < 0.6 ? CLAY : STONE;
      else if (steep === 2 && hash(x, z, 6) < 0.35) t = COARSE;
      else if (parcel < 0.42 && vnoise(wx / 90, wz / 90, 9) > 0.35) t = STUBBLE;
      else if (vnoise(wx / 9, wz / 9, 31) > 0.86 && hash(x, z, 34) < 0.7) t = COARSE;                       // worn, trampled patches
      else if (hash(x, z, 7) < 0.02) t = GRAVEL;
      this.top[this.idx(x, z)] = t;
      // sprites on grass
      if (t === GRASS) {
        const r = hash(x, z, 8);
        if (r < 0.06 + 0.16 * vnoise((x0 + x) / 15, (z0 + z) / 15, 21)) this.sprites.push({ x: x + 0.5, y: h, z: z + 0.5, tile: "tallGrass", s: 0.5 + hash(x, z, 9) * 0.45 });
        else if (r > 0.985) this.sprites.push({ x: x + 0.5, y: h, z: z + 0.5, tile: hash(x, z, 10) < 0.5 ? "flowerRed" : "flowerYellow", s: 0.8 });
      }
    }
    // vegetation: oak groves, lone big oaks, poplar lines along the road, bushes, boulders
    const clear = (wx: number, wz: number, extra = 0) => (this.spec.clear ?? []).some(([cx, cz, r]) => Math.hypot(wx - cx, wz - cz) < r + extra);
    for (let z = 6; z < S - 6; z += 5) for (let x = 6; x < S - 6; x += 5) {
      const jx = x + Math.floor(hash(x, z, 11) * 5) - 2, jz = z + Math.floor(hash(x, z, 12) * 5) - 2;
      const wx = x0 + jx, wz = z0 + jz;
      const t = this.top[this.idx(jx, jz)];
      if (t !== GRASS && t !== COARSE) continue;
      const g = vnoise(wx / 90, wz / 90, 13), r = hash(jx, jz, 14);
      let road = Infinity; for (const rd of ROADS) road = Math.min(road, distToPolyline(wx, wz, rd));
      if (road > 4 && road < 7 && r < 0.55 && !clear(wx, wz)) { this.poplar(jx, jz); continue; }
      if (clear(wx, wz)) continue;
      if (g > 0.72 && r < 0.6) this.oak(jx, jz, 6 + Math.floor(hash(jx, jz, 15) * 4), 1);
      else if (g > 0.6 && r < 0.12) this.oak(jx, jz, 6 + Math.floor(hash(jx, jz, 15) * 3), 1);
      else if (r < 0.01) this.oak(jx, jz, 8, 1.2);
      else if (r > 0.96) this.bush(jx, jz);
      else if (r > 0.94 && r <= 0.96) this.boulder(jx, jz);
    }
    for (const [hx, hz] of this.spec.hero ?? []) this.oak(Math.round(hx - x0), Math.round(hz - z0), 10, 1.6, true);
  }

  private set(x: number, y: number, z: number, t: number, overwrite = false) { const k = this.key(x, y, z); if (overwrite || !this.sparse.has(k)) this.sparse.set(k, t); }
  private blob(cx: number, cy: number, cz: number, R: number, Ry = R * 0.7, seed = 0) {
    const r = Math.ceil(R) + 1;
    for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const e = (dx * dx + dz * dz) / (R * R) + (dy * dy) / (Ry * Ry);
      if (e + hash(cx + dx * 3.1, cz + dz * 1.7, cy + dy + seed) * 0.6 < 1.15) this.set(Math.round(cx + dx), Math.round(cy + dy), Math.round(cz + dz), LEAVES);
    }
  }
  oak(x: number, z: number, trunk: number, scale: number, hero = false) {
    if (x < 8 || z < 8 || x > this.S - 9 || z > this.S - 9) return;
    const y0 = this.h(x, z);
    const thick = hero ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
    for (let y = -1; y < trunk; y++) for (const [dx, dz] of thick) this.set(x + dx, y0 + y, z + dz, LOG, true);
    // branches reaching out and up, each carrying a leaf cloud
    const nb = hero ? 5 : 3 + Math.floor(hash(x, z, 60) * 2);
    for (let b = 0; b < nb; b++) {
      const a = (b / nb) * Math.PI * 2 + hash(x, z, 61 + b) * 1.2;
      const len = (2 + hash(x, z, 70 + b) * 2.5) * scale, by = y0 + trunk - 2 - Math.floor(hash(x, z, 80 + b) * 3);
      let px = x, py = by, pz = z;
      for (let s = 1; s <= len; s++) { px = Math.round(x + Math.cos(a) * s); pz = Math.round(z + Math.sin(a) * s); py = by + Math.floor(s * 0.6); this.set(px, py, pz, LOG, true); }
      this.blob(px, py + 1.5, pz, (2.2 + hash(x, z, 90 + b) * 1.2) * scale, 1.8 * scale, b);
    }
    this.blob(x + (hero ? 0.5 : 0), y0 + trunk + 1.5, z + (hero ? 0.5 : 0), 3.2 * scale, 2.4 * scale, 99);
    for (let k = 0; k < 6; k++) {                            // ferns at the foot
      const fx = x + Math.round((hash(x, z, 30 + k) - 0.5) * 8), fz = z + Math.round((hash(z, x, 40 + k) - 0.5) * 8);
      if (fx >= 0 && fz >= 0 && fx < this.S && fz < this.S && this.top[this.idx(fx, fz)] === GRASS) this.sprites.push({ x: fx + 0.5, y: this.h(fx, fz), z: fz + 0.5, tile: "fern", s: 1 });
    }
  }
  poplar(x: number, z: number) {
    if (x < 3 || z < 3 || x > this.S - 4 || z > this.S - 4) return;
    const y0 = this.h(x, z), H = 11 + Math.floor(hash(x, z, 17) * 5);
    for (let y = -1; y < H - 2; y++) this.set(x, y0 + y, z, LOG, true);
    for (let y = 3; y <= H; y++) {
      const R = 1.6 * Math.sin(Math.PI * Math.min(1, (y - 2) / (H - 1))) + 0.3;
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dz * dz <= R * R + hash(x + dx, z + dz, y) * 0.8) this.set(x + dx, y0 + y, z + dz, LEAVES);
    }
  }
  bush(x: number, z: number) { const y0 = this.h(x, z); this.blob(x, y0 + 0.4, z, 1.3 + hash(x, z, 18), 1.0, 7); }
  boulder(x: number, z: number) {
    const y0 = this.h(x, z), n = 2 + Math.floor(hash(x, z, 19) * 5);
    for (let k = 0; k < n; k++) {
      const dx = Math.round((hash(x, z, 100 + k) - 0.5) * 3), dz = Math.round((hash(z, x, 110 + k) - 0.5) * 3);
      const tall = hash(x, z, 120 + k) < 0.35 ? 1 : 0;
      for (let y = -1; y <= tall; y++) this.set(x + dx, y0 + y, z + dz, hash(x + dx, z + dz, 130) < 0.5 ? COBBLE : STONE, true);
    }
  }

  tileFor(type: number, face: "top" | "side" | "bottom", depth: number): TileName {
    switch (type) {
      case GRASS: return face === "top" ? "grassTop" : depth === 0 && face === "side" ? "grassSide" : depth < 4 ? "dirt" : "stone";
      case PATH: return face === "top" ? "path" : depth < 4 ? "dirt" : "stone";
      case COARSE: return face === "top" ? "coarseDirt" : depth < 4 ? "dirt" : "stone";
      case STUBBLE: return face === "top" ? "stubble" : depth < 4 ? "dirt" : "stone";
      case GRAVEL: return face === "top" ? "gravel" : depth < 3 ? "gravel" : "stone";
      case CLAY: return depth < 6 ? "clay" : "stone";
      case STONE: return "stone";
      case COBBLE: return "cobble";
      case DIRT: return face === "top" ? "dirt" : depth < 4 ? "dirt" : "stone";
      case LOG: return face === "side" ? "logSide" : "logTop";
      case LEAVES: return "leaves";
      default: return "dirt";
    }
  }
}

// ------------------------------------------------------------------ meshing with ambient occlusion
type V3 = [number, number, number];
const FACES: { n: V3; u: V3; v: V3; face: "top" | "side" | "bottom" }[] = [
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], face: "top" },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], face: "bottom" },
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], face: "side" },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], face: "side" },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], face: "side" },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], face: "side" },
];
const AO = [0.42, 0.6, 0.8, 1.0];

class Buf { p: number[] = []; n: number[] = []; uv: number[] = []; c: number[] = []; i: number[] = []; }

function emitFace(b: Buf, set: VoxelSet, x: number, y: number, z: number, f: (typeof FACES)[number], tile: TileName, shade = 1) {
  const [u0, v0, u1, v1] = uvRect(tile);
  const cx = x + 0.5 + f.n[0] * 0.5, cy = y + 0.5 + f.n[1] * 0.5, cz = z + 0.5 + f.n[2] * 0.5;
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const base = b.p.length / 3;
  const ao: number[] = [];
  corners.forEach(([su, sv], k) => {
    b.p.push(set.x0 + cx + 0.5 * (su * f.u[0] + sv * f.v[0]), set.baseY + cy + 0.5 * (su * f.u[1] + sv * f.v[1]), set.z0 + cz + 0.5 * (su * f.u[2] + sv * f.v[2]));
    b.n.push(...f.n); b.uv.push(...uvs[k]);
    const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2];
    const s1 = set.solid(nx + su * f.u[0], ny + su * f.u[1], nz + su * f.u[2]) ? 1 : 0;
    const s2 = set.solid(nx + sv * f.v[0], ny + sv * f.v[1], nz + sv * f.v[2]) ? 1 : 0;
    const c = set.solid(nx + su * f.u[0] + sv * f.v[0], ny + su * f.u[1] + sv * f.v[1], nz + su * f.u[2] + sv * f.v[2]) ? 1 : 0;
    const a = s1 && s2 ? 0 : 3 - (s1 + s2 + c);
    ao.push(a);
    const l = AO[a] * shade; b.c.push(l, l, l);
  });
  if (ao[0] + ao[2] < ao[1] + ao[3]) b.i.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
  else b.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function toGeom(b: Buf) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(b.p, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(b.n, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(b.c, 3));
  g.setIndex(b.i);
  g.computeBoundingSphere();
  return g;
}

/** Meshes one chunk (cs x cs columns). Returns opaque + leaves geometries. */
export function meshChunk(set: VoxelSet, ox: number, oz: number, cs = 32) {
  const solid = new Buf(), leaves = new Buf();
  const zEnd = Math.min(set.S, oz + cs), xEnd = Math.min(set.S, ox + cs);
  for (let z = oz; z < zEnd; z++) for (let x = ox; x < xEnd; x++) {
    const h = set.h(x, z), t = set.top[set.idx(x, z)];
    // terrain column: top face + exposed sides
    emitFace(solid, set, x, h - 1, z, FACES[0], set.tileFor(t, "top", 0));
    for (const f of FACES.slice(2)) {
      const nh = (x + f.n[0] < 0 || z + f.n[2] < 0 || x + f.n[0] >= set.S || z + f.n[2] >= set.S) ? h - 6 : set.h(x + f.n[0], z + f.n[2]);
      for (let y = nh; y < h; y++) emitFace(solid, set, x, y, z, f, set.tileFor(t, "side", h - 1 - y), 1);
    }
  }
  for (const [k, type] of set.sparse) {
    const x = (k % 4096) - 64, z = (Math.floor(k / 4096) % 4096) - 64, y = Math.floor(k / 4096 / 4096) - 64;
    if (x < ox || x >= xEnd || z < oz || z >= zEnd) continue;
    for (const f of FACES) {
      const nb = set.sparse.get(set.key(x + f.n[0], y + f.n[1], z + f.n[2]));
      if (y + f.n[1] < set.h(x + f.n[0], z + f.n[2]) || (nb !== undefined && nb !== LEAVES)) continue;   // hidden by ground or an opaque block
      if (type === LEAVES && nb === LEAVES) continue;                            // inner leaf faces
      emitFace(type === LEAVES ? leaves : solid, set, x, y, z, f, set.tileFor(type, f.face, 0), type === LEAVES ? 0.95 : 1);
    }
  }
  return { solid: toGeom(solid), leaves: toGeom(leaves) };
}

/** Crossed-quad sprites (tall grass, flowers, ferns). */
export function spriteGeometry(set: VoxelSet) {
  const b = new Buf();
  for (const s of set.sprites) {
    const [u0, v0, u1, v1] = uvRect(s.tile);
    const wx = set.x0 + s.x + (hash(s.x, s.z, 50) - 0.5) * 0.4, wz = set.z0 + s.z + (hash(s.z, s.x, 51) - 0.5) * 0.4, wy = set.baseY + s.y;
    const a = hash(s.x, s.z, 52) * Math.PI;
    for (const rot of [a, a + Math.PI / 2]) {
      const dx = Math.cos(rot) * 0.5 * s.s, dz = Math.sin(rot) * 0.5 * s.s, H = s.s;
      const base = b.p.length / 3;
      b.p.push(wx - dx, wy, wz - dz, wx + dx, wy, wz + dz, wx + dx, wy + H, wz + dz, wx - dx, wy + H, wz - dz);
      for (let k = 0; k < 4; k++) b.n.push(0, 1, 0);
      b.uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
      b.c.push(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.74, 0.74, 0.74, 0.74, 0.74, 0.74);
      b.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  return toGeom(b);
}
