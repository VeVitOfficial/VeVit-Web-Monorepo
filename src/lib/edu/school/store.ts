import "server-only";

// Data VeVit Edu pro školy (migrace 029): školy, správci, učitelé, kmenové třídy, žáci, třídy
// učitelů (edu_classes), zadané lekce a průběh. Jen server (secret klíč). Oprávnění kontrolují
// volající (viewer.ts, API); tady se jen čte a zapisuje. Chyba čtení = prázdný výsledek nebo null,
// nikdy víc dat, než je potřeba.

import { randomInt } from "node:crypto";
import { accountSupabase } from "@/lib/account-auth";
import { generateClassCode, isAifbLessonId } from "../aifb/access";
import { isCategoryId, type CategoryId } from "../aifb/types";
import { compareStudents } from "./school";

const sb = () => accountSupabase();
const one = <T>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? value[0] ?? null : value ?? null);
const UUID = /^[0-9a-f-]{36}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export type SchoolRef = { id: string; name: string };
export type StudentMembership = { schoolId: string; schoolName: string; firstName: string; lastName: string; classId: string; className: string };
export type Memberships = { student: StudentMembership | null; teacherOf: SchoolRef[]; adminOf: SchoolRef[] };
export type Person = { userId: string; email: string; nickname: string };
export type SchoolStudent = { userId: string; firstName: string; lastName: string; classId: string; joinedAt: string };
export type SchoolClass = { id: string; name: string; category: CategoryId; students: number; teacherIds: string[] };
export type Assignment = { lessonId: string; dueAt: string | null; note: string };
export type ProgressRow = { userId: string; lessonId: string; status: "started" | "done"; doneAt: string | null; updatedAt: string };

async function newCode(apply: (code: string) => PromiseLike<{ error: { code?: string } | null }>): Promise<string | null> {
  // Kolize kódu je velmi nepravděpodobná (32^8); při ní se zkusí nový.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateClassCode(randomInt);
    const { error } = await apply(code);
    if (!error) return code;
    if (error.code !== "23505") return null;
  }
  return null;
}

// ── Členství přihlášeného ──────────────────────────────────────────────────

export async function loadMemberships(userId: string): Promise<Memberships> {
  const [student, teachers, admins] = await Promise.all([
    sb().from("edu_school_students")
      .select("school_id,first_name,last_name,school_class_id,edu_schools!inner(name,archived_at),edu_school_classes(name)")
      .eq("user_id", userId).is("removed_at", null).is("edu_schools.archived_at", null).maybeSingle(),
    sb().from("edu_school_teachers").select("school_id,edu_schools!inner(name,archived_at)")
      .eq("user_id", userId).is("removed_at", null).is("edu_schools.archived_at", null),
    sb().from("edu_school_admins").select("school_id,edu_schools!inner(name,archived_at)")
      .eq("user_id", userId).is("removed_at", null).is("edu_schools.archived_at", null),
  ]);
  const refs = (rows: { school_id: string; edu_schools: unknown }[] | null) =>
    (rows ?? []).map((row) => ({ id: row.school_id, name: one(row.edu_schools as { name: string })?.name ?? "" }));
  const s = student.data as { school_id: string; first_name: string; last_name: string; school_class_id: string; edu_schools: unknown; edu_school_classes: unknown } | null;
  return {
    student: s ? {
      schoolId: s.school_id,
      schoolName: one(s.edu_schools as { name: string })?.name ?? "",
      firstName: s.first_name,
      lastName: s.last_name,
      classId: s.school_class_id,
      className: one(s.edu_school_classes as { name: string })?.name ?? "",
    } : null,
    teacherOf: teachers.error ? [] : refs(teachers.data),
    adminOf: admins.error ? [] : refs(admins.data),
  };
}

// ── Vstup žáka ─────────────────────────────────────────────────────────────

