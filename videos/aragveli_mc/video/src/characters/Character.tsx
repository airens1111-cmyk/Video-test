// Voxel character built from a 64x64 skin (base + overlay layer) plus an optional tall-hat accessory.
// 1 skin pixel = 1/16 m, so a character is 2 m tall (2 blocks).
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { drawFace, Expr, FaceParams, faceAt, FaceTrack } from "./Face";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";

const PX = 1 / 16;
type Rect = [number, number, number, number];

function faceRects(ox: number, oy: number, w: number, h: number, d: number): Record<string, Rect> {
  return {
    top: [ox + d, oy, w, d], bottom: [ox + d + w, oy, w, d], right: [ox, oy + d, d, h],
    front: [ox + d, oy + d, w, h], left: [ox + d + w, oy + d, d, h], back: [ox + 2 * d + w, oy + d, w, h],
  };
}

/** Box geometry (w,h,d in px, centred) with skin UVs from the unwrap at (ox, oy). inflate in px. */
export function skinBox(w: number, h: number, d: number, ox: number, oy: number, texW = 64, texH = 64, inflate = 0) {
  const R = faceRects(ox, oy, w, h, d);
  const W = (w / 2 + inflate) * PX, H = (h / 2 + inflate) * PX, D = (d / 2 + inflate) * PX;
  type V = [number, number, number];
  // corners listed TL, TR, BR, BL as the face is seen from outside, with the texture upright
  const F: [string, V, V, V, V, V][] = [
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
    for (const [p, t] of [[tl, [u0, v0]], [tr, [u1, v0]], [br, [u1, v1]], [bl, [u0, v1]]] as [V, number[]][]) { pos.push(...p); nor.push(...n); uv.push(...t); }
    idx.push(b, b + 3, b + 2, b, b + 2, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

const PARTS = {
  head: { size: [8, 8, 8], base: [0, 0], over: [32, 0], inflate: 0.5, pos: [0, 28, 0], pivot: [0, 24, 0] },
  body: { size: [8, 12, 4], base: [16, 16], over: [16, 32], inflate: 0.25, pos: [0, 18, 0], pivot: [0, 18, 0] },
  rarm: { size: [4, 12, 4], base: [40, 16], over: [40, 32], inflate: 0.25, pos: [-6, 18, 0], pivot: [-6, 22, 0] },
  larm: { size: [4, 12, 4], base: [32, 48], over: [48, 48], inflate: 0.25, pos: [6, 18, 0], pivot: [6, 22, 0] },
  rleg: { size: [4, 12, 4], base: [0, 16], over: [0, 32], inflate: 0.25, pos: [-2, 6, 0], pivot: [-2, 12, 0] },
  lleg: { size: [4, 12, 4], base: [16, 48], over: [0, 48], inflate: 0.25, pos: [2, 6, 0], pivot: [2, 12, 0] },
} as const;
export type PartName = keyof typeof PARTS;

export interface SkinMeta { id: string; name: string; basis: string; acc: { hat?: { size: [number, number, number]; uv: [number, number] } }; face: FaceParams }
export interface Pose { [k: string]: [number, number, number] | undefined }   // part -> euler (rad) around its pivot

const texCache = new Map<string, Promise<THREE.Texture>>();
function loadTex(file: string) {
  if (!texCache.has(file)) texCache.set(file, new Promise((res, rej) => new THREE.TextureLoader().load(staticFile(file), (t) => {
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; res(t);
  }, undefined, rej)));
  return texCache.get(file)!;
}

export function useSkins() {
  const [state, setState] = useState<{ meta: SkinMeta[]; tex: Record<string, { skin: THREE.Texture; acc?: THREE.Texture }> } | null>(null);
  const [h] = useState(() => delayRender("skins"));
  useEffect(() => {
    (async () => {
      const meta: SkinMeta[] = await (await fetch(staticFile("skins/skins.json"))).json();
      const tex: Record<string, { skin: THREE.Texture; acc?: THREE.Texture }> = {};
      for (const m of meta) tex[m.id] = { skin: await loadTex(`skins/${m.id}.png`), acc: m.acc.hat ? await loadTex(`skins/${m.id}_acc.png`) : undefined };
      setState({ meta, tex }); continueRender(h);
    })();
  }, [h]);
  return state;
}

export const Character: React.FC<{ meta: SkinMeta; skin: THREE.Texture; acc?: THREE.Texture; position: [number, number, number]; yaw?: number; pose?: Pose; debug?: string; fill?: number;
  face?: FaceTrack; t?: number; expr?: Partial<Expr>; headOnly?: boolean }> = ({ meta, skin, acc, position, yaw = 0, pose = {}, debug = "", fill = 0, face, t = 0, expr, headOnly = false }) => {
  // fill: soft self-illumination from the skin itself, a stand-in for the bounced light of a path tracer
  const mats = useMemo(() => {
    const mk = (map: THREE.Texture, extra: Partial<THREE.MeshLambertMaterialParameters> = {}) =>
      new THREE.MeshLambertMaterial({ map, alphaTest: 0.5, emissiveMap: fill > 0 ? map : null, emissive: new THREE.Color(fill, fill, fill), ...extra });
    return { base: mk(skin), over: mk(skin, { side: THREE.DoubleSide }), acc: acc ? mk(acc) : null };
  }, [skin, acc, fill]);
  const geos = useMemo(() => {
    const out: Record<string, { base: THREE.BufferGeometry; over: THREE.BufferGeometry }> = {};
    for (const [k, p] of Object.entries(PARTS)) {
      out[k] = { base: skinBox(p.size[0], p.size[1], p.size[2], p.base[0], p.base[1]), over: skinBox(p.size[0], p.size[1], p.size[2], p.over[0], p.over[1], 64, 64, p.inflate) };
    }
    return out;
  }, []);
  // animated face: two 8x8 canvases (eyes+brows under the hat/beard layer, mouth over it)
  const fc = useMemo(() => {
    const mk = () => { const c = document.createElement("canvas"); c.width = c.height = 8; const tx = new THREE.CanvasTexture(c);
      tx.magFilter = THREE.NearestFilter; tx.minFilter = THREE.NearestFilter; tx.generateMipmaps = false; tx.colorSpace = THREE.SRGBColorSpace; return { c, g: c.getContext("2d")!, tx }; };
    const eyes = mk(), mouth = mk();
    const mat = (tx: THREE.Texture) => new THREE.MeshLambertMaterial({ map: tx, alphaTest: 0.5, transparent: false, emissiveMap: fill > 0 ? tx : null, emissive: new THREE.Color(fill, fill, fill), polygonOffset: true, polygonOffsetFactor: -1 });
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
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {Object.entries(PARTS).filter(([k]) => !headOnly || k === "head").map(([k, p]) => {
        const r = pose[k] ?? [0, 0, 0];
        const off = [(p.pos[0] - p.pivot[0]) * PX, (p.pos[1] - p.pivot[1]) * PX, (p.pos[2] - p.pivot[2]) * PX] as const;
        return (
          <group key={k} position={[p.pivot[0] * PX, p.pivot[1] * PX, p.pivot[2] * PX]} rotation={r}>
            <mesh geometry={geos[k].base} material={mats.base} position={off as unknown as [number, number, number]} castShadow receiveShadow />
            {debug.includes("noover") ? null : <mesh geometry={geos[k].over} material={mats.over} position={off as unknown as [number, number, number]} castShadow />}
            {k === "head" ? (
              <>
                <mesh geometry={fc.plane} material={fc.eyesMat} position={[0, off[1], 4.2 * PX]} />
                <mesh geometry={fc.plane} material={fc.mouthMat} position={[0, off[1], 4.62 * PX]} />
              </>
            ) : null}
            {k === "head" && hatGeo && mats.acc ? (
              <mesh geometry={hatGeo} material={mats.acc} position={[0, off[1] + (4 + hat!.size[1] / 2 - 1.2) * PX, 0]} castShadow />
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

/** A relaxed standing pose with small per-character variation. */
export function standPose(seed: number): Pose {
  const r = (k: number) => { const s = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s) - 0.5; };
  return {
    head: [r(1) * 0.15, r(2) * 0.35, 0],
    rarm: [r(3) * 0.25, 0, -0.08 - r(4) * 0.06],
    larm: [r(5) * 0.25, 0, 0.08 + r(6) * 0.06],
    rleg: [r(7) * 0.1, 0, -0.02],
    lleg: [-r(7) * 0.1, 0, 0.02],
  };
}
