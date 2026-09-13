import { Browserbase } from "@browserbasehq/sdk";
import { chromium } from "playwright-core";
import { clientIp } from "@/lib/account-auth";
import { toolsRateLimit } from "@/lib/tools-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Server-side screenshot nástroj (Fáze 1, bod 4 zadání — dodělání, ne jen
// přeznačení). Screenshot libovolné URL se nedá spolehlivě udělat čistě
// klientsky (cross-origin iframe/canvas blokuje CSP frame-ancestors na
// většině webů), proto jde přes Browserbase (Vercel Marketplace integrace,
// web-automation) — vzdálený Chromium přes CDP, žádný headless binary na
// Vercelu. `processing_location` zůstává "vevit_server": server pošle URL
// Browserbase, výsledný snímek pošle zpátky klientovi.

const RATE_WINDOW = 60; // sekund
const RATE_MAX = 10; // požadavků na IP v okně — Browserbase má přímý provozní náklad
const NAV_TIMEOUT_MS = 20_000;

function fail(code: number, message: string): Response {
  return Response.json({ message }, {
    status: code,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function isSafeTargetUrl(raw: string): URL | null {
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host.endsWith(".local")) return null;
  if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(host)) return null;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
  return url;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
  const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim();
  if (!apiKey || !projectId) return fail(503, "Screenshot služba není nakonfigurovaná.");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "Neplatný JSON v těle požadavku.");
  }
  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  if (rawUrl === "") return fail(400, "Chybí URL.");
  const target = isSafeTargetUrl(rawUrl);
  if (!target) return fail(400, "Neplatná nebo nepovolená URL.");

  const fullPage = body.fullPage === true;

  const rate = await toolsRateLimit(clientIp(request), "screenshot", RATE_WINDOW, RATE_MAX);
  if (!rate.available) return fail(503, "Screenshot služba je dočasně nedostupná.");
  if (!rate.allowed) return fail(429, "Příliš mnoho požadavků. Zkuste to za chvíli znovu.");

  const bb = new Browserbase({ apiKey });
  let sessionId: string | null = null;
  try {
    const session = await bb.sessions.create({ projectId });
    sessionId = session.id;
    const browser = await chromium.connectOverCDP(session.connectUrl);
    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
      await page.goto(target.toString(), { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS });
      const png = await page.screenshot({ fullPage, type: "png" });
      return new Response(new Uint8Array(png), {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (e) {
    return fail(502, (e as Error)?.message || "Screenshot se nepodařilo pořídit.");
  } finally {
    if (sessionId) await bb.sessions.update(sessionId, { projectId, status: "REQUEST_RELEASE" }).catch(() => {});
  }
}
