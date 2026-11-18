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
import { Character, standPose, useSkins } from "../characters/Character";

export const SET = { cx: 1600, cz: 900, size: 384, hero: [[1512, 812]] as [number, number][], clear: [[1452, 742, 22], [1480, 775, 22], [1440, 735, 18], [1512, 812, 14], [1492, 789, 12]] as [number, number, number][] };

export const SetProof: React.FC<{ shot?: "medium" | "wide" | "low" | "cast" }> = ({ shot = "medium" }) => {
  const data = useTerrain("tbilisi");
  if (!data) return <AbsoluteFill style={{ background: "#000" }} />;
  return <Inner data={data} shot={shot} />;
};

const SHOTS: Record<string, { pos: [number, number, number]; look: [number, number, number]; lens: number; focus: number; fstop: number }> = {
  medium: { pos: [1452, 1.5, 742], look: [1514, 8, 816], lens: 50, focus: 96, fstop: 2.4 },
  wide: { pos: [1440, 12, 735], look: [1640, 4, 960], lens: 28, focus: 90, fstop: 5.6 },
  low: { pos: [1496, 0.35, 796], look: [1516, 4, 816], lens: 28, focus: 24, fstop: 1.8 },
  cast: { pos: [1478, 1.7, 772], look: [1491.9, 1.3, 788.9], lens: 50, focus: 22, fstop: 5.6 },
};

const Inner: React.FC<{ data: TerrainData; shot: string }> = ({ data, shot }) => {
  const frame = useCurrentFrame();
  const skins = useSkins();
  const { width, height } = useVideoConfig();
  HOLE.r = { x0: SET.cx - SET.size / 2 + 8, z0: SET.cz - SET.size / 2 + 8, x1: SET.cx + SET.size / 2 - 8, z1: SET.cz + SET.size / 2 - 8 };
  const set = useMemo(() => new VoxelSet(data, SET), [data]);
  const preset = PRESETS.filmDay;
  const s = SHOTS[shot];
  const pos = new THREE.Vector3(s.pos[0], set.groundY(s.pos[0], s.pos[2]) + s.pos[1], s.pos[2]);
  const target = new THREE.Vector3(s.look[0], set.groundY(s.look[0], s.look[2]) + s.look[1], s.look[2]);
  const cs: CamState = { pos, target, lens: s.lens, roll: 0, focus: s.focus, fstop: s.fstop, yawOffset: 0, pitchOffset: 0, motion: [0, 0] };
  const wa = THREE.MathUtils.degToRad(preset.wind.dir);
  const wind = useMemo(() => new THREE.Vector2(Math.sin(wa), -Math.cos(wa)), [wa]);
  const emitters = windDust(10, () => target.clone(), 70, preset.particles.windDust, (x, z) => set.groundY(x, z)).slice(0, 0);   // no dust in the proof (grains near the lens read as floating cubes)
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} shadows="percentage" gl={{ antialias: false, alpha: false }} camera={{ fov: 40, near: 0.1, far: 40000 }}>
        <Cam cs={cs} />
        <Atmosphere preset={preset} t={frame / 24} focus={target} fogBase={set.baseY + 20} shadowSize={110} shadowRes={4096} shadowSoft={4} />
        <SetMesh set={set} />
        {shot === "cast" && skins ? <Cast set={set} skins={skins} /> : null}
        <Terrain data={data} cam={pos} lodK={2.0} />
        <Vegetation data={data} cam={pos} radius={1600} grass={false} />
        <Particles emitters={emitters} t={frame / 24 + 3} wind={wind} />
        <Post s={{ preset, focusDist: cs.focus, fstop: cs.fstop, focalMM: cs.lens, letterbox: 2.39, heat: 0, frame, sunDir: sunDir(preset.sun.elevation, preset.sun.azimuth) }} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const Cam: React.FC<{ cs: CamState }> = ({ cs }) => {
  const { camera, size } = useThree();
  useLayoutEffect(() => { (camera as THREE.PerspectiveCamera).near = 0.1; applyCamera(camera as THREE.PerspectiveCamera, cs, size.width / size.height); });
  return null;
};

export const SetMesh: React.FC<{ set: VoxelSet }> = ({ set }) => {
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

/** Both sides facing each other on the slope (stage-2 preview of the skins in the new landscape). */
const Cast: React.FC<{ set: VoxelSet; skins: NonNullable<ReturnType<typeof useSkins>> }> = ({ set, skins }) => {
  const C = [1478, 772], dir = [0.63, 0.77], perp = [0.77, -0.63], P = [C[0] + dir[0] * 22, C[1] + dir[1] * 22];
  const geo = ["royal_guard", "erekle_ii", "aragveli_mail", "aragveli_chokha", "aragveli_elder", "georgian_soldier", "imeretian_soldier"];
  const qaj = ["qajar_cavalry", "agha_mohammad_khan", "qajar_infantry", "qajar_infantry", "qajar_cavalry", "qajar_infantry"];
  const spots: { id: string; x: number; z: number; yaw: number }[] = [];
  const place = (ids: string[], side: number) => ids.forEach((id, i) => {
    const row = i === 1 ? 0 : 1 + Math.floor((i + (i > 1 ? -1 : 0)) / 3);
    const lat = side * (1.6 + row * 1.3 + (i % 2) * 0.3);
    const along = (i === 1 ? -0.6 : ((i % 3) - 1) * 1.4 + 0.8) + (row > 1 ? 1.2 : 0);
    const x = P[0] + perp[0] * lat + dir[0] * along, z = P[1] + perp[1] * lat + dir[1] * along;
    spots.push({ id, x, z, yaw: Math.atan2(-perp[0] * side, -perp[1] * side) });
  });
  place(geo, 1); place(qaj, -1);
  return (
    <>
      {spots.map((s, i) => {
        const m = skins.meta.find((q) => q.id === s.id)!;
        return <Character key={i} meta={m} skin={skins.tex[m.id].skin} acc={skins.tex[m.id].acc} position={[s.x, set.groundY(s.x, s.z), s.z]} yaw={s.yaw} pose={standPose(i + 1)} fill={0.32} />;
      })}
    </>
  );
};
