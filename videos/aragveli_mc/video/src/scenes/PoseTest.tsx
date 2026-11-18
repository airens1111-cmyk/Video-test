// Two action beats modelled on the reference frames, played by our characters on the 1 m film set:
//  "cry"   — a highlander raises his sabre straight up with a battle cry, comrades advance behind him;
//  "shock" — a guard recoils into a wide stance, sabre across the body, free arm flung up, face in shock.
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { CamState } from "../camera/rig";
import { Character, Pose, useSkins } from "../characters/Character";
import { FaceTrack } from "../characters/Face";
import { add, alive, poseAt, PoseKey, POSES, walk } from "../characters/poses";
import { PRESETS } from "../config/presets";
import { Post } from "../fx/Post";
import { Atmosphere, sunDir } from "../world/Atmosphere";
import { TerrainData, useTerrain } from "../world/data";
import { Vegetation } from "../world/Objects";
import { Terrain } from "../world/Terrain";
import { HOLE } from "../world/terrainGen";
import { VoxelSet } from "../world2/set";
import { Cam, SET, SetMesh } from "./SetProof";

const H: [number, number] = [1492, 789];             // hero spot (cleared in the set)
const D: [number, number] = [0.63, 0.77];             // camera -> hero direction
const S: [number, number] = [0.77, -0.63];            // screen-right of that direction

export const PoseTest: React.FC<{ beat?: "cry" | "shock" }> = ({ beat = "cry" }) => {
  const data = useTerrain("tbilisi");
  const skins = useSkins();
  if (!data || !skins) return <AbsoluteFill style={{ background: "#000" }} />;
  return <Inner data={data} skins={skins} beat={beat} />;
};

const BEATS = {
  cry: {
    hero: "aragveli_chokha", item: "khmali",
    keys: [
      { t: 0, pose: POSES.ready }, { t: 0.65, pose: POSES.ready },
      { t: 0.95, pose: POSES.windup, ease: "out" }, { t: 1.22, pose: POSES.battleCry, ease: "outBack" }, { t: 4, pose: POSES.battleCry },
    ] as PoseKey[],
    face: { seed: 4, keys: [{ t: 0, expr: "determined" }, { t: 0.7, expr: "angry" }, { t: 1.05, expr: "shout" }, { t: 3.3, expr: "angry" }] } as FaceTrack,
    tremble: (t: number) => (t > 1.2 ? 1 : 0),
    cam: (t: number) => ({ dist: 5.0 - t * 0.15, side: 0.8, h: 0.85, lookH: 1.55 + Math.min(1, Math.max(0, (t - 0.9) * 2)) * 0.15, lens: 24 }),
    crowd: ["aragveli_mail", "georgian_soldier", "aragveli_elder", "royal_guard", "aragveli_mail", "imeretian_soldier", "georgian_soldier", "aragveli_chokha", "aragveli_mail"],
  },
  shock: {
    hero: "royal_guard", item: "khmali",
    keys: [
      { t: 0, pose: add(POSES.ready, { root: [0, 0, 8] }) }, { t: 0.85, pose: add(POSES.ready, { root: [0, 0, 2] }) },
      { t: 1.08, pose: POSES.shock, ease: "outBack" }, { t: 4, pose: POSES.shock },
    ] as PoseKey[],
    face: { seed: 8, keys: [{ t: 0, expr: "determined" }, { t: 0.9, expr: "shock" }, { t: 2.0, expr: { look: 1 } }, { t: 2.6, expr: { look: 0 } }, { t: 3.2, expr: "surprised" }] } as FaceTrack,
    tremble: () => 0,
    cam: (t: number) => ({ dist: 4.0 - t * 0.08, side: -0.6, h: 0.95, lookH: 1.45, lens: 24 }),
    crowd: ["qajar_infantry", "georgian_soldier", "qajar_cavalry", "aragveli_mail", "qajar_infantry", "royal_guard", "qajar_infantry"],
  },
};

