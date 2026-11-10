// Atmosphere presets (light, sky, fog, wind, clouds, particles, post) and per-act colour grades.

export interface Grade {
  lift: [number, number, number]; gamma: [number, number, number]; gain: [number, number, number];
  saturation: number; contrast: number; temperature: number;  // temperature: -1 cold .. +1 warm
}

/** Colour grading per act (applied in the final post pass). */
export const GRADES: Record<string, Grade> = {
  // Act I — context, before the battle: cold blue-grey
  cold: { lift: [0.0, 0.01, 0.03], gamma: [1.0, 1.0, 1.04], gain: [0.94, 0.98, 1.05], saturation: 0.9, contrast: 1.06, temperature: -0.35 },
  // Act II — the battle: dusty ochre
  ochre: { lift: [0.03, 0.02, 0.0], gamma: [1.02, 1.0, 0.95], gain: [1.06, 1.0, 0.86], saturation: 0.88, contrast: 1.1, temperature: 0.35 },
  // Act III — the turning point: drained and contrasty
  drained: { lift: [0.0, 0.0, 0.0], gamma: [1.0, 1.0, 1.0], gain: [1.0, 0.99, 0.97], saturation: 0.45, contrast: 1.25, temperature: 0.0 },
  // Act IV — last stand / sunset: crimson
  crimson: { lift: [0.03, 0.0, 0.01], gamma: [0.98, 1.01, 1.02], gain: [1.06, 0.95, 0.9], saturation: 0.9, contrast: 1.15, temperature: 0.45 },
  // Act V — memory / final dawn: soft gold
  gold: { lift: [0.02, 0.015, 0.01], gamma: [0.98, 1.0, 1.03], gain: [1.06, 1.01, 0.9], saturation: 0.85, contrast: 0.98, temperature: 0.25 },
  neutral: { lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], saturation: 1, contrast: 1, temperature: 0 },
};

export interface Preset {
  name: string;
  sun: { elevation: number; azimuth: number; color: string; intensity: number };   // degrees; azimuth 0 = north, 90 = east
  moon?: { elevation: number; azimuth: number; color: string; intensity: number };
  ambient: { sky: string; ground: string; intensity: number };
  sky: { zenith: string; horizon: string; sunGlow: number; stars: number };
  fog: { color: string; sunColor: string; density: number; falloff: number; base: number; haze: number };
  godRays: number;
  clouds: { cover: number; color: string; altitude: number; speed: number; dark: number };
  wind: { dir: number; strength: number };                                          // dir in degrees (towards), strength 0..2
  particles: { windDust: number; ash: number; riverMist: number; embers: number; heat: number };
  exposure: number;
  bloom: { threshold: number; strength: number; radius: number };
  streak: number; vignette: number; grain: number; chroma: number;
  grade: keyof typeof GRADES;
  night: number;
}

