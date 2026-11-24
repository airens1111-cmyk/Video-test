import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile } from "remotion";
import { config } from "../config";
import { cue, sentenceStart } from "../timing";
import { Appear, DrawPath, GFade, GPop, kaText, monoText, useRamp, usePop, useWave, seeded } from "../components/anim";
import { DangerBlock, Sticker } from "../components/chrome";
import { Stage, Svg, L, chip, card } from "../components/stage";

const C = config.colors;
const PINK = "#FF7EB6";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Slice of layered cake (ნამცხვარი), centre (x, y), size r; `bite` 0..1 takes a bite out of the tip. */
const Cake: React.FC<{ x: number; y: number; r: number; bite?: number; glow?: number }> = ({ x, y, r, bite = 0, glow = 0 }) => {
  const id = `cbite${x}${y}`;
  // side view of a wedge: tip on the left, back on the right
  const L = x - r, R = x + r * 0.9, T = y - r * 0.55, B = y + r * 0.55;
  const layers = [0, 1, 2, 3];
  const lh = (B - T) / 4;
  return (
    <g>
      <defs>
        <mask id={id}>
          <rect x={L - 20} y={T - r} width={2.2 * r} height={3 * r} fill="#fff" />
          {bite > 0 && [0, 1, 2].map((k) => <circle key={k} cx={L + r * 0.05} cy={T + lh * (0.6 + k * 1.1)} r={r * 0.26 * bite} fill="#000" />)}
        </mask>
      </defs>
      {glow > 0 && <ellipse cx={x} cy={y} rx={r * 1.3} ry={r} fill="#FF7EB6" opacity={0.15 * glow} />}
      <g mask={`url(#${id})`}>
        {/* plate shadow */}
        <ellipse cx={x} cy={B + 10} rx={r * 1.05} ry={r * 0.12} fill="rgba(0,0,0,0.35)" />
        {/* sponge and cream layers */}
        {layers.map((k) => (
          <rect key={k} x={L} y={T + k * lh} width={R - L} height={lh} fill={k % 2 ? "#FFF1E6" : "#C98A4B"} />
        ))}
        {/* back face */}
        <rect x={R - 6} y={T} width={16} height={B - T} fill="#a86c35" />
        {/* top icing with drips */}
        <path d={`M${L} ${T} L${R + 10} ${T} L${R + 10} ${T + 18} Q${R - r * 0.1} ${T + 40} ${R - r * 0.25} ${T + 18} Q${x} ${T + 46} ${x - r * 0.2} ${T + 16} Q${L + r * 0.4} ${T + 36} ${L + r * 0.2} ${T + 14} L${L} ${T + 14} Z`} fill="#FF7EB6" />
        {/* cream swirl and cherry */}
        <ellipse cx={x + r * 0.4} cy={T - 16} rx={r * 0.22} ry={r * 0.13} fill="#FFF1E6" />
        <ellipse cx={x + r * 0.4} cy={T - 30} rx={r * 0.13} ry={r * 0.09} fill="#FFF1E6" />
        <circle cx={x + r * 0.4} cy={T - 52} r={r * 0.13} fill="#d81f3f" />
        <path d={`M${x + r * 0.4} ${T - 62} q 10 -30 34 -36`} fill="none" stroke="#3a7a2a" strokeWidth={4} strokeLinecap="round" />
        <circle cx={x + r * 0.36} cy={T - 58} r={r * 0.035} fill="#fff" opacity={0.7} />
      </g>
    </g>
  );
};

