import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { hideSoldier, HorsePart, Horse, PartName, Pose, Soldier, soldierPose, writeHorse, writeSoldier } from "./rig";
import { chokhaTex, faceTex, hairTex, horseTex, metalTex, noiseTex, shieldTex, tunicTex, wood } from "./textures";

const BOX = new THREE.BoxGeometry(1, 1, 1);

function lambert(map: THREE.Texture, extra: Partial<THREE.MeshLambertMaterialParameters> = {}) {
  return new THREE.MeshLambertMaterial({ map, ...extra });
}

type PartSpec = { name: PartName; mat: THREE.Material | THREE.Material[]; color: (s: Soldier) => THREE.Color };

const STEEL = new THREE.Color("#c9ced4");
const HILT = new THREE.Color("#5a3b22");
const WOOD = new THREE.Color("#9a7448");
const GEO_SHIELDS = ["#7a2620", "#5a3a22", "#6b1c1c", "#8a6a3a"].map((c) => new THREE.Color(c));
const QAJ_SHIELDS = ["#2d5a3a", "#6a5a2a", "#2a4a6a", "#7a6a3a"].map((c) => new THREE.Color(c));

/** hide: soldiers standing within radius r of (x, z) are not drawn (keeps close-up cameras clear), except ids in keep. */
export type Hide = { x: number; z: number; r: number; keep?: number[] } | null;

export const Soldiers: React.FC<{ soldiers: Soldier[]; horses: Horse[]; t: number; side: 0 | 1; hide?: Hide }> = ({ soldiers, horses, t, side, hide = null }) => {
  const list = useMemo(() => soldiers.filter((s) => s.side === side), [soldiers, side]);
  const specs = useMemo<PartSpec[]>(() => {
    const skin = noiseTex("skin", 0.9, 1.0);
    const head = [hairTex(), hairTex(), noiseTex("hairtop", 0.28, 0.38), noiseTex("chin", 0.85, 0.95), faceTex(true), hairTex()].map((m) => lambert(m));
    void skin;
    const coatTex = side === 0 ? chokhaTex() : tunicTex();
    return [
      { name: "legL", mat: lambert(noiseTex("cloth", 0.75, 1)), color: (s) => s.pants },
      { name: "legR", mat: lambert(noiseTex("cloth", 0.75, 1)), color: (s) => s.pants },
      { name: "torso", mat: lambert(coatTex), color: (s) => s.coat },
      { name: "head", mat: head, color: (s) => s.skin },
      { name: "helm", mat: lambert(noiseTex("hat", 0.7, 1)), color: (s) => s.helm },
      { name: "spike", mat: lambert(metalTex()), color: (s) => s.helm },
      { name: "armL", mat: lambert(noiseTex("sleeve", 0.78, 1)), color: (s) => s.coat },
      { name: "armR", mat: lambert(noiseTex("sleeve", 0.78, 1)), color: (s) => s.coat },
      { name: "blade", mat: lambert(metalTex(), { emissive: new THREE.Color("#222") }), color: () => STEEL },
      { name: "guardX", mat: lambert(metalTex()), color: () => new THREE.Color("#b8973a") },
      { name: "hilt", mat: lambert(noiseTex("hilt", 0.7, 1)), color: () => HILT },
      { name: "spear", mat: lambert(wood()), color: () => WOOD },
      { name: "shield", mat: lambert(shieldTex(side === 0 ? "geo" : "qaj")), color: (s) => (side === 0 ? GEO_SHIELDS : QAJ_SHIELDS)[s.id % 4] },
    ];
  }, [side]);

  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const pose = useMemo<Pose>(() => ({ m: new THREE.Matrix4() } as Pose), []);

  useLayoutEffect(() => {
    specs.forEach((sp, k) => {
      const mesh = refs.current[k]; if (!mesh) return;
      list.forEach((s, i) => mesh.setColorAt(i, sp.color(s)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [list, specs]);

  useLayoutEffect(() => {
    const arrays = {} as Record<PartName, Float32Array>;
    specs.forEach((sp, k) => { arrays[sp.name] = refs.current[k]!.instanceMatrix.array as Float32Array; });
    list.forEach((s, i) => {
      if (hide && Math.hypot(s.x - hide.x, s.z - hide.z) < hide.r && !hide.keep?.includes(s.id)) { hideSoldier(i, arrays); return; }
      soldierPose(s, t, horses, pose); writeSoldier(s, pose, i, arrays);
    });
    refs.current.forEach((m) => { if (m) m.instanceMatrix.needsUpdate = true; });
  }, [t, list, specs, horses, pose, hide]);

  return (
    <>
      {specs.map((sp, k) => (
        <instancedMesh key={sp.name} ref={(m) => { refs.current[k] = m; }} args={[BOX, sp.mat, list.length]} frustumCulled={false} castShadow receiveShadow />
      ))}
    </>
  );
};

const HORSE_PARTS: HorsePart[] = ["hbody", "hneck", "hhead", "hmane", "hlegFL", "hlegFR", "hlegBL", "hlegBR", "htail"];

export const Horses: React.FC<{ horses: Horse[]; t: number }> = ({ horses, t }) => {
  const mats = useMemo(() => ({ coat: lambert(horseTex()), dark: lambert(noiseTex("mane", 0.6, 0.9)) }), []);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  useLayoutEffect(() => {
    HORSE_PARTS.forEach((n, k) => {
      const mesh = refs.current[k]; if (!mesh) return;
      horses.forEach((h, i) => mesh.setColorAt(i, n === "hmane" || n === "htail" ? new THREE.Color("#1c1612") : h.color));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [horses]);
  useLayoutEffect(() => {
    const arrays = {} as Record<HorsePart, Float32Array>;
    HORSE_PARTS.forEach((n, k) => { arrays[n] = refs.current[k]!.instanceMatrix.array as Float32Array; });
    horses.forEach((h, i) => writeHorse(h, t, i, arrays));
    refs.current.forEach((m) => { if (m) m.instanceMatrix.needsUpdate = true; });
  }, [t, horses]);
  if (!horses.length) return null;
  return (
    <>
      {HORSE_PARTS.map((n, k) => (
        <instancedMesh key={n} ref={(m) => { refs.current[k] = m; }} args={[BOX, n === "hmane" || n === "htail" ? mats.dark : mats.coat, horses.length]} frustumCulled={false} castShadow />
      ))}
    </>
  );
};
