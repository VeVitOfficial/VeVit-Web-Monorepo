// Dev tool: run the browser extraction (src/lib/converter/pdf/extract.ts) in Node on a PDF and
// print a summary or dump JSON fixtures for the layout unit tests.
//   node tests/converter/tools/extract-dump.ts <file.pdf> [out.json]
import { readFileSync, writeFileSync } from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractPage } from "../../../src/lib/converter/pdf/extract.ts";

const [file, out] = process.argv.slice(2);
const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(file)), isEvalSupported: false, useSystemFonts: false, standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/" }).promise;
const pages = [];
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const m = await extractPage(pdfjs as never, page, i - 1);
  pages.push({ ...m, images: m.images.map((im) => ({ ...im, png: undefined })) });
  const text = m.glyphs.map((g) => g.ch).join("");
  console.log(`page ${i}: ${m.width.toFixed(1)}×${m.height.toFixed(1)} glyphs=${m.glyphs.length} paths=${m.paths.length} (rects ${m.paths.filter((p) => p.rect).length}) images=${m.images.length} links=${m.links.length} scanned=${m.scanned}`);
  console.log("  fonts:", Object.values(m.fonts).map((f) => `${f.family}${f.bold ? " B" : ""}${f.italic ? " I" : ""}`).join(", "));
  console.log("  text:", text.slice(0, 160).replace(/\s+/g, " "));
  const colors = new Set(m.glyphs.map((g) => g.color.join(","))); console.log("  colors:", [...colors].join(" | "));
}
if (out) writeFileSync(out, JSON.stringify(pages));
