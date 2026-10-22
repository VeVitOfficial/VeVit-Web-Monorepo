// Přehled kategorie: výběr levelu. Téma (pirate-map / trail / clean) určuje vzhled přehledu.

import Link from "next/link";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { categoryPath, guidePath, hubPath } from "@/lib/edu/aifb/routes";
import type { AifbContent } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { Crumbs } from "./crumbs";
import { levelUnitCount, toLevelSummary } from "./level-card";
import { LevelsOverview } from "./levels-overview";

export function CategoryView({ locale, content }: { locale: EduLocale; content: AifbContent }) {
  const t = aifbT(locale);
  const { category } = content;
  return (
    <>
      <Crumbs
        label={t("aifb.crumbs.label")}
        items={[
          { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
          { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
          { label: category.title, href: categoryPath(locale, category.id) },
        ]}
      />
      <header className="aifb-head">
        <h1>{category.title}</h1>
        <p className="aifb-lead">{category.subtitle}</p>
        <p className="aifb-chips">
          <span className="aifb-badge">{category.grades}</span>
          <span className="aifb-badge">{levelUnitCount(t, category.unit, content.levels.length)}</span>
          <span className="aifb-badge">{t(`aifb.usage.${category.usageMode}`)}</span>
        </p>
        <p className="aifb-muted">{category.audience}</p>
        <p><Link href={guidePath(locale, category.id)} className="aifb-textlink">{t("aifb.category.guideLink")}</Link></p>
      </header>
      <section className="aifb-section" aria-labelledby="aifb-levels-title">
        <h2 className="eh-h2" id="aifb-levels-title"><span className="eh-bullet" aria-hidden="true" />{t("aifb.category.levels")}</h2>
        <p className="aifb-muted">{t("aifb.category.order", { unit: category.unit.toLowerCase() === "blok" ? "blok" : "level" })}</p>
        <LevelsOverview categoryId={category.id} theme={category.theme} levels={content.levels.map((level) => toLevelSummary(category.id, level))} />
      </section>
    </>
  );
}
