import React from "react";
import { Composition } from "remotion";
import { FLYOVERS, STILLS } from "./camera/shots";
import { BattleTest } from "./scenes/BattleTest";
import { SetProof as SP } from "./scenes/SetProof";
import { CharacterSheet as CS } from "./scenes/CharacterSheet";
import { FaceAnim, FaceSheet } from "./scenes/FaceTest";
import { PoseTest as PT } from "./scenes/PoseTest";
const PoseTest = PT as unknown as React.FC<Record<string, unknown>>;
const CharacterSheet = CS as unknown as React.FC<Record<string, unknown>>;
const SetProof = SP as unknown as React.FC<Record<string, unknown>>;
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
    {(["medium", "wide", "low", "cast"] as const).map((shot) => (
      <Composition key={shot} id={`Proof-${shot}`} component={SetProof} durationInFrames={1} {...MASTER} defaultProps={{ shot }} />
    ))}
    {(["front", "back", "three"] as const).map((view) => (
      <Composition key={view} id={`Chars-${view}`} component={CharacterSheet} durationInFrames={1} {...MASTER} defaultProps={{ view }} />
    ))}
    <Composition id="Faces-sheet" component={FaceSheet} durationInFrames={1} {...MASTER} />
    <Composition id="Faces-anim" component={FaceAnim} durationInFrames={8 * 24} {...MASTER} />
    {(["cry", "shock"] as const).map((beat) => (
      <Composition key={beat} id={`Pose-${beat}`} component={PoseTest} durationInFrames={4 * 24} {...MASTER} defaultProps={{ beat }} />
    ))}
    <Composition id="BattleTest" component={BattleTest} durationInFrames={300} fps={30} width={1080} height={1920} />
  </>
);
