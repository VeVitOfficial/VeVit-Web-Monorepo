"use client";

// Port edu/js/pages/programovani.js do Reactu.
// „Nauč se programovat": hero s pozadím ze snippetů + resume panel,
// filtry (pills + vyhledávání), grid kurzů, gamifikace, why-section.
// Chování, class names i texty 1:1 s legacy (renderProgramovani).
// Imperativní DOM (innerHTML/$/bindPills/renderIcons) nahraženo React stavem.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useEduLang } from "../i18n";
import { useEduBreadcrumbs } from "../breadcrumbs";
import { findResumeLesson, getIndex } from "@/lib/edu/api";
import { getProgress } from "@/lib/edu/progress";
import { Icon } from "./home-icons";
import type { CourseIndexMeta, Progress } from "@/lib/edu/config";

// Štítky obtížnosti (emerald/amber/red – stejné jako success/warning/error).
const DIFF: Record<string, { color: string; labelKey: string }> = {
  beginner: { color: "#10b981", labelKey: "programming.difficulty.beginner" },
  advanced: { color: "#f59e0b", labelKey: "programming.difficulty.advanced" },
  expert: { color: "#ef4444", labelKey: "programming.difficulty.expert" },
};

// Kategorie kurzů podle slugu (legacy CAT).
const CAT: Record<string, string> = {
  python: "programovani", javascript: "programovani", typescript: "programovani", php: "programovani",
  java: "programovani", csharp: "programovani", cpp: "programovani", rust: "programovani", go: "programovani",
  kotlin: "programovani", swift: "programovani", ruby: "programovani",
  "html-css": "web-db", sql: "web-db",
  "terminal-bash": "nastroje", "git-github": "nastroje", docker: "nastroje",
  "zaklady-programovani": "zaklady",
};

// Pill filtry (kategorie + obtížnost).
const PILLS: { key: string; labelKey: string; type: "all" | "category" | "difficulty" }[] = [
  { key: "all", labelKey: "programming.cat.all", type: "all" },
  { key: "programovani", labelKey: "programming.cat.programming", type: "category" },
  { key: "web-db", labelKey: "programming.cat.webdb", type: "category" },
  { key: "nastroje", labelKey: "programming.cat.tools", type: "category" },
  { key: "zaklady", labelKey: "programming.cat.basics", type: "category" },
  { key: "beginner", labelKey: "programming.cat.beginners", type: "difficulty" },
  { key: "advanced", labelKey: "programming.cat.advanced", type: "difficulty" },
];

// Pozadí hero sekce — rotující snippetů (legacy codeSnippets).
const CODE_SNIPPETS = [
  'print("Hello, World!")', 'const sum = (a, b) => a + b;', 'fn main() { println!("Rust!"); }',
  'SELECT * FROM users WHERE active = 1;', 'docker run -p 3000:3000 myapp', '<div class="hero">VeVit Edu</div>',
  'go func() { fmt.Println("Go!") }()', 'class Hero extends React.Component { }',
];

