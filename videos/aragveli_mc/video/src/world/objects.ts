// Deterministic placement of vegetation and 18th-century structures (pure data; rendered by Objects.tsx).
import * as THREE from "three";
import { BLOCK, TerrainData } from "./data";
import { ARAGVI, distToPolyline, ISANI, KALA, NARIKALA_WALL, P2, pointInPoly, TB } from "./locations";
import { landUse, T_BANK, T_DRY, T_FARM, T_FOREST, T_ORCHARD, T_PASTURE, T_VINE, T_ALPINE, T_ROCK } from "./terrain";

export type Box = { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry?: number; color?: THREE.Color; seed?: number; burn?: number };
export type Kind = "trunk" | "leaves" | "plaster" | "roof" | "stone" | "tuff" | "tile" | "wood" | "vine" | "grass";

const h2 = (a: number, b: number) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

const LEAF = ["#5d7a35", "#6b8638", "#55702f", "#76883a", "#8a8c38", "#a59a3a", "#b8a03a", "#6f7d33"].map((c) => new THREE.Color(c));
const POPLAR = ["#7d8f3c", "#93983c", "#a8a03c", "#6d8436"].map((c) => new THREE.Color(c));
const GRASS = ["#c8ac5c", "#b89a50", "#d4b868", "#a89448", "#9aa050"].map((c) => new THREE.Color(c));

/** Vegetation inside one square area (cached by key). ground(x,z) gives the block top. */
export function vegetation(d: TerrainData, ox: number, oz: number, size: number, detail: { grass: boolean; vines: boolean }) {
  const out: Record<Kind, Box[]> = { trunk: [], leaves: [], plaster: [], roof: [], stone: [], tuff: [], tile: [], wood: [], vine: [], grass: [] };
  const g = (x: number, z: number) => d.top(x, z);
  for (let z = oz; z < oz + size; z += BLOCK) for (let x = ox; x < ox + size; x += BLOCK) {
    if (!d.inside(x, z, 20)) continue;
    const cx = x + BLOCK / 2, cz = z + BLOCK / 2;
    const t = landUse(d, cx, cz);
    const r = h2(cx * 0.37, cz * 0.53), r2 = h2(cz * 0.71, cx * 0.13);
    const y = g(cx, cz);
    const jx = cx + (r2 - 0.5) * 3, jz = cz + (r - 0.5) * 3;
    const near = d.riverDist(cx, cz);
    if ((t === T_BANK && near < 70 && r < 0.18) || (near < 90 && near > 22 && r < 0.05 && t !== T_FOREST)) {
      poplar(out, jx, y, jz, r, r2);
    } else if (t === T_FOREST && r < (d.meta.name === "aragvi" ? 0.45 : 0.32)) {
      broadleaf(out, jx, y, jz, r, r2, 0.8 + r2 * 0.6);
    } else if (t === T_ORCHARD && Math.round(cx / BLOCK) % 2 === 0 && Math.round(cz / BLOCK) % 2 === 0 && r < 0.8) {
      fruitTree(out, cx, y, cz, r, r2);
    } else if ((t === T_PASTURE || t === T_DRY || t === T_ALPINE) && r < 0.012) {
      broadleaf(out, jx, y, jz, r, r2, 0.7 + r2 * 0.5);
    } else if ((t === T_PASTURE || t === T_DRY || t === T_ROCK) && r < 0.03) {
      out.leaves.push({ x: jx, y: y + 0.8, z: jz, sx: 2.4, sy: 1.6, sz: 2.4, color: LEAF[Math.floor(r2 * 8)] });
    }
    if (detail.vines && t === T_VINE) {
      const alongX = h2(Math.floor(cx / 40), Math.floor(cz / 55) + 1.3) > 0.5;
      for (let k = 0; k < 2; k++) {
        const off = -1.25 + k * 2.5;
        out.vine.push(alongX ? { x: cx, y: y + 0.55, z: cz + off, sx: BLOCK, sy: 1.1, sz: 0.7, color: LEAF[(k + Math.floor(r * 8)) % 8] }
          : { x: cx + off, y: y + 0.55, z: cz, sx: 0.7, sy: 1.1, sz: BLOCK, color: LEAF[(k + Math.floor(r * 8)) % 8] });
      }
    }
    if (detail.grass && (t === T_DRY || t === T_PASTURE || t === T_FARM || t === T_ORCHARD || t === T_ALPINE)) {
      for (let k = 0; k < 7; k++) {
        const a = h2(cx + k * 13.1, cz - k * 7.7), b = h2(cz + k * 3.3, cx + k * 9.1);
        const hh = 0.35 + a * 0.6;
        out.grass.push({ x: x + a * BLOCK, y: y + hh / 2, z: z + b * BLOCK, sx: 0.12, sy: hh, sz: 0.12, color: GRASS[Math.floor(b * 5)] });
      }
    }
  }
  return out;
}

