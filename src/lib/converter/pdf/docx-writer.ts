// DocModel → DOCX (OOXML zabalené fflate). Čisté OOXML: styly (Normální, Nadpis 1–3, Název,
// Odstavec se seznamem, Záhlaví/Zápatí, Hypertextový odkaz) a přímé formátování jen tam, kde
// se běh liší od stylu odstavce. Tabulky s přesnými šířkami sloupců, ohraničení jen tam, kde
// v originálu jsou. Přesný režim: rámce (framePr) a tvary ukotvené ke stránce.
import { zipSync, strToU8 } from "fflate";
import type { Block, DocModel, Para, Run, Table, ImageBlock, RuleBlock, FrameBlock, ShapeBlock, PageLayout, Border, Borders, ListInfo, ColumnsBlock } from "./model.ts";

const tw = (pt: number) => Math.round(pt * 20);
const emu = (pt: number) => Math.round(pt * 12700);
export const xmlEsc = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14"';

import { wordMetrics as metrics } from "./fontmap.ts";
const lineFactor = (font: string) => { const [a, d] = metrics(font); return a + d; };

interface Ctx {
  hf: { header?: string; footer?: string };
  /** Počet ukončených sekcí (kvůli `continuous` u dalších). */
  sections: boolean[];
  rels: string[];
  media: Record<string, Uint8Array>;
  nextRel: number;
  nextDrawing: number;
  linkRels: Map<string, string>;
  lists: ListState;
  doc: DocModel;
  /** Styl, vůči kterému se počítá přímé formátování běhu. */
}

interface ListState {
  levels: { bullet: number[]; number: number[] };
  abstract: { bullet: ListInfo[]; number: ListInfo[] };
  nums: { abstractId: number; restart: boolean }[];
  current: number | null;
}

function listLevel(ls: ListState, l: ListInfo): number {
  const tiers = ls.levels[l.kind];
  let best = 0, d = Infinity;
  tiers.forEach((x, i) => { const dd = Math.abs(x - l.markerX); if (dd < d) { d = dd; best = i; } });
  return Math.min(8, best);
}

/** Styl odstavce (vlastnosti běhu, které styl nese), aby běhy nesly jen rozdíly. */
function styleRun(doc: DocModel, p: Para): { font: string; size: number; bold: boolean; color: string } {
  if (p.heading && doc.headings[p.heading - 1]) { const h = doc.headings[p.heading - 1]; return { font: h.font, size: h.size, bold: h.bold, color: h.color }; }
  return { font: doc.body.font, size: doc.body.size, bold: false, color: doc.body.color };
}

function runXml(r: Run, base: { font: string; size: number; bold: boolean; color: string }): string {
  const rp: string[] = [];
  if (r.font && r.font !== base.font) rp.push(`<w:rFonts w:ascii="${xmlEsc(r.font)}" w:hAnsi="${xmlEsc(r.font)}" w:cs="${xmlEsc(r.font)}" w:eastAsia="${xmlEsc(r.font)}"/>`);
  if (r.bold !== base.bold) rp.push(r.bold ? "<w:b/><w:bCs/>" : '<w:b w:val="0"/><w:bCs w:val="0"/>');
  if (r.italic) rp.push("<w:i/><w:iCs/>");
  if (r.color !== base.color && !r.link) rp.push(`<w:color w:val="${r.color}"/>`);
  if (r.spacing && Math.abs(r.spacing) >= 0.1) rp.push(`<w:spacing w:val="${tw(r.spacing)}"/>`);
  // Průhledná výplň textu (Word 2010+); starší čtečky ho ukážou černě.
  if (r.transparent) rp.push('<w14:textFill><a:solidFill><a:srgbClr val="000000"><a:alpha val="0"/></a:srgbClr></a:solidFill></w14:textFill>');
  if (Math.abs(r.size - base.size) >= 0.25) rp.push(`<w:sz w:val="${Math.round(r.size * 2)}"/><w:szCs w:val="${Math.round(r.size * 2)}"/>`);
  const style = r.link ? '<w:rStyle w:val="Hyperlink"/>' : "";
  const rpr = style || rp.length ? `<w:rPr>${style}${rp.join("")}</w:rPr>` : "";
  // "\n" = ruční zalomení řádku (<w:br/>), "\t" = tabulátor.
  if (r.text === "\n") return `<w:r>${rpr}<w:br/></w:r>`;
  return r.text.split("\t").map((t, i) => (i ? `<w:r>${rpr}<w:tab/></w:r>` : "") + (t ? `<w:r>${rpr}<w:t xml:space="preserve">${xmlEsc(t)}</w:t></w:r>` : "")).join("");
}

