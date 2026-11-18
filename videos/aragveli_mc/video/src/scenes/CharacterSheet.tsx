// Character sheet: every skin in a neutral studio, front / back / three-quarter view, with labels.
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Character, standPose, useSkins } from "../characters/Character";

const SPACING = 1.25;

// two rows of five on stepped shelves, long lens (near-orthographic)
const ROW_Y = [2.75, 0];
const Cam: React.FC = () => {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    const dist = 80, viewH = 6.4;
    c.fov = THREE.MathUtils.radToDeg(2 * Math.atan(viewH / 2 / dist));
    c.aspect = size.width / size.height; c.near = 1; c.far = 300;
    c.position.set(0, 2.45, dist); c.lookAt(0, 2.45, 0); c.updateProjectionMatrix();
  });
  return null;
};
const toScreen = (x: number, y: number, w: number, h: number) => ({ sx: (x / (6.4 * (w / h)) + 0.5) * w, sy: (0.5 - (y - 2.45) / 6.4) * h });

export const CharacterSheet: React.FC<{ view?: "front" | "back" | "three"; debug?: string }> = ({ view = "front", debug = "" }) => {
  const skins = useSkins();
  const { width, height } = useVideoConfig();
  if (!skins) return <AbsoluteFill style={{ background: "#202226" }} />;
  const yaw = view === "front" ? 0 : view === "back" ? Math.PI : -0.6;
  const place = skins.meta.map((_, i) => ({ x: ((i % 5) - 2) * SPACING * 1.45, y: ROW_Y[Math.floor(i / 5)], z: Math.floor(i / 5) === 0 ? -1.2 : 0 }));
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#3a3f46 0%,#23262b 70%,#1b1d21 100%)" }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 10 }}>
        <Cam />
        <hemisphereLight args={["#d6dde6", "#5a5048", 1.6]} />
        <directionalLight position={[-6, 10, 12]} intensity={2.2} color="#fff4e6" castShadow shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={8} shadow-camera-bottom={-3} />
        <directionalLight position={[8, 4, -6]} intensity={0.8} color="#a8c0ff" />
        <mesh position={[0, -0.5, 0.3]}><boxGeometry args={[20, 1, 2]} /><meshLambertMaterial color="#4a4e55" /></mesh>
        <mesh position={[0, 2.25, -1.2]}><boxGeometry args={[20, 1, 1.6]} /><meshLambertMaterial color="#454950" /></mesh>
        {skins.meta.map((m, i) => (
          <Character key={m.id} meta={m} skin={skins.tex[m.id].skin} acc={skins.tex[m.id].acc} position={[place[i].x, place[i].y, place[i].z]} yaw={yaw} pose={standPose(i + 3)} debug={debug} />
        ))}
      </ThreeCanvas>
      <AbsoluteFill style={{ fontFamily: "Noto Sans, Arial, sans-serif", color: "#e8e6e1" }}>
        <div style={{ position: "absolute", top: 28, left: 0, right: 0, textAlign: "center", fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
          300 ARAGVIANS — characters ({view === "front" ? "front" : view === "back" ? "back" : "three-quarter"})
        </div>
        {skins.meta.map((m, i) => {
          const { sx, sy } = toScreen(place[i].x, place[i].y, width, height);
          return (
            <div key={m.id} style={{ position: "absolute", top: sy + 6, left: sx - 150, width: 300, textAlign: "center", fontSize: 18, lineHeight: 1.2, textShadow: "0 1px 3px #000" }}>
              <div style={{ fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{m.basis}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