export function EduProgramovaniPage({ locale }: { locale: string }) {
  void locale;
  const { t, lang, lessonsLabel } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();

  const [index, setIndex] = useState<CourseIndexMeta[] | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState("");

  // Načtení indexu + progressu (setState v promise callbacku).
  useEffect(() => {
    setBreadcrumbs([]);
    let cancelled = false;
    Promise.all([
      getIndex(lang).catch((e) => { throw new Error(String((e as Error)?.message || e)); }),
      Promise.resolve().then(() => getProgress()),
    ])
      .then(([idx, prog]) => {
        if (cancelled) return;
        setIndex(idx);
        setProgress(prog);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String((e as Error)?.message || e));
      });
    return () => { cancelled = true; };
  }, [lang, setBreadcrumbs]);

  const courses = useMemo(
    () => (index ?? []).filter((c) => c.category === "programovani"),
    [index],
  );

  const resume = useMemo(() => {
    if (!index || !progress) return null;
    return findResumeLesson(index, progress, true);
  }, [index, progress]);

  const pillCount = useCallback((key: string): number => {
    if (key === "all") return courses.length;
    if (key === "beginner") return courses.filter((c) => c.difficulty === "beginner").length;
    if (key === "advanced") return courses.filter((c) => c.difficulty === "advanced" || c.difficulty === "expert").length;
    return courses.filter((c) => CAT[c.slug] === key).length;
  }, [courses]);

  const filtered = useMemo(() => {
    let r = courses;
    if (active === "beginner") r = r.filter((c) => c.difficulty === "beginner");
    else if (active === "advanced") r = r.filter((c) => c.difficulty === "advanced" || c.difficulty === "expert");
    else if (active !== "all") r = r.filter((c) => CAT[c.slug] === active);
    const q = query.trim().toLowerCase();
    if (q) {
      r = r.filter((c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.language || "").toLowerCase().includes(q),
      );
    }
    return r;
  }, [courses, active, query]);

  const bgSpans = useMemo(
    () => Array.from({ length: 60 }).map((_, i) => CODE_SNIPPETS[i % CODE_SNIPPETS.length]),
    [],
  );

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-muted">
        Chyba: {error}
      </div>
    );
  }

  if (!index || !progress) {
    return (
      <div className="max-w-3xl mx-auto p-20 text-center text-[var(--color-text-muted)]">
        <span className="ai-spinner" /> Načítám…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <section className="relative overflow-hidden border-b border-[var(--color-border-subtle)]">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none select-none">
          <div className="absolute inset-0 flex flex-wrap content-start gap-x-8 gap-y-2 p-8 text-[10px] font-mono text-emerald-500">
            {bgSpans.map((s, i) => (
              <span key={i} className="whitespace-nowrap">{s}</span>
            ))}
          </div>
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-[var(--color-text-primary)]">
              {t("programming.heroTitle")} <span className="text-emerald-500">{t("programming.heroAccent")}</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-[var(--color-text-secondary)]">
              {t("programming.heroSubtitle")}
            </p>
            <ResumePanel resume={resume} />
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <Filters
          active={active}
          onActive={setActive}
          query={query}
          onQuery={setQuery}
          pillCount={pillCount}
          t={t}
        />
        <Grid courses={filtered} t={t} lessonsLabel={lessonsLabel} />
        <Gamification t={t} />
        <WhySection t={t} />
      </main>
      <div className="h-20" />
    </div>
  );
}

// ─── Resume panel ────────────────────────────────────────────────────────────

type ResumeData = ReturnType<typeof findResumeLesson>;

function ResumePanel({ resume }: { resume: ResumeData }) {
  if (!resume) {
    return (
      <div className="max-w-lg mx-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-500">
          <Icon name="trophy" className="h-6 w-6" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-base font-semibold text-[var(--color-text-primary)]">Všechny lekce dokončeny!</p>
          <p className="text-xs text-[var(--color-text-muted)]">Skvělá práce. Vrať se kdykoliv k repete.</p>
        </div>
      </div>
    );
  }
  const labels: Record<string, [string, string]> = {
    resume: ["Pokračovat v poslední lekci", "Pokračovat"],
    continue: ["Pokračovat v učení", "Pokračovat"],
    start: ["Začít se učit programovat", "Začít"],
  };
  const [label, btn] = labels[resume.mode] ?? labels.start;
  return (
    <Link
      href={`/edu/lekce/${encodeURIComponent(resume.slug)}`}
      className="max-w-lg mx-auto group block rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] hover:border-emerald-500/30 p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-500">
        <Icon name="play" className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500">{label}</p>
        <h3 className="text-base font-semibold truncate text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors">{resume.lesson.title}</h3>
        <p className="text-xs truncate text-[var(--color-text-muted)]">{resume.course.title}</p>
      </div>
      <span className="shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-lg font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors">
        {btn} <Icon name="arrow-right" className="h-4 w-4" />
      </span>
    </Link>
  );
}

// ─── Filtry (pills + search) ─────────────────────────────────────────────────

