import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./config";
import { BattleTest } from "./scenes/BattleTest";

export const Root: React.FC = () => (
  <>
    <Composition id="BattleTest" component={BattleTest} durationInFrames={10 * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
