// Hub AIFB (/edu/ai-gramotnost): výběr kategorie. Data jen z katalogu, obsah se nenačítá.

import Link from "next/link";
import { isStaff, visibleCategories, type AifbAccess } from "@/lib/edu/aifb/access";
import { Icon } from "../pages/home-icons";
import { AiScene } from "../pages/soon-scenes";
import { aifbT, countWord } from "@/lib/edu/aifb/i18n";
import { courseTotals, moduleLessonIds, type Course } from "@/lib/edu/aifb/course";
import { categoryPath, coursePath, editorPath, guidePath, hubPath, teacherPath } from "@/lib/edu/aifb/routes";
import type { Catalog, CatalogCategory } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { lessonsLabel } from "@/lib/edu/i18n-data";
import { NoClassNotice } from "./access-ui";
import { Crumbs } from "./crumbs";
import { ProgressTransfer } from "./progress-transfer";

// Barvy kategorií jsou tokeny z aifb.css (paleta kurzů Edu), v komponentě žádné pevné barvy.
const CARD_STYLE: Record<string, { color: string; icon: string }> = {
  zs1: { color: "var(--aifb-gold)", icon: "sparkles" },
  zs2: { color: "var(--aifb-sky)", icon: "workflow" },
  ss: { color: "var(--aifb-violet)", icon: "cpu" },
  kurz: { color: "var(--aifb-slate)", icon: "book-open" },
};

function CategoryCard({ category, locale, course }: { category: CatalogCategory; locale: EduLocale; course: Course | null }) {
  const t = aifbT(locale);
  const style = CARD_STYLE[category.id] ?? CARD_STYLE.kurz;
  const css = { "--c": style.color } as React.CSSProperties;
  // Online kurz nemá obsah AIFB v katalogu; počty a dostupnost bere z vlastního souboru kurzu.
  const isCourse = category.id === "kurz";
  const available = isCourse ? course !== null : category.status === "content-ready";
  const totals = isCourse && course
    ? { unit: countWord(t, "aifb.unit.Modul", course.modules.length), lessons: courseTotals(course).lessons, subtitle: course.subtitle }
    : { unit: countWord(t, `aifb.unit.${category.unit}`, category.totals.levels), lessons: category.totals.lessons - category.totals.levels, subtitle: category.subtitle };
  const body = (
    <div className={`eh-card eh-card--big${available ? "" : " eh-card--off"}`} style={css}>
      <span className="eh-hexicon"><Icon name={style.icon} /></span>
      <div className="eh-card__body">
        <h3>{category.title}</h3>
        <p>{available ? totals.subtitle : t("aifb.hub.legacyCourse")}</p>
        {available ? (
          <p className="aifb-card-meta">
            <span className="eh-badge">{category.grades}</span>{" "}
            <span className="eh-badge">{totals.unit}</span>{" "}
            <span className="eh-badge">{lessonsLabel(totals.lessons, locale)}</span>
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
      <Link href={isCourse ? coursePath(locale) : categoryPath(locale, category.id)} className="aifb-card-link">{body}</Link>
    </li>
  );
}

export function Hub({ locale, catalog, course, viewer }: { locale: EduLocale; catalog: Catalog; course: Course | null; viewer: AifbAccess }) {
  const t = aifbT(locale);
  const staff = isStaff(viewer);
  // Student vidí jen kategorie svých tříd; online kurz pro veřejnost vidí každý.
  const visible = new Set<string>([...visibleCategories(viewer), "kurz"]);
  const categories = catalog.categories.filter((category) => visible.has(category.id));
  const teachable = categories.filter((category) => category.status === "content-ready");
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

      {viewer.role === "student" ? (
        <section aria-labelledby="aifb-classes-title" className="aifb-section">
          <h2 className="eh-h2" id="aifb-classes-title"><span className="eh-bullet" aria-hidden="true" />{t("aifb.access.myClasses")}</h2>
          {viewer.classes.length > 0 ? (
            <ul className="aifb-link-list">
              {viewer.classes.map((item) => (
                <li key={item.id}>{item.name} · {catalog.categories.find((category) => category.id === item.category)?.title ?? item.category}</li>
              ))}
            </ul>
          ) : (
            <NoClassNotice locale={locale} t={t} />
          )}
        </section>
      ) : null}

      <section aria-labelledby="aifb-cards-title" className="aifb-section">
        <h2 className="eh-h2" id="aifb-cards-title"><span className="eh-bullet" aria-hidden="true" />{t("aifb.hub.cards")}</h2>
        <ul className="eh-cats aifb-card-list">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} locale={locale} course={course} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="aifb-progress-title" className="aifb-section">
        <h2 className="eh-h2" id="aifb-progress-title"><span className="eh-bullet" aria-hidden="true" />{t("aifb.progress.title")}</h2>
        <ProgressTransfer
          levels={[
            ...teachable.flatMap((category) => category.levels.map((level) => ({ id: level.id, lessonCount: level.lessonCount }))),
            ...(course?.modules ?? []).map((module) => ({ id: module.id, lessonCount: moduleLessonIds(module).length })),
          ]}
        />
      </section>

      {staff ? (
        <section aria-labelledby="aifb-teachers-title" className="aifb-section">
          <h2 className="eh-h2" id="aifb-teachers-title"><span className="eh-bullet" aria-hidden="true" />{t("aifb.hub.teachers.title")}</h2>
          <p className="aifb-lead">{t("aifb.hub.teachers.lead")}</p>
          <ul className="aifb-link-list">
            <li><Link href={teacherPath(locale)}>{t("aifb.hub.staff.classes")}</Link></li>
            {teachable.map((category) => (
              <li key={category.id}>
                <Link href={guidePath(locale, category.id)}>{t("aifb.hub.teachers.link", { category: category.title })}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {viewer.role === "admin" ? (
        <section aria-labelledby="aifb-admin-title" className="aifb-section">
          <h2 className="eh-h2" id="aifb-admin-title"><span className="eh-bullet" aria-hidden="true" />{t("aifb.hub.admin.title")}</h2>
          <p className="aifb-lead">{t("aifb.hub.admin.lead")}</p>
          <ul className="aifb-link-list">
            <li><Link href={editorPath(locale)}>{t("aifb.hub.admin.edit")}</Link></li>
          </ul>
        </section>
      ) : null}
    </>
  );
}
