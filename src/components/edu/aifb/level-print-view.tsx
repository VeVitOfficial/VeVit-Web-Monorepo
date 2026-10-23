// Tisk celého bloku / levelu (A4, černobíle čitelné): teorie, lekce 1–5 a podklady pro učitele.
// Teorie i každá lekce začínají na nové straně.

import Link from "next/link";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { categoryPath, hubPath, levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import type { ResolvedTheory } from "@/lib/edu/aifb/theory";
import type { AifbContent, Level } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { DataTable, Paragraphs } from "./blocks";
import { Crumbs } from "./crumbs";
import { ExerciseBody } from "./lesson-body";
import { PrintButton } from "./print-button";
import { RichText, type RichTextContext } from "./rich-text";
import { lessonKindLabel } from "./shared";
import { TheoryBlocks } from "./theory-blocks";

export function LevelPrintView({ locale, content, level, theory }: { locale: EduLocale; content: AifbContent; level: Level; theory: ResolvedTheory | null }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
  const slug = levelSlug(category.id, level.id);
  const theoryLesson = level.lessons.find((lesson) => lesson.type === "theory");
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
        {theory ? (
          <section className="aifb-print-lesson th-article" aria-labelledby="print-theory">
            <h2 className="aifb-h2" id="print-theory">{t("aifb.theory.title")}</h2>
            <p className="th-lead"><RichText text={theory.lead} ctx={ctx} /></p>
            {theory.sections.map((section) => (
              <section key={section.id} className="th-section">
                <h3 className="aifb-h3">{section.heading}</h3>
                <TheoryBlocks blocks={section.blocks} ctx={ctx} />
              </section>
            ))}
            <h3 className="aifb-h3">{t("aifb.theory.summary")}</h3>
            <ul className="aifb-list">{theory.summary.map((item, i) => <li key={i}><RichText text={item} ctx={ctx} /></li>)}</ul>
          </section>
        ) : null}
        {level.lessons.filter((lesson) => lesson.type === "exercise").map((lesson) => (
          <section key={lesson.id} className="aifb-print-lesson" aria-labelledby={`${lesson.id}-title`}>
            <p className="aifb-eyebrow">{lessonKindLabel(t, lesson)}</p>
            <h2 className="aifb-h2" id={`${lesson.id}-title`}>{lesson.title}</h2>
            {lesson.type === "exercise" ? <ExerciseBody lesson={lesson} ctx={ctx} t={t} headingLevel={3} /> : null}
          </section>
        ))}
        <section className="aifb-print-lesson" aria-labelledby="print-teachers">
          <h2 className="aifb-h2" id="print-teachers">{t("aifb.level.forTeachers")}</h2>
          <h3 className="aifb-h3">{t(`aifb.level.about.${category.unit}`)}</h3>
          <Paragraphs items={level.intro} ctx={ctx} />
          <h3 className="aifb-h3">{t("aifb.level.goals")}</h3>
          <ul className="aifb-list">{level.goals.map((goal, i) => <li key={i}><RichText text={goal} ctx={ctx} /></li>)}</ul>
          <h3 className="aifb-h3">{t("aifb.level.schedule")}</h3>
          <DataTable header={level.schedule.header} rows={level.schedule.rows} caption={t("aifb.level.schedule")} />
          <Paragraphs items={level.scheduleNote} ctx={ctx} />
          <h3 className="aifb-h3">{t("aifb.level.teacherNotes")}</h3>
          <Paragraphs items={level.teacherNotes} ctx={ctx} />
          {theoryLesson && theoryLesson.type === "theory" ? (
            <>
              <h3 className="aifb-h3">{t("aifb.theory.teacherHow")}</h3>
              <Paragraphs items={theoryLesson.teacher.intro} ctx={ctx} />
              <h3 className="aifb-h3">{t("aifb.lesson.reviewQuestions")}</h3>
              <ol className="aifb-list">{theoryLesson.teacher.reviewQuestions.map((q, i) => <li key={i}><RichText text={q} ctx={ctx} /></li>)}</ol>
              <h3 className="aifb-h3">{t("aifb.lesson.discussionTopics")}</h3>
              <ul className="aifb-list">{theoryLesson.teacher.discussionTopics.map((q, i) => <li key={i}><RichText text={q} ctx={ctx} /></li>)}</ul>
            </>
          ) : null}
        </section>
      </article>
    </>
  );
}
