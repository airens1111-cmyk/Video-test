// Animated faces on the head front at 2x skin resolution (16x16 per face): big eyes with iris gradient, pupil and
// catch-light, lash line, expressive brows, mouth shapes and talking. Two canvases per character:
// "eyes" (under the hat/beard layer) and "mouth" (over the beard).
export interface FaceParams { skin: string; iris: string; brow: string; beard: boolean; age: number }
export type Brows = "neutral" | "angry" | "sad" | "raised" | "focused";
export type Eyes = "open" | "narrow" | "wide" | "closed";
export type Mouth = "closed" | "smile" | "frown" | "o" | "open" | "shout" | "grit" | "talk";
export interface Expr { brows: Brows; eyes: Eyes; mouth: Mouth; look: number; lookY?: number }   // look: -1 left .. +1 right (screen)

export const FACE_RES = 16;

export const EXPRESSIONS: Record<string, Expr> = {
  neutral: { brows: "neutral", eyes: "open", mouth: "closed", look: 0 },
  determined: { brows: "focused", eyes: "narrow", mouth: "closed", look: 0 },
  angry: { brows: "angry", eyes: "narrow", mouth: "grit", look: 0 },
  shout: { brows: "angry", eyes: "open", mouth: "shout", look: 0 },
  sad: { brows: "sad", eyes: "open", mouth: "frown", look: 0 },
  surprised: { brows: "raised", eyes: "wide", mouth: "o", look: 0 },
  shock: { brows: "raised", eyes: "wide", mouth: "shout", look: 0 },
  grief: { brows: "sad", eyes: "closed", mouth: "frown", look: 0 },
  speaking: { brows: "neutral", eyes: "open", mouth: "talk", look: 0 },
  smile: { brows: "neutral", eyes: "open", mouth: "smile", look: 0 },
};

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const css = (c: RGB, k = 1) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Draws one frame. blink: 0 open .. 1 closed. talkPhase: 0..1 mouth opening while talking. */
export function drawFace(eyes: CanvasRenderingContext2D, mouth: CanvasRenderingContext2D, p: FaceParams, e: Expr, blink: number, talkPhase: number) {
  const R = FACE_RES;
  eyes.clearRect(0, 0, R, R); mouth.clearRect(0, 0, R, R);
  const skin = hex(p.skin), iris = hex(p.iris), brow = hex(p.brow);
  const px = (g: CanvasRenderingContext2D, x: number, y: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const rect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const sclera = "#f4f1ea", scleraShade = "#d9d4cb";
  const lash = css(mix(brow, [20, 14, 10], 0.55));
  const lid = css(skin, 0.84), skinC = css(skin);
  const lip = `rgb(${skin[0] * 0.55 | 0},${skin[1] * 0.32 | 0},${skin[2] * 0.3 | 0})`;
  const inner = "#2a1310", teeth = "#efe9de", tongue = "#b8494c";
  const irisDark = css(iris, 0.62), irisMid = css(iris, 1.0), irisLight = css(mix(iris, [255, 255, 255], 0.28)), pupil = "#141010";

  // ---- eyes: 4 px wide, rows 6-9 (wide: 5-9). Left eye x 2-5, right eye x 10-13.
  let state: Eyes = e.eyes;
  if (blink > 0.75) state = "closed"; else if (blink > 0.3 && state !== "closed") state = "narrow";
  const lx = e.look < -0.33 ? -1 : e.look > 0.33 ? 1 : 0;
  for (const [x0, nose] of [[2, 1], [10, -1]] as const) {        // nose: +1 means the nose is to the right of this eye
    if (state === "closed") {
      rect(eyes, x0, 6, 4, 3, skinC);
      rect(eyes, x0, 8, 4, 1, lash); px(eyes, x0 + (nose > 0 ? 3 : 0), 7, lash);          // lowered lid, slight tail
      continue;
    }
    const top = state === "wide" ? 5 : state === "narrow" ? 7 : 6;
    const h = 10 - top;
    rect(eyes, x0, top, 4, h, sclera);
    rect(eyes, x0, 9, 4, 1, scleraShade);
    // iris 2 px wide: default towards the nose; look shifts it
    const base = nose > 0 ? x0 + 2 : x0;
    const ix = Math.max(x0, Math.min(x0 + 2, base + lx));
    const iy0 = Math.max(top, 6);
    for (let y = iy0; y < 10; y++) {
      const t = (y - iy0) / Math.max(1, 9 - iy0);
      rect(eyes, ix, y, 2, 1, t < 0.34 ? irisDark : t < 0.7 ? irisMid : irisLight);
    }
    if (state !== "narrow") { px(eyes, ix + (nose > 0 ? 0 : 1), 7, pupil); px(eyes, ix + (nose > 0 ? 0 : 1), 8, pupil); }
    px(eyes, ix + (nose > 0 ? 1 : 0), iy0, "#ffffff");                                   // catch-light
    if (state === "narrow") rect(eyes, x0, 6, 4, 1, lid);
    rect(eyes, x0, top - 1, 4, 1, lash);                                                // upper lash line
    px(eyes, x0 + (nose > 0 ? 0 : 3), top, lash);                                       // outer corner
  }

  // ---- brows: 4 px, 1-2 px thick (rows 3-5)
  for (const [x0, nose] of [[2, 1], [10, -1]] as const) {
    const rows: number[] = [4, 4, 4, 4];
    if (e.brows === "angry") { const r = [3, 4, 5, 6]; for (let i = 0; i < 4; i++) rows[i] = nose > 0 ? r[i] : r[3 - i]; }
    if (e.brows === "sad") { const r = [5, 4, 3, 3]; for (let i = 0; i < 4; i++) rows[i] = nose > 0 ? r[i] : r[3 - i]; }
    if (e.brows === "raised" || state === "wide") for (let i = 0; i < 4; i++) rows[i] = 3 - (i === 1 || i === 2 ? 1 : 0);
    if (e.brows === "focused") { const r = [4, 4, 4, 5]; for (let i = 0; i < 4; i++) rows[i] = nose > 0 ? r[i] : r[3 - i]; }
    for (let i = 0; i < 4; i++) {
      px(eyes, x0 + i, rows[i], css(brow, 0.95));
      if (i > 0 && i < 3) px(eyes, x0 + i, rows[i] - 1, css(brow, 1.08));                // thicker middle
    }
  }
  if (p.age > 0.5) { px(eyes, 7, 4, css(skin, 0.86)); px(eyes, 8, 5, css(skin, 0.86)); px(eyes, 3, 11, css(skin, 0.9)); px(eyes, 12, 11, css(skin, 0.9)); }

  // ---- mouth: centred on x 6-9, rows 11-15
  let m: Mouth = e.mouth;
  if (m === "talk") m = talkPhase > 0.66 ? "open" : talkPhase > 0.33 ? "o" : "closed";
  switch (m) {
    case "closed": rect(mouth, 6, 12, 4, 1, lip); break;
    case "smile": rect(mouth, 6, 12, 4, 1, lip); px(mouth, 5, 11, lip); px(mouth, 10, 11, lip); break;
    case "frown": rect(mouth, 6, 12, 4, 1, lip); px(mouth, 5, 13, lip); px(mouth, 10, 13, lip); break;
    case "o": rect(mouth, 7, 12, 2, 2, inner); px(mouth, 7, 11, lip); px(mouth, 8, 11, lip); px(mouth, 6, 12, lip); px(mouth, 9, 12, lip); px(mouth, 6, 13, lip); px(mouth, 9, 13, lip); px(mouth, 7, 14, lip); px(mouth, 8, 14, lip); break;
    case "open":
      rect(mouth, 6, 11, 4, 1, lip); rect(mouth, 6, 12, 4, 2, inner); rect(mouth, 7, 12, 2, 1, teeth); rect(mouth, 7, 13, 2, 1, tongue); rect(mouth, 6, 14, 4, 1, lip);
      px(mouth, 5, 12, lip); px(mouth, 10, 12, lip); px(mouth, 5, 13, lip); px(mouth, 10, 13, lip);
      break;
    case "grit": rect(mouth, 5, 12, 6, 2, teeth); rect(mouth, 5, 12, 6, 1, teeth); for (const x of [6, 8, 10]) px(mouth, x - 1 + 0, 13, "#cfc8bb"); rect(mouth, 5, 11, 6, 1, lip); rect(mouth, 5, 14, 6, 1, lip); px(mouth, 4, 12, lip); px(mouth, 11, 12, lip); px(mouth, 4, 13, lip); px(mouth, 11, 13, lip); break;
    case "shout":
      rect(mouth, 5, 10, 6, 1, lip); rect(mouth, 4, 11, 8, 4, inner);
      rect(mouth, 5, 11, 6, 1, teeth); rect(mouth, 6, 13, 4, 2, tongue);
      px(mouth, 4, 11, lip); px(mouth, 11, 11, lip); px(mouth, 3, 12, lip); px(mouth, 12, 12, lip); px(mouth, 3, 13, lip); px(mouth, 12, 13, lip);
      rect(mouth, 5, 15, 6, 1, lip);
      break;
  }
}

// ------------------------------------------------------------------ animation tracks
export interface FaceKey { t: number; expr: string | Partial<Expr> }
export interface FaceTrack { keys: FaceKey[]; talk?: [number, number][]; seed?: number; blinks?: boolean }

const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

/** Expression, blink and talk phase at time t (seconds). Deterministic. */
export function faceAt(track: FaceTrack | undefined, t: number) {
  const seed = track?.seed ?? 1;
  let expr: Expr = { ...EXPRESSIONS.neutral };
  for (const k of track?.keys ?? []) {
    if (t < k.t) break;
    expr = typeof k.expr === "string" ? { ...EXPRESSIONS[k.expr] } : { ...expr, ...k.expr };
  }
  let blink = 0;
  if (track?.blinks !== false) {
    let tb = 0.6 + hash(seed) * 1.5;
    for (let k = 0; tb < t + 0.2 && k < 200; k++) {
      const d = t - tb;
      if (d >= 0 && d < 0.18) blink = d < 0.06 ? 0.5 : d < 0.12 ? 1 : 0.5;
      tb += 2.2 + hash(seed * 31 + k) * 2.4;
    }
  }
  let talkPhase = 0;
  const talking = (track?.talk ?? []).some(([a, b]) => t >= a && t <= b);
  if (talking) {
    const syl = Math.floor(t * 6.2);
    talkPhase = hash(seed * 7 + syl) * (hash(seed * 13 + Math.floor(t * 1.7)) > 0.15 ? 1 : 0.2);
    if (expr.mouth !== "talk") expr = { ...expr, mouth: "talk" };
  }
  return { expr, blink, talkPhase };
}