/* ---------------- 01 one more ---------------- */
export const S01: React.FC = () => {
  const id = "s01";
  const f = useCurrentFrame();
  const tCake = cue(id, "ნამცხვარი");
  const tAte = cue(id, "შეჭამე");
  const tSecond = cue(id, "მეორე");
  const tWhy = cue(id, "რატომ");
  const bite = useRamp(tAte, 6);
  const second = usePop(tSecond, 200);
  const glow = 0.5 + 0.5 * Math.sin(f / 6);
  const float = useWave(50) * 8;
  return (
    <Stage>
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <div style={kaText(70, 900)}>რატომ გინდა</div>
        <div style={{ ...kaText(92, 900, PINK), textShadow: `0 0 26px ${PINK}66` }}>კიდევ ერთი?</div>
      </div>
      <Svg>
        <GPop at={tCake - 6} cx={270} cy={500}>
          <Cake x={270} y={500 + float} r={150} bite={bite} />
        </GPop>
        {second > 0.01 && (
          <g transform={`translate(${680 + (1 - second) * 200} ${500 - float}) scale(${second}) translate(-680 -500)`}>
            <Cake x={680} y={500} r={150} glow={glow} />
          </g>
        )}
        <DrawPath at={tSecond} dur={10} d="M440 500 L520 500" stroke={C.yellow} strokeWidth={6} />
        <GPop at={tSecond + 8} cx={520} cy={500}><path d="M520 500 L500 486 M520 500 L500 514" stroke={C.yellow} strokeWidth={6} strokeLinecap="round" /></GPop>
      </Svg>
      <L x={680} y={680} at={tSecond + 4} center><span style={chip(PINK)}>+1</span></L>
      <Sticker at={tWhy} text="რატომ?" style={{ left: 380, top: 250, ...kaText(56, 900, C.yellow) }} rotate={-4} />
    </Stage>
  );
};

/* ---------------- 02 reward system ---------------- */
const BRAIN = "M300 330 C250 330 222 290 236 250 C206 230 210 180 250 166 C250 120 300 96 340 112 C370 72 440 70 470 104 C510 80 570 96 580 140 C626 146 650 196 630 234 C660 268 640 322 596 330 C590 370 540 392 500 376 C470 404 410 404 384 376 C350 392 306 372 300 330 Z";
export const S02: React.FC = () => {
  const id = "s02";
  const f = useCurrentFrame();
  const tTaste = cue(id, "ტკბილი");
  const tSignal = cue(id, "სიგნალს");
  const tReward = cue(id, "ჯილდოს");
  const tDa = cue(id, "დოფამინს");
  const tAgain = cue(id, "გაიმეორე");
  const sig = interpolate(f, [tSignal - 4, tSignal + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const lit = useRamp(tReward, 8);
  const pulse = 0.5 + 0.5 * Math.sin(f / 5);
  const rx = 470, ry = 280;
  const dots = Array.from({ length: 22 }, (_, i) => {
    const p = interpolate(f, [tDa + i * 0.7, tDa + i * 0.7 + 22], [0, 1], clamp);
    const a = seeded(i) * Math.PI * 2, d = 40 + 120 * seeded(i + 30);
    return { p, x: rx + Math.cos(a) * d * p, y: ry + Math.sin(a) * d * 0.7 * p };
  });
  // signal path tongue → brain
  const sx = 170 + (rx - 170) * sig, sy = 640 - (640 - ry) * sig - Math.sin(sig * Math.PI) * 60;
  return (
    <Stage>
      <Svg>
        <g transform="translate(40 0)">
          <GFade at={0} dur={12}><path d={BRAIN} fill="rgba(143,179,255,0.08)" /></GFade>
          <DrawPath at={0} dur={22} d={BRAIN} stroke={C.line} strokeWidth={4} />
          <DrawPath at={6} dur={18} d="M300 250 C340 230 360 270 400 250 M420 160 C450 190 490 170 520 200 M500 300 C540 280 560 320 590 290" stroke="rgba(213,230,255,0.35)" strokeWidth={3} />
        </g>
        {/* reward centre */}
        <circle cx={rx} cy={ry} r={34} fill={C.accent} opacity={0.15 + 0.6 * lit * (0.6 + 0.4 * pulse)} />
        <circle cx={rx} cy={ry} r={14} fill={lit > 0.5 ? C.accent : "rgba(213,230,255,0.4)"} />
        {lit > 0 && <circle cx={rx} cy={ry} r={34 + 40 * ((f - tReward) % 30) / 30} fill="none" stroke={C.accent} strokeWidth={3} opacity={(1 - ((f - tReward) % 30) / 30) * lit} />}
        {dots.map((d, i) => d.p > 0 && <circle key={i} cx={d.x} cy={d.y} r={7} fill={C.yellow} opacity={1 - d.p * 0.6} />)}
        {/* tongue */}
        <GPop at={tTaste - 4} cx={170} cy={660}>
          <path d="M90 640 C90 600 250 600 250 640 C250 720 200 760 170 760 C140 760 90 720 90 640 Z" fill={PINK} opacity={0.85} />
          <line x1={170} y1={630} x2={170} y2={720} stroke="#c2528a" strokeWidth={4} />
        </GPop>
        {/* signal */}
        <path d={`M170 640 Q320 ${ry + 160} ${rx} ${ry}`} fill="none" stroke={C.yellow} strokeWidth={3} strokeDasharray="6 10" opacity={sig > 0 ? 0.6 : 0} />
        {sig > 0 && sig < 1 && <circle cx={sx} cy={sy} r={12} fill={C.yellow} />}
      </Svg>
      <L x={170} y={770} at={tTaste} center><span style={kaText(26, 800, PINK)}>ტკბილი გემო</span></L>
      <L x={rx + 60} y={ry + 120} at={tReward}><span style={chip(C.accent)}>ჯილდოს სისტემა</span></L>
      <L x={720} y={90} at={tDa}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 20, height: 20, borderRadius: 10, background: C.yellow, display: "inline-block", boxShadow: `0 0 10px ${C.yellow}` }} />
          <span style={kaText(30, 900, C.yellow)}>დოფამინი</span>
        </div>
      </L>
      <Sticker at={tAgain} text="კარგი იყო — გაიმეორე!" style={{ left: 380, top: 560 }} rotate={-3} />
    </Stage>
  );
};

