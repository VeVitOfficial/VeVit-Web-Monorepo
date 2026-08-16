// Chytrý vyhledávač – Wikipedia článek + AI režim (dotaz končící „?")

import { $, icon, escapeHtml, renderIcons, toast } from "../lib/dom.js";
import { setBreadcrumbs } from "../components/navbar.js";
import { searchWikipedia, fetchArticleHTML, parseArticle, buildTOC, extractText } from "../lib/wikipedia.js";
import { askAI } from "../lib/ai.js";
import { navigate } from "../router.js";
import { t } from "../store/lang.js";

let drawerOpen = false;

export async function renderSearch(queryObj) {
  const rawQuery = (queryObj && queryObj.q) || "";
  const trimmed = rawQuery.trim();
  const isAI = trimmed.endsWith("?");
  const searchQuery = isAI ? trimmed.replace(/\?+\s*$/, "").trim() : trimmed;
  const question = isAI ? trimmed : "";

  setBreadcrumbs([{ label: "Domů", href: "/dashboard/" }, { label: "Vyhledávání" }]);
  const app = $("#app");
  app.innerHTML = viewShell(searchQuery, isAI);
  renderIcons(app);

  const main = $("#sv-main");
  const drawer = $("#sv-toc");
  const backdrop = $("#sv-backdrop");

  // ovládání draweru
  const setDrawer = (open) => {
    drawerOpen = open;
    drawer.classList.toggle("translate-x-0", open);
    drawer.classList.toggle("-translate-x-full", !open);
    backdrop.classList.toggle("hidden", !open);
  };
  $("#sv-hamburger").addEventListener("click", () => setDrawer(!drawerOpen));
  backdrop.addEventListener("click", () => setDrawer(false));

  // delegovaná navigace: in-app odkazy už chytí router; anchor odkazy scrollujem
  main.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-anchor]");
    if (a) {
      e.preventDefault();
      const el = main.querySelector(`[id="${cssEscape(a.dataset.anchor)}"]`) || main.querySelector(`h2[id],h3[id],h4[id]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setDrawer(false);
    }
  });

  // TOC klik → smooth scroll + zavření na mobilu
  drawer.addEventListener("click", (e) => {
    const item = e.target.closest("[data-toc-id]");
    if (!item) return;
    const el = main.querySelector(`[id="${cssEscape(item.dataset.tocId)}"]`);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setDrawer(false); }
  });

  if (!searchQuery) { renderState(main, "empty"); return null; }

  renderState(main, "loading", isAI ? "Hledám článek a ptám se AI…" : "Načítám článek z Wikipedie…");

  try {
    const found = await searchWikipedia(searchQuery);
    if (!found) { renderState(main, "notfound", searchQuery); return null; }

    const html = await fetchArticleHTML(found.key);
    const { contentEl, title } = parseArticle(html, found.title);
    if (!contentEl) { renderState(main, "error", "Nepodařilo se zpracovat obsah článku."); return null; }

    // hlavička
    $("#sv-arttitle").textContent = title;
    const srcLink = $("#sv-source");
    if (srcLink) srcLink.href = `${"https://cs.wikipedia.org/wiki/"}${encodeURIComponent(found.key)}`;

    // TOC
    const toc = buildTOC(contentEl);
    renderTOC(drawer, toc, title);

    // render obsahu
    main.innerHTML = "";
    const article = document.createElement("article");
    article.className = "wp-article";
    article.appendChild(contentEl);
    main.appendChild(article);
    renderIcons(main);

    // AI režim
    if (isAI) {
      await runAI(main, article, question, title);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } catch (e) {
    console.error(e);
    renderState(main, "error", e.message || "Chyba při načítání.");
  }
  return null;
}

async function runAI(main, article, question, title) {
  const banner = $("#sv-aibanner");
  const ctx = extractText(article, 14000);
  banner.classList.remove("hidden");
  banner.innerHTML = `<div class="flex items-center gap-3">${spinner()}<div><div class="text-sm font-medium text-[var(--color-text-primary)]">AI zpracovává otázku…</div><div class="text-xs text-[var(--color-text-muted)]">${escapeHtml(question)}</div></div>`;
  renderIcons(banner);

  let result;
  try {
    result = await askAI(question, ctx);
  } catch (e) {
    banner.innerHTML = aiBannerHTML("error", `AI nedostupná: ${escapeHtml(e.message)}. Zde je alespoň celý článek.`, "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (!result.answer_text && !result.exact_quote) {
    // odpověď nenalezena
    banner.innerHTML = aiBannerHTML("warn", "Odpověď na tuto otázku nebyla v článku jednoznačně nalezena, zde je celý článek:", "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  banner.innerHTML = aiBannerHTML("ok", result.answer_text, result.exact_quote);
  renderIcons(banner);

  // zvýraznění exact_quote v DOMu + auto-scroll
  if (result.exact_quote) {
    const hit = highlightQuote(article, result.exact_quote);
    if (hit) {
      setTimeout(() => hit.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
    } else {
      // quote se nepodařilo najít v DOMu – scroll na začátek
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}

// Nalezení citace v DOMu (ignoruje mezery/případ) a obalení do <mark>
function highlightQuote(container, quote) {
  const q = quote.replace(/\s+/g, "").toLowerCase();
  if (!q) return null;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const chars = []; // {node, offset} pro každý ne-bílý znak v pořadí
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent;
    for (let i = 0; i < t.length; i++) {
      if (/\s/.test(t[i])) continue;
      chars.push({ node: n, offset: i });
    }
  }
  if (!chars.length) return null;
  let combined = "";
  for (const c of chars) combined += c.node.textContent[c.offset];
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
    // surroundContents selže přes hranice elementů → extrahuj a obal
    try {
      const frag = range.extractContents();
      mark.appendChild(frag);
      range.insertNode(mark);
    } catch { return null; }
  }
  return mark;
}

function renderTOC(drawer, toc, title) {
  if (!toc.length) { drawer.innerHTML = `<div class="p-4 text-sm text-[var(--color-text-muted)]">Tento článek nemá podsekce.</div>`; return; }
  const items = toc.map((h) => {
    const pad = h.level === 2 ? "pl-3" : h.level === 3 ? "pl-6" : "pl-9";
    return `<button data-toc-id="${escapeHtml(h.id)}" class="block w-full text-left ${pad} py-1.5 pr-3 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-emerald-500 hover:bg-[var(--color-glass-highlight)] transition-colors truncate">${escapeHtml(h.text)}</button>`;
  }).join("");
  drawer.innerHTML = `<div class="px-4 pt-4 pb-2 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">Obsah</div><div class="px-2 pb-4">${items}</div>`;
}

function renderState(main, state, info) {
  const map = {
    empty: `<div class="p-20 text-center text-[var(--color-text-muted)]">Zadej hledaný výraz. Tip: ukonči dotaz otazníkem <span class="text-emerald-500">?</span> pro AI režim.</div>`,
    loading: `<div class="p-20 flex flex-col items-center gap-4 text-[var(--color-text-muted)]">${spinner()}<div>${escapeHtml(info || "Načítám…")}</div></div>`,
    notfound: (q) => `<div class="p-20 text-center"><div class="text-5xl mb-4">🔍</div><p class="text-[var(--color-text-secondary)] mb-2">Pro „${escapeHtml(q)}" nebyl na Wikipedii nalezen žádný článek.</p><a href="/dashboard/" class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">Zpět domů</a></div>`,
    error: (m) => `<div class="p-20 text-center"><div class="text-5xl mb-4">⚠️</div><p class="text-[var(--color-text-secondary)]">${escapeHtml(m || "Chyba.")}</p></div>`,
  };
  if (state === "notfound") main.innerHTML = map.notfound(info);
  else if (state === "error") main.innerHTML = map.error(info);
  else main.innerHTML = map[state] || "";
}

function viewShell(query, isAI) {
  return `<div class="min-h-screen bg-[var(--color-background)]">
    <div class="sticky top-14 z-30 bg-[var(--color-background)]/85 backdrop-blur-md border-b border-[var(--color-border-subtle)]">
      <div class="max-w-6xl mx-auto px-4 h-12 flex items-center gap-3">
        <button id="sv-hamburger" class="h-9 w-9 rounded-md flex items-center justify-center text-[var(--color-text-secondary)] hover:text-emerald-500 hover:bg-[var(--color-glass-highlight)] transition-colors" title="Obsah článku">${icon("menu", "h-5 w-5")}</button>
        <a href="/dashboard/" class="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors shrink-0">${icon("arrow-left", "h-4 w-4")}Zpět</a>
        <span id="sv-arttitle" class="text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1">Vyhledávání…</span>
        ${isAI ? `<span class="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium border border-purple-500/20 shrink-0">${icon("sparkles", "h-3 w-3")}AI režim</span>` : ""}
        <a id="sv-source" href="#" target="_blank" rel="noopener noreferrer" class="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors shrink-0" title="Zdroj na Wikipedii">Wikipedia ${icon("external-link", "h-3 w-3")}</a>
      </div>
      <div id="sv-aibanner" class="hidden max-w-6xl mx-auto px-4 pb-3"></div>
    </div>
    <div class="relative max-w-6xl mx-auto">
      <div id="sv-backdrop" class="hidden fixed inset-0 bg-black/40 z-40 lg:bg-black/20"></div>
      <aside id="sv-toc" class="sv-toc fixed top-[6.5rem] bottom-0 left-0 w-72 bg-[var(--color-card-bg)] border-r border-[var(--color-border-subtle)] z-50 overflow-y-auto -translate-x-full transition-transform duration-200"></aside>
      <main id="sv-main" class="min-h-screen"></main>
    </div>
  </div>`;
}

function aiBannerHTML(kind, text, quote) {
  const styles = {
    ok: { cls: "border-emerald-500/30 bg-emerald-500/10", icon: "sparkles", ic: "text-emerald-500", qcls: "border-emerald-500/20 bg-emerald-500/5" },
    warn: { cls: "border-amber-500/30 bg-amber-500/10", icon: "alert-triangle", ic: "text-amber-500", qcls: "" },
    error: { cls: "border-red-500/30 bg-red-500/10", icon: "alert-triangle", ic: "text-red-500", qcls: "" },
  }[kind] || { cls: "border-[var(--color-border-subtle)] bg-[var(--color-card-bg)]", icon: "info", ic: "text-[var(--color-text-muted)]", qcls: "" };
  const q = quote ? `<div class="mt-2 rounded-lg border ${styles.qcls} p-3 text-sm text-[var(--color-text-secondary)] italic leading-6">${icon("quote", "inline h-3.5 w-3.5 mr-1 text-emerald-500/60")}„${escapeHtml(quote)}"</div>` : "";
  return `<div class="rounded-xl border ${styles.cls} p-4 flex gap-3 fade-in">${icon(styles.icon, `h-5 w-5 ${styles.ic} shrink-0 mt-0.5`)}<div class="flex-1 min-w-0"><div class="text-sm text-[var(--color-text-primary)] leading-6">${escapeHtml(text)}</div>${q}</div></div>`;
}

function spinner() {
  return `<span class="ai-spinner"></span>`;
}

function cssEscape(s) {
  return String(s).replace(/(["\\])/g, "\\$1");
}
