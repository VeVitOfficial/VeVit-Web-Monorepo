// Unit tests for the browser converter modules (run in Node via type stripping):
//   node --test tests/converter/unit/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync, unzipSync, strFromU8 } from "fflate";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { checkDocx, readZipDirectory } from "../../../src/lib/converter/zip-guard.ts";
import { limitsFor, deviceProfile, LimitError, isOutOfMemory } from "../../../src/lib/converter/limits.ts";
import { bundledFor, fontNeeds, filesFor, substitutionWarnings } from "../../../src/lib/converter/fonts.ts";
import { parseFontName } from "../../../src/lib/converter/pdf/extract.ts";
import { mapFont, fontReport } from "../../../src/lib/converter/pdf/fontmap.ts";
import { encodePng, rasterizeRects } from "../../../src/lib/converter/pdf/png.ts";
import { buildLines, rulesAndFills, vectorClusters } from "../../../src/lib/converter/pdf/layout.ts";
import { writeDocx } from "../../../src/lib/converter/pdf/docx-writer.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const corpus = path.join(here, "../corpus");
const big = limitsFor({ memoryGb: 8, cores: 8, mobile: false, weak: false });

test("zip guard: corpus DOCX passes, report flags", () => {
  const rep = checkDocx(new Uint8Array(readFileSync(path.join(corpus, "docx/faktura.docx"))), big);
  assert.equal(rep.isDocx, true);
  assert.equal(rep.hasMacros, false);
  assert.ok(rep.entries.some((e) => e.name === "word/document.xml"));
});

test("zip guard: zip bomb (high ratio, huge declared size) is rejected", () => {
  const zip = zipSync({ "word/document.xml": new Uint8Array(40 * 1024 * 1024) }, { level: 9 });
  assert.throws(() => checkDocx(zip, big), (e) => e instanceof LimitError && e.code === "zip_bomb");
});

test("zip guard: encrypted (OLE) and non-zip input", () => {
  const ole = new Uint8Array(512); ole.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  assert.throws(() => checkDocx(ole, big), (e) => e.code === "encrypted");
  assert.throws(() => checkDocx(new TextEncoder().encode("hello world, not a zip"), big), (e) => e.code === "invalid_file");
});

test("zip guard: path traversal and macros", () => {
  const evil = zipSync({ "../evil.xml": new Uint8Array(4), "word/document.xml": new Uint8Array(4) });
  assert.throws(() => checkDocx(evil, big), (e) => e.code === "invalid_file");
  const macro = zipSync({ "word/document.xml": new Uint8Array(4), "word/vbaProject.bin": new Uint8Array(4), "[Content_Types].xml": new Uint8Array(4) });
  assert.equal(checkDocx(macro, big).hasMacros, true);
  assert.equal(readZipDirectory(macro).length, 3);
});

test("limits: weak devices get lower limits; OOM detection", () => {
  const weak = deviceProfile({ deviceMemory: 2, userAgent: "Mozilla/5.0 (Linux; Android 14) Mobile" });
  assert.equal(weak.weak, true);
  assert.ok(limitsFor(weak).maxFileBytes < big.maxFileBytes);
  assert.equal(deviceProfile({ deviceMemory: 8, userAgent: "Mozilla/5.0 (X11; Linux x86_64)" }).weak, false);
  assert.equal(isOutOfMemory(new RangeError("Array buffer allocation failed")), true);
  assert.equal(isOutOfMemory(new Error("x")), false);
});

test("fonts: metric-compatible aliases and class fallbacks", () => {
  assert.equal(bundledFor("Calibri"), "Carlito");
  assert.equal(bundledFor("Cambria"), "Caladea");
  assert.equal(bundledFor("Times New Roman"), "Liberation Serif");
  assert.equal(bundledFor("Courier New"), "Liberation Mono");
  assert.equal(bundledFor("Georgia"), "Caladea");
  assert.equal(bundledFor("Consolas"), "Liberation Mono");
  assert.equal(bundledFor("Open Sans"), "Carlito");
});

