import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile } from "remotion";
import { config } from "../config";
import { cue } from "../timing";
import { Appear, DrawPath, GPop, GFade, kaText, monoText, useRamp, usePop, useWave, seeded, CountUp } from "../components/anim";
import { DangerBlock, Sticker } from "../components/chrome";
import { Stage, Svg, L, chip, card } from "../components/stage";

const C = config.colors;
const MOULD = "#9BD56A";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const PhotoCard: React.FC<{ src: string; x: number; y: number; w: number; h: number; at: number; credit: string; pos?: string }> = ({ src, x, y, w, h, at, credit, pos = "50% 30%" }) => (
  <Appear at={at} dy={20} style={{ position: "absolute", left: x, top: y, width: w }}>
    <Img src={staticFile(`photos/${src}`)} style={{ width: w, height: h, objectFit: "cover", objectPosition: pos, borderRadius: 16, border: `4px solid ${C.accent}`, boxShadow: `0 18px 50px rgba(2,8,24,0.7), 0 0 30px ${C.accent}33`, display: "block" }} />
    <div style={{ ...monoText(13, "rgba(160,180,220,0.75)"), marginTop: 4 }}>{credit}</div>
  </Appear>
);

/** Petri dish with bacteria colonies; mould grows at (mx, my); colonies near it vanish with `clear`. */
const Dish: React.FC<{ cx: number; cy: number; r: number; mould: number; clear: number }> = ({ cx, cy, r, mould, clear }) => {
  const mx = cx - r * 0.25, my = cy - r * 0.15;
  const zone = r * 0.55 * clear + r * 0.18 * mould;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 10} fill="rgba(213,230,255,0.06)" stroke="rgba(213,230,255,0.6)" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill="rgba(247,208,70,0.12)" />
      {Array.from({ length: 70 }, (_, i) => {
        const a = seeded(i) * Math.PI * 2, d = Math.sqrt(seeded(i + 50)) * r * 0.92;
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        const dist = Math.hypot(x - mx, y - my);
        const gone = dist < zone ? 1 : 0;
        return <circle key={i} cx={x} cy={y} r={7 + 5 * seeded(i + 9)} fill="#F2E6A0" opacity={0.9 * (1 - gone)} />;
      })}
      {clear > 0 && <circle cx={mx} cy={my} r={zone} fill="none" stroke={C.accent} strokeWidth={3} strokeDasharray="8 8" opacity={clear} />}
      {mould > 0 && (
        <g transform={`translate(${mx} ${my}) scale(${mould})`}>
          {Array.from({ length: 9 }, (_, k) => {
            const a = (k / 9) * Math.PI * 2;
            return <circle key={k} cx={Math.cos(a) * r * 0.11} cy={Math.sin(a) * r * 0.11} r={r * 0.1} fill={MOULD} opacity={0.85} />;
          })}
          <circle r={r * 0.12} fill="#6FAF45" />
          <circle r={r * 0.05} fill="#EAF7DC" />
        </g>
      )}
    </g>
  );
};

