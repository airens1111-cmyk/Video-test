// One camera shot of the empty world: terrain, city, vegetation, water, sky, light, particles, post.
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { applyCamera, evalMove, Move, simTime } from "../camera/rig";
import { CAMERA_POSITIONS } from "../camera/shots";
import { PRESETS, PresetName } from "../config/presets";
import { ash, dustTrail, embers, Emitter, fire, riverMist, smoke, windDust } from "../fx/particles";
import { Particles } from "../fx/Particles";
import { Post } from "../fx/Post";
import { Atmosphere, sunDir } from "../world/Atmosphere";
import { TerrainData, useTerrain } from "../world/data";
import { LOCATIONS, TB } from "../world/locations";
import { AragviSettlements, Boxes, burningHouses, City, Vegetation } from "../world/Objects";
import { Terrain } from "../world/Terrain";

export interface WorldShotProps {
  region: "tbilisi" | "aragvi"; preset: PresetName; move: Move;
  burn?: number; dustRoad?: boolean; memorial?: boolean;
  letterbox?: number; debug?: boolean; tOffset?: number; quality?: "draft" | "final";
}

const CamApply: React.FC<{ move: Move; t: number; data: TerrainData }> = ({ move, t, data }) => {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const s = evalMove(move, t, (x, z) => data.surface(x, z));
    const cam = camera as THREE.PerspectiveCamera;
    cam.near = 0.3; cam.far = 40000;
    applyCamera(cam, s, size.width / size.height, move);
  });
  return null;
};

export const WorldShot: React.FC<WorldShotProps> = (p) => {
  const data = useTerrain(p.region);
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps + (p.tOffset ?? 0);
  if (!data) return <AbsoluteFill style={{ background: "#000" }} />;
  return <Inner {...p} data={data} t={t} width={width} height={height} frame={frame} />;
};

const Inner: React.FC<WorldShotProps & { data: TerrainData; t: number; width: number; height: number; frame: number }> = (p) => {
  const { data, t } = p;
  const preset = PRESETS[p.preset];
  const cs = evalMove(p.move, t, (x, z) => data.surface(x, z));
  const st = simTime(p.move, t);
  const cam = cs.pos;
  const wa = THREE.MathUtils.degToRad(preset.wind.dir);
  const wind = useMemo(() => new THREE.Vector2(Math.sin(wa), -Math.cos(wa)), [wa]);
  const sd = preset.sun.intensity > 0 ? sunDir(preset.sun.elevation, preset.sun.azimuth) : sunDir(preset.moon?.elevation ?? 30, preset.moon?.azimuth ?? 140);
  const ground = (x: number, z: number) => data.top(x, z);

  // emitters (rebuilt per frame from cheap closures; particles themselves are stateless)
  const emitters: Emitter[] = [];
  const ahead = () => cs.pos.clone().lerp(cs.target, Math.min(1, 80 / Math.max(1, cs.pos.distanceTo(cs.target))));
  const P = preset.particles;
  if (P.windDust > 0) emitters.push(...windDust(10, () => { const a = ahead(); a.y = 0; return a; }, Math.min(260, 60 + (cam.y - data.surface(cam.x, cam.z)) * 1.2), P.windDust, ground));
  if (P.riverMist > 0 && data.meta.rivers.length) emitters.push(riverMist(20, data.meta.rivers.flat(), (x, z) => data.waterLevel(x, z), P.riverMist, () => cam, 1400));
  if (P.ash > 0) emitters.push(ash(30, () => cam.clone(), 45, P.ash));
  if (P.embers > 0 && !p.burn) emitters.push(embers(40, () => { const a = ahead(); a.y = data.top(a.x, a.z); return a; }, 120, 18 * P.embers));
  const houses = useMemo(() => (p.burn ? burningHouses(data, p.burn, 400) : []), [data, p.burn]);
  if (p.burn) {
    const near = [...houses].sort((a, b) => a.distanceTo(cs.target) - b.distanceTo(cs.target));
    near.slice(0, 90).forEach((h, i) => emitters.push(fire(1000 + i, h, 0.8 + (i % 3) * 0.25)));
    near.filter((_, i) => i % 5 === 0).slice(0, 30).forEach((h, i) => emitters.push(smoke(2000 + i, h, 2.2, 0.85)));
    emitters.push(embers(3000, () => new THREE.Vector3(-4700, data.top(-4700, -4350), -4350), 520, 260 * (P.embers || 1), 8));
  }
  if (p.dustRoad) {
    // dust raised on the southern road by an (unseen) approaching column — the trail module armies will use later
    const path = (tt: number) => { const k = Math.min(1, Math.max(0, tt / 60)); const x = 3340 - 50 * k, z = 5600 - 1600 * k; return new THREE.Vector3(x, data.top(x, z), z); };
    emitters.push(dustTrail(4000, path, { width: 60, rate: 70, height: 1.4 }));
  }

  const debugLabels = p.debug ? <DebugLabels {...p} cs={cs} /> : null;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={p.width} height={p.height} shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }} camera={{ fov: 40, near: 0.3, far: 40000 }}>
        <CamApply move={p.move} t={t} data={data} />
        <Atmosphere preset={preset} t={st} focus={cs.target} fogBase={data.surface(cs.target.x, cs.target.z) - 25} shadowSize={Math.min(900, Math.max(120, cs.pos.distanceTo(cs.target) * 0.9))} />
        <Terrain data={data} cam={cam} lodK={p.quality === "final" ? 2.2 : 1.6} />
        <Vegetation data={data} cam={cam} radius={p.quality === "final" ? 2400 : 1600} />
        {p.region === "tbilisi" ? <City data={data} burn={p.burn ?? 0} /> : <AragviSettlements data={data} />}
        {p.memorial ? <MemorialStone data={data} /> : null}
        {p.burn ? <CityGlow t={st} data={data} /> : null}
        <Particles emitters={emitters} t={st} wind={wind} />
        <Post s={{ preset, focusDist: cs.focus, fstop: cs.fstop, focalMM: cs.lens, letterbox: p.letterbox ?? 0, heat: P.heat * 0.8, frame: p.frame, sunDir: sd, motion: cs.motion }} />
      </ThreeCanvas>
      {debugLabels}
    </AbsoluteFill>
  );
};

