// Sdílené skeleton primitivy pro loading.tsx, Suspense fallbacky a klientské načítání.
// Barva je odvozená z currentColor, takže sedí ve světlém i tmavém tématu každé sekce
// (data-theme i systémové nastavení) bez vlastních tokenů. Styly: globals.css (.sk-*).
import type { CSSProperties, ReactNode } from "react";

type Size = number | string;
const px = (v: Size | undefined) => (typeof v === "number" ? `${v}px` : v);

export function Skeleton({
  width,
  height = "1em",
  radius,
  className,
  style,
}: {
  width?: Size;
  height?: Size;
  radius?: Size;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={className ? `sk ${className}` : "sk"}
      style={{ width: px(width), height: px(height), borderRadius: px(radius), ...style }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  lineHeight = "0.9em",
  className,
  style,
}: {
  lines?: number;
  lastLineWidth?: Size;
  lineHeight?: Size;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span aria-hidden="true" className={className ? `sk-text ${className}` : "sk-text"} style={style}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={lineHeight} width={i === lines - 1 && lines > 1 ? lastLineWidth : "100%"} />
      ))}
    </span>
  );
}

export function SkeletonCard({
  mediaHeight,
  lines = 2,
  className,
  style,
}: {
  mediaHeight?: Size;
  lines?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span aria-hidden="true" className={className ? `sk-card ${className}` : "sk-card"} style={style}>
      {mediaHeight ? <Skeleton height={mediaHeight} radius="0.5rem" /> : null}
      <Skeleton height="1.15em" width="70%" />
      <SkeletonText lines={lines} />
    </span>
  );
}

export function SkeletonGrid({
  count = 6,
  minWidth = "16rem",
  gap,
  className,
  card,
}: {
  count?: number;
  minWidth?: Size;
  gap?: Size;
  className?: string;
  card?: Omit<Parameters<typeof SkeletonCard>[0], "className" | "style">;
}) {
  return (
    <span
      aria-hidden="true"
      className={className ? `sk-grid ${className}` : "sk-grid"}
      style={{ "--sk-min": px(minWidth), gap: px(gap) } as CSSProperties}
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} {...card} />
      ))}
    </span>
  );
}

/** Obal pro celou načítací plochu: oznámí čtečkám obrazovky, že se načítá (vizuálně skryté). */
export function SkeletonRegion({
  label = "Načítání…",
  className,
  style,
  children,
}: {
  label?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className} style={style}>
      <span className="sk-sr">{label}</span>
      {children}
    </div>
  );
}