/* ---------------- 01 the holiday ---------------- */
export const S01: React.FC = () => {
  const id = "s01";
  const f = useCurrentFrame();
  const tHoliday = cue(id, "შვებულებაში");
  const tDishes = cue(id, "ჯამებს");
  const tCare = cue(id, "უყურადღებობამ");
  const tMill = cue(id, "მილიონობით");
  const leave = interpolate(f, [tHoliday, tHoliday + 24], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <Stage>
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <CountUp at={-6} from={1900} to={1928} dur={16} style={{ ...kaText(150, 900, C.yellow), letterSpacing: -4, textShadow: `0 0 30px ${C.yellow}55` }} />
      </div>
      <L x={0} y={190} at={2}><span style={kaText(28, 800, C.dim)}>ლონდონი · სენტ-მერის საავადმყოფო</span></L>
      <Svg>
        {/* bench */}
        <rect x={40} y={560} width={880} height={26} rx={6} fill="#6b4c30" />
        <rect x={80} y={586} width={22} height={140} fill="#4a3522" />
        <rect x={860} y={586} width={22} height={140} fill="#4a3522" />
        {/* stacked dishes */}
        {Array.from({ length: 6 }, (_, k) => (
          <GPop key={k} at={tDishes - 6 + k * 2} cx={260 + (k % 3) * 150} cy={540 - Math.floor(k / 3) * 34}>
            <ellipse cx={260 + (k % 3) * 150} cy={540 - Math.floor(k / 3) * 34} rx={66} ry={16} fill="rgba(213,230,255,0.12)" stroke="rgba(213,230,255,0.6)" strokeWidth={3} />
            {k === 4 && <circle cx={260 + 150 - 18} cy={506} r={8} fill={MOULD} />}
          </GPop>
        ))}
        {/* suitcase walks off */}
        <g transform={`translate(${720 + leave * 360} 0)`} opacity={useRamp(tHoliday - 6, 6)}>
          <rect x={0} y={330} width={150} height={110} rx={14} fill="#8a5a2b" stroke={C.line} strokeWidth={3} />
          <path d="M45 330 V308 H105 V330" fill="none" stroke={C.line} strokeWidth={6} />
          <rect x={0} y={372} width={150} height={10} fill="#6b4320" />
        </g>
      </Svg>
      <L x={640} y={262} at={tHoliday}><span style={chip(C.yellow)}>შვებულებაში →</span></L>
      <L x={180} y={600} at={tDishes}><span style={chip(C.danger)}>ჩაურეცხავი ჯამები</span></L>
      <Sticker at={tCare} text="უყურადღებობა," style={{ left: 40, top: 300, ...kaText(40, 900, C.yellow) }} rotate={-3} />
      <Sticker at={tMill} text="რომელმაც მილიონები გადაარჩინა" style={{ left: 40, top: 390, ...kaText(32, 900, C.accent) }} rotate={2} color={C.accent} />
    </Stage>
  );
};

/* ---------------- 02 the strange dish ---------------- */
export const S02: React.FC = () => {
  const id = "s02";
  const tFleming = cue(id, "ფლემინგი");
  const tMould = cue(id, "ობს");
  const tGone = cue(id, "გამქრალია");
  const mould = useRamp(tMould - 4, 16);
  const clear = useRamp(tGone - 6, 20);
  return (
    <Stage>
      <PhotoCard src="fleming_lab.jpg" x={0} y={0} w={380} h={540} at={tFleming - 6} credit="ფოტო: IWM TR 1468 (PD)" pos="20% 20%" />
      <L x={0} y={575} at={tFleming}><span style={kaText(34, 900)}>ალექსანდრე ფლემინგი</span></L>
      <Svg><Dish cx={690} cy={300} r={250} mould={mould} clear={clear} /></Svg>
      <L x={600} y={600} at={tMould}><span style={chip(MOULD)}>ობი</span></L>
      <L x={720} y={650} at={tGone} center><span style={chip(C.accent)}>ბაქტერიები გაქრა</span></L>
    </Stage>
  );
};

/* ---------------- 03 a name, but no medicine ---------------- */
export const S03: React.FC = () => {
  const id = "s03";
  const tPen = cue(id, "პენიცილიუმი");
  const tName = cue(id, "პენიცილინს");
  const tSep = cue(id, "გამოყოფა");
  const tKeep = cue(id, "შენახვა");
  const tTen = cue(id, "ათი");
  const tLost = cue(id, "დავიწყებულია");
  const f = useCurrentFrame();
  const year = Math.round(interpolate(f, [tTen - 4, tTen + 20], [1929, 1938], clamp));
  return (
    <Stage>
      <L x={0} y={10} at={tPen}><span style={{ ...monoText(44, MOULD), fontStyle: "italic" }}>Penicillium</span></L>
      <L x={380} y={14} at={tName - 4}><span style={kaText(40, 900, C.yellow)}>→</span></L>
      <L x={450} y={0} at={tName}><span style={{ ...kaText(56, 900, C.accent), textShadow: `0 0 24px ${C.accent}66` }}>პენიცილინი</span></L>
      <L x={0} y={100} at={tName + 6}><span style={monoText(20)}>Fleming, Br. J. Exp. Pathol., 1929</span></L>
      <div style={{ position: "absolute", left: 0, top: 190, display: "flex", gap: 20 }}>
        <Appear at={tSep}><span style={{ ...chip(C.danger), fontSize: 34 }}>✕ გამოყოფა</span></Appear>
        <Appear at={tKeep}><span style={{ ...chip(C.danger), fontSize: 34 }}>✕ შენახვა</span></Appear>
      </div>
      <Appear at={tTen - 4} dy={20} style={{ ...card(C.dim), left: 220, top: 330, width: 520, textAlign: "center", padding: "16px 0 22px" }}>
        <div style={kaText(26, 700, C.dim)}>კალენდარი</div>
        <div style={{ ...kaText(130, 900, year >= 1938 ? C.dim : C.text), lineHeight: 1.05 }}>{year}</div>
      </Appear>
      <Sticker at={tLost} text="თითქმის 10 წელი — დავიწყებული" style={{ left: 120, top: 640 }} rotate={-3} color={C.danger} />
    </Stage>
  );
};

