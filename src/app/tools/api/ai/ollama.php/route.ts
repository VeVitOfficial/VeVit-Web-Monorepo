import { clientIp } from "@/lib/account-auth";
import { aiSystemPrompt, aiToolKnown } from "@/lib/tools-ai-prompts";
import { toolsRateLimit } from "@/lib/tools-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of tools/api/ai/ollama.php — proxy that forwards the prompt to Ollama
// (`OLLAMA_URL`, default localhost:11434) and streams the reply as NDJSON,
// exactly what the client (ai-chat.js) expects.
//
// Localhost Ollama is unreachable from Vercel's serverless runtime, so the
// request fails there and the endpoint answers with the same 502 as a dead
// upstream did on the shared hosting: to actually serve it, OLLAMA_URL must
// point at a separately hosted Ollama (e.g. a tunnel or a VPS).
//
// Hardening kept from PHP: server-side system prompts (never from the client),
// the client may not choose the model, prompt length cap, image rules for the
// vision tool only, and IP rate limiting (fail closed).

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

async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return fail(405, "Pouze POST.");

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
  const tool = typeof body.tool === "string" ? body.tool.trim() : "";

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

  // Známý AI nástroj nebo obecný ai-chat; prázdný tool = obecný chat bez omezení.
  if (tool !== "" && !aiToolKnown(tool) && tool !== "ai-chat") {
    return fail(400, "Neznámý nástroj.");
  }

  // AI has a direct operating cost. Storage failure must not remove its guard.
  const rate = await toolsRateLimit(clientIp(request), "ai-ollama", AI_RATE_WINDOW, AI_RATE_MAX);
  if (!rate.available) return fail(503, "Vývojová AI služba je dočasně nedostupná.");
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
    return fail(
      502,
      "Vývojová AI služba není dostupná. Tento endpoint vyžaduje samostatně provozovanou Ollamu a není určený pro sdílený WEDOS hosting.",
    );
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
    return fail(code, "Vývojová AI služba požadavek nedokončila.");
  }

  if (!upstream.body) return fail(502, "Vývojová AI služba požadavek nedokončila.");
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