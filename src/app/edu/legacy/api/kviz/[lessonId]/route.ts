import {
  legacyCatch, legacyChyba, legacyEduDb, legacyOdpoved, legacyPreflight, legacyQuery,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/kviz.php: quiz questions for a lesson.

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

export async function GET(request: Request, context: { params: Promise<{ lessonId: string }> }): Promise<Response> {
  const lessonId = Number.parseInt((await context.params).lessonId, 10) || 0;
  try {
    if (lessonId <= 0) legacyChyba(request, "Neplatné ID kvízu", 400);
    const db = legacyEduDb();

    const lessonRows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      db,
      "SELECT id, title, lesson_type, xp_reward FROM lessons WHERE id = ?",
      [lessonId],
    );
    if (lessonRows.length === 0) legacyChyba(request, "Kvíz nenalezen", 404);
    const lesson = lessonRows[0];

    const questions = await legacyQuery(
      db,
      "SELECT * FROM quizzes WHERE lesson_id = ? ORDER BY sort_order ASC",
      [lessonId],
    );
    if (questions.length === 0) legacyChyba(request, "Kvíz nemá otázky", 404);

    const courseRows = await legacyQuery<RowDataPacket & { slug: string; title: string }>(
      db,
      "SELECT slug, title FROM courses WHERE id = (SELECT course_id FROM lessons WHERE id = ?)",
      [lessonId],
    );

    return legacyOdpoved(request, {
      id: Math.trunc(Number(lesson.id)),
      title: lesson.title,
      lesson_type: lesson.lesson_type,
      course_slug: courseRows[0]?.slug ?? null,
      course_title: courseRows[0]?.title ?? null,
      xp_reward: Math.trunc(Number(lesson.xp_reward)),
      questions,
    });
  } catch (error) {
    return legacyCatch(request, error, "Chyba při načítání kvízu");
  }
}