export async function schoolByCode(code: string): Promise<{ id: string; name: string; classes: { id: string; name: string }[] } | null> {
  const { data, error } = await sb().from("edu_schools").select("id,name").eq("code", code).is("archived_at", null).maybeSingle();
  if (error || !data) return null;
  const classes = await sb().from("edu_school_classes").select("id,name").eq("school_id", data.id).is("archived_at", null).order("name");
  return { id: data.id, name: data.name, classes: (classes.data ?? []) as { id: string; name: string }[] };
}

export type JoinSchoolResult = { ok: true; name: string } | { ok: false; error: "unknown_code" | "unknown_class" | "other_school" | "failed" };

export async function joinSchool(userId: string, code: string, firstName: string, lastName: string, classId: string): Promise<JoinSchoolResult> {
  const { data, error } = await sb().rpc("edu_join_school", {
    p_user_id: userId, p_code: code, p_first_name: firstName, p_last_name: lastName, p_school_class_id: classId,
  });
  if (error || !data) return { ok: false, error: "failed" };
  const result = data as { ok: boolean; error?: string; name?: string };
  if (result.ok) return { ok: true, name: result.name ?? "" };
  const known = ["unknown_code", "unknown_class", "other_school"] as const;
  return { ok: false, error: (known as readonly string[]).includes(result.error ?? "") ? (result.error as (typeof known)[number]) : "failed" };
}

// ── Uživatelé ──────────────────────────────────────────────────────────────

export async function userByEmail(email: string): Promise<Person | null> {
  const { data, error } = await sb().from("users").select("id,email,nickname").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (error || !data) return null;
  return { userId: data.id as string, email: (data.email as string) ?? "", nickname: (data.nickname as string | null) ?? "" };
}

async function people(ids: string[]): Promise<Map<string, Person>> {
  const map = new Map<string, Person>();
  if (ids.length === 0) return map;
  const { data } = await sb().from("users").select("id,email,nickname").in("id", ids);
  for (const row of data ?? []) map.set(row.id as string, { userId: row.id as string, email: (row.email as string) ?? "", nickname: (row.nickname as string | null) ?? "" });
  return map;
}

async function grant(userId: string, rank: "teacher" | "school_admin"): Promise<boolean> {
  const { error } = await sb().rpc("edu_grant_school_rank", { p_user_id: userId, p_rank: rank });
  return !error;
}

async function syncStaff(userId: string): Promise<void> {
  await sb().rpc("edu_sync_staff_ranks", { p_user_id: userId });
}

// ── VeVit admin: školy ─────────────────────────────────────────────────────

export type SchoolSummary = { id: string; name: string; code: string; createdAt: string; admins: Person[]; teachers: number; students: number };

export async function listSchools(): Promise<SchoolSummary[] | null> {
  const { data, error } = await sb().from("edu_schools").select("id,name,code,created_at").is("archived_at", null).order("name");
  if (error) return null;
  const rows = (data ?? []) as { id: string; name: string; code: string; created_at: string }[];
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [admins, teachers, students] = await Promise.all([
    sb().from("edu_school_admins").select("school_id,user_id").in("school_id", ids).is("removed_at", null),
    sb().from("edu_school_teachers").select("school_id").in("school_id", ids).is("removed_at", null),
    sb().from("edu_school_students").select("school_id").in("school_id", ids).is("removed_at", null),
  ]);
  const adminRows = (admins.data ?? []) as { school_id: string; user_id: string }[];
  const persons = await people([...new Set(adminRows.map((row) => row.user_id))]);
  const count = (list: { school_id: string }[] | null, id: string) => (list ?? []).filter((row) => row.school_id === id).length;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    createdAt: row.created_at,
    admins: adminRows.filter((a) => a.school_id === row.id).map((a) => persons.get(a.user_id)).filter((p): p is Person => !!p),
    teachers: count(teachers.data as { school_id: string }[] | null, row.id),
    students: count(students.data as { school_id: string }[] | null, row.id),
  }));
}

