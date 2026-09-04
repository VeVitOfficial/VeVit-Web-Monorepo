"use client";

// Lekce – port edu/js/pages/lesson.js. Obsahuje hlavičku, obsah lekce
// (LessonContent), cvičení (ExerciseList), kvíz (Quiz), complete tlačítko s XP
// a postranní panel s přehledem kurzu + navigace prev/next. Třídy identické
// s legacy. setLastVisited + completeLesson/completeExercise procházejí přes
// src/lib/edu/progress.ts (stejný localStorage tvar).

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useEduBreadcrumbs } from "../breadcrumbs";
import { useEduLang } from "../i18n";
import { XPBadge } from "../ui";
import { Icon } from "../blocks/icon";
import { LessonContent, type LessonBlock } from "../blocks/lesson-content";
import { ExerciseList, type Exercise } from "../blocks/exercise";
import { Quiz, type QuizQuestion } from "../blocks/quiz";
import { getLessonBySlug, type LessonBySlug } from "@/lib/edu/api";
import { escapeHtml } from "@/lib/edu/dom";
import {
  completeExercise,
  completeLesson,
  getProgress,
  isLessonCompleted,
  setLastVisited,
} from "@/lib/edu/progress";

function eduPath(lang: string, rest: string): string {
  return `/${lang}/edu/${rest}`;
}

function diffStyle(d?: string): CSSProperties {
  const map: Record<string, [string, string, string]> = {
    beginner: ["#00d084", "rgba(0,208,132,0.12)", "rgba(0,208,132,0.15)"],
    advanced: ["#f0ad4e", "rgba(240,173,78,0.12)", "rgba(240,173,78,0.15)"],
    expert: ["#d73a49", "rgba(215,58,73,0.12)", "rgba(215,58,73,0.15)"],
  };
  const m = map[d || ""] || map.beginner;
  return { color: m[0], backgroundColor: m[1], borderColor: m[2] };
}

