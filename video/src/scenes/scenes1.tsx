import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { config } from "../config";
import { cue, sentenceStart } from "../timing";
import { Appear, DrawPath, GFade, kaText, monoText, useRamp, usePop } from "../components/anim";
import { LAYOUT, Sticker } from "../components/chrome";

const C = config.colors;
export const W = 960;
export const H = LAYOUT.stageHeight;

export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", top: LAYOUT.stageTop, left: LAYOUT.side, width: W, height: H }}>{children}</div>
);
export const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);
/** Absolutely placed label inside the stage. */
export const L: React.FC<{ x: number; y: number; at: number; children: React.ReactNode; style?: React.CSSProperties; center?: boolean }> = ({
  x, y, at, children, style, center,
}) => (
  <Appear at={at} dy={14} style={{ position: "absolute", left: x, top: y, transform: center ? "translateX(-50%)" : undefined, ...style }}>
    {children}
  </Appear>
);

const hex = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ") + " Z";

/* ---------------- 01 what is it ---------------- */
export const S01: React.FC = () => {
  const id = "s01";
  const tLeaf = cue(id, "ქიმიურად");
  const tArrow = cue(id, "ენათესავება");
  const tKhat = cue(id, "კატის");
  const tHex = cue(id, "სინთეზური");
  const tCath = cue(id, "კათინონების");
  return (
    <Stage>
      <Appear at={-20} style={{ position: "absolute", left: 0, top: 0 }}>
        <div style={kaText(86, 900)}>რა არის</div>
        <div style={kaText(86, 900, C.accent)}>მეფედრონი?</div>
      </Appear>
      <Svg>
        {/* compound: two linked hexagons (an icon, not a structural formula) */}
        <DrawPath at={tHex} dur={22} d={hex(700, 470, 112)} stroke={C.accent} strokeWidth={5} />
        <DrawPath at={tHex + 8} dur={22} d={hex(700, 470, 88)} stroke={C.line} strokeWidth={2} opacity={0.35} />
        {/* khat branch */}
        <DrawPath at={tLeaf} dur={26} d="M150 640 C160 560 170 480 200 380" />
        <DrawPath at={tLeaf + 6} dur={20} d="M172 520 C110 500 80 450 92 400 C140 410 170 460 172 520 Z" stroke={C.accent} />
        <DrawPath at={tLeaf + 10} dur={20} d="M186 450 C250 420 280 370 266 320 C215 336 190 390 186 450 Z" stroke={C.accent} />
        <DrawPath at={tLeaf + 14} dur={20} d="M162 590 C220 580 260 540 262 500 C210 500 172 540 162 590 Z" stroke={C.accent} />
        {/* relation arrow */}
        <DrawPath at={tArrow} dur={18} d="M320 470 L540 470" stroke={C.yellow} strokeDasharray="1" />
        <GFade at={tArrow + 10}>
          <path d="M540 470 L520 458 M540 470 L520 482" stroke={C.yellow} strokeWidth={3} strokeLinecap="round" />
        </GFade>
      </Svg>
      <L x={430} y={412} at={tArrow + 4} center>
        <span style={kaText(24, 700, C.yellow)}>ქიმიური ნათესაობა</span>
      </L>
      <L x={175} y={668} at={tKhat} center style={{ textAlign: "center" }}>
        <div style={kaText(32, 800)}>კატი</div>
        <div style={monoText(20)}>Catha edulis</div>
      </L>
      <L x={700} y={600} at={tCath} center style={{ textAlign: "center" }}>
        <div style={kaText(32, 800, C.accent)}>კათინონები</div>
      </L>
      <L x={700} y={448} at={tHex + 14} center>
        <span style={kaText(24, 800)}>მეფედრონი</span>
      </L>
      <Sticker at={cue(id, "სტიმულატორია")} text="სინთეზური სტიმულატორი" style={{ left: 420, top: 250 }} rotate={-3} />
    </Stage>
  );
};

