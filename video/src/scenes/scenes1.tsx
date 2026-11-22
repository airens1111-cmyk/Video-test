import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { config } from "../config";
import { cue, sentenceStart, sentenceEnd } from "../timing";
import { Appear, DrawPath, GFade, GPop, kaText, monoText, useRamp, usePop, useWave, CountUp, seeded } from "../components/anim";
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
export const L: React.FC<{ x: number; y: number; at: number; children: React.ReactNode; style?: React.CSSProperties; center?: boolean }> = ({
  x, y, at, children, style, center,
}) => (
  <Appear at={at} dy={14} style={{ position: "absolute", left: x, top: y, transform: center ? "translateX(-50%)" : undefined, ...style }}>
    {children}
  </Appear>
);

export const hex = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ") + " Z";

export const chip = (color: string): React.CSSProperties => ({
  ...kaText(26, 800, color),
  border: `2px solid ${color}`,
  borderRadius: 30,
  padding: "4px 18px 6px",
  whiteSpace: "nowrap",
});

/* ---------------- 01 what is it ---------------- */
export const S01: React.FC = () => {
  const id = "s01";
  const f = useCurrentFrame();
  const tHex = cue(id, "სინთეზური");
  const tCath = cue(id, "კათინონების");
  const tRel = cue(id, "ნათესავი");
  const tKhat = cue(id, "კატის");
  const spin = f * 0.6;
  const float = useWave(70) * 8;
  return (
    <Stage>
      <Appear at={-20} style={{ position: "absolute", left: 0, top: 0 }}>
        <div style={kaText(76, 900)}>რა არის</div>
        <div style={kaText(86, 900, C.accent)}>მეფედრონი?</div>
      </Appear>
      <Svg>
        {/* orbiting molecule icon */}
        <g transform={`translate(0 ${float})`}>
          <GPop at={tHex} cx={700} cy={470}>
            <path d={hex(700, 470, 112)} fill="none" stroke={C.accent} strokeWidth={5} />
            <path d={hex(700, 470, 84)} fill="none" stroke={C.line} strokeWidth={2} opacity={0.3} />
            <circle cx={700} cy={470} r={10} fill={C.accent} />
          </GPop>
          {[0, 1, 2].map((k) => {
            const a = spin * (Math.PI / 180) + (k * Math.PI * 2) / 3;
            return (
              <g key={k} opacity={useRamp(tHex + 6 + k * 2, 8)}>
                <circle cx={700 + Math.cos(a) * 150} cy={470 + Math.sin(a) * 90} r={7} fill={k ? C.yellow : C.accent} />
              </g>
            );
          })}
        </g>
        {/* khat branch grows */}
        <DrawPath at={tRel} dur={18} d="M150 660 C160 560 170 470 205 360" />
        <DrawPath at={tRel + 4} dur={14} d="M176 520 C110 500 82 450 94 400 C142 410 174 460 176 520 Z" stroke={C.accent} />
        <DrawPath at={tRel + 8} dur={14} d="M190 450 C254 420 282 370 268 320 C217 336 192 390 190 450 Z" stroke={C.accent} />
        <DrawPath at={tRel + 12} dur={14} d="M166 590 C224 580 262 540 264 500 C212 500 174 540 166 590 Z" stroke={C.accent} />
        {/* relation arrow draws */}
        <DrawPath at={tRel} dur={12} d="M320 470 L536 470" stroke={C.yellow} />
        <GPop at={tRel + 10} cx={540} cy={470}>
          <path d="M540 470 L518 457 M540 470 L518 483" stroke={C.yellow} strokeWidth={4} strokeLinecap="round" fill="none" />
        </GPop>
      </Svg>
      <L x={428} y={410} at={tRel + 2} center><span style={kaText(24, 700, C.yellow)}>ქიმიური ნათესაობა</span></L>
      <L x={178} y={688} at={tKhat} center style={{ textAlign: "center" }}>
        <div style={kaText(32, 800)}>კატი</div>
        <div style={monoText(20)}>Catha edulis</div>
      </L>
      <L x={700} y={600} at={tCath} center><span style={kaText(32, 800, C.accent)}>კათინონები</span></L>
      <L x={700} y={448} at={tHex + 10} center><span style={kaText(24, 800)}>მეფედრონი</span></L>
      <Sticker at={cue(id, "სტიმულატორია")} text="სინთეზური სტიმულატორი" style={{ left: 420, top: 250 }} rotate={-3} />
    </Stage>
  );
};