test("fonts: needs from corpus DOCX, files from manifest, warnings", () => {
  const needs = fontNeeds(new Uint8Array(readFileSync(path.join(corpus, "docx/diakritika-fonty.docx"))));
  for (const f of ["Calibri", "Cambria", "Arial", "Times New Roman", "Courier New"]) assert.ok(needs.families.includes(f), f);
  assert.equal(needs.bold, true); assert.equal(needs.italic, true);
  const manifest = JSON.parse(readFileSync(path.join(here, "../../../public/tools/assets/js/lib/converter/fonts/manifest.json"), "utf8"));
  const files = filesFor(needs, manifest);
  assert.ok(files.some((f) => f.file === "Carlito-BoldItalic.woff2"));
  assert.ok(files.every((f) => manifest.families[f.family]));
  const w = substitutionWarnings([{ family: "Calibri", bold: false, italic: false, face: "Carlito", style: "Regular", substituted: true, synthBold: false, synthItalic: false }, { family: "Noto Serif", bold: false, italic: false, face: "Noto Serif", style: "Regular", substituted: true, synthBold: false, synthItalic: false }], ["Noto Serif"]);
  assert.deepEqual(w, [{ requested: "Calibri", used: "Carlito", metricCompatible: true }]);
});

test("pdf fonts: subset prefix, CamelCase family, style flags, Word mapping", () => {
  const f = parseFontName("ABCDEF+LiberationSans-BoldItalic");
  assert.equal(f.family, "Liberation Sans"); assert.equal(f.bold, true); assert.equal(f.italic, true);
  assert.equal(parseFontName("TimesNewRomanPSMT").family, "Times New Roman");
  assert.equal(mapFont({ id: "x", ...f }).family, "Arial");
  assert.equal(mapFont({ id: "c", ...parseFontName("AAAAAA+Carlito") }).family, "Calibri");
  const rep = fontReport([{ id: "r", ...parseFontName("XYZABC+Roboto-Regular") }]);
  assert.equal(rep[0].note, "uncommon");
});

test("png: encoder round-trips through a decoder", () => {
  const w = 37, h = 11, px = new Uint8Array(w * h * 4);
  for (let i = 0; i < px.length; i++) px[i] = (i * 31) & 255;
  const back = PNG.sync.read(Buffer.from(encodePng(px, w, h, 4)));
  assert.equal(back.width, w); assert.deepEqual(new Uint8Array(back.data), px);
});

test("vector QR from the invoice rasterises to a decodable PNG", async () => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { extractPage } = await import("../../../src/lib/converter/pdf/extract.ts");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path.join(corpus, "faktura-2026001.pdf"))), fontExtraProperties: true }).promise;
  const m = await extractPage(pdfjs, await doc.getPage(1), 0);
  const { clusters } = vectorClusters(m.paths);
  assert.equal(clusters.length, 1);
  const r = rasterizeRects(clusters[0].rects, clusters[0]);
  const png = PNG.sync.read(Buffer.from(r.png));
  // Tichá zóna kolem kódu (v DOCX ji dává okraj stránky / buňky).
  const pad = 40, W = png.width + pad * 2, H = png.height + pad * 2, rgba = new Uint8ClampedArray(W * H * 4).fill(255);
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) for (let k = 0; k < 4; k++) rgba[((y + pad) * W + x + pad) * 4 + k] = png.data[(y * png.width + x) * 4 + k];
  const qr = jsQR(rgba, W, H);
  assert.ok(qr, "QR decodes");
  assert.match(qr.data, /AM:19800\.00/);
  // Text a tabulka faktury: řádky a linky.
  const lines = buildLines(m.glyphs);
  assert.ok(lines.some((l) => l.segs.length === 4 && l.segs.map((s) => s.glyphs.map((g) => g.ch).join("")).join("|").replace(/[\s\u00a0\u202f]/g, " ") === "Webová stránka|1|15 000,00 Kč|15 000,00 Kč"));
  assert.ok(rulesAndFills(m.paths).rules.filter((r) => r.horiz).length >= 3);
});

