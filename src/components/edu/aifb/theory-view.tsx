// Stránka teorie bloku / levelu: souvislý text v běžné velikosti s obsahem, ilustracemi a shrnutím.
// Teorie stojí před lekcemi a není jednou z nich. Metodika pro učitele (jak teorii vést, opakovací
// otázky, diskuzní témata) je na konci ve sbalené sekci.

import Link from "next/link";
import { draftPreviewEnabled, getPupilLayer } from "@/lib/edu/aifb/content";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { categoryPath, hubPath, lessonPath, lessonSlug, levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import { readingMinutes, type ResolvedTheory } from "@/lib/edu/aifb/theory";
import type { AifbContent, Level, TheoryLesson } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { Paragraphs } from "./blocks";
import { Crumbs } from "./crumbs";
import { PupilLayerView } from "./interactive/pupil-layer";
import { LessonProgressControls } from "./lesson-progress";
import { PrintButton } from "./print-button";
import { RichText, type RichTextContext } from "./rich-text";
import { TheoryBlocks } from "./theory-blocks";

export function TheoryView({
  locale, content, level, lesson, theory,
}: { locale: EduLocale; content: AifbContent; level: Level; lesson: TheoryLesson; theory: ResolvedTheory }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
  const lvl = levelSlug(category.id, level.id);
  const firstLesson = level.lessons.find((item) => item.type === "exercise");
  const layer = getPupilLayer(lesson.id);
  const showLayer = layer !== undefined && (layer.status !== "draft" || draftPreviewEnabled());

  return (
    <>
      <Crumbs
        label={t("aifb.crumbs.label")}
        items={[
          { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
          { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
          { label: category.title, href: categoryPath(locale, category.id) },
          { label: `${level.code}: ${level.title}`, href: levelPath(locale, category.id, lvl) },
          { label: t("aifb.theory.title") },
        ]}
      />
      <header className="aifb-head th-head">
        <p className="aifb-eyebrow">{level.code} · {t("aifb.theory.title")}</p>
        <h1>{level.title}</h1>
        <p className="th-lead"><RichText text={theory.lead} ctx={ctx} /></p>
        <p className="aifb-chips">
          <span className="aifb-badge">{t("aifb.theory.read", { n: readingMinutes(theory) })}</span>
          <PrintButton label={t("aifb.print.theory")} />
        </p>
      </header>

      <div className="th-layout">
        <nav className="aifb-toc th-toc aifb-noprint" aria-label={t("aifb.theory.contents")}>
          <p className="aifb-toc__title">{t("aifb.theory.contents")}</p>
          <ol>
            {theory.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.heading}</a></li>)}
            <li><a href="#shrnuti">{t("aifb.theory.summary")}</a></li>
          </ol>
        </nav>

        <article className="th-article">
          {theory.sections.map((section) => (
            <section key={section.id} id={section.id} className="th-section" aria-labelledby={`${section.id}-h`}>
              <h2 id={`${section.id}-h`}>{section.heading}</h2>
              <TheoryBlocks blocks={section.blocks} ctx={ctx} />
            </section>
          ))}

          <section id="shrnuti" className="th-summary" aria-labelledby="shrnuti-h">
            <h2 id="shrnuti-h">{t("aifb.theory.summary")}</h2>
            <ul className="aifb-list">
              {theory.summary.map((item, index) => <li key={index}><RichText text={item} ctx={ctx} /></li>)}
            </ul>
          </section>

          {showLayer && layer ? (
            <section className="th-section" aria-labelledby="th-try">
              <h2 id="th-try">{t("aifb.theory.tryIt")}</h2>
              {layer.status === "draft" ? <p className="aifb-muted">{t("aifb.pupil.draftBanner")}</p> : null}
              <PupilLayerView lessonId={lesson.id} categoryId={category.id} layer={layer} ctx={ctx} />
            </section>
          ) : null}

          <LessonProgressControls lessonId={lesson.id} autoStart />

          {firstLesson ? (
            <p className="th-next aifb-noprint">
              <Link className="btn btn-primary" href={lessonPath(locale, category.id, lvl, lessonSlug(level.id, firstLesson.id))}>
                {t("aifb.theory.next", { lesson: `${t("aifb.lesson.exercise", { n: firstLesson.order })}: ${firstLesson.title}` })}
              </Link>
            </p>
          ) : null}

          <details className="aifb-details th-teacher">
            <summary><h2>{t("aifb.theory.teacher")}</h2></summary>
            <h3 className="aifb-h3">{t("aifb.theory.teacherHow")}</h3>
            <Paragraphs items={lesson.teacher.intro} ctx={ctx} />
            <h3 className="aifb-h3">{t("aifb.lesson.reviewQuestions")}</h3>
            <ol className="aifb-list">{lesson.teacher.reviewQuestions.map((q, i) => <li key={i}><RichText text={q} ctx={ctx} /></li>)}</ol>
            <h3 className="aifb-h3">{t("aifb.lesson.discussionTopics")}</h3>
            <ul className="aifb-list">{lesson.teacher.discussionTopics.map((q, i) => <li key={i}><RichText text={q} ctx={ctx} /></li>)}</ul>
          </details>

          {theory.status === "draft" ? <p className="aifb-muted th-draft">{t("aifb.theory.draftNote")}</p> : null}
        </article>
      </div>
    </>
  );
}
