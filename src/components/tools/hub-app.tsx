"use client";

// Interaktivní hub nástrojů — React port tools/assets/js/hub.js + search-core.js.
// ClassName totožná s legacy (src/styles/tools.css).
// URL stav je serializován paritně s legacy search-core.js (q, category,
// processing, status, new, sort) přes history.replaceState — bez full navigace.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TOOLS, CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, CATEGORY_ORDER,
  statusLabel, locationMeta, getTool,
  type Category, type Locale, type ProcessingLocation, type Tool, type ToolStatus, type HubI18n,
} from "@/components/tools/registry/data";
import {
  parseState, serializeState, applyFilters, sectionTools, highlight, countByLocation,
  type HubState,
} from "@/components/tools/search-core";
import { ToolIcon } from "@/components/tools/tool-icons";
import { useFavorites, useToolsLibrary } from "@/lib/tools-recents";

interface Props {
  locale: Locale;
  initialSearchParams: { [key: string]: string | string[] | undefined };
  strings: HubI18n;
}

const STATUS_BADGE_CLASS: Record<ToolStatus, string> = {
  working: "badge-status-working",
  limited: "badge-status-limited",
  experimental: "badge-status-experimental",
  coming_soon: "badge-status-coming-soon",
  broken: "badge-status-broken",
};

const STATUSES: readonly ToolStatus[] = ["working", "limited", "experimental", "coming_soon", "broken"];
const PROCESSINGS: readonly ProcessingLocation[] = ["client", "vevit_server", "external_ai"];

const PROCESSING_BADGE_CLASS: Record<ProcessingLocation, string> = {
  client: "badge-loc-local",
  vevit_server: "badge-loc-server",
  external_ai: "badge-loc-ai",
};

// Karta je ztlumená a neklikatelná pro nástroje, které opravdu nejdou otevřít
// (Fáze 2, bod 6) — "limited"/"experimental" fungují, jen s výhradou, proto
// zůstávají plně klikatelné.
const DIM_STATUSES: readonly ToolStatus[] = ["coming_soon", "broken"];

// ── Redesign hlavní stránky (viz src/app/tools/page.tsx — .tools-hub scope) ──
// Ikony kategorií pro dlaždice v hero sekci — stejné cesty jako v dodaném
// referenčním designu (Nástroje Vevit.html), 24×24 viewBox, hranatý stroke.
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

const ALL_CATEGORIES_ICON_PATH = "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z";

function CategoryTileIcon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const CATEGORY_COUNTS: Record<Category, number> = CATEGORY_ORDER.reduce((acc, c) => {
  acc[c] = TOOLS.filter((t) => t.category === c).length;
  return acc;
}, {} as Record<Category, number>);

// Rychlé návrhy hledání pod hlavním vyhledávacím polem (parita s referenčním
// designem) — hledá se vždy proti českým polím TOOLS (viz search-core.tsx),
// takže funguje bez ohledu na aktivní locale UI.
const SEARCH_SUGGESTIONS: readonly { label: string; term: string }[] = [
  { label: "Sloučit PDF", term: "sloučení pdf" },
  { label: "Komprese obrázku", term: "komprese obrázku" },
  { label: "Převod videa", term: "konverze videa" },
  { label: "DPH", term: "dph" },
  { label: "Generátor hesel", term: "generátor hesel" },
  { label: "Odstranit pozadí", term: "odstranit pozadí" },
];