function broadleaf(o: Record<Kind, Box[]>, x: number, y: number, z: number, r: number, r2: number, s: number) {
  o.trunk.push({ x, y: y + 2 * s, z, sx: 0.8 * s, sy: 4 * s, sz: 0.8 * s });
  const c = LEAF[Math.floor(r * 97) % LEAF.length];
  o.leaves.push({ x, y: y + 5.4 * s, z, sx: 6 * s, sy: 3.6 * s, sz: 6 * s, color: c });
  o.leaves.push({ x: x + (r2 - 0.5) * 2 * s, y: y + 7.6 * s, z: z + (r - 0.5) * 2 * s, sx: 4 * s, sy: 2 * s, sz: 4 * s, color: c });
  if (r2 > 0.4) o.leaves.push({ x: x + 2.4 * s, y: y + 4.6 * s, z: z - 1.2 * s, sx: 2.6 * s, sy: 2.4 * s, sz: 2.6 * s, color: LEAF[(Math.floor(r * 97) + 3) % LEAF.length] });
}
function poplar(o: Record<Kind, Box[]>, x: number, y: number, z: number, r: number, r2: number) {
  const s = 0.85 + r2 * 0.4;
  o.trunk.push({ x, y: y + 1.6 * s, z, sx: 0.6, sy: 3.2 * s, sz: 0.6 });
  const c = POPLAR[Math.floor(r * 41) % POPLAR.length];
  o.leaves.push({ x, y: y + 9 * s, z, sx: 2.8 * s, sy: 12 * s, sz: 2.8 * s, color: c });
  o.leaves.push({ x, y: y + 16 * s, z, sx: 1.8 * s, sy: 3.5 * s, sz: 1.8 * s, color: c });
}
function fruitTree(o: Record<Kind, Box[]>, x: number, y: number, z: number, r: number, r2: number) {
  o.trunk.push({ x, y: y + 0.8, z, sx: 0.5, sy: 1.6, sz: 0.5 });
  o.leaves.push({ x, y: y + 2.8, z, sx: 3.4, sy: 2.4, sz: 3.4, color: LEAF[Math.floor(r2 * 6)] });
}

