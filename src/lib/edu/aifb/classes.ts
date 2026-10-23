import "server-only";

// Třídy VeVit Edu pro školy (migrace 025): učitel založí třídu, žák se připojí kódem a dostane
// rank student, učitel třídě odemyká lekce. Učitel vidí u žáků jen přezdívku a datum připojení.
// Chyba čtení = žádné třídy (student pak nevidí nic odemčeného, nikdy víc).

import { randomInt } from "node:crypto";
import { accountSupabase } from "@/lib/account-auth";
import { generateClassCode, isAifbLessonId, type StudentClass } from "./access";
import { isCategoryId, type CategoryId } from "./types";

export type TeacherClass = {
  id: string;
  name: string;
  category: CategoryId;
  code: string;
  createdAt: string;
  students: number;
  unlocked: number;
};

export type ClassStudent = { userId: string; name: string; joinedAt: string };

type ClassRow = { id: string; teacher_id: string; name: string; category: string; code: string; created_at: string; archived_at: string | null };

const sb = () => accountSupabase();

export async function loadStudentClasses(userId: string): Promise<{ classes: StudentClass[]; unlocked: Set<string> }> {
  const empty = { classes: [], unlocked: new Set<string>() };
  const { data, error } = await sb()
    .from("edu_class_members")
    .select("class_id, edu_classes!inner(id,name,category,archived_at)")
    .eq("user_id", userId)
    .is("removed_at", null)
    .is("edu_classes.archived_at", null);
  if (error || !data) return empty;
  const classes: StudentClass[] = [];
  for (const row of data) {
    const item = (Array.isArray(row.edu_classes) ? row.edu_classes[0] : row.edu_classes) as { id: string; name: string; category: string } | undefined;
    if (item && isCategoryId(item.category)) classes.push({ id: item.id, name: item.name, category: item.category });
  }
  if (classes.length === 0) return empty;
  const unlocks = await sb().from("edu_class_unlocks").select("lesson_id").in("class_id", classes.map((item) => item.id));
  if (unlocks.error) return { classes, unlocked: new Set() };
  return { classes, unlocked: new Set((unlocks.data ?? []).map((row) => row.lesson_id as string)) };
}

export async function listTeacherClasses(teacherId: string): Promise<TeacherClass[] | null> {
  const { data, error } = await sb()
    .from("edu_classes")
    .select("id,name,category,code,created_at")
    .eq("teacher_id", teacherId)
    .is("archived_at", null)
    .order("created_at");
  if (error) return null;
  const rows = (data ?? []) as Pick<ClassRow, "id" | "name" | "category" | "code" | "created_at">[];
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [members, unlocks] = await Promise.all([
    sb().from("edu_class_members").select("class_id").in("class_id", ids).is("removed_at", null),
    sb().from("edu_class_unlocks").select("class_id").in("class_id", ids),
  ]);
  const count = (list: { class_id: string }[] | null, id: string) => (list ?? []).filter((row) => row.class_id === id).length;
  return rows
    .filter((row) => isCategoryId(row.category))
    .map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category as CategoryId,
      code: row.code,
      createdAt: row.created_at,
      students: count(members.data as { class_id: string }[] | null, row.id),
      unlocked: count(unlocks.data as { class_id: string }[] | null, row.id),
    }));
}

/** Třída, kterou smí spravovat učitel (vlastní) nebo admin (každou). */
export async function classForTeacher(classId: string, actor: { userId: string; isAdmin: boolean }): Promise<ClassRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(classId)) return null;
  const { data, error } = await sb().from("edu_classes").select("*").eq("id", classId).is("archived_at", null).maybeSingle();
  if (error || !data) return null;
  const row = data as ClassRow;
  return row.teacher_id === actor.userId || actor.isAdmin ? row : null;
}

export async function classStudents(classId: string): Promise<ClassStudent[]> {
  const { data, error } = await sb()
    .from("edu_class_members")
    .select("user_id,joined_at,users(nickname)")
    .eq("class_id", classId)
    .is("removed_at", null)
    .order("joined_at");
  if (error) return [];
  return (data ?? []).map((row) => {
    const user = (Array.isArray(row.users) ? row.users[0] : row.users) as { nickname?: string | null } | null;
    return { userId: row.user_id as string, name: user?.nickname?.trim() || "", joinedAt: row.joined_at as string };
  });
}

export async function classUnlocks(classId: string): Promise<string[]> {
  const { data, error } = await sb().from("edu_class_unlocks").select("lesson_id").eq("class_id", classId);
  return error ? [] : (data ?? []).map((row) => row.lesson_id as string);
}

export async function createClass(teacherId: string, name: string, category: CategoryId): Promise<TeacherClass | null> {
  // Kolize kódu je velmi nepravděpodobná (32^8); při ní se zkusí nový.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateClassCode(randomInt);
    const { data, error } = await sb()
      .from("edu_classes")
      .insert({ teacher_id: teacherId, name, category, code })
      .select("id,name,category,code,created_at")
      .single();
    if (!error && data) {
      return { id: data.id, name: data.name, category: data.category as CategoryId, code: data.code, createdAt: data.created_at, students: 0, unlocked: 0 };
    }
    if (error?.code !== "23505") return null;
  }
  return null;
}

export async function renameClass(classId: string, name: string): Promise<boolean> {
  const { error } = await sb().from("edu_classes").update({ name }).eq("id", classId);
  return !error;
}

export async function newClassCode(classId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateClassCode(randomInt);
    const { error } = await sb().from("edu_classes").update({ code }).eq("id", classId);
    if (!error) return code;
    if (error.code !== "23505") return null;
  }
  return null;
}

export async function setUnlocked(classId: string, lessonIds: string[], unlocked: boolean, actorId: string): Promise<boolean> {
  const ids = lessonIds.filter(isAifbLessonId);
  if (ids.length === 0) return true;
  if (unlocked) {
    const { error } = await sb()
      .from("edu_class_unlocks")
      .upsert(ids.map((lesson_id) => ({ class_id: classId, lesson_id, unlocked_by: actorId })), { onConflict: "class_id,lesson_id", ignoreDuplicates: true });
    return !error;
  }
  const { error } = await sb().from("edu_class_unlocks").delete().eq("class_id", classId).in("lesson_id", ids);
  return !error;
}

export async function removeStudent(classId: string, userId: string): Promise<boolean> {
  const { error } = await sb().rpc("edu_leave_class", { p_class_id: classId, p_user_id: userId });
  return !error;
}

export async function archiveClass(classId: string): Promise<boolean> {
  const { error } = await sb().rpc("edu_archive_class", { p_class_id: classId });
  return !error;
}

export type JoinResult = { ok: true; name: string; category: CategoryId } | { ok: false; error: "unknown_code" | "own_class" | "failed" };

export async function joinClass(userId: string, code: string): Promise<JoinResult> {
  const { data, error } = await sb().rpc("edu_join_class", { p_user_id: userId, p_code: code });
  if (error || !data) return { ok: false, error: "failed" };
  const result = data as { ok: boolean; error?: string; name?: string; category?: string };
  if (!result.ok) return { ok: false, error: result.error === "own_class" ? "own_class" : "unknown_code" };
  return isCategoryId(result.category ?? "") ? { ok: true, name: result.name ?? "", category: result.category as CategoryId } : { ok: false, error: "failed" };
}

export async function leaveClass(classId: string, userId: string): Promise<boolean> {
  return removeStudent(classId, userId);
}
