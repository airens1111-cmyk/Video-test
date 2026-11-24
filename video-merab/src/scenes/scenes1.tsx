import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile } from "remotion";
import { config } from "../config";
import { cue, sentenceStart } from "../timing";
import { Appear, DrawPath, GFade, GPop, kaText, monoText, useRamp, usePop, useWave, CountUp, seeded } from "../components/anim";
import { LAYOUT, Sticker, DangerBlock } from "../components/chrome";

const C = config.colors;
export const W = 960;
export const H = LAYOUT.stageHeight;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

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

export const chip = (color: string): React.CSSProperties => ({
  ...kaText(26, 800, color),
  border: `2px solid ${color}`,
  borderRadius: 30,
  padding: "4px 18px 6px",
  whiteSpace: "nowrap",
});

export const card = (border = "rgba(213,230,255,0.35)"): React.CSSProperties => ({
  position: "absolute",
  border: `2px solid ${border}`,
  borderRadius: 18,
  padding: "18px 26px",
  background: "rgba(8,18,44,0.8)",
  boxShadow: "0 18px 50px rgba(2,8,24,0.6)",
});

/** Round or square photo with accent frame and a small credit line. */
export const Photo: React.FC<{ src: string; size: number; round?: boolean; color?: string; credit?: string; style?: React.CSSProperties }> = ({
  src, size, round = true, color = C.accent, credit, style,
}) => (
  <div style={{ position: "relative", width: size, ...style }}>
    <Img src={staticFile(`photos/${src}`)} style={{ width: size, height: size, objectFit: "cover", borderRadius: round ? size / 2 : 12, border: `4px solid ${color}`, boxShadow: `0 0 24px ${color}55`, display: "block" }} />
    {credit ? <div style={{ ...monoText(13, "rgba(160,180,220,0.75)"), marginTop: 4, textAlign: "center", whiteSpace: "nowrap" }}>{credit}</div> : null}
  </div>
);