function runsXml(c: Ctx, runs: Run[], base: { font: string; size: number; bold: boolean; color: string }): string {
  let out = "";
  for (let i = 0; i < runs.length;) {
    const link = runs[i].link;
    if (!link) { out += runXml(runs[i], base); i++; continue; }
    let j = i, inner = "";
    while (j < runs.length && runs[j].link === link) inner += runXml(runs[j++], base);
    let rid = c.linkRels.get(link);
    if (!rid) {
      rid = `rId${c.nextRel++}`;
      c.linkRels.set(link, rid);
      c.rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xmlEsc(link)}" TargetMode="External"/>`);
    }
    out += `<w:hyperlink r:id="${rid}" w:history="1">${inner}</w:hyperlink>`;
    i = j;
  }
  return out;
}

function borderXml(side: string, b: Border | undefined): string {
  return b ? `<w:${side} w:val="single" w:sz="${b.sz}" w:space="0" w:color="${b.color}"/>` : `<w:${side} w:val="nil"/>`;
}

function paraXml(c: Ctx, p: Para, extraPPr = ""): string {
  const pp: string[] = [];
  if (p.heading) pp.push(`<w:pStyle w:val="Heading${p.heading}"/>`);
  else if (p.list) pp.push('<w:pStyle w:val="ListParagraph"/>');
  if (p.pageBreakBefore) pp.push("<w:pageBreakBefore/>");
  if (p.list) {
    const ls = c.lists;
    const abstractId = p.list.kind === "bullet" ? 0 : 1;
    const level = listLevel(ls, p.list);
    // Nový číslovaný seznam (začíná „1.“ / „a)“ na 1. úrovni po textu) = nové číslování.
    const startsAgain = p.list.kind === "number" && level === 0 && /^\(?(1|a|i)[.)]$/i.test(p.list.marker);
    if (ls.current == null || ls.nums[ls.current - 1].abstractId !== abstractId || startsAgain) {
      ls.nums.push({ abstractId, restart: startsAgain });
      ls.current = ls.nums.length;
    }
    pp.push(`<w:numPr><w:ilvl w:val="${level}"/><w:numId w:val="${ls.current}"/></w:numPr>`);
  } else c.lists.current = null;
  if (p.borderBottom || p.borderTop) {
    const b = (side: string, v: (Border & { space: number }) | undefined) => (v ? `<w:${side} w:val="single" w:sz="${v.sz}" w:space="${Math.max(0, Math.min(31, Math.round(v.space)))}" w:color="${v.color}"/>` : "");
    pp.push(`<w:pBdr>${b("top", p.borderTop)}${b("bottom", p.borderBottom)}</w:pBdr>`);
  }
  const base = styleRun(c.doc, p);
  const sp: string[] = [`w:before="${tw(p.before)}"`, `w:after="${tw(p.after)}"`];
  if (p.line && p.runs.length) {
    const natural = (p.size ?? base.size) * lineFactor(p.runs[0]?.font || base.font);
    const mult = p.line / natural;
    // Rozteč z PDF „alespoň“: nezávisí na metrikách fontu v Wordu/LibreOffice a při zvětšení
    // písma se řádek neořízne. Menší než přirozená výška jen jako „přesně“.
    if (mult >= 0.98 && mult < 3) sp.push(`w:line="${tw(p.line)}" w:lineRule="atLeast"`);
    else sp.push(`w:line="${tw(p.line)}" w:lineRule="exact"`);
  }
  pp.push(`<w:spacing ${sp.join(" ")}/>`);
  if (!p.list && (p.indLeft > 0.5 || Math.abs(p.indFirst) > 0.5 || p.indRight > 0.5)) {
    const a = [`w:left="${tw(p.indLeft)}"`];
    if (p.indRight > 0.5) a.push(`w:right="${tw(p.indRight)}"`);
    if (p.indFirst > 0.5) a.push(`w:firstLine="${tw(p.indFirst)}"`);
    else if (p.indFirst < -0.5) a.push(`w:hanging="${tw(-p.indFirst)}"`);
    pp.push(`<w:ind ${a.join(" ")}/>`);
  }
  if (p.align !== "left") pp.push(`<w:jc w:val="${p.align}"/>`);
  if (extraPPr) pp.push(extraPPr);
  if (p.tabs?.length) {
    // Výchozí zarážky stylů Záhlaví/Zápatí (střed, vpravo) by text posunuly jinam.
    const clear = '<w:tab w:val="clear" w:pos="4536"/><w:tab w:val="clear" w:pos="9072"/>';
    pp.splice(pp.findIndex((x) => x.startsWith("<w:spacing")), 0, `<w:tabs>${clear}${p.tabs.map((t) => `<w:tab w:val="${t.val}" w:pos="${tw(t.pos)}"/>`).join("")}</w:tabs>`);
  }
  // Velikost písma prázdného odstavce (značky odstavce) podle obsahu, ať nepřidává výšku.
  const markSize = p.size && Math.abs(p.size - base.size) >= 0.25 ? `<w:rPr><w:sz w:val="${Math.round(p.size * 2)}"/></w:rPr>` : "";
  return `<w:p><w:pPr>${pp.join("")}${markSize}</w:pPr>${runsXml(c, p.runs, base)}</w:p>`;
}

