import timingsJson from "../data/timings.json";
import keywordsJson from "../data/keywords.json";
import { config, ColorKey } from "./config";

export type Word = { w: string; start: number; end: number };
export type Sentence = { text: string; start: number; end: number; words: Word[] };
export type Scene = { id: string; start: number; end: number; sentences: Sentence[] };
type Timings = { duration: number; scenes: Scene[] };

export const timings = timingsJson as unknown as Timings;
export const FPS = config.video.fps;
export const toFrames = (s: number) => Math.round(s * FPS);
export const totalFrames = toFrames(timings.duration);

export const bare = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "");

export const sceneById = (id: string): Scene => {
  const s = timings.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`scene ${id} missing in timings.json`);
  return s;
};

/** Frame (relative to scene start) when a word starting with `prefix` begins. */
export const cue = (sceneId: string, prefix: string, nth = 0): number => {
  const sc = sceneById(sceneId);
  const hits = sc.sentences.flatMap((s) => s.words).filter((w) => bare(w.w).startsWith(prefix));
  const hit = hits[nth];
  if (!hit) throw new Error(`cue "${prefix}" not found in ${sceneId}`);
  return toFrames(hit.start - sc.start);
};

/** Frame (relative to scene start) when sentence n begins / ends. */
export const sentenceStart = (sceneId: string, n: number) => {
  const sc = sceneById(sceneId);
  return toFrames(sc.sentences[n].start - sc.start);
};
export const sentenceEnd = (sceneId: string, n: number) => {
  const sc = sceneById(sceneId);
  return toFrames(sc.sentences[n].end - sc.start);
};

const keywords = Object.entries(keywordsJson).filter(([k]) => !k.startsWith("_")) as [string, ColorKey][];
export const keywordColor = (w: string): string | null => {
  const b = bare(w);
  for (const [k, c] of keywords) if (b.startsWith(k)) return config.colors[c];
  return null;
};
