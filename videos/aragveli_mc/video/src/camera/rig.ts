// Camera rig: keyframed position / target / lens (mm) / roll / focus / f-stop with easing curves,
// plus modifiers (handheld Perlin-like shake, whip pans, slow-motion time warps) and 16:9 / 9:16 framing.
import * as THREE from "three";

export type Vec3 = [number, number, number];
export type Ease = "linear" | "in" | "out" | "inOut" | "inOutCubic" | "outExpo";
export interface Key {
  t: number; pos: Vec3; target: Vec3;
  lens?: number;             // focal length in mm (Super 35 equivalent): 18 / 24 / 35 / 50 / 85 ...
  roll?: number;             // degrees
  focus?: number | "target"; // metres or the target distance
  fstop?: number;            // 0 = no depth of field
  ease?: Ease;               // easing used from this key to the next
}
export interface Move {
  id: string; label: string; keys: Key[];
  agl?: boolean;                                       // y values are metres above ground
  handheld?: { amp: number; freq: number };            // amp in degrees
  whips?: { t: number; dur: number; yaw: number }[];   // fast pans, yaw in degrees
  slowmo?: { from: number; to: number; speed: number }[];
  vertical?: { crop?: number; pan?: number; tilt?: number }; // 9:16 framing: share of master width, horizontal offset (-1..1), tilt (deg)
}

export const SENSOR_W = 24.89; // mm, Super 35 width (master 2.39:1 image spans the full width)
export const LENSES = [18, 24, 35, 50, 85];

const EASE: Record<Ease, (u: number) => number> = {
  linear: (u) => u,
  in: (u) => u * u,
  out: (u) => 1 - (1 - u) * (1 - u),
  inOut: (u) => u * u * (3 - 2 * u),
  inOutCubic: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
};

const cr = (p0: number, p1: number, p2: number, p3: number, u: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);

function catmull(keys: Key[], i: number, u: number, f: "pos" | "target"): Vec3 {
  const k = (j: number) => keys[Math.max(0, Math.min(keys.length - 1, j))][f];
  const a = k(i - 1), b = k(i), c = k(i + 1), d = k(i + 2);
  return [cr(a[0], b[0], c[0], d[0], u), cr(a[1], b[1], c[1], d[1], u), cr(a[2], b[2], c[2], d[2], u)];
}

/** Smooth pseudo-Perlin noise in [-1, 1]. */
export function pnoise(t: number, seed: number) {
  return (Math.sin(t * 1.0 + seed * 1.7) * 0.5 + Math.sin(t * 2.31 + seed * 4.1) * 0.3 + Math.sin(t * 4.73 + seed * 9.3) * 0.2);
}

export interface CamState { pos: THREE.Vector3; target: THREE.Vector3; lens: number; roll: number; focus: number; fstop: number; yawOffset: number; pitchOffset: number; motion: [number, number] }

export function evalMove(m: Move, t: number, ground?: (x: number, z: number) => number): CamState {
  const keys = m.keys;
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[Math.min(keys.length - 1, i + 1)];
  const span = Math.max(1e-6, b.t - a.t);
  const u = EASE[a.ease ?? "inOut"](Math.max(0, Math.min(1, (t - a.t) / span)));
  const p = catmull(keys, i, u, "pos"), q = catmull(keys, i, u, "target");
  const lerp = (x?: number, y?: number, d = 0) => (x ?? d) + ((y ?? x ?? d) - (x ?? d)) * u;
  const pos = new THREE.Vector3(...p), target = new THREE.Vector3(...q);
  if (m.agl && ground) { pos.y += ground(pos.x, pos.z); target.y += ground(target.x, target.z); }
  if (ground) pos.y = Math.max(pos.y, ground(pos.x, pos.z) + 1.2);
  const fa = a.focus === "target" || a.focus === undefined ? pos.distanceTo(target) : a.focus;
  const fb = b.focus === "target" || b.focus === undefined ? pos.distanceTo(target) : b.focus;
  let yaw = 0, pitch = 0, roll = lerp(a.roll, b.roll);
  if (m.handheld) {
    const f = m.handheld.freq, A = m.handheld.amp;
    yaw += pnoise(t * f, 1) * A; pitch += pnoise(t * f * 1.1, 2) * A * 0.7; roll += pnoise(t * f * 0.8, 3) * A * 0.5;
  }
  let motion: [number, number] = [0, 0];
  for (const w of m.whips ?? []) {
    const k = Math.max(0, Math.min(1, (t - w.t) / w.dur));
    yaw += w.yaw * EASE.inOutCubic(k);
    const dk = 1 / 24 / w.dur;
    const speed = Math.abs(EASE.inOutCubic(Math.min(1, k + dk)) - EASE.inOutCubic(k)) * w.yaw;   // deg per frame
    motion = [Math.sign(w.yaw) * Math.min(0.05, speed * 0.004), 0];
  }
  return { pos, target, lens: lerp(a.lens, b.lens, 35), roll, focus: fa + (fb - fa) * u, fstop: lerp(a.fstop, b.fstop, 0), yawOffset: yaw, pitchOffset: pitch, motion };
}

