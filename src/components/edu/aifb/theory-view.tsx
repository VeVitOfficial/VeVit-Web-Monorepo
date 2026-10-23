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
import { TheoryLayout } from "./theory-layout";

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

      <TheoryLayout theory={theory} ctx={ctx} t={t}>
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
      </TheoryLayout>
    </>
  );
}
