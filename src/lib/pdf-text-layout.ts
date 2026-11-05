// Rozložení textové vrstvy PDF do logických bloků (odstavce, nadpisy, tabulky)
// a jejich převod do OOXML (.docx). Čisté funkce bez závislostí — testovatelné
// v Node (tests/unit/pdf-text-layout.test.mjs), sdílené pdf-to-word i
// pdf-extract-text.
//
// Proč: původní konverze spojovala položky pdf.js naslepo ("" spoj) a každý
// vizuální řádek dělala samostatný odstavec. Výsledkem byly slepené sloupce
// ("s.r.o.Odběratel"), zbytečné mezery, tabulky jako plochý text a fragmentované
// odstavce. Tento modul řeší mezery podle reálných pozic/šířek, detekuje
// vícesloupcovou sazbu i tabulky a odstavce slučuje přes heuristiky šířky řádku.

// ── Vstupní typy (tvar položek z pdf.js getTextContent) ────────────────────

export interface PdfTextItem {
  str: string;
  /** transform[4] — x pozice baseline v pt */
  x: number;
  /** transform[5] — y pozice baseline v pt (v PDF roste nahoru) */
  y: number;
  width: number;
  /** výška glyfu ≈ velikost písma v pt */
  height: number;
  fontName?: string;
}

export interface PageInput {
  items: PdfTextItem[];
  width: number;
  height: number;
}

// ── Výstupní typy ──────────────────────────────────────────────────────────

export type TextBlock =
  | { kind: "paragraph"; text: string; align: "left" | "center" | "right"; fontSize: number }
  | { kind: "heading"; text: string; align: "left" | "center" | "right"; fontSize: number }
  | { kind: "table"; rows: string[][] };

export interface PageBlocks {
  blocks: TextBlock[];
}

// ── Pomůcky ────────────────────────────────────────────────────────────────

/** Normalizuje text položky: kolaps bílých znaků, oříznutí okrajů. */
function cleanItemText(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

function startsLowercase(text: string): boolean {
  return /^[,;)\]»”a-záčďéěíňóřšťúůýžäöüßæøå mn]/.test(text);
}

function startsListMarker(text: string): boolean {
  return /^([-–•*▪◦]\s+|\d{1,2}[.)]\s+|[a-zA-Z][.)]\s+)/.test(text);
}

// ── Řádky: grupování podle baseline s tolerancí ────────────────────────────

export interface LayoutLine {
  y: number;
  /** segmenty = položky na řádku (seřazené podle x), s vyčištěným textem */
  words: { str: string; x: number; xEnd: number }[];
  xStart: number;
  xEnd: number;
  fontSize: number;
  /** text spojený podle mezer mezi segmenty (gap-aware) */
  text: string;
}

/**
 * Spojí segmenty jednoho řádku do textu. Mezera se vloží jen tam, kde
 * reálně podle pozic je — pdf.js často vrací položky slepené (žádná mezera)
 * nebo s mezerami naznačenými pozicí, ne obsahem.
 */
function joinSegments(words: { str: string; x: number; xEnd: number }[], fontSize: number): string {
  let out = "";
  let prevEnd = NaN;
  for (const w of words) {
    if (!out) {
      out = w.str;
      prevEnd = w.xEnd;
      continue;
    }
    const gap = w.x - prevEnd;
    // průměrná šířka znaku ≈ 0.5 × velikost písma; mezera = ~0.25 × velikost
    const spaceThreshold = 0.25 * fontSize;
    if (gap >= spaceThreshold) out += " " + w.str;
    else out += w.str;
    prevEnd = w.xEnd;
  }
  // kolaps vícenásobných mezer (pdf.js někdy vkládá vyplněné mezery do stringů)
  return out.replace(/ {2,}/g, " ").trim();
}

