// Shared steps for the converter e2e specs: drive a tool page like a user, capture the
// download, record every network request made after the file was chosen.
import { expect, type Page, type Request, type TestInfo } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(__dirname, "..");
export const CORPUS = path.join(ROOT, "corpus");
export const OUT = path.join(ROOT, "out");
export const LABEL = process.env.CONVERTER_LABEL ?? "current";

export function docsFrom(dir: string, ext: string): string[] {
  const only = process.env.CONVERTER_DOCS?.split(",").map((s) => s.trim()).filter(Boolean);
  const all = require("node:fs").readdirSync(path.join(CORPUS, dir)).filter((f: string) => f.endsWith(ext)).map((f: string) => f.slice(0, -ext.length)).sort();
  return only ? all.filter((n: string) => only.includes(n)) : all;
}

export interface CapturedRequest { url: string; method: string; postBytes: number; resourceType: string; body?: string }

export interface RunResult {
  outPath: string;
  ms: number;
  /** Requests made after the file was chosen (privacy check). */
  requests: CapturedRequest[];
  warnings: string[];
}

/** Opens `/cs/tools/<slug>`, uploads `input`, optionally tweaks options, converts and saves the download. */
export async function runTool(page: Page, testInfo: TestInfo, slug: string, input: string, outName: string, opts: { setup?: (p: Page) => Promise<void>; timeout?: number } = {}): Promise<RunResult> {
  await page.goto(`/cs/tools/${slug}`, { waitUntil: "domcontentloaded" });
  const root = page.locator("#tool-root");
  await expect(root).toBeVisible();
  // Nové převodníky hlásí hydrataci (data-ready); u starých nástrojů počkáme na klid sítě.
  if (await root.locator("[data-converter]").count()) await expect(root.locator('[data-converter][data-ready="1"]')).toBeVisible();
  else await page.waitForLoadState("networkidle");
  const requests: CapturedRequest[] = [];
  const onReq = (r: Request) => {
    const body = r.postDataBuffer();
    requests.push({ url: r.url(), method: r.method(), postBytes: body?.length ?? 0, resourceType: r.resourceType(), body: body?.subarray(0, 65536).toString("latin1") });
  };
  page.on("request", onReq);
  await root.locator('input[type="file"]').first().setInputFiles(input);
  await opts.setup?.(page);
  const t0 = Date.now();
  await root.locator('[data-testid="convert"], #wp-run, #pw2-run').first().click();
  const download = root.locator('[data-testid="download"], .result-card button:has-text("Stáhnout")').first();
  const error = root.locator('[data-testid="error"]');
  await expect(download.or(error)).toBeVisible({ timeout: opts.timeout ?? 240_000 });
  if (await error.isVisible()) throw new Error(`tool error: ${await error.innerText()}`);
  const ms = Date.now() - t0;
  const [dl] = await Promise.all([page.waitForEvent("download"), download.click()]);
  page.off("request", onReq);
  const dir = path.join(OUT, LABEL, testInfo.project.name);
  mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, outName);
  await dl.saveAs(outPath);
  const warnings = await root.locator('[data-testid="warning"]').allInnerTexts().catch(() => []);
  return { outPath, ms, requests, warnings };
}

// Site-wide Vercel Web Analytics / Speed Insights (src/app/layout.tsx): page-view beacons,
// loaded on every page. Allowed only as GET of their script or as small beacons that carry
// neither the file name nor file content.
// Vercel Toolbar (vercel.live) se vkládá jen do preview deploymentů — povolen jen jako GET bez těla.
const ANALYTICS = [/^https:\/\/va\.vercel-scripts\.com\//, /\/_vercel\/(insights|speed-insights)\//, /^https:\/\/vercel\.live\//];

/**
 * Privacy rule: after the file is chosen, the page may only GET static files from its own
 * origin (engine, fonts, Next chunks). Any other origin, method or a request body fails —
 * except the site's analytics beacons, which must stay small and free of the file name/content.
 */
export function privacyViolations(requests: CapturedRequest[], origin: string, fileName = "", fileSample?: Buffer): CapturedRequest[] {
  // 64 bytes from inside the file: enough to recognise raw upload of its content.
  const sample = fileSample && fileSample.length > 600 ? fileSample.subarray(512, 576).toString("latin1") : undefined;
  const leaks = (r: CapturedRequest) => !!r.body && ((fileName && r.body.includes(fileName)) || (!!sample && r.body.includes(sample)));
  return requests.filter((r) => {
    if (r.url.startsWith("blob:") || r.url.startsWith("data:")) return false;
    if (ANALYTICS.some((re) => re.test(r.url))) return leaks(r) || r.postBytes > 8192 || (r.method !== "GET" && r.method !== "POST");
    const u = new URL(r.url);
    if (u.origin !== origin) return true;
    if (r.method !== "GET" && r.method !== "HEAD") return true;
    return r.postBytes > 0;
  });
}

/** Appends one result row (JSON lines) for the summary script. */
export function record(kind: "docx-pdf" | "pdf-docx" | "perf", row: Record<string, unknown>) {
  const dir = path.join(OUT, LABEL);
  mkdirSync(dir, { recursive: true });
  appendFileSync(path.join(dir, `${kind}.jsonl`), JSON.stringify({ label: LABEL, at: new Date().toISOString(), ...row }) + "\n");
}

export function readJsonl(file: string): Record<string, unknown>[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

export function saveJson(file: string, data: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
}
