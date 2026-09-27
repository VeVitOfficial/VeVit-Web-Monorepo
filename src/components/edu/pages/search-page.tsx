"use client";

// Port edu/js/pages/search.js do Reactu.
// Chytrý vyhledávač: Wikipedia článek + AI režim (dotaz končící „?").
// Sanitizace probíhá v parseArticle (window.VeVitContentSanitizer /
// DOMParser fallback) — stejná cesta jako legacy. V Reactu renderujeme
// výsledek přes dangerouslySetInnerHTML z contentEl.innerHTML (nikoliv
// raw Wikipedia HTML — již sanitizovaný DOM).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEduLang } from "../i18n";
import { useEduBreadcrumbs } from "../breadcrumbs";
import {
  askAI,
  type AIAnswer,
} from "@/lib/edu/ai";
import {
  buildTOC,
  extractText,
  fetchArticleHTML,
  fetchSummary,
  looksLikeDisambiguation,
  parseArticle,
  parseDisambiguation,
  searchWikipedia,
  type ParsedDisambiguation,
  type TocEntry,
  type WikiHatnote,
  type WikiSummary,
} from "@/lib/edu/wikipedia";
import { Icon } from "./home-icons";
import { SearchSuggest, eduSuggestionsFromIndex, type EduSuggestion } from "../search-suggest";
import { getIndex } from "@/lib/edu/api";
import {
  ReadingProgress,
  WikiArticleHeader,
  WikiDisambiguationView,
  WikiHatnotes,
  WikiInfoboxCard,
  WikiLicense,
  WikiSkeleton,
  WikiToc,
  useActiveHeading,
} from "../wiki/wiki-views";

type Phase = "empty" | "loading" | "notfound" | "error" | "ready";

interface AIState {
  kind: "loading" | "ok" | "warn" | "error";
  text: string;
  quote?: string;
}

interface ArticleData {
  title: string;
  html: string;
  infoboxHtml: string;
  hatnotes: WikiHatnote[];
  readingMinutes: number;
  toc: TocEntry[];
}

