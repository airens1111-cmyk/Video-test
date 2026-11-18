// Builds a deterministic battle: soldiers, horses, and the hit/fall events that drive particles.
import * as THREE from "three";
import { rng } from "./random";
import { contactTimes, Horse, Side, Soldier } from "./rig";

export interface HitEvent { t: number; x: number; y: number; z: number; kind: "clash" | "shield" | "fatal" | "land" | "hoof"; seed: number; }

export interface BattleSpec {
  seed: number;
  front: number;           // soldiers per row (along x)
  spacing: number;
  geoRows: number;
  qajRows: number;
  duration: number;        // sim seconds to precompute events for
  fallRate: number;        // fraction of duel contacts that are fatal
  cavalry: number;
  focusPair?: number;      // pair index that must strike at focusT (for the slow-mo close-up)
  focusT?: number;
}

const GEO_COATS = ["#3b2b26", "#5c1f22", "#2a2a33", "#6a4a2c", "#4a3a2a", "#7a2a22"];
const QAJ_COATS = ["#2f5c3c", "#3a4f78", "#8a6a2e", "#2b6a6a", "#5a5a2e", "#3d6b45"];
const SKINS = ["#e0b48e", "#d2a07a", "#c08a64", "#e8c09a", "#b67d58"];
const pick = <T,>(a: T[], r: () => number) => a[Math.floor(r() * a.length) % a.length];

export function buildBattle(spec: BattleSpec) {
  const r = rng(spec.seed);
  const soldiers: Soldier[] = [];
  const horses: Horse[] = [];
  const events: HitEvent[] = [];
  const W = spec.front, sp = spec.spacing;
  const x0 = -((W - 1) * sp) / 2;
  let id = 0;
  const mk = (side: Side, x: number, z: number, row: number): Soldier => {
    const front = row === 0;
    const spear = !front && r() < (side === 0 ? 0.25 : 0.4);
    return {
      id: id++, side, role: front ? "duel" : "press",
      x: x + (front ? 0 : (r() - 0.5) * 0.35), z: z + (front ? 0 : (r() - 0.5) * 0.35),
      yaw: side === 0 ? Math.PI : 0,
      phase: r() * 4, period: 1.35 + r() * 0.5, attackFirst: side === 0 ? r() < 0.5 : false,
      shield: !spear && r() < 0.7, weapon: spear ? "spear" : "sword",
      fallT: Infinity, fallDir: 1,
      coat: new THREE.Color(pick(side === 0 ? GEO_COATS : QAJ_COATS, r)),
      skin: new THREE.Color(pick(SKINS, r)),
      pants: new THREE.Color(side === 0 ? "#1d1a1a" : "#3a2f26").multiplyScalar(0.8 + r() * 0.4),
      helm: new THREE.Color("#8d9399").multiplyScalar(0.8 + r() * 0.3),
      bearded: r() < 0.75,
      hat: side === 0 ? (r() < 0.5 ? "papakha" : "helm") : (r() < 0.35 ? "turban" : "helm"),
    };
  };

  // front pairs: Georgian at +z facing -z, Qajar at -z facing +z
  const pairs: [Soldier, Soldier][] = [];
  for (let c = 0; c < W; c++) {
    const x = x0 + c * sp;
    const g = mk(0, x, 0.8, 0);
    const q = mk(1, x, -0.8, 0);
    q.phase = g.phase; q.period = g.period; q.attackFirst = !g.attackFirst;
    pairs.push([g, q]);
  }
  if (spec.focusPair !== undefined && spec.focusT !== undefined) {
    const [g, q] = pairs[spec.focusPair];
    g.shield = true; q.shield = true; g.weapon = q.weapon = "sword";
    // shift phase so that g's strike contact lands exactly at focusT
    g.attackFirst = true; q.attackFirst = false; g.period = q.period = 1.6;
    const half = g.period / 2;
    g.phase = q.phase = 0.58 * half - spec.focusT;   // k=0 contact at focusT
    while (g.phase < 0) { g.phase += g.period; q.phase = g.phase; }
  }
  for (const [g, q] of pairs) soldiers.push(g, q);
  for (const s of soldiers) {   // hat colours: papakha = dark fur, turban = light cloth, helm = steel
    if (s.hat === "papakha") s.helm = new THREE.Color(pick(["#2a221d", "#3a2e25", "#1d1a18", "#4a3b2c"], r));
    if (s.hat === "turban") s.helm = new THREE.Color(pick(["#e8e0cc", "#d8c49a", "#c9b9a0", "#b8a06a"], r));
  }

  for (let row = 1; row < spec.geoRows; row++) for (let c = 0; c < W; c++) soldiers.push(mk(0, x0 + c * sp, 0.8 + row * sp, row));
  for (let row = 1; row < spec.qajRows; row++) for (let c = 0; c < W; c++) soldiers.push(mk(1, x0 + c * sp, -0.8 - row * sp, row));

  // contact events and occasional fatal hits (alternating sides, both armies lose men)
  for (let pi = 0; pi < pairs.length; pi++) {
    const [g, q] = pairs[pi];
    let dead = false;
    const seq = [
      ...contactTimes(g, 0, spec.duration).map((tc) => [tc, g, q] as const),
      ...contactTimes(q, 0, spec.duration).map((tc) => [tc, q, g] as const),
    ].sort((a, b) => a[0] - b[0]);
    {
      for (const [tc, att, def] of seq) {
        if (dead) break;
        const mid = { x: (att.x + def.x) / 2, z: (att.z + def.z) / 2 };
        const fatal = pi !== spec.focusPair && tc > 1.0 && r() < spec.fallRate;
        events.push({ t: tc, x: mid.x + (r() - 0.5) * 0.3, y: 1.55 + r() * 0.35, z: mid.z, kind: fatal ? "fatal" : def.shield ? "shield" : "clash", seed: Math.floor(r() * 1e9) });
        if (fatal) {
          def.fallT = tc; def.fallDir = 1; dead = true;
          events.push({ t: tc + 0.62, x: def.x, y: 0.1, z: def.z + (def.side === 0 ? 1.4 : -1.4), kind: "land", seed: Math.floor(r() * 1e9) });
        }
      }
    }
  }
  events.sort((a, b) => a.t - b.t);

  // cavalry galloping behind the Qajar lines
  for (let i = 0; i < spec.cavalry; i++) {
    const h: Horse = {
      id: i, side: 1, x0: -60 - (i % 6) * 3.2 - r() * 2, z0: -0.8 - spec.qajRows * sp - 4 - Math.floor(i / 6) * 2.8,
      dirX: 1, dirZ: 0, speed: 9 + r() * 1.2, t0: 0, phase: r(), color: new THREE.Color(pick(["#5a3a22", "#2b211c", "#7a5a3a", "#bfb3a0", "#3f2f25"], r)),
    };
    horses.push(h);
    const rider = mk(1, 0, 0, 1);
    rider.hat = r() < 0.5 ? "turban" : "helm";
    rider.helm = new THREE.Color(rider.hat === "turban" ? "#e0d6c0" : "#8d9399");
    rider.role = "rider"; rider.mount = i; rider.weapon = "sword"; rider.shield = false;
    soldiers.push(rider);
  }
  return { soldiers, horses, events, pairs };
}

export type Battle = ReturnType<typeof buildBattle>;
