// Obsah lekce pro učitele: teorie (úvod, opakovací otázky, diskuzní témata) nebo cvičení
// (zadání, očekávaný výstup, forma, čas). Sdílí ho stránka lekce i tisk celého levelu.
// Opakovací otázky jsou zatím jen seznam; místo pro budoucí kvíz (pupil.interactive) zůstává
// prázdné, dokud vlastník neschválí návrh (žádný kvíz s vymyšlenými odpověďmi).

import type { AifbT } from "@/lib/edu/aifb/i18n";
import type { Lesson } from "@/lib/edu/aifb/types";
import { Paragraphs } from "./blocks";
import { RichText, type RichTextContext } from "./rich-text";

export function LessonBody({ lesson, ctx, t, headingLevel = 2 }: { lesson: Lesson; ctx: RichTextContext; t: AifbT; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  if (lesson.type === "theory") {
    return (
      <>
        <H className="aifb-h2">{t("aifb.lesson.intro")}</H>
        <Paragraphs items={lesson.teacher.intro} ctx={ctx} />
        <H className="aifb-h2">{t("aifb.lesson.reviewQuestions")}</H>
        <ol className="aifb-list">
          {lesson.teacher.reviewQuestions.map((question, index) => <li key={index}><RichText text={question} ctx={ctx} /></li>)}
        </ol>
        <H className="aifb-h2">{t("aifb.lesson.discussionTopics")}</H>
        <ul className="aifb-list">
          {lesson.teacher.discussionTopics.map((topic, index) => <li key={index}><RichText text={topic} ctx={ctx} /></li>)}
        </ul>
      </>
    );
  }
  return (
    <>
      <p className="aifb-chips">
        <span className="aifb-badge">{t("aifb.lesson.time")}: {lesson.teacher.time}</span>
      </p>
      <H className="aifb-h2">{t("aifb.lesson.description")}</H>
      <Paragraphs items={lesson.teacher.description} ctx={ctx} />
      <H className="aifb-h2">{t("aifb.lesson.expectedOutput")}</H>
      <p><RichText text={lesson.teacher.expectedOutput} ctx={ctx} /></p>
      <H className="aifb-h2">{t("aifb.lesson.form")}</H>
      <p><RichText text={lesson.teacher.form} ctx={ctx} /></p>
    </>
  );
}
