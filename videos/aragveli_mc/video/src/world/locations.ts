// 18th-century overlay on the real relief (local metres: x = east, z = south, origin = box centre).
// Landmark coordinates come from OSM/Nominatim (see sources.md). Everything drawn from them
// (walls, street grid, roads, field parcels) is a STYLISATION unless marked otherwise.
export type P2 = [number, number];

export const TB = {
  // geocoded (OSM), metres in the tbilisi frame
  narikala: [-4644, -4028] as P2,
  metekhi: [-4466, -4298] as P2,
  metekhiBridge: [-4574, -4315] as P2,
  sioni: [-4775, -4427] as P2,
  anchiskhati: [-4830, -4893] as P2,
  abanotubani: [-4447, -4020] as P2,
  tabori: [-4311, -3717] as P2,
  memorial: [-3753, -3894] as P2,           // 300 Aragveli memorial (1959), OSM node 11816735069
  ortachala: [-3219, -3396] as P2,
  shavnabada: [-2078, -67] as P2,
  krtsanisiVillage: [3290, 4548] as P2,
  battleWiki: [3139, 4646] as P2,          // Wikipedia infobox coordinates of the battle
};

/** Old Tbilisi (Kala) on the right bank — stylised outline between Narikala ridge and the river. */
export const KALA: P2[] = [
  [-5060, -5080], [-4790, -5060], [-4730, -4800], [-4700, -4560], [-4640, -4380], [-4560, -4160],
  [-4420, -4010], [-4520, -3940], [-4700, -3960], [-4900, -4010], [-5080, -4200], [-5160, -4600],
];
/** Isani / Avlabari (left bank, around Metekhi and the royal residence) — stylised. */
export const ISANI: P2[] = [
  [-4470, -4440], [-4300, -4620], [-4050, -4640], [-3900, -4420], [-4080, -4200], [-4300, -4130], [-4440, -4230],
];
/** Narikala fortress wall along the ridge crest (stylised), towers at vertices. */
export const NARIKALA_WALL: P2[] = [
  [-4470, -3990], [-4560, -3960], [-4644, -4028], [-4760, -3990], [-4880, -4010], [-5000, -4080], [-5090, -4210],
];

/** Dirt roads (stylised; the southern road follows the Mtkvari right bank towards Krtsanisi, as the Qajar army came from the south). */
export const ROADS: P2[][] = [
  [[-4440, -3990], [-3900, -3700], [-3219, -3396], [-2500, -3000], [-1600, -2500], [-600, -2050], [700, -1350], [1700, -400], [2500, 800], [3000, 2200], [3290, 3500], [3290, 4548], [3400, 5900]],
  [[-5060, -4400], [-5600, -4100], [-6300, -3600], [-7000, -3300]],     // west, towards Kojori / Tabakhmela
  [[-4000, -4600], [-3400, -5000], [-2600, -5500], [-2000, -5950]],     // north-east, towards Kakheti
  [[-4900, -5060], [-5100, -5500], [-5300, -5950]],                     // north, the king's road to the mountains
];

/** The king's withdrawal route used for camera moves (field -> city -> north to the mountains). Reconstruction. */
export const RETREAT: P2[] = [[2600, 1400], [2200, 300], [1200, -800], [0, -1850], [-1600, -2500], [-3219, -3396], [-3900, -3700], [-4440, -3990], [-4700, -4500], [-4900, -5060], [-5150, -5600], [-5300, -5900]];

export interface Location { id: string; label: string; status: string; x: number; z: number; radius: number; note: string }

export const LOCATIONS: Location[] = [
  { id: "a", label: "(a) Krtsanisi field", status: "Б/В: reconstruction", x: 2600, z: 2600, radius: 1400,
    note: "Open plain between the eastern end of the ridge and Krtsanisi village on the Mtkvari; Wikipedia battle coordinates fall here." },
  { id: "a-geo", label: "Georgian line (reconstruction)", status: "Б", x: 2200, z: 1500, radius: 500, note: "Facing south-east, across the road from the south." },
  { id: "a-qaj", label: "Qajar army approach (reconstruction)", status: "Б", x: 3600, z: 4900, radius: 700, note: "From the south, along the Mtkvari right bank." },
  { id: "a-king", label: "Erekle II command position (reconstruction)", status: "Б", x: 1500, z: 700, radius: 200, note: "Rise behind the line; exact spot unknown." },
  { id: "b", label: "(b) last stand — approaches & Mtkvari bank", status: "Б: by tradition", x: -3400, z: -3550, radius: 500,
    note: "Approaches to the city near Ortachala/Metekhi; the 1959 memorial stands where remains of graves were found." },
  { id: "c", label: "(c) Tbilisi (Kala, Narikala, Metekhi)", status: "A (landmarks) / stylisation (houses)", x: -4600, z: -4400, radius: 700, note: "" },
  { id: "e", label: "(e) place of memory (symbolic)", status: "symbolic", x: -3753, z: -3894, radius: 150, note: "Terrace by the river at the memorial site, at dawn." },
];

// Aragvi valley frame (separate terrain 'aragvi'): towers are a stylisation of Mtiuleti/Pshavi defensive towers.
export const ARAGVI = {
  towers: [[-1640, -900], [-1450, 300], [-1820, 1500], [1300, -1500]] as P2[],
  villages: [[-1600, -700], [-1500, 450], [-1760, 1650]] as P2[],
};

export function pointInPoly(x: number, z: number, poly: P2[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function distToPolyline(x: number, z: number, line: P2[]) {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return best;
}

/** Point along a polyline at arc-length fraction u in [0,1]. */
export function alongPolyline(line: P2[], u: number): P2 {
  const seg = line.slice(1).map((p, i) => Math.hypot(p[0] - line[i][0], p[1] - line[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, u)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) { const k = d / seg[i]; return [line[i][0] + (line[i + 1][0] - line[i][0]) * k, line[i][1] + (line[i + 1][1] - line[i][1]) * k]; }
    d -= seg[i];
  }
  return line[line.length - 1];
}