function spacerXml(pt: number, pageBreak = false): string {
  const h = Math.max(1, Math.round(pt * 20));
  return `<w:p><w:pPr>${pageBreak ? "<w:pageBreakBefore/>" : ""}<w:spacing w:before="0" w:after="0" w:line="${h}" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>`;
}

/**
 * Samostatná linka = prázdný odstavec s dolním ohraničením: řádek 1 pt + mezera 1 pt + tloušťka
 * linky. `gap` je vzdálenost od předchozího bloku ke středu linky v originálu.
 */
function ruleXml(r: RuleBlock, gap: number): string {
  const before = gap - 2 - r.sz / 16;
  return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="${r.sz}" w:space="1" w:color="${r.color}"/></w:pBdr><w:spacing w:before="${tw(Math.max(0, before))}" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>`;
}

function imageXml(c: Ctx, im: ImageBlock, page?: PageLayout): string {
  const rid = `rId${c.nextRel++}`;
  const file = `media/${im.name}`;
  c.media[`word/${file}`] = im.png;
  c.rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${file}"/>`);
  const id = c.nextDrawing++;
  const cx = emu(im.w), cy = emu(im.h);
  const graphic = `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${xmlEsc(im.name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>`;
  if (im.anchored && page) {
    return `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${id}" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>${emu(im.x)}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>${emu(im.y)}</wp:posOffset></wp:positionV><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="${xmlEsc(im.name)}"/><wp:cNvGraphicFramePr/>${graphic}</wp:anchor></w:drawing></w:r>`;
  }
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${xmlEsc(im.name)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>${graphic}</wp:inline></w:drawing></w:r>`;
}

function shapeXml(c: Ctx, s: ShapeBlock): string {
  const id = c.nextDrawing++;
  const cx = Math.max(1, emu(s.w)), cy = Math.max(1, emu(s.h));
  const fill = s.fill ? `<a:solidFill><a:srgbClr val="${s.fill}"/></a:solidFill>` : "<a:noFill/>";
  const ln = s.stroke ? `<a:ln w="${emu(s.lineWidth)}"><a:solidFill><a:srgbClr val="${s.stroke}"/></a:solidFill></a:ln>` : "<a:ln><a:noFill/></a:ln>";
  return `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${id}" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>${emu(s.x)}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>${emu(s.y)}</wp:posOffset></wp:positionV><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="Tvar ${id}"/><wp:cNvGraphicFramePr/><a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvSpPr/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst>${s.d}</a:pathLst></a:custGeom>${fill}${ln}</wps:spPr><wps:bodyPr/></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`;
}

