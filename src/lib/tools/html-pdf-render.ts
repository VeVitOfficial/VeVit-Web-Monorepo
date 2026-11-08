import "server-only";

// HTML → PDF přes headless Chromium (Playwright). Věrné vykreslení: CSS (grid, flexbox, gradienty, stíny,
// zaoblení), vlastní fonty, obrázky, SVG a JavaScriptem generovaný obsah; text zůstává vektorový.
//
// Bezpečnost (HTML píše uživatel a běží v něm JavaScript):
//  • každý požadavek stránky na síť vyřizuje tento kód (page.route), ne prohlížeč — povolené jsou jen
//    GET/HEAD na http(s) a adresa se kontroluje v okamžiku připojení (ochrana před SSRF a DNS rebindingem:
//    loopback, privátní sítě, link-local včetně 169.254.169.254, IPv6 ULA);
//  • limity: velikost vstupu, počet a velikost podřízených požadavků, celkový čas, souběžné renderování;
//  • každý požadavek má vlastní izolovaný kontext prohlížeče, nic se neukládá.

import http from "node:http";
import https from "node:https";
import net from "node:net";
import { lookup as dnsLookup } from "node:dns";
import type { Browser, BrowserContext, Page, Route } from "playwright-core";

export const MAX_HTML_CHARS = 2_000_000;
const MAX_SUBREQUESTS = 150;
const MAX_RESOURCE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_BYTES = 60 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const RENDER_TIMEOUT_MS = 45_000;
const MAX_CONCURRENT = 2;
const MAX_QUEUE = 6;

export interface HtmlPdfOptions {
  html: string;
  format: "A5" | "A4" | "A3" | "Letter" | "Legal" | "Tabloid";
  landscape: boolean;
  /** okraje v mm */
  margin: number;
  printBackground: boolean;
  /** „screen“ = vzhled jako v prohlížeči, „print“ = tiskové styly (@media print) */
  media: "screen" | "print";
  /** respektovat @page { size } z CSS */
  preferCssPageSize: boolean;
  /** šířka rozvržení v px (0 = podle stránky); širší rozvržení se zmenší na šířku strany */
  layoutWidth: number;
  /** paged = běžné stránkování, single = jedna dlouhá stránka */
  pageMode: "paged" | "single";
  /** čekání na JavaScript (ms) */
  waitMs: number;
  javascript: boolean;
  pageNumbers: boolean;
}

export class RenderError extends Error {
  constructor(public code: "invalid" | "too_large" | "busy" | "unavailable" | "timeout" | "failed", message: string, public status: number) {
    super(message);
  }
}

// ── SSRF: kontrola adres ───────────────────────────────────────────────────
function ipv4Blocked(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0)) ||
    (a === 198 && (b === 18 || b === 19))
  );
}
export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return ipv4Blocked(ip);
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === "::" || l === "::1") return true;
    const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return ipv4Blocked(mapped[1]);
    return /^f[cd]/.test(l) || /^fe[89ab]/.test(l) || l.startsWith("ff");
  }
  return true;
}

/** `lookup` pro node:http(s) — odmítne adresy z privátních rozsahů (kontrola při samotném připojení). */
const safeLookup: net.LookupFunction = (hostname, options, cb) => {
  dnsLookup(hostname, options, (err, address, family) => {
    if (err) return cb(err, address as never, family as never);
    const list = Array.isArray(address) ? address : [{ address: address as string, family: family as number }];
    const ok = list.filter((a) => !isBlockedIp(a.address));
    if (!ok.length) return cb(Object.assign(new Error("blocked address"), { code: "EBLOCKED" }), "", 4);
    if (Array.isArray(address)) (cb as unknown as (e: null, a: unknown) => void)(null, ok);
    else cb(null, ok[0].address, ok[0].family);
  });
};

interface Fetched { status: number; headers: Record<string, string>; body: Buffer }

