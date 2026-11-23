// Stránka bloku / levelu: nejdřív teorie, potom lekce 1–5. Teorie není jednou z lekcí.
// Cíle, časový rozvrh a poznámky pro učitele jsou níž ve sbalených sekcích.

import Link from "next/link";
import { isStaff, lessonUnlocked, type AifbAccess } from "@/lib/edu/aifb/access";
import { levelEditPath } from "@/lib/edu/aifb/edits";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { categoryPath, guidePath, hubPath, lessonPath, lessonSlug, levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import { readingMinutes, type ResolvedTheory } from "@/lib/edu/aifb/theory";
import type { AifbContent, Level } from "@/lib/edu/aifb/types";
import { lessonsLabel, type EduLocale } from "@/lib/edu/i18n-data";
import { EditLink } from "./access-ui";
import { DataTable, Paragraphs } from "./blocks";
import { Crumbs } from "./crumbs";
import { LessonStatusBadge } from "./lesson-progress";
import { LevelProgressSummary } from "./level-progress";
import { RichText, type RichTextContext } from "./rich-text";
import { CertBadge, LessonRow, lessonKindLabel } from "./shared";

export function LevelView({
  locale, content, level, theory, viewer,
}: { locale: EduLocale; content: AifbContent; level: Level; theory: ResolvedTheory | null; viewer: AifbAccess }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
  const slug = levelSlug(category.id, level.id);
  const theoryLesson = level.lessons.find((lesson) => lesson.type === "theory");
  const exercises = level.lessons.filter((lesson) => lesson.type === "exercise");
  const hrefOf = (id: string) => lessonPath(locale, category.id, slug, lessonSlug(level.id, id));
  const advanced = category.id !== "zs1" && level.order >= 4;
  // Student vidí jen lekce odemčené učitelem a nevidí metodiku pro učitele.
  const lockedLabel = (id: string) => (lessonUnlocked(viewer, id) ? undefined : `${t("aifb.access.locked")} · ${t("aifb.access.lockedHint")}`);
  const theoryLocked = theoryLesson ? lockedLabel(theoryLesson.id) : undefined;

  return (
    <>
      <Crumbs
        label={t("aifb.crumbs.label")}
        items={[
          { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
          { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
          { label: category.title, href: categoryPath(locale, category.id) },
          { label: `${level.code}: ${level.title}`, href: levelPath(locale, category.id, slug) },
        ]}
      />
      <header className="aifb-head">
        <p className="aifb-eyebrow">{level.code} <EditLink role={viewer.role} locale={locale} doc={category.id} path={levelEditPath(level.id)} t={t} /></p>
        <h1>{level.title}</h1>
        {level.subtitle ? <p className="aifb-lead">{level.subtitle}</p> : null}
        <p className="aifb-chips">
          {level.grades ?? level.recommendedPlacement ? <span className="aifb-badge">{level.grades ?? level.recommendedPlacement}</span> : null}
          <span className="aifb-badge">{t("aifb.level.hours")}: {level.hours}</span>
          <span className="aifb-badge">{t("aifb.level.structure", { lessons: lessonsLabel(exercises.length, locale) })}</span>
          {advanced ? <span className="aifb-badge">{t("aifb.level.advanced")}</span> : null}
          <CertBadge certification={level.certification} t={t} />
        </p>
        <LevelProgressSummary lessonIds={level.lessons.map((lesson) => lesson.id)} />
      </header>

      {theoryLesson ? (
        <section className="aifb-section" aria-labelledby="aifb-theory">
          <h2 className="eh-h2" id="aifb-theory"><span className="aifb-step" aria-hidden="true">1</span>{t("aifb.theory.title")}</h2>
          {theoryLocked ? (
            <div className="aifb-theory-card aifb-theory-card--locked">
              <span className="aifb-theory-card__title">{t("aifb.theory.cardTitle", { title: level.title })}</span>
              <span className="aifb-theory-card__meta"><span className="aifb-badge aifb-badge--lock">{theoryLocked}</span></span>
            </div>
          ) : (
            <Link href={hrefOf(theoryLesson.id)} className="aifb-theory-card">
              <span className="aifb-theory-card__title">{t("aifb.theory.cardTitle", { title: level.title })}</span>
              {theory ? <span className="aifb-theory-card__lead"><RichText text={theory.lead} ctx={ctx} /></span> : null}
              <span className="aifb-theory-card__meta">
                {theory ? <span className="aifb-badge">{t("aifb.theory.read", { n: readingMinutes(theory) })}</span> : null}
                <LessonStatusBadge lessonId={theoryLesson.id} />
                <span className="aifb-theory-card__cta">{t("aifb.theory.open")} →</span>
              </span>
            </Link>
          )}
        </section>
      ) : null}

      <section className="aifb-section" aria-labelledby="aifb-lessons">
        <h2 className="eh-h2" id="aifb-lessons"><span className="aifb-step" aria-hidden="true">2</span>{t("aifb.level.lessons")}</h2>
        <ol className="aifb-lesson-list">
          {exercises.map((lesson) => (
            <LessonRow
              key={lesson.id}
              href={hrefOf(lesson.id)}
              kindLabel={lessonKindLabel(t, lesson)}
              title={lesson.title}
              meta={lesson.type === "exercise" ? `${t("aifb.lesson.time")}: ${lesson.teacher.time}` : undefined}
              status={<LessonStatusBadge lessonId={lesson.id} />}
              locked={lockedLabel(lesson.id)}
            />
          ))}
        </ol>
      </section>

      <section className="aifb-section aifb-prose">
        <details className="aifb-details">
          <summary><h2>{t(`aifb.level.about.${category.unit}`)}</h2></summary>
          <Paragraphs items={level.intro} ctx={ctx} />
          {level.themes ? <p className="aifb-muted"><strong>{t("aifb.level.themes")}:</strong> {level.themes}</p> : null}
          <h3 className="aifb-h3">{t("aifb.level.goals")}</h3>
          <ul className="aifb-list">{level.goals.map((goal, index) => <li key={index}><RichText text={goal} ctx={ctx} /></li>)}</ul>
        </details>
        {isStaff(viewer) ? <details className="aifb-details">
          <summary><h2>{t("aifb.level.forTeachers")}</h2></summary>
          <h3 className="aifb-h3">{t("aifb.level.schedule")}</h3>
          <DataTable header={level.schedule.header} rows={level.schedule.rows} caption={t("aifb.level.schedule")} />
          <Paragraphs items={level.scheduleNote} ctx={ctx} />
          <h3 className="aifb-h3">{t("aifb.level.teacherNotes")}</h3>
          <Paragraphs items={level.teacherNotes} ctx={ctx} />
          <p className="aifb-links">
            <Link href={guidePath(locale, category.id)} className="aifb-textlink">{t("aifb.category.guideLink")}</Link>
            <Link href={`${levelPath(locale, category.id, slug)}/tisk`} className="aifb-textlink">{t("aifb.print.level")}</Link>
          </p>
        </details> : null}
      </section>
    </>
  );
}
