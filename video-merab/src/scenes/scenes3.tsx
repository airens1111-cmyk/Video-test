import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { config } from "../config";
import { cue } from "../timing";
import { Appear, DrawPath, GPop, kaText, monoText, useRamp, usePop } from "../components/anim";
import { DangerBlock, Sticker } from "../components/chrome";
import { Stage, Svg, L, chip, card } from "./scenes1";
import europe from "../../data/europe.json";

const C = config.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Check: React.FC<{ color?: string; size?: number }> = ({ color = C.accent, size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40"><path d="M6 21 L16 31 L34 9" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Cross: React.FC<{ color?: string; size?: number }> = ({ color = C.danger, size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40"><path d="M9 9 L31 31 M31 9 L9 31" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" /></svg>
);

/* ---------------- 06 Strasbourg + why Article 18 is hard ---------------- */
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
  const t18 = cue(id, "მე18");
  const tBan = cue(id, "კრძალავს");
  const tProb = cue(id, "პრობლემა");
  const tRare = cue(id, "იშვიათად");
  const tGood = cue(id, "სახელმწიფოს");
  const tProve = cue(id, "დაამტკიცო");
  const tHidden = cue(id, "ფარული", 1);
  const fly = interpolate(f, [2, t18 - 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const p = qb(fly);
  const mapO = interpolate(f, [t18 - 6, t18 + 8, tProb - 4, tProb + 8], [1, 0.3, 0.3, 0], clamp);
  const cardY = interpolate(f, [tProb - 4, tProb + 10], [380, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const arcD = `M${TX} ${TY} Q${CPX} ${CPY} ${SX} ${SY}`;
  const lock = usePop(tProve, 220);
  return (
    <Stage>
      <div style={{ position: "absolute", left: 0, top: 0, width: 960, height: europe.height, opacity: mapO }}>
        <svg width={960} height={europe.height} viewBox={`0 0 960 ${europe.height}`} style={{ position: "absolute", overflow: "visible" }}>
          <defs><clipPath id="euClip6"><rect x={0} y={0} width={960} height={europe.height} rx={18} /></clipPath></defs>
          <rect x={0} y={0} width={960} height={europe.height} rx={18} fill="rgba(6,14,38,0.6)" stroke="rgba(213,230,255,0.25)" strokeWidth={2} />
          <g clipPath="url(#euClip6)">
            {europe.countries.map((c) => {
              const ge = c.name === "Georgia", fr = c.name === "France";
              return <path key={c.name} d={c.d} fill={ge ? "rgba(52,227,220,0.45)" : fr ? "rgba(247,208,70,0.16)" : "rgba(130,170,255,0.09)"} stroke={ge ? C.accent : "rgba(170,195,255,0.35)"} strokeWidth={ge ? 2.5 : 1} />;
            })}
          </g>
          <path d={arcD} fill="none" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fly} />
          <circle cx={TX} cy={TY} r={11} fill={C.accent} stroke={C.bgBottom} strokeWidth={3} />
          {fly > 0.98 && <circle cx={SX} cy={SY} r={14} fill={C.yellow} stroke={C.bgBottom} strokeWidth={3} />}
          {fly > 0 && fly < 1 && (
            <g transform={`translate(${p.x} ${p.y}) rotate(${p.a})`}>
              <circle r={26} fill={C.yellow} opacity={0.18} />
              <path d="M22 0 L-8 -6 L-18 -24 L-24 -24 L-18 -5 L-30 -4 L-36 -12 L-40 -12 L-36 0 L-40 12 L-36 12 L-30 4 L-18 5 L-24 24 L-18 24 L-8 6 Z" fill={C.yellow} />
            </g>
          )}
        </svg>
        <div style={{ position: "absolute", left: TX - 70, top: TY + 16, ...kaText(28, 800, C.accent) }}>თბილისი</div>
        <div style={{ position: "absolute", left: SX - 80, top: SY + 22, opacity: fly > 0.98 ? 1 : 0, ...kaText(30, 900, C.yellow) }}>სტრასბურგი</div>
        <div style={{ ...card(C.yellow), left: 470, top: 20, width: 470, padding: "12px 22px" }}>
          <div style={monoText(22, C.yellow)}>ECHR</div>
          <div style={kaText(26, 900)}>ადამიანის უფლებათა ევროპული სასამართლო</div>
        </div>
      </div>

      {/* Article 18 card: rises to the top when the problem starts */}
      <Appear at={t18} dy={30} style={{ ...card(C.accent), left: 0, top: cardY, width: 960, padding: "16px 30px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div>
            <div style={kaText(22, 700, C.dim)}>ევროპული კონვენცია</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={kaText(52, 900)}>მუხლი</span>
              <span style={{ ...kaText(96, 900, C.accent), lineHeight: 1, textShadow: `0 0 30px ${C.accent}66` }}>18</span>
            </div>
          </div>
          <Appear at={tBan} dx={20} dy={0} style={{ borderLeft: "2px solid rgba(213,230,255,0.3)", paddingLeft: 26 }}>
            <div style={kaText(28, 800)}>კრძალავს უფლების შეზღუდვას</div>
            <div style={kaText(34, 900, C.danger)}>ფარული მიზნით</div>
          </Appear>
        </div>
      </Appear>

      {/* the problem */}
      <L x={0} y={250} at={tRare}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={chip(C.yellow)}>დარღვევა — ძალიან იშვიათად</span>
        </div>
      </L>
      <Appear at={tGood} dy={20} style={{ ...card(C.line), left: 0, top: 330, width: 455, height: 250 }}>
        <svg width={56} height={56} viewBox="0 0 56 56">
          <path d="M28 4 L48 12 V28 C48 40 38 48 28 52 C18 48 8 40 8 28 V12 Z" fill="rgba(213,230,255,0.08)" stroke={C.line} strokeWidth={3.5} />
          <path d="M19 29 L26 36 L38 21" fill="none" stroke={C.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={kaText(24, 700, C.dim)}>სახელმწიფო</div>
        <div style={kaText(34, 900)}>კეთილსინდისიერია</div>
        <div style={kaText(24, 700, C.yellow)}>— ასე იგულისხმება</div>
      </Appear>
      <Appear at={tHidden} dy={20} style={{ ...card(C.danger), left: 505, top: 330, width: 455, height: 250, background: "rgba(40,12,16,0.9)" }}>
        <svg width={56} height={56} viewBox="0 0 56 56" style={{ transform: `scale(${0.6 + 0.4 * lock})`, transformOrigin: "28px 28px" }}>
          <rect x={10} y={24} width={36} height={26} rx={5} fill="rgba(255,106,77,0.15)" stroke={C.danger} strokeWidth={3.5} />
          <path d="M18 24 V17 A10 10 0 0 1 38 17 V24" fill="none" stroke={C.danger} strokeWidth={3.5} />
        </svg>
        <div style={kaText(24, 700, C.dim)}>ფარული მიზანი</div>
        <div style={kaText(34, 900, C.danger)}>პირდაპირ უნდა</div>
        <div style={kaText(34, 900, C.danger)}>დაამტკიცო</div>
      </Appear>
      <Sticker at={tProb} text="პრობლემა" style={{ left: 640, top: 250 }} rotate={4} color={C.danger} />
    </Stage>
  );
};

/* ---------------- 07 the lawyers' move: two lines + folding the night into the old complaint ---------------- */
export const S07: React.FC = () => {
  const id = "s07";
  const f = useCurrentFrame();
  const t1 = cue(id, "პირველი");
  const t2 = cue(id, "მეორე");
  const tMeet = cue(id, "შეხვედრა", 1);
  const tWeeks = cue(id, "სამი");
  const tNew = cue(id, "ახალ");
  const tOld = cue(id, "არსებული");
  const tArg = cue(id, "არგუმენტად");
  const l1 = useRamp(t1, 14);
  const l2 = useRamp(t2, 14);
  const tl = useRamp(tMeet - 4, 16);
  const brace = useRamp(tWeeks, 10);
  const merge = interpolate(f, [tOld, tArg + 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const crossNew = usePop(tNew + 10, 240);
  return (
    <Stage>
      <L x={0} y={0} at={-2}><span style={kaText(34, 900)}>ადვოკატების ორი ხაზი</span></L>
      <Svg>
        <path d="M20 110 L940 110" stroke={C.yellow} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - l1} />
        <path d="M20 190 L940 190" stroke={C.accent} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - l2} />
        {/* timeline */}
        <line x1={60} x2={60 + 840 * tl} y1={360} y2={360} stroke="rgba(213,230,255,0.45)" strokeWidth={3} />
        <GPop at={tMeet - 4} cx={150} cy={360}><circle cx={150} cy={360} r={14} fill={C.line} /></GPop>
        <GPop at={tMeet + 6} cx={650} cy={360}><circle cx={650} cy={360} r={16} fill={C.accent} /></GPop>
        <path d={`M150 330 Q150 310 170 310 L630 310 Q650 310 650 330`} fill="none" stroke={C.yellow} strokeWidth={3} opacity={brace} />
      </Svg>
      <L x={30} y={62} at={t1}><span style={{ ...kaText(30, 900, C.yellow), background: "rgba(4,11,32,0.9)", padding: "0 10px" }}>1 · პოლიტიკური დევნა</span></L>
      <L x={30} y={142} at={t2}><span style={{ ...kaText(30, 900, C.accent), background: "rgba(4,11,32,0.9)", padding: "0 10px" }}>2 · ღამის შეხვედრა</span></L>
      <L x={150} y={384} at={tMeet - 4} center style={{ textAlign: "center" }}>
        <div style={monoText(22, C.line)}>20.11.2013</div>
        <div style={kaText(24, 800)}>საჩივარი</div>
      </L>
      <L x={650} y={384} at={tMeet + 6} center style={{ textAlign: "center" }}>
        <div style={monoText(22, C.accent)}>14.12.2013</div>
        <div style={kaText(24, 800, C.accent)}>ღამის შეხვედრა</div>
      </L>
      <L x={400} y={262} at={tWeeks} center><span style={kaText(26, 900, C.yellow)}>3 კვირის შემდეგ</span></L>

      {/* choice: new complaint (no) vs argument to the existing one (yes) */}
      <Appear at={tNew} dy={20} style={{ ...card(C.dim), left: 0, top: 520, width: 360, opacity: 1 - 0.5 * merge }}>
        <div style={kaText(30, 900, C.dim)}>ახალი საჩივარი</div>
        {crossNew > 0.01 && <div style={{ position: "absolute", right: 16, top: 14, transform: `scale(${crossNew})` }}><Cross size={44} /></div>}
      </Appear>
      <Appear at={tOld} dy={20} style={{ ...card(C.accent), left: 440, top: 500, width: 520, padding: "16px 24px" }}>
        <div style={kaText(22, 700, C.dim)}>არსებული საჩივარი · მუხლი 18</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={chip(C.yellow)}>დევნა</span>
          <span style={{ ...chip(C.accent), opacity: merge, transform: `translateX(${(1 - merge) * -120}px)`, display: "inline-block" }}>+ ღამის შეხვედრა</span>
        </div>
        <div style={{ ...kaText(26, 900, C.accent), marginTop: 10, opacity: useRamp(tArg, 8) }}>ახალი არგუმენტი</div>
      </Appear>
    </Stage>
  );
};

/* ---------------- 08 the six-month objection ---------------- */
export const S08: React.FC = () => {
  const id = "s08";
  const f = useCurrentFrame();
  const tSix = cue(id, "ექვსთვიანი");
  const tGC = cue(id, "დიდი");
  const tPart = cue(id, "ნაწილია");
  const tStays = cue(id, "რჩება");
  const sweep = interpolate(f, [tSix, tSix + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lose = interpolate(f, [tGC, tGC + 10], [1, 0.45], clamp);
  const a = sweep * Math.PI * 2 * 1.08;
  return (
    <Stage>
      <Appear at={0} dy={20} style={{ ...card(C.danger), left: 0, top: 0, width: 460, height: 420, background: "rgba(40,12,16,0.85)", opacity: lose }}>
        <div style={kaText(24, 700, C.dim)}>მთავრობა</div>
        <div style={kaText(34, 900)}>„ეს ახალი</div>
        <div style={kaText(34, 900)}>საჩივარია“</div>
        <svg width={170} height={170} viewBox="0 0 170 170" style={{ marginTop: 14 }}>
          <circle cx={85} cy={85} r={70} fill="none" stroke="rgba(213,230,255,0.25)" strokeWidth={10} />
          <path d={`M85 15 A70 70 0 ${a > Math.PI ? 1 : 0} 1 ${85 + 70 * Math.sin(Math.min(a, Math.PI * 1.999))} ${85 - 70 * Math.cos(Math.min(a, Math.PI * 1.999))}`} fill="none" stroke={C.danger} strokeWidth={10} strokeLinecap="round" opacity={sweep > 0 ? 1 : 0} />
          <text x={85} y={98} textAnchor="middle" fill={C.danger} fontFamily={config.fonts.ka} fontWeight={900} fontSize={30}>6 თვე</text>
        </svg>
        <Appear at={tSix + 14} dy={0} dx={-16} style={{ position: "absolute", left: 236, top: 250 }}>
          <span style={kaText(30, 900, C.danger)}>ვადა</span><br /><span style={kaText(30, 900, C.danger)}>გასულია</span>
        </Appear>
      </Appear>
      <Appear at={tGC} dy={20} style={{ ...card(C.accent), left: 500, top: 0, width: 460, height: 420 }}>
        <div style={kaText(24, 700, C.dim)}>დიდი პალატა</div>
        <div style={kaText(34, 900, C.accent)}>„ეს იმავე</div>
        <div style={kaText(34, 900, C.accent)}>საჩივრის ნაწილია“</div>
        <Appear at={tPart} dy={10} style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <Check size={56} />
          <span style={kaText(30, 900)}>ადვოკატები მართლები არიან</span>
        </Appear>
        <div style={{ ...monoText(18), marginTop: 18 }}>§§ 249–251</div>
      </Appear>
      <Sticker at={tStays} text="ღამის ისტორია საქმეში რჩება" style={{ left: 120, top: 520, ...kaText(44, 900, C.yellow) }} rotate={-3} />
    </Stage>
  );
};

/* ---------------- 09 Chamber 2016 → Grand Chamber; the political line fails ---------------- */
export const S09: React.FC = () => {
  const id = "s09";
  const f = useCurrentFrame();
  const tFound = cue(id, "დაადგინა");
  const tGov = cue(id, "მთავრობამ");
  const tMove = cue(id, "გადაიტანა");
  const tPol = cue(id, "პოლიტიკური");
  const tFail = cue(id, "ჩავარდა");
  const up = interpolate(f, [tGov, tMove + 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const lines = useRamp(tPol - 6, 12);
  const brk = interpolate(f, [tFail, tFail + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <Stage>
      <Appear at={0} dy={20} style={{ ...card(C.line), left: 0, top: 120, width: 420 }}>
        <div style={monoText(22, C.line)}>14.06.2016</div>
        <div style={kaText(32, 900)}>პალატა</div>
        <div style={kaText(22, 700, C.dim)}>7 მოსამართლე</div>
        <Appear at={tFound} dx={-12} dy={0} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <Check size={36} />
          <span style={kaText(26, 900, C.accent)}>მუხლი 18 დაირღვა</span>
        </Appear>
      </Appear>
      <Svg>
        <path d="M430 230 C520 230 520 70 600 70" fill="none" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - up} />
        {up > 0.95 && <path d="M600 70 l-16 -10 m16 10 l-16 10" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" fill="none" />}
      </Svg>
      <L x={470} y={250} at={tGov}><span style={kaText(22, 800, C.yellow)}>მთავრობის მოთხოვნა</span></L>
      <Appear at={tMove} dy={20} style={{ ...card(C.yellow), left: 610, top: 0, width: 350 }}>
        <div style={kaText(32, 900, C.yellow)}>დიდი პალატა</div>
        <div style={kaText(22, 700, C.dim)}>17 მოსამართლე</div>
      </Appear>

      {/* the two lines */}
      <div style={{ position: "absolute", left: 0, top: 420, width: 960, opacity: lines }}>
        <svg width={960} height={260} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d="M20 60 L440 60" stroke={C.yellow} strokeWidth={10} strokeLinecap="round" />
          <path d={`M500 ${60 + 40 * brk} L940 ${60 + 120 * brk}`} stroke={C.yellow} strokeWidth={10} strokeLinecap="round" opacity={1 - 0.6 * brk} />
          <path d="M20 190 L940 190" stroke={C.accent} strokeWidth={10} strokeLinecap="round" />
          {brk > 0.01 && <g transform={`translate(470 60) scale(${brk})`}><path d="M-18 -18 L18 18 M18 -18 L-18 18" stroke={C.danger} strokeWidth={8} strokeLinecap="round" /></g>}
          <path d="M940 190 l-18 -12 m18 12 l-18 12" stroke={C.accent} strokeWidth={8} strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ position: "absolute", left: 30, top: 0, ...kaText(28, 900, C.yellow), background: "rgba(4,11,32,0.9)", padding: "0 10px" }}>პოლიტიკური დევნა</div>
        <div style={{ position: "absolute", left: 30, top: 130, ...kaText(28, 900, C.accent), background: "rgba(4,11,32,0.9)", padding: "0 10px" }}>ღამის შეხვედრა</div>
      </div>
      <L x={600} y={410} at={tFail}><span style={chip(C.danger)}>ვერ დამტკიცდა · § 329</span></L>
    </Stage>
  );
};

/* ---------------- 10 the new rule: two purposes, the predominant one counts, it can change ---------------- */
export const S10: React.FC = () => {
  const id = "s10";
  const f = useCurrentFrame();
  const tRule = cue(id, "ახალი");
  const tLegal = cue(id, "კანონიერი");
  const tHidden = cue(id, "ფარული");
  const tMain = cue(id, "მთავარი");
  const tTime = cue(id, "დროთა");
  const grow = interpolate(f, [tMain - 6, tMain + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const legalW = 380 - 140 * grow;
  const hiddenW = 200 + 260 * grow;
  const shift = useRamp(tTime, 24);
  return (
    <Stage>
      <Sticker at={tRule} text="ახალი წესი · § 305" style={{ left: 0, top: 0 }} rotate={-2} />
      <L x={0} y={110} at={tLegal - 10}><span style={kaText(30, 900)}>ერთი დაპატიმრება — ორი მიზანი:</span></L>
      <div style={{ position: "absolute", left: 0, top: 180, width: 960 }}>
        <Appear at={tLegal} dx={-20} dy={0} style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 230, ...kaText(28, 900, C.accent) }}>კანონიერი</div>
          <div style={{ height: 54, width: legalW, borderRadius: 10, background: C.accent, boxShadow: `0 0 18px ${C.accent}66` }} />
        </Appear>
        <Appear at={tHidden} dx={-20} dy={0} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 22 }}>
          <div style={{ width: 230, ...kaText(28, 900, C.danger) }}>ფარული</div>
          <div style={{ height: 54, width: hiddenW, borderRadius: 10, background: C.danger, boxShadow: `0 0 18px ${C.danger}66` }} />
        </Appear>
      </div>
      <DangerBlock at={tMain + 8} style={{ left: 0, top: 360, width: 520 }}>
        <span style={kaText(32, 900, C.danger)}>ფარული მთავარია → დარღვევა</span>
      </DangerBlock>
      {/* purpose over time */}
      <Appear at={tTime - 4} dy={20} style={{ position: "absolute", left: 0, top: 540, width: 960 }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...kaText(24, 800, C.dim) }}>
          <span>დაპატიმრება</span><span>დრო →</span>
        </div>
        <div style={{ position: "relative", height: 60, marginTop: 10, borderRadius: 12, overflow: "hidden", background: C.accent }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${55 * shift}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.danger} 35%)` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={kaText(24, 900, C.accent)}>მთავარი: გამოძიება</span>
          <span style={{ ...kaText(24, 900, C.danger), opacity: shift }}>მთავარი: სხვა მიზანი</span>
        </div>
      </Appear>
    </Stage>
  );
};

/* ---------------- 11 evidence: the mosaic that convinced the Court ---------------- */
export const S11: React.FC = () => {
  const id = "s11";
  const f = useCurrentFrame();
  const tNot = cue(id, "აღარ");
  const tStaff = cue(id, "დეპარტამენტის");
  const tFired = cue(id, "გაათავისუფლეს");
  const tLate = cue(id, "პროკურორს");
  const tYears = cue(id, "სამი");
  const tAlibi = cue(id, "პროკურორის");
  const tLater = cue(id, "მოგვიანებით");
  const tMeters = cue(id, "რამდენიმე");
  const tYes = cue(id, "დადასტურებულად");
  const strike = useRamp(tNot, 10);
  const stamp = usePop(tYes, 260);
  const logBar = useRamp(tAlibi + 4, 14);
  const meetBar = useRamp(tLater, 12);
  // alibi timeline 00:50 → 02:00 mapped to 0..860 px
  const X = (hhmm: number) => ((hhmm - 50) / 70) * 860;
  return (
    <Stage>
      <div style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ position: "relative" }}>
          <span style={kaText(34, 900, strike > 0.5 ? C.dim : C.text)}>პირდაპირი მტკიცებულება</span>
          <div style={{ position: "absolute", left: -6, top: "54%", height: 6, width: `calc(${strike * 100}% + 12px)`, background: C.danger, borderRadius: 3 }} />
        </div>
        <Appear at={tNot + 4} dx={-14} dy={0}><span style={chip(C.yellow)}>აღარ არის აუცილებელი</span></Appear>
      </div>
      {/* fact 1 */}
      <Appear at={tStaff} dy={18} style={{ ...card(C.line), left: 0, top: 70, width: 460, height: 210, padding: "12px 20px" }}>
        <div style={monoText(20, C.line)}>2014 · მაისი · § 338</div>
        <div style={kaText(24, 900)}>დეპარტამენტის თანამშრომელი</div>
        <div style={kaText(22, 800, C.dim)}>ჟურნალისტებს: „შეხვედრა იყო“</div>
        <Appear at={tFired} dx={-12} dy={0} style={{ marginTop: 6 }}><span style={chip(C.danger)}>→ გაათავისუფლეს</span></Appear>
      </Appear>
      {/* fact 2 */}
      <Appear at={tLate} dy={18} style={{ ...card(C.line), left: 500, top: 70, width: 460, height: 210, padding: "12px 20px" }}>
        <div style={monoText(20, C.line)}>§ 347</div>
        <div style={kaText(24, 900)}>პროკურორი და დეპ. უფროსი</div>
        <div style={kaText(22, 800, C.dim)}>ჩვენება მისცეს</div>
        <Appear at={tYears} dx={-12} dy={0} style={{ marginTop: 6 }}><span style={chip(C.yellow)}>~3 წლის შემდეგ · 2016</span></Appear>
      </Appear>
      {/* fact 3: the alibi */}
      <Appear at={tAlibi} dy={18} style={{ ...card(C.accent), left: 0, top: 300, width: 960, height: 270, padding: "14px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={kaText(28, 900)}>პროკურორის ალიბი</span>
          <span style={monoText(20, C.line)}>§ 348</span>
        </div>
        <div style={{ position: "relative", height: 165, marginTop: 6 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 70, height: 3, background: "rgba(213,230,255,0.3)" }} />
          {[["01:00", 60], ["01:25", 85], ["01:45", 105], ["01:55", 115]].map(([lab, m], i) => (
            <div key={i} style={{ position: "absolute", left: X(m as number) - 30, top: 96, width: 60, textAlign: "center", ...monoText(18, C.line) }}>{lab}</div>
          ))}
          <div style={{ position: "absolute", left: X(60), top: 50, height: 40, width: (X(85) - X(60)) * logBar, borderRadius: 8, background: C.line, opacity: 0.85 }} />
          <div style={{ position: "absolute", left: X(60), top: 10, ...kaText(20, 800, C.line), opacity: logBar }}>სისტემაში შესვლა</div>
          <div style={{ position: "absolute", left: X(105), top: 50, height: 40, width: (X(115) - X(105)) * meetBar, borderRadius: 8, background: C.danger }} />
          <div style={{ position: "absolute", left: X(100), top: 10, ...kaText(20, 800, C.danger), opacity: meetBar }}>შეხვედრა</div>
          <Appear at={tMeters} dy={10} style={{ position: "absolute", left: 0, top: 128 }}>
            <span style={kaText(22, 800, C.yellow)}>ოფისიდან დეპარტამენტამდე — რამდენიმე ასეული მეტრი</span>
          </Appear>
        </div>
      </Appear>
      {stamp > 0.01 && (
        <div style={{ position: "absolute", left: 120, top: 610, width: 720, textAlign: "center", transform: `rotate(-4deg) scale(${2 - stamp})`, opacity: Math.min(1, stamp * 1.4), border: `6px solid ${C.accent}`, borderRadius: 14, padding: "10px 0 14px", background: "rgba(4,24,32,0.92)", boxShadow: `0 0 40px ${C.accent}66`, ...kaText(46, 900, C.accent) }}>
          ღამის ისტორია დადასტურდა · § 350
        </div>
      )}
    </Stage>
  );
};