/** Horizontal FOV (deg) of the master frame for a focal length. */
export const hfovFor = (mm: number) => THREE.MathUtils.radToDeg(2 * Math.atan(SENSOR_W / (2 * mm)));

/** Applies a CamState to a three camera. aspect = render width/height; vertical framing for portrait renders. */
export function applyCamera(cam: THREE.PerspectiveCamera, s: CamState, aspect: number, m?: Move) {
  const portrait = aspect < 1;
  const h = THREE.MathUtils.degToRad(hfovFor(s.lens));
  let hf = h;
  let yaw = s.yawOffset, pitch = s.pitchOffset;
  if (portrait) {
    const crop = m?.vertical?.crop ?? 0.5;
    hf = 2 * Math.atan(Math.tan(h / 2) * crop);
    yaw += THREE.MathUtils.radToDeg(Math.atan(Math.tan(h / 2) * (m?.vertical?.pan ?? 0))) * -1;
    pitch += m?.vertical?.tilt ?? 0;
  }
  cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hf / 2) / aspect));
  cam.aspect = aspect;
  cam.position.copy(s.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(s.target);
  cam.rotateY(THREE.MathUtils.degToRad(yaw));
  cam.rotateX(THREE.MathUtils.degToRad(pitch));
  cam.rotateZ(THREE.MathUtils.degToRad(s.roll));
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}

/** Simulation time with slow-motion segments (0.4 s ramps), for particles / wind. */
export function simTime(m: Move, t: number, fps = 24) {
  if (!m.slowmo?.length) return t;
  let s = 0; const dt = 1 / fps;
  for (let x = 0; x < t; x += dt) {
    let sp = 1;
    for (const g of m.slowmo) {
      const k = Math.min(1, Math.max(0, (x - g.from) / 0.4)) * (1 - Math.min(1, Math.max(0, (x - g.to) / 0.4)));
      sp += (g.speed - 1) * k;
    }
    s += sp * Math.min(dt, t - x);
  }
  return s;
}

// ------------------------------------------------------------------ move builders
export const dolly = (id: string, label: string, from: Vec3, to: Vec3, target: Vec3 | [Vec3, Vec3], dur: number, lens = 35, ease: Ease = "inOut"): Move => ({
  id, label, agl: true,
  keys: [{ t: 0, pos: from, target: Array.isArray(target[0]) ? (target as [Vec3, Vec3])[0] : (target as Vec3), lens, ease }, { t: dur, pos: to, target: Array.isArray(target[0]) ? (target as [Vec3, Vec3])[1] : (target as Vec3), lens }],
});

export function orbit(id: string, label: string, c: Vec3, radius: number, height: number, a0: number, a1: number, dur: number, lens = 35, steps = 6): Move {
  const keys: Key[] = [];
  for (let k = 0; k <= steps; k++) {
    const a = THREE.MathUtils.degToRad(a0 + ((a1 - a0) * k) / steps);
    keys.push({ t: (dur * k) / steps, pos: [c[0] + Math.cos(a) * radius, height, c[2] + Math.sin(a) * radius], target: c, lens, ease: "linear" });
  }
  return { id, label, agl: true, keys };
}

export function track(id: string, label: string, path: [number, number][], agl: number, lookAhead: number, lookAgl: number, dur: number, lens = 35, side = 0): Move {
  const keys: Key[] = path.map((p, k) => {
    const nx = path[Math.min(path.length - 1, k + 1)], pv = path[Math.max(0, k - 1)];
    const dx = nx[0] - pv[0], dz = nx[1] - pv[1], L = Math.hypot(dx, dz) || 1;
    const tx = p[0] + (dx / L) * lookAhead - (dz / L) * side, tz = p[1] + (dz / L) * lookAhead + (dx / L) * side;
    return { t: (dur * k) / (path.length - 1), pos: [p[0], agl, p[1]] as Vec3, target: [tx, lookAgl, tz] as Vec3, lens, ease: "linear" as Ease };
  });
  return { id, label, agl: true, keys };
}
