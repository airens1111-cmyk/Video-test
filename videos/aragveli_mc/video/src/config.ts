// Output format. Switch FORMAT to "16x9" (or env REMOTION_FORMAT) for the landscape version.
export type Format = "9x16" | "16x9";
const env = (typeof process !== "undefined" && process.env && process.env.REMOTION_FORMAT) as Format | undefined;
export const FORMAT: Format = env === "16x9" ? "16x9" : "9x16";

export const SIZES: Record<Format, { width: number; height: number }> = {
  "9x16": { width: 1080, height: 1920 },
  "16x9": { width: 1920, height: 1080 },
};
export const FPS = 30;
export const { width: WIDTH, height: HEIGHT } = SIZES[FORMAT];
export const ASPECT = WIDTH / HEIGHT;

// Instagram UI safe zones (in 1080x1920 space): keep text out of these.
export const SAFE_TOP = 250;
export const SAFE_BOTTOM = 350;

export const ACCOUNT = "კლონი";
