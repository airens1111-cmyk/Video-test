import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import scriptJson from "../data/script.json";
import { timings, FPS, toFrames } from "./timing";
import { Background, Fonts, Header, ProgressBar, SectionLabel, sceneTransform, sceneFrames, TransitionSweep } from "./components/chrome";
import { Subtitles } from "./components/Subtitles";
import { S01, S02, S03, S04, S05, S06, S07 } from "./scenes/scenes";
import timingsJson from "../data/timings.json";

const SCENES: Record<string, React.FC> = { s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06, s07: S07 };
// draft timings have no audio yet
const HAS_AUDIO = !String((timingsJson as { method?: string }).method ?? "").startsWith("DRAFT");
const meta = scriptJson.scenes as { id: string; tag: string; label: string }[];

const SceneWrap: React.FC<{ dur: number; first: boolean; children: React.ReactNode }> = ({ dur, first, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={sceneTransform(f, dur, first)}>{children}</AbsoluteFill>;
};

const currentScene = (t: number) => {
  let idx = 0;
  timings.scenes.forEach((s, i) => {
    if (t >= s.start - 0.05) idx = i;
  });
  return idx;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const idx = currentScene(f / FPS);
  return (
    <AbsoluteFill style={{ backgroundColor: "#040b20" }}>
      <Fonts />
      <Background />
      {HAS_AUDIO ? <Html5Audio src={staticFile("mix.wav")} /> : null}
      <Header tag={meta[idx].tag} tagStart={idx === 0 ? -20 : toFrames(timings.scenes[idx].start)} />
      <ProgressBar />
      {timings.scenes.map((s, i) => {
        const { from, dur } = sceneFrames(s.id);
        const Comp = SCENES[s.id];
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={`${s.id} ${meta[i].label}`}>
            <SceneWrap dur={dur} first={i === 0}>
              <SectionLabel n={i + 1} label={meta[i].label} danger={["s04"].includes(s.id)} />
              <Comp />
            </SceneWrap>
          </Sequence>
        );
      })}
      <TransitionSweep />
      <Subtitles />
    </AbsoluteFill>
  );
};
