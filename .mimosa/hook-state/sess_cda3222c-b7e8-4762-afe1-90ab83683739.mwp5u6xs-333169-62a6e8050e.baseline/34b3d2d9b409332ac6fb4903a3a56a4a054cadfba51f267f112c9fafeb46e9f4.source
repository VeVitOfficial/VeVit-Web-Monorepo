import "server-only";

// Třídy učitele (migrace 025 a 029) z pohledu lekcí AIFB: třídy žáka a jeho odemčené lekce,
// odemykání lekcí třídě. Školy, žáky a zakládání tříd řeší src/lib/edu/school/store.ts.
// Chyba čtení = žádné třídy (student pak nevidí nic odemčeného, nikdy víc).

import { accountSupabase } from "@/lib/account-auth";
import { isAifbLessonId, type StudentClass } from "./access";
import { isCategoryId } from "./types";

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
  // Zadaná lekce (migrace 029) je zároveň odemčená.
  const ids = classes.map((item) => item.id);
  const [unlocks, assignments] = await Promise.all([
    sb().from("edu_class_unlocks").select("lesson_id").in("class_id", ids),
    sb().from("edu_class_assignments").select("lesson_id").in("class_id", ids),
  ]);
  if (unlocks.error) return { classes, unlocked: new Set() };
  return {
    classes,
    unlocked: new Set([...(unlocks.data ?? []), ...(assignments.error ? [] : assignments.data ?? [])].map((row) => row.lesson_id as string)),
  };
}

export async function classUnlocks(classId: string): Promise<string[]> {
  const { data, error } = await sb().from("edu_class_unlocks").select("lesson_id").eq("class_id", classId);
  return error ? [] : (data ?? []).map((row) => row.lesson_id as string);
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
