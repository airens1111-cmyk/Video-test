import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { config } from "../config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 ramp starting at frame `at` over `dur` frames. */
export const useRamp = (at: number, dur = 12) => {
  const f = useCurrentFrame();
  return interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
};

export const usePop = (at: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping: 14, stiffness: 140, mass: 0.7 } });
};

/** Fade + rise in for any block. */
export const Appear: React.FC<{ at: number; dur?: number; dy?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  at, dur = 12, dy = 24, style, children,
}) => {
  const p = useRamp(at, dur);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * dy}px)`, ...style }}>{children}</div>
  );
};

/** SVG path that draws itself (pathLength-normalised dash). */
export const DrawPath: React.FC<React.SVGProps<SVGPathElement> & { at: number; dur?: number }> = ({ at, dur = 24, ...props }) => {
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

/** SVG group fade-in. */
export const GFade: React.FC<{ at: number; dur?: number; children: React.ReactNode; dy?: number }> = ({ at, dur = 12, dy = 10, children }) => {
  const p = useRamp(at, dur);
  return <g opacity={p} transform={`translate(0 ${(1 - p) * dy})`}>{children}</g>;
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
