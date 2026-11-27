"use client";

// Hub EveryTool.cz — redesign dle schválené makety index.html.
// Data VŽDY z registry/data.ts (pole RAW v maketě se ignoruje), vyhledávání
// a stav v URL (q, category, processing, status, sort) přes search-core.tsx
// beze změny — parita se starými odkazy typu /cs/tools/?q=pdf&category=pdf.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TOOLS, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, CATEGORY_ORDER,
  statusLabel, locationMeta, getTool, SUPPORTED_LOCALES,
  type Category, type Locale, type ProcessingLocation, type Tool, type ToolStatus, type HubI18n,
} from "@/components/tools/registry/data";
import {
  parseState, serializeState, applyFilters, sectionTools, highlight, countByLocation,
  type HubState,
} from "@/components/tools/search-core";
import { ET_CATEGORY_COLORS } from "@/components/tools/et-colors";
import { ToolIcon } from "@/components/tools/tool-icons";
import { useFavorites, useToolsLibrary } from "@/lib/tools-recents";
import { HubPremium } from "@/components/tools/hub-premium";

interface Props {
  locale: Locale;
  strings: HubI18n;
}

const STATUS_BADGE_CLASS: Record<ToolStatus, string> = {
  working: "badge-status-working",
  limited: "badge-status-limited",
  experimental: "badge-status-experimental",
  coming_soon: "badge-status-coming-soon",
  broken: "badge-status-broken",
  maintenance: "badge-status-maintenance",
};

const STATUSES: readonly ToolStatus[] = ["working", "limited", "experimental", "maintenance", "coming_soon", "broken"];
const PROCESSINGS: readonly ProcessingLocation[] = ["client", "vevit_server", "external_ai", "external"];

const PROCESSING_BADGE_CLASS: Record<ProcessingLocation, string> = {
  client: "badge-loc-local",
  vevit_server: "badge-loc-server",
  external_ai: "badge-loc-ai",
  external: "badge-loc-other",
};

// Karta je ztlumená a neklikatelná pro nástroje, které opravdu nejdou otevřít
// (limited/experimental fungují, jen s výhradou, proto zůstávají klikatelné).
const DIM_STATUSES: readonly ToolStatus[] = ["coming_soon", "broken", "maintenance"];

// Ikony kategorií — stejné cesty jako v maketě (24×24, hranatý stroke).
const CATEGORY_ICON_PATH: Record<Category, string> = {
  pdf: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8",
  image: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21",
  media: "M16 10.5l5.2-3a.5.5 0 0 1 .8.4v8.2a.5.5 0 0 1-.8.4L16 13.5zM4 5.5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z",
  text: "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2M9 20h6M12 4v16",
  ai: "M11.5 3.2a.5.5 0 0 1 1 0l1.6 5.3 5.3 1.6a.5.5 0 0 1 0 1l-5.3 1.6-1.6 5.3a.5.5 0 0 1-1 0l-1.6-5.3-5.3-1.6a.5.5 0 0 1 0-1l5.3-1.6zM19 16v4M21 18h-4M5 4v3M6.5 5.5h-3",
  dev: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  security: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  calc: "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h8M8 10h8M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01",
};