export async function createSchool(name: string, createdBy: string): Promise<{ id: string; code: string } | null> {
  let id = "";
  const code = await newCode(async (candidate) => {
    const result = await sb().from("edu_schools").insert({ name, code: candidate, created_by: createdBy }).select("id").single();
    if (result.data) id = result.data.id as string;
    return result;
  });
  return code && id ? { id, code } : null;
}

export async function schoolById(id: string): Promise<{ id: string; name: string; code: string } | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await sb().from("edu_schools").select("id,name,code").eq("id", id).is("archived_at", null).maybeSingle();
  return error || !data ? null : (data as { id: string; name: string; code: string });
}

export async function renameSchool(id: string, name: string): Promise<boolean> {
  const { error } = await sb().from("edu_schools").update({ name }).eq("id", id);
  return !error;
}

export async function newSchoolCode(id: string): Promise<string | null> {
  return newCode((code) => sb().from("edu_schools").update({ code }).eq("id", id));
}

/** Zrušení školy: všichni přijdou o ranky ze školy, třídy učitelů se archivují. */
export async function archiveSchool(id: string): Promise<boolean> {
  const { error } = await sb().from("edu_schools").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) return false;
  await sb().from("edu_classes").update({ archived_at: new Date().toISOString() }).eq("school_id", id).is("archived_at", null);
  const [students, teachers, admins] = await Promise.all([
    sb().from("edu_school_students").select("user_id").eq("school_id", id).is("removed_at", null),
    sb().from("edu_school_teachers").select("user_id").eq("school_id", id).is("removed_at", null),
    sb().from("edu_school_admins").select("user_id").eq("school_id", id).is("removed_at", null),
  ]);
  for (const row of students.data ?? []) await sb().rpc("edu_sync_student_rank", { p_user_id: row.user_id });
  for (const userId of new Set([...(teachers.data ?? []), ...(admins.data ?? [])].map((row) => row.user_id as string))) await syncStaff(userId);
  return true;
}

export async function addSchoolAdmin(schoolId: string, userId: string, by: string): Promise<boolean> {
  const { error } = await sb().from("edu_school_admins")
    .upsert({ school_id: schoolId, user_id: userId, added_by: by, added_at: new Date().toISOString(), removed_at: null }, { onConflict: "school_id,user_id" });
  return !error && (await grant(userId, "school_admin"));
}

export async function removeSchoolAdmin(schoolId: string, userId: string): Promise<boolean> {
  const { error } = await sb().from("edu_school_admins").update({ removed_at: new Date().toISOString() })
    .eq("school_id", schoolId).eq("user_id", userId).is("removed_at", null);
  if (error) return false;
  await syncStaff(userId);
  return true;
}

// ── Správce: škola ─────────────────────────────────────────────────────────

export type SchoolDetail = {
  school: { id: string; name: string; code: string };
  classes: SchoolClass[];
  teachers: Person[];
  students: SchoolStudent[];
};

export async function schoolDetail(schoolId: string): Promise<SchoolDetail | null> {
  const school = await schoolById(schoolId);
  if (!school) return null;
  const [classes, teachers, students] = await Promise.all([
    sb().from("edu_school_classes").select("id,name,category").eq("school_id", schoolId).is("archived_at", null).order("name"),
    sb().from("edu_school_teachers").select("user_id").eq("school_id", schoolId).is("removed_at", null),
    sb().from("edu_school_students").select("user_id,first_name,last_name,school_class_id,joined_at").eq("school_id", schoolId).is("removed_at", null),
  ]);
  if (classes.error || teachers.error || students.error) return null;
  const classRows = (classes.data ?? []) as { id: string; name: string; category: string }[];
  const links = classRows.length
    ? ((await sb().from("edu_school_class_teachers").select("school_class_id,teacher_id").in("school_class_id", classRows.map((c) => c.id))).data ?? [])
    : [];
  const studentRows = (students.data ?? []).map((row) => ({
    userId: row.user_id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    classId: row.school_class_id as string,
    joinedAt: row.joined_at as string,
  })).sort(compareStudents);
  const persons = await people((teachers.data ?? []).map((row) => row.user_id as string));
  return {
    school,
    classes: classRows.filter((c) => isCategoryId(c.category)).map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category as CategoryId,
      students: studentRows.filter((s) => s.classId === c.id).length,
      teacherIds: links.filter((l) => l.school_class_id === c.id).map((l) => l.teacher_id as string),
    })),
    teachers: [...persons.values()].sort((a, b) => (a.nickname || a.email).localeCompare(b.nickname || b.email, "cs")),
    students: studentRows,
  };
}

