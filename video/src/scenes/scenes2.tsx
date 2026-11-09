import React from "react";
import { useCurrentFrame, interpolate, Img, staticFile } from "remotion";
import { config } from "../config";
import { cue, sentenceStart } from "../timing";
import { Appear, DrawPath, GFade, kaText, monoText, useRamp, usePop } from "../components/anim";
import { DangerBlock, Sticker } from "../components/chrome";
import { Stage, Svg, L, chip } from "./scenes1";

const C = config.colors;

const Item: React.FC<{ at: number; color?: string; text: string; icon: React.ReactNode }> = ({ at, color = C.text, text, icon }) => (
  <Appear at={at} dy={14} style={{ display: "flex", alignItems: "center", gap: 18, height: 64 }}>
    <svg width={44} height={44} viewBox="0 0 44 44">{icon}</svg>
    <span style={kaText(34, 800, color)}>{text}</span>
  </Appear>
);

/* ---------------- 05 body ---------------- */
export const S05: React.FC = () => {
  const id = "s05";
  const f = useCurrentFrame();
  const tHeart = cue(id, "გული");
  const beat = 1 + 0.08 * Math.max(0, Math.sin(((f - tHeart) / 30) * Math.PI * 2 * 2.2)) * (f > tHeart ? 1 : 0);
  const ecg = useRamp(tHeart, 30);
  const stroke = { stroke: C.danger, strokeWidth: 3, fill: "none", strokeLinecap: "round" as const };
  return (
    <Stage>
      <Svg>
        {/* simple body outline, no face */}
        <DrawPath at={0} dur={26} d="M190 70 A56 56 0 1 1 189.9 70" />
        <DrawPath at={4} dur={34} d="M150 196 C110 210 90 250 86 330 L80 520 M290 196 C330 210 350 250 354 330 L360 520 M150 196 L290 196 M120 270 L130 560 L310 560 L320 270" />
        <g transform={`translate(240 300) scale(${beat})`}>
          <GFade at={tHeart} dy={0}>
            <path d="M0 18 C-30 -6 -32 -30 -14 -34 C-4 -36 0 -28 0 -22 C0 -28 4 -36 14 -34 C32 -30 30 -6 0 18 Z" fill="rgba(255,106,77,0.25)" stroke={C.danger} strokeWidth={4} />
          </GFade>
        </g>
        <path
          d="M40 640 L150 640 L170 610 L190 680 L210 590 L230 650 L250 640 L420 640"
          fill="none" stroke={C.danger} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ecg}
        />
      </Svg>
      <div style={{ position: "absolute", left: 440, top: 40, display: "flex", flexDirection: "column", gap: 6 }}>
        <Item at={tHeart} color={C.danger} text="აჩქარებული გული" icon={<path d="M22 36 C6 24 6 10 14 8 C18 7 22 11 22 14 C22 11 26 7 30 8 C38 10 38 24 22 36 Z" {...stroke} />} />
        <Item at={cue(id, "წნევა")} color={C.danger} text="მაღალი წნევა" icon={<g {...stroke}><path d="M6 32 A16 16 0 1 1 38 32" /><path d="M22 32 L32 16" /></g>} />
        <Item at={cue(id, "გულმკერდში")} text="ტკივილი გულმკერდში" icon={<g {...stroke}><path d="M22 6 L14 22 L24 22 L18 38" /></g>} />
        <Item at={cue(id, "კრუნჩხვა")} text="კრუნჩხვა" icon={<g {...stroke}><path d="M4 22 L12 12 L18 32 L26 10 L32 30 L40 22" /></g>} />
        <Item at={cue(id, "ყბის")} color={C.yellow} text="ყბის დაჭიმვა" icon={<g stroke={C.yellow} strokeWidth={3} fill="none"><path d="M8 16 C8 34 36 34 36 16" /><path d="M14 22 L30 22" /></g>} />
        <Item at={cue(id, "უძილობა")} color={C.yellow} text="უძილობა" icon={<g stroke={C.yellow} strokeWidth={3} fill="none"><path d="M28 8 A14 14 0 1 0 36 30 A11 11 0 1 1 28 8 Z" /></g>} />
      </div>
      <DangerBlock at={cue(id, "მძიმე")} style={{ left: 440, top: 470, width: 470 }}>
        <div style={kaText(26, 700, C.danger)}>მძიმე შემთხვევებში</div>
        <div style={kaText(36, 900, C.danger)}>კუნთები და თირკმელები</div>
      </DangerBlock>
    </Stage>
  );
};