/** Grupuje položky stránky do vizuálních řádků (baseline + tolerance výšky fontu). */
export function buildLines(items: PdfTextItem[]): LayoutLine[] {
  const usable = items
    .filter((it) => cleanItemText(it.str).length > 0)
    .map((it) => ({ ...it, str: cleanItemText(it.str) }));
  if (usable.length === 0) return [];

  // shora dolů (y roste nahoru), uvnitř řádku podle x
  const sorted = usable.slice().sort((a, b) => (b.y - a.y) || (a.x - b.x));

  const lines: LayoutLine[] = [];
  let current: typeof sorted = [];
  let lineY = sorted[0].y;
  let lineTol = 2;

  const flush = () => {
    if (current.length === 0) return;
    current.sort((a, b) => a.x - b.x);
    const words = current.map((it) => ({ str: it.str, x: it.x, xEnd: it.x + it.width }));
    const fontSize = Math.max(...current.map((it) => it.height)) || 10;
    lines.push({
      y: lineY,
      words,
      xStart: words[0].x,
      xEnd: words[words.length - 1].xEnd,
      fontSize,
      text: joinSegments(words, fontSize),
    });
    current = [];
  };

  for (const it of sorted) {
    if (current.length === 0) {
      current = [it];
      lineY = it.y;
      lineTol = Math.max(2, 0.3 * it.height);
      continue;
    }
    if (Math.abs(it.y - lineY) <= lineTol) {
      current.push(it);
      lineTol = Math.max(lineTol, Math.max(2, 0.3 * it.height));
    } else {
      flush();
      current = [it];
      lineY = it.y;
      lineTol = Math.max(2, 0.3 * it.height);
    }
  }
  flush();
  return lines;
}

// ── Sloupce: detekce vícesloupcové sazby ───────────────────────────────────

/**
 * Rozdělí řádek na segmenty podle velkých mezer (gap > 2.5 × velikost písma).
 * Ve vícesloupcové sazbě je to mezera mezi sloupci; v běžném textu tak velké
 * mezery nejsou. V tabulkách ano — proto detekce sloupců tabulkové stránky
 * odmítne (řádky s více segmenty ve shlucích).
 */
function lineSegments(line: LayoutLine): { str: string; x: number; xEnd: number }[][] {
  const segments: { str: string; x: number; xEnd: number }[][] = [];
  let current: { str: string; x: number; xEnd: number }[] = [];
  let prevEnd = NaN;
  for (const w of line.words) {
    if (current.length === 0) {
      current = [w];
      prevEnd = w.xEnd;
      continue;
    }
    const gap = w.x - prevEnd;
    if (gap > 2.5 * line.fontSize) {
      segments.push(current);
      current = [w];
    } else {
      current.push(w);
    }
    prevEnd = w.xEnd;
  }
  if (current.length) segments.push(current);
  return segments;
}

/**
 * Detekuje sloupce stránky. Sloupce = shluky x-počátků segmentů, kde segmenty
 * v každém shluku jsou ŠIROKÉ (plní sloupec). Tabulkové buňky jsou naproti
 * tomu úzké — to je klíčový diskriminátor mezi novinovými sloupci a tabulkou
 * (oba mají segmenty na stejných x pozicích).
 * Vrací null, pokud stránka není čistě vícesloupcová.
 */
