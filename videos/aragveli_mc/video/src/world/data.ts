// Loads the real-relief heightmaps (built by tools/terrain.py) and exposes block-quantised sampling.
import { continueRender, delayRender, staticFile } from "remotion";
import { useEffect, useState } from "react";

export const BLOCK = 5;          // metres per voxel block (horizontal and vertical)
export const EXAG = 1.5;         // vertical exaggeration

export interface TerrainMeta {
  name: string; nx: number; nz: number; cell: number; width: number; height: number;
  base_elev_m: number; water_level_m: number | null;
  rivers: [number, number][][];
  landmarks: Record<string, { x: number; z: number; osm: string }>;
}

export class TerrainData {
  constructor(public meta: TerrainMeta, public h: Float32Array, public water: Uint8Array, public dist: Uint16Array) {}

  /** Exaggerated surface height above base (m), bilinear, unquantised. */
  surface(x: number, z: number) {
    const m = this.meta;
    const fx = Math.min(m.nx - 1.001, Math.max(0, (x + m.width / 2) / m.cell - 0.5));
    const fz = Math.min(m.nz - 1.001, Math.max(0, (z + m.height / 2) / m.cell - 0.5));
    const j = Math.floor(fx), i = Math.floor(fz), u = fx - j, v = fz - i;
    const a = this.h[i * m.nx + j], b = this.h[i * m.nx + j + 1], c = this.h[(i + 1) * m.nx + j], d = this.h[(i + 1) * m.nx + j + 1];
    return ((a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v) * EXAG;
  }
  /** Column top in metres, quantised to whole blocks. */
  top(x: number, z: number) { return Math.floor(this.surface(x, z) / BLOCK) * BLOCK; }
  isWater(x: number, z: number) {
    const m = this.meta;
    const j = Math.floor((x + m.width / 2) / m.cell), i = Math.floor((z + m.height / 2) / m.cell);
    if (i < 0 || j < 0 || i >= m.nz || j >= m.nx) return false;
    return this.water[i * m.nx + j] > 0;
  }
  /** Water surface (m, exaggerated) near (x, z): min surface in a small window, smooth. */
  waterLevel(x: number, z: number) {
    let lo = Infinity;
    for (let dz = -30; dz <= 30; dz += 15) for (let dx = -30; dx <= 30; dx += 15) if (this.isWater(x + dx, z + dz)) lo = Math.min(lo, this.surface(x + dx, z + dz));
    return lo === Infinity ? this.surface(x, z) : lo + 2.2 * EXAG;
  }
  /** Distance to the river (m, real, not exaggerated). */
  riverDist(x: number, z: number) {
    const m = this.meta;
    const j = Math.min(m.nx - 1, Math.max(0, Math.floor((x + m.width / 2) / m.cell)));
    const i = Math.min(m.nz - 1, Math.max(0, Math.floor((z + m.height / 2) / m.cell)));
    return this.dist[i * m.nx + j];
  }
  /** Slope (rise/run, exaggerated) at (x, z). */
  slope(x: number, z: number, d = 10) {
    const gx = (this.surface(x + d, z) - this.surface(x - d, z)) / (2 * d);
    const gz = (this.surface(x, z + d) - this.surface(x, z - d)) / (2 * d);
    return Math.hypot(gx, gz);
  }
  inside(x: number, z: number, margin = 0) { return Math.abs(x) < this.halfW - margin && Math.abs(z) < this.halfH - margin; }
  get halfW() { return this.meta.width / 2; }
  get halfH() { return this.meta.height / 2; }
  mark(name: string) { const k = Object.keys(this.meta.landmarks).find((n) => n.startsWith(name)); return k ? this.meta.landmarks[k] : { x: 0, z: 0, osm: "" }; }
}

const cache = new Map<string, Promise<TerrainData>>();

export function loadTerrain(name: string) {
  if (!cache.has(name)) {
    cache.set(name, (async () => {
      const meta: TerrainMeta = await (await fetch(staticFile(`terrain/${name}.json`))).json();
      const raw = new Uint16Array(await (await fetch(staticFile(`terrain/${name}.bin`))).arrayBuffer());
      const water = new Uint8Array(await (await fetch(staticFile(`terrain/${name}_water.bin`))).arrayBuffer());
      const dist = new Uint16Array(await (await fetch(staticFile(`terrain/${name}_dist.bin`))).arrayBuffer());
      const h = new Float32Array(raw.length);
      for (let k = 0; k < raw.length; k++) h[k] = raw[k] / 10;
      return new TerrainData(meta, h, water, dist);
    })());
  }
  return cache.get(name)!;
}

export function useTerrain(name: string) {
  const [data, setData] = useState<TerrainData | null>(null);
  const [handle] = useState(() => delayRender("terrain " + name));
  useEffect(() => { loadTerrain(name).then((d) => { setData(d); continueRender(handle); }); }, [name, handle]);
  return data;
}