/* ---------------- 06 mind ---------------- */
export const S06: React.FC = () => {
  const id = "s06";
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
        {/* head outline with a brain hint (no face) */}
        <DrawPath at={0} dur={30} d="M90 330 C60 250 70 120 180 80 C280 45 360 110 360 200 C360 240 380 260 390 290 C370 300 360 310 362 330 C364 360 340 370 310 368 L300 420 L140 420 C140 390 110 370 90 330 Z" />
        <DrawPath at={8} dur={30} d="M150 200 C170 160 230 150 260 180 C300 170 320 210 300 240 C320 270 280 300 250 284 C220 310 170 300 170 270 C140 260 135 220 150 200 Z" stroke={C.accent} strokeWidth={2.5} opacity={0.8} />
        {steps.map((s, i) => (
          <GFade key={i} at={s.at} dy={0}>
            <rect x={450} y={330 - i * 80} width={40} height={64} rx={8} fill={s.c} opacity={0.9} />
          </GFade>
        ))}
      </Svg>
      {steps.map((s, i) => (
        <L key={i} x={515} y={334 - i * 80} at={s.at}>
          <span style={kaText(40, 900, s.c)}>{s.t}</span>
        </L>
      ))}
      <Appear at={tCard} style={{ position: "absolute", left: 0, top: 470, width: 940, border: `2px solid rgba(213,230,255,0.35)`, borderRadius: 18, padding: "22px 30px", background: "rgba(8,18,44,0.7)" }}>
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
  const t30 = cue(id, "ოცდაათ");
  const lit = useRamp(t30, 10);
  return (
    <Stage>
      <Svg>
        {Array.from({ length: 10 }, (_, i) => {
          const x = 70 + (i % 5) * 92;
          const y = 120 + Math.floor(i / 5) * 100;
          const on = i < 3;
          return (
            <GFade key={i} at={cue(id, "ბრიტანულ") + i * 2} dy={0}>
              <circle cx={x} cy={y} r={34} fill={on ? `rgba(247,208,70,${0.9 * lit})` : "none"} stroke={on && lit > 0.5 ? C.yellow : "rgba(213,230,255,0.5)"} strokeWidth={4} />
            </GFade>
          );
        })}
      </Svg>
      <L x={560} y={70} at={t30}>
        <span style={{ ...kaText(150, 900, C.yellow), letterSpacing: -4 }}>30%</span>
      </L>
      <L x={30} y={300} at={t30 + 4}>
        <div style={kaText(24, 700, C.dim)}>100 მომხმარებლის კვლევა · დიდი ბრიტანეთი · 2011</div>
      </L>
      <L x={30} y={360} at={cue(id, "ნიშნები")}>
        <span style={kaText(30, 800)}>დამოკიდებულების ნიშნები:</span>
      </L>
      <div style={{ position: "absolute", left: 30, top: 420, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
        <Appear at={cue(id, "ტოლერანტობა")}><span style={chip(C.accent)}>ტოლერანტობა</span></Appear>
        <Appear at={cue(id, "კონტროლის")}><span style={chip(C.accent)}>კონტროლის დაკარგვა</span></Appear>
        <Appear at={cue(id, "იძულებითი")}><span style={chip(C.yellow)}>იძულებითი სურვილი</span></Appear>
      </div>
      <Sticker at={cue(id, "რეალური")} text="დამოკიდებულება — რეალური რისკი" style={{ left: 300, top: 660 }} rotate={-2} />
    </Stage>
  );
};

/* ---------------- 08 unknown content & mixing ---------------- */
export const S08: React.FC = () => {
  const id = "s08";
  const f = useCurrentFrame();
  const tMix = cue(id, "ალკოჰოლთან");
  const tMerge = cue(id, "შერევა");
  const m = interpolate(f, [tMerge, tMerge + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const circles = [
    { x: 200, to: 400, c: C.accent, t: "მეფედრონი" },
    { x: 480, to: 480, c: C.yellow, t: "ალკოჰოლი" },
    { x: 760, to: 560, c: "#8FB3FF", t: "სხვა ნივთიერებები" },
  ];
  const q = usePop(cue(id, "არავინ"));
  return (
    <Stage>
      <Svg>
        {/* abstract package */}
        <DrawPath at={0} dur={26} d="M70 70 L330 70 L330 330 C330 350 315 360 300 360 L100 360 C85 360 70 350 70 330 Z" />
        <DrawPath at={6} dur={18} d="M70 110 L330 110" opacity={0.6} />
        <text x={200} y={290} textAnchor="middle" fill={C.yellow} opacity={q} fontFamily={config.fonts.ka} fontWeight={900} fontSize={170 * (0.7 + 0.3 * q)}>?</text>
        {circles.map((c, i) => {
          const x = c.x + (c.to - c.x) * m;
          return (
            <GFade key={i} at={tMix + i * 4} dy={0}>
              <circle cx={x} cy={500} r={78} fill={c.c} fillOpacity={0.18 + 0.1 * m} stroke={c.c} strokeWidth={4} />
            </GFade>
          );
        })}
      </Svg>
      <L x={200} y={380} at={cue(id, "არავინ")} center>
        <span style={kaText(30, 900, C.yellow)}>შემადგენლობა უცნობია</span>
      </L>
      <L x={400} y={110} at={cue(id, "ნარკოტიკად")} style={{ width: 520 }}>
        <div style={{ border: `2px solid rgba(213,230,255,0.4)`, borderRadius: 16, padding: "18px 24px", background: "rgba(8,18,44,0.7)" }}>
          <div style={kaText(30, 800, C.dim)}>შეიძლება გაიყიდოს</div>
          <div style={kaText(36, 900)}>როგორც სხვა ნარკოტიკი</div>
        </div>
      </L>
      {circles.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.x - 150, top: 596, width: 300, textAlign: "center", opacity: 1 - m }}>
          <Appear at={tMix + i * 4}><span style={kaText(28, 800, c.c)}>{c.t}</span></Appear>
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
  const tRow = cue(id, "ნარკოტიკული");
  const hl = useRamp(tRow, 10);
  return (
    <Stage>
      <Appear at={0} style={{ position: "absolute", left: 0, top: 0, width: 940, borderRadius: 18, border: `2px solid rgba(213,230,255,0.4)`, background: "rgba(8,18,44,0.75)", padding: "22px 30px" }}>
        <div style={kaText(24, 700, C.dim)}>საქართველოს კანონი</div>
        <div style={kaText(32, 900)}>ნარკოტიკული საშუალებების შესახებ</div>
        <div style={{ ...kaText(26, 800, C.accent), marginTop: 14 }}>დანართი 1 · სია I</div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ ...monoText(22), opacity: 0.6 }}>…</div>
          <div style={{ padding: "6px 12px", borderRadius: 8, background: `rgba(247,208,70,${0.22 * hl})`, border: `2px solid rgba(247,208,70,${hl})`, display: "flex", gap: 16, alignItems: "baseline" }}>
            <span style={kaText(30, 900, hl > 0.5 ? C.yellow : C.text)}>მეფედრონი</span>
            <span style={monoText(20)}>MEPHEDRONE (4-MMC)</span>
          </div>
          <div style={{ ...monoText(22), opacity: 0.6 }}>…</div>
        </div>
      </Appear>
      <Appear at={cue(id, "ჯარიმა")} style={{ position: "absolute", left: 0, top: 380, width: 450, borderRadius: 16, border: `3px solid ${C.yellow}`, padding: "18px 22px", background: "rgba(247,208,70,0.08)" }}>
        <div style={kaText(22, 700, C.dim)}>ადმ. სამართალდარღვევათა კოდექსი, მუხ. 45</div>
        <div style={{ ...kaText(28, 800), marginTop: 8 }}>მოხმარება, მცირე ოდენობა</div>
        <div style={{ ...kaText(30, 900, C.yellow), marginTop: 8 }}>ჯარიმა ან ადმ. პატიმრობა</div>
      </Appear>
      <Appear at={cue(id, "სისხლის")} style={{ position: "absolute", left: 490, top: 380, width: 450, borderRadius: 16, border: `3px solid ${C.danger}`, padding: "18px 22px", background: "rgba(255,106,77,0.1)" }}>
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
  const out = interpolate(f, [tOut - 6, tOut + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pAv = usePop(tOut);
  return (
    <Stage>
      <div style={{ opacity: out }}>
        <Appear at={0} style={{ position: "absolute", left: 0, top: 40, width: 940, borderRadius: 22, border: `3px solid ${C.accent}`, background: "rgba(8,18,44,0.75)", padding: "34px 36px", display: "flex", alignItems: "center", gap: 34 }}>
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={70} fill="rgba(52,227,220,0.12)" stroke={C.accent} strokeWidth={4} />
            <path d="M60 35 H90 V60 H115 V90 H90 V115 H60 V90 H35 V60 H60 Z" fill={C.accent} />
          </svg>
          <div>
            <div style={kaText(28, 700, C.dim)}>სად მივმართო?</div>
            <div style={kaText(58, 900)}>მიმართე ექიმს</div>
          </div>
        </Appear>
        <Sticker at={cue(id, "ნორმალურია")} text="დახმარების თხოვნა ნორმალურია" style={{ left: 120, top: 340 }} rotate={-2} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 30, width: 960, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, pAv * 1.4) }}>
        <Img src={staticFile(config.avatar)} style={{ width: 340, height: 340, borderRadius: 170, border: `6px solid ${C.accent}`, boxShadow: `0 0 60px ${C.accent}66`, transform: `scale(${0.7 + 0.3 * pAv})` }} />
        <div style={{ ...kaText(84, 900), marginTop: 30 }}>{config.name}</div>
        {config.showHandle ? <div style={monoText(30)}>{config.handle}</div> : null}
        <div style={{ ...kaText(28, 700, C.dim), marginTop: 6 }}>{config.outroLine}</div>
        <div style={{ marginTop: 34, background: C.accent, borderRadius: 50, padding: "16px 54px 20px", ...kaText(44, 900, "#04202a") }}>გამოიწერე</div>
      </div>
    </Stage>
  );
};
