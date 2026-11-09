import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { config } from "../config";
import { timings, FPS, toFrames } from "../timing";
import { Appear, kaText, monoText, usePop } from "./anim";

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

export const Fonts: React.FC = () => (
  <style>{`
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 700; src: url(${staticFile("fonts/noto-sans-georgian-georgian-700-normal.woff2")}) format('woff2'); unicode-range: U+0589, U+10A0-10FF, U+1C90-1CBA, U+1CBD-1CBF, U+205A, U+2D00-2D2F, U+2E31; }
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 800; src: url(${staticFile("fonts/noto-sans-georgian-georgian-800-normal.woff2")}) format('woff2'); unicode-range: U+0589, U+10A0-10FF, U+1C90-1CBA, U+1CBD-1CBF, U+205A, U+2D00-2D2F, U+2E31; }
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 900; src: url(${staticFile("fonts/noto-sans-georgian-georgian-900-normal.woff2")}) format('woff2'); unicode-range: U+0589, U+10A0-10FF, U+1C90-1CBA, U+1CBD-1CBF, U+205A, U+2D00-2D2F, U+2E31; }
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 700 800; src: url(${staticFile("fonts/noto-sans-georgian-latin-700-normal.woff2")}) format('woff2'); unicode-range: U+0000-00FF, U+2000-206F, U+2190-21FF, U+2212, U+2248; }
    @font-face { font-family: 'Noto Sans Georgian'; font-weight: 900; src: url(${staticFile("fonts/noto-sans-georgian-latin-900-normal.woff2")}) format('woff2'); unicode-range: U+0000-00FF, U+2000-206F, U+2190-21FF, U+2212, U+2248; }
    @font-face { font-family: 'JetBrains Mono'; font-weight: 500; src: url(${staticFile("fonts/jetbrains-mono-latin-500-normal.woff2")}) format('woff2'); }
    @font-face { font-family: 'JetBrains Mono'; font-weight: 700; src: url(${staticFile("fonts/jetbrains-mono-latin-700-normal.woff2")}) format('woff2'); }
  `}</style>
);

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const drift = (f * 0.15) % 60;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bgTop} 0%, #081638 45%, ${C.bgBottom} 100%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          backgroundPosition: `0 ${drift}px`,
        }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <circle cx={540} cy={900} r={520} fill="none" stroke="rgba(130,170,255,0.06)" strokeWidth={2} />
        <circle cx={540} cy={900} r={760} fill="none" stroke="rgba(130,170,255,0.04)" strokeWidth={2} />
        {[[30, 30], [1050, 30], [30, 1890], [1050, 1890]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y + (y < 900 ? 26 : -26)} L${x} ${y} L${x + (x < 540 ? 26 : -26)} ${y}`} stroke="rgba(150,180,255,0.25)" strokeWidth={2} fill="none" />
        ))}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(40,90,200,0.18), transparent 60%)" }} />
    </AbsoluteFill>
  );
};

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export const Header: React.FC<{ tag: string }> = ({ tag }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: LAYOUT.headerTop, left: LAYOUT.side, right: LAYOUT.side, height: 100, display: "flex", alignItems: "center" }}>
      <Img src={staticFile(config.avatar)} style={{ width: 92, height: 92, borderRadius: 46, border: `3px solid ${C.accent}`, boxShadow: `0 0 18px ${C.accent}55` }} />
      <div style={{ marginLeft: 22, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={kaText(38, 900)}>{config.name}</span>
          {config.showHandle ? <span style={monoText(22)}>{config.handle}</span> : null}
        </div>
        <span style={kaText(23, 700, C.dim)}>{config.slogan}</span>
      </div>
      <div style={{ marginLeft: "auto", textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span style={monoText(22, C.dim)}>{mmss(f / FPS)}</span>
        <span style={kaText(30, 800, C.accent)}>{tag}</span>
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
        return (
          <div key={s.id} style={{ width: w, height: 7, borderRadius: 4, background: "rgba(140,165,220,0.18)", overflow: "hidden" }}>
            <div style={{ width: `${p * 100}%`, height: "100%", background: done ? C.yellow : C.accent }} />
          </div>
        );
      })}
    </div>
  );
};

export const SectionLabel: React.FC<{ n: number; label: string; danger?: boolean }> = ({ n, label, danger }) => (
  <Appear at={n === 1 ? -20 : 2} dy={12} style={{ position: "absolute", top: LAYOUT.labelTop, left: LAYOUT.side, display: "flex", alignItems: "baseline", gap: 16 }}>
    <span style={monoText(28, C.dim)}>{String(n).padStart(2, "0")}</span>
    <span style={monoText(28, "rgba(111,128,168,0.6)")}>/</span>
    <span style={kaText(34, 800, danger ? C.danger : C.text)}>{label}</span>
  </Appear>
);

/** Yellow sticker plate with the key idea. */
export const Sticker: React.FC<{ at: number; text: string; rotate?: number; style?: React.CSSProperties; color?: string }> = ({
  at, text, rotate = -3, style, color = C.yellow,
}) => {
  const p = usePop(at);
  return (
    <div
      style={{
        position: "absolute",
        transform: `rotate(${rotate}deg) scale(${0.6 + 0.4 * p})`,
        opacity: Math.min(1, p * 1.5),
        border: `3px solid ${color}`,
        background: "rgba(10,20,45,0.85)",
        padding: "10px 22px 12px",
        borderRadius: 6,
        boxShadow: `0 0 0 6px rgba(10,20,45,0.6), 0 0 24px ${color}33`,
        ...kaText(32, 800, color),
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Orange-red danger block. */
export const DangerBlock: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const p = usePop(at);
  return (
    <div
      style={{
        position: "absolute",
        opacity: Math.min(1, p * 1.5),
        transform: `scale(${0.85 + 0.15 * p})`,
        background: "rgba(255,106,77,0.12)",
        border: `3px solid ${C.danger}`,
        borderRadius: 14,
        padding: "16px 24px",
        ...kaText(34, 800, C.danger),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const fadeInOut = (frame: number, dur: number) =>
  interpolate(frame, [0, 6, dur - 6, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const sceneFrames = (id: string) => {
  const s = timings.scenes.find((x) => x.id === id)!;
  return { from: toFrames(s.start), dur: toFrames(s.end) - toFrames(s.start) };
};
