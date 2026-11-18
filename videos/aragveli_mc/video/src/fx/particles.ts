// Deterministic voxel particle emitters. Every particle is a pure function of (emitter, index, time),
// so frames can be rendered in any order. Kinds: wind dust, smoke, fire, embers/sparks, ash, river mist,
// and a reusable dust trail that later attaches to moving armies.
import * as THREE from "three";

export type Blend = "alpha" | "additive";
export interface Particle { x: number; y: number; z: number; s: number; sy: number; r: number; c: THREE.Color; a: number }
export interface Emitter {
  id: number; blend: Blend; rate: number; life: [number, number];
  emit: (k: number, age: number, life: number, R: () => number, wind: THREE.Vector2, out: Particle) => boolean;
}

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Collects live particles of all emitters at time t (seconds of simulation time). */
export function collect(emitters: Emitter[], t: number, wind: THREE.Vector2, sink: (blend: Blend, p: Particle) => void, budget = { alpha: 16000, additive: 9000 }) {
  const used = { alpha: 0, additive: 0 };
  const p: Particle = { x: 0, y: 0, z: 0, s: 1, sy: 1, r: 0, c: new THREE.Color(), a: 1 };
  for (const e of emitters) {
    const k0 = Math.floor((t - e.life[1]) * e.rate), k1 = Math.floor(t * e.rate);
    for (let k = Math.max(0, k0); k <= k1; k++) {
      if (used[e.blend] >= budget[e.blend]) break;
      const age = t - k / e.rate;
      if (age < 0) continue;
      const R = rng(e.id * 7919 + k * 104729);
      const life = e.life[0] + R() * (e.life[1] - e.life[0]);
      if (age > life) continue;
      if (e.emit(k, age, life, R, wind, p)) { sink(e.blend, p); used[e.blend]++; }
    }
  }
  return used;
}

const turb = (t: number, seed: number) => Math.sin(t * 1.3 + seed * 17) * 0.6 + Math.sin(t * 2.9 + seed * 5) * 0.4;

// ------------------------------------------------------------------ emitter factories
type Ground = (x: number, z: number) => number;

/** Dust carried by the wind across the ground around a centre (fine grains + low dust sheets). */
export function windDust(id: number, center: () => THREE.Vector3, radius: number, density: number, ground: Ground, color = "#cdb68a"): Emitter[] {
  const col = new THREE.Color(color);
  return [{
    id, blend: "alpha", rate: 140 * density, life: [3, 6],
    emit: (k, age, life, R, w, o) => {
      const c = center();
      const x0 = c.x + (R() - 0.5) * radius * 2, z0 = c.z + (R() - 0.5) * radius * 2;
      const sp = 3 + R() * 4;
      o.x = x0 + w.x * sp * age + turb(age, k) * 0.6; o.z = z0 + w.y * sp * age;
      o.y = ground(x0, z0) + 0.2 + R() * 1.6 + Math.abs(turb(age * 1.7, k + 3)) * 1.2;
      const f = age / life; o.s = 0.06 + R() * 0.16; o.sy = o.s; o.r = age * (1 + R());
      o.c.copy(col).multiplyScalar(0.85 + R() * 0.3); o.a = 0.65 * Math.sin(Math.PI * f);
      return true;
    },
  }, {
    id: id + 1, blend: "alpha", rate: 9 * density, life: [5, 9],
    emit: (k, age, life, R, w, o) => {
      const c = center();
      const x0 = c.x + (R() - 0.5) * radius * 2.4, z0 = c.z + (R() - 0.5) * radius * 2.4;
      const sp = 2.5 + R() * 2;
      o.x = x0 + w.x * sp * age; o.z = z0 + w.y * sp * age; o.y = ground(x0, z0) + 0.6 + age * 0.25;
      const f = age / life; o.s = 4 + R() * 6 + age * 0.8; o.sy = 0.8 + R(); o.r = R() * 3;
      o.c.copy(col); o.a = 0.13 * Math.sin(Math.PI * f) * density;
      return true;
    },
  }];
}

/** Rising smoke column from a point. strength ~1 for a burning house. */
export function smoke(id: number, src: THREE.Vector3, strength = 1, dark = 0.7): Emitter {
  return {
    id, blend: "alpha", rate: 5 * strength, life: [6, 11],
    emit: (k, age, life, R, w, o) => {
      const f = age / life;
      const rise = 2.2 + R() * 1.8;
      o.x = src.x + (R() - 0.5) * 3 + w.x * age * age * 0.35 + turb(age * 0.6, k) * age * 0.3;
      o.z = src.z + (R() - 0.5) * 3 + w.y * age * age * 0.35;
      o.y = src.y + rise * age * (1 - f * 0.35);
      o.s = (1.5 + R() * 1.5) * (1 + age * 1.3) * Math.sqrt(strength); o.sy = o.s * 0.8; o.r = R() * 6 + age * 0.2;
      const g = 0.08 + (1 - dark) * 0.35 + f * 0.25 + R() * 0.06;
      o.c.setRGB(g, g * 0.95, g * 0.92); o.a = 0.55 * (1 - f) * Math.min(1, age * 2);
      return true;
    },
  };
}