/* ---------------- 02 history ---------------- */
export const S02: React.FC = () => {
  const id = "s02";
  const pts = [
    { x: 130, at: cue(id, "1929"), year: "1929", text: ["პირველი", "აღწერა"] },
    { x: 480, at: cue(id, "2007"), year: "2007", text: ["მოხმარების", "პირველი ცნობები"] },
    { x: 830, at: cue(id, "2015"), year: "2015", text: ["გაერო:", "საერთაშორისო კონტროლი"] },
  ];
  return (
    <Stage>
      <Svg>
        <DrawPath at={2} dur={40} d="M30 360 L930 360" stroke="rgba(213,230,255,0.5)" />
        {pts.map((p, i) => (
          <GFade key={i} at={p.at} dy={0}>
            <circle cx={p.x} cy={360} r={16} fill={C.bgBottom} stroke={C.yellow} strokeWidth={5} />
            <circle cx={p.x} cy={360} r={6} fill={C.yellow} />
          </GFade>
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
          <line key={i} x1={30 + i * 60} x2={30 + i * 60} y1={372} y2={384} stroke="rgba(213,230,255,0.3)" strokeWidth={2} />
        ))}
      </Svg>
      {pts.map((p, i) => (
        <React.Fragment key={i}>
          <L x={p.x} y={220} at={p.at} center>
            <span style={{ ...kaText(84, 900, C.yellow), letterSpacing: -1 }}>{p.year}</span>
          </L>
          <L x={p.x} y={420} at={p.at + 4} center style={{ textAlign: "center", width: 300 }}>
            {p.text.map((t, k) => (
              <div key={k} style={kaText(28, 800, k ? C.text : C.dim)}>{t}</div>
            ))}
          </L>
        </React.Fragment>
      ))}
      <Sticker at={cue(id, "კონტროლის")} text="2015 · გაეროს კონტროლი" style={{ left: 300, top: 600 }} rotate={-2} />
    </Stage>
  );
};

/* ---------------- 03 brain / synapse ---------------- */
const DOT_COLORS = [C.accent, C.yellow, "#8FB3FF"];
const seeded = (i: number) => {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

export const S03: React.FC = () => {
  const id = "s03";
  const f = useCurrentFrame();
  const tDa = cue(id, "დოფამინით");
  const tSe = cue(id, "სეროტონინითა");
  const tNe = cue(id, "ნორადრენალინით");
  const tRelease = cue(id, "გამოყოფს");
  const tBlock = cue(id, "ბლოკავს");
  const tStrong = cue(id, "ძლიერდება");
  const types = [tDa, tSe, tNe];
  const pBlock = usePop(tBlock);
  const glow = useRamp(tStrong, 10);
  // dots: 3 per type at its word, 21 more on release
  const dots = Array.from({ length: 30 }, (_, i) => {
    const type = i % 3;
    const at = i < 9 ? types[type] + Math.floor(i / 3) * 3 : tRelease + (i - 9) * 1.2;
    const p = interpolate(f, [at, at + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const sx = 400 + seeded(i) * 160;
    const sy = 240 + seeded(i + 50) * 60;
    const ex = 300 + seeded(i + 99) * 360;
    const ey = 405 + seeded(i + 7) * 70 + Math.sin((f + i * 9) / 9) * 4;
    return { type, p, x: sx + (ex - sx) * p, y: sy + (ey - sy) * p };
  });
  return (
    <Stage>
      <Svg>
        {/* presynaptic terminal */}
        <DrawPath at={2} dur={30} d="M300 20 C300 130 250 200 250 290 C250 360 330 382 480 382 C630 382 710 360 710 290 C710 200 660 130 660 20" />
        {[[410, 250], [490, 290], [570, 248], [450, 180], [530, 190]].map(([x, y], i) => (
          <DrawPath key={i} at={10 + i * 3} dur={16} d={`M${x + 28} ${y} A28 28 0 1 1 ${x + 27.9} ${y - 2}`} strokeWidth={2.5} opacity={0.8} />
        ))}
        {/* reuptake transporter */}
        <GFade at={14}>
          <rect x={668} y={300} width={34} height={56} rx={10} fill="none" stroke={C.accent} strokeWidth={3} />
        </GFade>
        {/* postsynaptic membrane with receptors */}
        <DrawPath at={8} dur={30} d="M160 540 C320 498 640 498 800 540" />
        {[330, 420, 510, 600].map((x, i) => (
          <g key={i}>
            <DrawPath at={14 + i * 3} dur={14} d={`M${x - 18} 500 L${x - 18} 522 L${x + 18} 522 L${x + 18} 500`} stroke={C.accent} strokeWidth={3} />
            <rect x={x - 26} y={492} width={52} height={40} rx={8} fill={C.accent} opacity={0.35 * glow} />
          </g>
        ))}
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={9} fill={DOT_COLORS[d.type]} opacity={d.p > 0 ? 0.95 : 0} />
        ))}
        {/* block mark on transporter */}
        <g opacity={Math.min(1, pBlock * 1.4)} transform={`translate(685 328) scale(${0.6 + 0.4 * pBlock})`}>
          <circle r={38} fill="rgba(255,106,77,0.15)" stroke={C.danger} strokeWidth={4} />
          <path d="M-16 -16 L16 16 M16 -16 L-16 16" stroke={C.danger} strokeWidth={6} strokeLinecap="round" />
        </g>
        {/* release arrow */}
        <DrawPath at={tRelease} dur={14} d="M200 300 L200 440" stroke={C.yellow} strokeWidth={4} />
        <GFade at={tRelease + 8}>
          <path d="M200 440 L188 420 M200 440 L212 420" stroke={C.yellow} strokeWidth={4} strokeLinecap="round" />
        </GFade>
      </Svg>
      <L x={20} y={40} at={4}><span style={kaText(26, 800, C.dim)}>ნეირონი</span></L>
      <L x={20} y={560} at={10}><span style={kaText(26, 800, C.dim)}>მეორე ნეირონი</span></L>
      <L x={70} y={330} at={tRelease + 4} center><span style={kaText(26, 800, C.yellow)}>გამოყოფა</span></L>
      <L x={740} y={250} at={tBlock} style={{ textAlign: "left" }}>
        <div style={kaText(26, 800, C.danger)}>უკუშეწოვა</div>
        <div style={kaText(22, 700, C.danger)}>დაბლოკილია</div>
      </L>
      {/* legend chips */}
      {[
        ["დოფამინი", tDa, 0],
        ["სეროტონინი", tSe, 1],
        ["ნორადრენალინი", tNe, 2],
      ].map(([t, at, k], i) => (
        <L key={i} x={[0, 270, 560][i]} y={630} at={at as number}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 22, height: 22, borderRadius: 11, background: DOT_COLORS[k as number], display: "inline-block" }} />
            <span style={kaText(30, 800)}>{t as string}</span>
          </div>
        </L>
      ))}
      <Sticker at={tStrong} text="სიგნალი — ზედმეტად ძლიერი" style={{ left: 250, top: 712 }} rotate={-2} />
    </Stage>
  );
};

