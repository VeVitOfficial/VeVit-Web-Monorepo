#!/usr/bin/env node
// Markdown summary of the converter e2e results (tests/converter/out/<label>/*.jsonl).
//   node tests/converter/tools/summary.mjs [label]
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "../out");
const labels = process.argv[2] ? [process.argv[2]] : existsSync(out) ? readdirSync(out).filter((d) => existsSync(path.join(out, d, "docx-pdf.jsonl")) || existsSync(path.join(out, d, "pdf-docx.jsonl"))) : [];
const read = (f) => (existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const f3 = (v) => (typeof v === "number" ? v.toFixed(3) : "");
// Poslední záznam pro (prohlížeč, dokument, režim) — opakované běhy přepisují starší.
const latest = (rows) => [...new Map(rows.map((r) => [`${r.browser}|${r.doc}|${r.mode ?? ""}`, r])).values()];

for (const label of labels) {
  const dp = latest(read(path.join(out, label, "docx-pdf.jsonl")));
  if (dp.length) {
    console.log(`\n### DOCX → PDF (${label}, reference: LibreOffice desktop)\n`);
    console.log("| prohlížeč | dokument | stran ref/výst | SSIM | SSIM tolerantní | text | chybí | navíc | ms | QR | soukromí |");
    console.log("|---|---|---|---|---|---|---|---|---|---|---|");
    for (const r of dp.sort((a, b) => a.browser.localeCompare(b.browser) || a.doc.localeCompare(b.doc))) {
      console.log(`| ${r.browser} | ${r.doc} | ${r.pagesRef}/${r.pagesOut} | ${f3(r.ssim)} | ${f3(r.ssimSoft)} | ${f3(r.text)} | ${r.missingChars} | ${r.extraChars} | ${r.ms} | ${r.qr ? (r.qr.length ? "ano" : "ne") : ""} | ${r.privacyViolations ? "PORUŠENO" : "ok"} |`);
    }
  }
  const pd = latest(read(path.join(out, label, "pdf-docx.jsonl")));
  if (pd.length) {
    console.log(`\n### PDF → DOCX (${label}, DOCX vykreslené LibreOffice vs. původní PDF)\n`);
    console.log("| prohlížeč | režim | dokument | stran | SSIM | SSIM tolerantní | text | chybí | tabulky | textová pole | ms | faktura buňky | QR | soukromí |");
    console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
    for (const r of pd.sort((a, b) => a.browser.localeCompare(b.browser) || (a.mode ?? "").localeCompare(b.mode ?? "") || a.doc.localeCompare(b.doc))) {
      const inv = r.invoice ? (r.invoice.webRow?.filter((c) => c.includes("15 000,00")).length === 2 && r.invoice.spravaRow?.some((c) => c === "4 800,00 Kč") && r.invoice.hasTotal ? "ano" : "ne") : "";
      const tb = (r.tables ?? []).map((t) => `${t.rows}×${t.cols}${t.headerRows ? "h" : ""}`).join(",");
      console.log(`| ${r.browser} | ${r.mode} | ${r.doc} | ${r.pagesRef}/${r.pagesOut} | ${f3(r.ssim)} | ${f3(r.ssimSoft)} | ${f3(r.text)} | ${r.missingChars} | ${tb} | ${(r.structure?.textBoxes ?? 0) + (r.structure?.frames ?? 0)} | ${r.ms} | ${inv} | ${r.qr ? (r.qr.length ? "ano" : "ne") : ""} | ${r.privacyViolations ? "PORUŠENO" : "ok"} |`);
    }
  }
}