test("docx writer: minimal model → valid package with styles, numbering and table", () => {
  const run = { text: "Ahoj světe", font: "Arial", bold: false, italic: false, size: 11, color: "000000", rise: 0 };
  const docx = writeDocx({
    pages: [{ width: 595, height: 842, margins: { top: 72, bottom: 72, left: 72, right: 72 }, blocks: [
      { kind: "para", runs: [{ ...run, text: "Nadpis", size: 20, bold: true }], align: "left", indLeft: 0, indRight: 0, indFirst: 0, before: 0, after: 0, line: null, top: 72, bottom: 92, heading: 1, firstBase: 90, lastBase: 90 },
      { kind: "table", x: 72, colWidths: [200, 251], rows: [{ cells: [{ blocks: [{ kind: "para", runs: [run], align: "left", indLeft: 0, indRight: 0, indFirst: 0, before: 0, after: 0, line: null, top: 100, bottom: 112 }], span: 1, borders: { bottom: { color: "999999", sz: 4 } }, valign: "top" }, { blocks: [], span: 1, borders: {}, valign: "top" }], height: 14, top: 100 }], top: 100, bottom: 114, layout: false },
    ] }],
    body: { font: "Arial", size: 11, color: "000000" }, headings: [{ font: "Arial", size: 20, bold: true, color: "000000" }],
  });
  const files = unzipSync(docx);
  for (const p of ["word/document.xml", "word/styles.xml", "word/numbering.xml", "[Content_Types].xml", "_rels/.rels"]) assert.ok(files[p], p);
  const doc = strFromU8(files["word/document.xml"]);
  assert.match(doc, /<w:pStyle w:val="Heading1"\/>/);
  assert.match(doc, /<w:gridCol w:w="4000"\/><w:gridCol w:w="5020"\/>/);
  assert.match(doc, /w:color="999999"/);
  // Běh shodný se stylem Normální nenese přímé formátování.
  assert.match(doc, /<w:r><w:t xml:space="preserve">Ahoj světe<\/w:t><\/w:r>/);
  // Žádné řídicí znaky ani neescapované entity.
  assert.doesNotMatch(doc, /[\u0000-\u0008]/);
});

test("ocr: multi-column scan detection", async () => {
  const { isMultiColumn } = await import("../../../src/lib/converter/pdf/ocr.ts");
  const g = (x, base) => ({ ch: "a", x, y: base - 8, w: 5, h: 11, base, size: 11, font: "ocr", color: [0, 0, 0], space: false, angle: 0, visible: true });
  const two = [], one = [];
  for (let line = 0; line < 40; line++) for (let k = 0; k < 40; k++) {
    two.push(g(70 + k * 5, 100 + line * 14), g(310 + k * 5, 100 + line * 14));
    one.push(g(70 + k * 11, 100 + line * 14));
  }
  assert.equal(isMultiColumn(two, 595), true);
  assert.equal(isMultiColumn(one, 595), false);
});

// Sken ve dvou sloupcích, jak ho vrací tesseract.js (PSM 6): jeden řádek OCR přes oba sloupce,
// společná účaří, sazba Caladea 11 pt a tečka šumu u okraje stránky.
async function twoColumnScanWords(family = "Caladea", size = 11) {
  const { CHARS, WIDTHS } = await import("../../../src/lib/converter/pdf/ocr-widths.ts");
  const em = (t) => [...t].reduce((s, c) => s + WIDTHS[family][CHARS.indexOf(c)], 0) / 1000;
  const text = ["Příliš", "žluťoučký", "kůň", "úpěl", "ďábelské", "ódy", "nikam"];
  const lineW = text.reduce((s, t) => s + em(t) * size, 0) + (text.length - 1) * 3;
  const words = [];
  for (let line = 0; line < 30; line++) {
    const base = 100 + line * 14;
    for (const col of [70, 70 + lineW + 24]) {
      let x = col;
      for (const t of text) { const w = em(t) * size; words.push({ text: t, x0: x, y0: base - 8, x1: x + w, y1: base + 2.3, confidence: 0.95, base, rowHeight: 14, slope: 0, line }); x += w + 3; }
    }
  }
  words.push({ text: "i", x0: 585, y0: 300, x1: 586, y1: 301, confidence: 0.4, base: 301, rowHeight: 14, slope: 0, line: 99 });
  return words;
}

