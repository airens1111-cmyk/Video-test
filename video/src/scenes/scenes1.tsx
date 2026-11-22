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

const DOT_COLORS = [C.accent, C.yellow, "#8FB3FF"];

/* ---------------- 03 brain / synapse ---------------- */
const NT = [
  { name: "დოფამინი", c: C.accent },
  { name: "სეროტონინი", c: C.yellow },
  { name: "ნორადრენალინი", c: "#8FB3FF" },
];
export const S03: React.FC = () => {
  const id = "s03";
  const f = useCurrentFrame();
  const tTalk = cue(id, "ესაუბრებიან");
  const tDa = cue(id, "დოფამინი");
  const tSe = cue(id, "სეროტონინი");
  const tNe = cue(id, "ნორადრენალინი");
  const tFlood = cue(id, "ყრის");
  const tBlock = cue(id, "ბლოკავს");
  const tBoom = cue(id, "აფეთქება");
  const types = [tDa, tSe, tNe];

  // synapse geometry
  const termBottom = 300;          // bottom edge of the upper terminal
  const membY = 470;               // post-synaptic membrane line
  const recX = [300, 420, 540, 660];
  const pBlock = usePop(tBlock, 240);
  const boom = useRamp(tBoom, 10);
  const pulse = 0.5 + 0.5 * Math.sin((f - tBoom) / 5);

  // one demo messenger crosses first (on "ესაუბრებიან")
  const demo = interpolate(f, [tTalk, tTalk + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const demoX = 480, dyTop = termBottom - 6, dyBot = membY - 22;

  // three named messengers dock (one per word)
  const named = types.map((at, k) => {
    const p = interpolate(f, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    return { p, x: 480 + (recX[k + 1] - 480) * p, y: dyTop + (membY - 40 - dyTop) * p - Math.sin(p * Math.PI) * 26, c: NT[k].c };
  });

  // flood from the bursting vesicle (on "ყრის")
  const flood = Array.from({ length: 34 }, (_, i) => {
    const at = tFlood + i * 0.8;
    const p = interpolate(f, [at, at + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
    const type = i % 3;
    const sx = 455 + seeded(i) * 50;          // from vesicle mouth
    const ex = 300 + seeded(i + 99) * 360;
    const ey = membY - 30 + seeded(i + 7) * 24 + Math.sin((f + i * 9) / 8) * 4;
    const x = sx + (ex - sx) * p;
    const y = dyTop + (ey - dyTop) * p - Math.sin(p * Math.PI) * 34;
    return { type, p, x, y };
  });
  const burst = usePop(tFlood, 200);

  return (
    <Stage>
      <Svg>
        {/* upper neuron terminal */}
        <DrawPath at={0} dur={14} d={`M300 10 C300 120 250 200 250 ${termBottom - 10} C250 ${termBottom + 30} 330 ${termBottom + 50} 480 ${termBottom + 50} C630 ${termBottom + 50} 710 ${termBottom + 30} 710 ${termBottom - 10} C710 200 660 120 660 10`} />
        {/* vesicle that will burst */}
        <GPop at={6} cx={480} cy={termBottom - 20}>
          <circle cx={480} cy={termBottom - 20} r={26} fill="none" stroke={C.accent} strokeWidth={3} opacity={0.9} />
          <circle cx={480} cy={termBottom - 20} r={13} fill={C.accent} opacity={0.3 + 0.4 * burst} />
        </GPop>
        {/* post-synaptic membrane + receptors */}
        <DrawPath at={6} dur={16} d={`M150 ${membY + 50} C320 ${membY + 8} 640 ${membY + 8} 810 ${membY + 50}`} />
        {recX.map((x, i) => {
          const lit = i === 0 ? demo : i <= 3 ? named[i - 1]?.p ?? 0 : 0;
          const litAll = Math.max(lit, boom);
          return (
            <g key={i}>
              <DrawPath at={10 + i * 2} dur={10} d={`M${x - 18} ${membY + 2} L${x - 18} ${membY + 24} L${x + 18} ${membY + 24} L${x + 18} ${membY + 2}`} stroke={C.accent} strokeWidth={3} />
              <rect x={x - 26} y={membY - 8} width={52} height={42} rx={8} fill={i === 0 ? C.line : NT[Math.min(i - 1, 2)].c} opacity={0.5 * litAll * (0.6 + 0.4 * pulse)} />
            </g>
          );
        })}
        {/* gap label */}
        <GFade at={2}>
          <line x1={150} x2={210} y1={termBottom + 70} y2={membY + 20} stroke="rgba(213,230,255,0.4)" strokeWidth={1.5} strokeDasharray="4 5" />
        </GFade>
        {/* demo messenger crossing */}
        {demo > 0 && demo < 1 && (
          <g>
            <line x1={demoX} y1={dyTop + (dyBot - dyTop) * Math.max(0, demo - 0.12)} x2={demoX} y2={dyTop + (dyBot - dyTop) * demo} stroke={C.line} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
            <circle cx={demoX} cy={dyTop + (dyBot - dyTop) * demo - Math.sin(demo * Math.PI) * 22} r={12} fill={C.line} />
          </g>
        )}
        {/* three named messengers */}
        {named.map((d, i) => d.p > 0 && d.p < 1 && <circle key={i} cx={d.x} cy={d.y} r={11} fill={d.c} />)}
        {/* flood with short motion trails */}
        {flood.map((d, i) => d.p > 0 && (
          <g key={i} opacity={d.p < 0.98 ? 0.95 : 0.55}>
            <circle cx={d.x} cy={d.y} r={8} fill={DOT_COLORS[d.type]} />
          </g>
        ))}
        {/* release arrow */}
        <DrawPath at={tFlood} dur={10} d={`M150 ${termBottom - 40} L150 ${termBottom + 60}`} stroke={C.yellow} strokeWidth={4} />
        <GPop at={tFlood + 7} cx={150} cy={termBottom + 60}>
          <path d={`M150 ${termBottom + 60} L138 ${termBottom + 40} M150 ${termBottom + 60} L162 ${termBottom + 40}`} stroke={C.yellow} strokeWidth={4} strokeLinecap="round" fill="none" />
        </GPop>
        {/* reuptake transporter + block */}
        <GFade at={tFlood - 6}><rect x={690} y={membY - 20} width={34} height={56} rx={10} fill="none" stroke={C.accent} strokeWidth={3} /></GFade>
        <GPop at={tBlock} cx={707} cy={membY + 8}>
          <circle cx={707} cy={membY + 8} r={34} fill="rgba(255,106,77,0.15)" stroke={C.danger} strokeWidth={4} />
          <path d={`M693 ${membY - 6} L721 ${membY + 22} M721 ${membY - 6} L693 ${membY + 22}`} stroke={C.danger} strokeWidth={6} strokeLinecap="round" />
        </GPop>
        {/* boom glow across the gap */}
        {boom > 0 && <rect x={200} y={termBottom + 40} width={520} height={membY - termBottom - 10} rx={20} fill={C.yellow} opacity={0.1 * boom * (0.5 + 0.5 * pulse)} />}
      </Svg>
      <L x={20} y={30} at={2}><span style={kaText(26, 800, C.dim)}>ნეირონი</span></L>
      <L x={20} y={membY + 70} at={8}><span style={kaText(26, 800, C.dim)}>მეორე ნეირონი</span></L>
      <L x={56} y={termBottom + 60} at={2} center><span style={kaText(22, 700, "rgba(213,230,255,0.75)")}>სინაფსი</span></L>
      <L x={70} y={termBottom - 30} at={tFlood + 2} center><span style={kaText(26, 800, C.yellow)}>გამოყოფა</span></L>
      <L x={735} y={membY - 34} at={tBlock} style={{ textAlign: "left" }}>
        <div style={kaText(24, 800, C.danger)}>უკუშეწოვა</div>
        <div style={kaText(20, 700, C.danger)}>დაბლოკილია</div>
      </L>
      {/* legend builds as the three are named */}
      {NT.map((n, i) => (
        <L key={i} x={[20, 290, 560][i]} y={membY + 170} at={types[i]}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: 10, background: n.c, display: "inline-block", boxShadow: `0 0 10px ${n.c}` }} />
            <span style={kaText(26, 800)}>{n.name}</span>
          </div>
        </L>
      ))}
      <Sticker at={tBoom} text="სიგნალი — ზედმეტად ძლიერი" style={{ left: 250, top: membY + 230 }} rotate={-2} />
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
