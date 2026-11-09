import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { config } from "../config";
import { timings, FPS, bare, keywordColor, Word } from "../timing";
import { LAYOUT } from "./chrome";

const MAX_WORDS = 3;
const MAX_CHARS = 20; // Georgian words are long; keep one line at 84px

type Chunk = { words: Word[]; start: number; end: number };

/** Split every sentence into 1–3 word chunks; break after punctuation. */
const buildChunks = (): Chunk[] => {
  const out: Chunk[] = [];
  for (const sc of timings.scenes) {
    for (const s of sc.sentences) {
      let cur: Word[] = [];
      const flush = () => {
        if (cur.length) out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
        cur = [];
      };
      for (const w of s.words) {
        const len = cur.reduce((a, x) => a + bare(x.w).length + 1, 0) + bare(w.w).length;
        if (cur.length >= MAX_WORDS || (cur.length > 0 && len > MAX_CHARS)) flush();
        cur.push(w);
        if (/[,.:;?!]$/.test(w.w)) flush();
      }
      flush();
    }
  }
  return out;
};

const chunks = buildChunks();
export const subtitleChunks = chunks;

export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // current chunk: last one that started; hide 0.5 s after its end if nothing follows
  let idx = -1;
  for (let i = 0; i < chunks.length; i++) if (chunks[i].start <= t + 0.02) idx = i;
  if (idx < 0) return null;
  const ch = chunks[idx];
  const next = chunks[idx + 1];
  const hideAt = Math.min(next ? next.start : Infinity, ch.end + 0.5);
  if (t > hideAt) return null;
  const inP = interpolate(t, [ch.start, ch.start + 0.12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: LAYOUT.subtitleTop,
        left: 40,
        right: 40,
        height: LAYOUT.subtitleBottom - LAYOUT.subtitleTop,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        columnGap: 24,
        transform: `translateY(${(1 - inP) * 10}px) scale(${0.96 + 0.04 * inP})`,
        textAlign: "center",
      }}
    >
      {ch.words.map((w, i) => {
        const spoken = t >= w.start - 0.03;
        const kc = keywordColor(w.w);
        const color = spoken ? kc ?? config.colors.text : config.colors.subtitleIdle;
        return (
          <span
            key={i}
            style={{
              fontFamily: config.fonts.ka,
              fontWeight: 900,
              fontSize: 80,
              lineHeight: 1.25,
              color,
              textShadow: "0 4px 18px rgba(0,0,0,0.55)",
              whiteSpace: "nowrap",
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};