/* ---------------- 02 history ---------------- */
export const S02: React.FC = () => {
  const id = "s02";
  const f = useCurrentFrame();
  const pts = [
    { x: 130, at: cue(id, "1929"), year: 1929, text: ["პირველი", "აღწერა"] },
    { x: 480, at: cue(id, "2007"), year: 2007, text: ["მოხმარების", "ცნობები"] },
    { x: 830, at: cue(id, "2015"), year: 2015, text: ["გაერო:", "კონტროლი"] },
  ];
  const prog = interpolate(f, [cue(id, "1929"), cue(id, "2015") + 10], [0, 900], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <Stage>
      <Svg>
        <line x1={30} x2={930} y1={360} y2={360} stroke="rgba(213,230,255,0.22)" strokeWidth={2} />
        <line x1={30} x2={30 + prog} y1={360} y2={360} stroke={C.accent} strokeWidth={4} />
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1={30 + i * 60} x2={30 + i * 60} y1={372} y2={384} stroke="rgba(213,230,255,0.3)" strokeWidth={2} />
        ))}
        {/* moving marker head */}
        <circle cx={30 + prog} cy={360} r={7} fill={C.accent} opacity={prog > 0 && prog < 900 ? 1 : 0} />
        {pts.map((p, i) => (
          <GPop key={i} at={p.at} cx={p.x} cy={360}>
            <circle cx={p.x} cy={360} r={16} fill={C.bgBottom} stroke={C.yellow} strokeWidth={5} />
            <circle cx={p.x} cy={360} r={6} fill={C.yellow} />
          </GPop>
        ))}
      </Svg>
      {pts.map((p, i) => (
        <React.Fragment key={i}>
          <L x={p.x} y={220} at={p.at} center>
            <CountUp at={p.at} from={p.year - 12} to={p.year} dur={14} style={{ ...kaText(84, 900, C.yellow), letterSpacing: -1 }} />
          </L>
          <L x={p.x} y={420} at={p.at + 3} center style={{ textAlign: "center", width: 300 }}>
            {p.text.map((t, k) => (<div key={k} style={kaText(28, 800, k ? C.text : C.dim)}>{t}</div>))}
          </L>
        </React.Fragment>
      ))}
      <Sticker at={cue(id, "კონტროლის")} text="2015 · გაეროს კონტროლი" style={{ left: 300, top: 600 }} rotate={-2} />
    </Stage>
  );
};

