// Tisk celého levelu (A4, černobíle čitelné): úvod, cíle, časový rozvrh, poznámky pro učitele
// a všech šest lekcí. Každá lekce začíná na nové straně; tlačítko Vytisknout otevře tiskový dialog.

import Link from "next/link";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { categoryPath, hubPath, levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import type { AifbContent, Level } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { DataTable, Paragraphs } from "./blocks";
import { Crumbs } from "./crumbs";
import { LessonBody } from "./lesson-body";
import { PrintButton } from "./print-button";
import { RichText, type RichTextContext } from "./rich-text";
import { lessonKindLabel } from "./shared";

export function LevelPrintView({ locale, content, level }: { locale: EduLocale; content: AifbContent; level: Level }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
  const slug = levelSlug(category.id, level.id);
  return (
    <>
      <Crumbs
        label={t("aifb.crumbs.label")}
        items={[
          { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
          { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
          { label: category.title, href: categoryPath(locale, category.id) },
          { label: `${level.code}: ${level.title}`, href: levelPath(locale, category.id, slug) },
          { label: t("aifb.print.levelPage") },
        ]}
      />
      <div className="aifb-toolbar">
        <PrintButton label={t("aifb.print.now")} />
        <Link href={levelPath(locale, category.id, slug)} className="btn btn-ghost aifb-noprint">{t("aifb.print.back")}</Link>
      </div>
      <article className="aifb-prose aifb-print-level">
        <header className="aifb-head">
          <p className="aifb-eyebrow">{category.title} · {level.code}</p>
          <h1>{level.title}</h1>
          {level.subtitle ? <p className="aifb-lead">{level.subtitle}</p> : null}
        </header>
        <h2 className="aifb-h2">{t(`aifb.level.about.${category.unit}`)}</h2>
        <Paragraphs items={level.intro} ctx={ctx} />
        <h2 className="aifb-h2">{t("aifb.level.goals")}</h2>
        <ul className="aifb-list">{level.goals.map((goal, i) => <li key={i}><RichText text={goal} ctx={ctx} /></li>)}</ul>
        <h2 className="aifb-h2">{t("aifb.level.schedule")}</h2>
        <DataTable header={level.schedule.header} rows={level.schedule.rows} caption={t("aifb.level.schedule")} />
        <Paragraphs items={level.scheduleNote} ctx={ctx} />
        <h2 className="aifb-h2">{t("aifb.level.teacherNotes")}</h2>
        <Paragraphs items={level.teacherNotes} ctx={ctx} />
        {level.lessons.map((lesson) => (
          <section key={lesson.id} className="aifb-print-lesson" aria-labelledby={`${lesson.id}-title`}>
            <p className="aifb-eyebrow">{lessonKindLabel(t, category.theme, lesson)}</p>
            <h2 className="aifb-h2" id={`${lesson.id}-title`}>{lesson.title}</h2>
            <LessonBody lesson={lesson} ctx={ctx} t={t} headingLevel={3} />
          </section>
        ))}
      </article>
    </>
  );
}