/* ---------------- 04 why it pulls ---------------- */
export const S04: React.FC = () => {
  const id = "s04";
  const t0 = cue(id, "მატულობს");
  const tFall = cue(id, "ქრება");
  const tWant = sentenceStart(id, 1);
  const tRep = cue(id, "განმეორებითი");
  const tDays = cue(id, "რამდენიმე");
  const tRow = cue(id, "ზედიზედ");
  const base = 520;
  const wave = (x0: number) =>
    `M${x0} ${base} C${x0 + 40} ${base} ${x0 + 50} 170 ${x0 + 95} 170 C${x0 + 140} 170 ${x0 + 150} ${base + 50} ${x0 + 210} ${base + 50} L${x0 + 250} ${base + 50}`;
  return (
    <Stage>
      <Svg>
        <DrawPath at={0} dur={18} d={`M70 120 L70 ${base + 90} L930 ${base + 90}`} stroke="rgba(213,230,255,0.55)" strokeWidth={2.5} />
        <DrawPath at={0} dur={18} d={`M70 ${base} L930 ${base}`} stroke="rgba(213,230,255,0.25)" strokeWidth={2} strokeDasharray="1" />
        <GFade at={tWant}>
          <rect x={280} y={base + 6} width={70} height={76} rx={8} fill="rgba(255,106,77,0.22)" />
        </GFade>
        <DrawPath at={t0} dur={Math.max(20, tFall - t0 + 14)} d={wave(80)} stroke={C.accent} strokeWidth={6} />
        <DrawPath at={tRep} dur={26} d={wave(330)} stroke={C.accent} strokeWidth={6} opacity={0.85} />
        <DrawPath at={tDays} dur={26} d={wave(580)} stroke={C.accent} strokeWidth={6} opacity={0.7} />
      </Svg>
      <L x={84} y={84} at={2}><span style={kaText(26, 800, C.dim)}>ეფექტი</span></L>
      <L x={840} y={base + 100} at={2}><span style={kaText(26, 800, C.dim)}>დრო</span></L>
      <L x={210} y={80} at={2}><span style={{ ...kaText(22, 700, C.dim), border: `2px solid ${C.dim}`, borderRadius: 6, padding: "2px 10px" }}>სქემა</span></L>
      <L x={315} y={base + 100} at={tWant} center><span style={kaText(28, 800, C.danger)}>სურვილი</span></L>
      <L x={200} y={base + 150} at={tDays} center><span style={chip(C.yellow)}>დღე 1</span></L>
      <L x={450} y={base + 150} at={tDays + 6} center><span style={chip(C.yellow)}>დღე 2</span></L>
      <L x={700} y={base + 150} at={tRow} center><span style={chip(C.danger)}>დღე 3</span></L>
      <Sticker at={tFall} text="სწრაფად მოდის — სწრაფად მიდის" style={{ left: 250, top: 735 }} rotate={-2} />
    </Stage>
  );
};

export const chip = (color: string): React.CSSProperties => ({
  ...kaText(26, 800, color),
  border: `2px solid ${color}`,
  borderRadius: 30,
  padding: "4px 18px 6px",
  whiteSpace: "nowrap",
});
