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

export interface ParsedArticle {
  contentEl: Element | null;
  title: string;
}

// Sanitizace + příprava obsahu článku. Vrací { contentEl, title }.
// Vyžaduje window.VeVitContentSanitizer (globální sanitizer z assets/js).
export function parseArticle(html: string, fallbackTitle?: string): ParsedArticle {
  const sanitizer = (window as unknown as { VeVitContentSanitizer?: { sanitizeWikipedia: (html: string) => Document } }).VeVitContentSanitizer;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const cleanDocument = sanitizer ? sanitizer.sanitizeWikipedia(html) : doc;
  const root: Element | null =
    cleanDocument.querySelector(".mw-parser-output") || cleanDocument.documentElement || null;
  if (!root) return { contentEl: null, title: fallbackTitle ?? "" };

  // Titulek z <title> nebo firstHeading
  const title = (doc.querySelector("title")?.textContent || fallbackTitle || "").replace(/ – Wikipedie.*$/i, "").trim();

  // Sanitizace: odstranění rušivých prvků
  root.querySelectorAll(
    "script, style, link, base, .mw-editsection, .mw-empty-elt, .navbox, .vertical-navbox, .metadata, .ambox, .mbox-small, .mw-jump-link, .noprint, .mw-redirectedfrom, .mw-ref, .reference, .mw-cite-backlink, .mw-headline-anchor, .pcs-edit-section-link, .pcs-meta, .hatnote .noprint, .printfooter, .mw-indicators, .mw-content-ltr .mw-empty-elt",
  ).forEach((e) => e.remove());
  root.querySelectorAll("sup.reference").forEach((e) => e.remove());

  // Přepis interních odkazů (./Název → in-app /hledat?q=Název) a externích (target _blank)
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href.startsWith("./")) {
      const raw = href.slice(2).split("#")[0].split("?")[0];
      const t = decodeURIComponent(raw).replace(/_/g, " ");
      if (!t) {
        a.removeAttribute("href");
      } else if (/^(Soubor|Kategorie|Speciální|Nápověda|Wikipedie|Šablona|Portál|Diskuse|Wikipedista|Soubor diskuse|Meta):/.test(t)) {
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

  return { contentEl: root, title };
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