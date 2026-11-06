// Dev/benchmark tool: run the PDF → DOCX pipeline (src/lib/converter/pdf/convert.ts) in Node over
// the PDF corpus, render the DOCX with LibreOffice and print metrics. The browser e2e spec is the
// source of truth; this is for fast iteration on the layout code.
//   node tests/converter/tools/pdf2docx-node.ts [editable|exact] [doc…]
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { pdfToDocx, type RawImage } from "../../../src/lib/converter/pdf/convert.ts";
// @ts-expect-error plain ESM helper
import { comparePdfs, pdfText, textSimilarity, decodeQr } from "../lib/metrics.mjs";
// @ts-expect-error plain ESM helper
import { renderDocx, docxTables, docxStructure } from "../lib/docx-metrics.mjs";

const root = path.resolve(import.meta.dirname, "..");
const mode = (process.argv[2] ?? "editable") as "editable" | "exact";
const only = process.argv.slice(3);
const out = path.join(root, "out", "node", mode);
mkdirSync(out, { recursive: true });
const docs = readdirSync(path.join(root, "corpus/pdf")).filter((f) => f.endsWith(".pdf")).map((f) => f.slice(0, -4)).filter((n) => !only.length || only.includes(n));

async function imagePixels(page: pdfjs.PDFPageProxy, id: string): Promise<RawImage | null> {
  const obj = await new Promise<{ data?: Uint8ClampedArray; width: number; height: number; kind?: number } | null>((res) => {
    try { page.objs.get(id, (o: never) => res(o)); } catch { res(null); }
  });
  if (!obj?.data) return null;
  const px = obj.width * obj.height;
  const channels = obj.data.length === px ? 1 : obj.data.length === px * 3 ? 3 : 4;
  return { data: obj.data, width: obj.width, height: obj.height, channels };
}

for (const name of docs) {
  const input = path.join(root, "corpus/pdf", `${name}.pdf`);
  const t0 = performance.now();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(input)), isEvalSupported: false, fontExtraProperties: true, standardFontDataUrl: path.join(root, "../../node_modules/pdfjs-dist/standard_fonts/") }).promise;
  const { docx, report } = await pdfToDocx(pdfjs as never, doc, mode, { imagePixels });
  const ms = performance.now() - t0;
  const docxPath = path.join(out, `${name}.docx`);
  writeFileSync(docxPath, docx);
  const rendered = renderDocx(docxPath, path.join(out, `${name}.render.pdf`), path.join(root, "fonts/render-docx.conf"));
  mkdirSync(path.join(out, "diff"), { recursive: true });
  const cmp = comparePdfs(input, rendered, { diffDir: path.join(out, "diff"), name });
  const refText = pdfText(name === "sken" ? path.join(root, "corpus/ref-lo/dva-sloupce.pdf") : input);
  const txt = textSimilarity(refText, pdfText(rendered));
  const tables = docxTables(docxPath).map((t: { rows: string[][]; cols: number; headerRows: number }) => `${t.rows.length}×${t.cols}${t.headerRows ? "h" : ""}`).join(",");
  const st = docxStructure(docxPath);
  const qr = name.startsWith("faktura") ? (await decodeQr(rendered)).length : "";
  console.log(`${name.padEnd(22)} ${String(Math.round(ms)).padStart(5)}ms pages ${cmp.pagesRef}/${cmp.pagesOut} ssim ${cmp.ssim.toFixed(3)} soft ${cmp.ssimSoft.toFixed(3)} text ${txt.similarity.toFixed(3)} miss ${txt.missingChars} extra ${txt.extraChars} tables [${tables}] h${st.headings} frames ${st.frames + st.textBoxes} qr ${qr} fonts ${report.fonts.map((f) => f.source + "→" + f.used).join(",")}`);
}
