import * as THREE from "three";
import { smooth } from "./random";

/** Real time -> simulation time, with slow-motion segments [t0, t1, speed]. Ramps 0.4 s in/out. */
export function makeTimeWarp(segments: { from: number; to: number; speed: number }[], fps: number, frames: number) {
  const sim = new Float64Array(frames + 1);
  const speedAt = (t: number) => {
    let s = 1;
    for (const g of segments) {
      const k = smooth((t - g.from) / 0.4) * (1 - smooth((t - g.to) / 0.4));
      s = s + (g.speed - 1) * k;
    }
    return s;
  };
  for (let f = 1; f <= frames; f++) sim[f] = sim[f - 1] + speedAt((f - 0.5) / fps) / fps;
  return { sim: (frame: number) => sim[Math.max(0, Math.min(frames, frame))], speedAt };
}

export interface Shot { from: number; to: number; pos: (u: number) => THREE.Vector3Tuple; look: (u: number) => THREE.Vector3Tuple; fov?: (u: number) => number; shake?: number; }

export function cameraAt(shots: Shot[], t: number) {
  const s = shots.find((x) => t >= x.from && t < x.to) ?? shots[shots.length - 1];
  const u = Math.min(1, Math.max(0, (t - s.from) / (s.to - s.from)));
  const p = s.pos(u), l = s.look(u);
  const sh = s.shake ?? 0;
  if (sh) { p[0] += Math.sin(t * 23.1) * sh; p[1] += Math.sin(t * 19.7 + 1) * sh; }
  return { pos: p, look: l, fov: s.fov ? s.fov(u) : undefined };
}
