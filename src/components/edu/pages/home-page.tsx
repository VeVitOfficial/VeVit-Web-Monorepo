"use client";

// Port edu/js/pages/home.js do Reactu.
// Dashboard: hero s našeptávačem, „Pokračovat v učení", kategorie kurzů,
// nedávno přidáno, seznam vlastních lekcí s mazáním. Chování, class names i
// texty jsou 1:1 s legacy (renderHome + attachAutocomplete). Imperativní DOM
// (innerHTML/$/navigate) nahraženo React stavem + next/link + useRouter.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface Suggestion {
  type: "course" | "lesson" | "recent" | "custom";
  label: string;
  sub: string;
  href: () => string;
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

export function EduHomePage({ locale }: { locale: string }) {
  // locale z x-vv-locale hlavičky — useEduLang() ho inicializuje a nabízí t/lessonsUnit.
  void locale;
  const { t, lessonsUnit, lang } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();
  const router = useRouter();

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
      { id: "ai", titleKey: "home.categories.aiLiteracy", descKey: "home.categories.aiLiteracyDesc", icon: "Brain", href: "/edu/ai-gramotnost/", color: "#8b5cf6", count: 36, countLabel: lessonsUnit(36), disabled: false },
      { id: "matematika", titleKey: "home.categories.math", descKey: "home.categories.mathDesc", icon: "Calculator", href: "#", color: "#facc15", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
      { id: "fyzika", titleKey: "home.categories.physics", descKey: "home.categories.physicsDesc", icon: "Atom", href: "#", color: "#f97316", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
      { id: "historie", titleKey: "home.categories.history", descKey: "home.categories.historyDesc", icon: "History", href: "#", color: "#a78bfa", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
      { id: "chemie", titleKey: "home.categories.chemistry", descKey: "home.categories.chemistryDesc", icon: "FlaskConical", href: "#", color: "#0ea5e9", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
    ],
    [t, lessonsUnit],
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
          router={router}
          titleParts={titleParts}
        />

        {continueItems.length > 0 ? (
          <section className="mb-16">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
              <Icon name="play" className="h-5 w-5 text-emerald-500" />
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
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">{t("home.categories.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cats.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} t={t} />
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">{t("landing.recentlyAdded")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecently.map((item) => (
              <RecentCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{t("landing.lessons")}</h2>
              <Icon name="book-open" className="h-5 w-5 text-[var(--color-text-muted)]" />
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
  router,
  titleParts,
}: {
  index: CourseIndexMeta[];
  recentlyAdded: { id: string; category: string; title: string }[];
  customLessons: CustomLesson[];
  placeholder: string;
  router: ReturnType<typeof useRouter>;
  titleParts: string[];
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const out: Suggestion[] = [];
    for (const c of index || []) {
      out.push({ type: "course", label: c.title, sub: c.category, href: () => `/edu/kurzy/${encodeURIComponent(c.slug)}` });
      for (const l of (c.lessons || [])) {
        out.push({ type: "lesson", label: l.title, sub: c.title, href: () => `/edu/lekce/${encodeURIComponent(l.slug)}` });
      }
    }
    for (const r of recentlyAdded || []) {
      out.push({ type: "recent", label: r.title, sub: r.category, href: () => `/edu/hledat?q=${encodeURIComponent(r.title)}` });
    }
    for (const cl of customLessons || []) {
      out.push({ type: "custom", label: cl.title, sub: String(cl.category || "Vlastní lekce"), href: () => `/edu/lekce/moje/detail?slug=${encodeURIComponent(cl.slug)}` });
    }
    return out;
  }, [index, recentlyAdded, customLessons]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const renderMatches = useCallback((q: string) => {
    const ql = q.toLowerCase();
    const scored = suggestions
      .map((s, i) => {
        const hay = (s.label + " " + (s.sub || "")).toLowerCase();
        const idx = hay.indexOf(ql);
        if (idx === -1) return null;
        const prefix = s.label.toLowerCase().indexOf(ql) === 0 ? 0 : 1;
        return { s, prefix, order: i };
      })
      .filter(Boolean)
      .sort((a, b) => (a!.prefix - b!.prefix) || (a!.order - b!.order))
      .slice(0, 8)
      .map((x) => x!.s);
    setMatches(scored);
    setActiveIndex(-1);
    setOpen(true);
  }, [suggestions]);

  const selectItem = useCallback((item: Suggestion | undefined) => {
    if (!item) return;
    setValue(item.label);
    close();
    router.push(item.href());
  }, [router, close]);

  const onInput = useCallback((v: string) => {
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = v.trim();
    if (!trimmed) { close(); return; }
    debounceRef.current = setTimeout(() => renderMatches(trimmed), 150);
  }, [close, renderMatches]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (!open) { const v = value.trim(); if (v) renderMatches(v); return; }
      if (matches.length === 0) return;
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      if (!open || matches.length === 0) return;
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && matches[activeIndex]) {
        e.preventDefault();
        selectItem(matches[activeIndex]);
      } else {
        const v = value.trim();
        if (v) router.push(`/edu/hledat?q=${encodeURIComponent(v)}`);
      }
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); close(); }
    }
  }, [open, matches, activeIndex, value, router, selectItem, close, renderMatches]);

  // Klik mimo wrapper zavře dropdown.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [close]);

  return (
    <section className="text-center pt-8 pb-16 md:pt-12 md:pb-20">
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2">
        {titleSafe(titleParts[0])}. {titleSafe(titleParts[1])}.{" "}
        <span className="text-emerald-500">{titleSafe(titleParts[2])}.</span>
      </h1>
      <div className="mt-8 max-w-2xl mx-auto relative">
        <div className="relative" ref={wrapRef}>
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)] pointer-events-none" />
          <label className="sr-only" htmlFor="hero-search">Vyhledat kurz, téma nebo článek</label>
          <input
            id="hero-search"
            type="search"
            role="combobox"
            aria-expanded={open ? "true" : "false"}
            aria-controls="hero-search-listbox"
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `hero-search-opt-${activeIndex}` : undefined}
            aria-describedby="hero-search-help"
            autoComplete="off"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full h-14 pl-12 pr-4 rounded-xl bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-md transition-all"
          />
          {open ? (
            <ul id="hero-search-listbox" className="hero-search-listbox" role="listbox">
              {matches.length === 0 ? (
                <li className="hsl-empty" role="presentation">Nic nenalezeno</li>
              ) : matches.map((m, i) => (
                <li
                  key={`${m.type}-${m.label}-${i}`}
                  role="option"
                  id={`hero-search-opt-${i}`}
                  aria-selected={i === activeIndex ? "true" : "false"}
                  data-index={i}
                  onMouseOver={() => setActiveIndex(i)}
                  onClick={() => selectItem(m)}
                  className={i === activeIndex ? "hsl-active" : undefined}
                >
                  <span className="hsl-label">
                    <HighlightMatch label={m.label} query={value.trim()} />
                  </span>
                  {m.sub ? <span className="hsl-sub">{m.sub}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p id="hero-search-help" className="mt-3 text-xs text-[var(--color-text-muted)]">
          Hledej kurzy, témata i články z Wikipedie. Dotaz ukončený <span className="text-emerald-500 font-medium">?</span> zapne odpověď AI nad článkem. Potvrď Enterem.
        </p>
      </div>
    </section>
  );
}

// Zvýraznění shody — bez dangerouslySetInnerHTML: renderujeme <mark>.
function HighlightMatch({ label, query }: { label: string; query: string }) {
  const q = String(query || "");
  if (!q) return <>{label}</>;
  const text = String(label ?? "");
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-match">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
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
  const innerCls = cat.disabled
    ? "bg-[var(--color-card-bg)] opacity-50 border-[var(--color-border-subtle)]"
    : "bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] border-[var(--color-border-subtle)] transition-all duration-300 hover:-translate-y-1";
  const borderStyle: React.CSSProperties = cat.disabled ? {} : { borderColor: `${cat.color}30` };
  const iconWrap = cat.disabled ? (
    <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-input-bg)", color: "var(--color-text-muted)" }}>
      <Icon name={cat.icon} className="h-5 w-5" />
    </div>
  ) : (
    <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
      <Icon name={cat.icon} className="h-5 w-5" />
    </div>
  );
  const badge = cat.disabled ? (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap" style={{ color: "var(--color-text-muted)", backgroundColor: "var(--color-input-bg)", borderColor: "var(--color-border-subtle)" }}>{cat.countLabel}</span>
  ) : (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap" style={{ color: cat.color, backgroundColor: `${cat.color}12`, borderColor: `${cat.color}22` }}>{cat.count} {cat.countLabel}</span>
  );

  const inner = (
    <div className={`relative h-full rounded-xl backdrop-blur-md border p-5 shadow-sm ${innerCls}`} style={borderStyle}>
      <div className="flex items-start gap-4">
        {iconWrap}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`text-base font-semibold ${cat.disabled ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors"}`}>{t(cat.titleKey)}</h3>
            {badge}
          </div>
          <p className={`text-xs line-clamp-2 ${cat.disabled ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-secondary)]"}`}>{t(cat.descKey)}</p>
        </div>
      </div>
    </div>
  );

  if (cat.disabled) {
    return <div className="group cursor-not-allowed">{inner}</div>;
  }
  // ai-gramotnost je legacy PHP aplikace (ne React routa) → full reload přes <a>.
  if (cat.href.startsWith("/edu/ai-gramotnost")) {
    return (
      <a href={cat.href} data-full-reload="true" className="group">
        {inner}
      </a>
    );
  }
  return (
    <Link href={cat.href} className="group">
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