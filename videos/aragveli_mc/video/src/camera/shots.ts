// Camera positions and trajectories placed on the real relief ahead of the scenes (local metres, y = metres above ground).
// Each entry is labelled with the script scene it serves. Flyovers F1–F8 are the stage-1 checks.
import { PresetName } from "../config/presets";
import { alongPolyline, RETREAT, TB } from "../world/locations";
import { dolly, Move, orbit, track, Vec3 } from "./rig";

export interface CamPos { id: string; scene: string; label: string; pos: Vec3; target: Vec3; lens: number; region: "tbilisi" | "aragvi" }

/** Static camera positions (anchors) for the storyboard; y is above ground. */
export const CAMERA_POSITIONS: CamPos[] = [
  { id: "P01", scene: "S1", region: "aragvi", label: "Aragvi gorge, high above the river looking south", pos: [-1500, 420, 2600], target: [-1450, 30, 300], lens: 24 },
  { id: "P02", scene: "S1", region: "aragvi", label: "Tower on the spur, low angle", pos: [-1500, 6, 380], target: [-1450, 22, 300], lens: 18 },
  { id: "P03", scene: "S1/S3", region: "tbilisi", label: "Over the Krtsanisi field, wide establishing", pos: [700, 650, 600], target: [2600, 0, 2600], lens: 24 },
  { id: "P04", scene: "S3", region: "tbilisi", label: "Along the future Georgian line (ground level)", pos: [1700, 3.5, 1100], target: [2700, 2, 1900], lens: 35 },
  { id: "P05", scene: "S3", region: "tbilisi", label: "Hill behind the line — the king's vantage point", pos: [1500, 14, 700], target: [3200, 0, 3600], lens: 50 },
  { id: "P06", scene: "S3", region: "tbilisi", label: "Road from the south — where the Qajar army appears", pos: [3290, 30, 3300], target: [3300, 0, 5600], lens: 85 },
  { id: "P07", scene: "S4", region: "tbilisi", label: "Mid-field, between the lines (sword fights)", pos: [2600, 2.2, 2300], target: [2900, 1.6, 2600], lens: 35 },
  { id: "P08", scene: "S4", region: "tbilisi", label: "Ridge above the field, flanking view", pos: [900, 120, 2600], target: [2600, 0, 2600], lens: 50 },
  { id: "P09", scene: "S5", region: "tbilisi", label: "Command rise — the king forced to withdraw", pos: [1450, 3, 650], target: [1520, 2.5, 720], lens: 85 },
  { id: "P10", scene: "S6", region: "tbilisi", label: "King's withdrawal road towards the city", pos: [-1600, 25, -2500], target: [-3219, 0, -3396], lens: 50 },
  { id: "P11", scene: "S6", region: "tbilisi", label: "Last stand — approaches and Mtkvari bank (orbit centre)", pos: [-3420, 14, -3450], target: [-3300, 2, -3450], lens: 35 },
  { id: "P12", scene: "S6", region: "tbilisi", label: "Last stand — low angle from the river bank", pos: [-3690, 1.5, -3850], target: [-3600, 3, -3780], lens: 24 },
  { id: "P13", scene: "S7", region: "tbilisi", label: "Tbilisi from the left bank (Avlabari heights)", pos: [-3900, 120, -4700], target: [-4700, 20, -4200], lens: 35 },
  { id: "P14", scene: "S7", region: "tbilisi", label: "Over the old city towards Narikala", pos: [-4500, 160, -4900], target: [-4644, 30, -4028], lens: 24 },
  { id: "P15", scene: "S7", region: "tbilisi", label: "Metekhi cliff and the old bridge", pos: [-4380, 12, -4380], target: [-4574, 6, -4315], lens: 35 },
  { id: "P16", scene: "S7", region: "tbilisi", label: "Place of memory at dawn (symbolic)", pos: [-3700, 6, -3860], target: [-3753, 4, -3894], lens: 50 },
];

export interface Flyover { id: string; title: string; location: string; region: "tbilisi" | "aragvi"; preset: PresetName; move: Move; burn?: number; dustRoad?: boolean; seconds: number }

const R = (u: number) => alongPolyline(RETREAT, u);

