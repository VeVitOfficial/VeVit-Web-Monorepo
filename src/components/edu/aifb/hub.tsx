// Hub AIFB (/edu/ai-gramotnost): výběr kategorie. Data jen z katalogu, obsah se nenačítá.

import Link from "next/link";
import { Icon } from "../pages/home-icons";
import { AiScene } from "../pages/soon-scenes";
import { aifbT, countWord } from "@/lib/edu/aifb/i18n";
import { categoryPath, guidePath, hubPath } from "@/lib/edu/aifb/routes";
import type { Catalog, CatalogCategory } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { lessonsLabel } from "@/lib/edu/i18n-data";
import { Crumbs } from "./crumbs";

// Barvy kategorií jsou tokeny z aifb.css (paleta kurzů Edu), v komponentě žádné pevné barvy.
const CARD_STYLE: Record<string, { color: string; icon: string }> = {
  zs1: { color: "var(--aifb-gold)", icon: "sparkles" },
  zs2: { color: "var(--aifb-sky)", icon: "workflow" },
  ss: { color: "var(--aifb-violet)", icon: "cpu" },
  kurz: { color: "var(--aifb-slate)", icon: "book-open" },
};

function CategoryCard({ category, locale }: { category: CatalogCategory; locale: EduLocale }) {
  const t = aifbT(locale);
  const style = CARD_STYLE[category.id] ?? CARD_STYLE.kurz;
  const css = { "--c": style.color } as React.CSSProperties;
  const available = category.status === "content-ready";
  const body = (
    <div className={`eh-card eh-card--big${available ? "" : " eh-card--off"}`} style={css}>
      <span className="eh-hexicon"><Icon name={style.icon} /></span>
      <div className="eh-card__body">
        <h3>{category.title}</h3>
        <p>{available ? category.subtitle : t("aifb.hub.legacyCourse")}</p>
        {available ? (
          <p className="aifb-card-meta">
            <span className="eh-badge">{category.grades}</span>{" "}
            <span className="eh-badge">{countWord(t, `aifb.unit.${category.unit}`, category.totals.levels)}</span>{" "}
            <span className="eh-badge">{lessonsLabel(category.totals.lessons, locale)}</span>
          </p>
        ) : (
          <span className="eh-badge">{t("aifb.comingSoon")}</span>
        )}
      </div>
    </div>
  );
  if (!available) {
    return <li className="eh-cell eh-cell--big">{body}</li>;
  }
  return (
    <li className="eh-cell eh-cell--big">
      <Link href={categoryPath(locale, category.id)} className="aifb-card-link">{body}</Link>
    </li>
  );
}

export function Hub({ locale, catalog }: { locale: EduLocale; catalog: Catalog }) {
  const t = aifbT(locale);
  const teachable = catalog.categories.filter((category) => category.status === "content-ready");
  return (
    <>
      <Crumbs
        label={t("aifb.crumbs.label")}
        items={[{ label: t("aifb.crumbs.edu"), href: `/${locale}/edu` }, { label: t("aifb.crumbs.hub"), href: hubPath(locale) }]}
      />
      <section className="eh-hero es-topic es-topic--ai" aria-labelledby="aifb-hub-title">
        <div className="eh-hero__text">
          <h1 className="eh-title es-title" id="aifb-hub-title">
            <span>{t("aifb.hub.title")}</span>
            <span>AIFB</span>
          </h1>
          <p className="eh-lead">{t("aifb.hub.lead")}</p>
        </div>
        <div className="eh-art es-art">
          <div className="eh-hex eh-hex--ring es-ring" aria-hidden="true" />
          <div className="eh-hex eh-hex--core es-core" aria-hidden="true" />
          <AiScene />
          <p className="es-caption">{t("aifb.hub.heroCaption")}</p>
        </div>
      </section>

      <section aria-labelledby="aifb-cards-title" className="aifb-section">
        <h2 className="eh-h2" id="aifb-cards-title"><span className="eh-bullet" aria-hidden="true" />{t("aifb.hub.cards")}</h2>
        <ul className="eh-cats aifb-card-list">
          {catalog.categories.map((category) => (
            <CategoryCard key={category.id} category={category} locale={locale} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="aifb-teachers-title" className="aifb-section">
        <h2 className="eh-h2" id="aifb-teachers-title"><span className="eh-bullet" aria-hidden="true" />{t("aifb.hub.teachers.title")}</h2>
        <p className="aifb-lead">{t("aifb.hub.teachers.lead")}</p>
        <ul className="aifb-link-list">
          {teachable.map((category) => (
            <li key={category.id}>
              <Link href={guidePath(locale, category.id)}>{t("aifb.hub.teachers.link", { category: category.title })}</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
