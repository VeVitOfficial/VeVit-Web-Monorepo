// Stránka lekce, zobrazení pro učitele (úplná metodika). Režimy Projekce a Tisk doplňuje
// přehrávač lekce (F4).

import Link from "next/link";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { categoryPath, hubPath, lessonPath, lessonSlug, levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import type { AifbContent, Level, Lesson } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { Paragraphs } from "./blocks";
import { Crumbs } from "./crumbs";
import { RichText, type RichTextContext } from "./rich-text";
import { lessonKindLabel } from "./shared";

export function LessonView({
  locale, content, level, lesson,
}: { locale: EduLocale; content: AifbContent; level: Level; lesson: Lesson }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
  const catId = category.id;
  const lvl = levelSlug(catId, level.id);
  const index = level.lessons.findIndex((item) => item.id === lesson.id);
  const prev = index > 0 ? level.lessons[index - 1] : null;
  const next = index < level.lessons.length - 1 ? level.lessons[index + 1] : null;
  const kind = lessonKindLabel(t, category.theme, lesson);

  return (
    <>
      <Crumbs
        label={t("aifb.crumbs.label")}
        items={[
          { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
          { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
          { label: category.title, href: categoryPath(locale, catId) },
          { label: `${level.code}: ${level.title}`, href: levelPath(locale, catId, lvl) },
          { label: `${kind}: ${lesson.title}` },
        ]}
      />
      <article className="aifb-prose">
        <header className="aifb-head">
          <p className="aifb-eyebrow">{kind}</p>
          <h1>{lesson.title}</h1>
        </header>
        {lesson.type === "theory" ? (
          <>
            <h2 className="aifb-h2">{t("aifb.lesson.intro")}</h2>
            <Paragraphs items={lesson.teacher.intro} ctx={ctx} />
            <h2 className="aifb-h2">{t("aifb.lesson.reviewQuestions")}</h2>
            <ol className="aifb-list">
              {lesson.teacher.reviewQuestions.map((q, i) => <li key={i}><RichText text={q} ctx={ctx} /></li>)}
            </ol>
            <h2 className="aifb-h2">{t("aifb.lesson.discussionTopics")}</h2>
            <ul className="aifb-list">
              {lesson.teacher.discussionTopics.map((q, i) => <li key={i}><RichText text={q} ctx={ctx} /></li>)}
            </ul>
          </>
        ) : (
          <>
            <p className="aifb-chips">
              <span className="aifb-badge">{t("aifb.lesson.time")}: {lesson.teacher.time}</span>
            </p>
            <h2 className="aifb-h2">{t("aifb.lesson.description")}</h2>
            <Paragraphs items={lesson.teacher.description} ctx={ctx} />
            <h2 className="aifb-h2">{t("aifb.lesson.expectedOutput")}</h2>
            <p><RichText text={lesson.teacher.expectedOutput} ctx={ctx} /></p>
            <h2 className="aifb-h2">{t("aifb.lesson.form")}</h2>
            <p><RichText text={lesson.teacher.form} ctx={ctx} /></p>
          </>
        )}
      </article>
      <nav className="aifb-pager" aria-label={t("aifb.level.lessons")}>
        {prev ? (
          <Link href={lessonPath(locale, catId, lvl, lessonSlug(level.id, prev.id))} rel="prev">{t("aifb.lesson.prev")}: {prev.title}</Link>
        ) : <span />}
        <Link href={levelPath(locale, catId, lvl)}>{t("aifb.lesson.backToLevel")}</Link>
        {next ? (
          <Link href={lessonPath(locale, catId, lvl, lessonSlug(level.id, next.id))} rel="next">{t("aifb.lesson.next")}: {next.title}</Link>
        ) : <span />}
      </nav>
    </>
  );
}
