import React from "react";
import { config } from "../config";
import { Appear, kaText } from "./anim";
import { LAYOUT } from "./chrome";

const C = config.colors;
export const W = 960;
export const H = LAYOUT.stageHeight;

export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", top: LAYOUT.stageTop, left: LAYOUT.side, width: W, height: H }}>{children}</div>
);
export const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);
export const L: React.FC<{ x: number; y: number; at: number; children: React.ReactNode; style?: React.CSSProperties; center?: boolean }> = ({
  x, y, at, children, style, center,
}) => (
  <Appear at={at} dy={14} style={{ position: "absolute", left: x, top: y, transform: center ? "translateX(-50%)" : undefined, ...style }}>
    {children}
  </Appear>
);

export const chip = (color: string): React.CSSProperties => ({
  ...kaText(26, 800, color),
  border: `2px solid ${color}`,
  borderRadius: 30,
  padding: "4px 18px 6px",
  whiteSpace: "nowrap",
});

export const card = (border = "rgba(213,230,255,0.35)"): React.CSSProperties => ({
  position: "absolute",
  border: `2px solid ${border}`,
  borderRadius: 18,
  padding: "18px 26px",
  background: "rgba(8,18,44,0.8)",
  boxShadow: "0 18px 50px rgba(2,8,24,0.6)",
});

