import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { particleMaterial } from "../world/materials";
import { Blend, collect, Emitter, Particle } from "./particles";

const BOX = new THREE.BoxGeometry(1, 1, 1);
const MAX = { alpha: 16000, additive: 9000 };

function geo(n: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", BOX.attributes.position); g.setAttribute("normal", BOX.attributes.normal); g.setAttribute("uv", BOX.attributes.uv);
  g.setIndex(BOX.index);
  g.setAttribute("aAlpha", new THREE.InstancedBufferAttribute(new Float32Array(n), 1));
  return g;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();

export const Particles: React.FC<{ emitters: Emitter[]; t: number; wind: THREE.Vector2 }> = ({ emitters, t, wind }) => {
  const refs = { alpha: useRef<THREE.InstancedMesh>(null), additive: useRef<THREE.InstancedMesh>(null) };
  const parts = useMemo(() => ({
    alpha: { g: geo(MAX.alpha), m: particleMaterial("alpha") },
    additive: { g: geo(MAX.additive), m: particleMaterial("additive") },
  }), []);
  useLayoutEffect(() => {
    for (const b of ["alpha", "additive"] as const) {
      const mesh = refs[b].current!;
      if (!mesh.instanceColor) mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX[b] * 3), 3);
    }
    const n = { alpha: 0, additive: 0 };
    const sink = (b: Blend, p: Particle) => {
      const mesh = refs[b].current!; const i = n[b]++;
      _q.setFromEuler(_e.set(p.r * 0.3, p.r, p.r * 0.2));
      _m.compose(_p.set(p.x, p.y, p.z), _q, _s.set(p.s, p.sy, p.s));
      mesh.setMatrixAt(i, _m); mesh.setColorAt(i, p.c);
      (parts[b].g.getAttribute("aAlpha").array as Float32Array)[i] = p.a;
    };
    collect(emitters, t, wind, sink, MAX);
    for (const b of ["alpha", "additive"] as const) {
      const mesh = refs[b].current!; mesh.count = n[b];
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      parts[b].g.getAttribute("aAlpha").needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh ref={refs.alpha} args={[parts.alpha.g, parts.alpha.m, MAX.alpha]} frustumCulled={false} renderOrder={4} />
      <instancedMesh ref={refs.additive} args={[parts.additive.g, parts.additive.m, MAX.additive]} frustumCulled={false} renderOrder={5} />
    </>
  );
};
