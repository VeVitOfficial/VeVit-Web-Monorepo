// Scores a directory of DOCX files produced from the PDF corpus (ours or a benchmark tool):
// LibreOffice render → SSIM / tolerant SSIM / text / tables / QR. Prints a table, writes JSON.
//   node tests/converter/tools/score-docx.ts <dir> [label]
import { readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
// @ts-expect-error plain ESM helper
import { comparePdfs, pdfText, textSimilarity, decodeQr } from "../lib/metrics.mjs";
// @ts-expect-error plain ESM helper
import { renderDocx, docxTables, docxStructure } from "../lib/docx-metrics.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.resolve(process.argv[2]);
const label = process.argv[3] ?? path.basename(dir);
const rows: Record<string, unknown>[] = [];
mkdirSync(path.join(dir, "render"), { recursive: true });
for (const f of readdirSync(dir).filter((f) => f.endsWith(".docx")).sort()) {
  const name = f.replace(/(\.editable|\.exact)?\.docx$/, "");
  const input = path.join(root, "corpus/pdf", `${name}.pdf`);
  if (!existsSync(input)) continue;
  let rendered: string;
  try { rendered = renderDocx(path.join(dir, f), path.join(dir, "render", `${name}.pdf`), path.join(root, "fonts/render-docx.conf")); }
  catch { rows.push({ doc: name, error: "render failed" }); continue; }
  const cmp = comparePdfs(input, rendered);
  const refText = pdfText(name === "sken" ? path.join(root, "corpus/ref-lo/dva-sloupce.pdf") : input);
  const txt = textSimilarity(refText, pdfText(rendered));
  const tables = docxTables(path.join(dir, f));
  const st = docxStructure(path.join(dir, f));
  const qr = name.startsWith("faktura") ? (await decodeQr(rendered)).length > 0 : undefined;
  const cells = tables.flatMap((t: { rows: string[][] }) => t.rows);
  const web = cells.find((r: string[]) => r.some((c) => c.includes("Webová stránka")));
  const invoiceOk = name.startsWith("faktura") ? !!web && web.filter((c: string) => c.includes("15 000,00 Kč")).length === 2 && cells.some((r: string[]) => r.some((c) => c === "4 800,00 Kč")) : undefined;
  rows.push({ doc: name, pagesRef: cmp.pagesRef, pagesOut: cmp.pagesOut, ssim: +cmp.ssim.toFixed(3), ssimSoft: +cmp.ssimSoft.toFixed(3), text: +txt.similarity.toFixed(3), missing: txt.missingChars, extra: txt.extraChars, tables: tables.length, textBoxes: st.textBoxes + st.frames, anchored: st.anchoredDrawings, headings: st.headings, qr, invoiceOk });
}
writeFileSync(path.join(dir, "scores.json"), JSON.stringify({ label, rows }, null, 2));
console.log(`| ${label} | stran | ssim | ssimSoft | text | chybí | navíc | tabulky | text. rámce | QR | faktura OK |`);
for (const r of rows) console.log(`| ${r.doc} | ${r.pagesRef}/${r.pagesOut} | ${r.ssim} | ${r.ssimSoft} | ${r.text} | ${r.missing} | ${r.extra} | ${r.tables} | ${r.textBoxes} | ${r.qr ?? ""} | ${r.invoiceOk ?? ""} |`);