function frameXml(c: Ctx, f: FrameBlock): string {
  const base = { font: c.doc.body.font, size: c.doc.body.size, bold: false, color: c.doc.body.color };
  const h = Math.max(1, f.lineHeight);
  return `<w:p><w:pPr><w:framePr w:w="${tw(f.w + 2)}" w:h="${tw(h)}" w:hRule="exact" w:wrap="around" w:vAnchor="page" w:hAnchor="page" w:x="${tw(f.x)}" w:y="${tw(f.y)}"/><w:spacing w:before="0" w:after="0" w:line="${tw(h)}" w:lineRule="exact"/></w:pPr>${runsXml(c, f.runs, base)}</w:p>`;
}

function tableXml(c: Ctx, t: Table, leftMargin: number): string {
  const total = t.colWidths.reduce((a, b) => a + b, 0);
  const cellMar = t.layout ? 0 : 3;
  const tblPr = `<w:tblPr>${t.layout ? "" : '<w:tblStyle w:val="Tabulka"/>'}<w:tblW w:w="${tw(total)}" w:type="dxa"/><w:tblInd w:w="${tw(t.x - leftMargin)}" w:type="dxa"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => `<w:${s} w:val="nil"/>`).join("")}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="${tw(cellMar)}" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="${tw(cellMar)}" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0" w:firstRow="${t.rows[0]?.header ? 1 : 0}" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr>`;
  const grid = `<w:tblGrid>${t.colWidths.map((w) => `<w:gridCol w:w="${tw(w)}"/>`).join("")}</w:tblGrid>`;
  const rows = t.rows.map((row) => {
    let col = 0;
    const cells = row.cells.map((cell) => {
      const w = t.colWidths.slice(col, col + cell.span).reduce((a, b) => a + b, 0);
      col += cell.span;
      const tcp = [`<w:tcW w:w="${tw(w)}" w:type="dxa"/>`];
      if (cell.span > 1) tcp.push(`<w:gridSpan w:val="${cell.span}"/>`);
      if (cell.vMerge) tcp.push(cell.vMerge === "restart" ? '<w:vMerge w:val="restart"/>' : "<w:vMerge/>");
      const b: Borders = cell.borders;
      if (b.top || b.bottom || b.left || b.right) tcp.push(`<w:tcBorders>${borderXml("top", b.top)}${borderXml("left", b.left)}${borderXml("bottom", b.bottom)}${borderXml("right", b.right)}</w:tcBorders>`);
      if (cell.shade) tcp.push(`<w:shd w:val="clear" w:color="auto" w:fill="${cell.shade}"/>`);
      if (cell.valign !== "top") tcp.push(`<w:vAlign w:val="${cell.valign}"/>`);
      // Svislé mezery v buňce se počítají od horní hrany řádku (obsah vpravo dole zůstane dole).
      const firstTop = cell.blocks[0] ? blockTop(cell.blocks[0]) : 0;
      // Svisle vystředěná (sloučená) buňka: pozici řeší vAlign, ne mezera nad textem.
      const start = cell.valign !== "top" ? firstTop : (row.top ?? firstTop);
      const inner = blocksXml(c, cell.blocks, start, t.x + (t.layout ? 0 : 3), null, true);
      return `<w:tc><w:tcPr>${tcp.join("")}</w:tcPr>${inner || "<w:p/>"}</w:tc>`;
    });
    const trp: string[] = [];
    if (row.header) trp.push("<w:tblHeader/>");
    // Výška řádku v PDF je od středu linky ke středu linky; aplikace k výšce řádku přičte
    // polovinu horní a polovinu dolní linky (měřeno: mřížka 0,5 pt → +0,5 pt, jen dolní 0,75 pt → +0,375 pt).
    const border = Math.max(0, ...row.cells.map((c) => ((c.borders.top?.sz ?? 0) + (c.borders.bottom?.sz ?? 0)) / 16));
    if (!t.layout && row.height > 0) trp.push(`<w:trHeight w:val="${tw(Math.max(1, row.height - border))}" w:hRule="atLeast"/>`);
    trp.push("<w:cantSplit/>");
    return `<w:tr><w:trPr>${trp.join("")}</w:trPr>${cells.join("")}</w:tr>`;
  });
  return `<w:tbl>${tblPr}${grid}${rows.join("")}</w:tbl>`;
}

