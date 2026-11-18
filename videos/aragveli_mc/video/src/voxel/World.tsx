import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { HitEvent } from "./battle";
import { Horse, horseRoot } from "./rig";
import { hash1, noise2, rng } from "./random";
import { bannerTex, dirt, grassSide, grassTop, leaves, stone, wood } from "./textures";

const BOX = new THREE.BoxGeometry(1, 1, 1);
const tmp = new THREE.Matrix4();
const tq = new THREE.Quaternion();
const tv = new THREE.Vector3();
const ts = new THREE.Vector3();
const te = new THREE.Euler();

function setTRS(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) {
  tq.setFromEuler(te.set(rx, ry, rz));
  tmp.compose(tv.set(x, y, z), tq, ts.set(sx, sy, sz));
  mesh.setMatrixAt(i, tmp);
}

// ------------------------------------------------------------------ terrain
export interface TerrainSpec { half: number; flatX: number; flatZ: number; seed: number; trampleZ?: [number, number]; }

export function terrainHeight(x: number, z: number, s: TerrainSpec) {
  const dx = Math.max(0, Math.abs(x) - s.flatX), dz = Math.max(0, Math.abs(z) - s.flatZ);
  const d = Math.hypot(dx, dz);
  const n = noise2(x * 0.06 + s.seed, z * 0.06) * 0.7 + noise2(x * 0.15, z * 0.15 + s.seed) * 0.3;
  const m = noise2(x * 0.025 + 40, z * 0.025 - s.seed);
  return Math.max(0, Math.floor(Math.min(16, d * (0.05 + 0.2 * m) * (0.3 + 1.4 * n)) + (n > 0.78 && d < 3 ? 1 : 0)));
}

export const Terrain: React.FC<{ spec: TerrainSpec }> = ({ spec }) => {
  const data = useMemo(() => {
    const grass: [number, number, number][] = [], soil: [number, number, number][] = [], trampled: [number, number, number][] = [];
    const r = rng(spec.seed + 7);
    for (let x = -spec.half; x < spec.half; x++) for (let z = -spec.half; z < spec.half; z++) {
      const h = terrainHeight(x, z, spec);
      const tz = spec.trampleZ;
      const tram = tz && z > tz[0] && z < tz[1] && Math.abs(x) < spec.flatX && r() < 0.55;
      (tram ? trampled : grass).push([x + 0.5, h - 0.5, z + 0.5]);
      const minN = Math.min(terrainHeight(x + 1, z, spec), terrainHeight(x - 1, z, spec), terrainHeight(x, z + 1, spec), terrainHeight(x, z - 1, spec));
      for (let y = h - 1; y >= minN; y--) soil.push([x + 0.5, y - 0.5, z + 0.5]);
    }
    return { grass, soil, trampled };
  }, [spec]);
  const mats = useMemo(() => {
    const top = new THREE.MeshLambertMaterial({ map: grassTop() });
    const side = new THREE.MeshLambertMaterial({ map: grassSide() });
    const d = new THREE.MeshLambertMaterial({ map: dirt() });
    return { grass: [side, side, top, d, side, side], dirt: d };
  }, []);
  const g = useRef<THREE.InstancedMesh>(null), s = useRef<THREE.InstancedMesh>(null), tr = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const r = rng(spec.seed);
    data.grass.forEach(([x, y, z], i) => { setTRS(g.current!, i, x, y, z, 1); g.current!.setColorAt(i, new THREE.Color().setScalar(0.88 + r() * 0.12)); });
    data.soil.forEach(([x, y, z], i) => setTRS(s.current!, i, x, y, z, 1));
    data.trampled.forEach(([x, y, z], i) => setTRS(tr.current!, i, x, y, z, 1));
    [g, s, tr].forEach((m) => { if (m.current) { m.current.instanceMatrix.needsUpdate = true; if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true; } });
  }, [data, spec.seed]);
  return (
    <>
      <instancedMesh ref={g} args={[BOX, mats.grass, data.grass.length]} receiveShadow />
      <instancedMesh ref={s} args={[BOX, mats.dirt, Math.max(1, data.soil.length)]} receiveShadow />
      <instancedMesh ref={tr} args={[BOX, mats.dirt, Math.max(1, data.trampled.length)]} receiveShadow />
    </>
  );
};

