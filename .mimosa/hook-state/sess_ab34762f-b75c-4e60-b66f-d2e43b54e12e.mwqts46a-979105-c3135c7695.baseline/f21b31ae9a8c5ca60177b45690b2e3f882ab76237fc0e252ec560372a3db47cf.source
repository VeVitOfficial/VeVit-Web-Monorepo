import { apiActor, json, readBody, text } from "@/lib/edu/aifb/api";
import { normalizePersonName, normalizeSchoolCode } from "@/lib/edu/school/school";
import { isUuid, joinSchool, schoolByCode } from "@/lib/edu/school/store";
import { toolsRateLimit } from "@/lib/tools-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /edu/api/school/vstup
//   { action: "check", code }                                     → název školy a kmenové třídy
//   { action: "join", code, first_name, last_name, class_id }     → zápis žáka do školy (rank student)
// Libovolný přihlášený účet. Pokusy o kód jsou omezené na účet (hádání kódů škol).

const RATE_NAMESPACE = "edu-school-join";
const RATE_WINDOW_SECONDS = 600;
const RATE_MAX = 15;

export async function POST(request: Request): Promise<Response> {
  const actor = await apiActor(request);
  if (actor instanceof Response) return actor;
  const body = await readBody(request, 2_000);
  if (!body) return json({ ok: false, error: "bad_request" }, 400);
  const code = normalizeSchoolCode(body.code);
  if (!code) return json({ ok: false, error: "bad_code" }, 400);

  const limit = await toolsRateLimit(`user:${actor.userId}`, RATE_NAMESPACE, RATE_WINDOW_SECONDS, RATE_MAX);
  if (!limit.available) return json({ ok: false, error: "failed" }, 503);
  if (!limit.allowed) return json({ ok: false, error: "rate_limited" }, 429);

  if (body.action === "check") {
    const school = await schoolByCode(code);
    if (!school) return json({ ok: false, error: "unknown_code" }, 404);
    return json({ ok: true, name: school.name, classes: school.classes });
  }

  if (body.action === "join") {
    const firstName = normalizePersonName(body.first_name);
    const lastName = normalizePersonName(body.last_name);
    const classId = text(body.class_id, 40);
    if (!firstName || !lastName) return json({ ok: false, error: "bad_name" }, 400);
    if (!isUuid(classId)) return json({ ok: false, error: "unknown_class" }, 400);
    const result = await joinSchool(actor.userId, code, firstName, lastName, classId);
    if (!result.ok) return json(result, result.error === "failed" ? 500 : result.error === "other_school" ? 409 : 404);
    return json(result);
  }

  return json({ ok: false, error: "unknown_action" }, 400);
}
