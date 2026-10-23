// Stránka lekce (cvičení 1–5 bloku / levelu). Jedno zobrazení bez přepínání režimů: zadání,
// co má vzniknout, forma práce a čas; u lekcí s AI upozornění na ochranu údajů; u pilotních lekcí
// interaktivní cvičení „Vyzkoušej si“ (návrh jen ve vývoji a náhledu, R7).

import Link from "next/link";
import { isStaff, lessonUnlocked, type AifbAccess } from "@/lib/edu/aifb/access";
import { getPupilLayer } from "@/lib/edu/aifb/content";
import { lessonEditPath } from "@/lib/edu/aifb/edits";
import { DATA_PROTECTION_ANCHOR, showsDataProtection } from "@/lib/edu/aifb/guide";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { pupilVisible } from "@/lib/edu/aifb/pupil";
import { categoryPath, guidePath, hubPath, lessonPath, lessonSlug, levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import type { AifbContent, ExerciseLesson, Level } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { EditLink } from "./access-ui";
import { Paragraphs } from "./blocks";
import { Crumbs } from "./crumbs";
import { PupilLayerView } from "./interactive/pupil-layer";
import { ExerciseBody } from "./lesson-body";
import { LessonProgressControls } from "./lesson-progress";
import { PrintButton } from "./print-button";
import type { RichTextContext } from "./rich-text";
import { SectionCallout, lessonKindLabel } from "./shared";

export function LessonView({
  locale, content, level, lesson, viewer, preview,
}: { locale: EduLocale; content: AifbContent; level: Level; lesson: ExerciseLesson; viewer: AifbAccess; preview: boolean }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
  const catId = category.id;
  const lvl = levelSlug(catId, level.id);
  const index = level.lessons.findIndex((item) => item.id === lesson.id);
  // Sousední lekce jen odemčené (student); zamčené se v pageru nenabízejí.
  const open = <T extends { id: string }>(target: T | undefined) => (target && lessonUnlocked(viewer, target.id) ? target : null);
  const prev = open(level.lessons[index - 1]);
  const next = open(level.lessons[index + 1]);
  const kind = lessonKindLabel(t, lesson);
  const hrefOf = (target: { id: string }) => lessonPath(locale, catId, lvl, lessonSlug(level.id, target.id));
  const labelOf = (target: { type: "theory" | "exercise"; order: number; title: string }) =>
    target.type === "theory" ? t("aifb.lesson.backToTheory") : `${lessonKindLabel(t, target)}: ${target.title}`;

  const layer = getPupilLayer(lesson.id);
  // R1: žáci 1. stupně AI nikdy nepíšou; R7: návrhy (draft) se na produkci nezobrazují.
  const layerAllowed = layer !== undefined && !(catId === "zs1" && layer.component === "AiSandbox");
  const showLayer = layerAllowed && (layer.status !== "draft" || preview);

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
          <p className="aifb-eyebrow">
            {level.code} · {kind}{" "}
            <EditLink role={viewer.role} locale={locale} doc={catId} path={lessonEditPath(level.id, lesson.id)} t={t} />
          </p>
          <h1>{lesson.title}</h1>
          <p className="aifb-chips">
            <span className="aifb-badge">{t("aifb.lesson.time")}: {lesson.teacher.time}</span>
            <PrintButton label={t("aifb.print.lesson")} />
          </p>
        </header>
        <LessonProgressControls lessonId={lesson.id} autoStart />
        {showsDataProtection(catId, level.id, lesson.type) ? (
          <SectionCallout title={t("aifb.dataProtection.title")}>
            <p>{t("aifb.dataProtection.body")}</p>
            {isStaff(viewer) ? (
              <p><Link href={guidePath(locale, catId, DATA_PROTECTION_ANCHOR[catId])} className="aifb-textlink">{t("aifb.dataProtection.link")}</Link></p>
            ) : null}
          </SectionCallout>
        ) : null}
        <ExerciseBody lesson={lesson} ctx={ctx} t={t} />
        {pupilVisible(lesson.pupil) ? <Paragraphs items={lesson.pupil.text ?? []} ctx={ctx} /> : null}
        {showLayer && layer ? (
          <section aria-labelledby="aifb-try">
            <h2 className="aifb-h2" id="aifb-try">{t("aifb.lesson.tryIt")}</h2>
            {layer.status === "draft" ? <p className="aifb-muted">{t("aifb.pupil.draftBanner")}</p> : null}
            <p><EditLink role={viewer.role} locale={locale} doc="pilots" path={`lessons/${lesson.id}`} t={t} /></p>
            <PupilLayerView lessonId={lesson.id} categoryId={catId} layer={layer} ctx={ctx} />
          </section>
        ) : null}
      </article>
      <nav className="aifb-pager aifb-noprint" aria-label={t("aifb.level.lessons")}>
        {prev ? <Link href={hrefOf(prev)} rel="prev">← {labelOf(prev)}</Link> : <span />}
        <Link href={levelPath(locale, catId, lvl)}>{t("aifb.lesson.backToLevel")}</Link>
        {next ? <Link href={hrefOf(next)} rel="next">{labelOf(next)} →</Link> : <span />}
      </nav>
    </>
  );
}
