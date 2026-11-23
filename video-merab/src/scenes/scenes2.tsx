import React from "react";
import { useCurrentFrame, interpolate, Img, staticFile, Easing } from "remotion";
import { config } from "../config";
import { cue, sentenceStart } from "../timing";
import { Appear, DrawPath, GFade, GPop, kaText, monoText, useRamp, usePop, useWave, CountUp } from "../components/anim";
import { DangerBlock, Sticker } from "../components/chrome";
import { Stage, Svg, L, chip, card } from "./scenes1";
import europe from "../../data/europe.json";

const C = config.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------------- 06 Europe map: Tbilisi → Strasbourg ---------------- */
const [TX, TY] = europe.tbilisi;
const [SX, SY] = europe.strasbourg;
const CPX = (TX + SX) / 2, CPY = Math.min(TY, SY) - 230;
const qb = (t: number) => {
  const x = (1 - t) ** 2 * TX + 2 * (1 - t) * t * CPX + t * t * SX;
  const y = (1 - t) ** 2 * TY + 2 * (1 - t) * t * CPY + t * t * SY;
  const dx = 2 * (1 - t) * (CPX - TX) + 2 * t * (SX - CPX);
  const dy = 2 * (1 - t) * (CPY - TY) + 2 * t * (SY - CPY);
  return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI };
};

