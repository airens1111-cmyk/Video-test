// Animated pixel faces on the 8x8 head front: eyes (look, blink, squint, wide), brows, mouth shapes and talking.
// Drawn into two 8x8 canvases per character: "eyes" (under the hat/beard layer) and "mouth" (over the beard).
export interface FaceParams { skin: string; iris: string; brow: string; beard: boolean; age: number }
export type Brows = "neutral" | "angry" | "sad" | "raised" | "focused";
export type Eyes = "open" | "narrow" | "wide" | "closed";
export type Mouth = "closed" | "smile" | "frown" | "o" | "open" | "shout" | "grit" | "talk";
export interface Expr { brows: Brows; eyes: Eyes; mouth: Mouth; look: number }   // look: -1 left .. +1 right (screen, facing camera)

export const EXPRESSIONS: Record<string, Expr> = {
  neutral: { brows: "neutral", eyes: "open", mouth: "closed", look: 0 },
  determined: { brows: "focused", eyes: "narrow", mouth: "closed", look: 0 },
  angry: { brows: "angry", eyes: "narrow", mouth: "grit", look: 0 },
  shout: { brows: "angry", eyes: "open", mouth: "shout", look: 0 },
  sad: { brows: "sad", eyes: "open", mouth: "frown", look: 0 },
  surprised: { brows: "raised", eyes: "wide", mouth: "o", look: 0 },
  grief: { brows: "sad", eyes: "closed", mouth: "frown", look: 0 },
  speaking: { brows: "neutral", eyes: "open", mouth: "talk", look: 0 },
  smile: { brows: "neutral", eyes: "open", mouth: "smile", look: 0 },
};

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const css = (c: [number, number, number], k = 1) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;

/** Draws one frame. blink: 0 open .. 1 closed. talkPhase: 0..1 mouth opening while talking. */
export function drawFace(eyes: CanvasRenderingContext2D, mouth: CanvasRenderingContext2D, p: FaceParams, e: Expr, blink: number, talkPhase: number) {
  eyes.clearRect(0, 0, 8, 8); mouth.clearRect(0, 0, 8, 8);
  const skin = hex(p.skin), iris = hex(p.iris), brow = hex(p.brow);
  const px = (g: CanvasRenderingContext2D, x: number, y: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const sclera = "#f1eee6", lash = css(brow, 0.55), lid = css(skin, 0.86), lip = `rgb(${skin[0] * 0.55 | 0},${skin[1] * 0.33 | 0},${skin[2] * 0.3 | 0})`;
  const inner = "#2a1310", teeth = "#ece6da", tongue = "#b14a4c";

  // ---- eyes (2x2 each: cols 1-2 and 5-6, rows 3-4)
  let state: Eyes = e.eyes;
  if (blink > 0.75) state = "closed"; else if (blink > 0.3 && state !== "closed") state = "narrow";
  const lookCol = e.look < -0.33 ? 0 : e.look > 0.33 ? 1 : -1;          // -1 = iris on the nose side
  for (const [x0, side] of [[1, 0], [5, 1]] as const) {
    const irisX = lookCol === -1 ? (side === 0 ? x0 + 1 : x0) : x0 + lookCol;
    const sclX = irisX === x0 ? x0 + 1 : x0;
    if (state === "closed") {
      px(eyes, x0, 3, css(skin)); px(eyes, x0 + 1, 3, css(skin));
      px(eyes, x0, 4, lash); px(eyes, x0 + 1, 4, lash);
      continue;
    }
    if (state === "narrow") { px(eyes, x0, 3, lid); px(eyes, x0 + 1, 3, lid); }
    else { px(eyes, sclX, 3, sclera); px(eyes, irisX, 3, css(iris, 0.75)); }
    px(eyes, sclX, 4, sclera); px(eyes, irisX, 4, css(iris, 1.15));
    if (state === "wide") { px(eyes, sclX, 3, sclera); px(eyes, irisX, 3, css(iris, 0.6)); }
  }
  // ---- brows (row 2, two pixels each; inner pixel = nose side)
  for (const [outer, inn] of [[1, 2], [6, 5]] as const) {
    let yo = 2, yi = 2;
    if (e.brows === "angry") { yo = 2; yi = 3; }
    if (e.brows === "sad") { yo = 2; yi = 1; }
    if (e.brows === "raised" || e.eyes === "wide") { yo = 1; yi = 1; }
    if (e.brows === "focused") { yo = 2; yi = 2; px(eyes, inn + (inn === 2 ? 1 : -1), 2, css(brow, 0.85)); }
    px(eyes, outer, yo, css(brow)); px(eyes, inn, yi, css(brow, 0.9));
  }
  if (p.age > 0.5) { px(eyes, 3, 2, css(skin, 0.88)); px(eyes, 4, 2, css(skin, 0.88)); }   // frown lines

  // ---- mouth (rows 5-7, centred on cols 3-4)
  let m: Mouth = e.mouth;
  if (m === "talk") m = talkPhase > 0.66 ? "open" : talkPhase > 0.33 ? "o" : "closed";
  const row = 6;
  switch (m) {
    case "closed": px(mouth, 3, row, lip); px(mouth, 4, row, lip); break;
    case "smile": px(mouth, 3, row, lip); px(mouth, 4, row, lip); px(mouth, 2, row - 1, lip); px(mouth, 5, row - 1, lip); break;
    case "frown": px(mouth, 3, row, lip); px(mouth, 4, row, lip); px(mouth, 2, row + 1, lip); px(mouth, 5, row + 1, lip); break;
    case "o": px(mouth, 3, row, inner); px(mouth, 4, row, inner); px(mouth, 3, row + 1, lip); px(mouth, 4, row + 1, lip); break;
    case "open": px(mouth, 3, row, inner); px(mouth, 4, row, inner); px(mouth, 3, row + 1, tongue); px(mouth, 4, row + 1, inner); px(mouth, 2, row, lip); px(mouth, 5, row, lip); break;
    case "grit": for (let x = 2; x <= 5; x++) px(mouth, x, row, x === 2 || x === 5 ? lip : teeth); px(mouth, 3, row + 1, lip); px(mouth, 4, row + 1, lip); break;
    case "shout":
      px(mouth, 2, 5, inner); px(mouth, 3, 5, teeth); px(mouth, 4, 5, teeth); px(mouth, 5, 5, inner);
      for (let x = 2; x <= 5; x++) px(mouth, x, 6, inner);
      px(mouth, 2, 7, lip); px(mouth, 3, 7, tongue); px(mouth, 4, 7, tongue); px(mouth, 5, 7, lip);
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
  // automatic blinks every 2.2-4.6 s, 0.18 s long
  let blink = 0;
  if (track?.blinks !== false) {
    let tb = 0.6 + hash(seed) * 1.5;
    for (let k = 0; tb < t + 0.2 && k < 200; k++) {
      const d = t - tb;
      if (d >= 0 && d < 0.18) blink = d < 0.06 ? 0.5 : d < 0.12 ? 1 : 0.5;
      tb += 2.2 + hash(seed * 31 + k) * 2.4;
    }
  }
  // talking: syllables at ~5-7 Hz with pauses
  let talkPhase = 0;
  const talking = (track?.talk ?? []).some(([a, b]) => t >= a && t <= b);
  if (talking) {
    const syl = Math.floor(t * 6.2);
    talkPhase = hash(seed * 7 + syl) * (hash(seed * 13 + Math.floor(t * 1.7)) > 0.15 ? 1 : 0.2);
    if (expr.mouth !== "talk") expr = { ...expr, mouth: "talk" };
  }
  return { expr, blink, talkPhase };
}