export async function createSchoolClass(schoolId: string, name: string, category: CategoryId): Promise<"ok" | "duplicate" | "failed"> {
  const { error } = await sb().from("edu_school_classes").insert({ school_id: schoolId, name, category });
  return !error ? "ok" : error.code === "23505" ? "duplicate" : "failed";
}

async function schoolClassInSchool(schoolId: string, classId: string): Promise<boolean> {
  if (!isUuid(classId)) return false;
  const { data } = await sb().from("edu_school_classes").select("id").eq("id", classId).eq("school_id", schoolId).is("archived_at", null).maybeSingle();
  return !!data;
}

export async function renameSchoolClass(schoolId: string, classId: string, name: string): Promise<"ok" | "duplicate" | "failed"> {
  if (!(await schoolClassInSchool(schoolId, classId))) return "failed";
  const { error } = await sb().from("edu_school_classes").update({ name }).eq("id", classId);
  return !error ? "ok" : error.code === "23505" ? "duplicate" : "failed";
}

/** Zrušit jde jen prázdnou kmenovou třídu (žáky nejdřív přesune správce). */
export async function archiveSchoolClass(schoolId: string, classId: string): Promise<"ok" | "not_empty" | "failed"> {
  if (!(await schoolClassInSchool(schoolId, classId))) return "failed";
  const { count } = await sb().from("edu_school_students").select("user_id", { count: "exact", head: true }).eq("school_class_id", classId).is("removed_at", null);
  if ((count ?? 0) > 0) return "not_empty";
  const { error } = await sb().from("edu_school_classes").update({ archived_at: new Date().toISOString() }).eq("id", classId);
  if (error) return "failed";
  await sb().from("edu_school_class_teachers").delete().eq("school_class_id", classId);
  return "ok";
}

export async function addTeacher(schoolId: string, userId: string, by: string): Promise<boolean> {
  const { error } = await sb().from("edu_school_teachers")
    .upsert({ school_id: schoolId, user_id: userId, added_by: by, added_at: new Date().toISOString(), removed_at: null }, { onConflict: "school_id,user_id" });
  return !error && (await grant(userId, "teacher"));
}

/** Odebrání učitele ze školy: zruší přidělení tříd a archivuje jeho třídy v této škole. */
export async function removeTeacher(schoolId: string, userId: string): Promise<boolean> {
  const { error } = await sb().from("edu_school_teachers").update({ removed_at: new Date().toISOString() })
    .eq("school_id", schoolId).eq("user_id", userId).is("removed_at", null);
  if (error) return false;
  const classes = await sb().from("edu_school_classes").select("id").eq("school_id", schoolId);
  const ids = (classes.data ?? []).map((row) => row.id as string);
  if (ids.length) await sb().from("edu_school_class_teachers").delete().eq("teacher_id", userId).in("school_class_id", ids);
  await sb().from("edu_classes").update({ archived_at: new Date().toISOString() }).eq("school_id", schoolId).eq("teacher_id", userId).is("archived_at", null);
  await syncStaff(userId);
  return true;
}

async function isSchoolTeacher(schoolId: string, userId: string): Promise<boolean> {
  const { data } = await sb().from("edu_school_teachers").select("user_id").eq("school_id", schoolId).eq("user_id", userId).is("removed_at", null).maybeSingle();
  return !!data;
}

