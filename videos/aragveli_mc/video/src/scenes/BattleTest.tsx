// Step 2c: 10-second style test — the clash of the lines, slow-mo sword close-up, crane up over the mass.
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { PostFX, Sky } from "../components/PostFX";
import { Soldiers, Horses } from "../voxel/Army";
import { buildBattle } from "../voxel/battle";
import { cameraAt, makeTimeWarp, Shot } from "../voxel/camera";
import { easeOut, lerp, smooth } from "../voxel/random";
import { Banner, Clouds, Mountains, Particles, Terrain, TerrainSpec, Trees } from "../voxel/World";

const FOCUS_PAIR = 20;
const SPEC = { seed: 1795, front: 40, spacing: 1.15, geoRows: 12, qajRows: 24, duration: 14, fallRate: 0.07, cavalry: 30, focusPair: FOCUS_PAIR, focusT: 3.95 };
const TERRAIN: TerrainSpec = { half: 75, flatX: 34, flatZ: 36, seed: 3, trampleZ: [-4, 4] };
const FOG = "#d8c6a6";

const v3 = (a: number, b: number, c: number): THREE.Vector3Tuple => [a, b, c];

const CameraRig: React.FC<{ t: number; shots: Shot[] }> = ({ t, shots }) => {
  const { camera, scene } = useThree();
  useLayoutEffect(() => {
    const c = cameraAt(shots, t);
    camera.position.set(...c.pos);
    camera.lookAt(...c.look);
    if (c.fov && (camera as THREE.PerspectiveCamera).fov !== c.fov) { (camera as THREE.PerspectiveCamera).fov = c.fov; (camera as THREE.PerspectiveCamera).updateProjectionMatrix(); }
    scene.fog = scene.fog ?? new THREE.Fog(FOG, 35, 330);
  }, [t, camera, scene, shots]);
  return null;
};

export const BattleTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const portrait = height > width;
  const battle = useMemo(() => buildBattle(SPEC), []);
  const warp = useMemo(() => makeTimeWarp([{ from: 3.55, to: 6.05, speed: 0.22 }], fps, durationInFrames), [fps, durationInFrames]);
  const tReal = frame / fps;
  const t = warp.sim(frame);

  const fx = battle.pairs[FOCUS_PAIR][0].x;
  const fovBase = portrait ? 58 : 40;
  const shots = useMemo<Shot[]>(() => [
    { // over the shoulders of the Georgian ranks, tracking along the line
      from: 0, to: 3.4,
      pos: (u) => v3(lerp(-17, -5, u), 6.2 - 0.8 * u, 10 - 1.5 * u),
      look: (u) => v3(lerp(-12, -1, u), 0.8, -3.5),
      fov: () => fovBase, shake: 0.03,
    },
    { // slow-motion close-up on one duel
      from: 3.4, to: 6.2,
      pos: (u) => { const a = lerp(2.75, 2.45, u); const d = portrait ? 4.4 : 3.4; return v3(fx + Math.cos(a) * d, lerp(1.2, 1.45, u), Math.sin(a) * d * 0.55); },
      look: () => v3(fx, 1.55, -0.05),
      fov: () => (portrait ? 50 : 34),
    },
    { // crane up and back, revealing the size of the armies
      from: 6.2, to: 10.01,
      pos: (u) => { const k = easeOut(u); return v3(lerp(fx - 3, -20, k), lerp(4.2, 32, smooth(u)), lerp(5.5, 36, k)); },
      look: (u) => { const k = smooth(u); return v3(lerp(fx, -2, k), lerp(1.5, 0, k), lerp(0, -12, k)); },
      fov: (u) => lerp(portrait ? 50 : 34, fovBase, smooth(u)),
    },
  ], [fx, portrait, fovBase]);

  const closeUp = tReal >= 3.4 && tReal < 6.2;
  const hide = useMemo(() => (closeUp ? { x: fx - 3.6, z: 0, r: 3.0, keep: battle.pairs[FOCUS_PAIR].map((s) => s.id) } : null), [closeUp, fx, battle]);
  const banners = useMemo(() => {
    const out: { x: number; z: number; side: "geo" | "qaj"; phase: number }[] = [];
    for (let c = 2; c < SPEC.front; c += 7) out.push({ x: -22.4 + c * 1.15 + 0.4, z: 0.8 + 1.5 * 1.15, side: "geo", phase: c * 0.37 });
    for (let c = 4; c < SPEC.front; c += 6) { out.push({ x: -22.4 + c * 1.15 + 0.4, z: -0.8 - 4 * 1.15, side: "qaj", phase: c * 0.29 }); out.push({ x: -22.4 + c * 1.15 - 0.3, z: -0.8 - 14 * 1.15, side: "qaj", phase: c * 0.41 }); }
    return out;
  }, []);
  const trees = useMemo<[number, number, number][]>(() => [[-40, 3, 30], [-46, 4, 20], [42, 3, 28], [48, 5, 14], [-52, 6, -10], [55, 6, -18], [38, 2, 40]], []);

  return (
    <AbsoluteFill>
      <Sky />
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: fovBase, near: 0.1, far: 700, position: [0, 5, 10] }} gl={{ antialias: true, alpha: true }}>
        <CameraRig t={tReal} shots={shots} />
        <hemisphereLight args={["#b9cfe6", "#6b5a40", 1.05]} />
        <directionalLight
          position={[-38, 34, 22]} intensity={2.4} color="#ffd8a6" castShadow
          shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
          shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-45} shadow-camera-near={1} shadow-camera-far={140}
        />
        <Terrain spec={TERRAIN} />
        <Mountains z={-200} width={480} seed={11} />
        <Mountains z={210} width={480} seed={23} />
        <Trees spots={trees} />
        <Clouds t={t} />
        <Soldiers soldiers={battle.soldiers} horses={battle.horses} t={t} side={0} hide={hide} />
        <Soldiers soldiers={battle.soldiers} horses={battle.horses} t={t} side={1} hide={hide} />
        <Horses horses={battle.horses} t={t} />
        {banners.map((b, i) => <Banner key={i} {...b} t={t} />)}
        <Particles events={battle.events} horses={battle.horses} t={t} bounds={40} />
      </ThreeCanvas>
      <PostFX vignette={0.6} grain={0.08} tint={warp.speedAt(tReal) < 0.9 ? "rgba(255,190,120,0.18)" : undefined} />
    </AbsoluteFill>
  );
};
