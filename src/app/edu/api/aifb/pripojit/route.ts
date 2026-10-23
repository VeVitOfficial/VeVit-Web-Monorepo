import { normalizeClassCode } from "@/lib/edu/aifb/access";
import { apiActor, json, readBody, text } from "@/lib/edu/aifb/api";
import { joinClass, leaveClass } from "@/lib/edu/aifb/classes";
import { toolsRateLimit } from "@/lib/tools-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /edu/api/aifb/pripojit  { action: "join", code } | { action: "leave", class_id }
// Žák (libovolný přihlášený účet) se připojí ke třídě kódem a dostane rank student (migrace 025),
// nebo třídu opustí. Pokusy o kód jsou omezené na účet (hádání kódů).

const RATE_NAMESPACE = "aifb-class-join";
const RATE_WINDOW_SECONDS = 600;
const RATE_MAX = 10;

export async function POST(request: Request): Promise<Response> {
  const actor = await apiActor(request);
  if (actor instanceof Response) return actor;
  const body = await readBody(request, 2_000);
  if (!body) return json({ ok: false, error: "bad_request" }, 400);

  if (body.action === "leave") {
    const classId = text(body.class_id, 40);
    if (!/^[0-9a-f-]{36}$/i.test(classId)) return json({ ok: false, error: "bad_request" }, 400);
    return (await leaveClass(classId, actor.userId)) ? json({ ok: true }) : json({ ok: false, error: "failed" }, 500);
  }

  const code = normalizeClassCode(body.code);
  if (!code) return json({ ok: false, error: "bad_code" }, 400);
  const limit = await toolsRateLimit(`user:${actor.userId}`, RATE_NAMESPACE, RATE_WINDOW_SECONDS, RATE_MAX);
  if (!limit.available) return json({ ok: false, error: "failed" }, 503);
  if (!limit.allowed) return json({ ok: false, error: "rate_limited" }, 429);
  const result = await joinClass(actor.userId, code);
  if (!result.ok) return json(result, result.error === "failed" ? 500 : result.error === "own_class" ? 409 : 404);
  return json(result);
}