/* ---------------- 04 the Oxford team ---------------- */
const Person: React.FC<{ name: string; at: number; x: number }> = ({ name, at, x }) => (
  <Appear at={at} dy={20} style={{ ...card(C.accent), left: x, top: 90, width: 430, display: "flex", alignItems: "center", gap: 18 }}>
    <svg width={80} height={80} viewBox="0 0 80 80">
      <circle cx={40} cy={26} r={17} fill="rgba(52,227,220,0.15)" stroke={C.accent} strokeWidth={3} />
      <path d="M10 78 C10 50 70 50 70 78" fill="rgba(52,227,220,0.15)" stroke={C.accent} strokeWidth={3} />
    </svg>
    <span style={kaText(32, 900)}>{name}</span>
  </Appear>
);
export const S04: React.FC = () => {
  const id = "s04";
  const f = useCurrentFrame();
  const tFlorey = cue(id, "ფლორი");
  const tChain = cue(id, "ჩეინი");
  const tPure = cue(id, "მიღებაზე");
  const drip = interpolate(f, [tPure - 4, tPure + 30], [0, 1], clamp);
  const fill = useRamp(tPure + 10, 24);
  return (
    <Stage>
      <L x={0} y={0} at={-4}><span style={kaText(40, 900, C.yellow)}>1939 · ოქსფორდი</span></L>
      <Person name="ჰოვარდ ფლორი" at={tFlorey} x={0} />
      <Person name="ერნსტ ჩეინი" at={tChain} x={530} />
      <Svg>
        <GFade at={tPure - 8} dur={10}>
          {/* flask */}
          <path d="M200 340 L200 420 L120 600 Q110 630 140 630 L340 630 Q370 630 360 600 L280 420 L280 340 Z" fill="rgba(247,208,70,0.15)" stroke={C.line} strokeWidth={4} />
          <path d="M140 580 L340 580 L355 610 Q360 625 340 625 L140 625 Q120 625 125 610 Z" fill="#8a6a2a" opacity={0.7} />
          {/* tube to funnel */}
          <path d="M280 360 C420 300 460 300 520 380" fill="none" stroke={C.line} strokeWidth={4} />
          <path d="M470 380 L570 380 L530 450 L530 500 L510 500 L510 450 Z" fill="rgba(213,230,255,0.1)" stroke={C.line} strokeWidth={4} />
          {/* vial */}
          <rect x={690} y={470} width={90} height={170} rx={14} fill="rgba(213,230,255,0.08)" stroke={C.line} strokeWidth={4} />
          <rect x={696} y={634 - 150 * fill} width={78} height={150 * fill} rx={10} fill={C.yellow} opacity={0.9} />
        </GFade>
        {drip > 0 && drip < 1 && <circle cx={520} cy={510 + ((drip * 4) % 1) * 60} r={9} fill={C.yellow} />}
        <DrawPath at={tPure + 4} dur={12} d="M560 560 L670 560" stroke={C.yellow} strokeWidth={5} />
      </Svg>
      <L x={735} y={660} at={tPure + 10} center><span style={chip(C.yellow)}>პენიცილინის მიღება</span></L>
    </Stage>
  );
};

