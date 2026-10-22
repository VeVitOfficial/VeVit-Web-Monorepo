"use client";

// Port edu/js/pages/home.js do Reactu.
// Dashboard: hero s našeptávačem, „Pokračovat v učení", kategorie kurzů,
// nedávno přidáno, seznam vlastních lekcí s mazáním. Chování, class names i
// texty jsou 1:1 s legacy (renderHome + attachAutocomplete). Imperativní DOM
// (innerHTML/$/navigate) nahraženo React stavem + next/link + useRouter.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useEduLang } from "../i18n";
import { useEduBreadcrumbs } from "../breadcrumbs";
import { getIndex } from "@/lib/edu/api";
import { getProgress } from "@/lib/edu/progress";
import {
  deleteCustomLesson,
  loadCustomLessons,
  type CustomLesson,
} from "@/lib/edu/custom-lessons";
import { PROGRAMMING_COURSES_COUNT, PROGRAMMING_TOTAL_LESSONS } from "@/lib/edu/config";
import type { CourseIndexMeta, Progress } from "@/lib/edu/config";
import { Icon } from "./home-icons";
import { EduCapIcon, SearchSuggest, WikiIcon, eduSuggestionsFromIndex, type EduSuggestion } from "../search-suggest";

// Kategorie → ikona pro „recently added" a vlastní lekce (shodně s legacy).
const categoryIconMap: Record<string, string> = {
  Matematika: "calculator",
  Fyzika: "atom",
  Historie: "scroll-text",
  Chemie: "flask-conical",
  "AI gramotnost": "brain",
};

// Ikony pro continue cards (legacy dashboardIconMap).
const dashboardIconMap: Record<string, string> = {
  Terminal: "terminal",
  Brain: "brain",
  Calculator: "calculator",
  Atom: "atom",
  History: "history",
  FlaskConical: "flask-conical",
  Code2: "code-2",
  BookOpen: "book-open",
};

// Nedávno přidáno — konstantní seznam z legacy home.js (bez programovacích lekcí).
const RECENTLY_ADDED = [
  { id: "r1", category: "Matematika", title: "Derivace a jejich geometrický význam", date: "1. dubna 2026", duration: "10 min" },
  { id: "r2", category: "Fyzika", title: "Elektrostatika a elektrické pole", date: "28. března 2026", duration: "15 min" },
  { id: "r3", category: "Historie", title: "České země za vlády Lucenburgurků", date: "15. března 2026", duration: "20 min" },
  { id: "r4", category: "Chemie", title: "Úvod do organické chemie a uhlovodíky", date: "10. března 2026", duration: "12 min" },
];

interface ContinueItem {
  title: string;
  description: string;
  color: string;
  icon: string;
  completed: number;
  total: number;
  percent: number;
  href: string;
}


// První textový náhled bloku vlastní lekce (shodně s legacy getFirstTextPreview).
function getFirstTextPreview(blocks: unknown[] | undefined): string {
  if (!Array.isArray(blocks)) return "Vlastní lekce";
  for (const b of blocks) {
    const block = b as { type?: string; text?: string };
    if (block.type === "paragraph" && block.text) return block.text.slice(0, 80).replace(/\n/g, " ") + "…";
    if (block.type === "heading" && block.text) return block.text.slice(0, 80) + "…";
  }
  return "Vlastní lekce";
}

