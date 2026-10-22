// Stránka levelu: úvod, cíle, časový rozvrh, poznámky pro učitele a seznam lekcí (teorie + cvičení 1–5).
// Časový rozvrh a poznámky jsou ve sbalených sekcích; u kategorie pro děti (pirate-map) výchozí sbalené.

import Link from "next/link";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { categoryPath, guidePath, hubPath, lessonPath, lessonSlug, levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import type { AifbContent, Level } from "@/lib/edu/aifb/types";
import { lessonsLabel, type EduLocale } from "@/lib/edu/i18n-data";
import { DataTable, Paragraphs } from "./blocks";
import { Crumbs } from "./crumbs";
import { isAdvanced } from "./level-card";
import { RichText, type RichTextContext } from "./rich-text";
import { LessonStatusBadge } from "./lesson-progress";
import { LevelProgressSummary } from "./level-progress";
import { CertBadge, LessonRow, lessonKindLabel } from "./shared";

export function LevelView({ locale, content, level }: { locale: EduLocale; content: AifbContent; level: Level }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
  const theme = category.theme;
  const slug = levelSlug(category.id, level.id);
  const collapsed = theme === "pirate-map";

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
        <p className="aifb-eyebrow">{level.code}</p>
        <h1>{level.title}</h1>
        {level.subtitle ? <p className="aifb-lead">{level.subtitle}</p> : null}
        <p className="aifb-chips">
          {level.grades ?? level.recommendedPlacement ? <span className="aifb-badge">{level.grades ?? level.recommendedPlacement}</span> : null}
          <span className="aifb-badge">{t("aifb.level.hours")}: {level.hours}</span>
          <span className="aifb-badge">{lessonsLabel(level.lessons.length, locale)}</span>
          {isAdvanced(level, category.id) ? <span className="aifb-badge">{t("aifb.level.advanced")}</span> : null}
          <CertBadge certification={level.certification} t={t} />
        </p>
        <p className="aifb-links">
          <Link href={guidePath(locale, category.id)} className="aifb-textlink">{t("aifb.category.guideLink")}</Link>
          <Link href={`${levelPath(locale, category.id, slug)}/tisk`} className="aifb-textlink">{t("aifb.print.level")}</Link>
        </p>
      </header>

      <section className="aifb-section aifb-prose" aria-labelledby="aifb-about">
        <h2 className="eh-h2" id="aifb-about"><span className="eh-bullet" aria-hidden="true" />{t(`aifb.level.about.${category.unit}`)}</h2>
        <Paragraphs items={level.intro} ctx={ctx} />
        {level.themes ? <p className="aifb-muted"><strong>{t("aifb.level.themes")}:</strong> {level.themes}</p> : null}
      </section>

      <section className="aifb-section aifb-prose" aria-labelledby="aifb-goals">
        <h2 className="eh-h2" id="aifb-goals"><span className="eh-bullet" aria-hidden="true" />{t("aifb.level.goals")}</h2>
        <ul className="aifb-list">
          {level.goals.map((goal, index) => <li key={index}><RichText text={goal} ctx={ctx} /></li>)}
        </ul>
      </section>

      <section className="aifb-section" aria-labelledby="aifb-lessons">
        <h2 className="eh-h2" id="aifb-lessons"><span className="eh-bullet" aria-hidden="true" />{t("aifb.level.lessons")}</h2>
        <LevelProgressSummary lessonIds={level.lessons.map((lesson) => lesson.id)} />
        <ol className="aifb-lesson-list">
          {level.lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              href={lessonPath(locale, category.id, slug, lessonSlug(level.id, lesson.id))}
              kindLabel={lessonKindLabel(t, theme, lesson)}
              title={lesson.title}
              meta={lesson.type === "exercise" ? `${t("aifb.lesson.time")}: ${lesson.teacher.time}` : undefined}
              status={<LessonStatusBadge lessonId={lesson.id} />}
            />
          ))}
        </ol>
      </section>

      <section className="aifb-section aifb-prose">
        <details className="aifb-details" open={!collapsed}>
          <summary><h2>{t("aifb.level.schedule")}</h2></summary>
          <DataTable header={level.schedule.header} rows={level.schedule.rows} caption={t("aifb.level.schedule")} />
          <Paragraphs items={level.scheduleNote} ctx={ctx} />
        </details>
        <details className="aifb-details" open={!collapsed}>
          <summary><h2>{t("aifb.level.teacherNotes")}</h2></summary>
          <Paragraphs items={level.teacherNotes} ctx={ctx} />
        </details>
      </section>
    </>
  );
}