// ------------------------------------------------------------------ old Tbilisi (stylised)
export function city(d: TerrainData) {
  const o: Record<Kind, Box[]> = { trunk: [], leaves: [], plaster: [], roof: [], stone: [], tuff: [], tile: [], wood: [], vine: [], grass: [] };
  const g = (x: number, z: number) => d.top(x, z);
  const reserved: [number, number, number][] = [[...TB.sioni, 26], [...TB.metekhi, 26], [...TB.anchiskhati, 22], [...TB.tabori, 14], [...TB.abanotubani, 40]];
  const free = (x: number, z: number) => reserved.every(([a, b, r]) => Math.hypot(x - a, z - b) > r) && !d.isWater(x, z) && d.riverDist(x, z) > 14;
  // houses on a jittered grid, terraced on the slopes
  for (const poly of [KALA, ISANI]) {
    const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
    for (let z = Math.min(...zs); z < Math.max(...zs); z += 10.5) for (let x = Math.min(...xs); x < Math.max(...xs); x += 10.5) {
      const r = h2(x * 0.11, z * 0.17), r2 = h2(z * 0.07, x * 0.19);
      const cx = x + (r - 0.5) * 3, cz = z + (r2 - 0.5) * 3;
      if (!pointInPoly(cx, cz, poly) || !free(cx, cz) || r < 0.08) continue;
      if (d.slope(cx, cz) > 1.6) continue;
      const w = 6 + r * 3.5, dd = 6 + r2 * 3.5, floors = 1 + Math.floor(h2(cx, cz) * 2.6), hh = floors * 3.1;
      const y = Math.min(g(cx - w / 2, cz), g(cx + w / 2, cz), g(cx, cz - dd / 2), g(cx, cz + dd / 2));
      const top = Math.max(g(cx, cz), y) + hh;
      const ry = (h2(cx, 3) - 0.5) * 0.12;
      o.plaster.push({ x: cx, y: (y + top) / 2 - 0.5, z: cz, sx: w, sy: top - y + 1, sz: dd, ry, seed: r * 10 });
      o.roof.push({ x: cx, y: top + 0.25, z: cz, sx: w + 0.8, sy: 0.5, sz: dd + 0.8, ry, seed: r * 10 });
      if (h2(cx, cz + 5) > 0.55) o.wood.push({ x: cx + (w / 2 + 0.6) * Math.cos(ry), y: top - 2.2, z: cz, sx: 1.2, sy: 0.25, sz: dd * 0.8, ry, seed: r });
    }
  }
  // churches (tuff + tiled cones), positions from OSM
  church(o, TB.sioni[0], g(...TB.sioni), TB.sioni[1], 24, 15, 12, true);
  church(o, TB.metekhi[0], g(...TB.metekhi), TB.metekhi[1], 18, 14, 11, true);
  church(o, TB.anchiskhati[0], g(...TB.anchiskhati), TB.anchiskhati[1], 20, 12, 9, false);
  church(o, TB.tabori[0], g(...TB.tabori), TB.tabori[1], 9, 6, 6, true);
  // sulphur bath domes (Abanotubani)
  for (let k = 0; k < 7; k++) {
    const x = TB.abanotubani[0] - 25 + (k % 4) * 15, z = TB.abanotubani[1] - 12 + Math.floor(k / 4) * 18, y = g(x, z);
    for (let s = 0; s < 3; s++) o.stone.push({ x, y: y + 0.6 + s * 0.9, z, sx: 9 - s * 2.6, sy: 0.9, sz: 9 - s * 2.6 });
  }
  // Narikala: wall along the ridge, towers at vertices (stylised outline on the real ridge)
  wallLine(o, d, NARIKALA_WALL, 2.6, 9, 14, 8);
  // city wall around Kala (stylised), lower
  wallLine(o, d, [...KALA, KALA[0]], 2.0, 6, 9, 6, 120);
  // royal residence near Metekhi (stylised block)
  const [ix, iz] = [TB.metekhi[0] + 70, TB.metekhi[1] - 40];
  o.stone.push({ x: ix, y: g(ix, iz) + 6, z: iz, sx: 40, sy: 12, sz: 24 });
  o.roof.push({ x: ix, y: g(ix, iz) + 12.3, z: iz, sx: 41, sy: 0.6, sz: 25 });
  // the old bridge below Metekhi (stylised stone arches)
  const [bx, bz] = TB.metekhiBridge, by = d.waterLevel(bx, bz);
  const ang = Math.atan2(TB.metekhi[1] - TB.sioni[1], TB.metekhi[0] - TB.sioni[0]);
  for (let k = -3; k <= 3; k++) {
    const px = bx + Math.cos(ang) * k * 14, pz = bz + Math.sin(ang) * k * 14;
    o.stone.push({ x: px, y: by + 5, z: pz, sx: 6, sy: 10 + Math.abs(k) * 2, sz: 9, ry: -ang });
  }
  o.stone.push({ x: bx, y: by + 10.5, z: bz, sx: 110, sy: 1.6, sz: 9, ry: -ang });
  // courtyard trees
  for (let k = 0; k < 160; k++) {
    const x = -5150 + h2(k, 1) * 1250, z = -5080 + h2(k, 2) * 1100;
    if ((pointInPoly(x, z, KALA) || pointInPoly(x, z, ISANI)) && free(x, z)) broadleaf(o, x, g(x, z), z, h2(k, 3), h2(k, 4), 0.6);
  }
  return o;
}