/** Side-view car; (x, y) = ground under the middle of the car. */
export const Car: React.FC<{ x: number; y: number; s?: number; lights?: number }> = ({ x, y, s = 1, lights = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {lights > 0 && <path d="M74 -20 L300 -58 L300 24 Z" fill={C.yellow} opacity={0.16 * lights} />}
    <path
      d="M-78 -14 L-78 -34 Q-76 -44 -58 -46 L-36 -70 Q-30 -76 -16 -76 L28 -76 Q40 -76 48 -68 L66 -46 Q80 -44 80 -30 L80 -14 Z"
      fill="#0d1a3a" stroke={C.line} strokeWidth={3} strokeLinejoin="round"
    />
    <path d="M-28 -48 L-14 -66 L6 -66 L6 -48 Z M14 -48 L14 -66 L34 -66 L48 -48 Z" fill="rgba(52,227,220,0.18)" stroke={C.line} strokeWidth={2} />
    <circle cx={-44} cy={-12} r={15} fill={C.bgBottom} stroke={C.line} strokeWidth={3} />
    <circle cx={46} cy={-12} r={15} fill={C.bgBottom} stroke={C.line} strokeWidth={3} />
    <rect x={72} y={-40} width={9} height={9} rx={2} fill={C.yellow} opacity={0.3 + 0.7 * lights} />
    <rect x={-80} y={-40} width={6} height={9} rx={2} fill={C.danger} opacity={0.4 + 0.6 * lights} />
  </g>
);

/* ---------------- 01 night prison, 01:30 ---------------- */
export const S01: React.FC = () => {
  const id = "s01";
  const f = useCurrentFrame();
  const tHalf = cue(id, "ნახევარი");
  const tCell = cue(id, "საკანს");
  const tOpen = cue(id, "აღებენ");
  const tPris = cue(id, "პატიმარს");
  const tJacket = cue(id, "ქურთუკს");
  const tCar = cue(id, "მანქანაში");
  const tGo = cue(id, "სვამენ");

  // clock: 01:29 ticks over to 01:30 on "ნახევარი"
  const flip = interpolate(f, [tHalf, tHalf + 6], [0, 1], clamp);
  const colon = Math.floor(f / 15) % 2 === 0 ? 1 : 0.25;
  const clockIn = interpolate(f, [-4, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });

  // searchlight sweep
  const beamA = (-118 + 26 * Math.sin(f / 38)) * (Math.PI / 180);
  const bx = 742, by = 236;
  const beam = (a: number, r: number) => `${bx + Math.cos(a) * r} ${by - Math.sin(a) * r * -1}`;
  const b1 = beamA - 0.09, b2 = beamA + 0.09;

  const cellLit = useRamp(tCell, 8);
  const barsOpen = interpolate(f, [tOpen, tOpen + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const inset = usePop(tPris, 200);
  const carIn = interpolate(f, [tCar - 10, tCar + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lights = useRamp(tGo, 6);
  const drive = interpolate(f, [tGo + 8, tGo + 40], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const carX = 1180 - 330 * carIn + 520 * drive;
  const shimmer = 0.6 + 0.4 * Math.sin(f / 9);
  const jacketO = useRamp(tJacket, 8);
  const jacketY = (1 - useRamp(tJacket, 10)) * -30;

  const winCols = [170, 260, 350, 440, 530];
  const winRows = [300, 380, 460];
  const cell = { c: 2, r: 1 };

  return (
    <Stage>
      {/* digital clock */}
      <div style={{ position: "absolute", left: 0, top: 0, opacity: clockIn, transform: `scale(${0.8 + 0.2 * clockIn})`, transformOrigin: "left top" }}>
        <div style={{ ...card(C.yellow), position: "relative", padding: "10px 30px 14px", background: "rgba(10,16,36,0.92)", boxShadow: `0 0 40px ${C.yellow}33` }}>
          <div style={{ fontFamily: config.fonts.mono, fontWeight: 700, fontSize: 132, color: C.yellow, letterSpacing: 2, lineHeight: 1, textShadow: `0 0 24px ${C.yellow}88`, display: "flex" }}>
            <span>01</span>
            <span style={{ opacity: colon }}>:</span>
            <span style={{ position: "relative", display: "inline-block", width: 160, overflow: "hidden", height: 132 }}>
              <span style={{ position: "absolute", left: 0, top: -132 * flip }}>29</span>
              <span style={{ position: "absolute", left: 0, top: 132 - 132 * flip }}>30</span>
            </span>
          </div>
        </div>
        <div style={{ ...monoText(24, C.dim), marginTop: 10 }}>14.12.2013 · ღამე</div>
      </div>

      <Svg>
        {/* moon */}
        <GFade at={0} dur={14}>
          <circle cx={600} cy={50} r={30} fill="#e9eefc" opacity={0.85} />
          <circle cx={614} cy={42} r={28} fill="#0b1d48" />
        </GFade>
        {/* searchlight beam */}
        <path d={`M${bx} ${by} L${beam(b1, 900)} L${beam(b2, 900)} Z`} fill={C.yellow} opacity={0.07} />
        {/* main block */}
        <GFade at={0} dur={12}>
          <rect x={120} y={260} width={500} height={300} fill="rgba(20,34,72,0.9)" stroke="rgba(213,230,255,0.35)" strokeWidth={2} />
          <rect x={110} y={248} width={520} height={14} fill="rgba(213,230,255,0.25)" />
        </GFade>
        {winRows.map((y, r) =>
          winCols.map((x, c) => {
            const isCell = r === cell.r && c === cell.c;
            const glow = isCell ? cellLit : 0.12 + 0.1 * seeded(r * 7 + c);
            return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={50} height={58} rx={3} fill={isCell ? C.yellow : "#8fb3ff"} opacity={isCell ? 0.15 + 0.7 * glow * shimmer : glow} />
                {[0, 1, 2, 3].map((k) => {
                  const off = isCell ? (k < 2 ? -1 : 1) * barsOpen * 22 : 0;
                  return <line key={k} x1={x + 10 + k * 10 + off} x2={x + 10 + k * 10 + off} y1={y} y2={y + 58} stroke="#0b1530" strokeWidth={4} />;
                })}
              </g>
            );
          })
        )}
        {/* watchtower */}
        <GFade at={2} dur={12}>
          <rect x={712} y={250} width={60} height={310} fill="rgba(20,34,72,0.95)" stroke="rgba(213,230,255,0.35)" strokeWidth={2} />
          <path d="M696 252 L788 252 L770 214 L714 214 Z" fill="rgba(20,34,72,1)" stroke="rgba(213,230,255,0.45)" strokeWidth={2} />
          <circle cx={bx} cy={by} r={9} fill={C.yellow} />
        </GFade>
        {/* outer wall with razor wire */}
        <GFade at={0} dur={10}>
          <rect x={0} y={560} width={960} height={110} fill="rgba(14,26,58,0.97)" stroke="rgba(213,230,255,0.3)" strokeWidth={2} />
          <path d={Array.from({ length: 33 }, (_, i) => `${i ? "L" : "M"}${i * 30} ${i % 2 ? 546 : 560}`).join(" ")} fill="none" stroke="rgba(213,230,255,0.45)" strokeWidth={2} />
          <rect x={780} y={590} width={150} height={80} fill="#081430" stroke="rgba(213,230,255,0.4)" strokeWidth={2} />
          {[0, 1, 2, 3, 4].map((k) => (
            <line key={k} x1={795 + k * 30} x2={795 + k * 30} y1={590} y2={670} stroke="rgba(213,230,255,0.3)" strokeWidth={3} />
          ))}
        </GFade>
        <line x1={0} x2={960} y1={740} y2={740} stroke="rgba(213,230,255,0.18)" strokeWidth={2} />
        {/* car */}
        {carIn > 0 && <Car x={carX} y={740} s={1} lights={lights} />}
        {/* connector from lit cell to inset */}
        {inset > 0.01 && (
          <line x1={375} y1={409} x2={720} y2={200} stroke={C.yellow} strokeWidth={2} strokeDasharray="6 8" opacity={Math.min(1, inset)} />
        )}
        {/* inset: prisoner with own jacket over head */}
        {inset > 0.01 && (
          <g transform={`translate(820 160) scale(${inset})`}>
            <circle cx={0} cy={0} r={118} fill="rgba(8,18,44,0.95)" stroke={C.yellow} strokeWidth={4} />
            <g>
              <path d="M-70 110 Q-72 40 0 34 Q72 40 70 110 Z" fill="#3a4b78" />
              <g opacity={jacketO} transform={`translate(0 ${jacketY})`}>
                <path d="M-56 52 Q-60 -44 0 -60 Q60 -44 56 52 Q28 40 0 44 Q-28 40 -56 52 Z" fill="#22355f" stroke={C.accent} strokeWidth={3} />
                <line x1={0} y1={-50} x2={0} y2={44} stroke={C.accent} strokeWidth={2} strokeDasharray="4 5" />
              </g>
            </g>
          </g>
        )}
      </Svg>
      <L x={820} y={300} at={tJacket} center><span style={chip(C.accent)}>ქურთუკი თავზე</span></L>
      <L x={250} y={600} at={tOpen}><span style={kaText(28, 800, C.yellow)}>საკანი იღება</span></L>
    </Stage>
  );
};

/* ---------------- 02 who: former PM, December 2013 ---------------- */
export const S02: React.FC = () => {
  const id = "s02";
  const f = useCurrentFrame();
  const tName = cue(id, "მერაბიშვილი");
  const tFormer = cue(id, "ყოფილი");
  const tDec = cue(id, "დეკემბერია");
  const t2013 = cue(id, "2013");
  const scan = (f * 4) % 300;
  const ring = useRamp(t2013 + 8, 14);
  return (
    <Stage>
      <Appear at={0} dy={20} style={{ ...card(C.accent), left: 0, top: 0, width: 960, height: 380, padding: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 30, top: 30, width: 250, height: 300, borderRadius: 12, border: `2px solid ${C.accent}`, background: "rgba(52,227,220,0.06)", overflow: "hidden" }}>
          <Img src={staticFile("photos/merabishvili.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 250, height: 300, objectFit: "cover", objectPosition: "50% 20%", filter: `grayscale(${1 - useRamp(tName - 4, 14)})` }} />
          <svg width={250} height={300} viewBox="0 0 250 300" style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={0} x2={250} y1={scan} y2={scan} stroke={C.accent} strokeWidth={2} opacity={0.5} />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 310, top: 36, right: 30 }}>
          <div style={monoText(22, C.dim)}>საქმე · Merabishvili v. Georgia · 72508/13</div>
          <Appear at={tName - 4} dx={-20} dy={0}>
            <div style={{ ...kaText(58, 900), marginTop: 10, lineHeight: 1.1 }}>ვანო</div>
            <div style={{ ...kaText(64, 900, C.accent), lineHeight: 1.15, textShadow: `0 0 20px ${C.accent}44` }}>მერაბიშვილი</div>
          </Appear>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18, alignItems: "flex-start" }}>
            <Appear at={tFormer} dx={-20} dy={0}><span style={chip(C.yellow)}>ყოფილი პრემიერ-მინისტრი</span></Appear>
            <Appear at={tFormer + 10} dx={-20} dy={0}><span style={chip(C.line)}>21.05.2013-დან — პატიმრობაში</span></Appear>
          </div>
        </div>
        <div style={{ position: "absolute", left: 30, top: 338, ...monoText(13, "rgba(160,180,220,0.75)") }}>ფოტო: საქართველოს მთავრობა / Wikimedia Commons</div>
      </Appear>
      {/* calendar page */}
      <Appear at={tDec} dy={24} style={{ ...card(C.yellow), left: 230, top: 430, width: 500, padding: 0, overflow: "hidden" }}>
        <div style={{ background: C.yellow, padding: "8px 0 10px", textAlign: "center", ...kaText(34, 900, "#1a1400") }}>დეკემბერი</div>
        <div style={{ padding: "16px 0 22px", textAlign: "center", position: "relative" }}>
          <CountUp at={t2013} from={2001} to={2013} dur={14} style={{ ...kaText(120, 900), letterSpacing: -2, lineHeight: 1 }} />
          <svg width={500} height={170} style={{ position: "absolute", left: 0, top: 0 }}>
            <ellipse cx={250} cy={82} rx={200} ry={70} fill="none" stroke={C.danger} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-4 250 82)" />
          </svg>
        </div>
      </Appear>
    </Stage>
  );
};

/* ---------------- 03 Tbilisi scheme: car route + the alleged deal ---------------- */
const ROUTE: [number, number][] = [[140, 330], [140, 250], [470, 250], [470, 180], [660, 180], [660, 110], [800, 110]];
const routeLen = ROUTE.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]), 0);
const routeAt = (p: number): [number, number] => {
  let d = p * routeLen;
  for (let i = 1; i < ROUTE.length; i++) {
    const [x0, y0] = ROUTE[i - 1], [x1, y1] = ROUTE[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (d <= seg) return [x0 + ((x1 - x0) * d) / seg, y0 + ((y1 - y0) * d) / seg];
    d -= seg;
  }
  return ROUTE[ROUTE.length - 1];
};
const routeD = ROUTE.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");

export const S03: React.FC = () => {
  const id = "s03";
  const f = useCurrentFrame();
  const tBring = cue(id, "მიიყვანენ");
  const tDeal = cue(id, "გარიგებას");
  const tInfo = cue(id, "ინფორმაცია");
  const tZh = cue(id, "ჟვანიას");
  const tSa = cue(id, "სააკაშვილის");
  const tLeave = cue(id, "სანაცვლოდ");
  const tGo = cue(id, "ქვეყნიდან");
  const drive = interpolate(f, [4, tBring + 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const [cx, cy] = routeAt(drive);
  const arrive = usePop(tBring + 8, 220);
  const swap = useWave(40);
  return (
    <Stage>
      <Svg>
        <defs>
          <clipPath id="tbsMap"><rect x={0} y={0} width={960} height={410} rx={18} /></clipPath>
        </defs>
        <GFade at={0} dur={10}>
          <rect x={0} y={0} width={960} height={410} rx={18} fill="rgba(8,18,44,0.75)" stroke="rgba(213,230,255,0.3)" strokeWidth={2} />
        </GFade>
        <g clipPath="url(#tbsMap)">
          {/* street grid */}
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`v${i}`} x1={40 + i * 80 + (i % 3) * 7} x2={20 + i * 80} y1={0} y2={410} stroke="rgba(213,230,255,0.07)" strokeWidth={6} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1={0} x2={960} y1={40 + i * 70} y2={30 + i * 72} stroke="rgba(213,230,255,0.07)" strokeWidth={6} />
          ))}
          {/* Mtkvari */}
          <DrawPath at={0} dur={18} d="M250 -20 C330 90 260 170 360 230 C450 285 560 280 610 340 C650 390 700 410 720 440" stroke="#2f6bd0" strokeWidth={26} opacity={0.55} />
          {/* route */}
          <path d={routeD} fill="none" stroke="rgba(247,208,70,0.25)" strokeWidth={6} strokeDasharray="2 12" strokeLinecap="round" />
          <path d={routeD} fill="none" stroke={C.yellow} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drive} />
        </g>
        {/* points */}
        <GPop at={2} cx={140} cy={330}>
          <circle cx={140} cy={330} r={18} fill={C.bgBottom} stroke={C.line} strokeWidth={4} />
          <rect x={131} y={321} width={18} height={18} fill="none" stroke={C.line} strokeWidth={2} />
        </GPop>
        <GPop at={tBring} cx={800} cy={110}>
          <circle cx={800} cy={110} r={22} fill={C.bgBottom} stroke={C.danger} strokeWidth={5} />
          <circle cx={800} cy={110} r={8} fill={C.danger} />
        </GPop>
        {arrive > 0.01 && <circle cx={800} cy={110} r={22 + 40 * arrive} fill="none" stroke={C.danger} strokeWidth={3} opacity={Math.max(0, 1 - arrive)} />}
        {/* moving car marker */}
        {drive > 0 && (
          <g>
            <circle cx={cx} cy={cy} r={26} fill={C.yellow} opacity={0.18} />
            <circle cx={cx} cy={cy} r={12} fill={C.yellow} />
          </g>
        )}
      </Svg>
      <L x={20} y={18} at={0}><span style={{ ...kaText(22, 700, C.dim), border: `2px solid ${C.dim}`, borderRadius: 6, padding: "2px 10px" }}>თბილისი · სქემა</span></L>
      <L x={720} y={340} at={4}><span style={{ ...kaText(22, 700, "#7aa6f0"), fontStyle: "italic" }}>მტკვარი</span></L>
      <L x={140} y={356} at={2} center><span style={kaText(26, 800)}>ციხე</span></L>
      <L x={825} y={140} at={tBring} center style={{ textAlign: "center" }}>
        <div style={kaText(22, 800, C.danger)}>სასჯელაღსრულების</div>
        <div style={kaText(22, 800, C.danger)}>დეპარტამენტი</div>
        <div style={{ ...kaText(20, 700, C.text), marginTop: 4 }}>იქ — მთავარი პროკურორი</div>
      </L>
      <L x={170} y={205} at={8}><span style={monoText(22, C.yellow)}>01:30 · ~10 წთ</span></L>

      {/* the alleged deal */}
      <L x={0} y={438} at={tDeal}><span style={chip(C.dim)}>მისი თქმით · შეთავაზება</span></L>
      <Appear at={tInfo} dy={20} style={{ ...card(C.accent), left: 0, top: 492, width: 430, padding: "14px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={kaText(22, 700, C.dim)}>მოითხოვენ</span>
          <span style={kaText(30, 900, C.accent)}>ინფორმაციას</span>
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
          <Appear at={tZh} dy={16} style={{ width: 186, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Photo src="zhvania.jpg" size={130} color={C.yellow} />
            <div style={{ ...kaText(22, 800, C.yellow), textAlign: "center", marginTop: 6 }}>ჟვანიას სიკვდილი</div>
          </Appear>
          <Appear at={tSa} dy={16} style={{ width: 186, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Photo src="saakashvili.jpg" size={130} color={C.yellow} />
            <div style={{ ...kaText(22, 800, C.yellow), textAlign: "center", marginTop: 6 }}>სააკაშვილის ანგარიშები</div>
          </Appear>
        </div>
        <div style={{ ...monoText(12, "rgba(160,180,220,0.7)"), marginTop: 6 }}>ფოტო: Andy Dunaway, USAF (PD); EPP, CC BY 2.0</div>
      </Appear>
      <L x={480} y={575} at={tLeave} center>
        <svg width={70} height={70} viewBox="0 0 70 70" style={{ transform: `translateX(${swap * 4}px)` }}>
          <path d="M8 24 H58 M46 12 L58 24 L46 36" fill="none" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M62 48 H12 M24 36 L12 48 L24 60" fill="none" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </L>
      <Appear at={tLeave} dy={20} style={{ ...card(C.yellow), left: 540, top: 500, width: 420, minHeight: 230 }}>
        <div style={kaText(26, 700, C.dim)}>სანაცვლოდ</div>
        <div style={kaText(40, 900, C.yellow)}>ქვეყნიდან</div>
        <div style={kaText(40, 900, C.yellow)}>წასვლა</div>
        <Appear at={tGo} dy={0} dx={30} style={{ marginTop: 10 }}>
          <svg width={120} height={44} viewBox="0 0 120 44">
            <path d="M6 30 L92 30 L110 16 M92 30 L76 40" fill="none" stroke={C.yellow} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 30 L60 8 L70 8 L60 30" fill={C.yellow} />
          </svg>
        </Appear>
      </Appear>
      <Sticker at={tDeal} text="გარიგება?" style={{ left: 700, top: 446 }} rotate={4} color={C.danger} />
    </Stage>
  );
};

/* ---------------- 04 TV: live from the courtroom ---------------- */
export const S04: React.FC = () => {
  const id = "s04";
  const f = useCurrentFrame();
  const tCourt = cue(id, "სასამართლოში");
  const tLive = cue(id, "პირდაპირ");
  const tTell = cue(id, "ყვება");
  const tGov = cue(id, "პასუხობს") - 12;
  const tLie = cue(id, "აბსოლუტური");
  // CRT power-on: a line, then the picture opens up
  const on = interpolate(f, [2, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const blink = Math.floor(f / 12) % 2 === 0 ? 1 : 0.35;
  const talk = f > tTell - 10 ? 0.5 + 0.5 * Math.sin(f / 3) : 0;
  const ticker = "პირდაპირი ტრანსლაცია · სასამართლო სხდომა · ვანო მერაბიშვილი · ";
  const tickX = -((f * 4) % 900);
  const sx = 110, sy = 50, sw = 740, sh = 440;
  return (
    <Stage>
      <L x={0} y={536} at={0}><span style={chip(C.yellow)}>17.12.2013 · 3 დღის შემდეგ</span></L>
      <Svg>
        <GFade at={0} dur={8}>
          <rect x={80} y={20} width={800} height={500} rx={28} fill="#0a1430" stroke="rgba(213,230,255,0.5)" strokeWidth={4} />
          <path d="M420 520 L400 570 L560 570 L540 520 Z" fill="#0a1430" stroke="rgba(213,230,255,0.4)" strokeWidth={3} />
        </GFade>
        <defs>
          <clipPath id="tvScreen"><rect x={sx} y={sy} width={sw} height={sh} rx={14} /></clipPath>
        </defs>
        <g clipPath="url(#tvScreen)">
          <rect x={sx} y={sy} width={sw} height={sh} fill="#050a18" />
          <g transform={`translate(0 ${(sy + sh / 2) * (1 - on)}) scale(1 ${Math.max(0.004, on)})`}>
            {/* courtroom */}
            <rect x={sx} y={sy} width={sw} height={sh} fill="#1a2b55" />
            <rect x={sx} y={sy + 300} width={sw} height={140} fill="#142247" />
            <rect x={300} y={140} width={360} height={110} fill="#3b2a1c" stroke="#6b4c30" strokeWidth={3} />
            <circle cx={480} cy={100} r={34} fill="none" stroke={C.yellow} strokeWidth={4} opacity={0.7} />
            {[360, 480, 600].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy={124} r={20} fill="#0c1430" />
                <rect x={x - 30} y={140} width={60} height={30} rx={8} fill="#0c1430" />
              </g>
            ))}
            {/* speaker at the stand */}
            <circle cx={480} cy={318} r={34} fill="#0b1226" />
            <path d="M420 440 Q422 360 480 352 Q538 360 540 440 Z" fill="#0b1226" />
            <rect x={430} y={380} width={100} height={70} fill="#4a3522" stroke="#6b4c30" strokeWidth={3} />
            {[0, 1, 2].map((k) => (
              <path key={k} d={`M${530 + k * 18} 300 q12 18 0 36`} fill="none" stroke={C.accent} strokeWidth={3} opacity={talk * (1 - k * 0.25)} />
            ))}
            {/* lower third */}
            <rect x={sx} y={sy + sh - 70} width={sw} height={70} fill="rgba(4,10,28,0.85)" />
            <rect x={sx} y={sy + sh - 70} width={200} height={70} fill={C.danger} />
          </g>
          {/* scanlines */}
          {Array.from({ length: 44 }, (_, i) => (
            <rect key={i} x={sx} y={sy + i * 10} width={sw} height={3} fill="#000" opacity={0.12} />
          ))}
        </g>
      </Svg>
      {/* text inside the screen (HTML for Georgian shaping) */}
      <div style={{ position: "absolute", left: sx, top: sy, width: sw, height: sh, overflow: "hidden", borderRadius: 14, opacity: on }}>
        <div style={{ position: "absolute", left: 0, top: sh - 70, width: 200, height: 70, display: "flex", alignItems: "center", justifyContent: "center", ...kaText(24, 900) }}>სასამართლო</div>
        <div style={{ position: "absolute", left: 214, right: 0, top: sh - 64, height: 60, overflow: "hidden" }}>
          <div style={{ whiteSpace: "nowrap", transform: `translateX(${tickX}px)`, ...kaText(28, 800) }}>
            {ticker}{ticker}{ticker}
          </div>
        </div>
      </div>
      <Appear at={tLive} dx={-20} dy={0} style={{ position: "absolute", left: sx + 20, top: sy + 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.danger, borderRadius: 8, padding: "4px 14px 6px", boxShadow: `0 0 24px ${C.danger}88` }}>
          <span style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", opacity: blink, display: "inline-block" }} />
          <span style={kaText(28, 900)}>პირდაპირი ეთერი</span>
        </div>
      </Appear>
      <Appear at={tCourt} dy={0} dx={30} style={{ position: "absolute", left: sx + sw - 196, top: sy + 16, width: 180, opacity: on }}>
        <div style={{ position: "relative", width: 180, height: 180, borderRadius: 10, overflow: "hidden", border: "3px solid #fff", boxShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>
          <Img src={staticFile("photos/merabishvili.jpg")} style={{ width: 180, height: 180, objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(4,10,28,0.85)", padding: "2px 0 4px", textAlign: "center", ...kaText(18, 800) }}>ვ. მერაბიშვილი</div>
        </div>
      </Appear>
      {/* government response */}
      <Appear at={tGov} dy={20} style={{ position: "absolute", left: 0, top: 598, display: "flex", alignItems: "center", gap: 20 }}>
        <span style={chip(C.line)}>სასჯელაღსრულების მინისტრი:</span>
      </Appear>
      <DangerBlock at={tLie} style={{ left: 0, top: 660, padding: "10px 26px 14px" }}>
        <span style={kaText(46, 900, C.danger)}>„აბსოლუტური ტყუილია“</span>
      </DangerBlock>
    </Stage>
  );
};

/* ---------------- 05 CCTV + 24 hours vs 1 month ---------------- */
export const S05: React.FC = () => {
  const id = "s05";
  const f = useCurrentFrame();
  const tRec = cue(id, "კამერების");
  const tGov = sentenceStart(id, 1);
  const tOnly = cue(id, "მხოლოდ");
  const tDel = cue(id, "იშლება");
  const tTest = cue(id, "ჩვენება");
  const tMonth = cue(id, "ერთი");
  const tKept = cue(id, "ინახებოდა");
  const swing = Math.sin(f / 30) * 12;
  const blink = Math.floor(f / 12) % 2 === 0;
  const BAR = 900;
  const day = BAR / 30;
  const fill1 = useRamp(tOnly, 10);
  const erase = interpolate(f, [tDel, tDel + 18], [0, 1], clamp);
  const fill2 = interpolate(f, [tMonth, tMonth + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const recOn = f >= tRec;
  return (
    <Stage>
      <Svg>
        {/* wall mount + camera */}
        <GFade at={0} dur={10}>
          <rect x={20} y={20} width={20} height={110} rx={4} fill="#1a2b55" stroke="rgba(213,230,255,0.4)" strokeWidth={2} />
          <line x1={40} y1={70} x2={100} y2={70} stroke="rgba(213,230,255,0.5)" strokeWidth={6} />
        </GFade>
        <g transform={`rotate(${swing} 100 70)`}>
          <GPop at={0} cx={100} cy={70}>
            <path d="M100 70 L520 -10 L520 210 Z" fill={C.accent} opacity={recOn ? 0.07 : 0.03} />
            <rect x={90} y={40} width={170} height={64} rx={14} fill="#1a2b55" stroke={C.line} strokeWidth={3} />
            <rect x={258} y={50} width={30} height={44} rx={6} fill="#0b1530" stroke={C.line} strokeWidth={3} />
            <circle cx={274} cy={72} r={11} fill={C.accent} opacity={0.6} />
            <circle cx={120} cy={56} r={6} fill={C.danger} opacity={recOn && blink ? 1 : 0.2} />
          </GPop>
        </g>
      </Svg>
      <Appear at={tRec} dx={30} dy={0} style={{ ...card(), left: 560, top: 10, width: 400, padding: "14px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: C.danger, opacity: blink ? 1 : 0.3, display: "inline-block" }} />
          <span style={monoText(30, C.text)}>REC 01:30</span>
        </div>
        <div style={{ ...kaText(28, 800), marginTop: 6 }}>ციხის კამერების ჩანაწერი</div>
        <div style={kaText(24, 700, C.yellow)}>მთავარი მტკიცებულება</div>
      </Appear>

      {/* bar 1: official version */}
      <Appear at={tGov} dy={18} style={{ position: "absolute", left: 0, top: 290, width: BAR }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={kaText(26, 700, C.dim)}>ხელისუფლების ვერსია</span>
          <span style={kaText(56, 900, erase > 0.5 ? C.danger : C.yellow)}>24 საათი</span>
        </div>
        <div style={{ position: "relative", height: 44, marginTop: 8, borderRadius: 8, background: "rgba(140,165,220,0.12)", border: "2px solid rgba(213,230,255,0.25)" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: day * fill1, borderRadius: 6, background: C.yellow, opacity: 1 - erase * 0.85, boxShadow: `0 0 18px ${C.yellow}88` }} />
          {erase > 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: day, borderRadius: 6, border: `2px dashed ${C.danger}` }} />}
        </div>
      </Appear>
      <L x={60} y={430} at={tDel}><span style={chip(C.danger)}>✕ თავისით იშლება</span></L>

      {/* bar 2: testimony */}
      <Appear at={tTest} dy={18} style={{ position: "absolute", left: 0, top: 520, width: BAR }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={kaText(26, 700, C.dim)}>ყოფ. მინისტრის მოადგილის ჩვენება</span>
          <span style={kaText(56, 900, C.accent)}>1 თვე</span>
        </div>
        <div style={{ position: "relative", height: 44, marginTop: 8, borderRadius: 8, background: "rgba(140,165,220,0.12)", border: "2px solid rgba(213,230,255,0.25)", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: BAR * fill2, background: C.accent, boxShadow: `0 0 18px ${C.accent}88` }} />
          {Array.from({ length: 29 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: (i + 1) * day, top: 0, bottom: 0, width: 2, background: "rgba(4,11,32,0.45)" }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={monoText(20)}>დღე 1</span>
          <span style={monoText(20)}>დღე 30</span>
        </div>
      </Appear>
      <Sticker at={tKept} text="30-ჯერ მეტი" style={{ left: 560, top: 690 }} rotate={-3} />
    </Stage>
  );
};
