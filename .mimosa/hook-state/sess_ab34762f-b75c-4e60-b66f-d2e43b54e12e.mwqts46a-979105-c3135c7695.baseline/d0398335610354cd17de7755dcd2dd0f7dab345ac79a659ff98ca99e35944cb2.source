import { ICON_PATHS, type AppIcon } from "./scene-data";

export function SceneIcon({ name, size = 24 }: { name: AppIcon | "arrow" | "sparkles"; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
