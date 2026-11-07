// Browser test of the ocr-pdf tool on a scanned two-column page (Czech). Needs a running app:
//   OCR_E2E_BASE_URL=http://localhost:3000 node --test tests/e2e/ocr-pdf.e2e.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const base = process.env.OCR_E2E_BASE_URL;
const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/ocr/sken-dva-sloupce.pdf");

test("ocr-pdf recognises Czech text from a scanned PDF", { skip: !base && "set OCR_E2E_BASE_URL", timeout: 240_000 }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const failed = [];
    page.on("response", (r) => { if (r.url().includes("/tesseract/") && r.status() >= 300) failed.push(`${r.status()} ${r.url()}`); });
    await page.goto(`${base}/cs/tools/ocr-pdf`);
    await page.locator("#tool-root").waitFor();
    await page.waitForLoadState("networkidle");
    await page.locator('#tool-root input[type="file"]').setInputFiles(fixture);
    await page.locator("#oc-run").click();
    await page.locator("#oc-out").waitFor({ timeout: 200_000 });
    await page.waitForFunction(() => /Převodník/.test(document.querySelector("#oc-out")?.value ?? ""), null, { timeout: 200_000 });
    const text = await page.locator("#oc-out").inputValue();
    assert.match(text, /Převodník běží/);
    assert.match(text, /žluťoučký/);
    assert.deepEqual(failed, [], "no redirect or error for tesseract files");
  } finally {
    await browser.close();
  }
});