/* ---------------- 05 the first patient ---------------- */
export const S05: React.FC = () => {
  const id = "s05";
  const f = useCurrentFrame();
  const tBetter = cue(id, "უკეთ");
  const tUrine = cue(id, "შარდიდანაც");
  const tOut = cue(id, "ჰყოფნის");
  const tDied = cue(id, "იღუპება");
  const line = interpolate(f, [tBetter - 10, tDied + 14], [0, 1], clamp);
  const supply = interpolate(f, [tBetter, tOut + 16], [1, 0], clamp);
  const n = 60;
  const health = (t: number) => (t < 0.45 ? 0.2 + 0.6 * Math.min(1, t / 0.4) : t < 0.75 ? 0.8 : 0.8 - 0.75 * Math.min(1, (t - 0.75) / 0.2));
  const d = Array.from({ length: Math.floor(n * line) + 1 }, (_, i) => `${i ? "L" : "M"}${(60 + (i / n) * 520).toFixed(1)} ${(500 - health(i / n) * 300).toFixed(1)}`).join(" ");
  const spin = f * 3;
  return (
    <Stage>
      <L x={0} y={0} at={-4}><span style={kaText(40, 900, C.yellow)}>1941 · ერთ-ერთი პირველი პაციენტი</span></L>
      <L x={0} y={60} at={0}><span style={monoText(20)}>Albert Alexander, პოლიციელი</span></L>
      <Svg>
        <path d="M60 180 L60 520 L600 520" fill="none" stroke="rgba(213,230,255,0.5)" strokeWidth={2.5} />
        <path d={d} fill="none" stroke={line > 0.78 ? C.danger : C.accent} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        {/* supply bottle */}
        <rect x={720} y={180} width={140} height={300} rx={20} fill="rgba(213,230,255,0.06)" stroke={C.line} strokeWidth={4} />
        <rect x={728} y={472 - 284 * supply} width={124} height={284 * supply} rx={14} fill={C.yellow} opacity={0.85} />
        {f >= tUrine && f < tOut + 10 && (
          <g transform={`rotate(${spin} 790 600)`}>
            <path d="M790 545 A55 55 0 1 1 735 600" fill="none" stroke={C.yellow} strokeWidth={6} />
            <path d="M735 600 l-12 -16 m12 16 l16 -10" stroke={C.yellow} strokeWidth={6} strokeLinecap="round" fill="none" />
          </g>
        )}
      </Svg>
      <L x={80} y={140} at={tBetter}><span style={chip(C.accent)}>უკეთ ხდება</span></L>
      <L x={790} y={130} at={0} center><span style={kaText(24, 800, C.dim)}>მარაგი</span></L>
      <L x={600} y={680} at={tUrine}><span style={chip(C.yellow)}>შარდიდან აგროვებენ</span></L>
      <DangerBlock at={tDied} style={{ left: 120, top: 560 }}>
        <span style={kaText(32, 900, C.danger)}>წამალი არ ეყო</span>
      </DangerBlock>
    </Stage>
  );
};

/* ---------------- 06 the mouldy melon ---------------- */
export const S06: React.FC = () => {
  const id = "s06";
  const f = useCurrentFrame();
  const tMarket = cue(id, "ბაზარზე");
  const tMelon = cue(id, "ნესვმა");
  const tMore = cue(id, "ბევრად");
  const t44 = cue(id, "1944");
  const tMill = cue(id, "მასობრივად");
  const flow = (f * 6) % 120;
  return (
    <Stage>
      <L x={0} y={0} at={tMarket}><span style={chip(C.yellow)}>პეორია, აშშ · 1943</span></L>
      <Svg>
        <GPop at={tMelon - 4} cx={200} cy={320}>
          <ellipse cx={200} cy={320} rx={170} ry={130} fill="#E3B25A" stroke="#a8762a" strokeWidth={5} />
          {Array.from({ length: 7 }, (_, k) => <path key={k} d={`M${70 + k * 40} 220 Q${60 + k * 40} 320 ${70 + k * 40} 420`} fill="none" stroke="#c99a45" strokeWidth={3} />)}
          {[[150, 270, 46], [240, 330, 38], [190, 380, 28], [120, 340, 22]].map(([x, y, r], k) => (
            <circle key={k} cx={x} cy={y} r={r} fill={MOULD} opacity={0.85} />
          ))}
        </GPop>
        <DrawPath at={tMore} dur={12} d="M400 320 L520 320" stroke={C.yellow} strokeWidth={6} />
        <GPop at={tMore + 10} cx={520} cy={320}><path d="M520 320 L500 306 M520 320 L500 334" stroke={C.yellow} strokeWidth={6} strokeLinecap="round" /></GPop>
        {/* factory tanks */}
        <GFade at={tMore + 6} dur={10}>
          {[0, 1, 2].map((k) => (
            <g key={k}>
              <rect x={560 + k * 130} y={200} width={100} height={250} rx={40} fill="rgba(213,230,255,0.1)" stroke={C.line} strokeWidth={4} />
              <rect x={566 + k * 130} y={300} width={88} height={144} rx={30} fill={C.yellow} opacity={0.75} />
            </g>
          ))}
          <path d="M560 480 L920 480" stroke={C.line} strokeWidth={5} />
          {Array.from({ length: 4 }, (_, k) => <circle key={k} cx={560 + ((flow + k * 90) % 360)} cy={480} r={9} fill={C.yellow} />)}
        </GFade>
      </Svg>
      <L x={200} y={470} at={tMelon} center><span style={chip(MOULD)}>„დამპალი“ ნესვი</span></L>
      <L x={740} y={140} at={tMore} center><span style={chip(C.accent)}>ბევრად მეტი პენიცილინი</span></L>
      <Appear at={t44} dy={20} style={{ ...card(C.yellow), left: 160, top: 560, width: 640, textAlign: "center" }}>
        <div style={kaText(28, 800, C.dim)}>1944 წლისთვის</div>
        <Appear at={tMill} dy={0}><div style={kaText(48, 900, C.yellow)}>მასობრივი წარმოება</div></Appear>
      </Appear>
    </Stage>
  );
};