export async function setClassTeacher(schoolId: string, classId: string, teacherId: string, assigned: boolean, by: string): Promise<boolean> {
  if (!(await schoolClassInSchool(schoolId, classId))) return false;
  if (!assigned) {
    const { error } = await sb().from("edu_school_class_teachers").delete().eq("school_class_id", classId).eq("teacher_id", teacherId);
    return !error;
  }
  if (!(await isSchoolTeacher(schoolId, teacherId))) return false;
  const { error } = await sb().from("edu_school_class_teachers")
    .upsert({ school_class_id: classId, teacher_id: teacherId, assigned_by: by }, { onConflict: "school_class_id,teacher_id", ignoreDuplicates: true });
  return !error;
}

export async function moveStudent(schoolId: string, userId: string, classId: string): Promise<boolean> {
  const { data, error } = await sb().rpc("edu_move_student", { p_school_id: schoolId, p_user_id: userId, p_school_class_id: classId });
  return !error && data === true;
}

export async function removeStudentFromSchool(schoolId: string, userId: string): Promise<boolean> {
  const { error } = await sb().rpc("edu_remove_school_student", { p_school_id: schoolId, p_user_id: userId });
  return !error;
}

// ── Učitel: přidělené kmenové třídy a jejich žáci ──────────────────────────

export type TeacherSchoolClass = { id: string; name: string; category: CategoryId; schoolId: string };

export async function teacherSchoolClasses(teacherId: string, schoolIds: string[]): Promise<TeacherSchoolClass[]> {
  if (schoolIds.length === 0) return [];
  const { data, error } = await sb().from("edu_school_class_teachers")
    .select("school_class_id,edu_school_classes!inner(id,name,category,school_id,archived_at)")
    .eq("teacher_id", teacherId).is("edu_school_classes.archived_at", null).in("edu_school_classes.school_id", schoolIds);
  if (error) return [];
  return (data ?? [])
    .map((row) => one(row.edu_school_classes as unknown as { id: string; name: string; category: string; school_id: string }))
    .filter((c): c is { id: string; name: string; category: string; school_id: string } => !!c && isCategoryId(c.category))
    .map((c) => ({ id: c.id, name: c.name, category: c.category as CategoryId, schoolId: c.school_id }))
    .sort((a, b) => a.name.localeCompare(b.name, "cs", { numeric: true }));
}

/** Žáci kmenových tříd (jen přidělených učiteli, filtruje volající). */
export async function studentsOfSchoolClasses(classIds: string[]): Promise<SchoolStudent[]> {
  if (classIds.length === 0) return [];
  const { data, error } = await sb().from("edu_school_students").select("user_id,first_name,last_name,school_class_id,joined_at")
    .in("school_class_id", classIds).is("removed_at", null);
  if (error) return [];
  return (data ?? []).map((row) => ({
    userId: row.user_id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    classId: row.school_class_id as string,
    joinedAt: row.joined_at as string,
  })).sort(compareStudents);
}

// ── Učitel: vlastní třídy (edu_classes se školou) ──────────────────────────

export type Group = { id: string; name: string; category: CategoryId; schoolId: string; sourceClassId: string | null; teacherId: string; createdAt: string };
export type GroupSummary = Group & { students: number; unlocked: number; assigned: number };

type GroupRow = { id: string; name: string; category: string; school_id: string; source_class_id: string | null; teacher_id: string; created_at: string };
const GROUP_COLUMNS = "id,name,category,school_id,source_class_id,teacher_id,created_at";
const toGroup = (row: GroupRow): Group => ({
  id: row.id, name: row.name, category: row.category as CategoryId, schoolId: row.school_id,
  sourceClassId: row.source_class_id, teacherId: row.teacher_id, createdAt: row.created_at,
});

