import { isStaff } from "@/lib/edu/aifb/access";
import { apiActor, json, readBody, text } from "@/lib/edu/aifb/api";
import {
  archiveClass, classForTeacher, createClass, newClassCode, removeStudent, renameClass, setUnlocked,
} from "@/lib/edu/aifb/classes";
import { isCategoryId } from "@/lib/edu/aifb/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /edu/api/aifb/tridy  { action, ... }
// Správa tříd učitelem (rank teacher) nebo adminem: založení, přejmenování, nový kód, zrušení,
// odemčení / zamčení lekcí a odebrání žáka. Učitel smí jen svoje třídy, admin všechny.

const MAX_LESSONS = 200;

export async function POST(request: Request): Promise<Response> {
  const actor = await apiActor(request);
  if (actor instanceof Response) return actor;
  if (!isStaff(actor)) return json({ ok: false, error: "forbidden" }, 403);
  const body = await readBody(request, 20_000);
  if (!body) return json({ ok: false, error: "bad_request" }, 400);
  const action = text(body.action, 30);

  if (action === "create") {
    const name = text(body.name, 80);
    const category = text(body.category, 5);
    if (!name || !isCategoryId(category)) return json({ ok: false, error: "bad_request" }, 400);
    const created = await createClass(actor.userId, name, category);
    return created ? json({ ok: true, class: created }) : json({ ok: false, error: "failed" }, 500);
  }

  const klass = await classForTeacher(text(body.class_id, 40), { userId: actor.userId, isAdmin: actor.role === "admin" });
  if (!klass) return json({ ok: false, error: "not_found" }, 404);

  switch (action) {
    case "rename": {
      const name = text(body.name, 80);
      if (!name) return json({ ok: false, error: "bad_request" }, 400);
      return (await renameClass(klass.id, name)) ? json({ ok: true }) : json({ ok: false, error: "failed" }, 500);
    }
    case "new_code": {
      const code = await newClassCode(klass.id);
      return code ? json({ ok: true, code }) : json({ ok: false, error: "failed" }, 500);
    }
    case "archive":
      return (await archiveClass(klass.id)) ? json({ ok: true }) : json({ ok: false, error: "failed" }, 500);
    case "unlock":
    case "lock": {
      const lessons = Array.isArray(body.lessons) ? body.lessons.slice(0, MAX_LESSONS) : [];
      // Jen lekce kategorie třídy (žák jiné kategorie stejně nevidí).
      const ids = lessons.filter((id): id is string => typeof id === "string" && id.startsWith(`${klass.category}-`));
      if (ids.length === 0) return json({ ok: false, error: "bad_request" }, 400);
      return (await setUnlocked(klass.id, ids, action === "unlock", actor.userId)) ? json({ ok: true }) : json({ ok: false, error: "failed" }, 500);
    }
    case "remove_student": {
      const userId = text(body.user_id, 64);
      if (!userId) return json({ ok: false, error: "bad_request" }, 400);
      return (await removeStudent(klass.id, userId)) ? json({ ok: true }) : json({ ok: false, error: "failed" }, 500);
    }
    default:
      return json({ ok: false, error: "unknown_action" }, 400);
  }
}