export const FLYOVERS: Flyover[] = [
  { id: "F1", title: "Aragvi gorge at dawn", location: "(d) Aragvi valley, towers", region: "aragvi", preset: "dawn", seconds: 7,
    move: { ...dolly("F1", "Crane down the Aragvi gorge towards the tower", [-1560, 420, 2700], [-1530, 120, 1100], [[-1450, 20, 300], [-1450, 24, 300]], 7, 24), vertical: { crop: 0.55 } } },
  { id: "F2", title: "Krtsanisi field, overcast", location: "(a) Krtsanisi field", region: "tbilisi", preset: "overcast", seconds: 7,
    move: { ...orbit("F2", "High orbit over the empty Krtsanisi field", [2600, 0, 2600], 1700, 650, 200, 228, 7, 24), vertical: { crop: 0.6 } } },
  { id: "F3", title: "Battle lines, dusty noon", location: "(a) future Georgian line", region: "tbilisi", preset: "battleNoon", seconds: 7, dustRoad: true,
    move: { ...track("F3", "Low tracking along the future Georgian line", [[1650, 1060], [1900, 1260], [2150, 1460], [2400, 1660]], 3.2, 140, 4, 7, 35, 90), handheld: { amp: 0.35, freq: 1.3 }, vertical: { crop: 0.55, pan: 0.25 } } },
  { id: "F4", title: "The king's road, sunset", location: "withdrawal road to the city", region: "tbilisi", preset: "crimsonSunset", seconds: 7,
    move: { ...track("F4", "Tracking along the king's withdrawal road", [R(0.5), R(0.55), R(0.6), R(0.64)], 26, 300, 10, 7, 35), vertical: { crop: 0.55 } } },
  { id: "F5", title: "Last stand, crimson", location: "(b) approaches & Mtkvari bank", region: "tbilisi", preset: "crimsonSunset", seconds: 7,
    move: { ...orbit("F5", "Orbit around the place of the last stand (Mtkvari bank near Ortachala)", [-3300, 2, -3450], 120, 14, 200, 245, 7, 35), vertical: { crop: 0.6 } } },
  { id: "F6", title: "Tbilisi intact", location: "(c) Kala, Narikala, Metekhi", region: "tbilisi", preset: "overcast", seconds: 7,
    move: { ...dolly("F6", "Glide over the old city towards Narikala", [-4420, 180, -5200], [-4520, 130, -4650], [[-4644, 20, -4028], [-4644, 30, -4028]], 7, 24), vertical: { crop: 0.6 } } },
  { id: "F7", title: "Tbilisi burning", location: "(c) Tbilisi, burning", region: "tbilisi", preset: "burningTbilisi", seconds: 7, burn: 1,
    move: { ...dolly("F7", "Push-in across the river towards the burning city", [-3820, 110, -4760], [-4120, 70, -4560], [[-4700, 15, -4250], [-4700, 15, -4200]], 7, 35), vertical: { crop: 0.6 } } },
  { id: "F8", title: "Place of memory, final dawn", location: "(e) place of memory", region: "tbilisi", preset: "finalDawn", seconds: 7,
    move: { ...dolly("F8", "Pull back and up from the memorial stone over the river mist", [-3735, 3, -3880], [-3640, 55, -3790], [[-3753, 4, -3894], [-3770, 2, -3920]], 7, 50, "inOutCubic"), vertical: { crop: 0.55 } } },
];

export interface Still { id: string; title: string; region: "tbilisi"; preset: PresetName; move: Move; t: number; burn?: number; dustRoad?: boolean }
export const STILLS: Still[] = [
  { id: "dawn", title: "Dawn before the battle", region: "tbilisi", preset: "dawn", t: 0,
    move: { id: "s1", label: "", agl: true, keys: [{ t: 0, pos: [1350, 22, 520], target: [3400, 20, 2600], lens: 35, fstop: 4, focus: 300 }, { t: 1, pos: [1350, 22, 520], target: [3400, 20, 2600], lens: 35 }] } },
  { id: "battle", title: "Dusty battlefield (no armies)", region: "tbilisi", preset: "battleNoon", t: 3, dustRoad: true,
    move: { id: "s2", label: "", agl: true, keys: [{ t: 0, pos: [2100, 2.4, 1600], target: [3000, 6, 3200], lens: 24, fstop: 2.8, focus: 25 }, { t: 1, pos: [2100, 2.4, 1600], target: [3000, 6, 3200], lens: 24 }] } },
  { id: "sunset", title: "Crimson sunset over the approaches", region: "tbilisi", preset: "crimsonSunset", t: 0,
    move: { id: "s3", label: "", agl: true, keys: [{ t: 0, pos: [-2600, 30, -3000], target: [-4200, 60, -3700], lens: 35, fstop: 0 }, { t: 1, pos: [-2600, 30, -3000], target: [-4200, 60, -3700], lens: 35 }] } },
  { id: "burning", title: "Tbilisi burning", region: "tbilisi", preset: "burningTbilisi", t: 4, burn: 1,
    move: { id: "s4", label: "", agl: true, keys: [{ t: 0, pos: [-3950, 95, -4700], target: [-4700, 15, -4220], lens: 35, fstop: 0 }, { t: 1, pos: [-3950, 95, -4700], target: [-4700, 15, -4220], lens: 35 }] } },
];

export const MEMORIAL_STONE = TB.memorial;