export function HubApp({ locale, initialSearchParams, strings }: Props) {
  const [state, setState] = useState<HubState>(() => parseState(initialSearchParams));
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Synchronizace URL při změně stavu (parita s search-core.js serializeState).
  useEffect(() => {
    const url = `${window.location.pathname}${serializeState(state)}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, [state]);

  const hasQuery = state.q.trim().length > 0;
  // Aktivní dotaz nebo filtr → plochá mřížka výsledků; jinak sekce podle kategorie.
  const showResults = Boolean(hasQuery || state.category || state.processing || state.status || state.newOnly);
  // Oprava: dřív se results počítalo jen `hasQuery ? applyFilters(...) : []`,
  // takže filtr bez zadaného textu (např. jen kliknutí na chip kategorie)
  // vždy skončil na "0 výsledků" — showResults se přepnul, ale results
  // zůstalo prázdné pole.
  const results = useMemo(() => (showResults ? applyFilters(TOOLS, state) : []), [showResults, state]);

  const update = useCallback((patch: Partial<HubState>) => {
    setState((prev) => ({ ...prev, ...patch }));
    setActiveIndex(-1);
  }, []);

  const resetFilters = useCallback(() => {
    setState({ q: "", category: "", processing: "", status: "", newOnly: false, sort: "relevance" });
    setActiveIndex(-1);
    if (searchRef.current) searchRef.current.value = "";
  }, []);

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

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list = results;
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
      }
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      setActiveIndex(-1);
      if (searchRef.current) searchRef.current.value = "";
      update({ q: "" });
    }
  };

  return (
    <main>
      {/* ── Hero (redesign dle referenčního designu — viz .tools-hub ve style.css) */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="hero-inner hub-hero-inner">
          <div className="hub-hero-top">
            <div className="hub-hero-copy">
              <span className="eyebrow hub-eyebrow">{strings.hero_eyebrow.replace("{count}", String(TOOLS.length))}</span>
              <h1>
                Nástroje pro <span className="g-emerald">{strings.hero_title_a}</span>
                <span className="g-white">{strings.hero_title_b}</span>
                <span className="g-sky">{strings.hero_title_c}</span>
              </h1>
              <p className="subtitle">{strings.hero_subtitle}</p>
            </div>
            <div className="hub-hero-stats">
              <div className="hub-stat">
                <span className="n">{TOOLS.length}</span>
                <span className="l">{strings.stat_tools_label}</span>
              </div>
              <div className="hub-stat">
                <span className="n">{CATEGORY_ORDER.length}</span>
                <span className="l">{strings.hero_stats_categories}</span>
              </div>
              <div className="hub-stat">
                <span className="n">{strings.stat_price_value}</span>
                <span className="l">{strings.stat_price_label}</span>
              </div>
            </div>
          </div>

          <div className="search-wrap hub-search-wrap" id="hub-search-wrap">
            <SearchIcon />
            <label className="sr-only" htmlFor="hub-search">{strings.search_placeholder}</label>
            <input
              id="hub-search"
              type="search"
              ref={searchRef}
              defaultValue={state.q}
              placeholder={strings.search_placeholder}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={searchOpen}
              aria-controls="results-grid"
              onChange={(e) => { update({ q: e.target.value }); setSearchOpen(true); }}
              onKeyDown={onSearchKey}
              onFocus={() => setSearchOpen(true)}
            />
            <button
              className={`search-clear${hasQuery ? "" : " hidden"}`}
              id="hub-search-clear"
              type="button"
              aria-label="Vymazat hledání"
              onClick={() => { update({ q: "" }); if (searchRef.current) searchRef.current.value = ""; }}
            >×</button>
            <button className="btn btn-primary hub-search-btn" type="button" onClick={() => searchRef.current?.focus()}>
              {strings.search_cta}
            </button>
          </div>
          <p className="sr-only" id="hub-search-help">Pro pohyb ve výsledcích použijte šipky nahoru a dolů, Enter nástroj otevře.</p>
          <div className="hub-suggestions">
            <span className="hub-suggestions-label">{strings.suggestions_label}</span>
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s.term}
                type="button"
                className="hub-suggestion-chip"
                onClick={() => { update({ q: s.term }); setSearchOpen(true); if (searchRef.current) searchRef.current.value = s.term; }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kategorie — dlaždicová mřížka (redesign) ─────────────────── */}
      <nav className="cat-nav hub-cat-grid" id="cat-nav" aria-label={strings.filters_category}>
        <button
          type="button"
          className={`chip hub-cat-tile${state.category === "" ? " active" : ""}`}
          aria-pressed={state.category === ""}
          style={{ "--tile-color": "var(--primary)" } as React.CSSProperties}
          onClick={() => update({ category: "" })}
        >
          <span className="hub-cat-tile-icon"><CategoryTileIcon d={ALL_CATEGORIES_ICON_PATH} /></span>
          <span className="hub-cat-tile-name">{strings.category_all}</span>
          <span className="hub-cat-tile-count">{strings.hero_pill_count.replace("{count}", String(TOOLS.length))}</span>
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip hub-cat-tile${state.category === c ? " active" : ""}`}
            aria-pressed={state.category === c}
            style={{ "--tile-color": CATEGORY_COLORS[c] } as React.CSSProperties}
            onClick={() => update({ category: state.category === c ? "" : c })}
          >
            <span className="hub-cat-tile-icon"><CategoryTileIcon d={CATEGORY_ICON_PATH[c]} /></span>
            <span className="hub-cat-tile-name">{CATEGORY_LABELS[c]}</span>
            <span className="hub-cat-tile-count">{strings.hero_pill_count.replace("{count}", String(CATEGORY_COUNTS[c]))}</span>
          </button>
        ))}
      </nav>

      <RecentRail locale={locale} strings={strings} />

      {/* ── Filtry ─────────────────────────────────────────────────── */}
      <section className="hub-controls sections" id="hub-controls" aria-label="Filtry nástrojů">
        <div className="hub-control-grid">
          <label>{strings.filters_category}
            <select className="select" id="hub-filter-category" value={state.category} onChange={(e) => update({ category: e.target.value as HubState["category"] })}>
              <option value="">{strings.category_all}</option>
              {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </label>
          <label>{strings.filters_processing}
            <select className="select" id="hub-filter-processing" value={state.processing} onChange={(e) => update({ processing: e.target.value as HubState["processing"] })}>
              <option value="">{strings.processing_all}</option>
              {PROCESSINGS.map((p) => <option key={p} value={p}>{strings.loc[p]}</option>)}
            </select>
          </label>
          <label>{strings.filters_status}
            <select className="select" id="hub-filter-status" value={state.status} onChange={(e) => update({ status: e.target.value as HubState["status"] })}>
              <option value="">{strings.status_all}</option>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s, locale)}</option>)}
            </select>
          </label>
          <label>{strings.filters_sort}
            <select className="select" id="hub-sort" value={state.sort} onChange={(e) => update({ sort: e.target.value as HubState["sort"] })}>
              <option value="relevance">{strings.sort_relevance}</option>
              <option value="name">{strings.sort_name}</option>
              <option value="newest">{strings.sort_newest}</option>
            </select>
          </label>
          <label className="hub-checkbox">
            <input id="hub-filter-new" type="checkbox" checked={state.newOnly} onChange={(e) => update({ newOnly: e.target.checked })} />
            {strings.filters_new_only}
          </label>
          <button className="btn btn-outline" id="hub-filters-reset" type="button" onClick={resetFilters}>
            {strings.filters_reset}
          </button>
        </div>
      </section>

      {/* ── Výsledky hledání ───────────────────────────────────────── */}
      {showResults ? (
        <section className="sections" id="search-results" aria-labelledby="results-title">
          <h2 className="muted" id="results-title" aria-live="polite" style={{ fontSize: "0.875rem", fontWeight: 500, margin: "0 0 1.5rem" }}>
            {hasQuery
              ? strings.results_title.replace("{count}", String(results.length)).replace("{q}", state.q)
              : strings.results_count.replace("{count}", String(results.length))}
          </h2>
          <div className="grid" id="results-grid" role="listbox" aria-label="Hledat nástroj" ref={resultsRef}>
            {results.map((t, i) => (
              <ToolCard key={t.slug} tool={t} locale={locale} strings={strings} query={state.q} active={i === activeIndex} />
            ))}
          </div>
          {results.length === 0 ? (
            <div className="empty-state" id="results-empty">
              <SearchIcon />
              <p className="t">{strings.empty_title}</p>
              <p className="muted" style={{ fontSize: "0.875rem" }}>{strings.empty_desc}</p>
            </div>
          ) : null}
        </section>
      ) : (
        /* ── Sekce kategorií ────────────────────────────────────────── */
        <div id="sections-view">
          <div className="sections" style={{ paddingTop: 0 }}>
            <CategorySection id="nove" title={strings.section_newest_title} desc={strings.section_newest_desc} color="var(--color-emerald)" tools={sectionTools(TOOLS, state, "nove")} locale={locale} strings={strings} query={state.q} />
            {CATEGORY_ORDER.map((c) => (
              <CategorySection
                key={c}
                id={c}
                title={CATEGORY_LABELS[c]}
                desc={CATEGORY_DESCRIPTIONS[c]}
                color={CATEGORY_COLORS[c]}
                tools={sectionTools(TOOLS, state, c)}
                locale={locale}
                strings={strings}
                query={state.q}
              />
            ))}
          </div>
        </div>
      )}

      <PrivacyBand locale={locale} strings={strings} />
    </main>
  );
}