export const PRESETS: Record<string, Preset> = {
  dawn: {
    name: "Dawn before the battle",
    sun: { elevation: 4, azimuth: 92, color: "#ffb27a", intensity: 2.2 },
    ambient: { sky: "#7f97c2", ground: "#4a4038", intensity: 0.7 },
    sky: { zenith: "#2e4a7a", horizon: "#f2b48a", sunGlow: 1.4, stars: 0.15 },
    fog: { color: "#9aa6b8", sunColor: "#ffc08e", density: 0.00040, falloff: 0.012, base: 0, haze: 0.000025 },
    godRays: 0.8, clouds: { cover: 0.25, color: "#ffd0b0", altitude: 1400, speed: 2, dark: 0.15 },
    wind: { dir: 120, strength: 0.25 }, particles: { windDust: 0.2, ash: 0, riverMist: 1, embers: 0, heat: 0 },
    exposure: 1.35, bloom: { threshold: 1.0, strength: 0.6, radius: 0.7 }, streak: 0.35, vignette: 0.45, grain: 0.05, chroma: 0.0015,
    grade: "cold", night: 0.1,
  },
  overcast: {
    name: "Overcast day before the battle",
    sun: { elevation: 32, azimuth: 160, color: "#d8dde4", intensity: 1.0 },
    ambient: { sky: "#aab6c4", ground: "#5d574c", intensity: 1.15 },
    sky: { zenith: "#7c8896", horizon: "#c3c7c8", sunGlow: 0.2, stars: 0 },
    fog: { color: "#a9afb4", sunColor: "#c9ccce", density: 0.00016, falloff: 0.006, base: 0, haze: 0.000022 },
    godRays: 0.0, clouds: { cover: 0.85, color: "#9aa2aa", altitude: 1100, speed: 4, dark: 0.5 },
    wind: { dir: 100, strength: 0.7 }, particles: { windDust: 0.4, ash: 0, riverMist: 0.4, embers: 0, heat: 0 },
    exposure: 1.0, bloom: { threshold: 1.2, strength: 0.25, radius: 0.6 }, streak: 0.0, vignette: 0.5, grain: 0.06, chroma: 0.001,
    grade: "cold", night: 0,
  },
  battleNoon: {
    name: "Hot, dusty battle noon",
    sun: { elevation: 58, azimuth: 190, color: "#fff0d0", intensity: 3.0 },
    ambient: { sky: "#c9c2a8", ground: "#7a6a4c", intensity: 0.9 },
    sky: { zenith: "#7d93ad", horizon: "#e2cfa4", sunGlow: 0.6, stars: 0 },
    fog: { color: "#d2bf98", sunColor: "#f2dfb0", density: 0.00055, falloff: 0.02, base: 0, haze: 0.000060 },
    godRays: 0.45, clouds: { cover: 0.12, color: "#f4ead8", altitude: 1800, speed: 3, dark: 0.05 },
    wind: { dir: 300, strength: 1.0 }, particles: { windDust: 1.6, ash: 0, riverMist: 0, embers: 0, heat: 1 },
    exposure: 0.95, bloom: { threshold: 1.1, strength: 0.35, radius: 0.6 }, streak: 0.15, vignette: 0.5, grain: 0.07, chroma: 0.002,
    grade: "ochre", night: 0,
  },
  crimsonSunset: {
    name: "Crimson sunset",
    sun: { elevation: 4, azimuth: 262, color: "#ff8f55", intensity: 2.4 },
    ambient: { sky: "#a07484", ground: "#4a3028", intensity: 1.0 },
    sky: { zenith: "#3a3456", horizon: "#ff8a55", sunGlow: 1.6, stars: 0.05 },
    fog: { color: "#9a7468", sunColor: "#ff8a50", density: 0.00045, falloff: 0.014, base: 0, haze: 0.000045 },
    godRays: 1.1, clouds: { cover: 0.3, color: "#ff8a5a", altitude: 2200, speed: 2, dark: 0.35 },
    wind: { dir: 80, strength: 0.6 }, particles: { windDust: 0.9, ash: 0.3, riverMist: 0.2, embers: 0.2, heat: 0.2 },
    exposure: 1.25, bloom: { threshold: 0.9, strength: 0.8, radius: 0.8 }, streak: 0.5, vignette: 0.55, grain: 0.07, chroma: 0.0025,
    grade: "crimson", night: 0.2,
  },
  night: {
    name: "Night",
    sun: { elevation: -20, azimuth: 270, color: "#000000", intensity: 0 },
    moon: { elevation: 30, azimuth: 140, color: "#9fb4e0", intensity: 0.45 },
    ambient: { sky: "#1c2840", ground: "#0b0c10", intensity: 0.45 },
    sky: { zenith: "#03060f", horizon: "#16223a", sunGlow: 0, stars: 1 },
    fog: { color: "#18202e", sunColor: "#18202e", density: 0.00030, falloff: 0.01, base: 0, haze: 0.000030 },
    godRays: 0, clouds: { cover: 0.3, color: "#2a3448", altitude: 1500, speed: 2, dark: 0.6 },
    wind: { dir: 80, strength: 0.3 }, particles: { windDust: 0, ash: 0, riverMist: 0.7, embers: 0, heat: 0 },
    exposure: 1.3, bloom: { threshold: 0.8, strength: 0.6, radius: 0.7 }, streak: 0.3, vignette: 0.6, grain: 0.09, chroma: 0.002,
    grade: "cold", night: 1,
  },
  burningTbilisi: {
    name: "Tbilisi burning (night)",
    sun: { elevation: -15, azimuth: 270, color: "#000000", intensity: 0 },
    moon: { elevation: 22, azimuth: 120, color: "#8090b8", intensity: 0.25 },
    ambient: { sky: "#3a1c18", ground: "#120806", intensity: 0.5 },
    sky: { zenith: "#07040a", horizon: "#5a1c0e", sunGlow: 0, stars: 0.3 },
    fog: { color: "#4a2418", sunColor: "#4a2418", density: 0.00060, falloff: 0.01, base: 0, haze: 0.000050 },
    godRays: 0, clouds: { cover: 0.55, color: "#3a1a14", altitude: 900, speed: 3, dark: 0.7 },
    wind: { dir: 60, strength: 0.8 }, particles: { windDust: 0, ash: 1.5, riverMist: 0.2, embers: 1.5, heat: 1 },
    exposure: 1.2, bloom: { threshold: 0.75, strength: 1.0, radius: 0.85 }, streak: 0.6, vignette: 0.6, grain: 0.09, chroma: 0.0025,
    grade: "crimson", night: 1,
  },
  finalDawn: {
    name: "Final dawn",
    sun: { elevation: 7, azimuth: 96, color: "#ffd59a", intensity: 2.4 },
    ambient: { sky: "#a6b4d0", ground: "#5a4c3c", intensity: 0.85 },
    sky: { zenith: "#5c7eb0", horizon: "#ffd9a8", sunGlow: 1.6, stars: 0 },
    fog: { color: "#d8c8b0", sunColor: "#ffd6a0", density: 0.00035, falloff: 0.016, base: 0, haze: 0.000025 },
    godRays: 1.0, clouds: { cover: 0.2, color: "#fff0d8", altitude: 1600, speed: 1.5, dark: 0.05 },
    wind: { dir: 100, strength: 0.2 }, particles: { windDust: 0.1, ash: 0.15, riverMist: 1.2, embers: 0, heat: 0 },
    exposure: 1.0, bloom: { threshold: 0.95, strength: 0.7, radius: 0.8 }, streak: 0.4, vignette: 0.45, grain: 0.05, chroma: 0.0012,
    grade: "gold", night: 0,
  },
};

export type PresetName = keyof typeof PRESETS;
