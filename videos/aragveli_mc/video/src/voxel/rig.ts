// Voxel character and horse rigs: pure math, writes instance matrices for InstancedMesh parts.
// Units: 1 block = 1 unit; a soldier is 2 units tall, faces local +z, right hand on local -x.
import * as THREE from "three";
import { clamp, easeOut, hash1, lerp, smooth } from "./random";

export type Side = 0 | 1; // 0 = Georgian, 1 = Qajar army
export type Role = "duel" | "press" | "rider" | "flee" | "guard";

export interface Soldier {
  id: number;
  side: Side;
  role: Role;
  x: number; z: number; yaw: number;
  phase: number;           // personal animation phase (s)
  period: number;          // duel cycle (s)
  attackFirst: boolean;    // duel: attacks in first half-cycle
  shield: boolean;
  weapon: "sword" | "spear" | "none";
  fallT: number;           // sim time when hit fatally (Infinity = never)
  fallDir: number;         // +1 backward, -1 forward
  mount?: number;          // horse index for riders
  coat: THREE.Color; skin: THREE.Color; pants: THREE.Color; helm: THREE.Color;
  bearded: boolean;
  hat: "helm" | "papakha" | "turban";
  wander?: { dx: number; dz: number; t0: number; t1: number };
}

export interface Horse {
  id: number; side: Side;
  x0: number; z0: number; dirX: number; dirZ: number; speed: number; t0: number;
  phase: number; color: THREE.Color;
}

export interface Pose {
  m: THREE.Matrix4;          // root (feet at origin)
  twist: number; lean: number; headPitch: number;
  armR: number; armRz: number; wrist: number;
  armL: number; armLz: number;
  legL: number; legR: number; legSpread: number;
}

const _m = new THREE.Matrix4();
const _a = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

export const T = (out: THREE.Matrix4, x: number, y: number, z: number) => out.makeTranslation(x, y, z);
const mulT = (m: THREE.Matrix4, x: number, y: number, z: number) => m.multiply(_a.makeTranslation(x, y, z));
const mulRx = (m: THREE.Matrix4, a: number) => m.multiply(_a.makeRotationX(a));
const mulRy = (m: THREE.Matrix4, a: number) => m.multiply(_a.makeRotationY(a));
const mulRz = (m: THREE.Matrix4, a: number) => m.multiply(_a.makeRotationZ(a));
const mulS = (m: THREE.Matrix4, x: number, y: number, z: number) => m.multiply(_a.makeScale(x, y, z));

// ------------------------------------------------------------------ duel timing
export const ATTACK_U_CONTACT = 0.58;
/** Local time within the soldier's duel cycle. Returns attacking?, u in [0,1) of the half-cycle, half index. */
export function duelState(s: Soldier, t: number) {
  const half = s.period / 2;
  const k = Math.floor((t + s.phase) / half);
  const u = ((t + s.phase) / half) - k;
  const attacking = (k % 2 === 0) === s.attackFirst;
  return { attacking, u, k };
}

/** Contact times for this soldier as attacker in [t0, t1]. */
export function contactTimes(s: Soldier, t0: number, t1: number) {
  const half = s.period / 2;
  const out: number[] = [];
  const k0 = Math.floor((t0 + s.phase) / half) - 1, k1 = Math.ceil((t1 + s.phase) / half);
  for (let k = k0; k <= k1; k++) {
    if ((k % 2 === 0) !== s.attackFirst) continue;
    const tc = (k + ATTACK_U_CONTACT) * half - s.phase;
    if (tc >= t0 && tc <= t1) out.push(tc);
  }
  return out;
}

// ------------------------------------------------------------------ poses
const GUARD_R = -1.25, GUARD_L = -1.35;

function attackCurve(u: number) {
  // windup 0..0.45, strike 0.45..0.6, recover 0.6..1
  if (u < 0.45) { const k = smooth(u / 0.45); return { arm: lerp(GUARD_R, -3.55, k), wrist: lerp(0, -0.35, k), twist: 0.35 * k, lean: -0.08 * k, step: 0 }; }
  if (u < 0.6) { const k = Math.pow((u - 0.45) / 0.15, 1.6); return { arm: lerp(-3.55, -0.85, k), wrist: lerp(-0.35, 1.0, k), twist: lerp(0.35, -0.35, k), lean: lerp(-0.08, 0.16, k), step: 0.22 * k }; }
  const k = smooth((u - 0.6) / 0.4);
  return { arm: lerp(-0.85, GUARD_R, k), wrist: lerp(1.0, 0, k), twist: lerp(-0.35, 0, k), lean: lerp(0.16, 0, k), step: 0.22 * (1 - k) };
}

