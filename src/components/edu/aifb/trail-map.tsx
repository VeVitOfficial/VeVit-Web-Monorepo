// Téma trail (2. stupeň ZŠ): klikatá stezka se zastávkami (levely) a ukazatelem XP. Hravé, ale
// ne dětinské: expedice a odznaky. Zastávka ukazuje číslo levelu, název, hodiny a štítek
// certifikace („Připravuje se"); levely 4–6 mají štítek „Pro pokročilé".

import Link from "next/link";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { levelPath } from "@/lib/edu/aifb/routes";
import type { CategoryId } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import type { LevelProgress } from "./adventure-map";
import { lessonsLabel } from "@/lib/edu/i18n-data";
import type { LevelSummary } from "./level-card";
import { CertBadge, ProgressBadge } from "./shared";

export function XpMeter({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="aifb-xp" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} / ${max} ${unit}`}>
      <span className="aifb-xp__label">{label}</span>
      <span className="aifb-xp__bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      <span className="aifb-xp__value">{value} / {max} {unit}</span>
    </div>
  );
}

export function TrailMap({
  locale, categoryId, levels, progress, xp, xpMax,
}: { locale: EduLocale; categoryId: CategoryId; levels: LevelSummary[]; progress?: LevelProgress; xp: number; xpMax: number }) {
  const t = aifbT(locale);
  const isDone = (level: LevelSummary) => {
    const p = progress?.[level.id];
    return p !== undefined && p.total > 0 && p.done >= p.total;
  };
  const currentIndex = Math.max(0, levels.findIndex((level) => !isDone(level)));
  return (
    <div className="aifb-trail-wrap">
      <XpMeter label={t("aifb.trail.xp")} value={xp} max={xpMax} unit={t("aifb.xp.unit")} />
      <ol className="aifb-trail">
        {levels.map((level, index) => {
          const done = isDone(level);
          const current = index === currentIndex && !done;
          const p = progress?.[level.id];
          return (
            <li key={level.id} className={`aifb-stop${index % 2 === 1 ? " aifb-stop--right" : ""}`}>
              <span className="aifb-stop__node" data-state={done ? "done" : current ? "current" : "todo"} aria-hidden="true">{level.order}</span>
              <Link href={levelPath(locale, categoryId, level.slug)} className="aifb-stop__card">
                <span className="aifb-level-card__code">
                  {t("aifb.theme.trail.level")} {level.order}
                  {current ? ` · ${t("aifb.map.current")}` : ""}
                  {done ? ` · ${t("aifb.theme.trail.done")}` : ""}
                </span>
                <span className="aifb-level-card__title">{level.title}</span>
                {level.subtitle ? <span className="aifb-level-card__sub">{level.subtitle}</span> : null}
                <span className="aifb-level-card__meta">
                  {level.grades ?? level.recommendedPlacement ?? ""}{" · "}{level.hours}{" · "}{lessonsLabel(level.lessonCount, locale)}
                </span>
                <span className="aifb-level-card__badges">
                  {level.advanced ? <span className="aifb-badge">{t("aifb.level.advanced")}</span> : null}
                  <CertBadge certification={level.certification} t={t} />
                </span>
                {p ? <ProgressBadge done={p.done} total={p.total} label={t("aifb.progress.label")} /> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