/* ---------------- 07 Nobel, the warning, outro ---------------- */
export const S07: React.FC = () => {
  const id = "s07";
  const f = useCurrentFrame();
  const tNobel = cue(id, "ნობელის");
  const tWarn = cue(id, "აფრთხილებს");
  const tAdapt = cue(id, "შეეჩვევიან");
  const tDanger = cue(id, "საფრთხეა");
  const tOut = cue(id, "გამოიწერე");
  const out = interpolate(f, [tOut - 6, tOut + 4], [1, 0], clamp);
  const pAv = usePop(tOut, 180);
  const float = useWave(60) * 6;
  const shield = usePop(tAdapt, 220);
  return (
    <Stage>
      <div style={{ opacity: out }}>
        <PhotoCard src="fleming_1945.jpg" x={0} y={0} w={300} h={300} at={-4} credit="ფოტო: Nobel Foundation, 1945 (PD)" />
        <Appear at={tNobel - 6} dy={20} style={{ ...card(C.yellow), left: 340, top: 0, width: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width={90} height={90} viewBox="0 0 90 90">
              <circle cx={45} cy={45} r={40} fill="#E9B949" stroke="#b8861f" strokeWidth={5} />
              <circle cx={45} cy={45} r={28} fill="none" stroke="#b8861f" strokeWidth={3} />
            </svg>
            <div>
              <div style={kaText(26, 700, C.dim)}>ნობელის პრემია · 1945</div>
              <div style={kaText(30, 900)}>ფლემინგი · ფლორი · ჩეინი</div>
            </div>
          </div>
        </Appear>
        <Appear at={tWarn} dy={20} style={{ ...card(C.danger), left: 0, top: 380, width: 960, background: "rgba(40,12,16,0.85)", display: "flex", alignItems: "center", gap: 30 }}>
          <svg width={180} height={180} viewBox="0 0 180 180">
            <ellipse cx={80} cy={95} rx={58} ry={36} fill="#F2E6A0" opacity={0.9} />
            {[0, 1, 2, 3, 4].map((k) => <line key={k} x1={30 + k * 25} y1={60} x2={24 + k * 25} y2={44} stroke="#F2E6A0" strokeWidth={4} />)}
            {shield > 0.01 && (
              <g transform={`translate(130 95) scale(${shield})`}>
                <path d="M0 -44 L34 -30 V2 C34 26 16 40 0 48 C-16 40 -34 26 -34 2 V-30 Z" fill="rgba(255,106,77,0.3)" stroke={C.danger} strokeWidth={5} />
              </g>
            )}
          </svg>
          <div>
            <div style={kaText(26, 700, C.dim)}>ფლემინგის გაფრთხილება</div>
            <div style={kaText(36, 900, C.danger)}>ბაქტერიები ანტიბიოტიკს</div>
            <div style={kaText(36, 900, C.danger)}>შეეჩვევიან</div>
          </div>
        </Appear>
        <Sticker at={tDanger} text="დღეს — ერთ-ერთი მთავარი საფრთხე" style={{ left: 120, top: 640 }} rotate={-3} />
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
