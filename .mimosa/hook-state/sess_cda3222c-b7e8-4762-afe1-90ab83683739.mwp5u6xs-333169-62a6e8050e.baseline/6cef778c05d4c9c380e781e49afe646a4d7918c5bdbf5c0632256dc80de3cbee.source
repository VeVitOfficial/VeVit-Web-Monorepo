import { apiActor, json, readBody, text } from "@/lib/edu/aifb/api";
import { setUnlocked } from "@/lib/edu/aifb/classes";
import { isCategoryId } from "@/lib/edu/aifb/types";
import {
  addGroupMembers, archiveGroup, assignLessons, createGroup, groupForTeacher, groupMemberIds, isUuid, loadMemberships,
  removeGroupMember, renameGroup, resetProgress, schoolDetail, studentsOfSchoolClasses, teacherSchoolClasses, unassignLessons,
} from "@/lib/edu/school/store";
import { isVevitAdmin } from "@/lib/edu/school/viewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /edu/api/school/ucitel  { action, ... }
// Učitel školy (nebo VeVit admin): vlastní třídy ze žáků kmenových tříd, které mu přidělil správce.
// Odemykání a zadávání lekcí, odebrání žáka jen z vlastní třídy (ze školy ho odebírá správce),
// reset průběhu žáků své třídy.

const MAX_ITEMS = 200;

const ok = (value: boolean) => (value ? json({ ok: true }) : json({ ok: false, error: "failed" }, 500));
const strings = (value: unknown, max = MAX_ITEMS): string[] =>
  Array.isArray(value) ? value.slice(0, max).filter((item): item is string => typeof item === "string" && item.length <= 80) : [];

/** Kmenové třídy školy, jejichž žáky učitel vidí (admin všechny). */
async function visibleClassIds(userId: string, isAdmin: boolean, schoolId: string): Promise<string[]> {
  if (isAdmin) return (await schoolDetail(schoolId))?.classes.map((c) => c.id) ?? [];
  return (await teacherSchoolClasses(userId, [schoolId])).map((c) => c.id);
}

async function visibleStudentIds(userId: string, isAdmin: boolean, schoolId: string): Promise<Set<string>> {
  return new Set((await studentsOfSchoolClasses(await visibleClassIds(userId, isAdmin, schoolId))).map((s) => s.userId));
}

function dueDate(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 40) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function POST(request: Request): Promise<Response> {
  const actor = await apiActor(request);
  if (actor instanceof Response) return actor;
  const body = await readBody(request, 30_000);
  if (!body) return json({ ok: false, error: "bad_request" }, 400);
  const action = text(body.action, 30);
  const isAdmin = await isVevitAdmin(actor.userId);

  if (action === "create_group") {
    const schoolId = text(body.school_id, 40);
    const name = text(body.name, 80);
    const category = text(body.category, 5);
    if (!isUuid(schoolId) || !name || !isCategoryId(category)) return json({ ok: false, error: "bad_request" }, 400);
    if (!isAdmin && !(await loadMemberships(actor.userId)).teacherOf.some((s) => s.id === schoolId)) {
      return json({ ok: false, error: "forbidden" }, 403);
    }
    const classIds = await visibleClassIds(actor.userId, isAdmin, schoolId);
    const sourceRaw = text(body.source_class_id, 40);
    const source = sourceRaw ? sourceRaw : null;
    if (source && !classIds.includes(source)) return json({ ok: false, error: "forbidden" }, 403);
    const visible = new Set((await studentsOfSchoolClasses(classIds)).map((s) => s.userId));
    const students = strings(body.student_ids, 500).filter((id) => visible.has(id));
    const id = await createGroup(actor.userId, schoolId, name, category, source, students);
    return id ? json({ ok: true, id }) : json({ ok: false, error: "failed" }, 500);
  }

  const group = await groupForTeacher(text(body.group_id, 40), { userId: actor.userId, isAdmin });
  if (!group) return json({ ok: false, error: "not_found" }, 404);
  // Jen lekce kategorie třídy (žák jiné kategorie stejně nevidí).
  const lessons = strings(body.lessons).filter((id) => id.startsWith(`${group.category}-`));

  switch (action) {
    case "rename": {
      const name = text(body.name, 80);
      return name ? ok(await renameGroup(group.id, name)) : json({ ok: false, error: "bad_request" }, 400);
    }
    case "archive":
      return ok(await archiveGroup(group.id));
    case "add_members": {
      const visible = await visibleStudentIds(actor.userId, isAdmin, group.schoolId);
      const ids = strings(body.user_ids, 500).filter((id) => visible.has(id));
      if (ids.length === 0) return json({ ok: false, error: "bad_request" }, 400);
      return ok(await addGroupMembers(group.id, ids));
    }
    case "remove_member":
      return ok(await removeGroupMember(group.id, text(body.user_id, 64)));
    case "unlock":
    case "lock":
      if (lessons.length === 0) return json({ ok: false, error: "bad_request" }, 400);
      return ok(await setUnlocked(group.id, lessons, action === "unlock", actor.userId));
    case "assign": {
      const due = dueDate(body.due_at);
      if (lessons.length === 0 || due === undefined) return json({ ok: false, error: "bad_request" }, 400);
      return ok(await assignLessons(group.id, lessons, due, text(body.note, 500), actor.userId));
    }
    case "unassign":
      if (lessons.length === 0) return json({ ok: false, error: "bad_request" }, 400);
      return ok(await unassignLessons(group.id, lessons));
    case "reset": {
      const members = new Set(await groupMemberIds(group.id));
      const users = strings(body.user_ids, 500).filter((id) => members.has(id));
      if (users.length === 0) return json({ ok: false, error: "bad_request" }, 400);
      return ok(await resetProgress(users, lessons.length ? lessons : null));
    }
    default:
      return json({ ok: false, error: "unknown_action" }, 400);
  }
}