// ── Karta nástroje (port hub.js card()) ──────────────────────────────────

function ToolCard({ tool, locale, strings, query, active }: { tool: Tool; locale: Locale; strings: HubI18n; query: string; active: boolean }) {
  const color = CATEGORY_COLORS[tool.category];
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
        <span className="icon-box" style={{ background: `${color}15`, color }}><ToolIcon name={tool.icon} size={20} /></span>
        <span className="hub-card-badges">
          <span className={`badge ${PROCESSING_BADGE_CLASS[tool.processing_location]}`} title={loc.title}>{loc.label}</span>
          {tool.new ? <span className="badge badge-new">{strings.badge_new}</span> : null}
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
    "data-new": tool.new ? "true" : "false",
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

// ── Sekce kategorie ──────────────────────────────────────────────────────

function CategorySection({ id, title, desc, color, tools, locale, strings, query }: {
  id: string; title: string; desc: string; color: string; tools: Tool[]; locale: Locale; strings: HubI18n; query: string;
}) {
  if (tools.length === 0) return null;
  return (
    <section className="section" id={id}>
      <div className="section-head">
        <span className="bar" style={{ background: color }}></span>
        <h2>{highlight(title, query)}</h2>
        <span className="count">{tools.length}</span>
      </div>
      <p className="section-desc">{desc}</p>
      <div className="grid">
        {tools.map((t) => <ToolCard key={t.slug} tool={t} locale={locale} strings={strings} query={query} active={false} />)}
      </div>
    </section>
  );
}

// ── "Kde jste skončili" (recenty + oblíbené, Fáze 2 bod 4) ──────────────

function RecentRail({ locale, strings }: { locale: Locale; strings: HubI18n }) {
  const { recents, favorites } = useToolsLibrary();
  // Oblíbené první, pak recenty (bez duplicit), ať se hned vidí, co si uživatel uložil.
  const slugs = [...favorites, ...recents.filter((s) => !favorites.includes(s))].slice(0, 12);
  const tools = slugs.map((s) => getTool(s)).filter((t): t is Tool => t != null);
  if (tools.length === 0) return null;

  return (
    <section className="sections" style={{ paddingTop: 0, paddingBottom: "1rem" }} aria-label={strings.recent_title}>
      <div className="section-head" style={{ marginBottom: "0.5rem" }}>
        <h2>{strings.recent_title}</h2>
      </div>
      <p className="section-desc">{strings.recent_desc}</p>
      <div className="rail">
        {tools.map((t) => {
          const color = CATEGORY_COLORS[t.category];
          return (
            <a key={t.slug} href={`/${locale}/tools/${t.slug}`}>
              <span className="ic" style={{ background: `${color}15`, color }}><ToolIcon name={t.icon} size={15} /></span>
              {t.name}
            </a>
          );
        })}
      </div>
    </section>
  );
}

// ── Pásmo o soukromí (Fáze 2, bod 5) ─────────────────────────────────────

function PrivacyBand({ locale, strings }: { locale: Locale; strings: HubI18n }) {
  const locations: ProcessingLocation[] = ["client", "vevit_server", "external_ai"];
  return (
    <section className="sections" aria-label={strings.privacy_band_title}>
      <div className="section-head" style={{ marginBottom: "1rem" }}>
        <h2>{strings.privacy_band_title}</h2>
      </div>
      <div className="privacy-band">
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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" />
    </svg>
  );
}