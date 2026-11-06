// Local benchmark: text extraction accuracy of pdf.js 6 (our extract.ts) vs PDFium WASM
// (@hyzyla/pdfium, MIT) on the corpus PDFs made from known DOCX. Ground truth = the text of the
// source DOCX (document.xml + headers/footers). PDFium is not a dependency: pass its package dir.
//   PDFIUM_DIR=/tmp/pdfium/node_modules/@hyzyla/pdfium node tests/converter/tools/bench-extract.ts
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractPage } from "../../../src/lib/converter/pdf/extract.ts";
import { buildLines, lineText } from "../../../src/lib/converter/pdf/layout.ts";
// @ts-expect-error plain ESM helper
import { textSimilarity } from "../lib/metrics.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dir = process.env.PDFIUM_DIR;
const { PDFiumLibrary } = dir ? await import(path.join(dir, "dist/index.esm.js")) : { PDFiumLibrary: null };
const lib = PDFiumLibrary ? await PDFiumLibrary.init({ wasmBinary: readFileSync(path.join(dir!, "dist/pdfium.wasm")) }) : null;

function docxText(file: string): string {
  const f = unzipSync(readFileSync(file));
  const parts = Object.keys(f).filter((k) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(k)).sort();
  return parts.map((k) => strFromU8(f[k]).replace(/<w:tab\/>/g, " ").replace(/<\/w:p>/g, "\n").replace(/<w:instrText[^>]*>[^<]*<\/w:instrText>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')).join("\n");
}

console.log("| dokument | pdf.js: text | chybí | navíc | ms | PDFium: text | chybí | navíc | ms |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const f of readdirSync(path.join(root, "corpus/docx")).filter((x) => x.endsWith(".docx")).sort()) {
  const name = f.replace(".docx", "");
  const pdf = path.join(root, "corpus/pdf", `${name}.pdf`);
  if (!existsSync(pdf)) continue;
  const gt = docxText(path.join(root, "corpus/docx", f));
  const bytes = new Uint8Array(readFileSync(pdf));
  let t = performance.now();
  const doc = await pdfjs.getDocument({ data: bytes.slice(), fontExtraProperties: true }).promise;
  let a = "";
  for (let i = 1; i <= doc.numPages; i++) a += buildLines((await extractPage(pdfjs as never, await doc.getPage(i), i - 1)).glyphs).map(lineText).join("\n") + "\n";
  const ta = performance.now() - t;
  const sa = textSimilarity(gt, a);
  let row = `| ${name} | ${sa.similarity.toFixed(3)} | ${sa.missingChars} | ${sa.extraChars} | ${Math.round(ta)} |`;
  if (lib) {
    t = performance.now();
    const d = await lib.loadDocument(bytes.slice());
    let b = "";
    for (const p of d.pages()) b += p.getText() + "\n";
    d.destroy();
    const tb = performance.now() - t;
    const sb = textSimilarity(gt, b);
    row += ` ${sb.similarity.toFixed(3)} | ${sb.missingChars} | ${sb.extraChars} | ${Math.round(tb)} |`;
  }
  console.log(row);
}
lib?.destroy();
