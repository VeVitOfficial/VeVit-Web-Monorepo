// Wikipedia integrace – search REST API + načtení HTML článku + sanitizace + TOC

const WIKI = "https://cs.wikipedia.org";

// Vyhledání nejlepšího článku k dotazu. Vrací {title, key, description, thumbnail} | null
export async function searchWikipedia(query) {
  const q = query.trim();
  if (!q) return null;
  const url = `${WIKI}/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Wikipedia search HTTP ${res.status}`);
  const data = await res.json();
  const page = data && data.pages && data.pages[0];
  if (!page) return null;
  return {
    title: page.title,
    key: page.key, // normalizovaný titulek pro REST html endpoint
    description: page.description || "",
    thumbnail: page.thumbnail ? page.thumbnail.url : null,
  };
}

// Stažení HTML článku podle klíče (page.key) nebo titulku
export async function fetchArticleHTML(keyOrTitle) {
  const k = encodeURIComponent(keyOrTitle);
  const url = `${WIKI}/api/rest_v1/page/html/${k}`;
  const res = await fetch(url, { headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error(`Wikipedia article HTTP ${res.status}`);
  return await res.text();
}

// Sanitizace + příprava obsahu článku. Vrací { contentEl, title }
export function parseArticle(html, fallbackTitle) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  // odstranění base, styly, skripty z head
  doc.querySelectorAll("base, script, style, link[rel='stylesheet']").forEach((e) => e.remove());
  let root = doc.querySelector(".mw-parser-output") || doc.body;
  if (!root) return { contentEl: null, title: fallbackTitle };

  // Titulek z <title> nebo firstHeading
  const title = (doc.querySelector("title")?.textContent || fallbackTitle || "").replace(/ – Wikipedie.*$/i, "").trim();

  // Sanitizace: odstranění rušivých prvků
  root.querySelectorAll(
    "script, style, link, base, .mw-editsection, .mw-empty-elt, .navbox, .vertical-navbox, .metadata, .ambox, .mbox-small, .mw-jump-link, .noprint, .mw-redirectedfrom, .mw-ref, .reference, .mw-cite-backlink, .mw-headline-anchor, .pcs-edit-section-link, .pcs-meta, .hatnote .noprint, .printfooter, .mw-indicators, .mw-content-ltr .mw-empty-elt"
  ).forEach((e) => e.remove());
  // citation sup.reference
  root.querySelectorAll("sup.reference").forEach((e) => e.remove());

  // Odstranění případných on* atributů a javascript: href
  root.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((a) => {
      if (/^on/i.test(a.name)) el.removeAttribute(a.name);
      if (a.name === "href" && /^\s*javascript:/i.test(a.value)) el.removeAttribute("href");
    });
  });

  // Přepis interních odkazů (./Název → in-app /hledat?q=Název) a externích (target _blank)
  root.querySelectorAll("a[href]").forEach((a) => {
    let href = a.getAttribute("href") || "";
    if (href.startsWith("./")) {
      const raw = href.slice(2).split("#")[0].split("?")[0];
      const t = decodeURIComponent(raw).replace(/_/g, " ");
      if (!t) { a.removeAttribute("href"); }
      else if (/^(Soubor|Kategorie|Speciální|Nápověda|Wikipedie|Šablona|Portál|Diskuse|Wikipedista|Soubor\ diskuse|Meta):/.test(t)) {
        // nejčlánkové prostory -> otevřít přímo na Wikipedii v novém okně
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
    } else if (href.startsWith("//")) {
      // protokol-relativní (obrázky atd.) – necháme, prohlížeč resolvinguje
    }
  });

  // Zajištění protokol-relativních src u obrázků zůstane funkčních (base href="/" v index.html)
  return { contentEl: root, title };
}

// Vytvoření TOC stromu ze sekčních nadpisů (h2/h3/h4 uvnitř <section>)
export function buildTOC(contentEl) {
  const toc = [];
  if (!contentEl) return toc;
  const heads = contentEl.querySelectorAll("section > h2, section > h3, section > h4, h2[id], h3[id], h4[id]");
  const seen = new Set();
  heads.forEach((h) => {
    let id = h.getAttribute("id");
    if (!id || seen.has(id)) return;
    // přeskočit nadpisy uvnitř infoboxu/tabulek
    if (h.closest("table, .infobox, .navbox, .sidebar")) return;
    seen.add(id);
    const level = h.tagName.toLowerCase() === "h2" ? 2 : h.tagName.toLowerCase() === "h3" ? 3 : 4;
    const text = (h.textContent || "").trim();
    if (!text) return;
    toc.push({ level, id, text });
  });
  return toc;
}

// Extrahování prostého textu článku pro AI (zjištění renderovaného obsahu)
export function extractText(contentEl, max = 14000) {
  if (!contentEl) return "";
  let t = contentEl.innerText || contentEl.textContent || "";
  // sbalení bílých znaků
  t = t.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return t.length > max ? t.slice(0, max) : t;
}
