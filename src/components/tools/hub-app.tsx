"use client";

// Interaktivní hub nástrojů — React port tools/assets/js/hub.js + search-core.js.
// ClassName totožná s legacy (public/tools/assets/css/style.css).
// URL stav je serializován paritně s legacy search-core.js (q, category,
// processing, status, new, sort) přes history.replaceState — bez full navigace.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TOOLS, CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, CATEGORY_ORDER,
  clientCount, statusLabel, locationMeta, type Locale, type ProcessingLocation, type Tool, type ToolStatus, type HubI18n,
} from "@/components/tools/registry/data";
import {
  parseState, serializeState, applyFilters, sectionTools, highlight,
  type HubState,
} from "@/components/tools/search-core";

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
  unavailable_on_wedos: "badge-status-unavailable",
  broken: "badge-status-broken",
};

const STATUSES: readonly ToolStatus[] = ["working", "limited", "experimental", "coming_soon", "unavailable_on_wedos", "broken"];
const PROCESSINGS: readonly ProcessingLocation[] = ["client", "vevit_server", "external_ai"];

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
  const results = useMemo(() => (hasQuery ? applyFilters(TOOLS, state) : []), [hasQuery, state]);

  // Aktivní dotaz → výsledky; jinak sekce.
  const showResults = hasQuery || state.category || state.processing || state.status || state.newOnly;

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

  const localCount = useMemo(() => clientCount(), []);

  return (
    <main>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="hero-inner">
          <span className="eyebrow">{strings.doc_title}</span>
          <h1>
            Nástroje pro <span className="g-emerald">{strings.hero_title_a}</span>
            <span className="g-white">{strings.hero_title_b}</span>
            <span className="g-sky">{strings.hero_title_c}</span>
          </h1>
          <p className="subtitle">{strings.hero_subtitle}</p>
          <div className="pills">
            <span className="pill">⚡ {strings.hero_pill_count.replace("{count}", String(TOOLS.length))}</span>
            <span className="pill">🛡 {strings.hero_pill_local}</span>
            <span className="pill">✨ {strings.hero_pill_free}</span>
          </div>
          <div className="stats-row">
            <span><strong>{localCount}</strong> {strings.hero_stats_local}</span>
            <span className="sep">·</span>
            <span><strong>{CATEGORY_ORDER.length}</strong> {strings.hero_stats_categories}</span>
            <span className="sep">·</span>
            <span>{strings.hero_stats_noreg}</span>
          </div>
          <div className="search-wrap" id="hub-search-wrap">
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
          </div>
          <p className="sr-only" id="hub-search-help">Pro pohyb ve výsledcích použijte šipky nahoru a dolů, Enter nástroj otevře.</p>
        </div>
      </section>

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
            <nav className="cat-nav" id="cat-nav">
              <div className="scroll">
                <a className="chip" href="#nove" data-target="nove">{strings.section_newest_title}</a>
                {CATEGORY_ORDER.map((c) => (
                  <a key={c} className="chip" href={`#${c}`} data-target={c}>
                    <span className="dot" style={{ background: CATEGORY_COLORS[c] }}></span> {CATEGORY_LABELS[c]}
                  </a>
                ))}
              </div>
            </nav>
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
    </main>
  );
}

// ── Karta nástroje (port hub.js card()) ──────────────────────────────────

function ToolCard({ tool, locale, strings, query, active }: { tool: Tool; locale: Locale; strings: HubI18n; query: string; active: boolean }) {
  const color = CATEGORY_COLORS[tool.category];
  const loc = locationMeta(tool.processing_location, locale);
  const firstLetter = tool.icon.charAt(0).toUpperCase();
  return (
    <a
      className="tool-card"
      href={`/${locale}/tools/${tool.slug}`}
      data-slug={tool.slug}
      data-category={tool.category}
      data-processing-location={tool.processing_location}
      data-status={tool.status}
      data-new={tool.new ? "true" : "false"}
      role="option"
      aria-selected={active}
    >
      <span className="accent" style={{ background: color }}></span>
      <div className="top">
        <span className="icon-box" style={{ background: `${color}15` }}>{firstLetter}</span>
        <span className="hub-card-badges">
          {tool.new ? <span className="badge badge-new">{strings.badge_new}</span> : null}
          {tool.status !== "working" ? (
            <span className={`badge ${STATUS_BADGE_CLASS[tool.status]}`}>{statusLabel(tool.status, locale)}</span>
          ) : null}
        </span>
        <h3 className="name">{highlight(tool.name, query)}</h3>
        <p className="desc">{highlight(tool.description, query)}</p>
      </div>
      <div className="footer">
        <span className={`badge ${loc.tone === "local" ? "badge-loc-local" : "badge-loc-other"}`} title={loc.title}>
          {loc.label}
        </span>
        <span className="open">{strings.card_open}</span>
      </div>
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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" />
    </svg>
  );
}