// ------------------------------------------------------------------ distant mountains, trees, clouds
export const Mountains: React.FC<{ z: number; width: number; seed: number; block?: number }> = ({ z, width, seed, block = 4 }) => {
  const cells = useMemo(() => {
    const out: [number, number, number, number][] = [];
    for (let i = -width / 2; i < width / 2; i += block) for (let k = 0; k < 7; k++) {
      const zz = z - k * block;
      const h = Math.floor((noise2(i * 0.03 + seed, k * 0.4) * 0.8 + 0.2) * (5 + k * 2.2));
      for (let y = 0; y < h; y++) out.push([i, y * block + block / 2, zz, y / Math.max(1, h)]);
    }
    return out;
  }, [z, width, seed, block]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ map: stone() }), []);
  useLayoutEffect(() => {
    cells.forEach(([x, y, zz, f], i) => {
      setTRS(ref.current!, i, x, y, zz, block);
      ref.current!.setColorAt(i, f > 0.82 ? new THREE.Color("#f2f4f8") : new THREE.Color("#7d8a86").multiplyScalar(0.8 + 0.3 * hash1(i)));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [cells, block]);
  return <instancedMesh ref={ref} args={[BOX, mat, cells.length]} />;
};

export const Trees: React.FC<{ spots: [number, number, number][] }> = ({ spots }) => {
  const trunk = useRef<THREE.InstancedMesh>(null), crown = useRef<THREE.InstancedMesh>(null);
  const mats = useMemo(() => ({ t: new THREE.MeshLambertMaterial({ map: wood() }), l: new THREE.MeshLambertMaterial({ map: leaves() }) }), []);
  useLayoutEffect(() => {
    spots.forEach(([x, y, z], i) => {
      setTRS(trunk.current!, i, x, y + 1.5, z, 0.8, 3, 0.8);
      setTRS(crown.current!, i * 2, x, y + 3.6, z, 3);
      setTRS(crown.current!, i * 2 + 1, x, y + 5.2, z, 1.8);
    });
    trunk.current!.instanceMatrix.needsUpdate = true; crown.current!.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (<>
    <instancedMesh ref={trunk} args={[BOX, mats.t, Math.max(1, spots.length)]} castShadow />
    <instancedMesh ref={crown} args={[BOX, mats.l, Math.max(1, spots.length * 2)]} castShadow />
  </>);
};

export const Clouds: React.FC<{ t: number; count?: number; y?: number; spread?: number }> = ({ t, count = 22, y = 95, spread = 320 }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.7, fog: false }), []);
  useLayoutEffect(() => {
    for (let i = 0; i < count; i++) {
      const x = ((hash1(i) * spread + t * 1.2) % spread) - spread / 2;
      setTRS(ref.current!, i, x, y + hash1(i + 9) * 12, -spread / 2 + hash1(i + 3) * spread, 8 + hash1(i + 5) * 18, 2, 6 + hash1(i + 7) * 12);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [t, count, y, spread]);
  return <instancedMesh ref={ref} args={[BOX, mat, count]} frustumCulled={false} />;
};

// ------------------------------------------------------------------ particles
const SPARK_MAX = 1800, DEBRIS_MAX = 900, DUST_MAX = 1400, HAZE = 90;

function lowerBound(ev: HitEvent[], t: number) {
  let lo = 0, hi = ev.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (ev[m].t < t) lo = m + 1; else hi = m; }
  return lo;
}

export const Particles: React.FC<{ events: HitEvent[]; horses: Horse[]; t: number; bounds: number }> = ({ events, horses, t, bounds }) => {
  const sp = useRef<THREE.InstancedMesh>(null), db = useRef<THREE.InstancedMesh>(null), du = useRef<THREE.InstancedMesh>(null), hz = useRef<THREE.InstancedMesh>(null);
  const mats = useMemo(() => ({
    spark: new THREE.MeshBasicMaterial({ color: "#ffffff", blending: THREE.AdditiveBlending, transparent: true, toneMapped: false, depthWrite: false }),
    debris: new THREE.MeshLambertMaterial({ color: "#ffffff" }),
    dust: new THREE.MeshLambertMaterial({ color: "#c8b48e", transparent: true, opacity: 0.28, depthWrite: false }),
    haze: new THREE.MeshLambertMaterial({ color: "#d8c8a8", transparent: true, opacity: 0.1, depthWrite: false }),
  }), []);
  const hm = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    let ns = 0, nd = 0, nu = 0;
    const start = lowerBound(events, t - 2.0);
    for (let e = start; e < events.length && events[e].t <= t; e++) {
      const ev = events[e];
      const dt = t - ev.t;
      const R = rng(ev.seed);
      if (ev.kind !== "land" && ev.kind !== "hoof") {
        const n = ev.kind === "fatal" ? 26 : ev.kind === "shield" ? 14 : 18;
        for (let k = 0; k < n && ns < SPARK_MAX; k++) {
          const life = 0.22 + R() * 0.4;
          const th = R() * Math.PI * 2, ph = Math.acos(1 - 2 * R()) * 0.85, v = 2.5 + R() * 5;
          if (dt > life) continue;
          const vx = Math.sin(ph) * Math.cos(th) * v, vy = Math.cos(ph) * v * 0.9 + 1, vz = Math.sin(ph) * Math.sin(th) * v;
          const a = dt / life;
          const s = 0.075 * (1 - a * 0.8);
          setTRS(sp.current!, ns, ev.x + vx * dt, ev.y + vy * dt - 4.9 * dt * dt, ev.z + vz * dt, s, s, s * 2.2, th, ph, 0);
          col.setRGB(1.0, lerpN(0.92, 0.42, a), lerpN(0.55, 0.05, a)).multiplyScalar(1 - a * 0.5);
          sp.current!.setColorAt(ns++, col);
        }
        // first-frame flash
        if (dt < 0.07 && ns < SPARK_MAX) { setTRS(sp.current!, ns, ev.x, ev.y, ev.z, 0.35 * (1 - dt / 0.07)); sp.current!.setColorAt(ns++, col.setRGB(1, 0.9, 0.6)); }
      }
      if (ev.kind === "fatal" || ev.kind === "shield") {
        const n = ev.kind === "fatal" ? 12 : 3;
        for (let k = 0; k < n && nd < DEBRIS_MAX; k++) {
          const life = 1.4 + R() * 0.8;
          const th = R() * Math.PI * 2, v = 1.5 + R() * 3;
          if (dt > life) continue;
          const vx = Math.cos(th) * v, vz = Math.sin(th) * v, vy = 2 + R() * 3;
          const s = (0.06 + R() * 0.07) * (1 - Math.max(0, (dt - life + 0.4) / 0.4));
          let y = ev.y + vy * dt - 4.9 * dt * dt;
          const tg = (vy + Math.sqrt(vy * vy + 19.6 * (ev.y - s / 2))) / 9.8;
          const td = Math.min(dt, tg);
          if (y < s / 2) y = s / 2;
          setTRS(db.current!, nd, ev.x + vx * td, y, ev.z + vz * td, s, s, s, td * 7, td * 5, 0);
          db.current!.setColorAt(nd++, col.set(ev.kind === "fatal" ? (k % 3 === 0 ? "#8a8f96" : "#6a5038") : "#7a5a3a"));
        }
      }
      if (ev.kind === "land" || ev.kind === "fatal" || ev.kind === "hoof") {
        const n = ev.kind === "land" ? 16 : ev.kind === "hoof" ? 2 : 5;
        for (let k = 0; k < n && nu < DUST_MAX; k++) {
          const life = 1.3 + R() * 0.9;
          if (dt > life) continue;
          const a = dt / life, th = R() * Math.PI * 2, v = 0.6 + R() * 1.4;
          const out = v * (1 - Math.exp(-dt * 3)) / 3 * 3;
          const s = (0.25 + R() * 0.3) * (0.6 + a * 1.6) * (1 - Math.pow(a, 3));
          setTRS(du.current!, nu++, ev.x + Math.cos(th) * out, (ev.kind === "fatal" ? 0.3 : 0.15) + dt * (0.25 + R() * 0.4), ev.z + Math.sin(th) * out, s, s, s, R(), R(), 0);
        }
      }
    }
    // hoof dust: emitted on a fixed grid of times, so it is the same regardless of frame order
    for (const h of horses) {
      for (let k = Math.floor((t - 1.4) / 0.09); k * 0.09 <= t && nu < DUST_MAX; k++) {
        const te0 = k * 0.09; if (te0 < h.t0) continue;
        const dt = t - te0, R = rng(h.id * 7919 + k), life = 1.2 + R() * 0.4;
        if (dt > life) continue;
        horseRoot(h, te0, hm); tv.setFromMatrixPosition(hm);
        const a = dt / life;
        const s = (0.35 + R() * 0.35) * (0.7 + a * 1.8) * (1 - a * a);
        setTRS(du.current!, nu++, tv.x + (R() - 0.5) * 1.2 - h.dirX * 0.8, 0.2 + dt * 0.5, tv.z + (R() - 0.5) * 1.2, s, s, s, R(), R(), 0);
      }
    }
    // battlefield haze drifting
    for (let i = 0; i < HAZE; i++) {
      const x = ((hash1(i) * bounds * 2 + t * (0.6 + hash1(i + 1))) % (bounds * 2)) - bounds;
      const z = (hash1(i + 2) - 0.5) * bounds * 1.4;
      const s = 3 + hash1(i + 3) * 5;
      setTRS(hz.current!, i, x, 0.8 + hash1(i + 4) * 3, z, s, s * 0.45, s, 0, hash1(i + 5) * 3, 0);
    }
    sp.current!.count = ns; db.current!.count = nd; du.current!.count = nu;
    for (const m of [sp, db, du, hz]) { m.current!.instanceMatrix.needsUpdate = true; if (m.current!.instanceColor) m.current!.instanceColor.needsUpdate = true; }
  }, [t, events, horses, bounds, col, hm]);

  return (
    <>
      <instancedMesh ref={sp} args={[BOX, mats.spark, SPARK_MAX]} frustumCulled={false} renderOrder={5} />
      <instancedMesh ref={db} args={[BOX, mats.debris, DEBRIS_MAX]} frustumCulled={false} castShadow />
      <instancedMesh ref={du} args={[BOX, mats.dust, DUST_MAX]} frustumCulled={false} renderOrder={3} />
      <instancedMesh ref={hz} args={[BOX, mats.haze, HAZE]} frustumCulled={false} renderOrder={2} />
    </>
  );
};
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

