// Téma clean (SŠ): věcný přehled bez ilustrací. Přepínač Karty / Tabulka; tabulka má záhlaví
// a popisek pro čtečky, postup je tenký ukazatel u každého levelu.

import Link from "next/link";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { levelPath } from "@/lib/edu/aifb/routes";
import type { CategoryId } from "@/lib/edu/aifb/types";
import { lessonsLabel, type EduLocale } from "@/lib/edu/i18n-data";
import type { LevelProgress } from "./adventure-map";
import { LevelCard, type LevelSummary } from "./level-card";
import { LockBadge } from "./access-ui";
import { CertBadge, ProgressBadge } from "./shared";

export function CleanOverview({
  locale, categoryId, levels, progress, view,
}: { locale: EduLocale; categoryId: CategoryId; levels: LevelSummary[]; progress?: LevelProgress; view: "cards" | "table" }) {
  const t = aifbT(locale);
  const statusOf = (level: LevelSummary) => {
    const p = progress?.[level.id];
    if (!p || p.done === 0) return t("aifb.status.todo");
    return p.done >= p.total ? t("aifb.status.done") : t("aifb.status.started");
  };
  if (view === "cards") {
    return (
      <ol className="aifb-level-list">
        {levels.map((level) => {
          const p = progress?.[level.id];
          return (
            <LevelCard
              key={level.id}
              locale={locale}
              categoryId={categoryId}
              level={level}
              progress={p ? <ProgressBadge done={p.done} total={p.total} label={t("aifb.progress.label")} /> : undefined}
            />
          );
        })}
      </ol>
    );
  }
  return (
    <div className="aifb-table-wrap" tabIndex={0} role="region" aria-label={t("aifb.category.levels")}>
      <table className="aifb-table aifb-table--levels">
        <caption className="aifb-sr">{t("aifb.category.levels")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("aifb.table.level")}</th>
            <th scope="col">{t("aifb.table.title")}</th>
            <th scope="col">{t("aifb.table.hours")}</th>
            <th scope="col">{t("aifb.table.grade")}</th>
            <th scope="col">{t("aifb.table.status")}</th>
            <th scope="col">{t("aifb.table.cert")}</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((level) => {
            const p = progress?.[level.id];
            return (
              <tr key={level.id}>
                <th scope="row"><Link href={levelPath(locale, categoryId, level.slug)}>{level.code}</Link></th>
                <td>
                  <strong>{level.title}</strong>
                  {level.subtitle ? <><br />{level.subtitle}</> : null}
                  <br />{t("aifb.level.structure", { lessons: lessonsLabel(level.lessonCount - 1, locale) })}
                </td>
                <td>{level.hours}</td>
                <td>{level.grades ?? level.recommendedPlacement ?? ""}{level.advanced ? <><br /><span className="aifb-badge">{t("aifb.level.advanced")}</span></> : null}</td>
                <td>
                  {level.unlocked !== undefined ? <><LockBadge unlocked={level.unlocked} total={level.lessonCount} t={t} /><br /></> : null}
                  {statusOf(level)}
                  {p ? <ProgressBadge done={p.done} total={p.total} label={t("aifb.progress.label")} /> : null}
                </td>
                <td><CertBadge certification={level.certification} t={t} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
