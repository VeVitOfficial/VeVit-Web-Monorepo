import { apiActor, json, readBody, text } from "@/lib/edu/aifb/api";
import { isCategoryId } from "@/lib/edu/aifb/types";
import { normalizeSchoolClassName } from "@/lib/edu/school/school";
import {
  addSchoolAdmin, addTeacher, archiveSchool, archiveSchoolClass, createSchool, createSchoolClass, isUuid, loadMemberships,
  moveStudent, newSchoolCode, removeSchoolAdmin, removeStudentFromSchool, removeTeacher, renameSchool, renameSchoolClass,
  schoolById, setClassTeacher, userByEmail,
} from "@/lib/edu/school/store";
import { isVevitAdmin } from "@/lib/edu/school/viewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /edu/api/school/sprava  { action, school_id?, ... }
// VeVit admin (rank admin): založení a zrušení školy, správci školy (podle e-mailu účtu VeVit).
// Správce školy (nebo admin): název a kód školy, kmenové třídy, učitelé a jejich přidělení
// ke kmenovým třídám, přesun žáka do jiné kmenové třídy a odebrání žáka ze školy.

const ok = (value: boolean, extra: Record<string, unknown> = {}) => (value ? json({ ok: true, ...extra }) : json({ ok: false, error: "failed" }, 500));

export async function POST(request: Request): Promise<Response> {
  const actor = await apiActor(request);
  if (actor instanceof Response) return actor;
  const body = await readBody(request, 5_000);
  if (!body) return json({ ok: false, error: "bad_request" }, 400);
  const action = text(body.action, 30);
  const isAdmin = await isVevitAdmin(actor.userId);

  if (action === "create_school") {
    if (!isAdmin) return json({ ok: false, error: "forbidden" }, 403);
    const name = text(body.name, 120);
    if (name.length < 2) return json({ ok: false, error: "bad_request" }, 400);
    const created = await createSchool(name, actor.userId);
    return created ? json({ ok: true, ...created }) : json({ ok: false, error: "failed" }, 500);
  }

  const schoolId = text(body.school_id, 40);
  const school = isUuid(schoolId) ? await schoolById(schoolId) : null;
  if (!school) return json({ ok: false, error: "not_found" }, 404);
  const manager = isAdmin || (await loadMemberships(actor.userId)).adminOf.some((s) => s.id === school.id);
  if (!manager) return json({ ok: false, error: "forbidden" }, 403);

  switch (action) {
    case "archive_school":
    case "add_admin":
    case "remove_admin": {
      if (!isAdmin) return json({ ok: false, error: "forbidden" }, 403);
      if (action === "archive_school") return ok(await archiveSchool(school.id));
      if (action === "remove_admin") return ok(await removeSchoolAdmin(school.id, text(body.user_id, 64)));
      const person = await userByEmail(text(body.email, 200));
      if (!person) return json({ ok: false, error: "unknown_user" }, 404);
      return ok(await addSchoolAdmin(school.id, person.userId, actor.userId));
    }
    case "rename_school": {
      const name = text(body.name, 120);
      if (name.length < 2) return json({ ok: false, error: "bad_request" }, 400);
      return ok(await renameSchool(school.id, name));
    }
    case "new_code": {
      const code = await newSchoolCode(school.id);
      return code ? json({ ok: true, code }) : json({ ok: false, error: "failed" }, 500);
    }
    case "add_class":
    case "rename_class": {
      const name = normalizeSchoolClassName(body.name);
      if (!name) return json({ ok: false, error: "bad_request" }, 400);
      let result: "ok" | "duplicate" | "failed";
      if (action === "add_class") {
        const category = text(body.category, 5);
        if (!isCategoryId(category)) return json({ ok: false, error: "bad_request" }, 400);
        result = await createSchoolClass(school.id, name, category);
      } else {
        result = await renameSchoolClass(school.id, text(body.class_id, 40), name);
      }
      return result === "ok" ? json({ ok: true }) : json({ ok: false, error: result }, result === "duplicate" ? 409 : 500);
    }
    case "archive_class": {
      const result = await archiveSchoolClass(school.id, text(body.class_id, 40));
      return result === "ok" ? json({ ok: true }) : json({ ok: false, error: result }, result === "not_empty" ? 409 : 500);
    }
    case "add_teacher": {
      const person = await userByEmail(text(body.email, 200));
      if (!person) return json({ ok: false, error: "unknown_user" }, 404);
      return ok(await addTeacher(school.id, person.userId, actor.userId));
    }
    case "remove_teacher":
      return ok(await removeTeacher(school.id, text(body.user_id, 64)));
    case "assign_teacher":
      return ok(await setClassTeacher(school.id, text(body.class_id, 40), text(body.teacher_id, 64), body.assigned === true, actor.userId));
    case "move_student": {
      const classId = text(body.class_id, 40);
      if (!isUuid(classId)) return json({ ok: false, error: "bad_request" }, 400);
      return ok(await moveStudent(school.id, text(body.user_id, 64), classId));
    }
    case "remove_student":
      return ok(await removeStudentFromSchool(school.id, text(body.user_id, 64)));
    default:
      return json({ ok: false, error: "unknown_action" }, 400);
  }
}