/* glucose chart shared by 03 and 04 */
const CH = { x0: 80, x1: 920, y0: 60, y1: 380, base: 280 };
const curve = (t: number) => {
  // spike at ~0.25, fall below baseline at ~0.6, recover
  const g = 1.0 * Math.exp(-((t - 0.28) ** 2) / 0.012) - 0.45 * Math.exp(-((t - 0.62) ** 2) / 0.008);
  return CH.base - g * 190;
};
const curvePath = (upTo: number) => {
  const n = 80;
  let d = "";
  for (let i = 0; i <= n * upTo; i++) {
    const t = i / n;
    d += `${i ? "L" : "M"}${(CH.x0 + (CH.x1 - CH.x0) * t).toFixed(1)} ${curve(t).toFixed(1)}`;
  }
  return d;
};
const Chart: React.FC<{ upTo: number; dangerZone?: number }> = ({ upTo, dangerZone = 0 }) => (
  <>
    <path d={`M${CH.x0} ${CH.y0} L${CH.x0} ${CH.y1} L${CH.x1} ${CH.y1}`} fill="none" stroke="rgba(213,230,255,0.55)" strokeWidth={2.5} />
    <line x1={CH.x0} x2={CH.x1} y1={CH.base} y2={CH.base} stroke="rgba(213,230,255,0.3)" strokeWidth={2} strokeDasharray="8 8" />
    {dangerZone > 0 && <rect x={CH.x0 + (CH.x1 - CH.x0) * 0.5} y={CH.base} width={(CH.x1 - CH.x0) * 0.25} height={CH.y1 - CH.base} fill={C.danger} opacity={0.18 * dangerZone} />}
    <path d={curvePath(upTo)} fill="none" stroke={C.yellow} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    {upTo > 0 && upTo < 1 && <circle cx={CH.x0 + (CH.x1 - CH.x0) * upTo} cy={curve(upTo)} r={10} fill={C.yellow} />}
  </>
);
const ChartLabels: React.FC = () => (
  <>
    <L x={CH.x0 + 10} y={CH.y0 - 50} at={0}><span style={kaText(24, 800, C.dim)}>სისხლის გლუკოზა</span></L>
    <L x={CH.x1 - 80} y={CH.y1 + 10} at={0}><span style={kaText(24, 800, C.dim)}>დრო</span></L>
    <L x={CH.x1 - 110} y={CH.base - 40} at={0}><span style={kaText(22, 700, C.dim)}>ნორმა</span></L>
  </>
);