function fetchSafe(url: URL, method: string, headers: Record<string, string>, budget: { left: number }, hops = 0): Promise<Fetched> {
  return new Promise((resolve, reject) => {
    if (url.protocol !== "http:" && url.protocol !== "https:") return reject(new Error("protocol"));
    if (url.username || url.password) return reject(new Error("credentials"));
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return reject(new Error("blocked host"));
    if (net.isIP(host) && isBlockedIp(host)) return reject(new Error("blocked address"));
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(url, { method, headers, lookup: safeLookup, timeout: 15_000 }, (res) => {
      const status = res.statusCode ?? 0;
      const loc = res.headers.location;
      if (status >= 300 && status < 400 && loc) {
        res.resume();
        if (hops >= MAX_REDIRECTS) return reject(new Error("redirects"));
        let next: URL;
        try { next = new URL(loc, url); } catch { return reject(new Error("redirect")); }
        return fetchSafe(next, method, headers, budget, hops + 1).then(resolve, reject);
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (c: Buffer) => {
        size += c.length; budget.left -= c.length;
        if (size > MAX_RESOURCE_BYTES || budget.left < 0) { req.destroy(new Error("too large")); return; }
        chunks.push(c);
      });
      res.on("end", () => {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (v == null) continue;
          const key = k.toLowerCase();
          if (["content-encoding", "content-length", "transfer-encoding", "connection", "set-cookie", "content-security-policy", "content-security-policy-report-only"].includes(key)) continue;
          out[key] = Array.isArray(v) ? v.join(", ") : v;
        }
        resolve({ status, headers: out, body: Buffer.concat(chunks) });
      });
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

// ── Prohlížeč a fronta ─────────────────────────────────────────────────────
let browserPromise: Promise<Browser> | null = null;
async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    if (b?.isConnected()) return b;
    browserPromise = null;
  }
  browserPromise = (async () => {
    const { chromium } = await import("playwright-core");
    const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH?.trim() || undefined;
    const args = ["--disable-dev-shm-usage", "--disable-extensions", "--disable-gpu", "--no-first-run"];
    if (process.env.CHROMIUM_NO_SANDBOX === "1") args.push("--no-sandbox");
    return chromium.launch({ headless: true, executablePath, args });
  })();
  try {
    return await browserPromise;
  } catch (e) {
    browserPromise = null;
    throw new RenderError("unavailable", `Chromium není na serveru dostupný (${(e as Error).message.split("\n")[0]}).`, 503);
  }
}

let running = 0;
const waiters: (() => void)[] = [];
async function acquire(): Promise<void> {
  if (running < MAX_CONCURRENT) { running++; return; }
  if (waiters.length >= MAX_QUEUE) throw new RenderError("busy", "Server je teď vytížený, zkuste to za chvíli.", 503);
  await new Promise<void>((res) => waiters.push(res));
}
function release(): void {
  const next = waiters.shift();
  if (next) next(); else running--;
}

const PX_PER_MM = 96 / 25.4;
const PAGE_MM: Record<HtmlPdfOptions["format"], [number, number]> = {
  A5: [148, 210], A4: [210, 297], A3: [297, 420], Letter: [215.9, 279.4], Legal: [215.9, 355.6], Tabloid: [279.4, 431.8],
};

export function validateOptions(raw: Partial<HtmlPdfOptions>): HtmlPdfOptions {
  const html = typeof raw.html === "string" ? raw.html : "";
  if (!html.trim()) throw new RenderError("invalid", "Zadejte HTML obsah.", 400);
  if (html.length > MAX_HTML_CHARS) throw new RenderError("too_large", `HTML je příliš dlouhé (max ${MAX_HTML_CHARS.toLocaleString("cs")} znaků).`, 413);
  const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const format = (["A5", "A4", "A3", "Letter", "Legal", "Tabloid"] as const).includes(raw.format as never) ? raw.format! : "A4";
  return {
    html, format,
    landscape: raw.landscape === true,
    margin: num(raw.margin, 0, 40, 10),
    printBackground: raw.printBackground !== false,
    media: raw.media === "print" ? "print" : "screen",
    preferCssPageSize: raw.preferCssPageSize !== false,
    layoutWidth: Math.round(num(raw.layoutWidth, 0, 3000, 0)),
    pageMode: raw.pageMode === "single" ? "single" : "paged",
    waitMs: Math.round(num(raw.waitMs, 0, 8000, 600)),
    javascript: raw.javascript !== false,
    pageNumbers: raw.pageNumbers === true,
  };
}

async function guard(context: BrowserContext, page: Page) {
  const budget = { left: MAX_TOTAL_BYTES };
  let count = 0;
  await context.route("**/*", async (route: Route) => {
    const req = route.request();
    const u = req.url();
    if (u.startsWith("data:") || u.startsWith("blob:") || u === "about:blank") return route.continue();
    if (++count > MAX_SUBREQUESTS) return route.abort("blockedbyclient");
    const method = req.method();
    if (method !== "GET" && method !== "HEAD") return route.abort("blockedbyclient");
    try {
      const url = new URL(u);
      const h = req.headers();
      const fwd: Record<string, string> = {};
      for (const k of ["accept", "accept-language", "user-agent", "referer", "range"]) if (h[k]) fwd[k] = h[k];
      const r = await fetchSafe(url, method, fwd, budget);
      await route.fulfill({ status: r.status, headers: r.headers, body: r.body });
    } catch {
      await route.abort("blockedbyclient").catch(() => { /* požadavek už mohl skončit */ });
    }
  });
  page.on("popup", (p) => { void p.close(); });
  page.on("dialog", (d) => { void d.dismiss(); });
}

export async function renderHtmlToPdf(options: HtmlPdfOptions): Promise<Buffer> {
  await acquire();
  const started = Date.now();
  let context: BrowserContext | null = null;
  try {
    const browser = await getBrowser();
    const [pw, ph] = PAGE_MM[options.format];
    const wMm = options.landscape ? ph : pw;
    const hMm = options.landscape ? pw : ph;
    const innerPx = Math.max(100, (wMm - 2 * options.margin) * PX_PER_MM);
    const layoutW = options.layoutWidth > 0 ? options.layoutWidth : Math.round(innerPx);

    context = await browser.newContext({
      viewport: { width: layoutW, height: 900 },
      javaScriptEnabled: options.javascript,
      serviceWorkers: "block",
      acceptDownloads: false,
      permissions: [],
      locale: "cs-CZ",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    await guard(context, page);
    await page.emulateMedia({ media: options.media });
    await page.setContent(options.html, { waitUntil: "load", timeout: 25_000 });
    // fonty a (případně) JavaScriptem vykreslený obsah
    await page.evaluate(() => (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready).catch(() => undefined);
    if (options.waitMs > 0 && Date.now() - started < RENDER_TIMEOUT_MS) await page.waitForTimeout(options.waitMs);

    const common = {
      printBackground: options.printBackground,
      preferCSSPageSize: options.preferCssPageSize,
      displayHeaderFooter: options.pageNumbers && options.pageMode === "paged",
      headerTemplate: "<span></span>",
      footerTemplate: '<div style="width:100%;font-size:9px;color:#666;text-align:center;font-family:Arial,sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    };
    let pdf: Uint8Array;
    if (options.pageMode === "single") {
      const height = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0));
      const h = Math.min(Math.max(Math.ceil(height) + 2, 100), 14_000);
      pdf = await page.pdf({ ...common, width: `${layoutW}px`, height: `${h}px`, margin: { top: "0", right: "0", bottom: "0", left: "0" }, pageRanges: "1" });
    } else {
      // širší rozvržení se zmenší tak, aby se vešlo na šířku strany
      const scale = Math.min(2, Math.max(0.1, innerPx / layoutW));
      pdf = await page.pdf({
        ...common,
        width: `${wMm}mm`, height: `${hMm}mm`,
        scale: options.layoutWidth > 0 ? scale : 1,
        margin: { top: `${options.margin}mm`, right: `${options.margin}mm`, bottom: `${options.margin + (options.pageNumbers ? 6 : 0)}mm`, left: `${options.margin}mm` },
      });
    }
    return Buffer.from(pdf);
  } catch (e) {
    if (e instanceof RenderError) throw e;
    const msg = (e as Error).message || "";
    if (/timeout/i.test(msg)) throw new RenderError("timeout", "Vykreslení trvalo příliš dlouho (limit 45 s). Zjednodušte stránku nebo zkraťte čekání.", 504);
    throw new RenderError("failed", "Vykreslení se nepodařilo: " + msg.split("\n")[0], 500);
  } finally {
    await context?.close().catch(() => undefined);
    release();
  }
}
