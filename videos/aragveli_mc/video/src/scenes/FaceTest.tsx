// Face rig checks: a still sheet of expressions, and an animated clip (blinks, eye darts, talking, shouting).
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Character, useSkins } from "../characters/Character";
import { EXPRESSIONS, FaceTrack } from "../characters/Face";

const Cam: React.FC<{ cy: number; viewH: number }> = ({ cy, viewH }) => {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera, dist = 60;
    c.fov = THREE.MathUtils.radToDeg(2 * Math.atan(viewH / 2 / dist)); c.aspect = size.width / size.height; c.near = 1; c.far = 200;
    c.position.set(0, cy, dist); c.lookAt(0, cy, 0); c.updateProjectionMatrix();
  });
  return null;
};

const Lights: React.FC = () => (
  <>
    <hemisphereLight args={["#e2e8ef", "#6a5c50", 1.5]} />
    <directionalLight position={[-5, 6, 10]} intensity={2.0} color="#fff3e2" />
    <directionalLight position={[6, 3, -4]} intensity={0.9} color="#9fb8ff" />
  </>
);

const HEAD_Y = 28 / 16;      // head centre above the feet (m)
const ROWS = ["erekle_ii", "aragveli_chokha", "agha_mohammad_khan", "aragveli_mail", "qajar_cavalry"];
const COLS: [string, string][] = [["neutral", "neutral"], ["determined", "determined"], ["speaking", "talking"], ["angry", "angry"], ["shout", "battle cry"], ["surprised", "surprised"], ["sad", "sad"], ["grief", "grief, eyes closed"]];