/* ---------------- 03 glucose wave + insulin ---------------- */
export const S03: React.FC = () => {
  const id = "s03";
  const f = useCurrentFrame();
  const tRise = cue(id, "გლუკოზა");
  const tIns = cue(id, "ინსულინს");
  const tCells = cue(id, "უჯრედებში");
  const up = interpolate(f, [0, tRise + 20], [0, 0.42], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const keys = interpolate(f, [tIns, tCells + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cells = [560, 700, 840];
  return (
    <Stage>
      <Svg>
        <Chart upTo={up} />
        {/* pancreas */}
        <GPop at={tIns - 6} cx={200} cy={620}>
          <path d="M90 620 C90 570 170 560 230 585 C280 600 330 590 340 620 C350 660 290 670 240 660 C180 650 160 690 120 680 C95 672 90 650 90 620 Z" fill="rgba(255,154,77,0.3)" stroke="#FF9A4D" strokeWidth={4} />
        </GPop>
        {/* insulin keys travel to cells */}
        {[0, 1, 2].map((k) => {
          const p = Math.max(0, Math.min(1, keys * 1.3 - k * 0.15));
          if (p <= 0) return null;
          const x = 340 + (cells[k] - 340) * p, y = 620 - Math.sin(p * Math.PI) * 60;
          return (
            <g key={k} transform={`translate(${x} ${y})`}>
              <circle r={14} fill="none" stroke={C.accent} strokeWidth={4} />
              <path d="M14 0 L40 0 M30 0 L30 10 M38 0 L38 8" stroke={C.accent} strokeWidth={4} strokeLinecap="round" />
            </g>
          );
        })}
        {cells.map((x, k) => (
          <GPop key={k} at={tIns + k * 3} cx={x + 50} cy={640}>
            <circle cx={x + 50} cy={640} r={54} fill="rgba(52,227,220,0.06)" stroke="rgba(213,230,255,0.5)" strokeWidth={3} />
            <circle cx={x + 50} cy={640} r={16} fill="rgba(213,230,255,0.3)" />
            {keys > 0.6 && [0, 1, 2].map((j) => <circle key={j} cx={x + 30 + j * 20} cy={612 + (j % 2) * 50} r={7} fill={C.yellow} opacity={Math.min(1, (keys - 0.6) * 3)} />)}
          </GPop>
        ))}
      </Svg>
      <ChartLabels />
      <L x={330} y={70} at={tRise + 10}><span style={chip(C.yellow)}>მკვეთრი ზრდა</span></L>
      <L x={215} y={700} at={tIns} center><span style={kaText(24, 800, "#FF9A4D")}>კუჭქვეშა ჯირკვალი</span></L>
      <L x={440} y={540} at={tIns + 4}><span style={kaText(26, 900, C.accent)}>ინსულინი</span></L>
      <L x={750} y={710} at={tCells} center><span style={kaText(24, 800)}>უჯრედები</span></L>
    </Stage>
  );
};

/* ---------------- 04 the crash and the loop ---------------- */
const LOOP = ["შაქარი", "ტალღა", "ვარდნა", "სურვილი"];
export const S04: React.FC = () => {
  const id = "s04";
  const f = useCurrentFrame();
  const tFall = cue(id, "ეცემა");
  const tTired = cue(id, "დაღლილობა");
  const tWant = cue(id, "სურვილი");
  const tLoop = cue(id, "წრე");
  const up = interpolate(f, [0, tFall + 18], [0.42, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const zone = useRamp(tTired, 10);
  const spin = f > tLoop ? (f - tLoop) * 2 : 0;
  return (
    <Stage>
      <Svg>
        <Chart upTo={up} dangerZone={zone} />
        {/* loop */}
        <GFade at={tLoop - 4} dur={10}>
          <circle cx={480} cy={665} r={95} fill="none" stroke="rgba(213,230,255,0.3)" strokeWidth={3} strokeDasharray="8 10" />
          <g transform={`rotate(${spin} 480 665)`}>
            <path d="M575 665 l-12 -18 m12 18 l14 -16" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" fill="none" />
            <path d="M385 665 l12 18 m-12 -18 l-14 16" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" fill="none" />
          </g>
        </GFade>
      </Svg>
      <ChartLabels />
      <L x={CH.x0 + (CH.x1 - CH.x0) * 0.5} y={CH.y1 + 10} at={tTired}><span style={chip(C.danger)}>დაღლილობა</span></L>
      <L x={CH.x0 + (CH.x1 - CH.x0) * 0.5} y={CH.y1 + 62} at={tWant}><span style={chip(C.danger)}>ისევ ტკბილი მინდა</span></L>
      {LOOP.map((w, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 2;
        return (
          <L key={i} x={480 + Math.cos(a) * 175} y={665 + Math.sin(a) * 105 - 20} at={tLoop + i * 3} center>
            <span style={chip(i === 3 ? C.danger : C.yellow)}>{w}</span>
          </L>
        );
      })}
    </Stage>
  );
};

/* ---------------- 05 liquid sugar: a can = 9 teaspoons ---------------- */
const Spoon: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <g transform={`translate(${x} ${y}) rotate(-30)`}>
    <ellipse cx={0} cy={0} rx={26} ry={18} fill={color} opacity={0.85} />
    <ellipse cx={0} cy={-4} rx={20} ry={11} fill="#fff" opacity={0.9} />
    <rect x={24} y={-5} width={56} height={10} rx={5} fill={color} opacity={0.85} />
  </g>
);
export const S05: React.FC = () => {
  const id = "s05";
  const f = useCurrentFrame();
  const tNine = cue(id, "ცხრა");
  const tWho = cue(id, "ჯანმრთელობის");
  const tSix = cue(id, "ექვს");
  const tFull = cue(id, "გაძღომის");
  const over = useRamp(tSix + 6, 8);
  const fizz = (i: number) => ((f * (1.5 + seeded(i))) + seeded(i + 9) * 200) % 200;
  return (
    <Stage>
      <Svg>
        {/* can */}
        <GPop at={0} cx={160} cy={270}>
          <rect x={60} y={90} width={200} height={360} rx={30} fill="#c8273a" stroke={C.line} strokeWidth={4} />
          <rect x={80} y={70} width={160} height={30} rx={10} fill="#d8dde8" />
          <path d="M60 220 C120 190 200 250 260 210 L260 280 C200 320 120 260 60 290 Z" fill="#fff" opacity={0.85} />
          {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={90 + seeded(i) * 140} cy={440 - fizz(i) * 1.6} r={4} fill="#fff" opacity={0.35} />)}
        </GPop>
        {/* 9 spoons in a 3×3 grid */}
        {Array.from({ length: 9 }, (_, i) => {
          const x = 430 + (i % 3) * 170, y = 130 + Math.floor(i / 3) * 90;
          const red = i >= 6 ? over : 0;
          return (
            <GPop key={i} at={tNine + i * 2} cx={x} cy={y}>
              <Spoon x={x} y={y} color={red > 0.5 ? C.danger : C.yellow} />
            </GPop>
          );
        })}
        <GFade at={tSix} dur={8}>
          <line x1={380} x2={930} y1={265} y2={265} stroke={C.accent} strokeWidth={4} strokeDasharray="10 8" />
        </GFade>
      </Svg>
      <L x={160} y={470} at={4} center><span style={kaText(26, 800)}>ერთი ქილა · 330 მლ</span></L>
      <L x={380} y={10} at={tNine}><span style={{ ...kaText(46, 900, C.yellow), whiteSpace: "nowrap" }}>≈ 9 კოვზი · 35 გ</span></L>
      <L x={380} y={370} at={tSix}><span style={kaText(26, 800, C.accent)}>ჯანმო: იდეალურად ≤ 6 კოვზი დღეში</span></L>
      <Appear at={tWho} dy={0} dx={0} style={{ position: "absolute", left: 380, top: 412, ...monoText(18) }}>WHO, 2015 · free sugars &lt; 5% (~25 გ)</Appear>
      <Appear at={tFull} dy={20} style={{ ...card(C.line), left: 0, top: 560, width: 960, display: "flex", alignItems: "center", gap: 24 }}>
        <svg width={70} height={70} viewBox="0 0 70 70">
          <path d="M20 10 C10 30 12 56 34 60 C56 62 62 40 50 30 C42 24 44 12 36 10 Z" fill="rgba(213,230,255,0.1)" stroke={C.line} strokeWidth={4} />
          <text x={36} y={48} textAnchor="middle" fill={C.yellow} fontFamily={config.fonts.ka} fontWeight={900} fontSize={30}>?</text>
        </svg>
        <div>
          <div style={kaText(26, 700, C.dim)}>სასმელიდან</div>
          <div style={kaText(36, 900)}>გაძღომა — თითქმის არა</div>
        </div>
      </Appear>
    </Stage>
  );
};

/* ---------------- 06 is it addiction? ---------------- */
export const S06: React.FC = () => {
  const id = "s06";
  const tDiag = cue(id, "დიაგნოზი");
  const tAnimal = cue(id, "ცხოველებზე");
  const tHuman = cue(id, "ადამიანთან");
  const tHabit = cue(id, "ჩვევა");
  const no = usePop(tDiag + 6, 240);
  return (
    <Stage>
      <L x={0} y={0} at={-2}><span style={kaText(48, 900)}>ეს დამოკიდებულებაა?</span></L>
      <Appear at={tDiag - 6} dy={20} style={{ ...card(C.line), left: 0, top: 100, width: 960, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={kaText(24, 700, C.dim)}>ოფიციალური დიაგნოზი</div>
          <div style={kaText(32, 900)}>„შაქარზე დამოკიდებულება“</div>
        </div>
        <div style={{ transform: `scale(${no})`, ...kaText(48, 900, C.danger), whiteSpace: "nowrap", marginLeft: 20 }}>არ არის</div>
      </Appear>
      <Appear at={tAnimal} dy={20} style={{ ...card(C.yellow), left: 0, top: 290, width: 455, height: 300 }}>
        <svg width={120} height={80} viewBox="0 0 120 80">
          <ellipse cx={60} cy={50} rx={40} ry={24} fill="rgba(213,230,255,0.15)" stroke={C.line} strokeWidth={3} />
          <circle cx={96} cy={40} r={14} fill="rgba(213,230,255,0.15)" stroke={C.line} strokeWidth={3} />
          <circle cx={102} cy={36} r={3} fill={C.line} />
          <path d="M20 54 C4 60 4 72 16 76" fill="none" stroke={C.line} strokeWidth={3} />
        </svg>
        <div style={kaText(24, 700, C.dim)}>ცხოველებზე კვლევები</div>
        <div style={kaText(32, 900, C.yellow)}>მსგავსი ქცევა</div>
      </Appear>
      <Appear at={tHuman} dy={20} style={{ ...card(C.accent), left: 505, top: 290, width: 455, height: 300 }}>
        <svg width={80} height={80} viewBox="0 0 80 80">
          <circle cx={40} cy={24} r={16} fill="rgba(52,227,220,0.15)" stroke={C.accent} strokeWidth={3} />
          <path d="M12 78 C12 52 68 52 68 78" fill="rgba(52,227,220,0.15)" stroke={C.accent} strokeWidth={3} />
        </svg>
        <div style={kaText(24, 700, C.dim)}>ადამიანი</div>
        <Appear at={tHabit} dx={-12} dy={0}><div style={kaText(32, 900, C.accent)}>ჩვევა + ჯილდო</div></Appear>
      </Appear>
    </Stage>
  );
};

/* ---------------- 07 tips + outro ---------------- */
const Tip: React.FC<{ at: number; color: string; text: string; icon: React.ReactNode }> = ({ at, color, text, icon }) => (
  <Appear at={at} dx={-24} dy={0} style={{ display: "flex", alignItems: "center", gap: 22, height: 96 }}>
    <div style={{ width: 80, height: 80, borderRadius: 20, border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,18,44,0.8)" }}>
      <svg width={50} height={50} viewBox="0 0 50 50">{icon}</svg>
    </div>
    <span style={kaText(34, 900, color)}>{text}</span>
  </Appear>
);
export const S07: React.FC = () => {
  const id = "s07";
  const f = useCurrentFrame();
  const tOut = cue(id, "გამოიწერე");
  const out = interpolate(f, [tOut - 6, tOut + 4], [1, 0], clamp);
  const pAv = usePop(tOut, 180);
  const float = useWave(60) * 6;
  const st = { fill: "none", strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <Stage>
      <div style={{ opacity: out }}>
        <L x={0} y={0} at={-2}><span style={kaText(44, 900)}>რა ვქნა?</span></L>
        <div style={{ position: "absolute", left: 0, top: 90, display: "flex", flexDirection: "column", gap: 14 }}>
          <Tip at={cue(id, "ცილასთან")} color={C.accent} text="ტკბილი — ცილასთან ან ბოჭკოსთან" icon={<g {...st} stroke={C.accent}><path d="M10 40 C10 20 40 10 40 10 C40 10 42 36 22 40 Z" /><path d="M14 36 L30 20" /></g>} />
          <Tip at={cue(id, "გაზიანი")} color={C.accent} text="გაზიანის ნაცვლად — წყალი" icon={<g {...st} stroke={C.accent}><path d="M14 8 H36 L33 44 H17 Z" /><path d="M16 22 H34" /></g>} />
          <Tip at={cue(id, "გემოვნება")} color={C.yellow} text="გემოვნება ეჩვევა ნაკლებ შაქარს" icon={<g {...st} stroke={C.yellow}><path d="M8 30 C14 18 22 18 26 26 C30 34 38 34 42 22" /><path d="M36 22 H42 V28" /></g>} />
        </div>
        <Sticker at={cue(id, "დროთა")} text="დროთა განმავლობაში" style={{ left: 520, top: 470 }} rotate={-3} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 30, width: 960, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, pAv * 1.4) }}>
        <Img src={staticFile(config.avatar)} style={{ width: 340, height: 340, borderRadius: 170, border: `6px solid ${C.accent}`, boxShadow: `0 0 60px ${C.accent}66`, transform: `translateY(${float}px) scale(${0.7 + 0.3 * pAv})` }} />
        <div style={{ ...kaText(84, 900), marginTop: 30 }}>{config.name}</div>
        <div style={{ ...kaText(28, 700, C.dim), marginTop: 6 }}>{config.outroLine}</div>
        <div style={{ marginTop: 34, background: C.accent, borderRadius: 50, padding: "16px 54px 20px", ...kaText(44, 900, "#04202a"), transform: `scale(${1 + 0.04 * Math.sin(f / 7)})` }}>გამოიწერე</div>
      </div>
    </Stage>
  );
};
