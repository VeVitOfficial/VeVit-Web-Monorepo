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

// Štítky obtížnosti (green/amber/red – stejné jako success/warning/error).
const DIFF: Record<string, { color: string; labelKey: string }> = {
  beginner: { color: "var(--vv-green)", labelKey: "programming.difficulty.beginner" },
  advanced: { color: "var(--vv-warn-text)", labelKey: "programming.difficulty.advanced" },
  expert: { color: "var(--vv-danger-text)", labelKey: "programming.difficulty.expert" },
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

// Loga jazyků a nástrojů (devicon, MIT) hostovaná lokálně v public/edu/assets/langs.
// Kurz bez loga (zaklady-programovani) zůstává u obecné ikony.
const LANG_LOGOS = new Set([
  "python", "javascript", "html-css", "sql", "terminal-bash", "typescript", "php", "git-github", "docker",
  "java", "csharp", "cpp", "rust", "go", "kotlin", "swift", "ruby",
]);
function LangLogo({ slug, size }: { slug: string; size: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/edu/assets/langs/${slug}.svg`} alt="" width={size} height={size} decoding="async" />;
}

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
      <div className="max-w-6xl mx-auto px-6">
        <section className="eh-hero">
          <div className="eh-hero__text">
            <h1 className="eh-title eh-title--two">
              <span>{t("programming.heroTitle")}</span>
              <span>{t("programming.heroAccent")}</span>
            </h1>
            <p className="eh-lead">{t("programming.heroSubtitle")}</p>
            <ResumePanel resume={resume} />
          </div>
          <div className="eh-art" aria-hidden="true">
            <div className="eh-hex eh-hex--ring" />
            <div className="eh-hex eh-hex--core" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="eh-mascot" src="/edu/assets/img/maskot-v1.webp" alt="" width={860} height={1290} decoding="async" />
            <span className="eh-tile eh-tile--a" style={{ "--c": "var(--vv-warning)" } as React.CSSProperties}><LangLogo slug="python" size={28} /></span>
            <span className="eh-tile eh-tile--b" style={{ "--c": "#3178c6" } as React.CSSProperties}><LangLogo slug="typescript" size={28} /></span>
            <span className="eh-tile eh-tile--c" style={{ "--c": "#2496ed" } as React.CSSProperties}><LangLogo slug="docker" size={28} /></span>
            <span className="eh-tile eh-tile--d" style={{ "--c": "#f05032" } as React.CSSProperties}><LangLogo slug="git-github" size={28} /></span>
          </div>
        </section>
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-10">
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
      <div className="eh-resume">
        <span className="eh-hexicon" style={{ "--c": "var(--vv-green)" } as React.CSSProperties}><Icon name="trophy" /></span>
        <div className="eh-resume__text">
          <p className="eh-resume__title">Všechny lekce dokončeny!</p>
          <p className="eh-resume__sub">Skvělá práce. Vrať se kdykoliv k repete.</p>
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
    <Link href={`/edu/lekce/${encodeURIComponent(resume.slug)}`} className="eh-resume">
      <span className="eh-hexicon" style={{ "--c": "var(--vv-green)" } as React.CSSProperties}><Icon name="play" /></span>
      <div className="eh-resume__text">
        <p className="eh-resume__label">{label}</p>
        <h3 className="eh-resume__title">{resume.lesson.title}</h3>
        <p className="eh-resume__sub">{resume.course.title}</p>
      </div>
      <span className="eh-btn">{btn} <Icon name="arrow-right" className="h-4 w-4" /></span>
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
    <div className="eh-filters">
      <div className="eh-pills" role="group" aria-label="Filtr kurzů">
        {PILLS.map((p) => (
          <button key={p.key} type="button" className="eh-pill" aria-pressed={active === p.key} onClick={() => onActive(p.key)}>
            {t(p.labelKey)} ({pillCount(p.key)})
          </button>
        ))}
      </div>
      <div className="eh-filter-search">
        <Icon name="search" />
        <label className="sr-only" htmlFor="prog-search">Hledat kurz</label>
        <input
          id="prog-search"
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("programming.searchPlaceholder")}
          className="eh-search-input"
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
    <div className="eh-courses">
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
  const color = course.color || "var(--vv-green)";
  return (
    <Link href={`/edu/kurzy/${course.slug}`} className="eh-cell">
      <div className="eh-card eh-card--course" style={{ "--c": color } as React.CSSProperties}>
        <div className="eh-course-head">
          {LANG_LOGOS.has(course.slug) ? (
            <span className="eh-hexicon eh-hexicon--logo">
              <LangLogo slug={course.slug} size={32} />
            </span>
          ) : (
            <span className="eh-hexicon"><Icon name={course.icon || "code-2"} /></span>
          )}
          <span className="eh-badge eh-badge--diff" style={{ color: dc, background: `color-mix(in srgb, ${dc} 12%, transparent)`, margin: 0 }}>{t(diff.labelKey)}</span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="eh-course-foot">
          <span><Icon name="book-open" /> {lessonsLabel(count)}</span>
          <span><Icon name="star" /> {xp.toLocaleString("cs-CZ")} XP</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Gamifikace ──────────────────────────────────────────────────────────────

function Gamification({ t }: { t: (key: string) => string }) {
  return (
    <section className="eh-level">
      <div className="eh-level__text">
        <h2 className="eh-h2" style={{ marginBottom: "0.75rem" }}><span className="eh-bullet" aria-hidden="true" />{t("programming.gamification.title")}</h2>
        <p>{t("programming.gamification.description")}</p>
        <div className="eh-level__chips">
          <span><Icon name="bar-chart-3" />{t("programming.gamification.progress")}</span>
          <span><Icon name="star" />{t("programming.gamification.achievements")}</span>
        </div>
      </div>
      <div className="eh-level__me">
        <span className="eh-hexnum">1</span>
        <div>
          <div className="text-sm font-semibold text-[var(--color-text-primary)]">{t("programming.gamification.level.beginner")}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">{t("programming.gamification.level.xpToNext")}</div>
        </div>
      </div>
    </section>
  );
}

// ─── Why section ─────────────────────────────────────────────────────────────

function WhySection({ t }: { t: (key: string) => string }) {
  const cards = [
    { ic: "globe", k: "programming.why.future", c: "var(--vv-green)" },
    { ic: "lock", k: "programming.why.logic", c: "var(--vv-violet)" },
    { ic: "star", k: "programming.why.create", c: "var(--vv-warning)" },
  ];
  return (
    <section className="mt-20">
      <h2 className="eh-h2"><span className="eh-bullet" aria-hidden="true" />{t("programming.why.title")}</h2>
      <div className="eh-why">
        {cards.map((c) => (
          <div key={c.k} className="eh-card" style={{ "--c": c.c } as React.CSSProperties}>
            <span className="eh-hexicon"><Icon name={c.ic} /></span>
            <div className="eh-card__body">
              <h3>{t(`${c.k}.title`)}</h3>
              <p>{t(`${c.k}.text`)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
