import type { CSSProperties } from "react";

// Lucide ikona — legacy <i data-lucide="...">. Po načtení lucide.min.js
// volá window.lucide.createIcons() <i> nahrazuje za <svg> se stejnými
// rozměry. React nerenderuje tyto uzly znovu (žádný state na subtree),
// takže imperativní mutace lucide zůstane zachovaná.
export function Icon({
  name,
  size = 20,
  className,
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <i
      data-lucide={name}
      className={className}
      style={{ width: size, height: size, ...style }}
    />
  );
}