// Online kurz pro všechny: přehled kurzu, stránka modulu (teorie, potom lekce), teorie modulu
// a lekce. Stejné prvky jako levely AIFB (karta teorie, řádky lekcí, místní průběh), ale bez
// metodiky pro učitele: kurz je pro samostatné studium.

import Link from "next/link";
import { getCatalog } from "@/lib/edu/aifb/content";
import { courseTotals, moduleLessonIds, moduleSlug, theoryIdOf, type Course, type CourseLesson, type CourseModule } from "@/lib/edu/aifb/course";
import { aifbT, countWord, type AifbT } from "@/lib/edu/aifb/i18n";
import type { PupilLayer } from "@/lib/edu/aifb/pupil";
import { courseLessonPath, coursePath, hubPath, modulePath } from "@/lib/edu/aifb/routes";
import { readingMinutes } from "@/lib/edu/aifb/theory";
import { lessonsLabel, type EduLocale } from "@/lib/edu/i18n-data";
import { Crumbs } from "./crumbs";
import { PupilLayerView } from "./interactive/pupil-layer";
import { LessonProgressControls, LessonStatusBadge } from "./lesson-progress";
import { LevelProgressSummary } from "./level-progress";
import { PrintButton } from "./print-button";
import { RichText, type RichTextContext } from "./rich-text";
import { LessonRow } from "./shared";
import { TheoryLayout } from "./theory-layout";

const ctxOf = (locale: string): RichTextContext => ({ locale, categoryId: "kurz" });

function sourceTitles(module: CourseModule): string[] {
  const categories = getCatalog().categories;
  return module.sources.map((id) => categories.find((category) => category.id === id)?.title ?? id);
}

