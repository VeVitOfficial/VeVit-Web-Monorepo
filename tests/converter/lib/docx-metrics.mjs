// DOCX-side metrics: render a DOCX to PDF with desktop LibreOffice (neutral renderer, isolated
// font set) and read its structure (tables, styles, text frames) straight from the OOXML.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";

// No import.meta here: Playwright loads these helpers through its CommonJS transform.
const FONTS_CONF = path.resolve(process.env.CONVERTER_FONTS_CONF ?? path.join(process.cwd(), "fonts/fonts.conf"));

export function hasSoffice() {
  try { execFileSync("soffice", ["--version"], { stdio: "pipe" }); return true; } catch { return false; }
}

/** DOCX → PDF via LibreOffice desktop; returns the PDF path (caller deletes `dir`). */
export function renderDocx(docxPath, outPdf, fontsConf = FONTS_CONF) {
  const dir = mkdtempSync(path.join(tmpdir(), "vv-lo-"));
  try {
    const src = path.join(dir, "in.docx");
    copyFileSync(docxPath, src);
    execFileSync("soffice", [`-env:UserInstallation=file://${dir}/profile`, "--headless", "--convert-to", "pdf", "--outdir", dir, src], {
      stdio: "pipe", timeout: 180_000, env: { ...process.env, FONTCONFIG_FILE: fontsConf },
    });
    const pdf = path.join(dir, "in.pdf");
    if (!existsSync(pdf)) throw new Error("LibreOffice did not produce a PDF");
    copyFileSync(pdf, outPdf);
    return outPdf;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const textOf = (xml) => [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g)].map((m) => (m[1] ?? "\t")).join("")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

/** Top-level tables of word/document.xml: [{rows:[[cellText…]…], cols, headerRows}] (nested tables flattened into their cell). */
export function docxTables(docxPath) {
  const xml = documentXml(docxPath);
  const tables = [];
  let depth = 0, start = -1;
  const re = /<w:tbl>|<\/w:tbl>/g;
  let m;
  while ((m = re.exec(xml))) {
    if (m[0] === "<w:tbl>") { if (depth++ === 0) start = m.index; }
    else if (--depth === 0) tables.push(xml.slice(start, m.index + m[0].length));
  }
  return tables.map((t) => {
    const rows = [...t.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((r) => [...r[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((c) => textOf(c[0]).trim()));
    return { rows, cols: Math.max(0, ...rows.map((r) => r.length)), headerRows: (t.match(/<w:tblHeader\/>/g) ?? []).length };
  });
}

export function documentXml(docxPath) {
  const files = unzipSync(readFileSync(docxPath), { filter: (f) => f.name === "word/document.xml" });
  return strFromU8(files["word/document.xml"]);
}

/** Structure summary for the "clean OOXML" checks of the editable mode. */
export function docxStructure(docxPath) {
  const files = unzipSync(readFileSync(docxPath));
  const doc = strFromU8(files["word/document.xml"] ?? new Uint8Array());
  const parts = Object.keys(files);
  return {
    paragraphs: (doc.match(/<w:p[ >]/g) ?? []).length,
    styledParagraphs: (doc.match(/<w:pStyle /g) ?? []).length,
    headings: (doc.match(/<w:pStyle w:val="Heading\d"/g) ?? []).length,
    tables: (doc.match(/<w:tbl>/g) ?? []).length,
    textBoxes: (doc.match(/<w:txbxContent>|<wps:txbx>/g) ?? []).length,
    frames: (doc.match(/<w:framePr /g) ?? []).length,
    anchoredDrawings: (doc.match(/<wp:anchor /g) ?? []).length,
    inlineDrawings: (doc.match(/<wp:inline /g) ?? []).length,
    images: parts.filter((p) => p.startsWith("word/media/")).length,
    headers: parts.filter((p) => /^word\/header\d*\.xml$/.test(p)).length,
    footers: parts.filter((p) => /^word\/footer\d*\.xml$/.test(p)).length,
    hasNumbering: parts.includes("word/numbering.xml"),
    media: parts.filter((p) => p.startsWith("word/media/")).map((p) => ({ name: p, bytes: files[p].length })),
  };
}
