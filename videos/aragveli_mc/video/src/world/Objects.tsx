import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { TerrainData } from "./data";
import { objectMaterial, ObjKind } from "./materials";
import { aragviSettlements, Box, city as buildCity, Kind, vegetation } from "./objects";

const cityCache = new WeakMap<TerrainData, ReturnType<typeof buildCity>>();
const city = (d: TerrainData) => { if (!cityCache.has(d)) cityCache.set(d, buildCity(d)); return cityCache.get(d)!; };

const BOXG = new THREE.BoxGeometry(1, 1, 1);
const MATS = new Map<string, THREE.Material>();
const matFor = (k: Kind) => {
  if (!MATS.has(k)) {
    const map: Record<Kind, [ObjKind, number?]> = {
      trunk: ["trunk"], leaves: ["leaves", 0.35], vine: ["leaves", 0.12], grass: ["leaves", 0.25], plaster: ["plaster"],
      roof: ["roof"], stone: ["stone"], tuff: ["tuff"], tile: ["tile"], wood: ["wood"],
    };
    const [kind, wind] = map[k];
    MATS.set(k, objectMaterial(kind, { wind }));
  }
  return MATS.get(k)!;
};

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();

export const Boxes: React.FC<{ kind: Kind; boxes: Box[]; burn?: (b: Box) => number; shadows?: boolean }> = ({ kind, boxes, burn, shadows = true }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", BOXG.attributes.position); g.setAttribute("normal", BOXG.attributes.normal); g.setAttribute("uv", BOXG.attributes.uv);
    g.setIndex(BOXG.index);
    g.setAttribute("aBurn", new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, boxes.length)), 1));
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(Float32Array.from(boxes.length ? boxes.map((b) => b.seed ?? 0) : [0]), 1));
    return g;
  }, [boxes]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current!; if (!boxes.length) return;
    boxes.forEach((b, i) => {
      _q.setFromEuler(_e.set(0, b.ry ?? 0, 0));
      _m.compose(_p.set(b.x, b.y, b.z), _q, _s.set(b.sx, b.sy, b.sz));
      m.setMatrixAt(i, _m);
      if (b.color) m.setColorAt(i, b.color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [boxes]);
  useLayoutEffect(() => {
    if (!burn || !boxes.length) return;
    const a = geo.getAttribute("aBurn") as THREE.InstancedBufferAttribute;
    boxes.forEach((b, i) => { a.array[i] = burn(b); });
    a.needsUpdate = true;
  });
  if (!boxes.length) return null;
  return <instancedMesh ref={ref} args={[geo, matFor(kind), boxes.length]} castShadow={shadows} receiveShadow />;
};

const KINDS: Kind[] = ["trunk", "leaves", "plaster", "roof", "stone", "tuff", "tile", "wood", "vine", "grass"];

/** Vegetation around the camera: trees in 160 m areas within `radius`, vines within 450 m, grass within 60 m. */
export const Vegetation: React.FC<{ data: TerrainData; cam: THREE.Vector3; radius?: number; grass?: boolean }> = ({ data, cam, radius = 1800, grass = true }) => {
  const A = 160;
  const ax = Math.floor(cam.x / A), az = Math.floor(cam.z / A);
  const R = Math.ceil(radius / A);
  const key = `${ax}:${az}:${R}`;
  const sets = useMemo(() => {
    const merged: Record<Kind, Box[]> = { trunk: [], leaves: [], plaster: [], roof: [], stone: [], tuff: [], tile: [], wood: [], vine: [], grass: [] };
    for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
      const ox = (ax + j) * A, oz = (az + i) * A;
      const dist = Math.hypot(Math.max(0, Math.abs(cam.x - (ox + A / 2)) - A / 2), Math.max(0, Math.abs(cam.z - (oz + A / 2)) - A / 2));
      if (dist > radius) continue;
      const v = vegCache(data, ox, oz, A, dist < 450);
      for (const k of KINDS) if (k !== "grass") merged[k].push(...v[k]);
    }
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, key]);
  const G = 20;
  const gk = `${Math.floor(cam.x / G)}:${Math.floor(cam.z / G)}`;
  const grassBoxes = useMemo(() => {
    if (!grass || cam.y - data.surface(cam.x, cam.z) > 60) return [] as Box[];
    const out: Box[] = [];
    const gx = Math.floor(cam.x / G), gz = Math.floor(cam.z / G);
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
      const v = vegCache(data, (gx + j) * G, (gz + i) * G, G, true, true);
      out.push(...v.grass);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, gk, grass, cam.y > data.surface(cam.x, cam.z) + 60]);
  return (
    <>
      {KINDS.filter((k) => k !== "grass").map((k) => <Boxes key={k + key} kind={k} boxes={sets[k]} shadows={k !== "vine"} />)}
      <Boxes key={"grass" + gk} kind="grass" boxes={grassBoxes} shadows={false} />
    </>
  );
};

const vcache = new Map<string, ReturnType<typeof vegetation>>();
function vegCache(d: TerrainData, ox: number, oz: number, size: number, vines: boolean, grass = false) {
  const k = `${d.meta.name}:${ox}:${oz}:${size}:${vines}:${grass}`;
  if (!vcache.has(k)) {
    if (vcache.size > 4000) vcache.delete(vcache.keys().next().value!);
    vcache.set(k, vegetation(d, ox, oz, size, { grass, vines }));
  }
  return vcache.get(k)!;
}

/** Old Tbilisi, intact or burning (burn in 0..1 spreads through the city by house seed). */
export const City: React.FC<{ data: TerrainData; burn: number }> = ({ data, burn }) => {
  const c = useMemo(() => city(data), [data]);
  const f = (b: Box) => Math.max(0, Math.min(1, burn * 1.8 - ((b.seed ?? 0) % 1) * 0.8));
  return (
    <>
      {KINDS.map((k) => <Boxes key={k} kind={k} boxes={c[k]} burn={k === "plaster" || k === "roof" || k === "wood" || k === "stone" || k === "tile" ? f : undefined} />)}
    </>
  );
};

export const AragviSettlements: React.FC<{ data: TerrainData }> = ({ data }) => {
  const s = useMemo(() => aragviSettlements(data), [data]);
  return <>{KINDS.map((k) => <Boxes key={k} kind={k} boxes={s[k]} />)}</>;
};

/** Burning-house anchor points (roof centres) for fire/smoke emitters. */
export function burningHouses(data: TerrainData, burn: number, max = 160) {
  const c = city(data);
  return c.roof.filter((b) => ((b.seed ?? 0) % 1) * 0.8 < burn * 1.8 - 0.3).slice(0, max).map((b) => new THREE.Vector3(b.x, b.y, b.z));
}
