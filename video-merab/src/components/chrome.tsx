import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { config } from "../config";
import { timings, FPS, toFrames } from "../timing";
import { Appear, kaText, monoText, usePop, useRamp, useShake, seeded } from "./anim";

const C = config.colors;
export const LAYOUT = {
  headerTop: config.safe.top + 14, // 264
  progressTop: config.safe.top + 132,
  labelTop: config.safe.top + 186,
  stageTop: config.safe.top + 262, // 512
  stageHeight: 800,
  subtitleTop: 1360,
  subtitleBottom: config.video.height - config.safe.bottom, // 1570
  side: 60,
};

const KA_RANGE = "U+0589, U+10A0-10FF, U+1C90-1CBA, U+1CBD-1CBF, U+205A, U+2D00-2D2F, U+2E31";
const LATIN_RANGE = "U+0000-00FF, U+2000-206F, U+2190-21FF, U+2212, U+2248";
export const Fonts: React.FC = () => (
  <style>{`
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 700; src: url(${staticFile("fonts/noto-sans-georgian-georgian-700-normal.woff2")}) format('woff2'); unicode-range: ${KA_RANGE}; }
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 800; src: url(${staticFile("fonts/noto-sans-georgian-georgian-800-normal.woff2")}) format('woff2'); unicode-range: ${KA_RANGE}; }
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 900; src: url(${staticFile("fonts/noto-sans-georgian-georgian-900-normal.woff2")}) format('woff2'); unicode-range: ${KA_RANGE}; }
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 700 800; src: url(${staticFile("fonts/noto-sans-georgian-latin-700-normal.woff2")}) format('woff2'); unicode-range: ${LATIN_RANGE}; }
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 900; src: url(${staticFile("fonts/noto-sans-georgian-latin-900-normal.woff2")}) format('woff2'); unicode-range: ${LATIN_RANGE}; }
    @font-face { font-family: 'JetBrains Mono'; font-weight: 500; src: url(${staticFile("fonts/jetbrains-mono-latin-500-normal.woff2")}) format('woff2'); }
    @font-face { font-family: 'JetBrains Mono'; font-weight: 700; src: url(${staticFile("fonts/jetbrains-mono-latin-700-normal.woff2")}) format('woff2'); }
  `}</style>
);