export function EduLessonPage({ locale, id }: { locale: string; id: string }) {
  void locale;
  const { lang, t, lessonsUnit } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();
  const [ctx, setCtx] = useState<LessonBySlug | null | "error" | "loading">("loading");
  // Tick pro re-render po completeLesson/completeExercise.
  const [tick, setTick] = useState(0);
  const bump = () => setTick((n) => n + 1);

  // Načtení lekce + setLastVisited v then-callbacku.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setCtx("loading");
    });
    getLessonBySlug(id, lang)
      .then((result) => {
        if (cancelled) return;
        if (result) setLastVisited(id);
        setCtx(result);
      })
      .catch(() => {
        if (!cancelled) setCtx("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, lang]);

  // Breadcrumbs.
  useEffect(() => {
    if (ctx && ctx !== "loading" && ctx !== "error") {
      const isProgramming = ctx.course.category === "programovani";
      setBreadcrumbs([
        { label: "Dashboard", href: eduPath(lang, "dashboard/") },
        ...(isProgramming ? [{ label: t("nav.programming"), href: eduPath(lang, "programovani/") }] : []),
        { label: ctx.course.title, href: eduPath(lang, `kurzy/${ctx.course.slug}/`) },
        { label: ctx.chapter.title },
      ]);
    } else {
      setBreadcrumbs([{ label: "Dashboard", href: eduPath(lang, "dashboard/") }, { label: "Lekce" }]);
    }
  }, [ctx, lang, t, setBreadcrumbs]);

  void tick;

  if (ctx === "loading") {
    return <div className="max-w-3xl mx-auto p-16 text-center text-muted">Načítám lekci…</div>;
  }
  if (ctx === "error" || ctx === null) {
    return (
      <div className="max-w-xl mx-auto p-16 text-center">
        <div className="text-6xl font-bold gradient-text mb-4">404</div>
        <p className="text-muted mb-6" dangerouslySetInnerHTML={{ __html: `Lekce „${escapeHtml(id)}" nebyla nalezena.` }} />
        <Link href={eduPath(lang, "dashboard/")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">
          Zpět domů
        </Link>
      </div>
    );
  }

  const { lesson, course, chapter, lessonNumber, chapterIndex, prev, next } = ctx;
  const progress = getProgress();
  const completed = progress.completedLessons;
  const isCompleted = completed.includes(id);
  const exercises = (lesson as unknown as { exercises?: Exercise[] }).exercises || [];
  const completedExercises = exercises.filter((e) => progress.completedExercises[e.id]).map((e) => e.id);
  const outline = ((lesson as unknown as { content?: LessonBlock[] }).content || []).filter(
    (b) => b.type === "heading" && b.level === 2,
  ).map((b) => b.text || "");
  const totalLessons = course.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
  const courseCompleted = course.chapters.reduce(
    (s, ch) => s + ch.lessons.filter((l) => completed.includes(l.slug)).length,
    0,
  );
  const coursePercent = totalLessons > 0 ? Math.round((courseCompleted / totalLessons) * 100) : 0;
  const currentChapter = course.chapters[chapterIndex];
  const xp = lesson.xp || 0;
  const est = lesson.estimatedMinutes || 15;
  const quizQuestions = ((lesson as unknown as { quiz?: QuizQuestion[] }).quiz || []);
  const diffLabel = (d?: string) =>
    d === "beginner" ? t("programming.difficulty.beginner") : d === "advanced" ? t("programming.difficulty.advanced") : t("programming.difficulty.expert");

  function handleComplete() {
    if (!isLessonCompleted(id)) {
      completeLesson(id);
      bump();
    }
  }

  function handleExerciseComplete(exId: string) {
    if (!getProgress().completedExercises[exId]) completeExercise(exId);
    const fresh = getProgress();
    const allDone = exercises.length > 0 && exercises.every((e) => fresh.completedExercises[e.id]);
    if (allDone && !isLessonCompleted(id)) {
      completeLesson(id);
      bump();
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      <div className="flex-1 min-w-0">
        {/* Sticky hlavička s breadcrumb linkem a číslem lekce */}
        <div className="sticky top-14 z-20 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border-subtle)]">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] overflow-hidden">
              <Link href={eduPath(lang, `kurzy/${course.slug}/`)} className="hover:text-emerald-500 transition-colors shrink-0">
                {course.title}
              </Link>
              <Icon name="chevron-right" className="h-3 w-3 shrink-0" />
              <span className="truncate">{chapter.title}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-[var(--color-text-muted)]">
                {t("lesson.of")} {lessonNumber} / {totalLessons}
              </span>
              <Link
                href={eduPath(lang, `kurzy/${course.slug}/`)}
                className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                title={t("lesson.close")}
              >
                <Icon name="x" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-8 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-hero-gradient-from)] to-emerald-500 bg-clip-text text-transparent mb-3">
            {lesson.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap text-[13px] text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {est} {t("lesson.estimatedTime")}
            </span>
            {xp > 0 ? <XPBadge xp={xp} size="sm" /> : null}
            {course.difficulty ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border" style={diffStyle(course.difficulty)}>
                {diffLabel(course.difficulty)}
              </span>
            ) : null}
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-medium">
                <Icon name="check-circle-2" className="h-3.5 w-3.5" />
                {t("lesson.completed")}
              </span>
            ) : null}
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs mb-1.5" />
          <div className="h-px bg-[var(--color-border-subtle)] mb-8" />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-8 md:py-12">
          <LessonContent blocks={((lesson as unknown as { content?: LessonBlock[] }).content) || []} />
        </div>

        {exercises.length > 0 ? (
          <div className="max-w-3xl mx-auto px-6 mt-8">
            <div className="h-px bg-[var(--color-border-subtle)] mb-8" />
            <ExerciseList
              exercises={exercises}
              completedIds={completedExercises}
              courseLanguage={course.language}
              onComplete={handleExerciseComplete}
            />
          </div>
        ) : null}

        {!isCompleted ? (
          <div className="max-w-3xl mx-auto px-6 mt-10">
            <button
              type="button"
              onClick={handleComplete}
              className="w-full py-3 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="list-checks" className="h-4 w-4" />
              {t("lesson.complete")}
              {xp > 0 ? <span className="text-emerald-100 text-sm">(+{xp} XP)</span> : null}
            </button>
          </div>
        ) : null}

        {quizQuestions.length > 0 ? (
          <div className="max-w-3xl mx-auto px-6 mt-10">
            <div className="h-px bg-[var(--color-border-subtle)] mb-8" />
            <Quiz questions={quizQuestions} />
          </div>
        ) : null}

        <div className="max-w-3xl mx-auto px-6 mt-12 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prev ? <PrevNextCard l={prev} isPrev lang={lang} t={t} /> : <div />}
            {next ? <PrevNextCard l={next} isPrev={false} lang={lang} t={t} /> : <div />}
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-[340px] flex-shrink-0 border-l border-[var(--color-border-subtle)] bg-[var(--color-background)]">
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-5 space-y-6">
            <div className="rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">{course.title}</h3>
              <div className="mb-2">
                <div className="h-2 rounded-full bg-[var(--color-input-bg)] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${coursePercent}%` }} />
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {courseCompleted}/{totalLessons} {lessonsUnit(totalLessons)} {t("exercise.completed").toLowerCase()}
              </p>
            </div>
            {currentChapter ? <ChapterListCard currentChapter={currentChapter} chapterIndex={chapterIndex} slug={id} completed={completed} lang={lang} /> : null}
            {outline.length > 0 ? (
              <div className="rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Obsah lekce</h4>
                <div className="space-y-1">
                  {outline.map((h, i) => (
                    <div key={i} className="text-xs text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors cursor-default truncate">
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PrevNextCardProps {
  l: { slug: string; title: string };
  isPrev: boolean;
  lang: string;
  t: (k: string, v?: Record<string, string | number>) => string;
}

function PrevNextCard({ l, isPrev, lang, t }: PrevNextCardProps) {
  return (
    <Link
      href={`/${lang}/edu/lekce/${l.slug}/`}
      className={`group flex items-center ${isPrev ? "" : "justify-end"} gap-3 p-4 rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] hover:border-emerald-500/30 transition-colors ${isPrev ? "" : "text-right"}`}
    >
      {isPrev ? <Icon name="chevron-left" className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-emerald-500 transition-colors shrink-0" /> : null}
      <div className="min-w-0">
        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{isPrev ? t("lesson.prev") : t("lesson.next")}</p>
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-emerald-500 transition-colors">{l.title}</p>
      </div>
      {!isPrev ? <Icon name="chevron-right" className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-emerald-500 transition-colors shrink-0" /> : null}
    </Link>
  );
}

interface ChapterListCardProps {
  currentChapter: { lessons: { slug: string; title: string }[] };
  chapterIndex: number;
  slug: string;
  completed: string[];
  lang: string;
}

function ChapterListCard({ currentChapter, chapterIndex, slug, completed, lang }: ChapterListCardProps) {
  return (
    <div className="rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="book-open" className="h-4 w-4 text-[var(--color-text-muted)]" />
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {chapterIndex + 1}. {(currentChapter as unknown as { title: string }).title}
        </h4>
      </div>
      <div className="space-y-1">
        {currentChapter.lessons.map((l, idx) => {
          const lCompleted = completed.includes(l.slug);
          const lCurrent = l.slug === slug;
          let cls: string;
          let nodeIcon: React.ReactNode;
          if (lCurrent) {
            cls = "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500";
            nodeIcon = <Icon name="circle" className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/20" />;
          } else if (lCompleted) {
            cls = "text-[var(--color-text-secondary)] hover:bg-[var(--color-input-bg)]";
            nodeIcon = <Icon name="check-circle-2" className="h-3.5 w-3.5 text-emerald-500" />;
          } else {
            cls = "text-[var(--color-text-muted)] hover:bg-[var(--color-input-bg)]";
            nodeIcon = <Icon name="circle" className="h-3.5 w-3.5 text-[var(--color-border-subtle)]" />;
          }
          return (
            <Link key={l.slug} href={`/${lang}/edu/lekce/${l.slug}/`} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${cls}`}>
              <span className="flex-shrink-0">{nodeIcon}</span>
              <span className="truncate text-xs">
                {idx + 1}. {l.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}