const blockTop = (b: Block): number => (b.kind === "para" || b.kind === "table" || b.kind === "columns" ? b.top : b.y);
const blockBottom = (b: Block): number => (b.kind === "para" || b.kind === "table" || b.kind === "columns" ? b.bottom : b.kind === "rule" ? b.y + b.sz / 16 : b.y + b.h);

/**
 * Sekvence bloků → XML se svislými mezerami podle pozic v originálu (mezera před odstavcem,
 * vložené mezery před tabulkou/obrázkem). `leftMargin` = levý okraj, k němuž se počítá
 * odsazení tabulek.
 */
function blocksXml(c: Ctx, blocks: Block[], startY: number, leftMargin: number, page: PageLayout | null, inCell = false): string {
  let y = startY, out = "";
  let pendingBreak = false;
  const anchoredRuns: string[] = [];
  for (const b of blocks) {
    // Plovoucí obrázek jen na úrovni stránky; v buňce tabulky je vždy v řádku (jinak by ho
    // malý kotvicí odstavec ořízl).
    if (b.kind === "image" && b.anchored && page) { anchoredRuns.push(imageXml(c, b, page)); continue; }
    if (b.kind === "shape") { anchoredRuns.push(shapeXml(c, b)); continue; }
    if (b.kind === "frame") { out += frameXml(c, b); continue; }
    const gap = blockTop(b) - y;
    if (b.kind === "para") {
      const size = b.size ?? c.doc.body.size;
      const font = b.runs[0]?.font || (b.heading ? c.doc.headings[b.heading - 1]?.font : undefined) || c.doc.body.font;
      const [asc, desc] = metrics(font);
      const natural = (asc + desc) * size;
      const mult = b.line ? Math.max(1, b.line / natural) : 1;
      // Word přidává mezeru řádkování nad text: první účaří = horní hrana + výška řádku − descent.
      const boxTop = b.firstBase != null ? b.firstBase - (natural * mult - desc * size) : blockTop(b);
      const before = Math.max(0, boxTop - y);
      const p = { ...b, before, pageBreakBefore: b.pageBreakBefore || pendingBreak };
      out += paraXml(c, p, "");
      pendingBreak = false;
      y = b.lastBase != null ? b.lastBase + desc * size : blockBottom(b);
      continue;
    } else if (b.kind === "table") {
      if (gap > 3 || pendingBreak) out += spacerXml(Math.max(1, gap - 1), pendingBreak);
      pendingBreak = false;
      out += tableXml(c, b, leftMargin);
    } else if (b.kind === "image") {
      const pp = `<w:pPr>${pendingBreak ? "<w:pageBreakBefore/>" : ""}<w:spacing w:before="${tw(Math.max(0, gap))}" w:after="0" w:line="240" w:lineRule="auto"/>${b.x - leftMargin > 2 ? `<w:ind w:left="${tw(b.x - leftMargin)}"/>` : ""}</w:pPr>`;
      out += `<w:p>${pp}${imageXml(c, b)}</w:p>`;
      pendingBreak = false;
    } else if (b.kind === "rule") {
      out += ruleXml(b, gap);
    } else if (b.kind === "columns" && page) {
      out += columnsXml(c, b, y, page, out.length > 0 || pendingBreak);
      c.sections.push(true);
    }
    y = blockBottom(b);
  }
  if (anchoredRuns.length) out = `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr>${anchoredRuns.join("")}</w:p>` + out;
  // Tabulka nesmí být posledním prvkem buňky ani dokumentu.
  if (inCell && blocks.length && blocks[blocks.length - 1].kind === "table") out += "<w:p/>";
  return out;
}

interface Cols { widths: number[]; gap: number }