export async function listGroups(teacherId: string): Promise<GroupSummary[] | null> {
  const { data, error } = await sb().from("edu_classes").select(GROUP_COLUMNS)
    .eq("teacher_id", teacherId).not("school_id", "is", null).is("archived_at", null).order("created_at");
  if (error) return null;
  const rows = ((data ?? []) as GroupRow[]).filter((row) => isCategoryId(row.category));
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [members, unlocks, assignments] = await Promise.all([
    sb().from("edu_class_members").select("class_id").in("class_id", ids).is("removed_at", null),
    sb().from("edu_class_unlocks").select("class_id").in("class_id", ids),
    sb().from("edu_class_assignments").select("class_id").in("class_id", ids),
  ]);
  const count = (list: { class_id: string }[] | null, id: string) => (list ?? []).filter((row) => row.class_id === id).length;
  return rows.map((row) => ({
    ...toGroup(row),
    students: count(members.data as { class_id: string }[] | null, row.id),
    unlocked: count(unlocks.data as { class_id: string }[] | null, row.id),
    assigned: count(assignments.data as { class_id: string }[] | null, row.id),
  }));
}

/** Třída učitele, kterou smí spravovat (vlastní ve škole, kde stále učí; admin každou). */
export async function groupForTeacher(groupId: string, actor: { userId: string; isAdmin: boolean }): Promise<Group | null> {
  if (!isUuid(groupId)) return null;
  const { data, error } = await sb().from("edu_classes").select(GROUP_COLUMNS).eq("id", groupId).is("archived_at", null).not("school_id", "is", null).maybeSingle();
  if (error || !data) return null;
  const group = toGroup(data as GroupRow);
  if (actor.isAdmin) return group;
  if (group.teacherId !== actor.userId) return null;
  return (await isSchoolTeacher(group.schoolId, actor.userId)) ? group : null;
}

export async function createGroup(
  teacherId: string, schoolId: string, name: string, category: CategoryId, sourceClassId: string | null, studentIds: string[],
): Promise<string | null> {
  const { data, error } = await sb().from("edu_classes")
    .insert({ teacher_id: teacherId, school_id: schoolId, name, category, source_class_id: sourceClassId, code: null })
    .select("id").single();
  if (error || !data) return null;
  const id = data.id as string;
  const fromSource = sourceClassId ? (await studentsOfSchoolClasses([sourceClassId])).map((s) => s.userId) : [];
  const members = [...new Set([...fromSource, ...studentIds])];
  if (members.length) await sb().from("edu_class_members").insert(members.map((user_id) => ({ class_id: id, user_id })));
  return id;
}

export async function renameGroup(groupId: string, name: string): Promise<boolean> {
  const { error } = await sb().from("edu_classes").update({ name }).eq("id", groupId);
  return !error;
}

export async function archiveGroup(groupId: string): Promise<boolean> {
  const { error } = await sb().from("edu_classes").update({ archived_at: new Date().toISOString() }).eq("id", groupId);
  return !error;
}

export async function groupMemberIds(groupId: string): Promise<string[]> {
  const { data, error } = await sb().from("edu_class_members").select("user_id").eq("class_id", groupId).is("removed_at", null);
  return error ? [] : (data ?? []).map((row) => row.user_id as string);
}

export async function addGroupMembers(groupId: string, userIds: string[]): Promise<boolean> {
  if (userIds.length === 0) return true;
  const now = new Date().toISOString();
  const { error } = await sb().from("edu_class_members")
    .upsert(userIds.map((user_id) => ({ class_id: groupId, user_id, joined_at: now, removed_at: null })), { onConflict: "class_id,user_id" });
  return !error;
}

/** Učitel odebere žáka jen ze své třídy; ve škole i v jiných třídách žák zůstává. */
export async function removeGroupMember(groupId: string, userId: string): Promise<boolean> {
  const { error } = await sb().from("edu_class_members").update({ removed_at: new Date().toISOString() })
    .eq("class_id", groupId).eq("user_id", userId).is("removed_at", null);
  return !error;
}

/** Jména žáků (ze zápisu do školy) pro dané účty. */
export async function schoolStudentsByIds(schoolId: string, userIds: string[]): Promise<SchoolStudent[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await sb().from("edu_school_students").select("user_id,first_name,last_name,school_class_id,joined_at")
    .eq("school_id", schoolId).in("user_id", userIds).is("removed_at", null);
  if (error) return [];
  return (data ?? []).map((row) => ({
    userId: row.user_id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    classId: row.school_class_id as string,
    joinedAt: row.joined_at as string,
  })).sort(compareStudents);
}

