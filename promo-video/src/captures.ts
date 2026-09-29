import { staticFile } from "remotion";
import manifest from "./captures.json";

// Rozměry záběrů v CSS px (screenshoty jsou @2x desktop / @3x mobil).
export type CaptureInfo = { width: number; height: number; frames: number };

const CAPTURES = manifest as Record<string, CaptureInfo>;

export function captureInfo(key: string): CaptureInfo {
  const info = CAPTURES[key];
  if (!info) throw new Error(`Chybí záběr „${key}“ – spusť npm run capture (viz README).`);
  return info;
}

export function captureSrc(key: string, frame = 0): string {
  const info = captureInfo(key);
  if (info.frames > 1) {
    const index = Math.max(0, Math.min(info.frames - 1, frame));
    return staticFile(`captures/${key}/${String(index).padStart(3, "0")}.jpg`);
  }
  return staticFile(`captures/${key}.jpg`);
}