export const S06: React.FC = () => {
  const id = "s06";
  const f = useCurrentFrame();
  const tCourt = cue(id, "ადამიანის");
  const tGoes = cue(id, "მიდის");
  const tLaw = sentenceStart(id, 1);
  const tRisk = cue(id, "სარისკო");
  const t18 = cue(id, "მე18");
  const tRare = cue(id, "იშვიათად");
  const fly = interpolate(f, [6, tCourt + 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const p = qb(fly);
  const arrive = usePop(tCourt + 6, 200);
  const dim = interpolate(f, [tLaw - 4, tLaw + 10], [1, 0.32], clamp);
  const lift = interpolate(f, [tLaw - 4, tLaw + 12], [0, -60], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const arcD = `M${TX} ${TY} Q${CPX} ${CPY} ${SX} ${SY}`;
  const pulse = 0.5 + 0.5 * Math.sin(f / 6);
  return (
    <Stage>
      <div style={{ position: "absolute", left: 0, top: 0, width: 960, height: europe.height, opacity: dim, transform: `translateY(${lift}px)` }}>
        <svg width={960} height={europe.height} viewBox={`0 0 960 ${europe.height}`} style={{ position: "absolute", overflow: "visible" }}>
          <defs>
            <clipPath id="euClip"><rect x={0} y={0} width={960} height={europe.height} rx={18} /></clipPath>
          </defs>
          <GFade at={0} dur={12}>
            <rect x={0} y={0} width={960} height={europe.height} rx={18} fill="rgba(6,14,38,0.6)" stroke="rgba(213,230,255,0.25)" strokeWidth={2} />
            <g clipPath="url(#euClip)">
              {europe.countries.map((c) => {
                const ge = c.name === "Georgia";
                const fr = c.name === "France";
                return (
                  <path
                    key={c.name}
                    d={c.d}
                    fill={ge ? "rgba(52,227,220,0.45)" : fr ? "rgba(247,208,70,0.16)" : "rgba(130,170,255,0.09)"}
                    stroke={ge ? C.accent : "rgba(170,195,255,0.35)"}
                    strokeWidth={ge ? 2.5 : 1}
                    strokeLinejoin="round"
                  />
                );
              })}
            </g>
          </GFade>
          {/* flight arc */}
          <path d={arcD} fill="none" stroke="rgba(247,208,70,0.3)" strokeWidth={3} strokeDasharray="3 10" strokeLinecap="round" />
          <path d={arcD} fill="none" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fly} />
          <GPop at={0} cx={TX} cy={TY}>
            <circle cx={TX} cy={TY} r={11} fill={C.accent} stroke={C.bgBottom} strokeWidth={3} />
          </GPop>
          <GPop at={tCourt + 6} cx={SX} cy={SY}>
            <circle cx={SX} cy={SY} r={14} fill={C.yellow} stroke={C.bgBottom} strokeWidth={3} />
          </GPop>
          {arrive > 0.01 && <circle cx={SX} cy={SY} r={14 + 26 * pulse} fill="none" stroke={C.yellow} strokeWidth={3} opacity={0.6 * (1 - pulse)} />}
          {fly > 0 && fly < 1 && (
            <g transform={`translate(${p.x} ${p.y}) rotate(${p.a})`}>
              <circle r={26} fill={C.yellow} opacity={0.18} />
              <path d="M22 0 L-8 -6 L-18 -24 L-24 -24 L-18 -5 L-30 -4 L-36 -12 L-40 -12 L-36 0 L-40 12 L-36 12 L-30 4 L-18 5 L-24 24 L-18 24 L-8 6 Z" fill={C.yellow} />
            </g>
          )}
        </svg>
        <div style={{ position: "absolute", left: TX - 70, top: TY + 16, ...kaText(28, 800, C.accent) }}>თბილისი</div>
        <Appear at={tCourt + 6} style={{ position: "absolute", left: SX - 80, top: SY + 22 }}>
          <span style={kaText(30, 900, C.yellow)}>სტრასბურგი</span>
        </Appear>
      </div>
      <Appear at={tCourt + 8} dy={18} style={{ ...card(C.yellow), left: 470, top: 20, width: 470, padding: "14px 22px", opacity: dim }}>
        <div style={monoText(22, C.yellow)}>ECHR</div>
        <div style={kaText(28, 900)}>ადამიანის უფლებათა</div>
        <div style={kaText(28, 900)}>ევროპული სასამართლო</div>
      </Appear>

      {/* lawyers' move: Article 18 */}
      <Sticker at={tRisk} text="სარისკო სვლა" style={{ left: 40, top: 330 }} rotate={-4} color={C.danger} />
      <Appear at={t18} dy={30} style={{ ...card(C.accent), left: 240, top: 400, width: 680, padding: "18px 30px 24px", boxShadow: `0 18px 50px rgba(2,8,24,0.7), 0 0 40px ${C.accent}33` }}>
        <div style={kaText(24, 700, C.dim)}>ევროპული კონვენცია</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
          <span style={kaText(60, 900)}>მუხლი</span>
          <CountUp at={t18} from={1} to={18} dur={14} style={{ ...kaText(110, 900, C.accent), lineHeight: 1, textShadow: `0 0 30px ${C.accent}66` }} />
        </div>
        <Appear at={tRare} dx={-16} dy={0} style={{ marginTop: 8 }}>
          <span style={chip(C.yellow)}>დარღვევა — ძალიან იშვიათად</span>
        </Appear>
      </Appear>
    </Stage>
  );
};

/* ---------------- 07 Article 18: hidden purpose ---------------- */
export const S07: React.FC = () => {
  const id = "s07";
  const f = useCurrentFrame();
  const tBan = cue(id, "კრძალავს");
  const tRestr = cue(id, "შეზღუდვას");
  const tHidden = cue(id, "ფარული");
  const tProb = cue(id, "პრობლემა");
  const tProve = cue(id, "დამტკიცება");
  const tNo = cue(id, "შეუძლებელია");
  const slide = interpolate(f, [tHidden, tHidden + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const ban = usePop(tHidden + 10, 220);
  const meter = interpolate(f, [tProve, tProve + 14], [0, 0.07], clamp) + (f > tProve + 14 ? 0.012 * Math.sin(f / 3) : 0);
  const scanX = ((f - tProb) * 9) % 760;
  return (
    <Stage>
      <L x={0} y={0} at={tBan}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={chip(C.accent)}>მუხლი 18</span>
          <span style={kaText(40, 900)}>კრძალავს:</span>
        </div>
      </L>
      {/* hidden purpose card slides out from behind */}
      <div style={{ ...card(C.danger), left: 140 + 340 * slide, top: 110 + 20 * slide, width: 440, height: 220, background: "rgba(40,12,16,0.92)", opacity: Math.min(1, slide * 2), transform: `rotate(${4 * slide}deg)` }}>
        <svg width={86} height={50} viewBox="0 0 86 50">
          <path d="M4 12 Q43 -4 82 12 Q80 40 56 44 Q46 32 43 32 Q40 32 30 44 Q6 40 4 12 Z" fill="none" stroke={C.danger} strokeWidth={4} />
          <ellipse cx={26} cy={20} rx={9} ry={5} fill={C.danger} />
          <ellipse cx={60} cy={20} rx={9} ry={5} fill={C.danger} />
        </svg>
        <div style={kaText(26, 700, C.dim)}>რეალურად</div>
        <div style={kaText(44, 900, C.danger)}>ფარული მიზანი</div>
      </div>
      {/* official restriction card */}
      <Appear at={tRestr} dy={20} style={{ ...card(C.line), left: 0, top: 110, width: 460, height: 220, background: "rgba(10,22,52,0.96)" }}>
        <svg width={50} height={50} viewBox="0 0 50 50">
          <rect x={8} y={22} width={34} height={24} rx={4} fill="none" stroke={C.line} strokeWidth={4} />
          <path d="M15 22 V15 A10 10 0 0 1 35 15 V22" fill="none" stroke={C.line} strokeWidth={4} />
        </svg>
        <div style={kaText(26, 700, C.dim)}>უფლების შეზღუდვა</div>
        <div style={kaText(40, 900)}>ოფიციალური მიზნით</div>
      </Appear>
      {ban > 0.01 && (
        <svg width={170} height={170} style={{ position: "absolute", left: 740, top: 60, transform: `scale(${ban})`, opacity: Math.min(1, ban * 1.5) }}>
          <circle cx={85} cy={85} r={70} fill="rgba(255,106,77,0.12)" stroke={C.danger} strokeWidth={10} />
          <line x1={36} y1={134} x2={134} y2={36} stroke={C.danger} strokeWidth={10} strokeLinecap="round" />
        </svg>
      )}

      {/* proof meter */}
      <Appear at={tProb} dy={20} style={{ position: "absolute", left: 0, top: 420, width: 940 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width={64} height={64} viewBox="0 0 64 64" style={{ transform: `translateX(${Math.sin(f / 8) * 6}px)` }}>
            <circle cx={26} cy={26} r={18} fill="rgba(52,227,220,0.12)" stroke={C.accent} strokeWidth={5} />
            <line x1={40} y1={40} x2={58} y2={58} stroke={C.accent} strokeWidth={7} strokeLinecap="round" />
          </svg>
          <span style={kaText(34, 900)}>ფარული მიზნის დამტკიცება</span>
        </div>
        <div style={{ position: "relative", height: 50, marginTop: 18, borderRadius: 10, background: "rgba(140,165,220,0.12)", border: "2px solid rgba(213,230,255,0.25)", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.max(0, meter) * 100}%`, background: C.yellow }} />
          <div style={{ position: "absolute", left: scanX, top: 0, bottom: 0, width: 60, background: `linear-gradient(90deg, transparent, ${C.accent}44, transparent)` }} />
        </div>
      </Appear>
      <DangerBlock at={tNo} style={{ left: 200, top: 600, textAlign: "center", width: 540 }}>
        <span style={kaText(42, 900, C.danger)}>თითქმის შეუძლებელია</span>
      </DangerBlock>
    </Stage>
  );
};

/* ---------------- 08 mosaic of facts ---------------- */
const TILES = [
  { t: "ღამე · 01:30", c: C.yellow, k: "night" },
  { t: "ქურთუკი თავზე", c: C.line, k: "" },
  { t: "პროკურორთან შეხვედრა", c: C.line, k: "" },
  { t: "ეთერში მოყოლილი", c: C.accent, k: "" },
  { t: "„ტყუილია“", c: C.danger, k: "gov" },
  { t: "24 სთ vs 1 თვე", c: C.danger, k: "gov" },
];
export const S08: React.FC = () => {
  const id = "s08";
  const f = useCurrentFrame();
  const tDirect = cue(id, "პირდაპირი");
  const tNot = cue(id, "აუცილებელი");
  const tConcl = cue(id, "დასკვნების");
  const tFacts = cue(id, "ფაქტებიდან");
  const tBeh = cue(id, "ქცევიდან");
  const tNight = cue(id, "ღამის");
  const tYes = cue(id, "დადასტურებულად");
  const strike = useRamp(tNot, 10);
  const stamp = usePop(tYes, 260);
  const hl = useRamp(tNight, 8);
  const at = (i: number) => (i < 4 ? tFacts - 8 + i * 4 : tBeh + (i - 4) * 4);
  const tw = 290, th = 110, gx = 335, gy = 140, x0 = 0, y0 = 210;
  const pos = (i: number) => ({ x: x0 + (i % 3) * gx, y: y0 + Math.floor(i / 3) * gy });
  return (
    <Stage>
      <Appear at={tDirect} dy={18} style={{ ...card(), left: 0, top: 0, width: 940, padding: "16px 26px" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <span style={kaText(40, 900, strike > 0.5 ? C.dim : C.text)}>პირდაპირი მტკიცებულება</span>
          <div style={{ position: "absolute", left: -6, top: "54%", height: 6, width: `calc(${strike * 100}% + 12px)`, background: C.danger, borderRadius: 3 }} />
        </div>
        <Appear at={tNot + 4} dx={-14} dy={0}><span style={kaText(32, 800, C.yellow)}>აუცილებელი არ არის</span></Appear>
      </Appear>
      <L x={0} y={170} at={tConcl - 4}><span style={kaText(26, 700, C.dim)}>საკმარისია ფაქტები და ხელისუფლების ქცევა:</span></L>
      <Svg>
        {TILES.map((_, i) => {
          if (i % 3 === 2) return null;
          const a = pos(i), b = pos(i + 1);
          return <DrawPath key={`h${i}`} at={at(i + 1)} dur={8} d={`M${a.x + tw} ${a.y + th / 2} L${b.x} ${b.y + th / 2}`} stroke="rgba(213,230,255,0.4)" strokeWidth={3} />;
        })}
        {[0, 1, 2].map((i) => {
          const a = pos(i), b = pos(i + 3);
          return <DrawPath key={`v${i}`} at={at(i + 3) + 2} dur={8} d={`M${a.x + tw / 2} ${a.y + th} L${b.x + tw / 2} ${b.y}`} stroke="rgba(213,230,255,0.4)" strokeWidth={3} />;
        })}
      </Svg>
      {TILES.map((tile, i) => {
        const { x, y } = pos(i);
        const lit = tile.k === "night" ? hl : 0;
        return (
          <Appear key={i} at={at(i)} dy={20} style={{ position: "absolute", left: x, top: y, width: tw, height: th, borderRadius: 14, border: `3px solid ${tile.c}`, background: lit > 0 ? `rgba(247,208,70,${0.08 + 0.2 * lit})` : "rgba(8,18,44,0.85)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: lit > 0.5 ? `0 0 30px ${C.yellow}66` : "0 10px 30px rgba(2,8,24,0.5)" }}>
            <span style={kaText(30, 900, tile.c)}>{tile.t}</span>
          </Appear>
        );
      })}
      {stamp > 0.01 && (
        <div style={{ position: "absolute", left: 140, top: 570, width: 680, textAlign: "center", transform: `rotate(-6deg) scale(${2 - stamp})`, opacity: Math.min(1, stamp * 1.4), border: `6px solid ${C.accent}`, borderRadius: 14, padding: "12px 0 16px", background: "rgba(4,24,32,0.9)", boxShadow: `0 0 40px ${C.accent}66`, ...kaText(50, 900, C.accent) }}>
          ღამის ისტორია დადასტურდა
        </div>
      )}
    </Stage>
  );
};

/* ---------------- 09 the purpose changed ---------------- */
export const S09: React.FC = () => {
  const id = "s09";
  const f = useCurrentFrame();
  const tStart = cue(id, "თავიდან");
  const tLegal = cue(id, "კანონიერი");
  const tBut = cue(id, "მაგრამ");
  const tAfter = cue(id, "შემდეგ");
  const tInfo = cue(id, "ინფორმაციის");
  const head1 = interpolate(f, [tStart - 6, tLegal + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const head2 = interpolate(f, [tAfter, tInfo + 4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const p2 = (t: number) => {
    // cubic from (470,250) bending down to (880,560)
    const x = (1 - t) ** 3 * 470 + 3 * (1 - t) ** 2 * t * 650 + 3 * (1 - t) * t * t * 760 + t ** 3 * 880;
    const y = (1 - t) ** 3 * 250 + 3 * (1 - t) ** 2 * t * 250 + 3 * (1 - t) * t * t * 380 + t ** 3 * 560;
    return [x, y];
  };
  const [hx, hy] = p2(head2);
  const fork = usePop(tBut, 240);
  return (
    <Stage>
      <L x={0} y={0} at={0}><span style={chip(C.yellow)}>სასამართლოს დასკვნა</span></L>
      <Svg>
        {/* lawful leg */}
        <path d="M60 250 L470 250" fill="none" stroke={C.accent} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - head1} />
        <GPop at={tStart - 6} cx={60} cy={250}>
          <circle cx={60} cy={250} r={20} fill={C.bgBottom} stroke={C.accent} strokeWidth={6} />
        </GPop>
        {/* the "official" straight road fades as a ghost */}
        <GFade at={tBut} dur={10}>
          <path d="M470 250 L900 250" fill="none" stroke="rgba(213,230,255,0.25)" strokeWidth={6} strokeDasharray="10 14" strokeLinecap="round" />
        </GFade>
        {/* turn toward a different purpose */}
        <path d="M470 250 C650 250 760 380 880 560" fill="none" stroke={C.danger} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - head2} />
        {head2 > 0 && head2 < 1 && <circle cx={hx} cy={hy} r={14} fill={C.danger} />}
        <GPop at={tBut} cx={470} cy={250}>
          <circle cx={470} cy={250} r={18} fill={C.bgBottom} stroke={C.yellow} strokeWidth={6} />
        </GPop>
        <GPop at={tInfo + 4} cx={880} cy={560}>
          <circle cx={880} cy={560} r={22} fill={C.danger} />
        </GPop>
        {fork > 0.01 && <circle cx={470} cy={250} r={18 + 30 * fork} fill="none" stroke={C.yellow} strokeWidth={3} opacity={Math.max(0, 1 - fork)} />}
      </Svg>
      <L x={20} y={110} at={tStart - 6}><span style={kaText(30, 800)}>დაპატიმრება</span></L>
      <L x={160} y={290} at={tLegal}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width={40} height={40} viewBox="0 0 40 40"><path d="M6 21 L16 31 L34 9" fill="none" stroke={C.accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={kaText(38, 900, C.accent)}>კანონიერი</span>
        </div>
      </L>
      <L x={470} y={150} at={tBut} center><span style={kaText(30, 900, C.yellow)}>შემდეგ</span></L>
      <L x={560} y={196} at={tBut + 4}><span style={kaText(24, 700, C.dim)}>ოფიციალური მიზანი</span></L>
      <Appear at={tInfo} dy={20} style={{ ...card(C.danger), left: 0, top: 470, width: 640, background: "rgba(40,12,16,0.9)" }}>
        <div style={kaText(26, 700, C.dim)}>მთავარი მიზანი გახდა</div>
        <div style={kaText(44, 900, C.danger)}>ინფორმაციის მიღება</div>
      </Appear>
    </Stage>
  );
};

/* ---------------- 10 vote 9:8 + outro ---------------- */
export const S10: React.FC = () => {
  const id = "s10";
  const f = useCurrentFrame();
  const t9 = cue(id, "ცხრა");
  const t8 = cue(id, "რვის");
  const tVerdict = cue(id, "გაუუქმებია");
  const tPrison = cue(id, "ციხე");
  const tOut = cue(id, "გამოიწერე");
  const out = interpolate(f, [tOut - 6, tOut + 4], [1, 0], clamp);
  const pAv = usePop(tOut, 180);
  const ring = f > tOut ? (f - tOut) * 6 : 0;
  const float = useWave(60) * 6;
  const cx = 480, cy = 330, R = 300;
  const seats = Array.from({ length: 17 }, (_, i) => {
    const a = Math.PI - (i / 16) * Math.PI;
    const yes = i < 9;
    return { x: cx + Math.cos(a) * R, y: cy - Math.sin(a) * R * 0.78, yes, at: yes ? t9 - 4 + i * 1.4 : t8 + (i - 9) * 1.4 };
  });
  const n9 = usePop(t9, 220);
  const n8 = usePop(t8, 220);
  return (
    <Stage>
      <div style={{ opacity: out, pointerEvents: out < 0.05 ? "none" : undefined }}>
        <L x={0} y={0} at={-4}><span style={monoText(22)}>დიდი პალატა · 17 მოსამართლე · 28.11.2017</span></L>
        <Svg>
          <path d={`M${cx - R - 40} ${cy + 40} L${cx + R + 40} ${cy + 40}`} stroke="rgba(213,230,255,0.25)" strokeWidth={2} />
          {seats.map((s, i) => (
            <GPop key={i} at={s.at} cx={s.x} cy={s.y}>
              <circle cx={s.x} cy={s.y} r={26} fill={s.yes ? C.accent : "rgba(111,128,168,0.55)"} stroke={s.yes ? "#bff7f3" : C.dim} strokeWidth={3} />
              <circle cx={s.x} cy={s.y - 6} r={8} fill={s.yes ? "#04202a" : "#1a2648"} />
              <path d={`M${s.x - 13} ${s.y + 16} Q${s.x} ${s.y + 1} ${s.x + 13} ${s.y + 16}`} fill={s.yes ? "#04202a" : "#1a2648"} />
            </GPop>
          ))}
        </Svg>
        <div style={{ position: "absolute", left: 0, top: 190, width: 960, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 26 }}>
          <span style={{ ...kaText(170, 900, C.accent), opacity: Math.min(1, n9 * 1.5), transform: `scale(${0.6 + 0.4 * n9})`, display: "inline-block", textShadow: `0 0 40px ${C.accent}66`, lineHeight: 1 }}>9</span>
          <span style={{ ...kaText(120, 900, C.dim), opacity: Math.min(1, n8 * 1.5), lineHeight: 1 }}>:</span>
          <span style={{ ...kaText(170, 900, C.dim), opacity: Math.min(1, n8 * 1.5), transform: `scale(${0.6 + 0.4 * n8})`, display: "inline-block", lineHeight: 1 }}>8</span>
        </div>
        <L x={60} y={392} at={t9 + 6}><span style={kaText(26, 800, C.accent)}>მუხლი 18 დაირღვა</span></L>
        <L x={900} y={392} at={t8 + 6} style={{ transform: "translateX(-100%)" }}><span style={{ ...kaText(26, 800, C.dim), whiteSpace: "nowrap" }}>არ დარღვეულა</span></L>
        <Appear at={tVerdict} dy={18} style={{ position: "absolute", left: 0, top: 470, display: "flex", gap: 14 }}>
          <span style={chip(C.line)}>განაჩენი ძალაში რჩება</span>
        </Appear>
        <Sticker at={tPrison} text="ციხე ≠ ზეწოლის იარაღი" style={{ left: 160, top: 560, ...kaText(48, 900, C.yellow) }} rotate={-3} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 30, width: 960, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, pAv * 1.4) }}>
        <div style={{ position: "relative", transform: `translateY(${float}px)` }}>
          <svg width={420} height={420} style={{ position: "absolute", left: -40, top: -40 }}>
            <circle cx={210} cy={210} r={170 + ring * 0.2} fill="none" stroke={C.accent} strokeWidth={3} opacity={Math.max(0, 0.6 - ring / 200)} />
          </svg>
          <Img src={staticFile(config.avatar)} style={{ width: 340, height: 340, borderRadius: 170, border: `6px solid ${C.accent}`, boxShadow: `0 0 60px ${C.accent}66`, transform: `scale(${0.7 + 0.3 * pAv})` }} />
        </div>
        <div style={{ ...kaText(84, 900), marginTop: 30 }}>{config.name}</div>
        {config.showHandle ? <div style={monoText(30)}>{config.handle}</div> : null}
        <div style={{ ...kaText(28, 700, C.dim), marginTop: 6 }}>{config.outroLine}</div>
        <div style={{ marginTop: 34, background: C.accent, borderRadius: 50, padding: "16px 54px 20px", ...kaText(44, 900, "#04202a"), transform: `scale(${1 + 0.04 * Math.sin(f / 7)})` }}>გამოიწერე</div>
      </div>
    </Stage>
  );
};
