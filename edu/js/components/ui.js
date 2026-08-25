// Sdílené UI primitivy – port XPBadge.tsx a CircularProgress.tsx

import { icon } from "../lib/dom.js";

// XPBadge – žlutý badge „<xp> XP" s bleskem
export function XPBadge({ xp, size = "sm", extraClass = "" } = {}) {
  const isSmall = size === "sm";
  const sizeCls = isSmall
    ? "text-[10px] px-1.5 py-0.5 rounded-md"
    : "text-xs px-2 py-1 rounded-lg";
  return `<span class="inline-flex items-center gap-1 font-medium border border-amber-500/20 whitespace-nowrap ${sizeCls} ${extraClass}" style="color:#f0ad4e;background-color:rgba(240,173,78,0.1)">${icon("zap", isSmall ? "h-2.5 w-2.5" : "h-3 w-3")}${xp} XP</span>`;
}

// CircularProgress – kruhový progress (SVG). Vrací HTML řetězec.
export function CircularProgress({
  percent = 0,
  size = 90,
  stroke = 7,
  color = "#00d084",
  trackColor = "var(--color-input-bg)",
  showLabel = true,
  label = null,
} = {}) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  const labelText = label != null ? label : `${percent}%`;
  const labelEsc = String(labelText).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg width="${size}" height="${size}" class="rotate-[-90deg]" style="color:${trackColor}"><circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="currentColor" stroke-width="${stroke}" style="color:${trackColor}"></circle><circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" class="transition-all duration-700"></circle>${showLabel ? `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" class="fill-[var(--color-text-primary)] text-[13px] font-bold" style="transform:rotate(90deg);transform-origin:center">${labelEsc}</text>` : ""}</svg>`;
}