function Filters({
  active,
  onActive,
  query,
  onQuery,
  pillCount,
  t,
}: {
  active: string;
  onActive: (k: string) => void;
  query: string;
  onQuery: (q: string) => void;
  pillCount: (k: string) => number;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-1 px-1 md:flex-wrap md:overflow-visible">
        {PILLS.map((p) => {
          const on = active === p.key;
          const cls = on
            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
            : "bg-[var(--color-card-bg)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-glass-highlight)]";
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onActive(p.key)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border whitespace-nowrap ${cls}`}
            >
              {t(p.labelKey)} ({pillCount(p.key)})
            </button>
          );
        })}
      </div>
      <div className="relative md:ml-auto md:w-72">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none text-[var(--color-text-muted)]" />
        <label className="sr-only" htmlFor="prog-search">Hledat kurz</label>
        <input
          id="prog-search"
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("programming.searchPlaceholder")}
          className="w-full h-11 pl-12 pr-4 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
        />
      </div>
    </div>
  );
}

// ─── Grid kurzů ──────────────────────────────────────────────────────────────

function Grid({
  courses,
  t,
  lessonsLabel,
}: {
  courses: CourseIndexMeta[];
  t: (key: string) => string;
  lessonsLabel: (count: number) => string;
}) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--color-text-secondary)]">
        <Icon name="search" className="h-12 w-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
        <p>{t("programming.emptySearch")}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((course) => (
        <CourseCard key={course.slug} course={course} t={t} lessonsLabel={lessonsLabel} />
      ))}
    </div>
  );
}

function CourseCard({
  course,
  t,
  lessonsLabel,
}: {
  course: CourseIndexMeta;
  t: (key: string) => string;
  lessonsLabel: (count: number) => string;
}) {
  const count = (course.lessons || []).length || course.totalLessons || 0;
  const xp = course.totalXP || 0;
  const diff = DIFF[course.difficulty || "beginner"] || DIFF.beginner;
  const dc = diff.color;
  const color = course.color || "#10b981";
  return (
    <Link href={`/edu/kurzy/${course.slug}`} className="group block">
      <div className="relative h-full rounded-xl bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] border border-[var(--color-border-subtle)] hover:border-emerald-500/30 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_24px_-6px_rgba(16,185,129,0.3)]">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18`, color }}>
            <Icon name={course.icon || "code-2"} className="h-5 w-5" />
          </div>
          <span
            className="text-[10px] px-2.5 py-1 rounded-full font-medium border whitespace-nowrap"
            style={{ color: dc, backgroundColor: `${dc}1F`, borderColor: `${dc}40` }}
          >
            {t(diff.labelKey)}
          </span>
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors mb-2">{course.title}</h3>
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 mb-4">{course.description}</p>
        <div className="flex items-center justify-between text-[11px] pt-3 border-t border-[var(--color-border-subtle)]">
          <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
            <Icon name="book-open" className="h-3.5 w-3.5" /> {lessonsLabel(count)}
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-500">
            <Icon name="star" className="h-3.5 w-3.5" /> {xp.toLocaleString("cs-CZ")} XP
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Gamifikace ──────────────────────────────────────────────────────────────

function Gamification({ t }: { t: (key: string) => string }) {
  return (
    <section className="mt-20 rounded-2xl p-8 md:p-10 border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)]">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="trophy" className="h-5 w-5 text-emerald-500" />
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{t("programming.gamification.title")}</h2>
          </div>
          <p className="text-sm leading-relaxed mb-4 text-[var(--color-text-secondary)]">{t("programming.gamification.description")}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <Icon name="bar-chart-3" className="h-4 w-4 text-emerald-500" />
              <span>{t("programming.gamification.progress")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <Icon name="star" className="h-4 w-4 text-emerald-500" />
              <span>{t("programming.gamification.achievements")}</span>
            </div>
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <div className="flex items-center gap-4 rounded-xl p-4 border border-[var(--color-border-subtle)] bg-[var(--color-background)]">
            <div className="h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-black">1</div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">{t("programming.gamification.level.beginner")}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">{t("programming.gamification.level.xpToNext")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Why section ─────────────────────────────────────────────────────────────

function WhySection({ t }: { t: (key: string) => string }) {
  const cards = [
    { ic: "globe", k: "programming.why.future" },
    { ic: "lock", k: "programming.why.logic" },
    { ic: "star", k: "programming.why.create" },
  ];
  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold mb-8 text-center text-[var(--color-text-primary)]">{t("programming.why.title")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((c) => (
          <div key={c.k} className="rounded-xl p-6 border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)]">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-500/10 text-emerald-500">
              <Icon name={c.ic} className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold mb-2 text-[var(--color-text-primary)]">{t(`${c.k}.title`)}</h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t(`${c.k}.text`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}