function crumbs(t: AifbT, locale: EduLocale, tail: { label: string; href?: string }[]) {
  return (
    <Crumbs
      label={t("aifb.crumbs.label")}
      items={[
        { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
        { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
        { label: t("aifb.course.crumb"), href: coursePath(locale) },
        ...tail,
      ]}
    />
  );
}

const lessonUrl = (locale: string, module: CourseModule, slug: string) => courseLessonPath(locale, moduleSlug(module.id), slug);
const lessonSlugOf = (module: CourseModule, lesson: { id: string }) => lesson.id.slice(module.id.length + 1);

function DraftNote({ course, t }: { course: Course; t: AifbT }) {
  return course.status === "draft" ? <p className="aifb-muted th-draft">{t("aifb.course.draftNote")}</p> : null;
}

export function CourseOverview({ locale, course }: { locale: EduLocale; course: Course }) {
  const t = aifbT(locale);
  const ctx = ctxOf(locale);
  const totals = courseTotals(course);
  return (
    <>
      {crumbs(t, locale, [])}
      <header className="aifb-head">
        <h1>{course.title}</h1>
        <p className="th-lead"><RichText text={course.lead} ctx={ctx} /></p>
        <p className="aifb-chips">
          <span className="aifb-badge">{countWord(t, "aifb.unit.Modul", totals.modules)}</span>
          <span className="aifb-badge">{lessonsLabel(totals.lessons, locale)}</span>
          <span className="aifb-badge">{t("aifb.course.duration", { n: Math.round(totals.minutes / 60) })}</span>
        </p>
        <LevelProgressSummary lessonIds={course.modules.flatMap(moduleLessonIds)} />
      </header>

      <section className="aifb-section" aria-labelledby="course-how">
        <h2 className="eh-h2" id="course-how">{t("aifb.course.how")}</h2>
        <p className="aifb-lead">{course.audience}</p>
        <ul className="aifb-list">
          {course.howItWorks.map((item, index) => <li key={index}><RichText text={item} ctx={ctx} /></li>)}
        </ul>
      </section>

      <section className="aifb-section" aria-labelledby="course-modules">
        <h2 className="eh-h2" id="course-modules">{t("aifb.course.modules")}</h2>
        <ol className="aifb-course-modules">
          {course.modules.map((module) => (
            <li key={module.id}>
              <Link href={modulePath(locale, moduleSlug(module.id))} className="aifb-course-module">
                <span className="aifb-step" aria-hidden="true">{module.order}</span>
                <span className="aifb-course-module__body">
                  <span className="aifb-course-module__code">{module.code}</span>
                  <span className="aifb-theory-card__title">{module.title}</span>
                  <span className="aifb-theory-card__lead">{module.subtitle}</span>
                  <span className="aifb-theory-card__meta">
                    <span className="aifb-badge">{t("aifb.level.structure", { lessons: lessonsLabel(module.lessons.length, locale) })}</span>
                    <span className="aifb-badge">{t("aifb.course.minutes", { n: module.minutes })}</span>
                    <span className="aifb-muted">{t("aifb.course.from")}: {sourceTitles(module).join(", ")}</span>
                  </span>
                </span>
                <LevelProgressSummary lessonIds={moduleLessonIds(module)} />
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <DraftNote course={course} t={t} />
    </>
  );
}

export function CourseModuleView({ locale, course, module }: { locale: EduLocale; course: Course; module: CourseModule }) {
  const t = aifbT(locale);
  const ctx = ctxOf(locale);
  const index = course.modules.indexOf(module);
  const prev = course.modules[index - 1];
  const next = course.modules[index + 1];
  return (
    <>
      {crumbs(t, locale, [{ label: `${module.code}: ${module.title}` }])}
      <header className="aifb-head">
        <p className="aifb-eyebrow">{module.code}</p>
        <h1>{module.title}</h1>
        <p className="aifb-lead">{module.subtitle}</p>
        <p className="aifb-chips">
          <span className="aifb-badge">{t("aifb.course.minutes", { n: module.minutes })}</span>
          <span className="aifb-badge">{t("aifb.level.structure", { lessons: lessonsLabel(module.lessons.length, locale) })}</span>
          <span className="aifb-badge">{t("aifb.course.from")}: {sourceTitles(module).join(", ")}</span>
        </p>
        <LevelProgressSummary lessonIds={moduleLessonIds(module)} />
      </header>

      <section className="aifb-section" aria-labelledby="aifb-theory">
        <h2 className="eh-h2" id="aifb-theory"><span className="aifb-step" aria-hidden="true">1</span>{t("aifb.theory.title")}</h2>
        <Link href={lessonUrl(locale, module, "teorie")} className="aifb-theory-card">
          <span className="aifb-theory-card__title">{t("aifb.theory.cardTitle", { title: module.title })}</span>
          <span className="aifb-theory-card__lead"><RichText text={module.theory.lead} ctx={ctx} /></span>
          <span className="aifb-theory-card__meta">
            <span className="aifb-badge">{t("aifb.theory.read", { n: readingMinutes(module.theory) })}</span>
            <LessonStatusBadge lessonId={theoryIdOf(module)} />
            <span className="aifb-theory-card__cta">{t("aifb.theory.open")} →</span>
          </span>
        </Link>
      </section>

      <section className="aifb-section" aria-labelledby="aifb-lessons">
        <h2 className="eh-h2" id="aifb-lessons"><span className="aifb-step" aria-hidden="true">2</span>{t("aifb.level.lessons")}</h2>
        <ol className="aifb-lesson-list">
          {module.lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              href={lessonUrl(locale, module, lessonSlugOf(module, lesson))}
              kindLabel={t("aifb.lesson.exercise", { n: lesson.order })}
              title={lesson.title}
              meta={t("aifb.course.minutes", { n: lesson.minutes })}
              status={<LessonStatusBadge lessonId={lesson.id} />}
            />
          ))}
        </ol>
      </section>

      <section className="aifb-section aifb-prose">
        <details className="aifb-details">
          <summary><h2>{t("aifb.course.goals")}</h2></summary>
          <ul className="aifb-list">{module.goals.map((goal, i) => <li key={i}><RichText text={goal} ctx={ctx} /></li>)}</ul>
        </details>
      </section>

      <nav className="aifb-pager aifb-noprint" aria-label={t("aifb.course.modules")}>
        {prev ? <Link href={modulePath(locale, moduleSlug(prev.id))} rel="prev">← {t("aifb.course.prevModule", { title: prev.title })}</Link> : <span />}
        <Link href={coursePath(locale)}>{t("aifb.course.backToCourse")}</Link>
        {next ? <Link href={modulePath(locale, moduleSlug(next.id))} rel="next">{t("aifb.course.nextModule", { title: next.title })} →</Link> : <span />}
      </nav>
    </>
  );
}

export function CourseTheoryView({ locale, course, module }: { locale: EduLocale; course: Course; module: CourseModule }) {
  const t = aifbT(locale);
  const ctx = ctxOf(locale);
  const first = module.lessons[0];
  return (
    <>
      {crumbs(t, locale, [{ label: `${module.code}: ${module.title}`, href: modulePath(locale, moduleSlug(module.id)) }, { label: t("aifb.theory.title") }])}
      <header className="aifb-head th-head">
        <p className="aifb-eyebrow">{module.code} · {t("aifb.theory.title")}</p>
        <h1>{module.title}</h1>
        <p className="th-lead"><RichText text={module.theory.lead} ctx={ctx} /></p>
        <p className="aifb-chips">
          <span className="aifb-badge">{t("aifb.theory.read", { n: readingMinutes(module.theory) })}</span>
          <PrintButton label={t("aifb.print.theory")} />
        </p>
      </header>
      <TheoryLayout theory={module.theory} ctx={ctx} t={t}>
        <LessonProgressControls lessonId={theoryIdOf(module)} autoStart />
        {first ? (
          <p className="th-next aifb-noprint">
            <Link className="btn btn-primary" href={lessonUrl(locale, module, lessonSlugOf(module, first))}>
              {t("aifb.theory.next", { lesson: `${t("aifb.lesson.exercise", { n: first.order })}: ${first.title}` })}
            </Link>
          </p>
        ) : null}
        <DraftNote course={course} t={t} />
      </TheoryLayout>
    </>
  );
}

export function CourseLessonView({ locale, course, module, lesson }: { locale: EduLocale; course: Course; module: CourseModule; lesson: CourseLesson }) {
  const t = aifbT(locale);
  const ctx = ctxOf(locale);
  const kind = t("aifb.lesson.exercise", { n: lesson.order });
  const index = module.lessons.indexOf(lesson);
  const prevLesson = module.lessons[index - 1];
  const nextLesson = module.lessons[index + 1];
  const nextModule = course.modules[course.modules.indexOf(module) + 1];
  const layer: PupilLayer | null = lesson.activity ? { status: course.status, ...lesson.activity } : null;

  let next = null;
  if (nextLesson) {
    next = <Link href={lessonUrl(locale, module, lessonSlugOf(module, nextLesson))} rel="next">{t("aifb.lesson.exercise", { n: nextLesson.order })}: {nextLesson.title} →</Link>;
  } else if (nextModule) {
    next = <Link href={lessonUrl(locale, nextModule, "teorie")} rel="next">{t("aifb.course.nextModule", { title: nextModule.title })} →</Link>;
  } else {
    next = <Link href={coursePath(locale)}>{t("aifb.course.backToCourse")} →</Link>;
  }

  return (
    <>
      {crumbs(t, locale, [{ label: `${module.code}: ${module.title}`, href: modulePath(locale, moduleSlug(module.id)) }, { label: `${kind}: ${lesson.title}` }])}
      <article className="aifb-prose">
        <header className="aifb-head">
          <p className="aifb-eyebrow">{module.code} · {kind}</p>
          <h1>{lesson.title}</h1>
          <p className="aifb-chips">
            <span className="aifb-badge">{t("aifb.course.minutes", { n: lesson.minutes })}</span>
            <PrintButton label={t("aifb.print.lesson")} />
          </p>
        </header>
        <LessonProgressControls lessonId={lesson.id} autoStart />
        <p className="aifb-lead"><RichText text={lesson.intro} ctx={ctx} /></p>
        <h2 className="aifb-h2">{t("aifb.course.steps")}</h2>
        <ol className="aifb-list">{lesson.steps.map((step, i) => <li key={i}><RichText text={step} ctx={ctx} /></li>)}</ol>
        {layer ? (
          <section aria-labelledby="aifb-try">
            <h2 className="aifb-h2" id="aifb-try">{t("aifb.lesson.tryIt")}</h2>
            <PupilLayerView lessonId={lesson.id} categoryId="kurz" layer={layer} ctx={ctx} />
          </section>
        ) : null}
        {lesson.tip ? (
          <aside className="th-callout th-callout--tip" aria-label={t("aifb.course.tip")}>
            <p className="th-callout__title"><span aria-hidden="true">💡</span> {t("aifb.course.tip")}</p>
            <p><RichText text={lesson.tip} ctx={ctx} /></p>
          </aside>
        ) : null}
        <h2 className="aifb-h2">{t("aifb.course.outcome")}</h2>
        <p><RichText text={lesson.outcome} ctx={ctx} /></p>
        {!nextLesson && !nextModule ? <p className="aifb-lead">{t("aifb.course.finished")}</p> : null}
        <DraftNote course={course} t={t} />
      </article>
      <nav className="aifb-pager aifb-noprint" aria-label={t("aifb.level.lessons")}>
        <Link href={lessonUrl(locale, module, prevLesson ? lessonSlugOf(module, prevLesson) : "teorie")} rel="prev">
          ← {prevLesson ? `${t("aifb.lesson.exercise", { n: prevLesson.order })}: ${prevLesson.title}` : t("aifb.lesson.backToTheory")}
        </Link>
        <Link href={modulePath(locale, moduleSlug(module.id))}>{t("aifb.course.backToModule")}</Link>
        {next}
      </nav>
    </>
  );
}