export function EduHomePage({ locale, aifbLessons }: { locale: string; aifbLessons: number }) {
  // locale z x-vv-locale hlavičky — useEduLang() ho inicializuje a nabízí t/lessonsUnit.
  void locale;
  const { t, lang, lessonsLabel } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();

  const [index, setIndex] = useState<CourseIndexMeta[] | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [customLessons, setCustomLessons] = useState<CustomLesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Načtení dat — index z api, progress/customLessons z localStorage.
  // setState v promise callbackech (ne synchronně v těle effectu).
  useEffect(() => {
    setBreadcrumbs([]);
    let cancelled = false;
    Promise.all([
      getIndex(lang).catch((e) => { throw new Error(String(e.message || e)); }),
      Promise.resolve().then(() => getProgress()),
    ])
      .then(([idx, prog]) => {
        if (cancelled) return;
        setIndex(idx);
        setProgress(prog);
        setCustomLessons(loadCustomLessons());
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String((e as Error).message || e));
      });
    return () => { cancelled = true; };
  }, [lang, setBreadcrumbs]);

  const programming = useMemo(
    () => (index ?? []).filter((c) => c.category === "programovani"),
    [index],
  );
  const nonProgramming = useMemo(
    () => (index ?? []).filter((c) => c.category !== "programovani"),
    [index],
  );

  // Continue Learning — 1:1 merge logika z legacy renderHome.
  const continueItems = useMemo<ContinueItem[]>(() => {
    if (!progress) return [];
    const completed = progress.completedLessons;
    const items: ContinueItem[] = [];
    const progCompleted = programming.reduce(
      (acc, c) => acc + (c.lessons || []).filter((l) => completed.includes(l.slug)).length,
      0,
    );
    if (progCompleted > 0 && progCompleted < PROGRAMMING_TOTAL_LESSONS) {
      items.push({
        title: t("home.categories.programming"),
        description: t("home.categories.programmingDesc"),
        color: "#00d084",
        icon: "Terminal",
        completed: progCompleted,
        total: PROGRAMMING_TOTAL_LESSONS,
        percent: Math.round((progCompleted / PROGRAMMING_TOTAL_LESSONS) * 100),
        href: "/edu/programovani",
      });
    }
    for (const course of nonProgramming) {
      const slugs = (course.lessons || []).map((l) => l.slug);
      const total = slugs.length;
      if (total === 0) continue;
      const done = slugs.filter((s) => completed.includes(s)).length;
      if (done > 0 && done < total) {
        items.push({
          title: course.title,
          description: course.description,
          color: course.color || "#00d084",
          icon: course.icon || "BookOpen",
          completed: done,
          total,
          percent: Math.round((done / total) * 100),
          href: `/edu/kurzy/${course.slug}`,
        });
      }
    }
    return items.slice(0, 3);
  }, [progress, programming, nonProgramming, t]);

  const cats = useMemo(
    () => [
      { id: "programming", titleKey: "home.categories.programming", descKey: "home.categories.programmingDesc", icon: "Terminal", href: "/edu/programovani", color: "#00d084", count: PROGRAMMING_COURSES_COUNT, countLabel: t("home.courses"), disabled: false },
      { id: "ai", titleKey: "home.categories.aiLiteracy", descKey: "home.categories.aiLiteracyDesc", icon: "Brain", href: "/edu/ai-gramotnost", color: "#8b5cf6", count: 0, countLabel: lessonsLabel(aifbLessons), disabled: false },
      { id: "matematika", titleKey: "home.categories.math", descKey: "home.categories.mathDesc", icon: "Calculator", href: "#", color: "#facc15", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
      { id: "fyzika", titleKey: "home.categories.physics", descKey: "home.categories.physicsDesc", icon: "Atom", href: "#", color: "#f97316", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
      { id: "historie", titleKey: "home.categories.history", descKey: "home.categories.historyDesc", icon: "History", href: "/edu/historie", color: "#a78bfa", count: 0, countLabel: t("landing.comingSoon"), disabled: false },
      { id: "chemie", titleKey: "home.categories.chemistry", descKey: "home.categories.chemistryDesc", icon: "FlaskConical", href: "/edu/chemie", color: "#0ea5e9", count: 0, countLabel: t("landing.comingSoon"), disabled: false },
    ],
    [t, lessonsLabel, aifbLessons],
  );

  // Filtr recently added — bez programovacích jazyků v titulu/kategorii.
  const filteredRecently = useMemo(
    () => RECENTLY_ADDED.filter(
      (item) => !["Python", "JavaScript", "HTML", "SQL"].some(
        (p) => item.title.toLowerCase().includes(p.toLowerCase()) || item.category.toLowerCase().includes(p.toLowerCase()),
      ),
    ),
    [],
  );

  const titleParts = useMemo(() => t("landing.title").split(". "), [t]);

  const handleDeleteCustomLesson = useCallback((lesson: CustomLesson) => {
    if (!window.confirm(t("my.confirmDelete"))) return;
    deleteCustomLesson(String(lesson.slug));
    setCustomLessons(loadCustomLessons());
  }, [t]);

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
      <main className="max-w-6xl mx-auto px-6 py-10">
        <HeroSearch
          index={index}
          recentlyAdded={RECENTLY_ADDED}
          customLessons={customLessons}
          placeholder={t("landing.searchPlaceholder")}
          lang={lang}
          titleParts={titleParts}
          lead={t("landing.lead")}
        />

        {continueItems.length > 0 ? (
          <section className="mb-16">
            <h2 className="eh-h2">
              <span className="eh-bullet" aria-hidden="true" />
              {t("home.continueLearning")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {continueItems.map((item) => (
                <ContinueCard key={item.href} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mb-20">
          <h2 className="eh-h2"><span className="eh-bullet" aria-hidden="true" />{t("home.categories.title")}</h2>
          <div className="eh-cats">
            {cats.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} t={t} />
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="eh-h2"><span className="eh-bullet" aria-hidden="true" />{t("landing.recentlyAdded")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecently.map((item) => (
              <RecentCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <h2 className="eh-h2" style={{ margin: 0 }}><span className="eh-bullet" aria-hidden="true" />{t("landing.lessons")}</h2>
            </div>
            <Link
              href="/edu/lekce/vytvorit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:border-emerald-500/30 hover:text-emerald-500 transition-colors"
            >
              <Icon name="plus" className="h-4 w-4" />
              Vytvořit vlastní
            </Link>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">{t("landing.userLessons")}</p>
          <CustomLessonsGrid lessons={customLessons} onDelete={handleDeleteCustomLesson} />
        </section>
      </main>
    </div>
  );
}

// ─── Hero search s našeptávačem ─────────────────────────────────────────────

function HeroSearch({
  index,
  recentlyAdded,
  customLessons,
  placeholder,
  lang,
  titleParts,
  lead,
}: {
  index: CourseIndexMeta[];
  recentlyAdded: { id: string; category: string; title: string }[];
  customLessons: CustomLesson[];
  placeholder: string;
  lang: string;
  titleParts: string[];
  lead: string;
}) {
  const eduItems = useMemo<EduSuggestion[]>(() => [
    ...eduSuggestionsFromIndex(index),
    ...(recentlyAdded || []).map((r) => ({
      source: "edu" as const, label: r.title, sub: `Nově přidáno · ${r.category}`, href: `/edu/hledat?q=${encodeURIComponent(r.title)}`,
    })),
    ...(customLessons || []).map((cl) => ({
      source: "edu" as const, label: cl.title, sub: `Vlastní lekce · ${String(cl.category || "")}`, href: `/edu/lekce/moje/detail?slug=${encodeURIComponent(cl.slug)}`,
    })),
  ], [index, recentlyAdded, customLessons]);

  return (
    <section className="eh-hero">
      <div className="eh-hero__text">
        <h1 className="eh-title">
          <span>{titleSafe(titleParts[0])}.</span>
          <span>{titleSafe(titleParts[1])}.</span>
          <span>{titleSafe(titleParts[2]).replace(/\.$/, "")}.</span>
        </h1>
        <p className="eh-lead">{lead}</p>
        <div className="eh-search">
          <SearchSuggest
            eduItems={eduItems}
            lang={lang}
            placeholder={placeholder}
            inputClassName="eh-search-input"
          />
          <p className="eh-search-hint">
            <span className="inline-flex items-center gap-1 align-middle text-emerald-500"><EduCapIcon className="h-3.5 w-3.5" /></span> kurzy a lekce VeVit Edu,{" "}
            <span className="inline-flex items-center gap-1 align-middle"><WikiIcon className="h-3.5 w-3.5" /></span> články z Wikipedie. Dotaz ukončený <span className="text-emerald-500 font-medium">?</span> zapne odpověď AI nad článkem.
          </p>
        </div>
      </div>
      <div className="eh-art" aria-hidden="true">
        <div className="eh-hex eh-hex--ring" />
        <div className="eh-hex eh-hex--core" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="eh-mascot" src="/edu/assets/img/maskot-v1.webp" alt="" width={860} height={1290} decoding="async" />
        <span className="eh-tile eh-tile--a"><Icon name="terminal" /></span>
        <span className="eh-tile eh-tile--b"><Icon name="brain" /></span>
        <span className="eh-tile eh-tile--c"><Icon name="atom" /></span>
        <span className="eh-tile eh-tile--d"><Icon name="calculator" /></span>
      </div>
    </section>
  );
}

function titleSafe(s: string | undefined): string {
  return String(s ?? "");
}

// ─── Continue card ───────────────────────────────────────────────────────────

function ContinueCard({ item }: { item: ContinueItem }) {
  const iconName = dashboardIconMap[item.icon] || item.icon || "book-open";
  return (
    <Link
      href={item.href}
      className="group block rounded-xl bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] backdrop-blur-md border border-[var(--color-border-subtle)] p-5 transition-all duration-300 hover:border-emerald-500/30 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${item.color}15`, color: item.color }}
        >
          <Icon name={iconName} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors truncate">{item.title}</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">{item.completed}/{item.total} ({item.percent}%)</p>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--color-input-bg)] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${item.percent}%` }} />
          </div>
        </div>
        <Icon name="arrow-right" className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-emerald-500 transition-colors mt-2 shrink-0" />
      </div>
    </Link>
  );
}

// ─── Category card ───────────────────────────────────────────────────────────

type CategoryDef = {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  href: string;
  color: string;
  count: number;
  countLabel: string;
  disabled: boolean;
};

function CategoryCard({ cat, t }: { cat: CategoryDef; t: (key: string) => string }) {
  const badgeText = `${cat.count > 0 ? `${cat.count} ` : ""}${cat.countLabel}`;
  const inner = (
    <div
      className={`eh-card${cat.disabled ? " eh-card--off" : " eh-card--big"}`}
      style={{ "--c": cat.color } as React.CSSProperties}
    >
      <span className="eh-hexicon"><Icon name={cat.icon} /></span>
      <div className="eh-card__body">
        <h3>{t(cat.titleKey)}</h3>
        <p>{t(cat.descKey)}</p>
        <span className="eh-badge">{badgeText}</span>
      </div>
    </div>
  );

  if (cat.disabled) return <div className="eh-cell" aria-disabled="true">{inner}</div>;
  return (
    <Link href={cat.href} className="eh-cell eh-cell--big">
      {inner}
    </Link>
  );
}

// ─── Recent card ─────────────────────────────────────────────────────────────

function RecentCard({ item }: { item: { id: string; category: string; title: string; date: string; duration: string } }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] backdrop-blur-md border border-[var(--color-border-subtle)] p-4 transition-all duration-300 hover:border-[var(--color-glass-border)] cursor-pointer group shadow-sm">
      <div className="h-12 w-12 rounded-xl bg-[var(--color-input-bg)] flex items-center justify-center text-emerald-500 shrink-0">
        <Icon name={categoryIconMap[item.category] || "book-open"} className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold mb-0.5">{item.category}</p>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors truncate">{item.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><Icon name="calendar" className="h-3 w-3" />{item.date}</span>
          <span className="text-[var(--color-text-muted)]">•</span>
          <span className="flex items-center gap-1"><Icon name="clock" className="h-3 w-3" />{item.duration}</span>
        </div>
      </div>
      <Icon name="arrow-right" className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-emerald-500 transition-colors shrink-0" />
    </div>
  );
}

// ─── Custom lessons grid ─────────────────────────────────────────────────────

function CustomLessonsGrid({
  lessons,
  onDelete,
}: {
  lessons: CustomLesson[];
  onDelete: (lesson: CustomLesson) => void;
}) {
  if (lessons.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">Zatím tu nejsou žádné vlastní lekce.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lessons.map((lesson) => {
        const id = String(lesson.id ?? lesson.slug);
        const category = String(lesson.category || "Ostatní");
        const preview = String(lesson.description || getFirstTextPreview(lesson.blocks as unknown[] | undefined));
        return (
          <div key={id} className="group relative rounded-xl bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] backdrop-blur-md border border-[var(--color-border-subtle)] p-5 transition-all duration-300 hover:border-emerald-500/20 shadow-sm">
            <Link href={`/edu/lekce/moje/detail?slug=${encodeURIComponent(String(lesson.slug))}`} className="block">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                  <Icon name={categoryIconMap[category] || "book-open"} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors truncate">{lesson.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{preview}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-2">{category}</p>
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => onDelete(lesson)}
              className="absolute top-3 right-3 p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              title="Smazat lekci"
              aria-label="Smazat lekci"
            >
              <Icon name="trash-2" className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}