export const FaceSheet: React.FC = () => {
  const skins = useSkins();
  const { width, height } = useVideoConfig();
  if (!skins) return <AbsoluteFill style={{ background: "#202226" }} />;
  const sx = 0.82, sy = 1.02, viewH = 6.0, cy = 0.15;
  const gx = (c: number) => (c - (COLS.length - 1) / 2) * sx + 0.55, gy = (r: number) => ((ROWS.length - 1) / 2 - r) * sy - 0.2;
  const toPx = (x: number, y: number) => ({ px: (x / (viewH * width / height) + 0.5) * width, py: (0.5 - (y - cy) / viewH) * height });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#3a3f46,#1d2024)" }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true, alpha: true }} camera={{ fov: 5 }}>
        <Cam cy={cy} viewH={viewH} /><Lights />
        {ROWS.map((id, r) => COLS.map(([ex], c) => {
          const m = skins.meta.find((q) => q.id === id)!;
          const e = { ...EXPRESSIONS[ex], ...(ex === "speaking" ? { mouth: "open" as const } : {}) };
          return <Character key={id + ex} meta={m} skin={skins.tex[id].skin} acc={skins.tex[id].acc} position={[gx(c), gy(r) - HEAD_Y, 0]} yaw={0.22} headOnly expr={e} face={{ keys: [], blinks: false }} />;
        }))}
      </ThreeCanvas>
      <AbsoluteFill style={{ fontFamily: "Noto Sans, Arial, sans-serif", color: "#e8e6e1" }}>
        <div style={{ position: "absolute", top: 18, width: "100%", textAlign: "center", fontSize: 28, fontWeight: 700 }}>Face rig — expressions</div>
        {COLS.map(([, label], c) => { const { px } = toPx(gx(c), 0); return <div key={label} style={{ position: "absolute", top: 70, left: px - 80, width: 160, textAlign: "center", fontSize: 17 }}>{label}</div>; })}
        {ROWS.map((id, r) => { const { py } = toPx(0, gy(r)); const m = skins.meta.find((q) => q.id === id)!; return <div key={id} style={{ position: "absolute", left: 24, top: py - 14, width: 230, fontSize: 17, fontWeight: 700 }}>{m.name}</div>; })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ animated test
const TRACKS: Record<string, { track: FaceTrack; caption: (t: number) => string }> = {
  erekle_ii: {
    track: { seed: 3, keys: [{ t: 0, expr: "neutral" }, { t: 0.9, expr: { look: -1 } }, { t: 1.6, expr: { look: 0, brows: "sad" } }, { t: 4.8, expr: "grief" }, { t: 6.4, expr: "determined" }], talk: [[2.0, 4.6]] },
    caption: (t) => (t < 2 ? "listens, glances aside" : t < 4.7 ? "speaks (dramatized line)" : t < 6.4 ? "grief, eyes closed" : "resolve"),
  },
  aragveli_chokha: {
    track: { seed: 5, keys: [{ t: 0, expr: "determined" }, { t: 1.5, expr: { look: 1 } }, { t: 2.4, expr: "angry" }, { t: 3.2, expr: "shout" }, { t: 5.2, expr: "angry" }, { t: 6.5, expr: "determined" }] },
    caption: (t) => (t < 2.4 ? "watches the field" : t < 3.2 ? "anger" : t < 5.2 ? "battle cry" : "teeth clenched, ready"),
  },
  agha_mohammad_khan: {
    track: { seed: 9, keys: [{ t: 0, expr: { brows: "focused" } }, { t: 1.2, expr: { eyes: "narrow" } }, { t: 3.9, expr: { look: -1 } }, { t: 5.2, expr: { look: 0 } }, { t: 6, expr: "determined" }], talk: [[2.4, 3.7]] },
    caption: (t) => (t < 2.4 ? "cold, attentive" : t < 3.8 ? "gives an order" : "watches"),
  },
  qajar_cavalry: {
    track: { seed: 11, keys: [{ t: 0, expr: "neutral" }, { t: 1.5, expr: "surprised" }, { t: 3, expr: "angry" }, { t: 4, expr: "shout" }, { t: 5.6, expr: "determined" }] },
    caption: (t) => (t < 1.5 ? "waits" : t < 3 ? "surprise" : t < 4 ? "anger" : t < 5.6 ? "charge cry" : "focus"),
  },
};

export const FaceAnim: React.FC = () => {
  const skins = useSkins();
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  if (!skins) return <AbsoluteFill style={{ background: "#202226" }} />;
  const ids = Object.keys(TRACKS);
  const sx = 0.92, viewH = 2.25;
  const gx = (i: number) => (i - (ids.length - 1) / 2) * sx;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#3a3f46,#1d2024)" }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true, alpha: true }} camera={{ fov: 5 }}>
        <Cam cy={0.08} viewH={viewH} /><Lights />
        {ids.map((id, i) => {
          const m = skins.meta.find((q) => q.id === id)!;
          const tr = TRACKS[id].track;
          const shouting = tr.keys.some((k, j) => k.expr === "shout" && t >= k.t && (j === tr.keys.length - 1 || t < tr.keys[j + 1].t));
          const talking = (tr.talk ?? []).some(([a, b]) => t >= a && t <= b);
          const head: [number, number, number] = [
            Math.sin(t * 1.3 + i) * 0.04 + (shouting ? -0.18 : 0) + (talking ? Math.sin(t * 9) * 0.025 : 0),
            Math.sin(t * 0.7 + i * 2) * 0.12 + 0.28 * (i < 2 ? 1 : -1),
            Math.sin(t * 0.5 + i) * 0.03,
          ];
          return <Character key={id} meta={m} skin={skins.tex[id].skin} acc={skins.tex[id].acc} position={[gx(i), -HEAD_Y, 0]} headOnly face={tr} t={t} pose={{ head }} />;
        })}
      </ThreeCanvas>
      <AbsoluteFill style={{ fontFamily: "Noto Sans, Arial, sans-serif", color: "#e8e6e1" }}>
        {ids.map((id, i) => {
          const px = (gx(i) / (viewH * width / height) + 0.5) * width;
          const m = skins.meta.find((q) => q.id === id)!;
          return (
            <div key={id} style={{ position: "absolute", top: height * 0.84, left: px - 200, width: 400, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: 20, opacity: 0.75, marginTop: 6 }}>{TRACKS[id].caption(t)}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