function church(o: Record<Kind, Box[]>, x: number, y: number, z: number, L: number, W: number, H: number, dome: boolean) {
  o.tuff.push({ x, y: y + H / 2, z, sx: W, sy: H, sz: L });
  o.tuff.push({ x, y: y + H * 0.8 / 2, z: z, sx: W + 8, sy: H * 0.8, sz: L * 0.45 });             // transept
  o.tile.push({ x, y: y + H + 0.6, z, sx: W + 0.6, sy: 1.2, sz: L + 0.6 });
  o.tile.push({ x, y: y + H * 0.8 + 0.5, z, sx: W + 8.6, sy: 1, sz: L * 0.45 + 0.6 });
  if (dome) {
    o.tuff.push({ x, y: y + H + 4, z, sx: 6.5, sy: 7, sz: 6.5 });                                // drum
    for (let s = 0; s < 4; s++) o.tile.push({ x, y: y + H + 8 + s * 1.3, z, sx: 7.4 - s * 1.8, sy: 1.3, sz: 7.4 - s * 1.8 }); // cone
  } else o.tile.push({ x, y: y + H + 1.7, z, sx: W * 0.5, sy: 1.2, sz: L + 0.4 });
}

function wallLine(o: Record<Kind, Box[]>, d: TerrainData, line: P2[], thick: number, hgt: number, towerH: number, towerW: number, towerEvery = 0) {
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1];
    const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax);
    const n = Math.ceil(len / 6);
    for (let k = 0; k < n; k++) {                                           // follow the ground in 6 m segments
      const x = ax + ((k + 0.5) / n) * (bx - ax), z = az + ((k + 0.5) / n) * (bz - az);
      if (d.isWater(x, z)) continue;
      const y = d.top(x, z);
      o.stone.push({ x, y: y + hgt / 2 - 1, z, sx: len / n + 0.3, sy: hgt + 2, sz: thick, ry: -ang });
      if (k % 2 === 0) o.stone.push({ x, y: y + hgt + 1.4, z, sx: 1.6, sy: 1.2, sz: thick + 0.2, ry: -ang }); // merlons
    }
    const towers = towerEvery ? Math.max(1, Math.floor(len / towerEvery)) : 1;
    for (let k = 0; k < towers; k++) {
      const x = ax + (k / towers) * (bx - ax), z = az + (k / towers) * (bz - az);
      if (d.isWater(x, z)) continue;
      const y = d.top(x, z);
      o.stone.push({ x, y: y + towerH / 2 - 1, z, sx: towerW, sy: towerH + 2, sz: towerW, ry: -ang });
    }
  }
}

/** Aragvi valley: stylised highland towers and small stone villages. */
export function aragviSettlements(d: TerrainData) {
  const o: Record<Kind, Box[]> = { trunk: [], leaves: [], plaster: [], roof: [], stone: [], tuff: [], tile: [], wood: [], vine: [], grass: [] };
  for (const [x, z] of ARAGVI.towers) {
    const y = d.top(x, z);
    o.stone.push({ x, y: y + 9, z, sx: 5.5, sy: 20, sz: 5.5 });
    o.stone.push({ x, y: y + 20, z, sx: 6.5, sy: 2, sz: 6.5 });
    for (let s = 0; s < 4; s++) o.stone.push({ x, y: y + 21.5 + s * 0.9, z, sx: 5.6 - s * 1.4, sy: 0.9, sz: 5.6 - s * 1.4 });
  }
  for (const [vx, vz] of ARAGVI.villages) for (let k = 0; k < 14; k++) {
    const x = vx + (h2(k, vx) - 0.5) * 90, z = vz + (h2(vz, k) - 0.5) * 90, y = d.top(x, z);
    if (d.isWater(x, z) || d.slope(x, z) > 1.2) continue;
    o.stone.push({ x, y: y + 2.5, z, sx: 6 + h2(k, 1) * 3, sy: 6, sz: 5 + h2(k, 2) * 3 });
    o.roof.push({ x, y: y + 5.7, z, sx: 7 + h2(k, 1) * 3, sy: 0.6, sz: 6 + h2(k, 2) * 3 });
  }
  return o;
}

export const unusedKinds = { distToPolyline };