// ── Zadané lekce ───────────────────────────────────────────────────────────

export async function groupAssignments(groupId: string): Promise<Assignment[]> {
  const { data, error } = await sb().from("edu_class_assignments").select("lesson_id,due_at,note").eq("class_id", groupId);
  if (error) return [];
  return (data ?? []).map((row) => ({ lessonId: row.lesson_id as string, dueAt: (row.due_at as string | null) ?? null, note: (row.note as string | null) ?? "" }));
}

export async function assignLessons(groupId: string, lessonIds: string[], dueAt: string | null, note: string, by: string): Promise<boolean> {
  const ids = lessonIds.filter(isAifbLessonId);
  if (ids.length === 0) return true;
  const { error } = await sb().from("edu_class_assignments").upsert(
    ids.map((lesson_id) => ({ class_id: groupId, lesson_id, due_at: dueAt, note: note || null, assigned_by: by, assigned_at: new Date().toISOString() })),
    { onConflict: "class_id,lesson_id" },
  );
  return !error;
}

export async function unassignLessons(groupId: string, lessonIds: string[]): Promise<boolean> {
  const ids = lessonIds.filter(isAifbLessonId);
  if (ids.length === 0) return true;
  const { error } = await sb().from("edu_class_assignments").delete().eq("class_id", groupId).in("lesson_id", ids);
  return !error;
}

export type StudentAssignment = Assignment & { groupName: string };

export async function studentAssignments(groupIds: { id: string; name: string }[]): Promise<StudentAssignment[]> {
  if (groupIds.length === 0) return [];
  const { data, error } = await sb().from("edu_class_assignments").select("class_id,lesson_id,due_at,note").in("class_id", groupIds.map((g) => g.id));
  if (error) return [];
  return (data ?? []).map((row) => ({
    lessonId: row.lesson_id as string,
    dueAt: (row.due_at as string | null) ?? null,
    note: (row.note as string | null) ?? "",
    groupName: groupIds.find((g) => g.id === row.class_id)?.name ?? "",
  }));
}

// ── Průběh ─────────────────────────────────────────────────────────────────

export async function progressOf(userIds: string[]): Promise<ProgressRow[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await sb().from("edu_lesson_progress").select("user_id,lesson_id,status,done_at,updated_at").in("user_id", userIds);
  if (error) return [];
  return (data ?? []).map((row) => ({
    userId: row.user_id as string,
    lessonId: row.lesson_id as string,
    status: row.status === "done" ? "done" : "started",
    doneAt: (row.done_at as string | null) ?? null,
    updatedAt: row.updated_at as string,
  }));
}

/** Uloží stav lekce žáka ve škole (null = zpět na nezačato). Jen žák s aktivním zápisem ve škole. */
export async function saveProgress(userId: string, lessonId: string, status: "started" | "done" | null): Promise<boolean> {
  const member = await sb().from("edu_school_students").select("user_id").eq("user_id", userId).is("removed_at", null).maybeSingle();
  if (member.error || !member.data) return false;
  if (status === null) {
    const { error } = await sb().from("edu_lesson_progress").delete().eq("user_id", userId).eq("lesson_id", lessonId);
    return !error;
  }
  const now = new Date().toISOString();
  const { error } = await sb().from("edu_lesson_progress").upsert(
    { user_id: userId, lesson_id: lessonId, status, done_at: status === "done" ? now : null, updated_at: now },
    { onConflict: "user_id,lesson_id" },
  );
  return !error;
}

/** Učitel vynuluje průběh žáka (u vybraných lekcí, nebo celý). */
export async function resetProgress(userIds: string[], lessonIds: string[] | null): Promise<boolean> {
  if (userIds.length === 0) return true;
  let query = sb().from("edu_lesson_progress").delete().in("user_id", userIds);
  if (lessonIds) query = query.in("lesson_id", lessonIds);
  const { error } = await query;
  return !error;
}
