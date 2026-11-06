// PDF → DOCX: extrakce (extract.ts) → rekonstrukce (layout.ts) → DocModel → OOXML (docx-writer.ts).
// Dva režimy: „editable“ (odstavce, tabulky, styly) a „exact“ (každá stránka z absolutně
// umístěných rámců, tvarů a obrázků).
import type * as Pdfjs from "pdfjs-dist";
import { extractPage, type PageModel, type Glyph, type FontInfo, type PathShape } from "./extract.ts";
import { buildLines, findHeaderFooter, layoutPage, bodySizeOf, headingSizes, marginsOf, paragraphs, vectorClusters, hex, lineText, type Line, type LayoutCtx, type Seg } from "./layout.ts";
import { mapFont, fontReport, wordMetrics, type FontReport } from "./fontmap.ts";
import { encodePng, rasterizeRects } from "./png.ts";
import { writeDocx } from "./docx-writer.ts";
import type { Block, DocModel, ImageBlock, PageLayout, Table, FrameBlock, ShapeBlock, Run } from "./model.ts";

export type PdfToDocxMode = "editable" | "exact";

export interface RawImage { data: Uint8Array | Uint8ClampedArray; width: number; height: number; channels: 1 | 3 | 4 }

export interface PdfToDocxHooks {
  /** Pixely obrázku z page.objs (v okně/workeru přes OffscreenCanvas, v Node z dat pdf.js). */
  imagePixels?: (page: Pdfjs.PDFPageProxy, id: string) => Promise<RawImage | null>;
  /** OCR: glyfy pro stránku bez textové vrstvy (fáze 4). */
  ocr?: (page: Pdfjs.PDFPageProxy, model: PageModel) => Promise<{ glyphs: Glyph[]; confidence: number } | null>;
  onPage?: (done: number, total: number) => void;
  signal?: AbortSignal;
  maxPages?: number;
}

export interface PageReport { index: number; scanned: boolean; ocr: boolean; ocrConfidence?: number; lowConfidence: boolean; tables: number; images: number }

export interface PdfToDocxReport {
  pages: PageReport[];
  fonts: FontReport[];
  tagged: boolean;
  mode: PdfToDocxMode;
}

