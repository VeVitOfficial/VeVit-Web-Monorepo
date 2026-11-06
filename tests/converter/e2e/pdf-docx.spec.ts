// PDF → DOCX (pdf-to-word) on the PDF corpus. The DOCX is rendered back to PDF with desktop
// LibreOffice (neutral renderer) and compared with the original PDF.
import { test, expect } from "@playwright/test";
import path from "node:path";
import { mkdirSync, readFileSync } from "node:fs";
import { CORPUS, OUT, LABEL, docsFrom, runTool, privacyViolations, record } from "./helpers";
// @ts-expect-error plain ESM helpers without type declarations
import { comparePdfs, pdfText, textSimilarity, decodeQr } from "../lib/metrics.mjs";
// @ts-expect-error plain ESM helpers without type declarations
import { renderDocx, docxTables, docxStructure, hasSoffice } from "../lib/docx-metrics.mjs";

const T = JSON.parse(readFileSync(path.join(__dirname, "../thresholds.json"), "utf8"))["pdf-docx"];
const MODES = (process.env.CONVERTER_MODES ?? "editable").split(",");

for (const mode of MODES) for (const name of docsFrom("pdf", ".pdf")) {
  test(`pdf-to-word [${mode}]: ${name}`, async ({ page, baseURL }, testInfo) => {
    test.skip(!hasSoffice(), "LibreOffice (soffice) is needed to render the DOCX");
    const input = path.join(CORPUS, "pdf", `${name}.pdf`);
    const INPUT = input;
    const run = await runTool(page, testInfo, "pdf-to-word", input, `${name}.${mode}.docx`, {
      setup: async (p) => {
        const radio = p.locator(`[data-testid="mode-${mode}"]`);
        if (await radio.count()) await radio.click();
        const ocr = p.locator('[data-testid="ocr"]');
        if (name === "sken" && (await ocr.count())) await ocr.check();
      },
    });
    const dir = path.join(OUT, LABEL, testInfo.project.name);
    const diffDir = path.join(dir, "diff");
    mkdirSync(diffDir, { recursive: true });
    const rendered = renderDocx(run.outPath, path.join(dir, `${name}.${mode}.render.pdf`), path.join(__dirname, "../fonts/render-docx.conf"));
    const cmp = comparePdfs(input, rendered, { diffDir, name: `${name}.${mode}` });
    // Scans have no text layer: compare against the text of the PDF the scan was made from.
    const refText = pdfText(name === "sken" ? path.join(CORPUS, "ref-lo", "dva-sloupce.pdf") : input);
    const txt = textSimilarity(refText, pdfText(rendered));
    const tables = docxTables(run.outPath);
    const structure = docxStructure(run.outPath);
    const violations = privacyViolations(run.requests, new URL(baseURL!).origin, path.basename(INPUT), readFileSync(INPUT));
    const row: Record<string, unknown> = {
      browser: testInfo.project.name, doc: name, mode, ms: run.ms,
      pagesRef: cmp.pagesRef, pagesOut: cmp.pagesOut, ssim: cmp.ssim, ssimSoft: cmp.ssimSoft, minSsim: cmp.minSsim, diff: cmp.diff,
      text: txt.similarity, missingChars: txt.missingChars, extraChars: txt.extraChars,
      tables: tables.map((t: { rows: string[][]; cols: number; headerRows: number }) => ({ rows: t.rows.length, cols: t.cols, headerRows: t.headerRows })),
      structure: { ...structure, media: undefined }, warnings: run.warnings, privacyViolations: violations.length,
    };
    if (name.startsWith("faktura")) {
      const qr = await decodeQr(rendered);
      row.qr = qr;
      const cells = tables.flatMap((t: { rows: string[][] }) => t.rows);
      const rowWith = (s: string) => cells.find((r: string[]) => r.some((c) => c.includes(s)));
      const web = rowWith("Webová stránka"), sprava = rowWith("Správa obsahu");
      row.invoice = { webRow: web, spravaRow: sprava, hasTotal: cells.some((r: string[]) => r.some((c) => c.includes("19 800,00 Kč"))) };
      record("pdf-docx", row);
      expect.soft(web, "row 'Webová stránka' is a table row").toBeTruthy();
      expect.soft(web?.filter((c: string) => c.includes("15 000,00 Kč")).length, "15 000,00 Kč in price and total cells").toBe(2);
      expect.soft(sprava?.some((c: string) => c === "4 800,00 Kč"), "4 800,00 Kč in its own cell").toBe(true);
      expect.soft(sprava?.some((c: string) => c === "800,00 Kč"), "800,00 Kč in its own cell").toBe(true);
      expect.soft(qr.length, "QR code decodes after round trip").toBeGreaterThan(0);
      if (qr.length) expect.soft(qr[0]).toContain("AM:19800.00");
    } else {
      record("pdf-docx", row);
    }
    testInfo.annotations.push({ type: "metrics", description: JSON.stringify(row) });

    const X = { ...T, ...(T.exceptions?.[`${name}.${mode}`] ?? T.exceptions?.[name] ?? {}) };
    expect(violations, "no request may carry the document or leave the origin").toEqual([]);
    expect.soft(txt.similarity, "text similarity").toBeGreaterThanOrEqual(X.textSimilarity);
    expect.soft(txt.missingChars, "missing characters").toBeLessThanOrEqual(X.missingChars);
    expect.soft(cmp.ssimSoft, "mean tolerant SSIM vs original PDF").toBeGreaterThanOrEqual(X.meanSsimSoft);
    expect.soft(run.ms, "conversion time").toBeLessThanOrEqual(T.maxMs);
  });
}