function CategoryTileIcon({ d }: { d: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const CATEGORY_COUNTS: Record<Category, number> = CATEGORY_ORDER.reduce((acc, c) => {
  acc[c] = TOOLS.filter((t) => t.category === c).length;
  return acc;
}, {} as Record<Category, number>);

// Rychlé návrhy pod vyhledávacím polem — hledá se vždy proti českým polím
// TOOLS (viz search-core.tsx), takže fungují bez ohledu na locale UI.
const SEARCH_SUGGESTIONS: readonly { label: string; term: string }[] = [
  { label: "PDF → Word", term: "pdf word" },
  { label: "pozadí", term: "pozadí" },
  { label: "komprese", term: "komprese" },
  { label: "QR", term: "qr" },
  { label: "heslo", term: "heslo" },
  { label: "DPH", term: "dph" },
];

// „Začněte tady“ — ručně vybrané evergreen nástroje (slugy ověřeny proti
// registru, getTool je při renderu zahodí neexistující).
const POPULAR: readonly string[] = [
  "pdf-merge", "pdf-compress", "bg-remover", "img-compress",
  "video-compress", "ai-chat", "qr-generator", "net-salary-calc",
];

/** Počítadlo s rozjezdem (mocketa: data-count); reduced-motion = bez animace. */
function CountUp({ n }: { n: number }) {
  const [v, setV] = useState(n);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1200);
      setV(Math.round(n * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [n]);
  return <b aria-label={String(n)}>{v}</b>;
}

/* ── Rotující slova v H1 — každé má vlastní animaci z makety ──────────── */
/* Pro čtečky je v H1 celá věta (sr-only); rotace je aria-hidden.          */

function RotatingWord({ index, label, bg, rotate, wrap }: {
  index: number; label: string; bg: string; rotate: string;
  wrap: (word: React.ReactNode) => React.ReactNode;
}) {
  const word = <span className="et-word" style={{ "--r": rotate, background: bg } as React.CSSProperties}>{label}</span>;
  return (
    <span className="et-rot-item" key={index}>{wrap(word)}</span>
  );
}

const PIN_ICON = (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="currentColor" stroke="#FFFFFF" strokeWidth="1.4" aria-hidden="true">
    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.6" fill="#FFFFFF" />
  </svg>
);

function RotatingWords({ words, index }: { words: readonly string[]; index: number }) {
  const i = index % words.length;
  if (i === 0) {
    return (
      <RotatingWord index={i} label={words[0]} bg="#FFD23F" rotate="-2deg" wrap={(w) => (
        <>
          <span className="et-ring" aria-hidden="true"></span>
          <span className="et-stamp">{w}</span>
          <span className="et-spark" style={{ left: "-16px", top: "-6px", background: "#FF5A5F", animationDelay: ".45s" }} aria-hidden="true"></span>
          <span className="et-spark" style={{ right: "-12px", top: "-16px", background: "#8B5CF6", animationDelay: ".55s" }} aria-hidden="true"></span>
          <span className="et-spark" style={{ right: "22px", bottom: "-14px", background: "#2EC4B6", animationDelay: ".65s" }} aria-hidden="true"></span>
          <span className="et-spark" style={{ left: "30%", top: "-20px", background: "#2F6BFF", animationDelay: ".5s" }} aria-hidden="true"></span>
        </>
      )} />
    );
  }
  if (i === 1) {
    return (
      <RotatingWord index={i} label={words[1]} bg="#2EC4B6" rotate="2deg" wrap={(w) => (
        <>
          <span className="et-line" style={{ top: "28%", width: "70px" }} aria-hidden="true"></span>
          <span className="et-line" style={{ top: "50%", width: "120px", animationDelay: ".18s" }} aria-hidden="true"></span>
          <span className="et-line" style={{ top: "72%", width: "48px", animationDelay: ".24s" }} aria-hidden="true"></span>
          <span className="et-dash">{w}</span>
        </>
      )} />
    );
  }
  if (i === 2) {
    return (
      <RotatingWord index={i} label={words[2]} bg="#FFB4C6" rotate="-3deg" wrap={(w) => (
        <>
          <span className="et-flip">{w}</span>
          <span className="et-pin-shadow" aria-hidden="true"></span>
          <span className="et-pin" aria-hidden="true">{PIN_ICON}</span>
        </>
      )} />
    );
  }
  return (
    <RotatingWord index={i} label={words[3]} bg="#8EE6B0" rotate="1.5deg" wrap={(w) => (
      <>
        <span className="et-lock">{w}</span>
        <span className="et-shield" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path className="et-check-draw" d="M6 12.5l4 4L18 8.5" />
          </svg>
        </span>
      </>
    )} />
  );
}

export function HubApp({ locale, strings }: Props) {
  // Stránka je statická: filtry z URL (?q=, ?category=…) se načtou až po hydrataci.
  const [state, setState] = useState<HubState>(() => parseState({}));
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [openCats, setOpenCats] = useState<Partial<Record<Category, boolean>>>({});
  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.size > 0) void Promise.resolve().then(() => setState(parseState(params)));
  }, []);

  // Synchronizace URL při změně stavu (parita s search-core serializeState).
  const skipUrlSync = useRef(true);
  useEffect(() => {
    if (skipUrlSync.current) { skipUrlSync.current = false; return; }
    const url = `${window.location.pathname}${serializeState(state)}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, [state]);

  const hasQuery = state.q.trim().length > 0;
  const showResults = Boolean(hasQuery || state.category || state.processing || state.status);
  const results = useMemo(() => (showResults ? applyFilters(TOOLS, state) : []), [showResults, state]);
  const quick = useMemo(() => (hasQuery ? results.slice(0, 6) : []), [hasQuery, results]);

  const update = useCallback((patch: Partial<HubState>) => {
    setState((prev) => ({ ...prev, ...patch }));
    setActiveIndex(-1);
  }, []);

  const resetFilters = useCallback(() => {
    setState({ q: "", category: "", processing: "", status: "", sort: "relevance" });
    setActiveIndex(-1);
    if (searchRef.current) searchRef.current.value = "";
  }, []);

  const scrollToCatalog = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("et-katalog")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, []);

  // Vyhledávací pole drží text synchroní se stavem (pill/badge ho mění mimo input).
  useEffect(() => {
    if (searchRef.current && searchRef.current.value !== state.q) searchRef.current.value = state.q;
  }, [state.q]);

  // Klávesnice: / nebo Cmd+K focusuje search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "SELECT") || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Zavření našeptávače kliknutím mimo vyhledávání.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  // Rotující slova: cyklické střídání; reduced-motion = statické první slovo.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setWordIndex((v) => (v + 1) % strings.hero_rot_words.length), 2800);
    return () => clearInterval(t);
  }, [strings.hero_rot_words.length]);

  // Parallax blobů v hero (pointer), reduced-motion bez pohybu.
  useEffect(() => {
    const hero = document.getElementById("et-hero");
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      hero.querySelectorAll<HTMLElement>(".et-blob").forEach((b) => {
        const k = Number(b.dataset.depth);
        b.style.transform = `translate(${x * k}px, ${y * k}px)`;
      });
    };
    const onLeave = () => hero.querySelectorAll<HTMLElement>(".et-blob").forEach((b) => { b.style.transform = ""; });
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Scroll-reveal sekcí (mocketa .reveal/.in) — observer se obnoví po změně katalogu.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".et-reveal:not(.in)");
    if (!("IntersectionObserver" in window) || els.length === 0) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [results, showResults, state]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list = quick;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchOpen(true);
      setActiveIndex((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < list.length) {
        const t = list[activeIndex];
        router.push(`/${locale}/tools/${t.slug}`);
      } else {
        setSearchOpen(false);
        scrollToCatalog();
      }
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      setActiveIndex(-1);
      if (searchRef.current) searchRef.current.value = "";
      update({ q: "" });
    }
  };

  const setQuery = (q: string) => {
    update({ q, category: "" });
    setSearchOpen(true);
    if (searchRef.current) searchRef.current.value = q;
    searchRef.current?.focus();
  };

  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rotWords = strings.hero_rot_words;
  const wordIdx = reduceMotion ? 0 : wordIndex;

  const stats = [
    { n: TOOLS.length, l: strings.stat_tools_label },
    { n: CATEGORY_ORDER.length, l: strings.hero_stats_categories },
    { n: SUPPORTED_LOCALES.length, l: strings.hero_stats_languages },
  ];

  return (
    // suppressHydrationWarning: rozšíření prohlížeče (ProtonPass, LastPass…)
    // vkládají do <main> atributy před hydratací.
    <main className="et-main" suppressHydrationWarning>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="et-hero" id="et-hero">
        {/* Dekorativní bloby ve vlastním ořezovém plátně — hero samo musí
            mít overflow viditelné, aby pod ním nezamizel našeptávač. */}
        <span className="et-blobs" aria-hidden="true">
          <span className="et-blob" data-depth="18" style={{ left: "7%", top: "70px", width: "64px", height: "64px", borderRadius: "50%", background: "#FFD23F" }}></span>
          <span className="et-blob" data-depth="-24" style={{ left: "13%", top: "300px", width: "46px", height: "46px", borderRadius: "12px", background: "#8B5CF6", rotate: "18deg" }}></span>
          <span className="et-blob" data-depth="12" style={{ left: "4%", top: "430px", width: "30px", height: "30px", borderRadius: "50%", border: "6px solid #FF5A5F" }}></span>
          <span className="et-blob" data-depth="-16" style={{ right: "8%", top: "90px", width: "52px", height: "52px", borderRadius: "14px", background: "#2EC4B6", rotate: "-14deg" }}></span>
          <span className="et-blob" data-depth="22" style={{ right: "5%", top: "330px", width: "74px", height: "74px", borderRadius: "50%", border: "8px solid #FFB4C6" }}></span>
          <span className="et-blob" data-depth="-10" style={{ right: "15%", top: "460px", width: "26px", height: "26px", borderRadius: "50%", background: "#2F6BFF" }}></span>
        </span>
        <div className="et-hero-in">
          <a
            href="#et-katalog"
            className="et-badge"
            onClick={(e) => { e.preventDefault(); setQuery(strings.hero_badge_query); }}
          >
            <b>{strings.hero_badge_tag}</b>{strings.hero_badge_text}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
          <h1 className="et-h1">
            {strings.hero_title}{" "}
            <span className="sr-only">{strings.hero_rot_sr}</span>
            <span className="et-rot" aria-hidden="true"><RotatingWords words={rotWords} index={wordIdx} /></span>
          </h1>
          <div className="et-dots" role="group" aria-label={strings.rot_dots_label} hidden={reduceMotion ? true : undefined}>
            {rotWords.map((w, i) => (
              <button key={w} type="button" aria-label={strings.rot_dot_aria.replace("{word}", w)} aria-current={i === wordIdx || undefined} onClick={() => setWordIndex(i)}></button>
            ))}
          </div>
          <p className="et-lead">{strings.hero_lead.replace("{tools}", String(TOOLS.length))}</p>

          {/* ── Vyhledávání s našeptávačem ─────────────────────────── */}
          <div className="et-search" role="search" ref={searchWrapRef}>
            <span className="et-search-ico" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35" /></svg>
            </span>
            <label className="sr-only" htmlFor="et-q">{strings.search_label}</label>
            <input
              id="et-q"
              type="search"
              ref={searchRef}
              defaultValue={state.q}
              placeholder={strings.search_placeholder}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={searchOpen && hasQuery}
              aria-controls="et-quick"
              aria-activedescendant={activeIndex >= 0 && searchOpen ? `et-quick-opt-${activeIndex}` : undefined}
              onChange={(e) => { update({ q: e.target.value }); setSearchOpen(true); }}
              onKeyDown={onSearchKey}
              onFocus={() => setSearchOpen(true)}
            />
            <button
              type="button"
              className="et-search-clear"
              aria-label={strings.search_clear}
              hidden={!hasQuery}
              onClick={() => { update({ q: "" }); if (searchRef.current) searchRef.current.value = ""; }}
            >×</button>
            <button type="button" className="et-search-go" onClick={() => { setSearchOpen(false); scrollToCatalog(); }}>{strings.search_cta}</button>

            {searchOpen && hasQuery ? (
              <div className="et-quick" id="et-quick" role="listbox" aria-label={strings.search_label}>
                {quick.length > 0 ? quick.map((t, i) => (
                  <a
                    key={t.slug}
                    id={`et-quick-opt-${i}`}
                    className="et-q-row"
                    role="option"
                    aria-selected={i === activeIndex}
                    href={`/${locale}/tools/${t.slug}`}
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <span className="ic et-tint" style={{ "--c": ET_CATEGORY_COLORS[t.category] } as React.CSSProperties}>
                      <ToolIcon name={t.icon} size={18} />
                    </span>
                    <span className="et-q-txt">
                      <b>{highlight(t.name, state.q)}</b>
                      <span>{highlight(t.description, state.q)}</span>
                    </span>
                    <span className="et-q-cat">{CATEGORY_LABELS[t.category]}</span>
                  </a>
                )) : (
                  <div className="et-q-empty">{strings.quick_empty}</div>
                )}
                <a
                  href="#et-katalog"
                  className="et-q-more"
                  onClick={() => setSearchOpen(false)}
                >
                  {quick.length > 0
                    ? strings.quick_more.replace("{count}", String(results.length))
                    : strings.quick_browse}
                </a>
              </div>
            ) : null}
          </div>

          <div className="et-sugg">
            <span>{strings.suggestions_label}</span>
            {SEARCH_SUGGESTIONS.map((s) => (
              <button key={s.term} type="button" className="et-pill" onClick={() => setQuery(s.term)}>{s.label}</button>
            ))}
          </div>

          <div className="et-stats">
            {stats.map((st) => (
              <span className="et-stat" key={st.l}><CountUp n={st.n} />{st.l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kategorie: „S čím potřebujete pomoct?“ ─────────────────────── */}
      <section className="et-sec et-wrap" aria-labelledby="et-tiles-h">
        <header className="et-sec-h et-reveal">
          <h2 id="et-tiles-h">{strings.tiles_title}</h2>
          <p>{strings.tiles_sub}</p>
        </header>
        <div className="et-grid">
          {CATEGORY_ORDER.map((c, i) => (
            <button
              key={c}
              type="button"
              className="et-tile et-tint et-reveal"
              aria-pressed={state.category === c}
              style={{ "--c": ET_CATEGORY_COLORS[c], "--d": `${i * 0.05}s` } as React.CSSProperties}
              onClick={() => { update({ category: state.category === c ? "" : c, q: "" }); if (searchRef.current) searchRef.current.value = ""; scrollToCatalog(); }}
            >
              <span className="ic et-tile-ic"><CategoryTileIcon d={CATEGORY_ICON_PATH[c]} /></span>
              <span className="et-tile-body">
                <b>{CATEGORY_LABELS[c]}</b>
                <span className="d">{CATEGORY_DESCRIPTIONS[c]}</span>
              </span>
              <span className="cnt">{strings.hero_pill_count.replace("{count}", String(CATEGORY_COUNTS[c]))}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Začněte tady ──────────────────────────────────────────────── */}
      <section className="et-sec et-wrap" aria-labelledby="et-popular-h">
        <header className="et-sec-h et-reveal">
          <h2 id="et-popular-h">{strings.popular_title}</h2>
          <p>{strings.popular_sub}</p>
        </header>
        <div className="et-grid">
          {POPULAR.map((slug, i) => {
            const t = getTool(slug);
            if (!t) return null;
            return (
              <a
                key={slug}
                className="et-pop et-tint et-reveal"
                href={`/${locale}/tools/${slug}`}
                style={{ "--c": ET_CATEGORY_COLORS[t.category], "--d": `${i * 0.05}s` } as React.CSSProperties}
              >
                <span className="ic et-pop-ic"><ToolIcon name={t.icon} size={26} /></span>
                <span className="et-pop-body">
                  <b>{t.name}</b>
                  <span className="d">{t.description}</span>
                </span>
                <span className="go">{strings.card_open}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* ── Kde jste skončili (recenty + oblíbené) ────────────────────── */}
      <RecentRail locale={locale} strings={strings} />

      {/* ── Konvertory ────────────────────────────────────────────────── */}
      <section className="et-sec et-wrap" aria-label={strings.conv_docs_title}>
        <div className="et-converters">
          <a className="et-conv-card" href={`/${locale}/tools/video-convert`}>
            <span className="et-conv-icon et-tint" style={{ "--c": ET_CATEGORY_COLORS.media } as React.CSSProperties}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={CATEGORY_ICON_PATH.media} /></svg>
            </span>
            <span className="et-conv-body">
              <strong>{strings.conv_video_title}</strong>
              <small>{strings.conv_video_desc}</small>
            </span>
            <span className="et-conv-open" aria-hidden="true">→</span>
          </a>
          <a className="et-conv-card" href={`/${locale}/tools/audio-convert`}>
            <span className="et-conv-icon et-tint" style={{ "--c": ET_CATEGORY_COLORS.text } as React.CSSProperties}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" /></svg>
            </span>
            <span className="et-conv-body">
              <strong>{strings.conv_audio_title}</strong>
              <small>{strings.conv_audio_desc}</small>
            </span>
            <span className="et-conv-open" aria-hidden="true">→</span>
          </a>
          {/* Dokumenty — karta bez vlastního odkazu, směry převodu jsou
              samostatné odkazy (vnořené <a> by byly nevalidní HTML). */}
          <div className="et-conv-card et-conv-card--docs">
            <span className="et-conv-icon et-tint" style={{ "--c": ET_CATEGORY_COLORS.pdf } as React.CSSProperties}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={CATEGORY_ICON_PATH.pdf} /></svg>
            </span>
            <span className="et-conv-body">
              <strong>{strings.conv_docs_title}</strong>
              <small>{strings.conv_docs_desc}</small>
              <span className="et-conv-links">
                <a href={`/${locale}/tools/pdf-to-word`}>{strings.conv_docs_pdfword}</a>
                <a href={`/${locale}/tools/pdf-extract-text`}>{strings.conv_docs_pdftxt}</a>
                <a href={`/${locale}/tools/images-to-pdf`}>{strings.conv_docs_imgpdf}</a>
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Katalog: filtry + kategorie s rozbalováním ────────────────── */}
      <section className="et-sec et-wrap" id="et-katalog" aria-labelledby="et-catalog-h">
        <header className="et-sec-h et-reveal">
          <h2 id="et-catalog-h">{strings.catalog_title}</h2>
          <p>{strings.catalog_sub}</p>
        </header>
        <div className="et-pills" role="group" aria-label={strings.filters_category}>
          <button
            type="button"
            className="et-fpill"
            aria-pressed={state.category === ""}
            style={{ "--c": "var(--et-yellow)" } as React.CSSProperties}
            onClick={() => update({ category: "" })}
          >
            <span className="et-dot" aria-hidden="true"></span>
            {strings.pill_all}
            <span className="n">{TOOLS.length}</span>
          </button>
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              className="et-fpill"
              aria-pressed={state.category === c}
              style={{ "--c": ET_CATEGORY_COLORS[c] } as React.CSSProperties}
              onClick={() => update({ category: state.category === c ? "" : c })}
            >
              <span className="et-dot" aria-hidden="true"></span>
              {CATEGORY_LABELS[c]}
              <span className="n">{CATEGORY_COUNTS[c]}</span>
            </button>
          ))}
        </div>

        <details className="et-adv">
          <summary>{strings.adv_filters}{state.processing || state.status || state.sort !== "relevance" ? " ·" : ""}</summary>
          <div className="et-adv-grid">
            <label>{strings.filters_processing}
              <select className="select" value={state.processing} onChange={(e) => update({ processing: e.target.value as HubState["processing"] })}>
                <option value="">{strings.processing_all}</option>
                {PROCESSINGS.map((p) => <option key={p} value={p}>{strings.loc[p]}</option>)}
              </select>
            </label>
            <label>{strings.filters_status}
              <select className="select" value={state.status} onChange={(e) => update({ status: e.target.value as HubState["status"] })}>
                <option value="">{strings.status_all}</option>
                {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s, locale)}</option>)}
              </select>
            </label>
            <label>{strings.filters_sort}
              <select className="select" value={state.sort} onChange={(e) => update({ sort: e.target.value as HubState["sort"] })}>
                <option value="relevance">{strings.sort_relevance}</option>
                <option value="name">{strings.sort_name}</option>
              </select>
            </label>
            <button className="btn btn-outline" type="button" onClick={resetFilters}>{strings.filters_reset}</button>
          </div>
        </details>

        {showResults ? (
          <div className="et-results" aria-live="polite">
            <div className="et-cat-h">
              <h3>{hasQuery ? strings.results_title.replace("{count}", String(results.length)).replace("{q}", state.q.trim()) : CATEGORY_LABELS[state.category as Category] ?? strings.pill_all}</h3>
              <span className="et-count">{results.length}</span>
              <span className="et-grow"></span>
              <button type="button" className="et-ghost" onClick={resetFilters}>{strings.cancel_filter}</button>
            </div>
            {results.length > 0 ? (
              <div className="et-grid et-grid-cards">
                {results.map((t, i) => (
                  <ToolCard key={t.slug} tool={t} locale={locale} strings={strings} query={state.q} active={i === activeIndex} />
                ))}
              </div>
            ) : (
              <div className="et-empty">
                <span className="et-face" aria-hidden="true"><i></i></span>
                <b>{strings.empty_title}</b>
                <span>{strings.empty_desc}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="et-cats">
            {CATEGORY_ORDER.map((c) => (
              <CategorySection
                key={c}
                id={c}
                title={CATEGORY_LABELS[c]}
                color={ET_CATEGORY_COLORS[c]}
                tools={sectionTools(TOOLS, state, c)}
                locale={locale}
                strings={strings}
                query={state.q}
                open={Boolean(openCats[c])}
                onToggle={() => setOpenCats((prev) => ({ ...prev, [c]: !prev[c] }))}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Proč ──────────────────────────────────────────────────────── */}
      <section className="et-sec et-wrap" aria-labelledby="et-why-h">
        <header className="et-sec-h et-reveal et-center"><h2 id="et-why-h">{strings.why_title}</h2></header>
        <div className="et-grid et-grid-why">
          <div className="et-feat et-tint et-reveal" style={{ "--c": "#188A4A" } as React.CSSProperties}>
            <span className="ic" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4" /></svg>
            </span>
            <h3>{strings.why1_h}</h3>
            <p>{strings.why1_t}</p>
          </div>
          <div className="et-feat et-tint et-reveal" style={{ "--c": "#B27600", "--d": ".08s" } as React.CSSProperties}>
            <span className="ic" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
            </span>
            <h3>{strings.why2_h}</h3>
            <p>{strings.why2_t}</p>
          </div>
          <div className="et-feat et-tint et-reveal" style={{ "--c": "#7B3FF2", "--d": ".16s" } as React.CSSProperties}>
            <span className="ic" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
            </span>
            <h3>{strings.why3_h}</h3>
            <p>{strings.why3_t}</p>
          </div>
        </div>
      </section>

      {/* ── Pásmo o soukromí ───────────────────────────────────────────── */}
      <PrivacyBand locale={locale} strings={strings} />

      {/* ── Premium ───────────────────────────────────────────────────── */}
      <section className="et-sec et-wrap">
        <HubPremium locale={locale} strings={strings} />
      </section>

      {/* ── Pruh VeVit web applications ─────────────────────────────────────── */}
      <section className="et-sec et-wrap">
        <div className="et-cta et-reveal">
          <span aria-hidden="true" style={{ position: "absolute", right: "-40px", top: "-40px", width: "180px", height: "180px", borderRadius: "50%", border: "28px solid #8B5CF6" }}></span>
          <span aria-hidden="true" style={{ position: "absolute", right: "160px", bottom: "-30px", width: "70px", height: "70px", borderRadius: "18px", background: "#FFD23F", rotate: "20deg" }}></span>
          <div className="et-cta-text">
            <small>{strings.cta_eyebrow}</small>
            <h2>{strings.cta_title}</h2>
            <p>{strings.cta_text}</p>
          </div>
          <a className="et-big et-big-black" href="https://vevit.cz" rel="noopener">{strings.cta_btn}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
        </div>
      </section>
    </main>
  );
}

// ── Karta nástroje (katalog + výsledky) ─────────────────────────────────

function ToolCard({ tool, locale, strings, query, active }: { tool: Tool; locale: Locale; strings: HubI18n; query: string; active: boolean }) {
  const color = ET_CATEGORY_COLORS[tool.category];
  const loc = locationMeta(tool.processing_location, locale);
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(tool.slug);
  const dim = DIM_STATUSES.includes(tool.status);

  const content = (
    <>
      <span className="accent" style={{ background: color }}></span>
      <button
        type="button"
        className={`star${fav ? " on" : ""}`}
        aria-pressed={fav}
        aria-label={fav ? strings.favorite_remove : strings.favorite_add}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tool.slug); }}
      >
        <ToolIcon name="Star" size={14} fill={fav ? "currentColor" : "none"} />
      </button>
      <div className="top">
        <span className="icon-box" style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}><ToolIcon name={tool.icon} size={20} /></span>
          <span className="hub-card-badges">
            <span className={`badge ${PROCESSING_BADGE_CLASS[tool.processing_location]}`} title={loc.title}>{loc.label}</span>
            {tool.also_location ? (
              <span className={`badge ${PROCESSING_BADGE_CLASS[tool.also_location]}`} title={locationMeta(tool.also_location, locale).title}>
                {locationMeta(tool.also_location, locale).label}
              </span>
            ) : null}
            {tool.status !== "working" ? (
              <span className={`badge ${STATUS_BADGE_CLASS[tool.status]}`}>{statusLabel(tool.status, locale)}</span>
            ) : null}
          </span>
      </div>
      <h3 className="name">{highlight(tool.name, query)}</h3>
      <p className="desc">{highlight(tool.description, query)}</p>
      <div className="footer">
        <span className={`badge ${loc.tone === "local" ? "badge-loc-local" : "badge-loc-other"}`} title={loc.title}>
          {loc.label}
        </span>
        <span className="open">{strings.card_open}</span>
      </div>
    </>
  );

  const dataAttrs = {
    "data-slug": tool.slug,
    "data-category": tool.category,
    "data-processing-location": tool.processing_location,
    "data-status": tool.status,
  } as const;

  if (dim) {
    return (
      <div className="tool-card dim" aria-disabled="true" title={statusLabel(tool.status, locale)} {...dataAttrs}>
        {content}
      </div>
    );
  }

  return (
    <a
      className="tool-card"
      href={`/${locale}/tools/${tool.slug}`}
      role="option"
      aria-selected={active}
      {...dataAttrs}
    >
      {content}
    </a>
  );
}

// ── Sekce kategorie s rozbalováním (prvních 8, „Zobrazit všech N“) ──────

function CategorySection({ id, title, color, tools, locale, strings, query, open, onToggle }: {
  id: string; title: string; color: string; tools: Tool[]; locale: Locale; strings: HubI18n; query: string; open: boolean; onToggle: () => void;
}) {
  if (tools.length === 0) return null;
  const shown = open ? tools : tools.slice(0, 8);
  return (
    <section className="et-cat-sec" id={id}>
      <div className="et-cat-h">
        <span className="ic et-tint et-cat-ic" style={{ "--c": color } as React.CSSProperties}>
          <CategoryTileIcon d={CATEGORY_ICON_PATH[id as Category] ?? CATEGORY_ICON_PATH.pdf} />
        </span>
        <h3>{highlight(title, query)}</h3>
        <span className="et-count">{tools.length}</span>
        <span className="et-grow"></span>
        {tools.length > 8 ? (
          <button type="button" className="et-ghost" aria-expanded={open} onClick={onToggle}>
            {open ? strings.show_less : strings.show_all.replace("{count}", String(tools.length))}
          </button>
        ) : null}
      </div>
      <div className="et-grid et-grid-cards">
        {shown.map((t) => <ToolCard key={t.slug} tool={t} locale={locale} strings={strings} query={query} active={false} />)}
      </div>
    </section>
  );
}

// ── "Kde jste skončili" (recenty + oblíbené) ─────────────────────────────

function RecentRail({ locale, strings }: { locale: Locale; strings: HubI18n }) {
  const { recents, favorites } = useToolsLibrary();
  // Oblíbené první, pak recenty (bez duplicit), ať se hned vidí, co si uživatel uložil.
  const slugs = [...favorites, ...recents.filter((s) => !favorites.includes(s))].slice(0, 12);
  const tools = slugs.map((s) => getTool(s)).filter((t): t is Tool => t != null);
  if (tools.length === 0) return null;

  return (
    <section className="et-sec et-wrap" aria-label={strings.recent_title} style={{ paddingTop: "2rem" }}>
      <header className="et-sec-h">
        <h2>{strings.recent_title}</h2>
        <p>{strings.recent_desc}</p>
      </header>
      <div className="et-rail">
        {tools.map((t) => {
          const color = ET_CATEGORY_COLORS[t.category];
          return (
            <a key={t.slug} href={`/${locale}/tools/${t.slug}`}>
              <span className="ic" style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}><ToolIcon name={t.icon} size={15} /></span>
              {t.name}
            </a>
          );
        })}
      </div>
    </section>
  );
}

// ── Pásmo o soukromí (kde se data zpracovávají) ──────────────────────────

function PrivacyBand({ locale, strings }: { locale: Locale; strings: HubI18n }) {
  const locations: ProcessingLocation[] = ["client", "vevit_server", "external_ai", "external"];
  return (
    <section className="et-sec et-wrap" aria-labelledby="et-privacy-h">
      <header className="et-sec-h">
        <h2 id="et-privacy-h">{strings.privacy_band_title}</h2>
      </header>
      <div className="et-privacy-band">
        {locations.map((loc) => {
          const meta = locationMeta(loc, locale);
          return (
            <div className="pr" key={loc}>
              <span className={`badge ${PROCESSING_BADGE_CLASS[loc]}`}>{meta.label}</span>
              <h4>{countByLocation(TOOLS, loc)}</h4>
              <p>{meta.title}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