test("ocr: font family and size fitted from word widths", async () => {
  const { fitOcrFont } = await import("../../../src/lib/converter/pdf/ocr.ts");
  for (const family of ["Caladea", "Liberation Sans", "Liberation Serif"]) {
    const words = (await twoColumnScanWords(family, 11)).map((w) => ({ text: w.text, width: w.x1 - w.x0, confidence: w.confidence }));
    const fit = fitOcrFont(words);
    assert.equal(fit.family, family);
    assert.ok(Math.abs(fit.size - 11) < 0.05, `size ${fit.size}`);
  }
});

test("ocr: two-column scan with shared baselines → section columns in reading order", async () => {
  const { ocrGlyphs, OCR_FONTS } = await import("../../../src/lib/converter/pdf/ocr.ts");
  const { layoutPage, readingOrder } = await import("../../../src/lib/converter/pdf/layout.ts");
  const glyphs = ocrGlyphs(await twoColumnScanWords(), { x: 0, y: 0 }, 1, 1);
  assert.ok(glyphs.every((g) => g.font === "ocr:Caladea" && g.size === 11), "font fitted, speck dropped");
  assert.ok(!glyphs.some((g) => g.x > 580), "speck dropped");
  const lines = buildLines(glyphs);
  const blocks = layoutPage({ width: 595, height: 842, paths: [] }, lines, { left: 60, right: 60 }, OCR_FONTS, { bodySize: 11, headingSizes: [], fontMap: mapFont, links: [] }, []);
  assert.deepEqual(blocks.map((b) => b.kind), ["columns"]);
  const order = readingOrder(lines, 11);
  const split = order.findIndex((s) => s.x0 > 200);
  assert.ok(split > 0 && order.slice(split).every((s) => s.x0 > 200), "left column first, then right");
});

test("docx writer: columns inside a table cell become a borderless table", () => {
  const para = (text, top) => ({ kind: "para", runs: [{ text, font: "Caladea", bold: false, italic: false, size: 11, color: "000000", rise: 0 }], align: "left", indLeft: 0, indFirst: 0, before: 0, top, bottom: top + 12 });
  const columns = { kind: "columns", x: 70, widths: [200, 200], gap: 24, cols: [[para("Levý sloupec", 100)], [para("Pravý sloupec", 100)]], top: 100, bottom: 112 };
  const cell = (blocks) => ({ blocks, span: 1, borders: {}, valign: "top" });
  const table = { kind: "table", x: 70, colWidths: [430, 30], rows: [{ cells: [cell([columns]), cell([para("i", 100)])], height: 12, top: 100 }], top: 100, bottom: 112, layout: true };
  const docx = writeDocx({ pages: [{ width: 595, height: 842, margins: { top: 72, bottom: 72, left: 70, right: 70 }, blocks: [table] }], body: { font: "Caladea", size: 11 }, headings: [] });
  const doc = strFromU8(unzipSync(docx)["word/document.xml"]);
  assert.match(doc, /Levý sloupec/);
  assert.match(doc, /Pravý sloupec/);
  assert.equal((doc.match(/<w:tbl>/g) ?? []).length, 2);
});

test("layout: word in the page margin on a text line does not turn two text columns into a table", async () => {
  const { ocrGlyphs, OCR_FONTS } = await import("../../../src/lib/converter/pdf/ocr.ts");
  const { layoutPage } = await import("../../../src/lib/converter/pdf/layout.ts");
  const words = (await twoColumnScanWords()).map((w) => (w.text === "i" ? { ...w, y0: 288, y1: 298.3, base: 296, line: 14, confidence: 0.9 } : w));
  const lines = buildLines(ocrGlyphs(words, { x: 0, y: 0 }, 1, 1));
  const blocks = layoutPage({ width: 595, height: 842, paths: [] }, lines, { left: 60, right: 60 }, OCR_FONTS, { bodySize: 11, headingSizes: [], fontMap: mapFont, links: [] }, []);
  const all = (bs) => bs.flatMap((b) => [b, ...(b.kind === "table" ? b.rows.flatMap((r) => r.cells.flatMap((c) => all(c.blocks))) : b.kind === "columns" ? all(b.cols.flat()) : [])]);
  assert.ok(!all(blocks).some((b) => b.kind === "table" && !b.layout), "no data table");
  assert.ok(all(blocks).some((b) => b.kind === "columns"), "text columns kept");
});
