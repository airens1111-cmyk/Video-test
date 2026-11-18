// Voxel character from a 64x64 skin (base + overlay) with a bendy rig: hips -> torso -> head / arms (shoulder + elbow),
// legs (hip + knee), animated 16x16 face, tall-hat accessory and an extruded pixel item in the right hand.
// 1 skin pixel = 1/16 m, a character is 2 m tall.
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { drawFace, Expr, FACE_RES, FaceParams, faceAt, FaceTrack } from "./Face";

export const PX = 1 / 16;
type Rect = [number, number, number, number];
type V3 = [number, number, number];

function faceRects(ox: number, oy: number, w: number, h: number, d: number): Record<string, Rect> {
  return {
    top: [ox + d, oy, w, d], bottom: [ox + d + w, oy, w, d], right: [ox, oy + d, d, h],
    front: [ox + d, oy + d, w, h], left: [ox + d + w, oy + d, d, h], back: [ox + 2 * d + w, oy + d, w, h],
  };
}

/** Box (w,h,d px, centred) with skin UVs; rows [r0, r0+rn) of the side faces only (for limb halves). */
export function skinBox(w: number, h: number, d: number, ox: number, oy: number, texW = 64, texH = 64, inflate = 0, r0 = 0, rn = h) {
  const R = faceRects(ox, oy, w, h, d);
  for (const k of ["right", "front", "left", "back"]) R[k] = [R[k][0], R[k][1] + r0, R[k][2], rn];
  const W = (w / 2 + inflate) * PX, H = (rn / 2 + inflate) * PX, D = (d / 2 + inflate) * PX;
  const F: [string, V3, V3, V3, V3, V3][] = [
    ["front", [0, 0, 1], [-W, H, D], [W, H, D], [W, -H, D], [-W, -H, D]],
    ["back", [0, 0, -1], [W, H, -D], [-W, H, -D], [-W, -H, -D], [W, -H, -D]],
    ["right", [-1, 0, 0], [-W, H, -D], [-W, H, D], [-W, -H, D], [-W, -H, -D]],
    ["left", [1, 0, 0], [W, H, D], [W, H, -D], [W, -H, -D], [W, -H, D]],
    ["top", [0, 1, 0], [-W, H, -D], [W, H, -D], [W, H, D], [-W, H, D]],
    ["bottom", [0, -1, 0], [-W, -H, D], [W, -H, D], [W, -H, -D], [-W, -H, -D]],
  ];
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  for (const [name, n, tl, tr, br, bl] of F) {
    const [x0, y0, fw, fh] = R[name];
    const e = 0.001;
    const u0 = (x0 + e) / texW, u1 = (x0 + fw - e) / texW, v0 = 1 - (y0 + e) / texH, v1 = 1 - (y0 + fh - e) / texH;
    const b = pos.length / 3;
    for (const [p, t] of [[tl, [u0, v0]], [tr, [u1, v0]], [br, [u1, v1]], [bl, [u0, v1]]] as [V3, number[]][]) { pos.push(...p); nor.push(...n); uv.push(...t); }
    idx.push(b, b + 3, b + 2, b, b + 2, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

const SEG = {   // unwrap origins (base, overlay) and box sizes
  head: { size: [8, 8, 8], base: [0, 0], over: [32, 0], inflate: 0.5 },
  body: { size: [8, 12, 4], base: [16, 16], over: [16, 32], inflate: 0.25 },
  rarm: { size: [4, 12, 4], base: [40, 16], over: [40, 32], inflate: 0.25 },
  larm: { size: [4, 12, 4], base: [32, 48], over: [48, 48], inflate: 0.25 },
  rleg: { size: [4, 12, 4], base: [0, 16], over: [0, 32], inflate: 0.25 },
  lleg: { size: [4, 12, 4], base: [16, 48], over: [0, 48], inflate: 0.25 },
} as const;

export interface SkinMeta { id: string; name: string; basis: string; acc: { hat?: { size: [number, number, number]; uv: [number, number] } }; face: FaceParams }
/** Joint rotations in radians. root: translation in px (e.g. crouch). item: extra rotation of the held item. */
export interface Pose {
  root?: V3; hips?: V3; torso?: V3; head?: V3;
  rarm?: V3; relbow?: number; larm?: V3; lelbow?: number;
  rleg?: V3; rknee?: number; lleg?: V3; lknee?: number;
  item?: V3;
}

// ------------------------------------------------------------------ textures and items
const texCache = new Map<string, Promise<THREE.Texture>>();
export function loadTex(file: string) {
  if (!texCache.has(file)) texCache.set(file, new Promise((res, rej) => new THREE.TextureLoader().load(staticFile(file), (t) => {
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; res(t);
  }, undefined, rej)));
  return texCache.get(file)!;
}

export interface ItemMeta { id: string; size: number; grip: [number, number]; scale: number }
export interface ItemAsset { meta: ItemMeta; tex: THREE.Texture; geo: THREE.BufferGeometry }

/** Extruded pixel sprite: front/back faces + side walls along every opaque/transparent edge. Grip pixel at the origin. */
export function extrudeSprite(img: HTMLImageElement, meta: ItemMeta) {
  const n = meta.size, c = document.createElement("canvas"); c.width = c.height = n;
  const g = c.getContext("2d")!; g.drawImage(img, 0, 0);
  const a = g.getImageData(0, 0, n, n).data;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && a[(y * n + x) * 4 + 3] > 127;
  const s = PX * meta.scale, t = s * 0.5, [gx, gy] = meta.grip;
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  const quad = (p: V3[], nrm: V3, u: number[][]) => { const b = pos.length / 3; p.forEach((q, k) => { pos.push(...q); nor.push(...nrm); uv.push(...u[k]); }); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  const X = (x: number) => (x - gx - 0.5) * s, Y = (y: number) => (gy + 0.5 - y) * s;
  quad([[X(0), Y(0), t], [X(0), Y(n), t], [X(n), Y(n), t], [X(n), Y(0), t]], [0, 0, 1], [[0, 1], [0, 0], [1, 0], [1, 1]]);
  quad([[X(n), Y(0), -t], [X(n), Y(n), -t], [X(0), Y(n), -t], [X(0), Y(0), -t]], [0, 0, -1], [[1, 1], [1, 0], [0, 0], [0, 1]]);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!solid(x, y)) continue;
    const u = [(x + 0.5) / n, 1 - (y + 0.5) / n];
    const U = [u, u, u, u];
    if (!solid(x, y - 1)) quad([[X(x), Y(y), -t], [X(x), Y(y), t], [X(x + 1), Y(y), t], [X(x + 1), Y(y), -t]], [0, 1, 0], U);
    if (!solid(x, y + 1)) quad([[X(x), Y(y + 1), t], [X(x), Y(y + 1), -t], [X(x + 1), Y(y + 1), -t], [X(x + 1), Y(y + 1), t]], [0, -1, 0], U);
    if (!solid(x - 1, y)) quad([[X(x), Y(y), -t], [X(x), Y(y + 1), -t], [X(x), Y(y + 1), t], [X(x), Y(y), t]], [-1, 0, 0], U);
    if (!solid(x + 1, y)) quad([[X(x + 1), Y(y), t], [X(x + 1), Y(y + 1), t], [X(x + 1), Y(y + 1), -t], [X(x + 1), Y(y), -t]], [1, 0, 0], U);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

export interface SkinSet { meta: SkinMeta[]; tex: Record<string, { skin: THREE.Texture; acc?: THREE.Texture }>; items: Record<string, ItemAsset> }

export function useSkins() {
  const [state, setState] = useState<SkinSet | null>(null);
  const [h] = useState(() => delayRender("skins"));
  useEffect(() => {
    (async () => {
      const meta: SkinMeta[] = await (await fetch(staticFile("skins/skins.json"))).json();
      const tex: SkinSet["tex"] = {};
      for (const m of meta) tex[m.id] = { skin: await loadTex(`skins/${m.id}.png`), acc: m.acc.hat ? await loadTex(`skins/${m.id}_acc.png`) : undefined };
      const items: SkinSet["items"] = {};
      try {
        const im: ItemMeta[] = await (await fetch(staticFile("items/items.json"))).json();
        for (const it of im) { const t = await loadTex(`items/${it.id}.png`); items[it.id] = { meta: it, tex: t, geo: extrudeSprite(t.image as HTMLImageElement, it) }; }
      } catch { /* no items yet */ }
      setState({ meta, tex, items }); continueRender(h);
    })();
  }, [h]);
  return state;
}

// ------------------------------------------------------------------ character
type Mats = { base: THREE.Material; over: THREE.Material };
const Seg: React.FC<{ k: keyof typeof SEG; r0: number; rn: number; y: number; mats: Mats; noOver?: boolean }> = ({ k, r0, rn, y, mats, noOver }) => {
  const s = SEG[k];
  const g = useMemo(() => ({
    base: skinBox(s.size[0], s.size[1], s.size[2], s.base[0], s.base[1], 64, 64, 0, r0, rn),
    over: skinBox(s.size[0], s.size[1], s.size[2], s.over[0], s.over[1], 64, 64, s.inflate, r0, rn),
  }), [s, r0, rn]);
  return (
    <>
      <mesh geometry={g.base} material={mats.base} position={[0, y * PX, 0]} castShadow receiveShadow />
      {noOver ? null : <mesh geometry={g.over} material={mats.over} position={[0, y * PX, 0]} castShadow />}
    </>
  );
};

const r3 = (v?: V3) => (v ?? [0, 0, 0]) as V3;
const P = (x: number, y: number, z = 0): V3 => [x * PX, y * PX, z * PX];

export const Character: React.FC<{
  meta: SkinMeta; skin: THREE.Texture; acc?: THREE.Texture; position: V3; yaw?: number; pose?: Pose; debug?: string; fill?: number;
  face?: FaceTrack; t?: number; expr?: Partial<Expr>; headOnly?: boolean; item?: ItemAsset;
}> = ({ meta, skin, acc, position, yaw = 0, pose = {}, debug = "", fill = 0, face, t = 0, expr, headOnly = false, item }) => {
  const mats = useMemo(() => {
    const mk = (map: THREE.Texture, extra: Partial<THREE.MeshLambertMaterialParameters> = {}) =>
      new THREE.MeshLambertMaterial({ map, alphaTest: 0.5, emissiveMap: fill > 0 ? map : null, emissive: new THREE.Color(fill, fill, fill), ...extra });
    return { base: mk(skin), over: mk(skin, { side: THREE.DoubleSide }), acc: acc ? mk(acc) : null, item: item ? mk(item.tex, { side: THREE.DoubleSide }) : null };
  }, [skin, acc, fill, item]);
  const fc = useMemo(() => {
    const mk = () => { const c = document.createElement("canvas"); c.width = c.height = FACE_RES; const tx = new THREE.CanvasTexture(c);
      tx.magFilter = THREE.NearestFilter; tx.minFilter = THREE.NearestFilter; tx.generateMipmaps = false; tx.colorSpace = THREE.SRGBColorSpace; return { g: c.getContext("2d")!, tx }; };
    const eyes = mk(), mouth = mk();
    const mat = (tx: THREE.Texture) => new THREE.MeshLambertMaterial({ map: tx, alphaTest: 0.5, emissiveMap: fill > 0 ? tx : null, emissive: new THREE.Color(fill, fill, fill), polygonOffset: true, polygonOffsetFactor: -1 });
    return { eyes, mouth, eyesMat: mat(eyes.tx), mouthMat: mat(mouth.tx), plane: new THREE.PlaneGeometry(8 * PX, 8 * PX) };
  }, [fill]);
  useLayoutEffect(() => {
    const st = faceAt(face, t);
    const e = expr ? { ...st.expr, ...expr } : st.expr;
    drawFace(fc.eyes.g, fc.mouth.g, meta.face, e, st.blink, st.talkPhase);
    fc.eyes.tx.needsUpdate = true; fc.mouth.tx.needsUpdate = true;
  });
  const hat = meta.acc.hat;
  const hatGeo = useMemo(() => (hat ? skinBox(hat.size[0], hat.size[1], hat.size[2], hat.uv[0], hat.uv[1], 64, 32, 0) : null), [hat]);
  const noOver = debug.includes("noover");

  const head = (
    <group position={P(0, 12)} rotation={r3(pose.head)}>
      <Seg k="head" r0={0} rn={8} y={4} mats={mats} noOver={noOver} />
      <mesh geometry={fc.plane} material={fc.eyesMat} position={P(0, 4, 4.2)} />
      <mesh geometry={fc.plane} material={fc.mouthMat} position={P(0, 4, 4.62)} />
      {hatGeo && mats.acc ? <mesh geometry={hatGeo} material={mats.acc} position={P(0, 8 + hat!.size[1] / 2 - 1.2)} castShadow /> : null}
    </group>
  );
  if (headOnly) return <group position={position} rotation={[0, yaw, 0]}><group position={P(0, 12)}>{head}</group></group>;

  const arm = (k: "rarm" | "larm", x: number, sh?: V3, elbow = 0, withItem = false) => (
    <group position={P(x, 10)} rotation={r3(sh)}>
      <Seg k={k} r0={0} rn={6} y={-1} mats={mats} noOver={noOver} />
      <group position={P(0, -4)} rotation={[-elbow, 0, 0]}>
        <Seg k={k} r0={6} rn={6} y={-3} mats={mats} noOver={noOver} />
        {withItem && item && mats.item ? (
          <group position={P(0, -5, 0.5)} rotation={[0, -Math.PI / 2, 0]}>
            <group rotation={r3(pose.item)}><mesh geometry={item.geo} material={mats.item} castShadow /></group>
          </group>
        ) : null}
      </group>
    </group>
  );
  const leg = (k: "rleg" | "lleg", x: number, hip?: V3, knee = 0) => (
    <group position={P(x, 0)} rotation={r3(hip)}>
      <Seg k={k} r0={0} rn={6} y={-3} mats={mats} noOver={noOver} />
      <group position={P(0, -6)} rotation={[knee, 0, 0]}>
        <Seg k={k} r0={6} rn={6} y={-3} mats={mats} noOver={noOver} />
      </group>
    </group>
  );
  const root = r3(pose.root);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <group position={P(root[0], 12 + root[1], root[2])} rotation={r3(pose.hips)}>
        {leg("rleg", -2, pose.rleg, pose.rknee)}
        {leg("lleg", 2, pose.lleg, pose.lknee)}
        <group rotation={r3(pose.torso)}>
          <Seg k="body" r0={0} rn={12} y={6} mats={mats} noOver={noOver} />
          {head}
          {arm("rarm", -6, pose.rarm, pose.relbow, true)}
          {arm("larm", 6, pose.larm, pose.lelbow)}
        </group>
      </group>
    </group>
  );
};

/** A relaxed standing pose with small per-character variation. */
export function standPose(seed: number): Pose {
  const r = (k: number) => { const s = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s) - 0.5; };
  return {
    head: [r(1) * 0.15, r(2) * 0.35, 0],
    rarm: [r(3) * 0.25, 0, -0.08 - r(4) * 0.06], relbow: 0.1 + Math.abs(r(8)) * 0.3,
    larm: [r(5) * 0.25, 0, 0.08 + r(6) * 0.06], lelbow: 0.1 + Math.abs(r(9)) * 0.3,
    rleg: [r(7) * 0.1, 0, -0.02], lleg: [-r(7) * 0.1, 0, 0.02], rknee: 0.03, lknee: 0.03,
  };
}
