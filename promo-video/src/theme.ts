// Vizuální identita převzatá z aplikace (tailwind.config.js, src/styles/home/main.css).
export const COLORS = {
  bg: "#0d0d0d",
  surface: "#161616",
  surfaceElevated: "#1e1e1e",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#f0f0f0",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  accent: "#10b981",
  accentLight: "#4edea3",
  accentGlow: "rgba(16,185,129,0.18)",
  // Barvy sekcí z domovské stránky (--c-tools, --c-edu, …).
  tools: "#41983e",
  games: "#d06639",
  edu: "#966ac8",
  services: "#3195b9",
  account: "#b2ae34",
  space: "#3fa9d6",
  art: "#ca4978",
} as const;

export const FONTS = {
  display: "'Bricolage Grotesque', system-ui, sans-serif",
  text: "'Geist', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
} as const;

export const FPS = 30;
