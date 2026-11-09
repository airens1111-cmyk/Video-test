import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { config } from "./config";
import { totalFrames } from "./timing";

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={totalFrames}
    fps={config.video.fps}
    width={config.video.width}
    height={config.video.height}
  />
);