function sectPr(p: PageLayout & { headerOffset?: number; footerOffset?: number }, hf: { header?: string; footer?: string }, cols?: Cols, continuous = false): string {
  const orient = p.width > p.height ? ' w:orient="landscape"' : "";
  const colXml = cols
    ? `<w:cols w:num="${cols.widths.length}" w:space="${tw(cols.gap)}" w:equalWidth="0">${cols.widths.map((w, i) => `<w:col w:w="${tw(w)}"${i < cols.widths.length - 1 ? ` w:space="${tw(cols.gap)}"` : ""}/>`).join("")}</w:cols>`
    : '<w:cols w:space="708"/>';
  return `<w:sectPr>${hf.header ? `<w:headerReference w:type="default" r:id="${hf.header}"/>` : ""}${hf.footer ? `<w:footerReference w:type="default" r:id="${hf.footer}"/>` : ""}${continuous ? '<w:type w:val="continuous"/>' : ""}<w:pgSz w:w="${tw(p.width)}" w:h="${tw(p.height)}"${orient}/><w:pgMar w:top="${tw(p.margins.top)}" w:right="${tw(p.margins.right)}" w:bottom="${tw(p.margins.bottom)}" w:left="${tw(p.margins.left)}" w:header="${tw(p.headerOffset ?? Math.min(36, p.margins.top / 2))}" w:footer="${tw(p.footerOffset ?? Math.min(36, p.margins.bottom / 2))}" w:gutter="0"/>${colXml}</w:sectPr>`;
}

/**
 * Sloupce: konec předchozí (jednosloupcové) sekce, obsah levého sloupce, zalomení sloupce,
 * pravý sloupec a konec dvousloupcové sekce. Další obsah stránky pokračuje plynule.
 */
function columnsXml(c: Ctx, b: ColumnsBlock, y: number, page: PageLayout, hasBefore: boolean): string {
  const hf = c.hf;
  const tiny = '<w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr>';
  let out = hasBefore ? `<w:p><w:pPr>${tiny}${sectPr(page, hf, undefined, c.sections.length > 0)}</w:pPr></w:p>` : "";
  out += blocksXml(c, b.cols[0], y, b.x, page);
  out += `<w:p><w:pPr>${tiny}</w:pPr><w:r><w:br w:type="column"/></w:r></w:p>`;
  out += blocksXml(c, b.cols[1], y, b.x + b.widths[0] + b.gap, page);
  const left = Math.max(0, b.x - page.margins.left);
  out += `<w:p><w:pPr>${tiny}${sectPr({ ...page, margins: { ...page.margins, left: page.margins.left + left } }, hf, { widths: b.widths, gap: b.gap }, true)}</w:pPr></w:p>`;
  return out;
}

