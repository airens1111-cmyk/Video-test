import React from "react";
import { useCurrentFrame, interpolate, Img, staticFile, Easing } from "remotion";
import { config } from "../config";
import { cue, sentenceStart } from "../timing";
import { Appear, DrawPath, GFade, GPop, kaText, monoText, useRamp, usePop, useWave, CountUp } from "../components/anim";
import { DangerBlock, Sticker } from "../components/chrome";
import { Stage, Svg, L, chip, card } from "./scenes1";

const C = config.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------------- 12 the purpose changed ---------------- */
export const S12: React.FC = () => {
  const id = "s12";
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

/* ---------------- 13 vote 9:8 + outro ---------------- */
export const S13: React.FC = () => {
  const id = "s13";
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
