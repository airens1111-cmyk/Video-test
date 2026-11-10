import React from "react";
import { Composition } from "remotion";
import { FLYOVERS, STILLS } from "./camera/shots";
import { BattleTest } from "./scenes/BattleTest";
import { WorldShot as WS } from "./scenes/WorldShot";
const WorldShot = WS as unknown as React.FC<Record<string, unknown>>;

// Stage 1 (world only). Master: 16:9, 24 fps, 2.39:1 letterbox. Vertical 9:16 versions use per-shot framing.
const MASTER = { width: 1920, height: 1080, fps: 24 };
const VERTICAL = { width: 1080, height: 1920, fps: 24 };

export const Root: React.FC = () => (
  <>
    {FLYOVERS.map((f) => (
      <React.Fragment key={f.id}>
        <Composition id={`Fly-${f.id}`} component={WorldShot} durationInFrames={f.seconds * 24} {...VERTICAL}
          defaultProps={{ region: f.region, preset: f.preset, move: f.move, burn: f.burn, dustRoad: f.dustRoad, memorial: f.id === "F8", quality: "draft" as const, debug: false }} />
        <Composition id={`FlyDebug-${f.id}`} component={WorldShot} durationInFrames={f.seconds * 24} {...VERTICAL}
          defaultProps={{ region: f.region, preset: f.preset, move: f.move, burn: f.burn, dustRoad: f.dustRoad, memorial: f.id === "F8", quality: "draft" as const, debug: true }} />
        <Composition id={`FlyMaster-${f.id}`} component={WorldShot} durationInFrames={f.seconds * 24} {...MASTER}
          defaultProps={{ region: f.region, preset: f.preset, move: f.move, burn: f.burn, dustRoad: f.dustRoad, memorial: f.id === "F8", quality: "final" as const, letterbox: 2.39 }} />
      </React.Fragment>
    ))}
    {STILLS.map((s) => (
      <Composition key={s.id} id={`Still-${s.id}`} component={WorldShot} durationInFrames={1} {...MASTER}
        defaultProps={{ region: s.region, preset: s.preset, move: s.move, burn: s.burn, dustRoad: s.dustRoad, quality: "final" as const, letterbox: 2.39, tOffset: s.t }} />
    ))}
    <Composition id="BattleTest" component={BattleTest} durationInFrames={300} fps={30} width={1080} height={1920} />
  </>
);
