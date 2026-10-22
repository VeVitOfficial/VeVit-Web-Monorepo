import { clientIp } from "@/lib/account-auth";
import { completeLesson } from "@/lib/edu/aifb/ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /edu/api/aifb/complete  { lessonId, prompt }
// Cvičení AIFB s modelem: kontrola osobních údajů, limit na IP, žádné ukládání obsahu, uložená odpověď
// při výpadku nebo bez nastavené služby. Systémový prompt a klíč zůstávají na serveru.

const HEADERS = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } as const;
const MAX_BODY_BYTES = 4096;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  // Jen volání ze stejného webu (ochrana před zneužitím z cizích stránek).
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host && new URL(origin).host !== request.headers.get("host")) {
        return json({ ok: false, error: "forbidden" }, 403);
      }
    } catch {
      return json({ ok: false, error: "forbidden" }, 403);
    }
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);
  let data: { lessonId?: unknown; prompt?: unknown };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  const result = await completeLesson({ lessonId: data.lessonId, prompt: data.prompt, ip: clientIp(request) });
  return json(result.body, result.status);
}
