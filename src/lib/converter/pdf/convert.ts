// PDF → DOCX: extrakce (extract.ts) → rekonstrukce (layout.ts) → DocModel → OOXML (docx-writer.ts).
// Dva režimy: „editable“ (odstavce, tabulky, styly) a „exact“ (každá stránka z absolutně
// umístěných rámců, tvarů a obrázků).
import type * as Pdfjs from "pdfjs-dist";
import { extractPage, type PageModel, type Glyph, type FontInfo, type PathShape } from "./extract.ts";
import { buildLines, findHeaderFooter, layoutPage, bodySizeOf, headingSizes, marginsOf, paragraphs, vectorClusters, hex, lineText, type Line, type LayoutCtx } from "./layout.ts";
import { mapFont, fontReport, type FontReport } from "./fontmap.ts";
import { encodePng, rasterizeRects } from "./png.ts";
import { writeDocx } from "./docx-writer.ts";
import type { Block, DocModel, ImageBlock, PageLayout, Para, Table, FrameBlock, ShapeBlock, Run } from "./model.ts";

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

function runFont(fonts: Record<string, FontInfo>) {
  return (f: FontInfo | undefined) => mapFont(f);
}

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
    const overlapsText = lines.some((l) => l.x1 > im.x && l.x0 < im.x + im.w && l.bottom > im.y && l.top < im.y + im.h);
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
  const ctxFor = (m: PageModel): LayoutCtx => ({ bodySize: body, headingSizes: heads, fontMap: runFont(fonts), links: m.links });
  const bodyRun = bodyStyle(models, fonts, body);

  // Okraje: společné pro dokument (Word má okraje na sekci), z nejmenších okrajů obsahu.
  const ms = models.map((m, i) => marginsOf(m, pageLines[i]));
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
  return {
    pages,
    header: hf.headerText ? { blocks: hfBlocks(hf.headerText) } : undefined,
    footer: hf.footerText ? { blocks: hfBlocks(hf.footerText), pageField: true } : undefined,
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
  for (let i = 0; i + 1 < pages.length; i++) {
    const a = [...pages[i].blocks].reverse().find((b) => b.kind === "table" && !b.layout) as Table | undefined;
    const b = pages[i + 1].blocks.find((x) => x.kind === "table" && !x.layout) as Table | undefined;
    if (!a || !b || pages[i + 1].blocks[0] !== b) continue;
    if (a.colWidths.length !== b.colWidths.length || a.colWidths.some((w, k) => Math.abs(w - b.colWidths[k]) > 3)) continue;
    const lastA = pages[i].blocks[pages[i].blocks.length - 1];
    if (lastA !== a) continue;
    if (rowText(a, 0) && rowText(a, 0) === rowText(b, 0)) {
      a.rows[0].header = true;
      b.rows.shift();
    }
    a.rows.push(...b.rows);
    pages[i + 1].blocks.shift();
    // Stránku, ze které se tabulka přesunula, už nezačínáme zalomením (tabulka teče dál).
    const next = pages[i + 1].blocks[0];
    if (next && next.kind === "para") (next as Para & { noBreak?: boolean }).pageBreakBefore = false;
    (pages[i + 1] as PageLayout & { continues?: boolean }).continues = true;
  }
}

// ── Přesný režim ────────────────────────────────────────────────────────

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
  const ctx: LayoutCtx = { bodySize: body, headingSizes: [], fontMap: runFont(fonts), links: [] };
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
    // Každý segment řádku = jeden rámec na přesné pozici (účaří → horní hrana rámce).
    for (const l of pageLines[i]) for (const s of l.segs) {
      const runs: Run[] = paragraphs([{ ...l, segs: [s], x0: s.x0, x1: s.x1 }], { x0: s.x0, x1: s.x1 + 1 }, fonts, ctx, true)[0]?.runs ?? [];
      const lineHeight = s.size * 1.2;
      const frame: FrameBlock = { kind: "frame", x: s.x0, y: s.base - s.size * 0.95, w: s.x1 - s.x0 + s.size * 0.6, h: lineHeight, runs, lineHeight };
      blocks.push(frame);
    }
    reports[i].images = imgs.length;
    pages.push({ width: m.width, height: m.height, margins: { top: 0, bottom: 0, left: 0, right: 0 }, blocks, exact: true });
  }
  return { pages, body: bodyRun, headings: [], title: pageLines[0]?.[0] ? lineText(pageLines[0][0]).slice(0, 120) : undefined };
}
