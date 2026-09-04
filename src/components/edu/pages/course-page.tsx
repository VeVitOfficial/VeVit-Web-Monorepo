"use client";

// Kurz – port edu/js/pages/course.js. Přehled kurzu: hlavička s progress,
// seznam kapitol s lekcemi, gamifikace a „proč se učit". Třídy identické
// s legacy (edu/css/styles.css). Navigace přes next/link na /<lang>/edu/...

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEduBreadcrumbs } from "../breadcrumbs";
import { useEduLang } from "../i18n";
import { CircularProgress, XPBadge } from "../ui";
import { Icon } from "../blocks/icon";
import {
  getCourseBySlug,
  type CourseBySlug,
} from "@/lib/edu/api";
import {
  courseLessonCount,
  courseMinutes,
  courseXP,
  type Lesson,
} from "@/lib/edu/config";
import { getProgress } from "@/lib/edu/progress";
import { escapeHtml } from "@/lib/edu/dom";

function diffColor(d?: string): string | null {
  if (!d) return null;
  if (d === "beginner") return "#00d084";
  if (d === "advanced") return "#f0ad4e";
  return "#d73a49";
}

function eduPath(lang: string, rest: string): string {
  return `/${lang}/edu/${rest}`;
}

export function EduCoursePage({ locale, slug }: { locale: string; slug: string }) {
  void locale;
  const { lang, t, lessonsUnit } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();
  const [data, setData] = useState<CourseBySlug | null | "error" | "loading">("loading");
  const [progressTick, setProgressTick] = useState(0);

  // Načtení kurzu (async v then-callbacku — ne synchronní setState v effect body).
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setData("loading");
    });
    getCourseBySlug(slug, lang)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  // Breadcrumbs.
  useEffect(() => {
    if (data && data !== "loading" && data !== "error") {
      const isProgramming = data.course.category === "programovani";
      setBreadcrumbs([
        { label: "Dashboard", href: eduPath(lang, "dashboard/") },
        ...(isProgramming ? [{ label: t("nav.programming"), href: eduPath(lang, "programovani/") }] : []),
        { label: data.course.title },
      ]);
    } else {
      setBreadcrumbs([{ label: "Dashboard", href: eduPath(lang, "dashboard/") }, { label: "Kurz" }]);
    }
  }, [data, lang, t, setBreadcrumbs]);

  // Re-render při změně progressu (completeLesson dispatchuje onProgress).
  useEffect(() => {
    return () => setProgressTick(0);
  }, []);
  void progressTick;

  if (data === "loading") {
    return <div className="max-w-3xl mx-auto p-16 text-center text-muted">Načítám kurz…</div>;
  }
  if (data === "error" || data === null) {
    return (
      <div className="max-w-xl mx-auto p-16 text-center">
        <div className="text-6xl font-bold gradient-text mb-4">404</div>
        <p className="text-muted mb-6" dangerouslySetInnerHTML={{ __html: `Kurz „${escapeHtml(slug)}" nebyl nalezen.` }} />
        <Link href={eduPath(lang, "dashboard/")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">
          Zpět domů
        </Link>
      </div>
    );
  }

  const { course } = data;
  const completed = getProgress().completedLessons;
  const totalLessons = courseLessonCount(course);
  const totalMinutes = courseMinutes(course);
  const totalHours = Math.ceil(totalMinutes / 60);
  const totalXP = courseXP(course);
  const completedCount = course.chapters.reduce(
    (acc, ch) => acc + ch.lessons.filter((l) => completed.includes(l.slug)).length,
    0,
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  let continueLesson: Lesson | null = null;
  for (const ch of course.chapters) {
    for (const l of ch.lessons) {
      if (!completed.includes(l.slug)) {
        continueLesson = l;
        break;
      }
    }
    if (continueLesson) break;
  }
  const allCompleted = completedCount === totalLessons && totalLessons > 0;
  const color = course.color || "#00d084";
  const dc = course.difficulty ? diffColor(course.difficulty) : null;
  const diffLabel = (d?: string) =>
    d === "beginner"
      ? t("programming.difficulty.beginner")
      : d === "advanced"
        ? t("programming.difficulty.advanced")
        : t("programming.difficulty.expert");
  const chapterLabel = (n: number) => (n === 1 ? t("course.chapter") : t("course.chapters"));

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <main className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        <div className="mb-10 md:mb-14">
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, color }}>
              <Icon name="graduation-cap" className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-hero-gradient-from)] to-[var(--color-hero-gradient-to)] bg-clip-text text-transparent">
                {course.title}
              </h1>
              <p className="mt-3 text-[var(--color-text-secondary)] text-lg max-w-2xl leading-relaxed">{course.description}</p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {course.difficulty && dc ? (
                  <span
                    className="text-[10px] px-2.5 py-1 rounded-full font-semibold border"
                    style={{ color: dc, backgroundColor: `${dc}14`, borderColor: `${dc}22` }}
                  >
                    {diffLabel(course.difficulty)}
                  </span>
                ) : null}
                {course.language ? (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#00d084]/10 text-[#00d084] font-semibold border border-[#00d084]/20">
                    {course.language}
                  </span>
                ) : null}
                {totalXP > 0 ? (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20 inline-flex items-center gap-1">
                    <Icon name="zap" className="h-3 w-3" />
                    {totalXP} XP
                  </span>
                ) : null}
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-500 font-semibold border border-sky-500/20 inline-flex items-center gap-1">
                  <Icon name="clock" className="h-3 w-3" />
                  {totalHours}h
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Icon name="book-open" className="h-4 w-4" />
                <span>
                  {course.chapters.length} {chapterLabel(course.chapters.length)} · {totalLessons} {lessonsUnit(totalLessons)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              {totalLessons > 0 ? <CircularProgress percent={progressPercent} size={90} stroke={7} color="#00d084" /> : null}
              {allCompleted ? (
                <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
                  <Icon name="star" className="h-4 w-4" />
                  {t("programming.completed")}
                </div>
              ) : continueLesson ? (
                <Link
                  href={eduPath(lang, `lekce/${continueLesson.slug}/`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  <Icon name="play" className="h-4 w-4" />
                  {completedCount > 0 ? t("programming.continue") : t("programming.start")}
                </Link>
              ) : null}
            </div>
          </div>
          {totalLessons > 0 ? (
            <div className="mt-6 max-w-md">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--color-text-secondary)]">{t("exercise.progress")}</span>
                <span className="text-emerald-500 font-medium">
                  {completedCount}/{totalLessons} ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-8">
          {course.chapters.map((chapter, chIndex) => (
            <ChapterSection
              key={chapter.id || chIndex}
              chapter={chapter}
              chIndex={chIndex}
              completed={completed}
              color={color}
              lang={lang}
              t={t}
              lessonsUnit={lessonsUnit}
            />
          ))}
        </div>

        <GamificationSection completedCount={completedCount} t={t} />
        <WhySection course={course} t={t} />
      </main>
    </div>
  );
}

interface ChapterSectionProps {
  chapter: { id: string; slug: string; title: string; lessons: Lesson[] };
  chIndex: number;
  completed: string[];
  color: string;
  lang: string;
  t: (k: string, v?: Record<string, string | number>) => string;
  lessonsUnit: (n: number) => string;
}

function ChapterSection({ chapter, chIndex, completed, color, lang, t, lessonsUnit }: ChapterSectionProps) {
  const chCompleted = chapter.lessons.filter((l) => completed.includes(l.slug)).length;
  const chProgress = chapter.lessons.length > 0 ? Math.round((chCompleted / chapter.lessons.length) * 100) : 0;

  return (
    <section className="glass rounded-xl p-5 md:p-6 border border-[var(--color-border-subtle)]">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold" style={{ backgroundColor: `${color}15`, color }}>
          {chIndex + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">{chapter.title}</h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span>
              {chapter.lessons.length} {lessonsUnit(chapter.lessons.length)}
            </span>
            <span>·</span>
            <span>
              {chCompleted}/{chapter.lessons.length}
            </span>
            {chProgress > 0 ? <span className="text-emerald-500 font-medium">({chProgress}%)</span> : null}
          </div>
        </div>
      </div>
      {chapter.lessons.length > 1 ? (
        <div className="mb-4 h-1.5 rounded-full bg-[var(--color-input-bg)] overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500/60 transition-all" style={{ width: `${chProgress}%` }} />
        </div>
      ) : null}
      <div className="space-y-2.5 relative">
        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-[var(--color-border-subtle)]" aria-hidden="true" />
        {chapter.lessons.map((lesson, lIndex) => {
          const isCompleted = completed.includes(lesson.slug);
          const isCurrent = !isCompleted && (lIndex === 0 || completed.includes(chapter.lessons[lIndex - 1].slug));
          let rowCls: string;
          let nodeCls: string;
          if (isCompleted) {
            rowCls = "bg-emerald-500/[0.04] border-emerald-500/15 hover:border-emerald-500/30";
            nodeCls = "bg-emerald-500 border-emerald-500";
          } else if (isCurrent) {
            rowCls = "bg-[var(--color-input-bg)] border-emerald-500/30 ring-1 ring-emerald-500/20 hover:border-emerald-500/50";
            nodeCls = "bg-[var(--color-background)] border-emerald-500";
          } else {
            rowCls = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)] hover:border-[var(--color-glass-highlight)]";
            nodeCls = "bg-[var(--color-background)] border-[var(--color-border-subtle)]";
          }
          const titleCls = isCompleted ? "text-emerald-500" : "text-[var(--color-foreground)] group-hover:text-emerald-500";
          const desc = (lesson as unknown as { description?: string; abstract?: string }).description || (lesson as unknown as { abstract?: string }).abstract || "";
          return (
            <Link
              key={lesson.slug}
              href={`/${lang}/edu/lekce/${lesson.slug}/`}
              className={`group relative block pl-10 pr-4 py-3.5 rounded-lg border transition-all ${rowCls}`}
            >
              <div className={`absolute left-2.5 top-4 h-3.5 w-3.5 rounded-full border-2 transition-colors z-10 ${nodeCls}`}>
                {isCompleted ? (
                  <Icon name="check-circle-2" className="h-2.5 w-2.5 text-white absolute -top-0.5 -left-0.5" />
                ) : isCurrent ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 absolute top-[3px] left-[3px]" />
                ) : null}
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[var(--color-text-muted)] font-mono tabular-nums">
                      {chIndex + 1}.{lIndex + 1}
                    </span>
                    <span className={`font-medium transition-colors ${titleCls}`}>{lesson.title}</span>
                    {isCompleted ? <Icon name="check-circle-2" className="h-3.5 w-3.5 text-emerald-500" /> : null}
                    {isCurrent && !isCompleted ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                        {t("programming.current")}
                      </span>
                    ) : null}
                    {!isCompleted && !isCurrent ? <Icon name="lock" className="h-3 w-3 text-[var(--color-text-muted)] opacity-40" /> : null}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{desc}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                    {lesson.xp && lesson.xp > 0 ? <XPBadge xp={lesson.xp} size="sm" /> : null}
                    {lesson.estimatedMinutes ? (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="clock" className="h-3 w-3" />
                        {lesson.estimatedMinutes} min
                      </span>
                    ) : null}
                  </div>
                </div>
                <Icon
                  name="chevron-right"
                  className={`h-4 w-4 mt-1 flex-shrink-0 transition-colors ${isCompleted ? "text-emerald-500" : "text-[var(--color-text-muted)] group-hover:text-emerald-500"}`}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function GamificationSection({
  completedCount,
  t,
}: {
  completedCount: number;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <section className="mt-16 glass rounded-xl p-6 md:p-8 border border-[var(--color-border-subtle)]">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="trophy" className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t("programming.gamification.title")}</h2>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mb-6">
        {t("programming.gamification.description")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] p-4">
          <Icon name="bar-chart-3" className="h-5 w-5 text-emerald-500 mb-2" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{t("programming.gamification.progress")}</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Sleduj svůj postup v každé kapitole a lekci.</p>
        </div>
        <div className="rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] p-4">
          <Icon name="star" className="h-5 w-5 text-amber-500 mb-2" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{t("programming.gamification.achievements")}</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Získávej odměny za dokončení kurzů a cvičení.</p>
        </div>
        <div className="rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] p-4">
          <Icon name="sparkles" className="h-5 w-5 text-sky-500 mb-2" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Level systém</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Čím více se učíš, tím vyšší level dosáhneš.</p>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-4 rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] p-4">
        <div className="h-14 w-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
          <span className="text-lg font-bold text-emerald-500">{Math.floor(completedCount / 5) + 1}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {completedCount < 5 ? t("programming.gamification.level.beginner") : completedCount < 15 ? "Pokročilý" : "Expert"}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{completedCount % 5} / 5 XP do dalšího levelu</p>
        </div>
      </div>
    </section>
  );
}

function WhySection({
  course,
  t,
}: {
  course: { category: string };
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const isAI = course.category === "ai";
  const title = isAI ? "Proč se učit AI gramotnosti?" : t("programming.why.title");
  const cards = isAI
    ? [
        { ic: "zap", c: "text-emerald-500", h: "Efektivita práce", p: "AI nástroje ti pomohou automatizovat rutinní úkoly, zrychlit práci a zlepšit výsledky v jakémkoli oboru." },
        { ic: "trending-up", c: "text-sky-500", h: "Budoucnost profesí", p: "AI mění pracovní trh. Kdo rozumí AI, má konkurenční výhodu a lepší vyhlídky na kariérní růst." },
        { ic: "brain", c: "text-purple-500", h: "Kritické myšlení", p: "AI gramotnost tě naučí kriticky hodnotit informace, rozpoznávat bias a ověřovat fakta v AI generovaném obsahu." },
      ]
    : [
        { ic: "zap", c: "text-emerald-500", h: t("programming.why.future.title"), p: t("programming.why.future.text") },
        { ic: "trending-up", c: "text-sky-500", h: t("programming.why.logic.title"), p: t("programming.why.logic.text") },
        { ic: "brain", c: "text-purple-500", h: t("programming.why.create.title"), p: t("programming.why.create.text") },
      ];
  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-5 hover:border-emerald-500/20 transition-colors">
            <Icon name={c.ic} className={`h-5 w-5 ${c.c} mb-3`} />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">{c.h}</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{c.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}