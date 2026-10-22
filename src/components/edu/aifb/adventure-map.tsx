// Téma pirate-map (1. stupeň ZŠ): noční mořská mapa s ostrovy. Ostrovy jsou skutečné odkazy
// umístěné podle level.visual (x, y v %), mezi nimi vede čárkovaná cesta; lodička označuje
// aktuální ostrov a otevřená truhla dokončený. Na úzkém displeji se ostrovy skládají do
// svislého klikatého pásu (x a y se ignorují). SVG je jen dekorace (aria-hidden); stejná
// data jsou dostupná v seznamovém zobrazení.

import Link from "next/link";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { levelPath } from "@/lib/edu/aifb/routes";
import type { CategoryId } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import type { LevelSummary } from "./level-card";
import { ProgressBadge } from "./shared";

export type LevelProgress = Record<string, { done: number; total: number }>;

const VIEW_W = 1000;
const VIEW_H = 600;

function islandPoints(levels: LevelSummary[]): { x: number; y: number }[] {
  return levels.map((level, index) => ({
    x: level.visual?.x ?? ((index + 0.5) / levels.length) * 100,
    y: level.visual?.y ?? (index % 2 === 0 ? 62 : 36),
  }));
}

/** Plynulá cesta mezi ostrovy (kubické křivky s vodorovnými tečnami). */
export function routePath(points: { x: number; y: number }[]): string {
  const scaled = points.map((point) => ({ x: (point.x / 100) * VIEW_W, y: (point.y / 100) * VIEW_H }));
  return scaled
    .map((point, index) => {
      if (index === 0) return `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      const prev = scaled[index - 1];
      const dx = (point.x - prev.x) / 2;
      return `C ${(prev.x + dx).toFixed(1)} ${prev.y.toFixed(1)} ${(point.x - dx).toFixed(1)} ${point.y.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(" ");
}

function IslandShape({ flip }: { flip: boolean }) {
  return (
    <svg className="aifb-island__shape" viewBox="0 0 120 92" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path className="aifb-island__sand" d="M8 56 C4 32 28 12 58 14 C88 10 116 28 112 54 C110 76 80 86 56 84 C28 86 10 78 8 56Z" />
      <path className="aifb-island__grass" d="M24 52 C22 36 42 24 60 26 C80 24 98 36 96 52 C94 66 76 72 58 70 C40 72 26 64 24 52Z" />
      <path className="aifb-island__palm" d="M64 52 C64 44 66 36 70 28" fill="none" />
      <path className="aifb-island__leaf" d="M70 28 C60 22 52 26 48 32 C56 28 62 28 70 28Z M70 28 C80 20 90 24 92 32 C84 26 78 26 70 28Z M70 28 C66 18 72 12 80 12 C76 18 74 22 70 28Z" />
    </svg>
  );
}

function ShipIcon() {
  return (
    <svg className="aifb-island__ship" viewBox="0 0 40 40" aria-hidden="true">
      <path className="aifb-ship__sail" d="M20 6 L20 26 L8 26Z M22 10 L22 26 L32 26Z" />
      <path className="aifb-ship__hull" d="M4 28 H36 L31 35 H9Z" />
    </svg>
  );
}

function ChestIcon() {
  return (
    <svg className="aifb-island__chest" viewBox="0 0 40 32" aria-hidden="true">
      <path className="aifb-chest__lid" d="M4 12 C4 4 36 4 36 12 L30 4 H10Z" />
      <rect className="aifb-chest__body" x="6" y="14" width="28" height="14" rx="3" />
      <circle className="aifb-chest__gem" cx="20" cy="12" r="4" />
    </svg>
  );
}

export function AdventureMap({
  locale, categoryId, levels, progress,
}: { locale: EduLocale; categoryId: CategoryId; levels: LevelSummary[]; progress?: LevelProgress }) {
  const t = aifbT(locale);
  const points = islandPoints(levels);
  const done = (level: LevelSummary) => {
    const p = progress?.[level.id];
    return p !== undefined && p.total > 0 && p.done >= p.total;
  };
  const currentIndex = Math.max(0, levels.findIndex((level) => !done(level)));
  const doneLabel = t("aifb.theme.pirate-map.done");

  return (
    <div className="aifb-map">
      <svg className="aifb-map__sea" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="aifb-waves" width="90" height="46" patternUnits="userSpaceOnUse">
            <path d="M0 23 q22 -16 45 0 t45 0" fill="none" />
          </pattern>
        </defs>
        <rect className="aifb-map__waves" width={VIEW_W} height={VIEW_H} fill="url(#aifb-waves)" />
        <path className="aifb-map__route" d={routePath(points)} fill="none" />
        <g className="aifb-map__compass" transform="translate(920 530)">
          <circle r="34" fill="none" />
          <path d="M0 -30 L7 0 L0 30 L-7 0Z M-30 0 L0 -7 L30 0 L0 7Z" />
        </g>
      </svg>
      <ol className="aifb-map__islands">
        {levels.map((level, index) => {
          const isDone = done(level);
          const isCurrent = index === currentIndex && !isDone;
          const p = progress?.[level.id];
          return (
            <li
              key={level.id}
              className="aifb-map__stop"
              style={{ "--x": `${points[index].x}%`, "--y": `${points[index].y}%` } as React.CSSProperties}
            >
              <Link href={levelPath(locale, categoryId, level.slug)} className="aifb-island" data-state={isDone ? "done" : isCurrent ? "current" : "todo"}>
                <span className="aifb-island__art">
                  <IslandShape flip={index % 2 === 1} />
                  {level.visual?.icon ? <span className="aifb-island__icon" aria-hidden="true">{level.visual.icon}</span> : null}
                  {isCurrent ? <ShipIcon /> : null}
                  {isDone ? <ChestIcon /> : null}
                </span>
                <span className="aifb-island__name">{level.visual?.islandName ?? level.title}</span>
                <span className="aifb-island__sub">{level.code}: {level.title}</span>
                {isCurrent ? <span className="aifb-island__tag">{t("aifb.map.current")}</span> : null}
                {isDone ? <span className="aifb-island__tag">{doneLabel}</span> : null}
                {p ? <ProgressBadge done={p.done} total={p.total} label={t("aifb.progress.label")} /> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
