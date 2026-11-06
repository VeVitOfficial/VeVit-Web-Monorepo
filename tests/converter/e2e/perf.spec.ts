// Performance (Chromium only, CDP): cold load (empty Cache API) vs. warm second conversion,
// peak memory (measureUserAgentSpecificMemory, includes workers) and a throttled "mobile"
// profile (4× CPU slowdown, ~Fast 3G). Results → out/<label>/perf.jsonl.
import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { CORPUS, record } from "./helpers";

const CASES = [
  { slug: "word-to-pdf", input: path.join(CORPUS, "docx", "faktura.docx") },
  { slug: "word-to-pdf", input: path.join(CORPUS, "docx", "tabulka-vicestrankova.docx") },
  { slug: "pdf-to-word", input: path.join(CORPUS, "pdf", "faktura-2026001.pdf") },
  { slug: "pdf-to-word", input: path.join(CORPUS, "pdf", "tabulka-vicestrankova.pdf") },
];
const PROFILES = [
  { name: "desktop", cpu: 1, net: null },
  { name: "mobile", cpu: 4, net: { downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 } },
];

async function convertOnce(page: Page): Promise<number> {
  const root = page.locator("#tool-root");
  const t0 = Date.now();
  await root.locator('[data-testid="convert"]').click();
  await expect(root.locator('[data-testid="download"]').or(root.locator('[data-testid="error"]'))).toBeVisible({ timeout: 240_000 });
  expect(await root.locator('[data-testid="error"]').count()).toBe(0);
  return Date.now() - t0;
}

async function memoryMb(page: Page): Promise<number | null> {
  return page.evaluate(async () => {
    const p = performance as Performance & { measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }> };
    if (!crossOriginIsolated || !p.measureUserAgentSpecificMemory) return null;
    try { return Math.round((await p.measureUserAgentSpecificMemory()).bytes / 1048576); } catch { return null; }
  });
}

for (const prof of PROFILES) for (const c of CASES) {
  test(`perf ${prof.name}: ${c.slug} ${path.basename(c.input)}`, async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== "chromium", "CDP throttling and memory API are Chromium-only");
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: prof.cpu });
    if (prof.net) { await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, ...prof.net }); }
    await page.goto(`/cs/tools/${c.slug}`, { waitUntil: "domcontentloaded" });
    const root = page.locator("#tool-root");
    await expect(root.locator('[data-converter][data-ready="1"]')).toBeVisible();
    let bytes = 0;
    page.on("response", async (r) => { if (/\/tools\/assets\/js\/lib\//.test(r.url())) bytes += Number(r.headers()["content-length"] ?? 0); });
    await root.locator('input[type="file"]').first().setInputFiles(c.input);
    const cold = await convertOnce(page);
    const mem = await memoryMb(page);
    const coldBytes = bytes;
    // Druhý převod: engine je načtený ve workeru / v Cache API.
    await root.getByRole("button", { name: /Převést jiný|Convert another/ }).click();
    await root.locator('input[type="file"]').first().setInputFiles(c.input);
    bytes = 0;
    const warm = await convertOnce(page);
    const row = { browser: testInfo.project.name, profile: prof.name, tool: c.slug, doc: path.basename(c.input), coldMs: cold, warmMs: warm, coldBytes, warmBytes: bytes, memoryMb: mem };
    record("perf", row);
    testInfo.annotations.push({ type: "metrics", description: JSON.stringify(row) });
  });
}
