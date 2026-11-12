import { clientIp } from "@/lib/account-auth";
import { toolsRateLimit } from "@/lib/tools-rate-limit";
import { RenderError, renderHtmlToPdf, validateOptions, type HtmlPdfOptions } from "@/lib/tools/html-pdf-render";
import "server-only";

// POST /api/tools/html-to-pdf — vysoce věrný převod HTML na PDF přes headless Chromium (Playwright).
// Vstup JSON (viz HtmlPdfOptions), výstup application/pdf. Chyby: { error: { code, message } }.
// Pokud na serveru Chromium není (503 „unavailable“), UI přepne na lokální vykreslení v prohlížeči.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 2_600_000;
const RATE_WINDOW_SECONDS = 600;
const RATE_MAX = 20;

function json(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Jen volání z vlastních stránek (ne z cizích webů). */
function sameOrigin(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json(403, "forbidden", "Požadavek musí přijít z webu VeVit.");
  // Sdílený atomický limit v databázi (paměť jedné instance by šla obejít zásahem jiné instance).
  const rate = await toolsRateLimit(clientIp(request), "html-to-pdf", RATE_WINDOW_SECONDS, RATE_MAX);
  if (!rate.available) return json(503, "unavailable", "Převod je dočasně nedostupný.");
  if (!rate.allowed) return json(429, "rate_limited", "Příliš mnoho převodů, zkuste to za několik minut.");
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return json(413, "too_large", "HTML je příliš velké.");

  let options: HtmlPdfOptions;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json(413, "too_large", "HTML je příliš velké.");
    options = validateOptions(JSON.parse(text) as Partial<HtmlPdfOptions>);
  } catch (e) {
    if (e instanceof RenderError) return json(e.status, e.code, e.message);
    return json(400, "invalid", "Neplatný požadavek.");
  }

  try {
    const pdf = await renderHtmlToPdf(options);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="html.pdf"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    if (e instanceof RenderError) return json(e.status, e.code, e.message);
    console.error("[tools:html-to-pdf] unexpected failure", e instanceof Error ? e.name : "unknown");
    return json(500, "failed", "Převod se nepodařil.");
  }
}