export function detectPageColumns(lines: LayoutLine[], pageWidth: number): LayoutLine[][] | null {
  // pozor: vícesloupcové řádky sdílejí baseline, takže lines je méně než
  // celkový počet vizuálních řádků obou sloupců — prahová hodnota musí být nízká
  if (lines.length < 4) return null;

  const segs = lines.flatMap((l) => lineSegments(l).map((s) => ({ line: l, seg: s })));
  if (segs.length < 8) return null;

  // shluky x-počátků segmentů (tolerance 4 pt)
  const starts = segs.map((s) => s.seg[0].x).sort((a, b) => a - b);
  const clusters: { x: number; count: number }[] = [];
  for (const x of starts) {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(x - last.x) <= 4) {
      last.count += 1;
      last.x = (last.x * (last.count - 1) + x) / last.count;
    } else clusters.push({ x, count: 1 });
  }
  const totalSegs = segs.length;
  const major = clusters.filter((c) => c.count >= Math.max(4, Math.floor(totalSegs * 0.25)));
  if (major.length < 2) return null;

  // shluky musí být od sebe daleko (≥ 15 % šířky stránky)
  for (let i = 1; i < major.length; i++) {
    if (major[i].x - major[i - 1].x < pageWidth * 0.15) return null;
  }

  const clusterOf = (x: number): number => {
    let best = -1;
    let bestDist = Infinity;
    major.forEach((c, i) => {
      const d = Math.abs(x - c.x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return bestDist <= 8 ? best : -1;
  };

  // každý shluk musí být tvořen širokými segmenty (≥ 50 % vzdálenosti do
  // dalšího shluku / pravého okraje obsahu) v ≥ 70 % případů — tabulkové
  // buňky jsou úzké, sloupcové řádky plní sloupec
  const contentRight = Math.max(...lines.map((l) => l.xEnd));
  for (let ci = 0; ci < major.length; ci++) {
    const nextX = ci + 1 < major.length ? major[ci + 1].x : contentRight;
    const span = Math.max(1, nextX - major[ci].x);
    const clusterSegs = segs.filter((s) => clusterOf(s.seg[0].x) === ci);
    if (clusterSegs.length < 4) return null;
    const wide = clusterSegs.filter((s) => (s.seg[s.seg.length - 1].xEnd - s.seg[0].x) >= span * 0.5).length;
    if (wide / clusterSegs.length < 0.7) return null;
  }

  // rozdělit segmenty řádků do sloupců (pořadí y v rámci sloupce zachováno —
  // lines jsou seřazené shora dolů, takže push zachovává pořadí)
  const buckets: LayoutLine[][] = major.map(() => []);
  for (const line of lines) {
    for (const seg of lineSegments(line)) {
      const c = clusterOf(seg[0].x);
      if (c === -1) return null; // segment mimo sloupce → není čistá vícesloupcová sazba
      const segLine: LayoutLine = {
        y: line.y,
        words: seg,
        xStart: seg[0].x,
        xEnd: seg[seg.length - 1].xEnd,
        fontSize: line.fontSize,
        text: joinSegments(seg, line.fontSize),
      };
      buckets[c].push(segLine);
    }
  }
  // obsah v každém sloupci, jinak to nebylo vícesloupcové rozložení
  return buckets.every((b) => b.length >= 2) ? buckets : null;
}

// ── Tabulky: konzistentní mřížka sloupců přes více řádků ───────────────────

interface TableRegion {
  rows: string[][];
}

/**
 * Najde v posloupnosti řádků oblast tabulky: ≥ 3 shluky x-počátků (sloupce),
 * ≥ 3 po sobě jdoucí řádky sdílející tyto shluky. Faktury a výpisové tabulky
 * mají pravidelné x pozice buněk — tohle je spolehlivý signál.
 */
export function detectTable(lines: LayoutLine[], from: number): TableRegion | null {
  // shluky x-počátků segmentů (ne celých řádků) — buňky tabulky začínají na
  // konzistentních pozicích
  const xs: number[] = [];
  for (const l of lines) for (const w of l.words) xs.push(w.x);
  xs.sort((a, b) => a - b);
  const clusters: { x: number; count: number }[] = [];
  for (const x of xs) {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(x - last.x) <= 5) {
      last.count += 1;
      last.x = (last.x * (last.count - 1) + x) / last.count;
    } else clusters.push({ x, count: 1 });
  }
  const cols = clusters.filter((c) => c.count >= 3);
  if (cols.length < 3) return null;

  const cellCol = (x: number): number => {
    let best = -1;
    let bestDist = Infinity;
    cols.forEach((c, i) => {
      const d = Math.abs(x - c.x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return bestDist <= 8 ? best : -1;
  };

  // po sobě jdoucí řádky (shora dolů) s ≥ 2 buňkami ve sloupcích
  const rows: string[][] = [];
  let i = from;
  while (i < lines.length) {
    const line = lines[i];
    const cells: (string | null)[] = cols.map(() => null);
    let filled = 0;
    for (const w of line.words) {
      const c = cellCol(w.x);
      if (c === -1) { filled = -99; break; }
      cells[c] = (cells[c] ? cells[c] + " " : "") + w.str;
      filled += 1;
    }
    if (filled < 2) break;
    rows.push(cells.map((c) => (c ?? "").trim()));
    i += 1;
  }
  if (rows.length < 3) return null;
  return { rows };
}

// ── Bloky stránky ──────────────────────────────────────────────────────────

const MIN_BODY_SIZE_FOR_HEADING_RATIO = 1.28;

export function buildPageBlocks(page: PageInput): PageBlocks {
  const lines = buildLines(page.items);
  const blocks: TextBlock[] = [];
  if (lines.length === 0) return { blocks };

  // odhad okrajů obsahu
  const contentLeft = Math.min(...lines.map((l) => l.xStart));
  const contentRight = Math.max(...lines.map((l) => l.xEnd));
  const contentWidth = Math.max(1, contentRight - contentLeft);

  // typická velikost textu (medián) → nadpisy přes poměr
  const sizes = lines.map((l) => l.fontSize).sort((a, b) => a - b);
  const bodySize = sizes[Math.floor(sizes.length / 2)] || 10;

  // vícesloupcová sazba → zpracovat každý sloupec samostatně, v pořadí
  const columns = detectPageColumns(lines, page.width);
  const lineGroups: LayoutLine[][] = columns ?? [lines];

  for (const group of lineGroups) {
    appendBlocksFromLines(group, blocks, { contentLeft, contentWidth, bodySize, pageWidth: page.width, pageHeight: page.height });
  }
  return { blocks };
}

function appendBlocksFromLines(
  lines: LayoutLine[],
  blocks: TextBlock[],
  ctx: { contentLeft: number; contentWidth: number; bodySize: number; pageWidth: number; pageHeight: number },
) {
  const { contentLeft, contentWidth, bodySize, pageWidth } = ctx;
  let i = 0;
  while (i < lines.length) {
    // tabulka?
    const table = detectTable(lines, i);
    if (table) {
      const tableLines = table.rows.length;
      blocks.push({ kind: "table", rows: table.rows });
      i += tableLines;
      continue;
    }

    const line = lines[i];
    const isHeading = line.fontSize >= bodySize * MIN_BODY_SIZE_FOR_HEADING_RATIO && line.text.length <= 120;

    // Řádek s více segmenty (velké mezery), který nebyl tabulka ani sloupec:
    // emitovat segmenty jako samostatné řádky — slepení sloupců/buněk je horší
    // než podrobnost. Žádné slučování následujících řádků (různé shluky).
    const segs = lineSegments(line);
    if (segs.length > 1) {
      for (const seg of segs) {
        const segText = joinSegments(seg, line.fontSize);
        const segLine: LayoutLine = { y: line.y, words: seg, xStart: seg[0].x, xEnd: seg[seg.length - 1].xEnd, fontSize: line.fontSize, text: segText };
        blocks.push({ kind: "paragraph", text: segText, align: lineAlign(segLine, contentLeft, contentWidth, pageWidth), fontSize: line.fontSize });
      }
      i += 1;
      continue;
    }

    if (isHeading) {
      // nadpis: sloučit sousední řádky nadpisu
      const parts = [line.text];
      let j = i + 1;
      while (j < lines.length && lines[j].fontSize >= bodySize * MIN_BODY_SIZE_FOR_HEADING_RATIO) {
        parts.push(lines[j].text);
        j += 1;
      }
      blocks.push({ kind: "heading", text: parts.join(" "), align: lineAlign(line, contentLeft, contentWidth, pageWidth), fontSize: line.fontSize });
      i = j;
      continue;
    }

    // odstavec: slučovat řádky, dokud patří k sobě
    const parts: string[] = [line.text];
    const paraStart = line.xStart;
    const paraFont = line.fontSize;
    let prev = line;
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j];

      // tabulka končí odstavec
      if (detectTable(lines, j)) break;

      // nadpis končí odstavec
      if (next.fontSize >= bodySize * MIN_BODY_SIZE_FOR_HEADING_RATIO) break;

      // svislá mezera > 1.7 × velikost písma = nový odstavec
      const vGap = prev.y - next.y;
      if (vGap > paraFont * 1.7) break;

      // seznamové odrážky vždy samostatné
      if (startsListMarker(next.text)) break;
      if (startsListMarker(prev.text) && !prevFullWidth(prev, contentLeft, contentWidth)) break;

      const prevShort = !prevFullWidth(prev, contentLeft, contentWidth);
      // krátký řádek + další začíná velkým písmenem/číslicí = konec odstavce
      if (prevShort && !startsLowercase(next.text)) break;
      // výrazné odsazení = nový odstavec
      if (next.xStart > paraStart + paraFont * 1.6) break;

      parts.push(next.text);
      prev = next;
      j += 1;
    }

    blocks.push({ kind: "paragraph", text: parts.join(" ").replace(/ {2,}/g, " ").trim(), align: lineAlign(line, contentLeft, contentWidth, pageWidth), fontSize: paraFont });
    i = j;
  }
}

function prevFullWidth(line: LayoutLine, contentLeft: number, contentWidth: number): boolean {
  return line.xEnd >= contentLeft + contentWidth * 0.72;
}

function lineAlign(line: LayoutLine, contentLeft: number, contentWidth: number, pageWidth: number): "left" | "center" | "right" {
  const centerOffset = Math.abs(line.xStart + (line.xEnd - line.xStart) / 2 - pageWidth / 2);
  const width = line.xEnd - line.xStart;
  if (centerOffset < pageWidth * 0.04 && line.xStart > contentLeft + contentWidth * 0.08) return "center";
  if (pageWidth - line.xEnd < pageWidth * 0.04 && width > contentWidth * 0.3) return "right";
  return "left";
}

// ── TXT výstup (pdf-extract-text) ──────────────────────────────────────────

export function blocksToPlainText(pages: PageBlocks[]): string {
  const out: string[] = [];
  pages.forEach((page, idx) => {
    if (idx > 0) out.push("");
    for (const b of page.blocks) {
      if (b.kind === "table") {
        // buňky oddělené tabulátorem, řádky novým řádkem
        for (const row of b.rows) out.push(row.map((c) => (c ?? "")).join("\t"));
      } else {
        out.push(b.text);
      }
    }
  });
  return out.join("\n");
}

// ── OOXML (.docx) ──────────────────────────────────────────────────────────

export function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** pt → half-points pro w:sz */
function szHalfPoints(pt: number): number {
  return Math.max(2, Math.round(pt * 2));
}

function xmlRun(text: string, opts: { bold?: boolean; italic?: boolean; szPt?: number }): string {
  const rPr: string[] = [];
  if (opts.bold) rPr.push('<w:b/>');
  if (opts.italic) rPr.push('<w:i/>');
  if (opts.szPt) rPr.push(`<w:sz w:val="${szHalfPoints(opts.szPt)}"/>`);
  const rPrXml = rPr.length ? `<w:rPr>${rPr.join("")}</w:rPr>` : "";
  return `<w:r>${rPrXml}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`;
}

function xmlParagraph(text: string, opts: { bold?: boolean; szPt?: number; align?: string; pageBreakBefore?: boolean }): string {
  const pPr: string[] = [];
  if (opts.align && opts.align !== "left") pPr.push(`<w:jc w:val="${opts.align}"/>`);
  if (opts.pageBreakBefore) pPr.push('<w:pageBreakBefore/>');
  const pPrXml = pPr.length ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
  return `<w:p>${pPrXml}${xmlRun(text, opts)}</w:p>`;
}

function xmlTable(rows: string[][], headerBold: boolean): string {
  const borders = '<w:tblBorders>'
    + '<w:top w:val="single" w:sz="4" w:color="BFBFBF"/>'
    + '<w:left w:val="single" w:sz="4" w:color="BFBFBF"/>'
    + '<w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/>'
    + '<w:right w:val="single" w:sz="4" w:color="BFBFBF"/>'
    + '<w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/>'
    + '<w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/>'
    + '</w:tblBorders>';
  const colCount = Math.max(...rows.map((r) => r.length));
  const width = Math.floor(9350 / colCount);
  const grid = `<w:tblGrid>${Array.from({ length: colCount }, () => `<w:gridCol w:w="${width}"/>`).join("")}</w:tblGrid>`;
  const trs = rows.map((row, ri) => {
    const cells = Array.from({ length: colCount }, (_, ci) => {
      const text = row[ci] ?? "";
      const bold = headerBold && ri === 0;
      const rPr = bold ? '<w:rPr><w:b/></w:rPr>' : '';
      return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr><w:p><w:r>${rPr}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p></w:tc>`;
    });
    return `<w:tr>${cells.join("")}</w:tr>`;
  });
  return `<w:tbl><w:tblPr><w:tblW w:w="9350" w:type="dxa"/>${borders}</w:tblPr>${grid}${trs.join("")}</w:tbl>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;

export interface DocxFiles {
  "[Content_Types].xml": string;
  "_rels/.rels": string;
  "word/document.xml": string;
  "word/_rels/document.xml.rels": string;
  "word/styles.xml": string;
}

/**
 * Sestaví soubory .docx (OOXML) z bloků stránek. Obsah zipuje až volající
 * (JSZip v prohlížeči) — tady je jen XML, ať je to testovatelné bez závislostí.
 */
export function blocksToDocxFiles(pages: PageBlocks[]): DocxFiles {
  const bodyParts: string[] = [];

  pages.forEach((page, pageIdx) => {
    for (const b of page.blocks) {
      const pageBreakBefore = pageIdx > 0 && bodyParts.length > 0 && b === page.blocks[0];
      if (b.kind === "table") {
        bodyParts.push(xmlTable(b.rows, true));
      } else if (b.kind === "heading") {
        const scale = Math.min(2, Math.max(1, b.fontSize / 11));
        bodyParts.push(xmlParagraph(b.text, { bold: true, szPt: Math.round(11 * scale * 10) / 10, align: b.align === "left" ? undefined : b.align, pageBreakBefore }));
      } else {
        const szPt = Math.max(9, Math.min(14, b.fontSize));
        bodyParts.push(xmlParagraph(b.text, { szPt, align: b.align === "left" ? undefined : b.align, pageBreakBefore }));
      }
    }
    // prázdná stránka → alespoň page break, ať se stránky neztrácejí
    if (page.blocks.length === 0 && pageIdx > 0) {
      bodyParts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
    }
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${bodyParts.join("\n")}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;

  return {
    "[Content_Types].xml": CONTENT_TYPES,
    "_rels/.rels": ROOT_RELS,
    "word/document.xml": documentXml,
    "word/_rels/document.xml.rels": DOC_RELS,
    "word/styles.xml": STYLES_XML,
  };
}