/* ---------------- 03 brain / synapse ---------------- */
const DOT_COLORS = [C.accent, C.yellow, "#8FB3FF"];
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
  const pBlock = usePop(tBlock, 260);
  const glow = useRamp(tStrong, 8);
  const pulse = 0.5 + 0.5 * Math.sin((f - tStrong) / 6);
  const dots = Array.from({ length: 46 }, (_, i) => {
    const type = i % 3;
    const at = i < 9 ? types[type] + Math.floor(i / 3) * 2 : tRelease + (i - 9) * 0.7;
    const p = interpolate(f, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
    const sx = 400 + seeded(i) * 160;
    const sy = 235 + seeded(i + 50) * 60;
    const ex = 300 + seeded(i + 99) * 360;
    const ey = 405 + seeded(i + 7) * 70 + Math.sin((f + i * 9) / 8) * 5;
    const x = sx + (ex - sx) * p;
    const y = sy + (ey - sy) * p - Math.sin(p * Math.PI) * 30;
    return { type, p, x, y };
  });
  return (
    <Stage>
      <Svg>
        <DrawPath at={0} dur={16} d="M300 20 C300 130 250 200 250 290 C250 360 330 382 480 382 C630 382 710 360 710 290 C710 200 660 130 660 20" />
        {[[410, 250], [490, 290], [570, 248], [450, 180], [530, 190]].map(([x, y], i) => (
          <DrawPath key={i} at={6 + i * 2} dur={10} d={`M${x + 28} ${y} A28 28 0 1 1 ${x + 27.9} ${y - 2}`} strokeWidth={2.5} opacity={0.8} />
        ))}
        <GFade at={10}><rect x={668} y={300} width={34} height={56} rx={10} fill="none" stroke={C.accent} strokeWidth={3} /></GFade>
        <DrawPath at={6} dur={18} d="M160 540 C320 498 640 498 800 540" />
        {[330, 420, 510, 600].map((x, i) => (
          <g key={i}>
            <DrawPath at={10 + i * 2} dur={10} d={`M${x - 18} 500 L${x - 18} 522 L${x + 18} 522 L${x + 18} 500`} stroke={C.accent} strokeWidth={3} />
            <rect x={x - 26} y={492} width={52} height={40} rx={8} fill={C.accent} opacity={0.35 * glow * (0.6 + 0.4 * pulse)} />
          </g>
        ))}
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={9} fill={DOT_COLORS[d.type]} opacity={d.p > 0 && d.p < 0.999 ? 0.95 : d.p >= 0.999 ? 0.6 : 0} />
        ))}
        <GPop at={tBlock} cx={685} cy={328}>
          <circle cx={685} cy={328} r={38} fill="rgba(255,106,77,0.15)" stroke={C.danger} strokeWidth={4} />
          <path d="M669 312 L701 344 M701 312 L669 344" stroke={C.danger} strokeWidth={6} strokeLinecap="round" transform={`scale(${0.9 + 0.1 * Math.sin(f / 5)})`} transform-origin="685 328" />
        </GPop>
        <DrawPath at={tRelease} dur={10} d="M200 300 L200 440" stroke={C.yellow} strokeWidth={4} />
        <GPop at={tRelease + 7} cx={200} cy={440}>
          <path d="M200 440 L188 420 M200 440 L212 420" stroke={C.yellow} strokeWidth={4} strokeLinecap="round" fill="none" />
        </GPop>
      </Svg>
      <L x={20} y={40} at={2}><span style={kaText(26, 800, C.dim)}>ნეირონი</span></L>
      <L x={20} y={560} at={8}><span style={kaText(26, 800, C.dim)}>მეორე ნეირონი</span></L>
      <L x={70} y={330} at={tRelease + 2} center><span style={kaText(26, 800, C.yellow)}>გამოყოფა</span></L>
      <L x={742} y={248} at={tBlock} style={{ textAlign: "left" }}>
        <div style={kaText(26, 800, C.danger)}>უკუშეწოვა</div>
        <div style={kaText(22, 700, C.danger)}>დაბლოკილია</div>
      </L>
      {[["დოფამინი", tDa, 0], ["სეროტონინი", tSe, 1], ["ნორადრენალინი", tNe, 2]].map(([t, at, k], i) => (
        <L key={i} x={[0, 270, 560][i]} y={632} at={at as number}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 22, height: 22, borderRadius: 11, background: DOT_COLORS[k as number], display: "inline-block", boxShadow: `0 0 10px ${DOT_COLORS[k as number]}` }} />
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
  const f = useCurrentFrame();
  const t0 = cue(id, "ეფექტი");
  const tFall = cue(id, "ქრება");
  const tWant = cue(id, "სურვილი");
  const tRep = cue(id, "განმეორებითი");
  const tDays = cue(id, "რამდენიმე");
  const tRow = cue(id, "ზედიზედ");
  const base = 520;
  const wave = (x0: number) =>
    `M${x0} ${base} C${x0 + 36} ${base} ${x0 + 46} 170 ${x0 + 92} 170 C${x0 + 138} 170 ${x0 + 148} ${base + 50} ${x0 + 208} ${base + 50} L${x0 + 250} ${base + 50}`;
  // dot riding the first wave
  const ride = interpolate(f, [t0, tFall], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rx = 80 + ride * 250;
  const ry = base - Math.sin(Math.min(ride, 0.5) / 0.5 * Math.PI) * (base - 170) * (ride < 0.5 ? 1 : 0) - (ride >= 0.5 ? (1 - Math.cos((ride - 0.5) / 0.5 * Math.PI)) * 0 : 0);
  return (
    <Stage>
      <Svg>
        <DrawPath at={0} dur={12} d={`M70 120 L70 ${base + 90} L930 ${base + 90}`} stroke="rgba(213,230,255,0.55)" strokeWidth={2.5} />
        <line x1={70} x2={930} y1={base} y2={base} stroke="rgba(213,230,255,0.2)" strokeWidth={2} strokeDasharray="6 8" />
        <GPop at={tWant} cx={315} cy={base + 44}>
          <rect x={280} y={base + 6} width={70} height={76} rx={8} fill="rgba(255,106,77,0.25)" />
        </GPop>
        <DrawPath at={t0} dur={Math.max(16, tFall - t0 + 10)} d={wave(80)} stroke={C.accent} strokeWidth={6} />
        <DrawPath at={tRep} dur={18} d={wave(330)} stroke={C.accent} strokeWidth={6} opacity={0.85} />
        <DrawPath at={tDays} dur={18} d={wave(580)} stroke={C.accent} strokeWidth={6} opacity={0.7} />
        {ride > 0 && ride < 1 && <circle cx={rx} cy={ry} r={10} fill={C.yellow} />}
      </Svg>
      <L x={84} y={84} at={0}><span style={kaText(26, 800, C.dim)}>ეფექტი</span></L>
      <L x={840} y={base + 100} at={0}><span style={kaText(26, 800, C.dim)}>დრო</span></L>
      <L x={200} y={76} at={0}><span style={{ ...kaText(22, 700, C.dim), border: `2px solid ${C.dim}`, borderRadius: 6, padding: "2px 10px" }}>სქემა</span></L>
      <L x={315} y={base + 100} at={tWant} center><span style={kaText(28, 800, C.danger)}>სურვილი</span></L>
      <L x={205} y={base + 150} at={tDays} center><span style={chip(C.yellow)}>დღე 1</span></L>
      <L x={455} y={base + 150} at={tDays + 4} center><span style={chip(C.yellow)}>დღე 2</span></L>
      <L x={705} y={base + 150} at={tRow} center><span style={chip(C.danger)}>დღე 3</span></L>
      <Sticker at={tFall} text="სწრაფად მოდის — სწრაფად მიდის" style={{ left: 250, top: 735 }} rotate={-2} />
    </Stage>
  );
};
