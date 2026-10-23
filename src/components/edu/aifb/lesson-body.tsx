// Obsah lekce (cvičení): zadání, co má vzniknout a forma práce. Sdílí ho stránka lekce i tisk levelu.

import type { AifbT } from "@/lib/edu/aifb/i18n";
import type { ExerciseLesson } from "@/lib/edu/aifb/types";
import { Paragraphs } from "./blocks";
import { RichText, type RichTextContext } from "./rich-text";

export function ExerciseBody({ lesson, ctx, t, headingLevel = 2 }: { lesson: ExerciseLesson; ctx: RichTextContext; t: AifbT; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <>
      <H className="aifb-h2">{t("aifb.lesson.description")}</H>
      <Paragraphs items={lesson.teacher.description} ctx={ctx} />
      <H className="aifb-h2">{t("aifb.lesson.expectedOutput")}</H>
      <p><RichText text={lesson.teacher.expectedOutput} ctx={ctx} /></p>
      <H className="aifb-h2">{t("aifb.lesson.form")}</H>
      <p><RichText text={lesson.teacher.form} ctx={ctx} /></p>
    </>
  );
}