/** Voxel flames (HDR additive, drive bloom). */
export function fire(id: number, src: THREE.Vector3, size = 1): Emitter {
  return {
    id, blend: "additive", rate: 26 * size, life: [0.35, 0.95],
    emit: (k, age, life, R, w, o) => {
      const f = age / life;
      o.x = src.x + (R() - 0.5) * 4 * size + w.x * age * 1.5; o.z = src.z + (R() - 0.5) * 4 * size + w.y * age * 1.5;
      o.y = src.y + (1.5 + R() * 3) * age * size + 0.3;
      o.s = (0.5 + R() * 1.1) * size * (1 - f * 0.7); o.sy = o.s * 1.3; o.r = R() * 6;
      const heat = 1 - f;
      o.c.setRGB(3.2 * heat + 0.6, 1.4 * heat * heat + 0.12, 0.25 * heat * heat * heat); o.a = 1;
      return true;
    },
  };
}

/** Embers / sparks rising and swirling. */
export function embers(id: number, center: () => THREE.Vector3, spread: number, rate: number, height = 0): Emitter {
  return {
    id, blend: "additive", rate, life: [2, 4.5],
    emit: (k, age, life, R, w, o) => {
      const c = center(), f = age / life;
      o.x = c.x + (R() - 0.5) * spread + w.x * age * 3 + turb(age * 2, k) * 1.5;
      o.z = c.z + (R() - 0.5) * spread + w.y * age * 3 + turb(age * 2.3, k + 9) * 1.5;
      o.y = c.y + height + (2 + R() * 4) * age;
      o.s = 0.12 + R() * 0.12; o.sy = o.s; o.r = age * 4;
      const fl = 0.6 + 0.4 * Math.sin(age * 20 + k);
      o.c.setRGB(2.8 * fl, 1.0 * fl, 0.2 * fl).multiplyScalar(1 - f); o.a = 1;
      return true;
    },
  };
}

/** Ash flakes slowly falling and tumbling around the camera. */
export function ash(id: number, center: () => THREE.Vector3, radius: number, density: number): Emitter {
  return {
    id, blend: "alpha", rate: 220 * density, life: [5, 9],
    emit: (k, age, life, R, w, o) => {
      const c = center(), f = age / life;
      o.x = c.x + (R() - 0.5) * radius * 2 + w.x * age * 1.5 + turb(age, k) * 0.8;
      o.z = c.z + (R() - 0.5) * radius * 2 + w.y * age * 1.5 + turb(age * 1.2, k + 4) * 0.8;
      o.y = c.y + (R() - 0.3) * radius * 0.6 - age * (0.4 + R() * 0.4);
      o.s = 0.06 + R() * 0.08; o.sy = 0.02; o.r = age * (2 + R() * 3);
      const g = 0.35 + R() * 0.3; o.c.setRGB(g, g, g); o.a = 0.8 * Math.sin(Math.PI * f);
      return true;
    },
  };
}

/** Mist banks over the river: wide, thin, slow, low alpha. points = river polyline in local metres. */
export function riverMist(id: number, points: [number, number][], level: (x: number, z: number) => number, density: number, near: () => THREE.Vector3, radius = 900): Emitter {
  return {
    id, blend: "alpha", rate: 18 * density, life: [9, 16],
    emit: (k, age, life, R, w, o) => {
      const c = near();
      const i = Math.floor(R() * (points.length - 1));
      const [ax, az] = points[i], [bx, bz] = points[i + 1]; const u = R();
      const x0 = ax + (bx - ax) * u + (R() - 0.5) * 50, z0 = az + (bz - az) * u + (R() - 0.5) * 50;
      if (Math.hypot(x0 - c.x, z0 - c.z) > radius) return false;
      const f = age / life;
      o.x = x0 + w.x * age * 0.8; o.z = z0 + w.y * age * 0.8; o.y = level(x0, z0) + 0.8 + R() * 3 + age * 0.1;
      o.s = 10 + R() * 18; o.sy = 1 + R() * 1.5; o.r = R() * 3;
      o.c.setRGB(0.92, 0.94, 0.97); o.a = 0.16 * Math.sin(Math.PI * f) * density;
      return true;
    },
  };
}

/** Dust trail behind a moving source (cavalry, columns on the march). path(t) -> ground position. */
export function dustTrail(id: number, path: (t: number) => THREE.Vector3, opts: { width?: number; rate?: number; color?: string; height?: number } = {}): Emitter {
  const col = new THREE.Color(opts.color ?? "#c8b088");
  const width = opts.width ?? 30;
  return {
    id, blend: "alpha", rate: opts.rate ?? 60, life: [3, 7],
    emit: (k, age, life, R, w, o) => {
      const t0 = k / (opts.rate ?? 60);
      const p = path(t0);
      const f = age / life;
      o.x = p.x + (R() - 0.5) * width + w.x * age * 2; o.z = p.z + (R() - 0.5) * width * 0.6 + w.y * age * 2;
      o.y = p.y + 0.5 + age * (0.7 + R() * 0.8) * (opts.height ?? 1);
      o.s = (1.2 + R() * 2) * (1 + age * 0.9); o.sy = o.s * 0.7; o.r = R() * 6;
      o.c.copy(col).multiplyScalar(0.85 + R() * 0.25); o.a = 0.42 * (1 - f) * Math.min(1, age * 3);
      return true;
    },
  };
}
