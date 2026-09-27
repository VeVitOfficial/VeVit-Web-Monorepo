// Port edu/js/lib/wikipedia.js — Wikipedia integrace: search REST API +
// načtení HTML článku + sanitizace + TOC. Endpoint /edu/api/wikipedia.php
// (stejná cesta jako v legacy WIKI_PROXY).

export interface WikiSearchResult {
  title: string;
  key: string; // normalizovaný titulek pro REST html endpoint
  description: string;
  thumbnail: string | null;
}

export interface TocEntry {
  level: 2 | 3 | 4;
  id: string;
  text: string;
}

const WIKI_PROXY = "/edu/api/wikipedia.php";

// Vyhledání nejlepšího článku k dotazu. Vrací {title, key, description, thumbnail} | null
export async function searchWikipedia(query: string): Promise<WikiSearchResult | null> {
  const q = query.trim();
  if (!q) return null;
  const url = `${WIKI_PROXY}?action=search&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Wikipedia search HTTP ${res.status}`);
  const data = (await res.json()) as { pages?: Array<{ title: string; key: string; description?: string; thumbnail?: { url: string } }> };
  const page = data && data.pages && data.pages[0];
  if (!page) return null;
  return {
    title: page.title,
    key: page.key,
    description: page.description || "",
    thumbnail: page.thumbnail ? page.thumbnail.url : null,
  };
}

