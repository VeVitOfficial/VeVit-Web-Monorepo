// Stránka lekce. Režimy (v URL ?rezim=): Pro učitele (úplná metodika), Projekce (třída) a Žák
// (jen pokud je text pro žáky schválený; jinak klidná zpráva). Tisk řeší @media print.

import Link from "next/link";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { pupilVisible, withMode, type LessonMode } from "@/lib/edu/aifb/mode";
import { categoryPath, hubPath, lessonPath, lessonSlug, levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import type { AifbContent, Level, Lesson } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { Paragraphs } from "./blocks";
import { Crumbs } from "./crumbs";
import { LessonBody } from "./lesson-body";
import { ModeSwitch } from "./mode-switch";
import { PrintButton } from "./print-button";
import { ProjectionView } from "./projection";
import type { RichTextContext } from "./rich-text";
import { lessonKindLabel } from "./shared";

export function LessonView({
  locale, content, level, lesson, mode,
}: { locale: EduLocale; content: AifbContent; level: Level; lesson: Lesson; mode: LessonMode }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
  const catId = category.id;
  const lvl = levelSlug(catId, level.id);
  const index = level.lessons.findIndex((item) => item.id === lesson.id);
  const prev = index > 0 ? level.lessons[index - 1] : null;
  const next = index < level.lessons.length - 1 ? level.lessons[index + 1] : null;
  const kind = lessonKindLabel(t, category.theme, lesson);
  const here = lessonPath(locale, catId, lvl, lessonSlug(level.id, lesson.id));
  const hrefFor = (target: Lesson | null) => (target ? withMode(lessonPath(locale, catId, lvl, lessonSlug(level.id, target.id)), mode) : null);

  if (mode === "projekce") {
    return (
      <ProjectionView
        lesson={lesson}
        ctx={ctx}
        t={t}
        kind={kind}
        position={index + 1}
        total={level.lessons.length}
        prevHref={hrefFor(prev)}
        nextHref={hrefFor(next)}
        exitHref={here}
        labels={{
          prev: t("aifb.lesson.prev"),
          next: t("aifb.lesson.next"),
          exit: t("aifb.projection.exit"),
          fullscreen: t("aifb.projection.fullscreen"),
          position: t("aifb.projection.position"),
          keys: t("aifb.projection.keys"),
        }}
      />
    );
  }

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
      <div className="aifb-toolbar">
        <ModeSwitch path={here} mode={mode} t={t} />
        <PrintButton label={t("aifb.print.lesson")} />
      </div>
      <article className="aifb-prose">
        <header className="aifb-head">
          <p className="aifb-eyebrow">{kind}</p>
          <h1>{lesson.title}</h1>
        </header>
        {mode === "zak" ? (
          pupilVisible(lesson.pupil) ? (
            <Paragraphs items={lesson.pupil.text ?? []} ctx={ctx} />
          ) : (
            <section className="aifb-callout" role="status" aria-labelledby="aifb-pupil-soon">
              <p className="aifb-callout__title" id="aifb-pupil-soon">{t("aifb.pupil.soon.title")}</p>
              <p>{t("aifb.pupil.soon.body")}</p>
              <p><Link href={here} className="aifb-textlink">{t("aifb.pupil.soon.link")}</Link></p>
            </section>
          )
        ) : (
          <LessonBody lesson={lesson} ctx={ctx} t={t} />
        )}
      </article>
      <nav className="aifb-pager aifb-noprint" aria-label={t("aifb.level.lessons")}>
        {prev ? <Link href={hrefFor(prev) ?? here} rel="prev">{t("aifb.lesson.prev")}: {prev.title}</Link> : <span />}
        <Link href={levelPath(locale, catId, lvl)}>{t("aifb.lesson.backToLevel")}</Link>
        {next ? <Link href={hrefFor(next) ?? here} rel="next">{t("aifb.lesson.next")}: {next.title}</Link> : <span />}
      </nav>
    </>
  );
}