function defendCurve(u: number, shield: boolean) {
  const up = smooth((u - 0.25) / 0.2) * (1 - smooth((u - 0.7) / 0.25));
  const hitK = u > ATTACK_U_CONTACT ? Math.exp(-(u - ATTACK_U_CONTACT) * 9) : 0;
  return shield
    ? { armL: lerp(GUARD_L, -2.05, up), armLz: -0.25 * up, armR: GUARD_R + 0.2 * up, armRz: 0, wrist: 0, push: -0.2 * hitK, lean: -0.12 * hitK }
    : { armL: GUARD_L + 0.4, armLz: 0, armR: lerp(GUARD_R, -2.45, up), armRz: 0.75 * up, wrist: -0.2 * up, push: -0.22 * hitK, lean: -0.14 * hitK };
}

export function soldierPose(s: Soldier, t: number, horses: Horse[], out: Pose): Pose {
  const p = out;
  p.twist = 0; p.lean = 0; p.headPitch = 0; p.armR = GUARD_R; p.armRz = 0; p.wrist = 0;
  p.armL = GUARD_L; p.armLz = 0; p.legL = 0; p.legR = 0; p.legSpread = 0.06;
  let x = s.x, z = s.z, y = 0, yaw = s.yaw, fall = 0;
  const r = hash1(s.id * 3.17);

  if (s.role === "rider" && s.mount !== undefined) {
    horseRoot(horses[s.mount], t, p.m);
    mulT(p.m, 0, 1.22, -0.15);
    p.legL = p.legR = -1.35; p.legSpread = 0.35;
    const w = Math.sin((t + s.phase) * 3.1);
    p.armR = lerp(-2.9, -3.3, (w + 1) / 2); p.wrist = -0.4; p.armL = -1.0; p.lean = 0.12;
    return p;
  }

  if (s.role === "duel") {
    const d = duelState(s, t);
    if (d.attacking) {
      const a = attackCurve(d.u);
      p.armR = a.arm; p.wrist = a.wrist; p.twist = a.twist; p.lean = a.lean;
      z += Math.cos(yaw) * a.step; x += Math.sin(yaw) * a.step;
      p.legL = 0.35 * a.step / 0.22; p.legR = -0.25 * a.step / 0.22;
      p.armL = s.shield ? GUARD_L : -0.6;
    } else {
      const dd = defendCurve(d.u, s.shield);
      p.armL = dd.armL; p.armLz = dd.armLz; p.armR = dd.armR; p.armRz = dd.armRz; p.wrist = dd.wrist; p.lean = dd.lean;
      z += Math.cos(yaw) * dd.push; x += Math.sin(yaw) * dd.push;
      p.legL = -0.2; p.legR = 0.25;
    }
    // footwork shuffle
    const sh = Math.sin((t + s.phase) * 4.2) * 0.08;
    p.legL += sh; p.legR -= sh;
  } else if (s.role === "press") {
    const w = (t + s.phase) * (2.2 + r);
    const brand = Math.max(0, Math.sin(w * 0.37 + r * 9));      // brandishing weapon now and then
    p.armR = s.weapon === "spear" ? -0.25 - 0.15 * Math.sin(w) : lerp(GUARD_R, -2.9, brand) + 0.12 * Math.sin(w * 2.1);
    p.armL = s.shield ? GUARD_L + 0.1 * Math.sin(w) : -0.4;
    p.legL = 0.18 * Math.sin(w * 1.6); p.legR = -p.legL;
    y = 0.04 * Math.abs(Math.sin(w * 1.6));
    p.lean = 0.06 + 0.03 * Math.sin(w);
    p.headPitch = 0.08 * Math.sin(w * 0.7);
    if (s.wander) {                                   // advancing toward the line
      const k = smooth((t - s.wander.t0) / (s.wander.t1 - s.wander.t0));
      x += s.wander.dx * k; z += s.wander.dz * k;
      const moving = k > 0 && k < 1;
      if (moving) { const g = (t + s.phase) * 9; p.legL = 0.7 * Math.sin(g); p.legR = -p.legL; p.armL = -0.3 - 0.4 * Math.sin(g); y = 0.08 * Math.abs(Math.sin(g)); p.lean = 0.18; }
    }
  } else if (s.role === "guard") {
    p.armR = -0.2; p.armL = -0.15; p.headPitch = 0.05 * Math.sin(t + r * 6);
  }

  // fatal hit -> fall and settle
  if (t > s.fallT) {
    const k = (t - s.fallT) / 0.75;
    const e = easeOut(Math.min(1, k));
    const bounce = k > 1 ? Math.exp(-(k - 1) * 8) * Math.sin((k - 1) * 18) * 0.06 : 0;
    fall = s.fallDir * (Math.PI / 2) * e - bounce * s.fallDir;
    p.armR = lerp(p.armR, -2.8, e); p.armL = lerp(p.armL, -2.6, e); p.armRz = lerp(p.armRz, 0.5, e); p.armLz = lerp(p.armLz, -0.5, e);
    p.legL = lerp(p.legL, 0.1, e); p.legR = lerp(p.legR, -0.15, e); p.twist = 0; p.lean = 0; p.wrist = 0;
    // knocked back a little before falling
    const kb = 0.5 * easeOut(Math.min(1, k * 1.5));
    z -= Math.cos(yaw) * kb * s.fallDir; x -= Math.sin(yaw) * kb * s.fallDir;
  }

  p.m.identity();
  mulT(p.m, x, y, z);
  mulRy(p.m, yaw);
  if (fall !== 0) {
    const pz = s.fallDir > 0 ? -0.13 : 0.13;
    mulT(p.m, 0, Math.abs(Math.sin(fall)) * 0.13, pz);
    mulRx(p.m, -fall);
    mulT(p.m, 0, 0, -pz);
  }
  return p;
}

