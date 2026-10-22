// Režim Projekce (třída): velké písmo, jen to, co se promítá žákům; poznámky pro učitele jsou skryté.
// Teorie promítá samotný text teorie, cvičení zadání, očekávaný výstup, čas a formu.
// Navigaci Předchozí / Další a klávesy řeší ProjectionControls.

import type { AifbT } from "@/lib/edu/aifb/i18n";
import type { Lesson } from "@/lib/edu/aifb/types";
import { Paragraphs } from "./blocks";
import { ProjectionControls } from "./projection-controls";
import { RichText, type RichTextContext } from "./rich-text";

export function ProjectionView({
  lesson, ctx, t, kind, position, total, prevHref, nextHref, exitHref, labels,
}: {
  lesson: Lesson; ctx: RichTextContext; t: AifbT; kind: string; position: number; total: number;
  prevHref: string | null; nextHref: string | null; exitHref: string;
  labels: { prev: string; next: string; exit: string; fullscreen: string; position: string; keys: string };
}) {
  return (
    <section className="aifb-projection" aria-labelledby="aifb-proj-title">
      <ProjectionControls prevHref={prevHref} nextHref={nextHref} exitHref={exitHref} labels={labels} />
      <p className="aifb-proj__kind">{kind}</p>
      <h1 id="aifb-proj-title" className="aifb-proj__title">{lesson.title}</h1>
      {lesson.type === "theory" ? (
        <div className="aifb-proj__text"><Paragraphs items={lesson.teacher.intro} ctx={ctx} /></div>
      ) : (
        <>
          <p className="aifb-proj__meta">{t("aifb.lesson.time")}: {lesson.teacher.time}</p>
          <h2>{t("aifb.lesson.description")}</h2>
          <div className="aifb-proj__text"><Paragraphs items={lesson.teacher.description} ctx={ctx} /></div>
          <h2>{t("aifb.lesson.expectedOutput")}</h2>
          <p className="aifb-proj__text"><RichText text={lesson.teacher.expectedOutput} ctx={ctx} /></p>
          <h2>{t("aifb.lesson.form")}</h2>
          <p className="aifb-proj__text"><RichText text={lesson.teacher.form} ctx={ctx} /></p>
        </>
      )}
      <p className="aifb-proj__position" aria-live="polite">{labels.position.replace("{{n}}", String(position)).replace("{{total}}", String(total))}</p>
    </section>
  );
}