/** Vstupní bod: dokument pdf.js → bajty DOCX + hlášení. */
export async function pdfToDocx(pdfjs: typeof Pdfjs, doc: Pdfjs.PDFDocumentProxy, mode: PdfToDocxMode, hooks: PdfToDocxHooks = {}): Promise<{ docx: Uint8Array; report: PdfToDocxReport }> {
  const n = Math.min(doc.numPages, hooks.maxPages ?? Infinity);
  const models: PageModel[] = [];
  const proxies: Pdfjs.PDFPageProxy[] = [];
  const reports: PageReport[] = [];
  for (let i = 1; i <= n; i++) {
    if (hooks.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const page = await doc.getPage(i);
    const m = await extractPage(pdfjs, page, i - 1);
    const rep: PageReport = { index: i - 1, scanned: m.scanned, ocr: false, lowConfidence: false, tables: 0, images: 0 };
    if (m.scanned && hooks.ocr) {
      const res = await hooks.ocr(page, m);
      if (res) {
        m.glyphs.push(...res.glyphs);
        rep.ocr = true; rep.ocrConfidence = res.confidence; rep.lowConfidence = res.confidence < 0.7;
        // Sken jako pozadí jen v přesném režimu; v upravitelném zůstává čistý text.
        if (mode === "editable") m.images = [];
      }
    }
    models.push(m); proxies.push(page); reports.push(rep);
    hooks.onPage?.(i, n);
  }
  const fonts: Record<string, FontInfo> = {};
  for (const m of models) Object.assign(fonts, m.fonts);
  const tagged = models.some((m) => !!m.struct && Array.isArray((m.struct as { children?: unknown[] }).children) && (m.struct as { children: unknown[] }).children.length > 0);

  const pageLines = models.map((m) => buildLines(m.glyphs));
  const docModel = mode === "exact"
    ? await exactModel(models, pageLines, proxies, fonts, hooks, reports)
    : await editableModel(models, pageLines, proxies, fonts, hooks, reports);
  return { docx: writeDocx(docModel), report: { pages: reports, fonts: fontReport(Object.values(fonts)), tagged, mode } };
}

const runFont = () => (f: FontInfo | undefined) => mapFont(f);

/** Nejčastější font a barva textu → styl Normální. */
function bodyStyle(models: PageModel[], fonts: Record<string, FontInfo>, size: number): { font: string; size: number; color: string } {
  const count = new Map<string, number>();
  for (const m of models) for (const g of m.glyphs) if (g.ch.trim() && Math.abs(g.size - size) < 0.6) {
    const k = `${mapFont(fonts[g.font]).family}|${hex(g.color)}`;
    count.set(k, (count.get(k) ?? 0) + 1);
  }
  let best = "Arial|000000", c = 0;
  for (const [k, v] of count) if (v > c) { best = k; c = v; }
  const [font, color] = best.split("|");
  return { font, size, color };
}

async function pageImages(m: PageModel, page: Pdfjs.PDFPageProxy, hooks: PdfToDocxHooks, lines: Line[], counter: { n: number }, anchoredAlways: boolean): Promise<{ blocks: ImageBlock[]; used: Set<PathShape> }> {
  const out: ImageBlock[] = [];
  for (const im of m.images) {
    if (im.w < 2 || im.h < 2) continue;
    const raw = hooks.imagePixels ? await hooks.imagePixels(page, im.id).catch(() => null) : null;
    if (!raw) continue;
    const png = encodePng(raw.data, raw.width, raw.height, raw.channels);
    // Plovoucí jen při skutečném překryvu s textem (popisek těsně pod obrázkem nevadí).
    const overlapsText = lines.some((l) => {
      const ox = Math.min(l.x1, im.x + im.w) - Math.max(l.x0, im.x), oy = Math.min(l.bottom, im.y + im.h) - Math.max(l.top, im.y);
      return ox > 0 && oy > 0 && ox * oy > 0.3 * (l.x1 - l.x0) * (l.bottom - l.top);
    });
    out.push({ kind: "image", x: im.x, y: im.y, w: im.w, h: im.h, png, pxW: raw.width, pxH: raw.height, name: `image${++counter.n}.png`, anchored: anchoredAlways || overlapsText });
  }
  const { clusters, used } = vectorClusters(m.paths);
  for (const c of clusters) {
    const r = rasterizeRects(c.rects, c);
    out.push({ kind: "image", x: c.x, y: c.y, w: c.w, h: c.h, png: r.png, pxW: r.pxW, pxH: r.pxH, name: `vector${++counter.n}.png`, anchored: anchoredAlways });
  }
  return { blocks: out, used };
}

async function editableModel(models: PageModel[], pageLines: Line[][], proxies: Pdfjs.PDFPageProxy[], fonts: Record<string, FontInfo>, hooks: PdfToDocxHooks, reports: PageReport[]): Promise<DocModel> {
  const hf = findHeaderFooter(models.map((page, i) => ({ page, lines: pageLines[i] })));
  const contentLines = pageLines.map((ls) => ls.filter((l) => !hf.header.has(l) && !hf.footer.has(l)));
  const body = bodySizeOf(models);
  const heads = headingSizes(contentLines.flat(), body);
  const ctxFor = (m: PageModel): LayoutCtx => ({ bodySize: body, headingSizes: heads, fontMap: runFont(), links: m.links });
  const bodyRun = bodyStyle(models, fonts, body);

  // Okraje: společné pro dokument (Word má okraje na sekci), z nejmenších okrajů obsahu.
  const ms = models.map((m, i) => marginsOf(m, contentLines[i], (f) => mapFont(f)));
  const margins = {
    top: Math.min(...ms.map((m) => m.top)), bottom: Math.min(...ms.map((m) => m.bottom)),
    left: Math.min(...ms.map((m) => m.left)), right: Math.min(...ms.map((m) => m.right)),
  };
  // Krátká poslední stránka by dala obří dolní okraj; zrcadlíme horní okraj.
  margins.bottom = Math.min(margins.bottom, Math.max(margins.top, 36));
  const counter = { n: 0 };
  const pages: PageLayout[] = [];
  for (let i = 0; i < models.length; i++) {
    const m = models[i];
    const { blocks: imgs, used } = await pageImages(m, proxies[i], hooks, contentLines[i], counter, false);
    const paths = m.paths.filter((p) => !used.has(p));
    const blocks = layoutPage({ ...m, paths }, contentLines[i], margins, fonts, ctxFor(m), imgs);
    reports[i].tables = blocks.filter((b) => b.kind === "table" && !b.layout).length;
    reports[i].images = imgs.length;
    pages.push({ width: m.width, height: m.height, margins: { ...margins }, blocks });
  }
  mergeContinuedTables(pages);

  const headingStyles: DocModel["headings"] = [];
  const visit = (bs: Block[]) => { for (const b of bs) { if (b.kind === "para" && b.heading && !headingStyles[b.heading - 1] && b.runs[0]) { const r = b.runs[0]; headingStyles[b.heading - 1] = { font: r.font, size: r.size, bold: r.bold, color: r.color }; } else if (b.kind === "table") for (const row of b.rows) for (const c of row.cells) visit(c.blocks); } };
  for (const p of pages) visit(p.blocks);
  for (let k = 0; k < 3; k++) headingStyles[k] ??= { font: bodyRun.font, size: Math.round(body * (1.6 - k * 0.2) * 2) / 2, bold: true, color: bodyRun.color };

  const hfBox = { x0: margins.left, x1: models[0].width - margins.right };
  const hfBlocks = (ls: Line[] | undefined) => (ls ? paragraphs(ls, hfBox, fonts, ctxFor(models[0]), true) : []);
  const metric = (l: Line) => wordMetrics(mapFont(fonts[l.segs[0].glyphs[0]?.font]).family);
  const headerOffset = hf.headerText ? Math.max(0, Math.min(...hf.headerText.map((l) => l.base - metric(l)[0] * l.size))) : undefined;
  const footerOffset = hf.footerText ? Math.max(0, models[0].height - Math.max(...hf.footerText.map((l) => l.base + metric(l)[1] * l.size))) : undefined;
  return {
    pages,
    header: hf.headerText ? { blocks: hfBlocks(hf.headerText), offset: headerOffset } : undefined,
    footer: hf.footerText ? { blocks: hfBlocks(hf.footerText), pageField: true, offset: footerOffset } : undefined,
    body: bodyRun,
    headings: headingStyles,
    title: firstTitle(pages),
  };
}

function firstTitle(pages: PageLayout[]): string | undefined {
  for (const b of pages[0]?.blocks ?? []) if (b.kind === "para" && b.runs.length) return b.runs.map((r) => r.text).join("").trim().slice(0, 120);
  return undefined;
}

/** Tabulka pokračující na další stránce: spojit a opakovaný první řádek označit jako záhlaví. */
function mergeContinuedTables(pages: PageLayout[]) {
  const rowText = (t: Table, r: number) => t.rows[r]?.cells.map((c) => c.blocks.map((b) => (b.kind === "para" ? b.runs.map((x) => x.text).join("") : "")).join("")).join("|") ?? "";
  // `open` = tabulka, kterou končí dosavadní obsah (i přes strany, které se celé přelily do ní).
  let open: Table | null = null;
  for (let i = 0; i < pages.length; i++) {
    const blocks = pages[i].blocks;
    const first = blocks[0];
    if (open && first && first.kind === "table" && !first.layout && first.colWidths.length === open.colWidths.length && open.colWidths.every((w, k) => Math.abs(w - first.colWidths[k]) <= 3)) {
      if (rowText(open, 0) && rowText(open, 0) === rowText(first, 0)) {
        open.rows[0].header = true;
        first.rows.shift();
      }
      open.rows.push(...first.rows);
      blocks.shift();
      (pages[i] as PageLayout & { continues?: boolean }).continues = true;
    }
    const last = blocks[blocks.length - 1];
    if (last && last.kind === "table" && !last.layout) open = last;
    else if (blocks.length) open = null;
  }
}

// ── Přesný režim ────────────────────────────────────────────────────────

/** Segment → části pro rámce: celý segment, nebo po slovech, když jsou mezery roztažené. */
function exactParts(s: Seg): Seg[] {
  const words: Glyph[][] = [];
  let cur: Glyph[] = [];
  for (const g of s.glyphs) {
    if (g.space) { if (cur.length) words.push(cur); cur = []; continue; }
    cur.push(g);
  }
  if (cur.length) words.push(cur);
  if (words.length < 2) return [s];
  const gaps = words.slice(1).map((w, k) => w[0].x - (words[k][words[k].length - 1].x + words[k][words[k].length - 1].w));
  const sorted = [...gaps].sort((a, b) => a - b);
  const med = sorted[sorted.length >> 1];
  if (med < s.size * 0.36) return [s];
  return words.map((w) => mkSegLite(w, s));
}

function mkSegLite(gs: Glyph[], parent: Seg): Seg {
  return { glyphs: gs, x0: gs[0].x, x1: gs[gs.length - 1].x + gs[gs.length - 1].w, top: parent.top, bottom: parent.bottom, base: parent.base, size: parent.size };
}

function pathD(p: PathShape): string {
  const { x, y, w, h } = p.bbox;
  const W = Math.max(1, Math.round(w * 12700)), H = Math.max(1, Math.round(h * 12700));
  const e = (vx: number, vy: number) => `<a:pt x="${Math.round((vx - x) * 12700)}" y="${Math.round((vy - y) * 12700)}"/>`;
  let d = "";
  for (const s of p.segs) {
    if (s.t === "M") d += `<a:moveTo>${e(s.x, s.y)}</a:moveTo>`;
    else if (s.t === "L") d += `<a:lnTo>${e(s.x, s.y)}</a:lnTo>`;
    else if (s.t === "C") d += `<a:cubicBezTo>${e(s.x1, s.y1)}${e(s.x2, s.y2)}${e(s.x, s.y)}</a:cubicBezTo>`;
    else d += "<a:close/>";
  }
  return `<a:path w="${W}" h="${H}">${d}</a:path>`;
}

async function exactModel(models: PageModel[], pageLines: Line[][], proxies: Pdfjs.PDFPageProxy[], fonts: Record<string, FontInfo>, hooks: PdfToDocxHooks, reports: PageReport[]): Promise<DocModel> {
  const body = bodySizeOf(models);
  const bodyRun = bodyStyle(models, fonts, body);
  const ctx: LayoutCtx = { bodySize: body, headingSizes: [], fontMap: runFont(), links: [] };
  const counter = { n: 0 };
  const pages: PageLayout[] = [];
  for (let i = 0; i < models.length; i++) {
    const m = models[i];
    ctx.links = m.links;
    const { blocks: imgs, used } = await pageImages(m, proxies[i], hooks, [], counter, true);
    const blocks: Block[] = [];
    for (const p of m.paths) {
      if (used.has(p)) continue;
      const fill = p.fill ? hex(p.fill) : undefined, stroke = p.stroke ? hex(p.stroke) : undefined;
      if (fill === "FFFFFF" && !stroke) continue;
      const shape: ShapeBlock = { kind: "shape", x: p.bbox.x, y: p.bbox.y, w: Math.max(0.5, p.bbox.w), h: Math.max(0.5, p.bbox.h), d: pathD(p), fill, stroke, lineWidth: p.lineWidth };
      blocks.push(shape);
    }
    blocks.push(...imgs);
    // Každý segment řádku = jeden rámec na přesné pozici (účaří → horní hrana rámce). Řádek
    // zarovnaný do bloku (roztažené mezery) se rozdělí po slovech, ať slova sedí na pixel.
    for (const l of pageLines[i]) for (const s of l.segs) {
      for (const part of exactParts(s)) {
        const runs: Run[] = paragraphs([{ ...l, segs: [part], x0: part.x0, x1: part.x1 }], { x0: part.x0, x1: part.x1 + 1 }, fonts, ctx, true)[0]?.runs ?? [];
        const [asc, desc] = wordMetrics(runs[0]?.font ?? bodyRun.font);
        const lineHeight = part.size * (asc + desc);
        const frame: FrameBlock = { kind: "frame", x: part.x0, y: part.base - part.size * asc, w: part.x1 - part.x0 + part.size * 0.6, h: lineHeight, runs, lineHeight };
        blocks.push(frame);
      }
    }
    reports[i].images = imgs.length;
    pages.push({ width: m.width, height: m.height, margins: { top: 0, bottom: 0, left: 0, right: 0 }, blocks, exact: true });
  }
  return { pages, body: bodyRun, headings: [], title: pageLines[0]?.[0] ? lineText(pageLines[0][0]).slice(0, 120) : undefined };
}
