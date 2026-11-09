// Channel and look settings. Edit here, not in components.
export const config = {
  name: "კლონი",
  // Handle is kept here but hidden by default.
  handle: "@klon",
  showHandle: false,
  slogan: "მეფედრონი · როგორ მოქმედებს",
  avatar: "avatar.png",
  outroLine: "მეტი მარტივი ახსნა — ჩვენს არხზე",
  // Voice used by tools/tts.py (it parses this block).
  voice: {
    name: "ka-GE-GiorgiNeural",
    rate: "+8%",
    pitch: "+3Hz",
  },
  video: { width: 1080, height: 1920, fps: 30 },
  // Instagram UI zones kept free of text (px from top / bottom).
  safe: { top: 250, bottom: 350 },
  colors: {
    bgTop: "#0c2152",
    bgBottom: "#040b20",
    grid: "rgba(130, 170, 255, 0.055)",
    accent: "#34E3DC", // teal from the avatar ring
    yellow: "#F7D046",
    danger: "#FF6A4D",
    text: "#FFFFFF",
    dim: "#6F80A8",
    line: "#D5E6FF",
    subtitleIdle: "#5E6C8F",
  },
  fonts: {
    ka: "'Noto Sans Georgian', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
} as const;

export type ColorKey = keyof typeof config.colors;
