// DOCX → PDF (word-to-pdf) on the whole corpus, in every browser project.
import { test, expect } from "@playwright/test";
import path from "node:path";
import { mkdirSync, readFileSync } from "node:fs";
import { CORPUS, OUT, LABEL, docsFrom, runTool, privacyViolations, record } from "./helpers";
// @ts-expect-error plain ESM helpers without type declarations
import { comparePdfs, pdfText, textSimilarity, pdfFonts, decodeQr } from "../lib/metrics.mjs";

const T = JSON.parse(readFileSync(path.join(__dirname, "../thresholds.json"), "utf8"))["docx-pdf"];

for (const name of docsFrom("docx", ".docx")) {
  test(`word-to-pdf: ${name}`, async ({ page, baseURL }, testInfo) => {
    const INPUT = path.join(CORPUS, "docx", `${name}.docx`);
    const run = await runTool(page, testInfo, "word-to-pdf", INPUT, `${name}.pdf`);
    const ref = path.join(CORPUS, "ref-lo", `${name}.pdf`);
    const diffDir = path.join(OUT, LABEL, testInfo.project.name, "diff");
    mkdirSync(diffDir, { recursive: true });
    const cmp = comparePdfs(ref, run.outPath, { diffDir, name });
    const txt = textSimilarity(pdfText(ref), pdfText(run.outPath));
    const violations = privacyViolations(run.requests, new URL(baseURL!).origin, path.basename(INPUT), readFileSync(INPUT));
    const qr = name === "faktura" ? await decodeQr(run.outPath) : undefined;
    const row = {
      browser: testInfo.project.name, doc: name, ref: "lo-desktop", ms: run.ms,
      pagesRef: cmp.pagesRef, pagesOut: cmp.pagesOut, ssim: cmp.ssim, ssimSoft: cmp.ssimSoft, minSsim: cmp.minSsim, diff: cmp.diff,
      text: txt.similarity, missingChars: txt.missingChars, extraChars: txt.extraChars,
      fonts: pdfFonts(run.outPath), warnings: run.warnings, qr, privacyViolations: violations.length,
      requests: run.requests.length, worstPage: [...cmp.pages].sort((a: { ssim: number }, b: { ssim: number }) => a.ssim - b.ssim)[0]?.page,
    };
    record("docx-pdf", row);
    testInfo.annotations.push({ type: "metrics", description: JSON.stringify(row) });

    expect(violations, "no request may carry the document or leave the origin").toEqual([]);
    if (T.pagesEqual) expect.soft(cmp.pagesOut, "page count").toBe(cmp.pagesRef);
    expect.soft(txt.similarity, "text similarity").toBeGreaterThanOrEqual(T.textSimilarity);
    expect.soft(txt.missingChars, "missing characters").toBeLessThanOrEqual(T.missingChars);
    expect.soft(txt.extraChars, "extra characters").toBeLessThanOrEqual(T.extraChars);
    const X = { ...T, ...(T.exceptions?.[name] ?? {}) };
    expect.soft(cmp.ssimSoft, "mean tolerant SSIM vs LibreOffice").toBeGreaterThanOrEqual(X.meanSsimSoft);
    expect.soft(run.ms, "conversion time").toBeLessThanOrEqual(T.maxMs);
    if (qr) expect(qr[0]).toContain("SPD*1.0*ACC:CZ6508000000192000145399*AM:19800.00");
  });
}
