import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import scriptJson from "../data/script.json";
import { timings, FPS } from "./timing";
import { Background, Fonts, Header, ProgressBar, SectionLabel, fadeInOut, sceneFrames } from "./components/chrome";
import { Subtitles } from "./components/Subtitles";
import { S01, S02, S03, S04 } from "./scenes/scenes1";
import { S05, S06, S07, S08, S09, S10 } from "./scenes/scenes2";

const SCENES: Record<string, React.FC> = { s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06, s07: S07, s08: S08, s09: S09, s10: S10 };
const meta = scriptJson.scenes as { id: string; tag: string; label: string }[];

const SceneWrap: React.FC<{ dur: number; first: boolean; children: React.ReactNode }> = ({ dur, first, children }) => {
  const f = useCurrentFrame();
  // the first scene is the cover frame: no fade-in
  const o = first ? Math.min(1, fadeInOut(f + 6, dur + 6)) : fadeInOut(f, dur);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const currentTag = (t: number) => {
  let tag = meta[0].tag;
  timings.scenes.forEach((s, i) => {
    if (t >= s.start - 0.05) tag = meta[i].tag;
  });
  return tag;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#040b20" }}>
      <Fonts />
      <Background />
      <Html5Audio src={staticFile("voice.wav")} />
      <Header tag={currentTag(f / FPS)} />
      <ProgressBar />
      {timings.scenes.map((s, i) => {
        const { from, dur } = sceneFrames(s.id);
        const Comp = SCENES[s.id];
        const start = from;
        const length = dur;
        return (
          <Sequence key={s.id} from={start} durationInFrames={length} name={`${s.id} ${meta[i].label}`}>
            <SceneWrap dur={length} first={i === 0}>
              <SectionLabel n={i + 1} label={meta[i].label} danger={["s05", "s08"].includes(s.id)} />
              <Comp />
            </SceneWrap>
          </Sequence>
        );
      })}
      <Subtitles />
    </AbsoluteFill>
  );
};
