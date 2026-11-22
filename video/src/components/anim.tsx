import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { config } from "../config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 ramp starting at frame `at` over `dur` frames (fast by default). */
export const useRamp = (at: number, dur = 8) => {
  const f = useCurrentFrame();
  return interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
};

/** Springy 0→1 with a little overshoot. */
export const usePop = (at: number, stiffness = 220) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping: 11, stiffness, mass: 0.6 } });
};

/** Slow sine for idle motion. */
export const useWave = (period = 60, phase = 0) => {
  const f = useCurrentFrame();
  return Math.sin(((f + phase) / period) * Math.PI * 2);
};

export const Appear: React.FC<{
  at: number;
  dur?: number;
  dy?: number;
  dx?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, dy = 26, dx = 0, style, children }) => {
  const p = usePop(at);
  const o = Math.min(1, Math.max(0, p * 1.6));
  return (
    <div style={{ opacity: o, transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy}px) scale(${0.92 + 0.08 * p})`, ...style }}>
      {children}
    </div>
  );
};

/** SVG path that draws itself (pathLength-normalised dash). */
export const DrawPath: React.FC<React.SVGProps<SVGPathElement> & { at: number; dur?: number }> = ({ at, dur = 14, ...props }) => {
  const p = useRamp(at, dur);
  return (
    <path
      fill="none"
      stroke={config.colors.line}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
    />
  );
};

/** SVG group pop-in around its own origin (cx, cy). */
export const GPop: React.FC<{ at: number; cx?: number; cy?: number; children: React.ReactNode }> = ({ at, cx = 0, cy = 0, children }) => {
  const p = usePop(at);
  if (p <= 0.001) return null;
  return (
    <g opacity={Math.min(1, p * 1.6)} transform={`translate(${cx} ${cy}) scale(${p}) translate(${-cx} ${-cy})`}>
      {children}
    </g>
  );
};

export const GFade: React.FC<{ at: number; dur?: number; children: React.ReactNode; dy?: number }> = ({ at, dur = 8, dy = 10, children }) => {
  const p = useRamp(at, dur);
  return <g opacity={p} transform={`translate(0 ${(1 - p) * dy})`}>{children}</g>;
};

/** Counts a number up from `from` to `to` starting at frame `at`. */
export const CountUp: React.FC<{ at: number; from: number; to: number; dur?: number; suffix?: string; style?: React.CSSProperties }> = ({
  at, from, to, dur = 14, suffix = "", style,
}) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [at, at + dur], [from, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  return <span style={style}>{Math.round(v)}{suffix}</span>;
};

/** Short horizontal shake starting at `at`. */
export const useShake = (at: number, amp = 8, dur = 12) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > dur) return 0;
  return Math.sin(t * 2.2) * amp * (1 - t / dur);
};

export const seeded = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const kaText = (size: number, weight = 800, color: string = config.colors.text): React.CSSProperties => ({
  fontFamily: config.fonts.ka,
  fontWeight: weight,
  fontSize: size,
  color,
  lineHeight: 1.22,
});

export const monoText = (size: number, color: string = config.colors.dim): React.CSSProperties => ({
  fontFamily: config.fonts.mono,
  fontWeight: 500,
  fontSize: size,
  color,
});
