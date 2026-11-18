import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/** Film look on top of the 3D canvas: vignette + animated grain (deterministic per frame). */
export const PostFX: React.FC<{ vignette?: number; grain?: number; tint?: string }> = ({ vignette = 0.55, grain = 0.09, tint }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {tint ? <AbsoluteFill style={{ background: tint, mixBlendMode: "soft-light" }} /> : null}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 65% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)` }} />
      <AbsoluteFill style={{ opacity: grain, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id={`g${frame}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#g${frame})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Sky: React.FC<{ top?: string; horizon?: string; glow?: string }> = ({ top = "#5f86ba", horizon = "#e6cfa9", glow = "rgba(255,214,150,0.55)" }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, #9db5cf 42%, ${horizon} 70%, ${horizon} 100%)` }}>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 22% 58%, ${glow} 0%, rgba(0,0,0,0) 38%)` }} />
  </AbsoluteFill>
);