// ------------------------------------------------------------------ banners (cloth waves per frame)
export const Banner: React.FC<{ x: number; z: number; side: "geo" | "qaj"; t: number; height?: number; phase?: number }> = ({ x, z, side, t, height = 5.5, phase = 0 }) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(1.8, 1.25, 18, 8), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ map: bannerTex(side), side: THREE.DoubleSide }), [side]);
  const pole = useMemo(() => new THREE.MeshLambertMaterial({ map: wood() }), []);
  useLayoutEffect(() => {
    const p = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < p.length; i += 3) {
      const u = (base[i] + 0.9) / 1.8;           // 0 at pole
      const w = Math.sin(u * 5 - (t + phase) * 6) * 0.22 * u + Math.sin(u * 9 - (t + phase) * 9.5 + base[i + 1] * 2) * 0.06 * u;
      p[i] = base[i]; p[i + 1] = base[i + 1] - u * u * 0.15; p[i + 2] = w;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }, [t, geo, base, phase]);
  const bob = 0.05 * Math.sin((t + phase) * 3);
  return (
    <group position={[x, bob, z]}>
      <mesh material={pole} position={[0, height / 2, 0]} scale={[0.12, height, 0.12]} castShadow><boxGeometry /></mesh>
      <mesh material={pole} position={[0, height + 0.1, 0]} scale={[0.22, 0.22, 0.22]}><boxGeometry /></mesh>
      <mesh geometry={geo} material={mat} position={[0.95, height - 0.75, 0]} castShadow />
    </group>
  );
};