export function EduSearchPage({ locale, query }: { locale: string; query: string }) {
  void locale;
  const { lang } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();
  const router = useRouter();

  const trimmed = (query || "").trim();
  const isAI = trimmed.endsWith("?");
  const searchQuery = isAI ? trimmed.replace(/\?+\s*$/, "").trim() : trimmed;
  const question = isAI ? trimmed : "";

  const [phase, setPhase] = useState<Phase>(searchQuery ? "loading" : "empty");
  const [info, setInfo] = useState<string>("");
  const [summary, setSummary] = useState<WikiSummary | null>(null);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [disambig, setDisambig] = useState<ParsedDisambiguation | null>(null);
  const [ai, setAI] = useState<AIState | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [eduItems, setEduItems] = useState<EduSuggestion[]>([]);
  const [articleEl, setArticleEl] = useState<HTMLElement | null>(null);
  const aiRun = useRef(0);

  // Edu courses and lessons for the suggestions (same index as the home page).
  useEffect(() => {
    let cancelled = false;
    getIndex(lang).then(
      (index) => { if (!cancelled) setEduItems(eduSuggestionsFromIndex(index)); },
      () => { /* suggestions fall back to Wikipedia only */ },
    );
    return () => { cancelled = true; };
  }, [lang]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Domů", href: "/edu/dashboard" },
      { label: "Vyhledávání" },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Search → article HTML + summary in parallel → article or disambiguation.
  useEffect(() => {
    if (!searchQuery) {
      Promise.resolve().then(() => setPhase("empty"));
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setPhase("loading");
      setInfo(isAI ? "Hledám článek a ptám se AI…" : "Načítám článek z Wikipedie…");
      setArticle(null);
      setDisambig(null);
      setSummary(null);
      setAI(null);
    });

    (async () => {
      try {
        const f = await searchWikipedia(searchQuery);
        if (cancelled) return;
        if (!f) { setPhase("notfound"); setInfo(searchQuery); return; }

        const [html, sum] = await Promise.all([fetchArticleHTML(f.key), fetchSummary(f.key)]);
        if (cancelled) return;
        const parsed = parseArticle(html, sum?.title || f.title);
        if (!parsed.contentEl) {
          setPhase("error");
          setInfo("Nepodařilo se zpracovat obsah článku.");
          return;
        }
        setSummary(sum);
        const title = sum?.title || parsed.title || f.title;
        const intro = parsed.contentEl.querySelector("p")?.textContent ?? "";
        const isDisambig = sum ? sum.type === "disambiguation" : looksLikeDisambiguation(f.description, intro);
        if (isDisambig) {
          const data = parseDisambiguation(parsed.contentEl);
          if (data.groups.length > 0) {
            setArticle({ title, html: "", infoboxHtml: "", hatnotes: [], readingMinutes: 0, toc: [] });
            setDisambig(data);
            setPhase("ready");
            window.scrollTo({ top: 0 });
            return;
          }
        }
        setArticle({
          title,
          html: parsed.contentEl.innerHTML,
          infoboxHtml: parsed.infoboxHtml,
          hatnotes: parsed.hatnotes,
          readingMinutes: parsed.readingMinutes,
          toc: buildTOC(parsed.contentEl),
        });
        setPhase("ready");
        if (!isAI) window.scrollTo({ top: 0 });
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setPhase("error");
        setInfo((e as Error)?.message || "Chyba při načítání.");
      }
    })();

    return () => { cancelled = true; };
  }, [searchQuery, isAI]);

  // AI answer over the article text (from "?" queries or the header box).
  const runAI = useCallback(async (q: string) => {
    if (!articleEl) return;
    const run = ++aiRun.current;
    articleEl.querySelectorAll("mark.ai-highlight").forEach((m) => m.replaceWith(...Array.from(m.childNodes)));
    setAI({ kind: "loading", text: "AI zpracovává otázku…", quote: q });
    let result: AIAnswer;
    try {
      result = await askAI(q, extractText(articleEl, 14000));
    } catch (e) {
      if (run !== aiRun.current) return;
      setAI({ kind: "error", text: `AI nedostupná: ${(e as Error)?.message ?? ""}. Zde je alespoň celý článek.` });
      return;
    }
    if (run !== aiRun.current) return;
    if (!result.answer_text && !result.exact_quote) {
      setAI({ kind: "warn", text: "Odpověď na tuto otázku nebyla v článku jednoznačně nalezena." });
      return;
    }
    setAI({ kind: "ok", text: result.answer_text, quote: result.exact_quote });
    if (result.exact_quote) {
      const hit = highlightQuote(articleEl, result.exact_quote);
      if (hit) window.setTimeout(() => hit.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
    }
  }, [articleEl]);

  useEffect(() => {
    if (!isAI || phase !== "ready" || !articleEl || disambig) return;
    void Promise.resolve().then(() => runAI(question));
  }, [isAI, phase, question, articleEl, disambig, runAI]);

  const scrollToId = useCallback((id: string) => {
    if (!articleEl) return;
    const el = articleEl.querySelector(`[id="${cssEscape(id)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setDrawerOpen(false);
    }
  }, [articleEl]);

  // Delegovaná navigace: in-app odkazy (data-inapp) → router.push,
  // anchor odkazy (data-anchor) → smooth scroll na nadpis.
  const onContentClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as Element;
    const inApp = target.closest("a[data-inapp]");
    if (inApp) {
      const href = inApp.getAttribute("href") || "";
      if (href.startsWith("/hledat?")) {
        e.preventDefault();
        router.push(`/edu${href}`);
        return;
      }
    }
    const anchor = target.closest("a[data-anchor]");
    if (anchor) {
      e.preventDefault();
      scrollToId(anchor.getAttribute("data-anchor") || "");
    }
  }, [router, scrollToId]);

  const tocIds = useMemo(() => (article?.toc ?? []).map((h) => h.id), [article]);
  const activeId = useActiveHeading(articleEl, tocIds);
  const showArticle = phase === "ready" && article && !disambig;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="sticky top-14 z-30 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2">
          {showArticle && (
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              className="lg:hidden h-10 w-10 shrink-0 rounded-md flex items-center justify-center text-[var(--color-text-secondary)] hover:text-emerald-500 hover:bg-[var(--color-glass-highlight)] transition-colors"
              aria-label="Obsah článku"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
          )}
          <Link href="/edu/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors shrink-0 px-1">
            <Icon name="arrow-left" className="h-4 w-4" />Zpět
          </Link>
          <div className="flex-1 min-w-0">
            <SearchSuggest
              key={trimmed}
              initialValue={trimmed}
              eduItems={eduItems}
              lang={lang}
              autoFocus={!searchQuery}
              showButton
              placeholder="Hledat kurzy, lekce a články z Wikipedie… (otazník na konci = AI režim)"
              inputClassName="w-full h-10 px-3 rounded-lg bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        {showArticle && <ReadingProgress target={articleEl} />}
      </div>

      {phase === "empty" && (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center text-[var(--color-text-muted)]">
          Zadej hledaný výraz do pole nahoře. Tip: ukonči dotaz otazníkem <span className="text-emerald-500">?</span> pro AI režim.
        </div>
      )}
      {phase === "loading" && <WikiSkeleton label={info || "Načítám článek z Wikipedie…"} />}
      {phase === "notfound" && (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-[var(--color-text-secondary)] mb-2">
            Pro „{info}“ nebyl na Wikipedii nalezen žádný článek.
          </p>
          <Link href="/edu/dashboard" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">
            Zpět domů
          </Link>
        </div>
      )}
      {phase === "error" && (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-[var(--color-text-secondary)]">{info || "Chyba."}</p>
        </div>
      )}

      {phase === "ready" && article && disambig && (
        <WikiDisambiguationView title={article.title} data={disambig} lang={summary?.lang} />
      )}

      {showArticle && (
        <>
          {/* Mobile contents drawer */}
          <div className={`fixed inset-0 bg-black/40 z-40 lg:hidden ${drawerOpen ? "" : "hidden"}`} onClick={() => setDrawerOpen(false)} />
          <aside
            className={`lg:hidden fixed top-[7.5rem] bottom-0 left-0 w-72 bg-[var(--color-card-bg)] border-r border-[var(--color-border-subtle)] z-50 overflow-y-auto transition-transform duration-200 p-2 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <WikiToc toc={article.toc} active={activeId} onPick={scrollToId} />
          </aside>

          <div className="max-w-7xl mx-auto px-4 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
            <aside className="hidden lg:block">
              <div className="sticky top-[8.5rem] max-h-[calc(100vh-9.5rem)] overflow-y-auto py-8 pr-2">
                <WikiToc toc={article.toc} active={activeId} onPick={scrollToId} />
              </div>
            </aside>
            <div className="min-w-0 py-8">
              <WikiArticleHeader
                title={article.title}
                summary={summary}
                readingMinutes={article.readingMinutes}
                asking={ai?.kind === "loading"}
                onAsk={(q) => void runAI(q.endsWith("?") ? q : `${q}?`)}
              />
              {ai && <div className="mt-4"><AIBanner ai={ai} /></div>}
              <WikiHatnotes notes={article.hatnotes} />
              <div className="mt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-8 xl:items-start">
                <div className="xl:order-2 mb-6 xl:mb-0">
                  <WikiInfoboxCard html={article.infoboxHtml} onClick={onContentClick} />
                </div>
                <article
                  ref={setArticleEl}
                  className="wp-article wp-article--embedded xl:order-1"
                  onClick={onContentClick}
                  // Obsah již sanitizován přes parseArticle (server + DOMPurify).
                  dangerouslySetInnerHTML={{ __html: article.html }}
                />
              </div>
              <div className="mt-12"><WikiLicense title={article.title} lang={summary?.lang} /></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── AI banner ───────────────────────────────────────────────────────────────

function AIBanner({ ai }: { ai: AIState }) {
  const styles = {
    loading: { cls: "border-[var(--color-border-subtle)] bg-[var(--color-card-bg)]", icon: "sparkles", ic: "text-emerald-500", qcls: "" },
    ok: { cls: "border-emerald-500/30 bg-emerald-500/10", icon: "sparkles", ic: "text-emerald-500", qcls: "border-emerald-500/20 bg-emerald-500/5" },
    warn: { cls: "border-amber-500/30 bg-amber-500/10", icon: "alert-triangle", ic: "text-amber-500", qcls: "" },
    error: { cls: "border-red-500/30 bg-red-500/10", icon: "alert-triangle", ic: "text-red-500", qcls: "" },
  }[ai.kind];
  return (
    <div className={`rounded-xl border ${styles.cls} p-4 flex gap-3 fade-in`}>
      {ai.kind === "loading" ? (
        <span className="ai-spinner shrink-0 mt-0.5" />
      ) : (
        <Icon name={styles.icon} className={`h-5 w-5 ${styles.ic} shrink-0 mt-0.5`} />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--color-text-primary)] leading-6">{ai.text}</div>
        {ai.quote ? (
          <div className={`mt-2 rounded-lg border ${styles.qcls} p-3 text-sm text-[var(--color-text-secondary)] italic leading-6`}>
            <Icon name="quote" className="inline h-3.5 w-3.5 mr-1 text-emerald-500/60" />„{ai.quote}&quot;
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Pomocné ─────────────────────────────────────────────────────────────────

// Escapování pro CSS selector (legacy cssEscape).
function cssEscape(s: string): string {
  return String(s).replace(/(["\\])/g, "\\$1");
}

// Nalezení citace v DOMu (ignoruje mezery/případ) a obalení do <mark>.
// Port legacy highlightQuote — pracuje nad živým DOMem článku po renderu.
function highlightQuote(container: Element, quote: string): Element | null {
  const q = quote.replace(/\s+/g, "").toLowerCase();
  if (!q) return null;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const chars: { node: Text; offset: number }[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = (n as Text).textContent || "";
    for (let i = 0; i < t.length; i++) {
      if (/\s/.test(t[i])) continue;
      chars.push({ node: n as Text, offset: i });
    }
  }
  if (!chars.length) return null;
  let combined = "";
  for (const c of chars) combined += c.node.textContent![c.offset];
  combined = combined.toLowerCase();
  const start = combined.indexOf(q);
  if (start === -1) return null;
  const end = start + q.length - 1;
  const s = chars[start], e = chars[end];
  if (!s || !e) return null;
  const range = document.createRange();
  range.setStart(s.node, s.offset);
  range.setEnd(e.node, e.offset + 1);
  const mark = document.createElement("mark");
  mark.className = "ai-highlight";
  try {
    range.surroundContents(mark);
  } catch {
    try {
      const frag = range.extractContents();
      mark.appendChild(frag);
      range.insertNode(mark);
    } catch {
      return null;
    }
  }
  return mark;
}