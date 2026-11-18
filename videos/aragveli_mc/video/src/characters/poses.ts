// Pose library and helpers: blending, easing, walk cycle. Angles in radians, root in skin pixels.
import { Pose } from "./Character";

type V3 = [number, number, number];
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const L3 = (a: V3 | undefined, b: V3 | undefined, t: number): V3 => { const x = a ?? [0, 0, 0], y = b ?? [0, 0, 0]; return [L(x[0], y[0], t), L(x[1], y[1], t), L(x[2], y[2], t)]; };

export function blend(a: Pose, b: Pose, t: number): Pose {
  return {
    root: L3(a.root, b.root, t), hips: L3(a.hips, b.hips, t), torso: L3(a.torso, b.torso, t), head: L3(a.head, b.head, t),
    rarm: L3(a.rarm, b.rarm, t), relbow: L(a.relbow ?? 0, b.relbow ?? 0, t), larm: L3(a.larm, b.larm, t), lelbow: L(a.lelbow ?? 0, b.lelbow ?? 0, t),
    rleg: L3(a.rleg, b.rleg, t), rknee: L(a.rknee ?? 0, b.rknee ?? 0, t), lleg: L3(a.lleg, b.lleg, t), lknee: L(a.lknee ?? 0, b.lknee ?? 0, t),
    item: L3(a.item, b.item, t),
  };
}
/** Adds b on top of a (for breathing, tremble, walk). */
export function add(a: Pose, b: Pose): Pose {
  const s3 = (x?: V3, y?: V3): V3 => { const p = x ?? [0, 0, 0], q = y ?? [0, 0, 0]; return [p[0] + q[0], p[1] + q[1], p[2] + q[2]]; };
  return {
    root: s3(a.root, b.root), hips: s3(a.hips, b.hips), torso: s3(a.torso, b.torso), head: s3(a.head, b.head),
    rarm: s3(a.rarm, b.rarm), relbow: (a.relbow ?? 0) + (b.relbow ?? 0), larm: s3(a.larm, b.larm), lelbow: (a.lelbow ?? 0) + (b.lelbow ?? 0),
    rleg: s3(a.rleg, b.rleg), rknee: (a.rknee ?? 0) + (b.rknee ?? 0), lleg: s3(a.lleg, b.lleg), lknee: (a.lknee ?? 0) + (b.lknee ?? 0),
    item: s3(a.item, b.item),
  };
}

export const ease = {
  inOut: (u: number) => u * u * (3 - 2 * u),
  out: (u: number) => 1 - Math.pow(1 - u, 3),
  in: (u: number) => u * u * u,
  /** fast out with a little overshoot (snappy action) */
  outBack: (u: number) => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); },
};

export interface PoseKey { t: number; pose: Pose; ease?: keyof typeof ease }
/** Pose at time t from keyframes (each key's ease applies to the transition into it). */
export function poseAt(keys: PoseKey[], t: number): Pose {
  if (t <= keys[0].t) return keys[0].pose;
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const u = (t - keys[i - 1].t) / (keys[i].t - keys[i - 1].t);
      return blend(keys[i - 1].pose, keys[i].pose, ease[keys[i].ease ?? "inOut"](Math.max(0, Math.min(1, u))));
    }
  }
  return keys[keys.length - 1].pose;
}

// ------------------------------------------------------------------ library
export const POSES: Record<string, Pose> = {
  ready: {   // sword held forward-up, weight low
    root: [0, -0.4, 0], torso: [0.05, 0.1, 0], head: [0.05, -0.1, 0],
    rarm: [-0.55, 0, -0.12], relbow: 0.7, larm: [-0.45, 0, 0.2], lelbow: 0.9,
    rleg: [0.15, 0, -0.08], rknee: 0.15, lleg: [-0.25, 0, 0.1], lknee: 0.25,
  },
  windup: {  // anticipation: crouch, sword arm drawn back
    root: [0, -1.6, 0], torso: [0.25, 0.35, 0], head: [0.15, -0.2, 0],
    rarm: [0.5, 0, -0.35], relbow: 0.9, larm: [-0.9, 0, 0.35], lelbow: 1.2,
    rleg: [0.35, 0, -0.18], rknee: 0.55, lleg: [-0.45, 0, 0.18], lknee: 0.5,
  },
  battleCry: {   // sword raised straight up, other fist forward, wide stance, shouting upward
    root: [0, -1.0, 0], torso: [0.1, 0.18, 0.02], head: [-0.18, -0.12, 0.05],
    rarm: [-2.95, 0, -0.12], relbow: 0.12, larm: [-1.25, 0, 0.32], lelbow: 1.45,
    rleg: [0.1, 0, -0.26], rknee: 0.3, lleg: [-0.1, 0, 0.26], lknee: 0.25,
    item: [0, 0, -2.36],
  },
  shock: {   // recoil: wide low stance, sword across the body, other arm flung up, head tilted
    root: [0, -1.8, -1.0], torso: [-0.14, -0.22, 0.05], head: [0.05, 0.22, -0.16],
    rarm: [-0.25, 0, -0.8], relbow: 1.1, larm: [-2.2, 0, 0.55], lelbow: 1.0,
    rleg: [-0.05, 0, -0.38], rknee: 0.5, lleg: [0.05, 0, 0.38], lknee: 0.45,
    item: [0.2, -1.3, -1.0],
  },
};

/** Walk / march cycle (phase in cycles). amp 0..1. */
export function walk(phase: number, amp = 1, swordArm = true): Pose {
  const a = Math.sin(phase * Math.PI * 2), c = Math.cos(phase * Math.PI * 2);
  return {
    root: [0, -Math.abs(c) * 0.7 * amp, 0], torso: [0.06 * amp, a * 0.06 * amp, 0], head: [0, -a * 0.04, 0],
    rleg: [a * 0.55 * amp, 0, 0], rknee: Math.max(0, -a) * 0.8 * amp + 0.05,
    lleg: [-a * 0.55 * amp, 0, 0], lknee: Math.max(0, a) * 0.8 * amp + 0.05,
    rarm: swordArm ? [-0.5, 0, -0.1] : [-a * 0.45 * amp, 0, -0.06], relbow: swordArm ? 0.6 : 0.25,
    larm: [a * 0.45 * amp, 0, 0.06], lelbow: 0.25,
  };
}

/** Breathing + small tremble for held poses. */
export function alive(t: number, seed = 1, tremble = 0): Pose {
  const b = Math.sin(t * 2.4 + seed) * 0.03;
  const tr = tremble * (Math.sin(t * 31 + seed) * 0.6 + Math.sin(t * 47 + seed * 2) * 0.4);
  return { torso: [b, 0, 0], head: [-b * 0.5, Math.sin(t * 0.9 + seed) * 0.04, 0], rarm: [tr * 0.04, 0, tr * 0.02], larm: [b * 0.6, 0, 0], root: [0, b * 6, 0] };
}
