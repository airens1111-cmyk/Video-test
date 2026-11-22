import React from "react";
import { useCurrentFrame, interpolate, Img, staticFile, Easing } from "remotion";
import { config } from "../config";
import { cue, sentenceStart } from "../timing";
import { Appear, DrawPath, GFade, GPop, kaText, monoText, useRamp, usePop, useWave, CountUp } from "../components/anim";
import { DangerBlock, Sticker } from "../components/chrome";
import { Stage, Svg, L, chip } from "./scenes1";

const C = config.colors;

const Item: React.FC<{ at: number; color?: string; text: string; icon: React.ReactNode }> = ({ at, color = C.text, text, icon }) => (
  <Appear at={at} dx={-24} dy={0} style={{ display: "flex", alignItems: "center", gap: 18, height: 62 }}>
    <svg width={44} height={44} viewBox="0 0 44 44">{icon}</svg>
    <span style={kaText(34, 800, color)}>{text}</span>
  </Appear>
);

/* ---------------- 05 body ---------------- */
export const S05: React.FC = () => {
  const id = "s05";
  const f = useCurrentFrame();
  const tHeart = cue(id, "გული");
  const beatPhase = f > tHeart ? ((f - tHeart) / 30) * Math.PI * 2 * 2.4 : 0;
  const beat = f > tHeart ? 1 + 0.12 * Math.max(0, Math.sin(beatPhase)) : 1;
  const ecg = useRamp(tHeart, 22);
  const sweep = interpolate(f, [tHeart, tHeart + 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stroke = { stroke: C.danger, strokeWidth: 3, fill: "none", strokeLinecap: "round" as const };
  // clean upper-body silhouette (bust): head + shoulders + torso
  const body = "M160 455 L172 300 Q176 250 210 232 Q232 222 232 206 Q210 196 206 168 A66 66 0 1 1 338 168 Q334 196 312 206 Q312 222 334 232 Q368 250 372 300 L384 455 Z";
  const headGlow = 0.4 + 0.3 * Math.sin(f / 14);
  return (
    <Stage>
      <Svg>
        {/* body fill then outline draws on */}
        <GFade at={0} dur={14}><path d={body} fill="rgba(52,227,220,0.05)" /></GFade>
        <DrawPath at={0} dur={22} d={body} stroke={C.line} strokeWidth={3.5} />
        {/* subtle inner body-scan line */}
        <GFade at={6}>
          <line x1={150} x2={394} y1={300 + ((f * 3) % 150)} y2={300 + ((f * 3) % 150)} stroke="rgba(52,227,220,0.25)" strokeWidth={2} />
        </GFade>
        {/* heart */}
        <g transform={`translate(272 322) scale(${beat})`}>
          <GPop at={tHeart} cx={0} cy={0}>
            <path d="M0 20 C-34 -8 -36 -34 -16 -38 C-5 -40 0 -31 0 -24 C0 -31 5 -40 16 -38 C36 -34 34 -8 0 20 Z" fill="rgba(255,106,77,0.35)" stroke={C.danger} strokeWidth={4} />
          </GPop>
        </g>
        {/* brain hint in the head */}
        <GFade at={2}>
          <path d="M246 150 C236 136 258 128 266 140 C280 132 292 148 282 158 C292 170 276 182 266 174 C254 184 238 170 248 160 Z" fill="none" stroke={C.accent} strokeWidth={2.5} opacity={0.6 + 0.25 * Math.sin(f / 9)} />
        </GFade>
        {/* kidneys light up on the severe-case line */}
        {(() => {
          const lit = useRamp(cue(id, "კუნთები"), 10);
          return (
            <g opacity={lit}>
              <path d="M214 396 C200 396 198 420 210 426 C222 430 224 410 214 396 Z" fill="rgba(255,106,77,0.3)" stroke={C.danger} strokeWidth={2.5} />
              <path d="M330 396 C344 396 346 420 334 426 C322 430 320 410 330 396 Z" fill="rgba(255,106,77,0.3)" stroke={C.danger} strokeWidth={2.5} />
            </g>
          );
        })()}
        {/* ECG along the bottom */}
        <path d="M30 650 L150 650 L172 614 L196 700 L218 582 L240 664 L262 650 L430 650" fill="none" stroke={C.danger} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ecg} />
        {sweep > 0 && sweep < 1 && <circle cx={30 + sweep * 400} cy={650} r={6} fill={C.danger} />}
      </Svg>
      <div style={{ position: "absolute", left: 470, top: 30, display: "flex", flexDirection: "column", gap: 2 }}>
        <Item at={tHeart} color={C.danger} text="აჩქარებული გული" icon={<path d="M22 36 C6 24 6 10 14 8 C18 7 22 11 22 14 C22 11 26 7 30 8 C38 10 38 24 22 36 Z" {...stroke} />} />
        <Item at={cue(id, "წნევა")} color={C.danger} text="მაღალი წნევა" icon={<g {...stroke}><path d="M6 32 A16 16 0 1 1 38 32" /><path d="M22 32 L32 16" /></g>} />
        <Item at={cue(id, "გულმკერდში")} text="ტკივილი გულმკერდში" icon={<g {...stroke}><path d="M22 6 L14 22 L24 22 L18 38" /></g>} />
        <Item at={cue(id, "კრუნჩხვა")} text="კრუნჩხვა" icon={<g {...stroke}><path d="M4 22 L12 12 L18 32 L26 10 L32 30 L40 22" /></g>} />
        <Item at={cue(id, "ყბის")} color={C.yellow} text="ყბის დაჭიმვა" icon={<g stroke={C.yellow} strokeWidth={3} fill="none"><path d="M8 16 C8 34 36 34 36 16" /><path d="M14 22 L30 22" /></g>} />
        <Item at={cue(id, "უძილობა")} color={C.yellow} text="უძილობა" icon={<g stroke={C.yellow} strokeWidth={3} fill="none"><path d="M28 8 A14 14 0 1 0 36 30 A11 11 0 1 1 28 8 Z" /></g>} />
      </div>
      <DangerBlock at={cue(id, "მძიმე")} style={{ left: 470, top: 476, width: 450 }}>
        <div style={kaText(26, 700, C.danger)}>მძიმე შემთხვევებში</div>
        <div style={kaText(36, 900, C.danger)}>კუნთები და თირკმელები</div>
      </DangerBlock>
    </Stage>
  );
};

/* ---------------- 06 mind ---------------- */
export const S06: React.FC = () => {
  const id = "s06";
  const f = useCurrentFrame();
  const steps = [
    { t: "აგზნება", c: C.accent, at: cue(id, "აგზნება") },
    { t: "შფოთვა", c: C.yellow, at: cue(id, "შფოთვა") },
    { t: "პარანოია", c: "#FF9A4D", at: cue(id, "პარანოია") },
    { t: "ფსიქოზი", c: C.danger, at: cue(id, "ფსიქოზიც") },
  ];
  const tCard = sentenceStart(id, 1);
  return (
    <Stage>
      <Svg>
        <DrawPath at={0} dur={18} d="M90 330 C60 250 70 120 180 80 C280 45 360 110 360 200 C360 240 380 260 390 290 C370 300 360 310 362 330 C364 360 340 370 310 368 L300 420 L140 420 C140 390 110 370 90 330 Z" />
        <DrawPath at={6} dur={20} d="M150 200 C170 160 230 150 260 180 C300 170 320 210 300 240 C320 270 280 300 250 284 C220 310 170 300 170 270 C140 260 135 220 150 200 Z" stroke={C.accent} strokeWidth={2.5} opacity={0.5 + 0.25 * Math.sin(f / 10)} />
        {steps.map((s, i) => (
          <GPop key={i} at={s.at} cx={470} cy={362 - i * 80}>
            <rect x={450} y={330 - i * 80} width={40} height={64} rx={8} fill={s.c} opacity={0.9} />
          </GPop>
        ))}
      </Svg>
      {steps.map((s, i) => (
        <L key={i} x={515} y={334 - i * 80} at={s.at}><span style={kaText(40, 900, s.c)}>{s.t}</span></L>
      ))}
      <Appear at={tCard} dy={18} style={{ position: "absolute", left: 0, top: 470, width: 940, border: `2px solid rgba(213,230,255,0.35)`, borderRadius: 18, padding: "22px 30px", background: "rgba(8,18,44,0.7)", boxShadow: "0 18px 50px rgba(2,8,24,0.6), 0 0 0 1px rgba(52,227,220,0.08)" }}>
        <div style={kaText(34, 900)}>მომდევნო დღეები</div>
        <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
          <Appear at={cue(id, "ცუდი")}><span style={chip(C.line)}>ცუდი ძილი</span></Appear>
          <Appear at={cue(id, "დაძაბულობა")}><span style={chip(C.line)}>დაძაბულობა</span></Appear>
          <Appear at={cue(id, "სურვილი")}><span style={chip(C.yellow)}>მიღების სურვილი</span></Appear>
        </div>
      </Appear>
      <Sticker at={cue(id, "მძიმეა")} text="ხშირად მძიმეა" style={{ left: 660, top: 448 }} rotate={4} />
    </Stage>
  );
};

/* ---------------- 07 dependence ---------------- */
export const S07: React.FC = () => {
  const id = "s07";
  const f = useCurrentFrame();
  const t30 = cue(id, "ოცდაათ");
  const lit = useRamp(t30, 8);
  return (
    <Stage>
      <Svg>
        {Array.from({ length: 10 }, (_, i) => {
          const x = 70 + (i % 5) * 92;
          const y = 120 + Math.floor(i / 5) * 100;
          const on = i < 3;
          return (
            <GPop key={i} at={cue(id, "კვლევაში") + i * 2} cx={x} cy={y}>
              <circle cx={x} cy={y} r={34} fill={on ? `rgba(247,208,70,${0.9 * lit})` : "none"} stroke={on && lit > 0.5 ? C.yellow : "rgba(213,230,255,0.5)"} strokeWidth={4} />
            </GPop>
          );
        })}
      </Svg>
      <L x={560} y={70} at={t30}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <CountUp at={t30} from={0} to={30} dur={16} suffix="%" style={{ ...kaText(150, 900, C.yellow), letterSpacing: -4 }} />
        </div>
      </L>
      <L x={30} y={300} at={t30 + 3}><div style={kaText(24, 700, C.dim)}>100 მომხმარებლის კვლევა · დიდი ბრიტანეთი · 2011</div></L>
      <L x={30} y={360} at={cue(id, "ნიშნები")}><span style={kaText(30, 800)}>დამოკიდებულების ნიშნები:</span></L>
      <div style={{ position: "absolute", left: 30, top: 420, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
        <Appear at={cue(id, "ტოლერანტობა")} dx={-20}><span style={chip(C.accent)}>ტოლერანტობა</span></Appear>
        <Appear at={cue(id, "კონტროლის")} dx={-20}><span style={chip(C.accent)}>კონტროლის დაკარგვა</span></Appear>
        <Appear at={cue(id, "იძულებითი")} dx={-20}><span style={chip(C.yellow)}>იძულებითი სურვილი</span></Appear>
      </div>
      <Sticker at={cue(id, "რეალური")} text="დამოკიდებულება — რეალური რისკი" style={{ left: 300, top: 660 }} rotate={-2} />
    </Stage>
  );
};

/* ---------------- 08 unknown content & mixing ---------------- */
export const S08: React.FC = () => {
  const id = "s08";
  const f = useCurrentFrame();
  const tQ = cue(id, "არავინ");
  const tMix = cue(id, "შერევა");
  const m = interpolate(f, [tMix, tMix + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const circles = [
    { x: 200, to: 400, c: C.accent, t: "მეფედრონი" },
    { x: 480, to: 480, c: C.yellow, t: "ალკოჰოლი" },
    { x: 760, to: 560, c: "#8FB3FF", t: "სხვა ნივთიერებები" },
  ];
  const qPop = usePop(tQ, 240);
  const qFlip = f > tQ ? Math.sin((f - tQ) / 18) * 6 : 0;
  return (
    <Stage>
      <Svg>
        <DrawPath at={0} dur={16} d="M70 70 L330 70 L330 330 C330 350 315 360 300 360 L100 360 C85 360 70 350 70 330 Z" />
        <DrawPath at={4} dur={12} d="M70 110 L330 110" opacity={0.6} />
        <g transform={`translate(200 250) scale(${0.7 + 0.3 * qPop}) rotate(${qFlip})`}>
          <text x={0} y={60} textAnchor="middle" fill={C.yellow} opacity={qPop} fontFamily={config.fonts.ka} fontWeight={900} fontSize={170}>?</text>
        </g>
        {circles.map((c, i) => {
          const x = c.x + (c.to - c.x) * m;
          return (
            <GPop key={i} at={tMix + i * 3} cx={c.x} cy={500}>
              <circle cx={x} cy={500} r={78} fill={c.c} fillOpacity={0.18 + 0.12 * m} stroke={c.c} strokeWidth={4} />
            </GPop>
          );
        })}
        {m > 0.6 && <circle cx={480} cy={500} r={30 + 50 * Math.sin((f - tMix) / 6)} fill="none" stroke={C.danger} strokeWidth={3} opacity={Math.max(0, 1 - (f - tMix - 10) / 20)} />}
      </Svg>
      <L x={200} y={380} at={tQ} center><span style={kaText(30, 900, C.yellow)}>შემადგენლობა უცნობია</span></L>
      <L x={400} y={110} at={cue(id, "ნარკოტიკად")} style={{ width: 520 }}>
        <div style={{ border: `2px solid rgba(213,230,255,0.4)`, borderRadius: 16, padding: "18px 24px", background: "rgba(8,18,44,0.7)" }}>
          <div style={kaText(30, 800, C.dim)}>შეიძლება გაიყიდოს</div>
          <div style={kaText(36, 900)}>როგორც სხვა ნარკოტიკი</div>
        </div>
      </L>
      {circles.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.x - 150, top: 596, width: 300, textAlign: "center", opacity: 1 - m }}>
          <Appear at={tMix + i * 3}><span style={kaText(28, 800, c.c)}>{c.t}</span></Appear>
        </div>
      ))}
      <DangerBlock at={cue(id, "რისკს")} style={{ left: 250, top: 660, width: 460, textAlign: "center" }}>
        <span style={kaText(40, 900, C.danger)}>შერევა = მეტი რისკი</span>
      </DangerBlock>
    </Stage>
  );
};

/* ---------------- 09 law ---------------- */
export const S09: React.FC = () => {
  const id = "s09";
  const f = useCurrentFrame();
  const tRow = cue(id, "ნარკოტიკული");
  const hl = useRamp(tRow, 8);
  const scanY = interpolate(f, [tRow, tRow + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Stage>
      <Appear at={0} dy={16} style={{ position: "absolute", left: 0, top: 0, width: 940, borderRadius: 18, border: `2px solid rgba(213,230,255,0.4)`, background: "rgba(8,18,44,0.75)", padding: "22px 30px", overflow: "hidden", boxShadow: "0 18px 50px rgba(2,8,24,0.6)" }}>
        <div style={kaText(24, 700, C.dim)}>საქართველოს კანონი</div>
        <div style={kaText(32, 900)}>ნარკოტიკული საშუალებების შესახებ</div>
        <div style={{ ...kaText(26, 800, C.accent), marginTop: 14 }}>დანართი 1 · სია I</div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
          <div style={{ ...monoText(22), opacity: 0.4 }}>…</div>
          <div style={{ padding: "6px 12px", borderRadius: 8, background: `rgba(247,208,70,${0.22 * hl})`, border: `2px solid rgba(247,208,70,${hl})`, display: "flex", gap: 16, alignItems: "baseline", boxShadow: hl > 0.5 ? `0 0 20px rgba(247,208,70,0.3)` : undefined }}>
            <span style={kaText(30, 900, hl > 0.5 ? C.yellow : C.text)}>მეფედრონი</span>
            <span style={monoText(20)}>MEPHEDRONE (4-MMC)</span>
          </div>
          <div style={{ ...monoText(22), opacity: 0.4 }}>…</div>
          {scanY > 0 && scanY < 1 && <div style={{ position: "absolute", left: -30, right: -30, top: `${scanY * 100}%`, height: 3, background: C.accent, opacity: 0.5, boxShadow: `0 0 12px ${C.accent}` }} />}
        </div>
      </Appear>
      <Appear at={cue(id, "ჯარიმა")} dy={20} style={{ position: "absolute", left: 0, top: 380, width: 450, borderRadius: 16, border: `3px solid ${C.yellow}`, padding: "18px 22px", background: "rgba(247,208,70,0.08)" }}>
        <div style={kaText(22, 700, C.dim)}>ადმ. კოდექსი, მუხ. 45</div>
        <div style={{ ...kaText(28, 800), marginTop: 8 }}>მოხმარება, მცირე ოდენობა</div>
        <div style={{ ...kaText(30, 900, C.yellow), marginTop: 8 }}>ჯარიმა ან პატიმრობა</div>
      </Appear>
      <Appear at={cue(id, "სისხლის")} dy={20} style={{ position: "absolute", left: 490, top: 380, width: 450, borderRadius: 16, border: `3px solid ${C.danger}`, padding: "18px 22px", background: "rgba(255,106,77,0.1)" }}>
        <div style={kaText(22, 700, C.dim)}>სისხლის სამართლის კოდექსი, მუხ. 260</div>
        <div style={{ ...kaText(28, 800), marginTop: 8 }}>უკანონო შეძენა, შენახვა</div>
        <div style={{ ...kaText(30, 900, C.danger), marginTop: 8 }}>თავისუფლების აღკვეთა</div>
      </Appear>
      <L x={0} y={720} at={cue(id, "ჯარიმა")}><span style={monoText(22)}>matsne.gov.ge</span></L>
    </Stage>
  );
};

/* ---------------- 10 help + outro ---------------- */
export const S10: React.FC = () => {
  const id = "s10";
  const f = useCurrentFrame();
  const tOut = cue(id, "გამოიწერე");
  const out = interpolate(f, [tOut - 6, tOut + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pAv = usePop(tOut, 180);
  const ring = f > tOut ? (f - tOut) * 6 : 0;
  const float = useWave(60) * 6;
  return (
    <Stage>
      <div style={{ opacity: out, pointerEvents: out < 0.05 ? "none" : undefined }}>
        <Appear at={0} dy={20} style={{ position: "absolute", left: 0, top: 40, width: 940, borderRadius: 22, border: `3px solid ${C.accent}`, background: "rgba(8,18,44,0.75)", padding: "34px 36px", display: "flex", alignItems: "center", gap: 34, boxShadow: `0 18px 60px rgba(2,8,24,0.7), 0 0 40px ${C.accent}22` }}>
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={70} fill="rgba(52,227,220,0.12)" stroke={C.accent} strokeWidth={4} />
            <path d="M60 35 H90 V60 H115 V90 H90 V115 H60 V90 H35 V60 H60 Z" fill={C.accent} transform={`scale(${0.94 + 0.06 * Math.sin(f / 8)})`} transform-origin="75 75" />
          </svg>
          <div>
            <div style={kaText(28, 700, C.dim)}>სად მივმართო?</div>
            <div style={kaText(58, 900)}>მიმართე ექიმს</div>
          </div>
        </Appear>
        <Sticker at={cue(id, "თხოვნა")} text="დახმარების თხოვნა ნორმალურია" style={{ left: 120, top: 340 }} rotate={-2} />
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