function stylesXml(doc: DocModel): string {
  const b = doc.body;
  const rpr = (font: string, size: number, bold: boolean, color: string) => `<w:rPr><w:rFonts w:ascii="${xmlEsc(font)}" w:hAnsi="${xmlEsc(font)}" w:cs="${xmlEsc(font)}" w:eastAsia="${xmlEsc(font)}"/>${bold ? "<w:b/><w:bCs/>" : ""}<w:color w:val="${color}"/><w:sz w:val="${Math.round(size * 2)}"/><w:szCs w:val="${Math.round(size * 2)}"/></w:rPr>`;
  const heads = [0, 1, 2].map((i) => {
    const h = doc.headings[i] ?? { font: b.font, size: b.size * (1.6 - i * 0.2), bold: true, color: b.color };
    return `<w:style w:type="paragraph" w:styleId="Heading${i + 1}"><w:name w:val="heading ${i + 1}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:outlineLvl w:val="${i}"/></w:pPr>${rpr(h.font, h.size, h.bold, h.color)}</w:style>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${NS}><w:docDefaults><w:rPrDefault>${rpr(b.font, b.size, false, b.color).replace("<w:rPr>", `<w:rPr><w:lang w:val="${doc.lang ?? "cs-CZ"}" w:eastAsia="en-US" w:bidi="ar-SA"/>`)}</w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
${heads}
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="34"/><w:qFormat/><w:pPr><w:ind w:left="720"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Header"><w:name w:val="header"/><w:basedOn w:val="Normal"/><w:pPr><w:tabs><w:tab w:val="center" w:pos="4536"/><w:tab w:val="right" w:pos="9072"/></w:tabs></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:tabs><w:tab w:val="center" w:pos="4536"/><w:tab w:val="right" w:pos="9072"/></w:tabs></w:pPr></w:style>
<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/></w:style>
<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="DefaultParagraphFont"/><w:uiPriority w:val="99"/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:customStyle="1" w:styleId="Tabulka"><w:name w:val="Tabulka"/><w:basedOn w:val="TableNormal"/><w:qFormat/><w:tblPr><w:tblCellMar><w:left w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>`;
}

function numberingXml(ls: ListState): string {
  const fmtText = (l: ListInfo, lvl: number) => {
    if (l.kind === "bullet") return { fmt: "bullet", text: l.marker };
    const m = /^(\()?.+?([.)])$/.exec(l.marker);
    return { fmt: l.format === "bullet" ? "decimal" : l.format, text: `${m?.[1] ?? ""}%${lvl + 1}${m?.[2] ?? "."}` };
  };
  const abstract = (id: number, kind: "bullet" | "number") => {
    const infos = ls.abstract[kind];
    const tiers = ls.levels[kind];
    const lvls = Array.from({ length: 9 }, (_, i) => {
      const info = infos[Math.min(i, infos.length - 1)];
      const left = info ? info.textX : 36 * (i + 1);
      const hang = info ? Math.max(6, info.textX - info.markerX) : 18;
      const { fmt, text } = info ? fmtText(info, i) : { fmt: kind === "bullet" ? "bullet" : "decimal", text: kind === "bullet" ? "•" : `%${i + 1}.` };
      void tiers;
      return `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${xmlEsc(text)}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${tw(left)}" w:hanging="${tw(hang)}"/></w:pPr></w:lvl>`;
    }).join("");
    return `<w:abstractNum w:abstractNumId="${id}"><w:multiLevelType w:val="hybridMultilevel"/>${lvls}</w:abstractNum>`;
  };
  const nums = ls.nums.map((n, i) => `<w:num w:numId="${i + 1}"><w:abstractNumId w:val="${n.abstractId}"/>${n.restart ? '<w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride>' : ""}</w:num>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ${NS}>${abstract(0, "bullet")}${abstract(1, "number")}${nums}</w:numbering>`;
}

/** Sesbírá úrovně seznamů (pozice značek) z celého dokumentu. */
function collectLists(doc: DocModel): ListState {
  const ls: ListState = { levels: { bullet: [], number: [] }, abstract: { bullet: [], number: [] }, nums: [], current: null };
  const visit = (bs: Block[]) => {
    for (const b of bs) {
      if (b.kind === "para" && b.list) {
        const tiers = ls.levels[b.list.kind];
        if (!tiers.some((x) => Math.abs(x - b.list!.markerX) < 6)) { tiers.push(b.list.markerX); }
      } else if (b.kind === "table") for (const r of b.rows) for (const c of r.cells) visit(c.blocks);
    }
  };
  for (const p of doc.pages) visit(p.blocks);
  for (const k of ["bullet", "number"] as const) ls.levels[k].sort((a, b) => a - b);
  const visit2 = (bs: Block[]) => {
    for (const b of bs) {
      if (b.kind === "para" && b.list) {
        const lvl = listLevel(ls, b.list);
        ls.abstract[b.list.kind][lvl] ??= b.list;
      } else if (b.kind === "table") for (const r of b.rows) for (const c of r.cells) visit2(c.blocks);
    }
  };
  for (const p of doc.pages) visit2(p.blocks);
  for (const k of ["bullet", "number"] as const) for (let i = 0; i < ls.abstract[k].length; i++) ls.abstract[k][i] ??= ls.abstract[k][i - 1];
  return ls;
}

function hfXml(c: Ctx, tag: "hdr" | "ftr", blocks: Block[]): string {
  const style = tag === "hdr" ? "Header" : "Footer";
  const body = blocks.map((b) => {
    if (b.kind !== "para") return "";
    const xml = paraXml(c, { ...b, before: 0, after: 0, line: null });
    // Číslo stránky → pole PAGE / NUMPAGES („Strana 1 z 2“, „1/2“, „Page 1 of 2“).
    let n = 0;
    return xml.replace("<w:pPr>", `<w:pPr><w:pStyle w:val="${style}"/>`).replace(/(<w:t xml:space="preserve">)([^<]*)(<\/w:t>)/g, (_m, a, text: string, z) => {
      if (!/\d/.test(text)) return a + text + z;
      return a + text.replace(/\d+/g, (num) => {
        n++;
        const instr = n === 1 ? "PAGE" : "NUMPAGES";
        return `</w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>${num}</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r><w:r><w:t xml:space="preserve">`;
      }) + z;
    });
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:${tag} ${NS}>${body || "<w:p/>"}</w:${tag}>`;
}

export function writeDocx(doc: DocModel): Uint8Array {
  const hf: { header?: string; footer?: string } = {};
  const c: Ctx = { hf, sections: [], rels: [], media: {}, nextRel: 10, nextDrawing: 1, linkRels: new Map(), lists: collectLists(doc), doc };
  const files: Record<string, Uint8Array | string> = {};
  const ct: string[] = [];
  if (doc.header?.blocks.length) {
    hf.header = "rIdHdr1";
    files["word/header1.xml"] = hfXml(c, "hdr", doc.header.blocks);
    c.rels.push('<Relationship Id="rIdHdr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>');
    ct.push('<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>');
  }
  if (doc.footer?.blocks.length) {
    hf.footer = "rIdFtr1";
    files["word/footer1.xml"] = hfXml(c, "ftr", doc.footer.blocks);
    c.rels.push('<Relationship Id="rIdFtr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>');
    ct.push('<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>');
  }
  let body = "";
  for (const p of doc.pages) Object.assign(p, { headerOffset: doc.header?.offset, footerOffset: doc.footer?.offset });
  doc.pages.forEach((p, i) => {
    const first = p.blocks[0];
    // Stránka, jejíž začátek se přelil do tabulky z předchozí strany, nezačíná zalomením.
    const breakHere = i > 0 && !(p as PageLayout & { continues?: boolean }).continues;
    const blocks = breakHere && first ? [first.kind === "para" ? { ...first, pageBreakBefore: true } : first, ...p.blocks.slice(1)] : p.blocks;
    const startY = breakHere || i === 0 ? p.margins.top : (first ? blockTop(first) : p.margins.top);
    let xml = blocksXml(c, blocks, startY, p.margins.left, p);
    if (breakHere && first && first.kind !== "para") xml = spacerXml(1, true) + xml;
    // Přesný režim: rámce se kotví k následujícímu běžnému odstavci — ten musí být na téže stránce.
    if (p.exact) xml += spacerXml(1);
    body += xml;
    // Jiný rozměr další stránky (na šířku) = konec sekce.
    const next = doc.pages[i + 1];
    if (next && (Math.abs(next.width - p.width) > 1 || Math.abs(next.height - p.height) > 1)) body += `<w:p><w:pPr>${sectPr(p, hf)}</w:pPr></w:p>`;
  });
  const last = doc.pages[doc.pages.length - 1];
  body += sectPr(last, hf, undefined, c.sections.length > 0);

  files["word/document.xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body}</w:body></w:document>`;
  files["word/styles.xml"] = stylesXml(doc);
  files["word/numbering.xml"] = numberingXml(c.lists);
  files["word/settings.xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings ${NS}><w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;
  files["word/fontTable.xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:fonts ${NS}/>`;
  for (const [k, v] of Object.entries(c.media)) files[k] = v;
  files["word/_rels/document.xml.rels"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>${c.rels.join("")}</Relationships>`;
  files["docProps/core.xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(doc.title ?? "")}</dc:title><dc:creator>VeVit Tools</dc:creator></cp:coreProperties>`;
  files["[Content_Types].xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${ct.join("")}</Types>`;
  files["_rels/.rels"] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
  const enc: Record<string, Uint8Array> = {};
  for (const [k, v] of Object.entries(files)) enc[k] = typeof v === "string" ? strToU8(v) : v;
  // Obrázky (PNG) jsou už komprimované.
  return zipSync(enc, { level: 6 });
}