// ------------------------------------------------------------------ part writers
export type PartName =
  | "legL" | "legR" | "torso" | "head" | "helm" | "spike" | "armL" | "armR"
  | "blade" | "guardX" | "hilt" | "shield" | "spear";

const SCALE0 = new THREE.Matrix4().makeScale(0, 0, 0);

/** Writes one matrix per part for soldier s into the given arrays at index i. */
export function hideSoldier(i: number, parts: Record<PartName, Float32Array>) {
  for (const k of Object.keys(parts) as PartName[]) SCALE0.toArray(parts[k], i * 16);
}

export function writeSoldier(s: Soldier, p: Pose, i: number, parts: Record<PartName, Float32Array>) {
  const put = (name: PartName, m: THREE.Matrix4) => m.toArray(parts[name], i * 16);

  // legs
  for (const [name, sx, rot] of [["legL", 0.125, p.legL], ["legR", -0.125, p.legR]] as const) {
    _m.copy(p.m); mulT(_m, sx + Math.sign(sx) * p.legSpread * 0.3, 0.75, 0); mulRx(_m, rot); mulRz(_m, Math.sign(sx) * p.legSpread);
    mulT(_m, 0, -0.375, 0); mulS(_m, 0.25, 0.75, 0.25); put(name, _m);
  }
  // upper body frame
  const up = new THREE.Matrix4().copy(p.m);
  mulT(up, 0, 0.75, 0); mulRy(up, p.twist); mulRx(up, p.lean);

  _m.copy(up); mulT(_m, 0, 0.375, 0); mulS(_m, 0.5, 0.75, 0.27); put("torso", _m);

  const head = new THREE.Matrix4().copy(up); mulT(head, 0, 0.75, 0); mulRx(head, p.headPitch);
  _m.copy(head); mulT(_m, 0, 0.25, 0); mulS(_m, 0.5, 0.5, 0.5); put("head", _m);
  if (s.hat === "papakha") { _m.copy(head); mulT(_m, 0, 0.6, 0); mulS(_m, 0.58, 0.3, 0.58); put("helm", _m); put("spike", SCALE0); }
  else if (s.hat === "turban") {
    _m.copy(head); mulT(_m, 0, 0.55, 0); mulS(_m, 0.6, 0.22, 0.6); put("helm", _m);
    _m.copy(head); mulT(_m, 0, 0.7, 0); mulS(_m, 0.36, 0.14, 0.36); put("spike", _m);
  } else {
    _m.copy(head); mulT(_m, 0, 0.53, 0); mulS(_m, 0.56, 0.12, 0.56); put("helm", _m);
    _m.copy(head); mulT(_m, 0, 0.68, 0); mulS(_m, 0.1, 0.22, 0.1); put("spike", _m);
  }

  // arms
  const armR = new THREE.Matrix4().copy(up); mulT(armR, -0.375, 0.625, 0); mulRx(armR, p.armR); mulRz(armR, -p.armRz);
  _m.copy(armR); mulT(_m, 0, -0.25, 0); mulS(_m, 0.25, 0.75, 0.25); put("armR", _m);
  const armL = new THREE.Matrix4().copy(up); mulT(armL, 0.375, 0.625, 0); mulRx(armL, p.armL); mulRz(armL, p.armLz);
  _m.copy(armL); mulT(_m, 0, -0.25, 0); mulS(_m, 0.25, 0.75, 0.25); put("armL", _m);

  // weapon in right hand
  const hand = new THREE.Matrix4().copy(armR); mulT(hand, 0, -0.56, 0); mulRx(hand, p.wrist);
  if (s.weapon === "sword") {
    _m.copy(hand); mulT(_m, 0, 0, 0.62); mulS(_m, 0.05, 0.13, 0.95); put("blade", _m);
    _m.copy(hand); mulT(_m, 0, 0, 0.12); mulS(_m, 0.07, 0.34, 0.07); put("guardX", _m);
    _m.copy(hand); mulT(_m, 0, 0, -0.02); mulS(_m, 0.08, 0.08, 0.22); put("hilt", _m);
    put("spear", SCALE0);
  } else if (s.weapon === "spear") {
    _m.copy(hand); mulRx(_m, 0.22); mulT(_m, 0, 0.9, 0); mulS(_m, 0.08, 3.4, 0.08); put("spear", _m);
    _m.copy(hand); mulRx(_m, 0.22); mulT(_m, 0, 2.75, 0); mulS(_m, 0.06, 0.34, 0.14); put("blade", _m);
    put("guardX", SCALE0); put("hilt", SCALE0);
  } else { put("blade", SCALE0); put("guardX", SCALE0); put("hilt", SCALE0); put("spear", SCALE0); }

  if (s.shield) { _m.copy(armL); mulT(_m, 0, -0.62, 0.05); mulS(_m, 0.72, 0.07, 0.72); put("shield", _m); }
  else put("shield", SCALE0);
}

