import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { TerrainData } from "./data";
import { terrainMaterial, waterMaterial } from "./materials";
import { buildTile, QUAD, selectTiles, TileGeom } from "./terrain";

const TMAT = terrainMaterial();
const WMAT = waterMaterial();

function makeMesh(t: TileGeom, water: boolean) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", QUAD.attributes.position); g.setAttribute("normal", QUAD.attributes.normal); g.setAttribute("uv", QUAD.attributes.uv);
  g.setIndex(QUAD.index);
  const count = water ? t.water.count : t.count;
  if (!water) {
    g.setAttribute("aType", new THREE.InstancedBufferAttribute(t.types, 1));
    g.setAttribute("aTop", new THREE.InstancedBufferAttribute(t.tops, 1));
  }
  const m = new THREE.InstancedMesh(g, water ? WMAT : TMAT, count);
  m.instanceMatrix = new THREE.InstancedBufferAttribute(water ? t.water.matrices : t.matrices, 16);
  m.boundingSphere = new THREE.Sphere(t.center, t.radius);
  m.geometry.boundingSphere = new THREE.Sphere(t.center, t.radius);
  m.receiveShadow = !water;
  m.name = t.key + (water ? ":w" : "");
  return m;
}

/** LOD terrain around `cam`. Tiles are cached; meshes are swapped in/out as the camera moves. */
export const Terrain: React.FC<{ data: TerrainData; cam: THREE.Vector3; lodK?: number; shadowLevels?: number }> = ({ data, cam, lodK = 1.7, shadowLevels = 1 }) => {
  const group = useMemo(() => new THREE.Group(), []);
  const live = useMemo(() => new Map<string, THREE.InstancedMesh[]>(), []);
  useLayoutEffect(() => {
    const want = selectTiles(data, cam, { k: lodK });
    const keep = new Set<string>();
    for (const w of want) {
      const t = buildTile(data, w.L, w.ox, w.oz);
      keep.add(t.key);
      if (!live.has(t.key)) {
        const ms = [makeMesh(t, false)];
        if (t.water.count) ms.push(makeMesh(t, true));
        ms[0].castShadow = w.L <= shadowLevels;
        ms.forEach((m) => group.add(m));
        live.set(t.key, ms);
      }
    }
    for (const [k, ms] of live) if (!keep.has(k)) { ms.forEach((m) => { group.remove(m); m.geometry.dispose(); }); live.delete(k); }
  });
  return <primitive object={group} />;
};
