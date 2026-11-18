// One-frame proof of the new look: a 1 m-block film set on the real Krtsanisi slope, with the old
// LOD terrain only as a distant backdrop. No characters (stage 1 rules).
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { applyCamera, CamState } from "../camera/rig";
import { PRESETS } from "../config/presets";
import { windDust } from "../fx/particles";
import { Particles } from "../fx/Particles";
import { Post } from "../fx/Post";
import { Atmosphere, sunDir } from "../world/Atmosphere";
import { TerrainData, useTerrain } from "../world/data";
import { patch } from "../world/materials";
import { Vegetation } from "../world/Objects";
import { Terrain } from "../world/Terrain";
import { HOLE } from "../world/terrainGen";
import { getAtlas } from "../world2/atlas";
import { meshChunk, spriteGeometry, VoxelSet } from "../world2/set";

const SET = { cx: 1600, cz: 900, size: 384, hero: [[1505, 806]] as [number, number][], clear: [[1470, 768, 40], [1440, 740, 30], [1560, 880, 60]] as [number, number, number][] };

export const SetProof: React.FC<{ shot?: "medium" | "wide" | "low" }> = ({ shot = "medium" }) => {
  const data = useTerrain("tbilisi");
  if (!data) return <AbsoluteFill style={{ background: "#000" }} />;
  return <Inner data={data} shot={shot} />;
};

const SHOTS: Record<string, { pos: [number, number, number]; look: [number, number, number]; lens: number; focus: number; fstop: number }> = {
  medium: { pos: [1470, 1.7, 768], look: [1560, 6, 880], lens: 35, focus: 52, fstop: 2.8 },
  wide: { pos: [1440, 14, 740], look: [1720, 2, 1020], lens: 24, focus: 120, fstop: 8 },
  low: { pos: [1492, 0.45, 794], look: [1515, 3, 812], lens: 24, focus: 12, fstop: 2.0 },
};

const Inner: React.FC<{ data: TerrainData; shot: string }> = ({ data, shot }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  HOLE.r = { x0: SET.cx - SET.size / 2 + 8, z0: SET.cz - SET.size / 2 + 8, x1: SET.cx + SET.size / 2 - 8, z1: SET.cz + SET.size / 2 - 8 };
  const set = useMemo(() => new VoxelSet(data, SET), [data]);
  const preset = PRESETS.goldenHour;
  const s = SHOTS[shot];
  const pos = new THREE.Vector3(s.pos[0], set.groundY(s.pos[0], s.pos[2]) + s.pos[1], s.pos[2]);
  const target = new THREE.Vector3(s.look[0], set.groundY(s.look[0], s.look[2]) + s.look[1], s.look[2]);
  const cs: CamState = { pos, target, lens: s.lens, roll: 0, focus: s.focus, fstop: s.fstop, yawOffset: 0, pitchOffset: 0, motion: [0, 0] };
  const wa = THREE.MathUtils.degToRad(preset.wind.dir);
  const wind = useMemo(() => new THREE.Vector2(Math.sin(wa), -Math.cos(wa)), [wa]);
  const emitters = windDust(10, () => target.clone(), 70, preset.particles.windDust, (x, z) => set.groundY(x, z));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: false, alpha: false }} camera={{ fov: 40, near: 0.1, far: 40000 }}>
        <Cam cs={cs} />
        <Atmosphere preset={preset} t={frame / 24} focus={target} fogBase={set.baseY + 20} shadowSize={110} shadowRes={4096} />
        <SetMesh set={set} />
        <Terrain data={data} cam={pos} lodK={2.0} />
        <Vegetation data={data} cam={pos} radius={1600} grass={false} />
        <Particles emitters={emitters} t={frame / 24 + 3} wind={wind} />
        <Post s={{ preset, focusDist: cs.focus, fstop: cs.fstop, focalMM: cs.lens, letterbox: 2.39, heat: 0, frame, sunDir: sunDir(preset.sun.elevation, preset.sun.azimuth) }} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const Cam: React.FC<{ cs: CamState }> = ({ cs }) => {
  const { camera, size } = useThree();
  useLayoutEffect(() => { (camera as THREE.PerspectiveCamera).near = 0.1; applyCamera(camera as THREE.PerspectiveCamera, cs, size.width / size.height); });
  return null;
};

const SetMesh: React.FC<{ set: VoxelSet }> = ({ set }) => {
  const group = useMemo(() => {
    const atlas = getAtlas();
    const solid = patch(new THREE.MeshLambertMaterial({ map: atlas, vertexColors: true }), {});
    const leaf = patch(new THREE.MeshLambertMaterial({ map: atlas, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), { emissive: "totalEmissiveRadiance += diffuseColor.rgb * .12;" });
    const sprite = patch(new THREE.MeshLambertMaterial({ map: atlas, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), { emissive: "totalEmissiveRadiance += diffuseColor.rgb * .08;" });
    const g = new THREE.Group();
    for (let oz = 0; oz < set.S; oz += 32) for (let ox = 0; ox < set.S; ox += 32) {
      const m = meshChunk(set, ox, oz);
      const a = new THREE.Mesh(m.solid, solid); a.castShadow = a.receiveShadow = true; g.add(a);
      if (m.leaves.index && m.leaves.index.count) { const b = new THREE.Mesh(m.leaves, leaf); b.castShadow = b.receiveShadow = true; g.add(b); }
    }
    const sp = new THREE.Mesh(spriteGeometry(set), sprite); sp.receiveShadow = true; g.add(sp);
    return g;
  }, [set]);
  return <primitive object={group} />;
};