const Inner: React.FC<{ data: TerrainData; skins: NonNullable<ReturnType<typeof useSkins>>; beat: "cry" | "shock" }> = ({ data, skins, beat }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const B = BEATS[beat];
  HOLE.r = { x0: SET.cx - SET.size / 2 + 8, z0: SET.cz - SET.size / 2 + 8, x1: SET.cx + SET.size / 2 - 8, z1: SET.cz + SET.size / 2 - 8 };
  const set = useMemo(() => new VoxelSet(data, SET), [data]);
  const preset = PRESETS.filmDay;
  const c = B.cam(t);
  const camXZ: [number, number] = [H[0] - D[0] * c.dist + S[0] * c.side, H[1] - D[1] * c.dist + S[1] * c.side];
  const pos = new THREE.Vector3(camXZ[0], set.groundY(camXZ[0], camXZ[1]) + c.h, camXZ[1]);
  const target = new THREE.Vector3(H[0], set.groundY(H[0], H[1]) + c.lookH, H[1]);
  const cs: CamState = { pos, target, lens: c.lens, roll: beat === "shock" ? -2.5 : 0, focus: pos.distanceTo(target), fstop: 2.2, yawOffset: 0, pitchOffset: 0, motion: [0, 0] };
  const heroYaw = Math.atan2(-D[0], -D[1]);            // face the camera
  const heroPose = add(poseAt(B.keys, t), alive(t, 2, 0.6 * B.tremble(t)));
  const meta = (id: string) => skins.meta.find((m) => m.id === id)!;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} shadows="percentage" gl={{ antialias: false, alpha: false }} camera={{ fov: 40, near: 0.05, far: 40000 }}>
        <Cam cs={cs} />
        <Atmosphere preset={preset} t={t} focus={target} fogBase={set.baseY + 20} shadowSize={40} shadowRes={4096} shadowSoft={3} />
        <SetMesh set={set} />
        <Terrain data={data} cam={pos} lodK={2.0} />
        <Vegetation data={data} cam={pos} radius={1500} grass={false} />
        <Character meta={meta(B.hero)} skin={skins.tex[B.hero].skin} acc={skins.tex[B.hero].acc} item={skins.items[B.item]}
          position={[H[0], set.groundY(H[0], H[1]), H[1]]} yaw={heroYaw} pose={heroPose} face={B.face} t={t} fill={0.28} />
        {B.crowd.map((id, i) => {
          // comrades / foes behind the hero, advancing towards the camera (blurred by depth of field)
          const along = 6 + (i % 3) * 3.2 + Math.floor(i / 3) * 4.5 - t * (beat === "cry" ? 1.4 : 0.9);
          const lat = ((i % 3) - 1) * 2.6 + (Math.floor(i / 3) % 2) * 1.2 + (i === 0 ? -0.8 : 0);
          const x = H[0] + D[0] * along + S[0] * lat, z = H[1] + D[1] * along + S[1] * lat;
          const ph = t * 1.6 + i * 0.37;
          const p: Pose = add(walk(ph, 1, true), { rarm: [-0.2 - (i % 2) * 0.6, 0, -0.1], relbow: 0.5 });
          const m = meta(id);
          return <Character key={i} meta={m} skin={skins.tex[id].skin} acc={skins.tex[id].acc} item={skins.items[id.startsWith("qajar") ? "shamshir" : "khmali"]}
            position={[x, set.groundY(x, z), z]} yaw={heroYaw + (i % 2 ? 0.15 : -0.12)} pose={p} face={{ seed: 20 + i, keys: [{ t: 0, expr: i % 3 === 0 ? "shout" : "angry" }] }} t={t} fill={0.28} />;
        })}
        <Post s={{ preset, focusDist: cs.focus, fstop: cs.fstop, focalMM: cs.lens, letterbox: 2.39, heat: 0, frame, sunDir: sunDir(preset.sun.elevation, preset.sun.azimuth) }} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