// Stažení HTML článku podle klíče (page.key) nebo titulku
export async function fetchArticleHTML(keyOrTitle: string): Promise<string> {
  const url = `${WIKI_PROXY}?action=article&key=${encodeURIComponent(keyOrTitle)}`;
  const res = await fetch(url, { headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error(`Wikipedia article HTTP ${res.status}`);
  return await res.text();
}

export interface WikiSummary {
  type: "standard" | "disambiguation";
  title: string;
  description: string;
  extract: string;
  thumbnail: { source: string; width: number | null; height: number | null } | null;
  lang: string;
  timestamp: string | null;
}

// Short summary (type standard/disambiguation, description, thumbnail).
// Optional: the article renders without it.
export async function fetchSummary(key: string): Promise<WikiSummary | null> {
  try {
    const res = await fetch(`${WIKI_PROXY}?action=summary&key=${encodeURIComponent(key)}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as WikiSummary;
  } catch {
    return null;
  }
}

/** A link to another Wikipedia article, rewritten to the in-app search. */
export interface WikiLinkRef {
  title: string;
  /** In-app path (/edu/hledat?q=…), empty when the article does not exist yet. */
  href: string;
  missing: boolean;
}

/** Lead notes such as "Další významy jsou uvedeny na stránce Praha (rozcestník)". */
export interface WikiHatnote {
  text: string;
  links: WikiLinkRef[];
}

export interface ParsedArticle {
  contentEl: Element | null;
  title: string;
  /** Sanitized infobox HTML moved out of the text into the side card. */
  infoboxHtml: string;
  hatnotes: WikiHatnote[];
  readingMinutes: number;
}

export interface DisambiguationItem extends WikiLinkRef {
  description: string;
}

export interface DisambiguationGroup {
  label: string;
  items: DisambiguationItem[];
}

export interface ParsedDisambiguation {
  intro: string;
  groups: DisambiguationGroup[];
}

const SPECIAL_NAMESPACE = /^(Soubor|Kategorie|Speciální|Nápověda|Wikipedie|Šablona|Portál|Diskuse|Wikipedista|Soubor diskuse|Meta):/;

function titleFromHref(href: string): string {
  const raw = href.replace(/^\.\//, "").split("#")[0].split("?")[0];
  try {
    return decodeURIComponent(raw).replace(/_/g, " ");
  } catch {
    return raw.replace(/_/g, " ");
  }
}

function inAppHref(title: string): string {
  return "/edu/hledat?q=" + encodeURIComponent(title);
}

function cleanText(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

// Sanitizace + příprava obsahu článku.
// Vyžaduje window.VeVitContentSanitizer (globální sanitizer z assets/js).
export function parseArticle(html: string, fallbackTitle?: string): ParsedArticle {
  // DOMPurify with RETURN_DOM hands back the <body> element, not a Document;
  // without the sanitizer script we fall back to the parsed document's body.
  const sanitizer = (window as unknown as { VeVitContentSanitizer?: { sanitizeWikipedia: (html: string) => Element | Document } }).VeVitContentSanitizer;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const clean = sanitizer ? sanitizer.sanitizeWikipedia(html) : doc;
  const cleanRoot: Element | null = clean instanceof Document ? clean.body : clean;
  const root: Element | null = cleanRoot?.querySelector(".mw-parser-output") ?? cleanRoot ?? null;
  const empty = { infoboxHtml: "", hatnotes: [], readingMinutes: 0 };
  if (!root) return { contentEl: null, title: fallbackTitle ?? "", ...empty };

  // Titulek z <title> nebo firstHeading
  const title = (doc.querySelector("title")?.textContent || fallbackTitle || "").replace(/ – Wikipedie.*$/i, "").trim();

  // The server strips <head>, which leaves the page title as a bare text node.
  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) node.parentNode?.removeChild(node);
  });

  // Lead section = everything before the first h2; its notes and infobox move
  // into the article header and side card.
  const firstHeading = root.querySelector("h2");
  const inLead = (el: Element) =>
    !firstHeading || Boolean(el.compareDocumentPosition(firstHeading) & Node.DOCUMENT_POSITION_FOLLOWING);

  const hatnotes: WikiHatnote[] = [];
  root.querySelectorAll(".hatnote, .uvodni-upozorneni, .rellink, .dablink").forEach((note) => {
    if (!inLead(note) || note.closest("table")) return;
    const links: WikiLinkRef[] = [];
    note.querySelectorAll("a[href^='./']").forEach((a) => {
      const t = titleFromHref(a.getAttribute("href") || "");
      if (!t || SPECIAL_NAMESPACE.test(t)) return;
      const missing = a.classList.contains("new");
      links.push({ title: cleanText(a.textContent) || t, href: missing ? "" : inAppHref(t), missing });
    });
    const text = cleanText(note.textContent);
    if (text) hatnotes.push({ text, links });
    note.remove();
  });

  // Sanitizace: odstranění rušivých prvků
  root.querySelectorAll(
    "script, style, link, base, .mw-editsection, .mw-empty-elt, .navbox, .vertical-navbox, .metadata, .ambox, .mbox-small, .mw-jump-link, .noprint, .mw-redirectedfrom, .mw-ref, .reference, .mw-cite-backlink, .mw-headline-anchor, .pcs-edit-section-link, .pcs-meta, .hatnote .noprint, .printfooter, .mw-indicators, .mw-content-ltr .mw-empty-elt, .sisterproject",
  ).forEach((e) => e.remove());
  root.querySelectorAll("sup.reference").forEach((e) => e.remove());

  // Articles that do not exist yet (red links) become plain text.
  root.querySelectorAll("a.new").forEach((a) => {
    const span = doc.createElement("span");
    span.className = "wp-redlink";
    span.textContent = a.textContent;
    span.setAttribute("title", "Tento článek na Wikipedii zatím neexistuje");
    a.replaceWith(span);
  });

  // Přepis interních odkazů (./Název → in-app /hledat?q=Název) a externích (target _blank)
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href.startsWith("./")) {
      const raw = href.slice(2).split("#")[0].split("?")[0];
      const t = titleFromHref(href);
      if (!t) {
        a.removeAttribute("href");
      } else if (SPECIAL_NAMESPACE.test(t)) {
        a.setAttribute("href", "https://cs.wikipedia.org/wiki/" + raw);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      } else {
        a.setAttribute("href", "/hledat?q=" + encodeURIComponent(t));
        a.setAttribute("data-inapp", "1");
      }
    } else if (href.startsWith("#")) {
      a.setAttribute("data-anchor", href.slice(1));
      a.setAttribute("href", "#");
    } else if (/^https?:\/\//.test(href)) {
      if (href.indexOf("wikipedia.org") !== -1 && href.indexOf("/wiki/") !== -1) {
        const t = decodeURIComponent(href.split("/wiki/")[1].split("#")[0]).replace(/_/g, " ");
        a.setAttribute("href", "/hledat?q=" + encodeURIComponent(t));
        a.setAttribute("data-inapp", "1");
      } else {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    }
    // protokol-relativní (//) odkazy necháme, prohlížeč resolvinguje
  });

  // Infobox from the lead goes to the side card.
  let infoboxHtml = "";
  const infobox = root.querySelector("table.infobox");
  if (infobox && inLead(infobox)) {
    infoboxHtml = infobox.outerHTML;
    infobox.remove();
  }

  // Wide tables scroll horizontally instead of stretching the page.
  root.querySelectorAll("table").forEach((table) => {
    if (table.closest(".wp-table-scroll") || table.parentElement?.closest("table")) return;
    const wrap = doc.createElement("div");
    wrap.className = "wp-table-scroll";
    table.replaceWith(wrap);
    wrap.appendChild(table);
  });

  const words = cleanText(root.textContent).split(" ").length;
  return { contentEl: root, title, infoboxHtml, hatnotes, readingMinutes: Math.max(1, Math.round(words / 200)) };
}

const DISAMBIGUATION_STOP = /^(Externí odkazy|Reference|Poznámky|Literatura|Související články)$/i;

/**
 * Turns a (already parsed) disambiguation page into groups of meanings:
 * each list item's first link is the meaning, the rest of the line its
 * description. Group labels come from headings and <dt> captions.
 */
export function parseDisambiguation(contentEl: Element): ParsedDisambiguation {
  const intro = cleanText(contentEl.querySelector("p")?.textContent);
  const groups: DisambiguationGroup[] = [{ label: "", items: [] }];
  let stopped = false;
  contentEl.querySelectorAll("h2, h3, h4, dt, li").forEach((el) => {
    if (stopped) return;
    const tag = el.tagName.toLowerCase();
    if (tag !== "li") {
      const label = cleanText(el.textContent);
      if (DISAMBIGUATION_STOP.test(label)) {
        stopped = true;
        return;
      }
      groups.push({ label, items: [] });
      return;
    }
    // Nested lists are listed on their own; skip the parent's copy of them.
    const link = el.querySelector(":scope > a[data-inapp], :scope > span.wp-redlink, :scope > i > a[data-inapp], :scope > b > a[data-inapp], :scope > i > span.wp-redlink");
    if (!link) return;
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll("ul, ol").forEach((nested) => nested.remove());
    const linkText = cleanText(link.textContent);
    const description = cleanText(clone.textContent).replace(linkText, "").replace(/^[\s,–—:-]+/, "").trim();
    const missing = link.classList.contains("wp-redlink");
    const hrefQuery = !missing ? new URLSearchParams((link.getAttribute("href") || "").split("?")[1] || "").get("q") : null;
    const title = hrefQuery || linkText;
    groups.at(-1)!.items.push({ title: linkText || title, description, missing, href: missing ? "" : inAppHref(title) });
  });
  return { intro, groups: groups.filter((group) => group.items.length > 0) };
}

/** Fallback when the summary is unavailable. */
export function looksLikeDisambiguation(description: string, intro: string): boolean {
  return /rozcestník/i.test(description) || /má (více|několik|další) význam/i.test(intro);
}

// Vytvoření TOC stromu ze sekčních nadpisů (h2/h3/h4 uvnitř <section>)
export function buildTOC(contentEl: Element | null): TocEntry[] {
  const toc: TocEntry[] = [];
  if (!contentEl) return toc;
  const heads = contentEl.querySelectorAll<HTMLElement>(
    "section > h2, section > h3, section > h4, h2[id], h3[id], h4[id]",
  );
  const seen = new Set<string>();
  heads.forEach((h) => {
    const id = h.getAttribute("id");
    if (!id || seen.has(id)) return;
    if (h.closest("table, .infobox, .navbox, .sidebar")) return;
    seen.add(id);
    const tag = h.tagName.toLowerCase();
    const level: TocEntry["level"] = tag === "h2" ? 2 : tag === "h3" ? 3 : 4;
    const text = (h.textContent || "").trim();
    if (!text) return;
    toc.push({ level, id, text });
  });
  return toc;
}

// Extrahování prostého textu článku pro AI (zjištění renderovaného obsahu)
export function extractText(contentEl: Element | null, max = 14000): string {
  if (!contentEl) return "";
  let t = contentEl.textContent || "";
  t = t.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return t.length > max ? t.slice(0, max) : t;
}