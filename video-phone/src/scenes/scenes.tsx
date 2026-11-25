import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile } from "remotion";
import { config } from "../config";
import { cue } from "../timing";
import { Appear, DrawPath, GPop, kaText, monoText, useRamp, usePop, useWave, seeded } from "../components/anim";
import { DangerBlock, Sticker } from "../components/chrome";
import { Stage, Svg, L, chip, card } from "../components/stage";

const C = config.colors;
const RED = "#FF3B4E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Phone with an endlessly scrolling feed. (x, y) = top-left, w × h. */
const Phone: React.FC<{ x: number; y: number; w?: number; h?: number; scroll: number; children?: React.ReactNode }> = ({ x, y, w = 300, h = 600, scroll, children }) => {
  const cardH = 170;
  const off = scroll % cardH;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 42, border: `5px solid ${C.line}`, background: "#050a18", overflow: "hidden", boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${C.accent}22` }}>
      <div style={{ position: "absolute", left: "50%", top: 10, width: 90, height: 22, borderRadius: 11, background: "#000", transform: "translateX(-50%)", zIndex: 2 }} />
      {Array.from({ length: 6 }, (_, i) => {
        const k = Math.floor(scroll / cardH) + i;
        const hue = [C.accent, C.yellow, "#8FB3FF", "#FF7EB6", "#6F80A8"][k % 5];
        return (
          <div key={i} style={{ position: "absolute", left: 14, right: 14, top: 44 + i * cardH - off, height: cardH - 14, borderRadius: 16, background: `linear-gradient(135deg, ${hue}55, rgba(20,34,72,0.9))`, border: "1px solid rgba(213,230,255,0.15)" }}>
            <div style={{ position: "absolute", left: 14, bottom: 14, width: "55%", height: 10, borderRadius: 5, background: "rgba(255,255,255,0.35)" }} />
            <div style={{ position: "absolute", left: 14, bottom: 32, width: "35%", height: 10, borderRadius: 5, background: "rgba(255,255,255,0.2)" }} />
          </div>
        );
      })}
      {children}
    </div>
  );
};

/* ---------------- 01 "just one minute" ---------------- */
export const S01: React.FC = () => {
  const id = "s01";
  const f = useCurrentFrame();
  const tHalf = cue(id, "ნახევარი");
  const tNot = cue(id, "შემთხვევითი");
  const scroll = f * 9 + Math.max(0, f - 20) ** 1.4;
  const mins = Math.round(interpolate(f, [cue(id, "წუთით"), tHalf + 12], [1, 30], { ...clamp, easing: Easing.in(Easing.quad) }));
  const late = mins >= 30;
  return (
    <Stage>
      <Phone x={40} y={60} scroll={scroll} h={680} />
      <Appear at={-4} dy={20} style={{ ...card(late ? C.danger : C.yellow), left: 420, top: 130, width: 520, textAlign: "center", padding: "18px 0 22px" }}>
        <div style={kaText(26, 700, C.dim)}>ლენტაში ხარ უკვე</div>
        <div style={{ fontFamily: config.fonts.mono, fontWeight: 700, fontSize: 130, lineHeight: 1.05, color: late ? C.danger : C.yellow, textShadow: `0 0 26px ${late ? C.danger : C.yellow}77` }}>
          {String(mins).padStart(2, "0")}:00
        </div>
        <div style={kaText(30, 900, late ? C.danger : C.text)}>{late ? "ნახევარი საათი" : "წუთი"}</div>
      </Appear>
      <L x={420} y={40} at={-4}><span style={{ ...kaText(36, 900), whiteSpace: "nowrap" }}>„მხოლოდ ერთი წუთით“</span></L>
      <Sticker at={tNot} text="ეს დიზაინია" style={{ left: 520, top: 470, ...kaText(50, 900, C.yellow) }} rotate={-4} />
    </Stage>
  );
};

/* ---------------- 02 slot machine ---------------- */
const SYM = ["dull", "star", "heart", "dull", "dull", "star"];
const Symbol: React.FC<{ kind: string; x: number; y: number; glow?: number }> = ({ kind, x, y, glow = 0 }) => {
  if (kind === "star")
    return <path transform={`translate(${x} ${y})`} d="M0 -44 L13 -14 L46 -14 L19 6 L29 38 L0 18 L-29 38 L-19 6 L-46 -14 L-13 -14 Z" fill={C.yellow} style={{ filter: glow ? `drop-shadow(0 0 ${14 * glow}px ${C.yellow})` : undefined }} />;
  if (kind === "heart")
    return <path transform={`translate(${x} ${y})`} d="M0 34 C-50 0 -46 -38 -18 -38 C-6 -38 0 -28 0 -22 C0 -28 6 -38 18 -38 C46 -38 50 0 0 34 Z" fill="#FF7EB6" />;
  return <rect x={x - 36} y={y - 36} width={72} height={72} rx={12} fill="rgba(140,160,200,0.35)" />;
};
export const S02: React.FC = () => {
  const id = "s02";
  const f = useCurrentFrame();
  const tWork = cue(id, "მუშაობს");
  const tDull = cue(id, "მოსაწყენია");
  const tGood = cue(id, "ძალიან");
  const tNext = cue(id, "შემდეგი");
  const pull = interpolate(f, [tWork - 6, tWork + 2, tWork + 12], [0, 1, 0], clamp) + interpolate(f, [tGood - 14, tGood - 8, tGood], [0, 1, 0], clamp);
  // result per phase: 0 spin, 1 dull, 2 jackpot, 3 unknown
  const phase = f < tDull ? 0 : f < tGood ? 1 : f < tNext ? 2 : 3;
  const reelX = [300, 480, 660];
  const glow = phase === 2 ? 0.6 + 0.4 * Math.sin(f / 4) : 0;
  return (
    <Stage>
      <Svg>
        {/* machine body */}
        <GPop at={-4} cx={480} cy={380}>
          <rect x={170} y={120} width={620} height={460} rx={40} fill="rgba(20,34,72,0.95)" stroke={C.yellow} strokeWidth={6} />
          <rect x={210} y={240} width={540} height={220} rx={20} fill="#050a18" stroke="rgba(213,230,255,0.4)" strokeWidth={3} />
          {[0, 1].map((k) => <line key={k} x1={390 + k * 180} x2={390 + k * 180} y1={250} y2={450} stroke="rgba(213,230,255,0.25)" strokeWidth={3} />)}
          {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={220 + i * 65} cy={150} r={10} fill={(Math.floor(f / 6) + i) % 2 ? C.yellow : C.danger} opacity={0.9} />)}
        </GPop>
        {/* reels */}
        {reelX.map((x, r) => {
          if (phase === 0 || (phase === 3 && true)) {
            const off = ((f * (22 + r * 4)) % 120);
            return (
              <g key={r} clipPath="url(#reelClip)">
                {[-1, 0, 1].map((k) => <Symbol key={k} kind={SYM[(Math.floor(f / 4) + r + k + 6) % SYM.length]} x={x} y={350 + k * 120 + off - 60} />)}
              </g>
            );
          }
          return <Symbol key={r} kind={phase === 1 ? "dull" : "star"} x={x} y={350} glow={glow} />;
        })}
        <defs><clipPath id="reelClip"><rect x={210} y={240} width={540} height={220} rx={20} /></clipPath></defs>
        {/* lever */}
        <g transform={`rotate(${pull * 50} 820 330)`}>
          <line x1={820} y1={330} x2={880} y2={170} stroke={C.line} strokeWidth={12} strokeLinecap="round" />
          <circle cx={880} cy={170} r={28} fill={C.danger} />
        </g>
      </Svg>
      <L x={480} y={600} at={tDull} center>
        <span style={{ ...chip(phase === 1 ? C.dim : phase === 2 ? C.yellow : C.accent), fontSize: 34 }}>{phase === 1 ? "მოსაწყენი" : phase === 2 ? "ძალიან კარგი!" : "შემდეგი — ?"}</span>
      </L>
      <L x={0} y={0} at={-4}><span style={kaText(40, 900)}>ლენტა = სათამაშო აპარატი</span></L>
    </Stage>
  );
};

/* ---------------- 03 dopamine likes the unexpected ---------------- */
export const S03: React.FC = () => {
  const id = "s03";
  const f = useCurrentFrame();
  const tWait = cue(id, "მოლოდინზე");
  const tSurprise = cue(id, "მოულოდნელ");
  const tSwipe = cue(id, "გადაფურცლო");
  const b1 = useRamp(tWait, 16);
  const b2 = useRamp(tSurprise, 18);
  const swipe = ((f - tSwipe) % 24) / 24;
  return (
    <Stage>
      <L x={0} y={0} at={-4}><span style={kaText(40, 900)}>რაზე რეაგირებს დოფამინი?</span></L>
      <div style={{ position: "absolute", left: 60, top: 120, width: 840, height: 400 }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "rgba(213,230,255,0.4)" }} />
        {[
          { x: 80, h: 110 * b1, c: C.dim, t: "ყოველთვის ერთი და იგივე" },
          { x: 480, h: 360 * b2, c: C.accent, t: "მოულოდნელი ჯილდო" },
        ].map((b, i) => (
          <div key={i} style={{ position: "absolute", left: b.x, bottom: 0, width: 260, height: b.h, borderRadius: "16px 16px 0 0", background: b.c, boxShadow: i ? `0 0 40px ${C.accent}77` : undefined }} />
        ))}
      </div>
      <L x={190} y={540} at={tWait} center style={{ textAlign: "center", width: 300 }}><span style={kaText(26, 800, C.dim)}>ყოველთვის ერთი და იგივე</span></L>
      <L x={670} y={540} at={tSurprise} center style={{ textAlign: "center", width: 320 }}><span style={kaText(28, 900, C.accent)}>მოლოდინი + მოულოდნელი ჯილდო</span></L>
      {f >= tSwipe && (
        <svg width={160} height={240} style={{ position: "absolute", left: 790, top: 520 - swipe * 120, opacity: 1 - swipe }}>
          <path d="M80 220 L80 40 M50 80 L80 40 L110 80" fill="none" stroke={C.yellow} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <Sticker at={tSwipe} text="კიდევ ერთი სქროლი" style={{ left: 300, top: 660 }} rotate={-3} />
    </Stage>
  );
};

/* ---------------- 04 variable reward ---------------- */
export const S04: React.FC = () => {
  const id = "s04";
  const f = useCurrentFrame();
  const tVar = cue(id, "ცვლადი");
  const tStrong = cue(id, "მყარია");
  const tFade = cue(id, "ქრება");
  const draw = interpolate(f, [tStrong - 6, tFade + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const n = 60;
  const line = (fn: (t: number) => number) => Array.from({ length: Math.floor(n * draw) + 1 }, (_, i) => {
    const t = i / n;
    return `${i ? "L" : "M"}${(100 + t * 780).toFixed(1)} ${(560 - fn(t) * 300).toFixed(1)}`;
  }).join(" ");
  const fixed = (t: number) => (t < 0.35 ? 0.9 : 0.9 * Math.exp(-(t - 0.35) * 9));
  const variable = (t: number) => (t < 0.35 ? 0.9 : 0.9 * Math.exp(-(t - 0.35) * 0.9));
  return (
    <Stage>
      <Sticker at={tVar} text="ცვლადი ჯილდო" style={{ left: 0, top: 0, ...kaText(48, 900, C.yellow) }} rotate={-2} />
      <Svg>
        <path d="M100 220 L100 560 L880 560" fill="none" stroke="rgba(213,230,255,0.5)" strokeWidth={2.5} />
        <line x1={373} x2={373} y1={220} y2={560} stroke="rgba(213,230,255,0.25)" strokeWidth={2} strokeDasharray="6 8" />
        <path d={line(fixed)} fill="none" stroke={C.dim} strokeWidth={6} strokeLinecap="round" />
        <path d={line(variable)} fill="none" stroke={C.accent} strokeWidth={7} strokeLinecap="round" />
      </Svg>
      <L x={110} y={180} at={tStrong - 6}><span style={kaText(22, 800, C.dim)}>ქცევა</span></L>
      <L x={760} y={575} at={tStrong - 6}><span style={kaText(22, 800, C.dim)}>დრო</span></L>
      <L x={385} y={575} at={tStrong - 6}><span style={kaText(20, 700, C.dim)}>ჯილდო შეწყდა</span></L>
      <L x={600} y={280} at={tStrong + 6}><span style={kaText(26, 900, C.accent)}>ცვლადი — რჩება</span></L>
      <L x={430} y={480} at={tFade}><span style={kaText(24, 800, C.dim)}>მუდმივი — სწრაფად ქრება</span></L>
      <L x={0} y={650} at={tStrong}><span style={monoText(18)}>B. F. Skinner · reinforcement schedules</span></L>
    </Stage>
  );
};

/* ---------------- 05 no bottom ---------------- */
export const S05: React.FC = () => {
  const id = "s05";
  const f = useCurrentFrame();
  const tEnd = cue(id, "დასასრული");
  const tRemoved = cue(id, "ამოიღეს");
  const tAuthor = cue(id, "ავტორმა");
  const strike = useRamp(tRemoved, 10);
  const scroll = f * 14;
  return (
    <Stage>
      <Phone x={40} y={20} scroll={scroll} h={720}>
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 20, height: 90, borderRadius: 14, border: `3px dashed ${C.line}`, background: "rgba(5,10,24,0.92)", display: "flex", alignItems: "center", justifyContent: "center", opacity: useRamp(tEnd - 6, 8), zIndex: 3 }}>
          <span style={kaText(24, 900, strike > 0.5 ? C.dim : C.text)}>გვერდის ბოლო</span>
          <div style={{ position: "absolute", left: 10, top: "50%", height: 6, width: `${strike * 95}%`, background: C.danger, borderRadius: 3 }} />
        </div>
      </Phone>
      <L x={400} y={60} at={-4}><span style={kaText(44, 900)}>ლენტას ბოლო</span></L>
      <L x={400} y={120} at={-4}><span style={kaText(44, 900, C.danger)}>არ აქვს</span></L>
      <L x={400} y={230} at={tRemoved}><span style={chip(C.danger)}>„გაჩერდი“ — ამოღებულია</span></L>
      <Appear at={tAuthor} dy={20} style={{ ...card(C.yellow), left: 400, top: 360, width: 560 }}>
        <div style={kaText(22, 700, C.dim)}>უსასრულო სქროლის ავტორი</div>
        <div style={kaText(34, 900)}>აზა რასკინი</div>
        <div style={{ ...kaText(40, 900, C.yellow), marginTop: 8 }}>„ვნანობ“</div>
        <div style={{ ...monoText(18), marginTop: 6 }}>Aza Raskin · BBC, 2018</div>
      </Appear>
    </Stage>
  );
};

/* ---------------- 06 the red dot ---------------- */
export const S06: React.FC = () => {
  const id = "s06";
  const f = useCurrentFrame();
  const tRed = cue(id, "წითელი");
  const tSound = cue(id, "ხმა");
  const tVibe = cue(id, "ვიბრაცია");
  const tChance = cue(id, "შანსია");
  const shake = f > tVibe && f < tVibe + 24 ? Math.sin(f * 2.5) * 8 : 0;
  const icons = Array.from({ length: 12 }, (_, i) => ({ x: 70 + (i % 4) * 140, y: 90 + Math.floor(i / 4) * 140, c: ["#3a7bd5", "#e1306c", "#25d366", "#ff0000", "#1da1f2", "#fffc00", "#8e44ad", "#ff6a00", "#00b2ff", "#34E3DC", "#e67e22", "#2ecc71"][i] }));
  const badges = [1, 4, 6, 9];
  return (
    <Stage>
      <div style={{ position: "absolute", left: 40, top: 0, width: 600, height: 560, borderRadius: 42, border: `5px solid ${C.line}`, background: "#050a18", transform: `translateX(${shake}px)` }}>
        <svg width={600} height={560} style={{ position: "absolute" }}>
          {icons.map((ic, i) => <rect key={i} x={ic.x} y={ic.y} width={96} height={96} rx={24} fill={ic.c} opacity={0.75} />)}
          {badges.map((b, k) => (
            <GPop key={b} at={tRed + k * 3} cx={icons[b].x + 96} cy={icons[b].y}>
              <circle cx={icons[b].x + 96} cy={icons[b].y} r={20} fill={RED} stroke="#050a18" strokeWidth={4} />
              <text x={icons[b].x + 96} y={icons[b].y + 8} textAnchor="middle" fill="#fff" fontFamily={config.fonts.mono} fontWeight={700} fontSize={22}>{[3, 12, 1, 99][k]}</text>
            </GPop>
          ))}
        </svg>
        {f > tVibe && f < tVibe + 30 && [0, 1].map((k) => (
          <svg key={k} width={60} height={200} style={{ position: "absolute", [k ? "right" : "left"]: -50, top: 180 }}>
            <path d={k ? "M10 20 Q40 60 10 100 Q40 140 10 180" : "M50 20 Q20 60 50 100 Q20 140 50 180"} fill="none" stroke={C.yellow} strokeWidth={5} />
          </svg>
        ))}
      </div>
      <div style={{ position: "absolute", left: 668, top: 40, display: "flex", flexDirection: "column", gap: 26 }}>
        <Appear at={tRed} dx={20} dy={0}><span style={{ ...chip(RED ), fontSize: 23 }}>● წითელი წერტილი</span></Appear>
        <Appear at={tSound} dx={20} dy={0}><span style={{ ...chip(C.yellow ), fontSize: 23 }}>♪ ხმა</span></Appear>
        <Appear at={tVibe} dx={20} dy={0}><span style={{ ...chip(C.accent ), fontSize: 23 }}>≋ ვიბრაცია</span></Appear>
      </div>
      <Sticker at={tChance} text="იქნებ რაღაც საინტერესოა?" style={{ left: 160, top: 610 }} rotate={-3} />
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
  const tGray = cue(id, "შავთეთრზე");
  const out = interpolate(f, [tOut - 6, tOut + 4], [1, 0], clamp);
  const pAv = usePop(tOut, 180);
  const float = useWave(60) * 6;
  const gray = useRamp(tGray, 20);
  const st = { fill: "none", strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <Stage>
      <div style={{ opacity: out }}>
        <L x={0} y={0} at={-2}><span style={kaText(44, 900)}>რა ვქნა?</span></L>
        <div style={{ position: "absolute", left: 0, top: 90, display: "flex", flexDirection: "column", gap: 14 }}>
          <Tip at={cue(id, "გამორთე")} color={C.accent} text="ზედმეტი შეტყობინებები — გამორთე" icon={<g {...st} stroke={C.accent}><path d="M14 34 V22 A11 11 0 0 1 36 22 V34 L40 38 H10 Z" /><path d="M8 8 L42 42" /></g>} />
          <Tip at={cue(id, "საძინებელში")} color={C.accent} text="ტელეფონი — საძინებლის გარეთ" icon={<g {...st} stroke={C.accent}><path d="M6 36 V16 M6 28 H44 V36 M14 28 V22 H26 V28" /></g>} />
          <Tip at={tGray} color={C.yellow} text="ეკრანი — შავ-თეთრი" icon={<g {...st} stroke={C.yellow}><circle cx={25} cy={25} r={17} /><path d="M25 8 A17 17 0 0 1 25 42 Z" fill={C.yellow} /></g>} />
        </div>
        <div style={{ position: "absolute", left: 620, top: 430, filter: `grayscale(${gray})` }}>
          <div style={{ position: "relative", width: 300, height: 340 }}>
            <Phone x={0} y={0} w={300} h={340} scroll={f * 6} />
          </div>
        </div>
        <Sticker at={cue(id, "ნაკლებად")} text="ნაკლებად მიმზიდველი" style={{ left: 20, top: 600 }} rotate={-3} />
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