/** World position of the sword tip (for spark placement). */
export function bladeTip(s: Soldier, p: Pose, target: THREE.Vector3) {
  const up = new THREE.Matrix4().copy(p.m); mulT(up, 0, 0.75, 0); mulRy(up, p.twist); mulRx(up, p.lean);
  mulT(up, -0.375, 0.625, 0); mulRx(up, p.armR); mulRz(up, -p.armRz); mulT(up, 0, -0.56, 0); mulRx(up, p.wrist); mulT(up, 0, 0, 0.9);
  return target.setFromMatrixPosition(up);
}

// ------------------------------------------------------------------ horses
export function horseRoot(h: Horse, t: number, out: THREE.Matrix4) {
  const tt = Math.max(0, t - h.t0);
  const x = h.x0 + h.dirX * h.speed * tt, z = h.z0 + h.dirZ * h.speed * tt;
  const ph = (t + h.phase) * 2.3 * Math.PI * 2;
  out.identity();
  mulT(out, x, 0.12 * Math.abs(Math.sin(ph)), z);
  mulRy(out, Math.atan2(h.dirX, h.dirZ));
  mulRx(out, 0.05 * Math.sin(ph));
  return out;
}

export type HorsePart = "hbody" | "hneck" | "hhead" | "hmane" | "hlegFL" | "hlegFR" | "hlegBL" | "hlegBR" | "htail";

export function writeHorse(h: Horse, t: number, i: number, parts: Record<HorsePart, Float32Array>) {
  const root = horseRoot(h, t, new THREE.Matrix4());
  const put = (n: HorsePart, m: THREE.Matrix4) => m.toArray(parts[n], i * 16);
  const ph = (t + h.phase) * 2.3 * Math.PI * 2;
  _m.copy(root); mulT(_m, 0, 1.35, 0); mulS(_m, 0.72, 0.78, 1.75); put("hbody", _m);
  const neck = new THREE.Matrix4().copy(root); mulT(neck, 0, 1.6, 0.75); mulRx(neck, 0.65 + 0.08 * Math.sin(ph));
  _m.copy(neck); mulT(_m, 0, 0.38, 0); mulS(_m, 0.42, 0.85, 0.46); put("hneck", _m);
  _m.copy(neck); mulT(_m, 0, 0.62, -0.2); mulS(_m, 0.12, 0.7, 0.22); put("hmane", _m);
  const head = new THREE.Matrix4().copy(neck); mulT(head, 0, 0.78, 0.05); mulRx(head, 0.95);
  _m.copy(head); mulT(_m, 0, 0, 0.32); mulS(_m, 0.38, 0.4, 0.82); put("hhead", _m);
  const legs: [HorsePart, number, number, number][] = [
    ["hlegFL", 0.24, 0.66, Math.sin(ph) * 0.75],
    ["hlegFR", -0.24, 0.66, Math.sin(ph + 0.5) * 0.75],
    ["hlegBL", 0.24, -0.66, Math.sin(ph + Math.PI) * 0.75],
    ["hlegBR", -0.24, -0.66, Math.sin(ph + Math.PI + 0.5) * 0.75],
  ];
  for (const [n, lx, lz, a] of legs) {
    _m.copy(root); mulT(_m, lx, 1.05, lz); mulRx(_m, a); mulT(_m, 0, -0.5, 0); mulS(_m, 0.22, 1.05, 0.22); put(n, _m);
  }
  _m.copy(root); mulT(_m, 0, 1.6, -0.86); mulRx(_m, -0.5 - 0.2 * Math.sin(ph * 0.5)); mulT(_m, 0, -0.4, 0); mulS(_m, 0.16, 0.85, 0.16); put("htail", _m);
}

export const unused = { _q, _e, _v, _s, clamp };
