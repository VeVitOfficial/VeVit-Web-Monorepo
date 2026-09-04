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
  parseArticle,
  searchWikipedia,
  type TocEntry,
  type WikiSearchResult,
} from "@/lib/edu/wikipedia";
import { Icon } from "./home-icons";

type Phase = "empty" | "loading" | "notfound" | "error" | "ready";

interface AIState {
  kind: "loading" | "ok" | "warn" | "error";
  text: string;
  quote?: string;
}

export function EduSearchPage({ locale, query }: { locale: string; query: string }) {
  void locale;
  // useEduLang zajistí správný locale kontext (t není na této stránce potřeba).
  useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();
  const router = useRouter();

  const trimmed = (query || "").trim();
  const isAI = trimmed.endsWith("?");
  const searchQuery = isAI ? trimmed.replace(/\?+\s*$/, "").trim() : trimmed;
  const question = isAI ? trimmed : "";

  const [phase, setPhase] = useState<Phase>(searchQuery ? "loading" : "empty");
  const [info, setInfo] = useState<string>("");
  const [title, setTitle] = useState<string>("Vyhledávání…");
  const [found, setFound] = useState<WikiSearchResult | null>(null);
  const [articleHtml, setArticleHtml] = useState<string>("");
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [ai, setAI] = useState<AIState | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);

  // Breadcrumbs (legacy předával [{Domů, /dashboard/}, {Vyhledávání}]).
  useEffect(() => {
    setBreadcrumbs([
      { label: "Domů", href: "/edu/dashboard" },
      { label: "Vyhledávání" },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Hlavní načítací flow (1:1 s legacy renderSearch).
  useEffect(() => {
    if (!searchQuery) {
      // setState přes microtask — bez synchronního volání v těle effectu.
      Promise.resolve().then(() => setPhase("empty"));
      return;
    }
    let cancelled = false;
    // Reset stavů přes microtask — bez synchronního setState v těle effectu.
    Promise.resolve().then(() => {
      if (cancelled) return;
      setPhase("loading");
      setInfo(isAI ? "Hledám článek a ptám se AI…" : "Načítám článek z Wikipedie…");
      setArticleHtml("");
      setToc([]);
      setAI(null);
      setFound(null);
    });

    (async () => {
      try {
        const f = await searchWikipedia(searchQuery);
        if (cancelled) return;
        if (!f) { setPhase("notfound"); setInfo(searchQuery); return; }
        setFound(f);

        const html = await fetchArticleHTML(f.key);
        if (cancelled) return;
        const parsed = parseArticle(html, f.title);
        if (!parsed.contentEl) {
          setPhase("error");
          setInfo("Nepodařilo se zpracovat obsah článku.");
          return;
        }
        setTitle(parsed.title);
        setArticleHtml(parsed.contentEl.innerHTML);
        setToc(buildTOC(parsed.contentEl));
        setPhase("ready");
        if (!isAI) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setPhase("error");
        setInfo((e as Error)?.message || "Chyba při načítání.");
      }
    })();

    return () => { cancelled = true; };
  }, [searchQuery, isAI]);

  // AI režim — po ready spustíme askAI nad extrahovaným textem článku.
  useEffect(() => {
    if (!isAI || phase !== "ready" || !articleRef.current) return;
    let cancelled = false;
    const ctx = extractText(articleRef.current, 14000);
    setAI({ kind: "loading", text: "AI zpracovává otázku…", quote: question });

    (async () => {
      let result: AIAnswer;
      try {
        result = await askAI(question, ctx);
      } catch (e) {
        if (cancelled) return;
        setAI({ kind: "error", text: `AI nedostupná: ${(e as Error)?.message ?? ""}. Zde je alespoň celý článek.` });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (cancelled) return;
      if (!result.answer_text && !result.exact_quote) {
        setAI({ kind: "warn", text: "Odpověď na tuto otázku nebyla v článku jednoznačně nalezena, zde je celý článek:" });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setAI({ kind: "ok", text: result.answer_text, quote: result.exact_quote });

      // Zvýraznění citace v DOMu + auto-scroll.
      if (result.exact_quote && articleRef.current && !cancelled) {
        const hit = highlightQuote(articleRef.current, result.exact_quote);
        if (hit) {
          window.setTimeout(() => hit.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [isAI, phase, question]);

  // Delegovaná navigace: in-app odkazy (data-inapp) → router.push,
  // anchor odkazy (data-anchor) → smooth scroll na nadpis.
  const onMainClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    const inApp = target.closest("a[data-inapp]");
    if (inApp) {
      const href = inApp.getAttribute("href") || "";
      if (href.startsWith("/hledat?q=") || href.startsWith("/hledat?")) {
        e.preventDefault();
        router.push(`/edu${href}`);
        return;
      }
    }
    const anchor = target.closest("a[data-anchor]");
    if (anchor) {
      e.preventDefault();
      const id = anchor.getAttribute("data-anchor") || "";
      const main = mainRef.current;
      if (!main) return;
      const el = main.querySelector(`[id="${cssEscape(id)}"]`) || main.querySelector("h2[id],h3[id],h4[id]");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setDrawerOpen(false);
      }
    }
  }, [router]);

  const onTocClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const item = (e.target as Element).closest("[data-toc-id]");
    if (!item) return;
    const id = item.getAttribute("data-toc-id") || "";
    const main = mainRef.current;
    if (!main) return;
    const el = main.querySelector(`[id="${cssEscape(id)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setDrawerOpen(false);
    }
  }, []);

  const loadingMsg = useMemo(() => {
    if (phase === "loading") return info;
    return isAI ? "Hledám článek a ptám se AI…" : "Načítám článek z Wikipedie…";
  }, [phase, info, isAI]);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="sticky top-14 z-30 bg-[var(--color-background)]/85 backdrop-blur-md border-b border-[var(--color-border-subtle)]">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className="h-9 w-9 rounded-md flex items-center justify-center text-[var(--color-text-secondary)] hover:text-emerald-500 hover:bg-[var(--color-glass-highlight)] transition-colors"
            title="Obsah článku"
            aria-label="Obsah článku"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <Link href="/edu/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors shrink-0">
            <Icon name="arrow-left" className="h-4 w-4" />Zpět
          </Link>
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1">{title}</span>
          {isAI && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium border border-purple-500/20 shrink-0">
              <Icon name="sparkles" className="h-3 w-3" />AI režim
            </span>
          )}
          {found && (
            <a
              href={`https://cs.wikipedia.org/wiki/${encodeURIComponent(found.key)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors shrink-0"
              title="Zdroj na Wikipedii"
            >
              Wikipedia <Icon name="external-link" className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3">
          {ai && <AIBanner ai={ai} />}
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div
          className={`fixed inset-0 bg-black/40 z-40 lg:bg-black/20 ${drawerOpen ? "" : "hidden"}`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`sv-toc fixed top-[6.5rem] bottom-0 left-0 w-72 bg-[var(--color-card-bg)] border-r border-[var(--color-border-subtle)] z-50 overflow-y-auto transition-transform duration-200 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
          onClick={onTocClick}
        >
          <TOCBody toc={toc} />
        </aside>
        <main ref={mainRef} onClick={onMainClick} className="min-h-screen">
          {phase === "empty" && (
            <div className="p-20 text-center text-[var(--color-text-muted)]">
              Zadej hledaný výraz. Tip: ukonči dotaz otazníkem <span className="text-emerald-500">?</span> pro AI režim.
            </div>
          )}
          {phase === "loading" && (
            <div className="p-20 flex flex-col items-center gap-4 text-[var(--color-text-muted)]">
              <span className="ai-spinner" />
              <div>{loadingMsg}</div>
            </div>
          )}
          {phase === "notfound" && (
            <div className="p-20 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-[var(--color-text-secondary)] mb-2">
                Pro „{info}&quot; nebyl na Wikipedii nalezen žádný článek.
              </p>
              <Link href="/edu/dashboard" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">
                Zpět domů
              </Link>
            </div>
          )}
          {phase === "error" && (
            <div className="p-20 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-[var(--color-text-secondary)]">{info || "Chyba."}</p>
            </div>
          )}
          {phase === "ready" && (
            <article
              ref={articleRef}
              className="wp-article"
              // Obsah již sanitizován přes parseArticle (VeVitContentSanitizer/DOMParser) — stejná cesta jako legacy.
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── TOC ─────────────────────────────────────────────────────────────────────

function TOCBody({ toc }: { toc: TocEntry[] }) {
  if (!toc.length) {
    return <div className="p-4 text-sm text-[var(--color-text-muted)]">Tento článek nemá podsekce.</div>;
  }
  return (
    <>
      <div className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">Obsah</div>
      <div className="px-2 pb-4">
        {toc.map((h) => {
          const pad = h.level === 2 ? "pl-3" : h.level === 3 ? "pl-6" : "pl-9";
          return (
            <button
              key={h.id}
              type="button"
              data-toc-id={h.id}
              className={`block w-full text-left ${pad} py-1.5 pr-3 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-emerald-500 hover:bg-[var(--color-glass-highlight)] transition-colors truncate`}
            >
              {h.text}
            </button>
          );
        })}
      </div>
    </>
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