const PARTICLES = Array.from({ length: 46 }, (_, i) => ({
  x: seeded(i) * 1080,
  y: seeded(i + 100) * 1920,
  r: 1.5 + seeded(i + 200) * 2.5,
  v: 0.25 + seeded(i + 300) * 0.7,
  ph: seeded(i + 400) * 100,
  c: seeded(i + 500) > 0.8 ? C.accent : "#9db8ff",
}));

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const drift = (f * 0.35) % 60;
  const scanY = ((f * 6) % 2600) - 300;
  const b1x = 300 + Math.sin(f / 90) * 120;
  const b1y = 520 + Math.cos(f / 110) * 90;
  const b2x = 820 + Math.sin(f / 70 + 2) * 110;
  const b2y = 1300 + Math.cos(f / 95 + 1) * 120;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bgTop} 0%, #081638 45%, ${C.bgBottom} 100%)` }}>
      {/* soft depth blobs */}
      <AbsoluteFill style={{ filter: "blur(70px)", opacity: 0.6 }}>
        <div style={{ position: "absolute", left: b1x, top: b1y, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,227,220,0.18), transparent 70%)" }} />
        <div style={{ position: "absolute", left: b2x, top: b2y, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(70,110,230,0.2), transparent 70%)" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          backgroundPosition: `0 ${drift}px`,
        }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g transform={`rotate(${f * 0.08} 540 900)`}>
          <circle cx={540} cy={900} r={520} fill="none" stroke="rgba(130,170,255,0.07)" strokeWidth={2} strokeDasharray="4 18" />
        </g>
        <g transform={`rotate(${-f * 0.05} 540 900)`}>
          <circle cx={540} cy={900} r={760} fill="none" stroke="rgba(130,170,255,0.05)" strokeWidth={2} strokeDasharray="60 30" />
        </g>
        {PARTICLES.map((p, i) => {
          const y = (p.y - f * p.v + 1920 * 4) % 1920;
          const x = p.x + Math.sin((f + p.ph) / 40) * 12;
          const o = 0.25 + 0.25 * Math.sin((f + p.ph * 3) / 25);
          return <circle key={i} cx={x} cy={y} r={p.r} fill={p.c} opacity={o} />;
        })}
        {[[30, 30], [1050, 30], [30, 1890], [1050, 1890]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y + (y < 900 ? 26 : -26)} L${x} ${y} L${x + (x < 540 ? 26 : -26)} ${y}`} stroke="rgba(150,180,255,0.25)" strokeWidth={2} fill="none" />
        ))}
      </svg>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent ${scanY - 60}px, rgba(52,227,220,0.05) ${scanY}px, transparent ${scanY + 60}px)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(40,90,200,0.2), transparent 60%)" }} />
      {/* vignette for depth */}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 420px 80px rgba(2,6,20,0.85)" }} />
    </AbsoluteFill>
  );
};

/** Full-screen wipe that "clears the table" at every scene boundary. */
export const TransitionSweep: React.FC = () => {
  const f = useCurrentFrame();
  const W = config.video.width;
  return (
    <>
      {timings.scenes.slice(1).map((s, i) => {
        const start = toFrames(s.start);
        const d = f - (start - 6);
        if (d < 0 || d > 14) return null;
        const p = d / 14;
        // a bright diagonal bar sweeps left->right, wiping the old scene away
        const x = -500 + p * (W + 1000);
        const op = Math.sin(p * Math.PI);
        return (
          <AbsoluteFill key={i} style={{ pointerEvents: "none" }}>
            <div
              style={{
                position: "absolute",
                top: -200,
                bottom: -200,
                left: x,
                width: 420,
                transform: "skewX(-12deg)",
                background: `linear-gradient(90deg, transparent, ${C.accent}22 35%, ${C.accent}cc 50%, ${C.accent}22 65%, transparent)`,
                opacity: op,
                filter: "blur(2px)",
              }}
            />
          </AbsoluteFill>
        );
      })}
    </>
  );
};

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export const Header: React.FC<{ tag: string; tagStart: number }> = ({ tag, tagStart }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [tagStart, tagStart + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  const glow = 0.5 + 0.5 * Math.sin(f / 12);
  return (
    <div style={{ position: "absolute", top: LAYOUT.headerTop, left: LAYOUT.side, right: LAYOUT.side, height: 100, display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", width: 92, height: 92 }}>
        <Img src={staticFile(config.avatar)} style={{ width: 92, height: 92, borderRadius: 46, border: `3px solid ${C.accent}`, boxShadow: `0 0 ${10 + 14 * glow}px ${C.accent}66` }} />
      </div>
      <div style={{ marginLeft: 22, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={kaText(38, 900)}>{config.name}</span>
          {config.showHandle ? <span style={monoText(22)}>{config.handle}</span> : null}
        </div>
        <span style={kaText(23, 700, C.dim)}>{config.slogan}</span>
      </div>
      <div style={{ marginLeft: "auto", textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span style={monoText(22, C.dim)}>{mmss(f / FPS)}</span>
        <span style={{ ...kaText(30, 800, C.accent), opacity: p, transform: `translateY(${(1 - p) * 14}px)`, display: "inline-block" }}>{tag}</span>
      </div>
    </div>
  );
};

export const ProgressBar: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const n = timings.scenes.length;
  const gap = 10;
  const w = (1080 - 2 * LAYOUT.side - gap * (n - 1)) / n;
  return (
    <div style={{ position: "absolute", top: LAYOUT.progressTop, left: LAYOUT.side, display: "flex", gap }}>
      {timings.scenes.map((s) => {
        const p = Math.max(0, Math.min(1, (t - s.start) / (s.end - s.start)));
        const done = p >= 1;
        const active = p > 0 && !done;
        return (
          <div key={s.id} style={{ width: w, height: 7, borderRadius: 4, background: "rgba(140,165,220,0.18)", overflow: "hidden", boxShadow: active ? `0 0 10px ${C.accent}88` : undefined }}>
            <div style={{ width: `${p * 100}%`, height: "100%", background: done ? C.yellow : C.accent }} />
          </div>
        );
      })}
    </div>
  );
};

export const SectionLabel: React.FC<{ n: number; label: string; danger?: boolean }> = ({ n, label, danger }) => {
  const line = useRamp(n === 1 ? -20 : 3, 10);
  return (
    <Appear at={n === 1 ? -20 : 0} dx={-40} dy={0} style={{ position: "absolute", top: LAYOUT.labelTop, left: LAYOUT.side }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={monoText(28, danger ? C.danger : C.accent)}>{String(n).padStart(2, "0")}</span>
        <span style={monoText(28, "rgba(111,128,168,0.6)")}>/</span>
        <span style={kaText(34, 800, danger ? C.danger : C.text)}>{label}</span>
      </div>
      <div style={{ height: 3, width: 220 * line, background: danger ? C.danger : C.accent, borderRadius: 2, marginTop: 6, opacity: 0.8 }} />
    </Appear>
  );
};

/** Yellow sticker plate with the key idea. */
export const Sticker: React.FC<{ at: number; text: string; rotate?: number; style?: React.CSSProperties; color?: string }> = ({
  at, text, rotate = -3, style, color = C.yellow,
}) => {
  const p = usePop(at, 260);
  const f = useCurrentFrame();
  if (p <= 0.001) return null;
  const wob = f > at + 12 ? Math.sin((f - at) / 14) * 0.8 : 0;
  return (
    <div
      style={{
        position: "absolute",
        transform: `rotate(${rotate + (1 - p) * 10 + wob}deg) scale(${0.4 + 0.6 * p})`,
        opacity: Math.min(1, p * 1.5),
        border: `3px solid ${color}`,
        background: "rgba(10,20,45,0.9)",
        padding: "10px 22px 12px",
        borderRadius: 6,
        boxShadow: `0 0 0 6px rgba(10,20,45,0.6), 0 0 28px ${color}44`,
        ...kaText(32, 800, color),
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Orange-red danger block, shakes when it lands. */
export const DangerBlock: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const p = usePop(at);
  const sh = useShake(at + 4, 7);
  const f = useCurrentFrame();
  if (p <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((f - at) / 7);
  return (
    <div
      style={{
        position: "absolute",
        opacity: Math.min(1, p * 1.5),
        transform: `translateX(${sh}px) scale(${0.8 + 0.2 * p})`,
        background: "rgba(255,106,77,0.12)",
        border: `3px solid ${C.danger}`,
        borderRadius: 14,
        padding: "16px 24px",
        boxShadow: `0 0 ${12 + 18 * pulse}px rgba(255,106,77,0.35)`,
        ...kaText(34, 800, C.danger),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Scene enter/exit: slide + fade, slow push-in while on screen. */
export const sceneTransform = (frame: number, dur: number, first: boolean) => {
  const inP = first ? 1 : interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const outP = interpolate(frame, [dur - 7, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const push = 1 + 0.04 * (frame / Math.max(1, dur));
  const exitScale = 1 - outP * 0.08;
  return {
    opacity: Math.min(inP, 1 - outP),
    transform: `translateX(${(1 - inP) * 140 - outP * 160}px) scale(${push * exitScale})`,
    transformOrigin: "50% 45%",
    filter: outP > 0 ? `blur(${outP * 5}px)` : undefined,
  } as React.CSSProperties;
};

export const sceneFrames = (id: string) => {
  const s = timings.scenes.find((x) => x.id === id)!;
  return { from: toFrames(s.start), dur: toFrames(s.end) - toFrames(s.start) };
};