const MemorialStone: React.FC<{ data: TerrainData }> = ({ data }) => {
  const [x, z] = TB.memorial; const y = data.top(x, z);
  const boxes = useMemo(() => [
    { x, y: y + 0.4, z, sx: 4.5, sy: 0.8, sz: 4.5 },
    { x, y: y + 1.1, z, sx: 3.2, sy: 0.6, sz: 3.2 },
    { x, y: y + 3.6, z, sx: 1.4, sy: 4.4, sz: 0.9 },
  ], [x, y, z]);
  return <Boxes kind="stone" boxes={boxes} />;
};

const CityGlow: React.FC<{ t: number; data: TerrainData }> = ({ t, data }) => {
  const pts: [number, number][] = [[-4750, -4500], [-4600, -4200], [-4850, -4800], [-4250, -4400], [-4500, -4050]];
  return (
    <>
      {pts.map(([x, z], i) => (
        <pointLight key={i} position={[x, data.top(x, z) + 35, z]} color="#ff7a30" intensity={(9000 + 3000 * Math.sin(t * 7 + i * 2.1) * Math.sin(t * 3.3 + i)) * 1} distance={900} decay={1.6} />
      ))}
    </>
  );
};

/** Draft-only labels: locations and camera positions projected to the screen. */
const DebugLabels: React.FC<WorldShotProps & { data: TerrainData; width: number; height: number; cs: ReturnType<typeof evalMove> }> = ({ data, width, height, cs, move, region }) => {
  const cam = new THREE.PerspectiveCamera(40, width / height, 0.3, 40000);
  applyCamera(cam, cs, width / height, move);
  const items = [
    ...(region === "tbilisi" ? LOCATIONS.map((l) => ({ label: `${l.label} [${l.status}]`, x: l.x, z: l.z, c: "#ffd34d" })) : []),
    ...CAMERA_POSITIONS.filter((c) => c.region === region).map((c) => ({ label: `${c.id} ${c.scene}: ${c.label}`, x: c.pos[0], z: c.pos[2], c: "#7fd4ff" })),
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: "monospace", fontSize: Math.round(height / 70) }}>
      {items.map((it, i) => {
        const v = new THREE.Vector3(it.x, data.surface(it.x, it.z) + 8, it.z).project(cam);
        if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return null;
        return <div key={i} style={{ position: "absolute", left: (v.x * 0.5 + 0.5) * width, top: (-v.y * 0.5 + 0.5) * height, color: it.c, textShadow: "0 0 3px #000", whiteSpace: "nowrap", transform: "translate(-4px,-4px)" }}>◆ {it.label}</div>;
      })}
      <div style={{ position: "absolute", left: 10, top: 10, color: "#fff", background: "rgba(0,0,0,.5)", padding: 4 }}>DRAFT · {move.id} · {move.label}</div>
    </AbsoluteFill>
  );
};
