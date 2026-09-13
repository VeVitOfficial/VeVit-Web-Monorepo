import { clientIp } from "@/lib/account-auth";
import { aiSystemPrompt, aiToolKnown } from "@/lib/tools-ai-prompts";
import { toolsRateLimit } from "@/lib/tools-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sjednocený AI endpoint (Fáze 1, bod 3 zadání) — nahrazuje ollama.php a
// nekryté ollama (bez přípony), na které dřív propadalo 7 z 12 AI nástrojů do
// catch-allu /tools/api/[...path] a dostávaly tichou 200 od Supabase Edge
// Function místo skutečné odpovědi. `tool` teď určuje URL segment, ne tělo.
//
// Proxy dál forwarduje prompt na Ollama (`OLLAMA_URL`, default
// localhost:11434). Localhost není z Vercelu dosažitelný, takže bez
// samostatně hostované Ollamy (nebo náhrady z Fáze 3) endpoint čestně selže
// na 502 — už bez zmínky o WEDOSu, který od září 2026 neplatí.
//
// Hardening: server-side system prompty (nikdy z klienta), klient nesmí
// zvolit model, limit délky promptu, pravidla pro obrázky jen u vision
// nástroje, IP rate limiting (fail closed).

const AI_MAX_PROMPT_CHARS = 20000; // max. délka uživatelského vstupu (bajty)
const AI_RATE_WINDOW = 60; // délka časového okna (sekundy)
const AI_RATE_MAX = 30; // max. požadavků na IP v okně
const AI_MAX_IMAGES = 4; // max. počet obrázků na požadavek (vision)
const AI_MAX_IMAGE_BYTES = 8 * 1024 * 1024; // max. 8 MB na obrázek (base64)
const OLLAMA_TIMEOUT_MS = 60_000;

function fail(code: number, message: string): Response {
  return Response.json({ message }, {
    status: code,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function ollamaUrl(): string {
  return process.env.OLLAMA_URL?.trim() || "http://localhost:11434";
}

function ollamaModel(): string {
  return process.env.OLLAMA_MODEL?.trim() || "llama3.2";
}

type Context = { params: Promise<{ tool: string }> };

async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== "POST") return fail(405, "Pouze POST.");

  const tool = decodeURIComponent((await context.params).tool || "").trim();
  if (tool !== "" && tool !== "ai-chat" && !aiToolKnown(tool)) {
    return fail(404, "Neznámý nástroj.");
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "Neplatný JSON v těle požadavku.");
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return fail(400, "Neplatný JSON v těle požadavku.");
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if ("model" in body) return fail(400, "Model vybírá server; klient jej nemůže měnit.");
  const stream = body.stream === undefined ? true : Boolean(body.stream);

  // Volitelné obrázky (vision nástroje). Base64 bez data URL prefixu.
  const images: string[] = [];
  if (Array.isArray(body.images)) {
    // Jen vision nástroj smí posílat obrázky (jinak by se daly obcházet limity promptu).
    if (tool !== "ai-vision") return fail(400, "Tento nástroj obrázky nepřijímá.");
    if (body.images.length > AI_MAX_IMAGES) {
      return fail(413, `Příliš mnoho obrázků (max. ${AI_MAX_IMAGES}).`);
    }
    for (const img of body.images) {
      if (typeof img !== "string") return fail(400, "Neplatný obrázek.");
      // Odstraň případný data URL prefix, ať klient nemusí.
      const stripped = img.startsWith("data:") ? img.replace(/^data:[^;]+;base64,/, "") : img;
      if (!/^[A-Za-z0-9+/=]+$/.test(stripped)) return fail(400, "Neplatný obrázek (není base64).");
      if (stripped.length > AI_MAX_IMAGE_BYTES) {
        return fail(413, "Obrázek je příliš velký (max. 8 MB).");
      }
      images.push(stripped);
    }
  }

  if (prompt === "" && images.length === 0) return fail(400, "Prázdný prompt.");
  // Délkový limit (počet bajtů — pokrývá i vícebajtové UTF-8).
  if (Buffer.byteLength(prompt) > AI_MAX_PROMPT_CHARS) {
    return fail(413, `Vstup je příliš dlouhý (max. ${AI_MAX_PROMPT_CHARS} znaků).`);
  }

  // AI has a direct operating cost. Storage failure must not remove its guard.
  const rate = await toolsRateLimit(clientIp(request), "ai-ollama", AI_RATE_WINDOW, AI_RATE_MAX);
  if (!rate.available) return fail(503, "AI služba je dočasně nedostupná.");
  if (!rate.allowed) return fail(429, "Příliš mnoho požadavků. Zkuste to za chvíli znovu.");

  const payload: Record<string, unknown> = {
    model: ollamaModel(),
    prompt,
    stream,
  };
  const system = tool !== "" ? aiSystemPrompt(tool) : null;
  if (system !== null) payload.system = system;
  if (images.length > 0) payload.images = images;

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${ollamaUrl().replace(/\/+$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
    });
  } catch {
    return fail(502, "AI služba není dostupná. Endpoint vyžaduje samostatně hostovanou inferenci.");
  }

  const status = upstream.status;
  if (status < 200 || status >= 300) {
    // Consume the body so the connection is released before the error reply.
    try {
      await upstream.arrayBuffer();
    } catch {
      /* upstream already gone */
    }
    const code = status >= 400 && status < 600 ? status : 502;
    return fail(code, "AI služba požadavek nedokončila.");
  }

  if (!upstream.body) return fail(502, "AI služba požadavek nedokončila.");
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Accel-Buffering": "no",
    },
  });
}

export const POST = handler;
export const GET = handler;
export const PUT = handler;
export const DELETE = handler;
