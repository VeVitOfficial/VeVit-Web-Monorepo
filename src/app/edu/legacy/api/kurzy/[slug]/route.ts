import {
  legacyCatch, legacyChyba, legacyEduDb, legacyGetVevitUser, legacyOdpoved, legacyPreflight, legacyQuery,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/kurzy.php (course-detail branch): course payload,
// lessons with tier locking, per-lesson completion and quiz attachments.

type CourseRow = RowDataPacket & Record<string, unknown>;
type LessonRow = RowDataPacket & Record<string, unknown>;

const TIER_ORDER: Record<string, number> = { free: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 };

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await context.params;
  try {
    const db = legacyEduDb();
    const user = legacyGetVevitUser(request);

    const courseRows = await legacyQuery<CourseRow>(db, "SELECT * FROM courses WHERE slug = ? AND is_active = 1", [slug]);
    if (courseRows.length === 0) legacyChyba(request, "Kurz nenalezen", 404);
    const course = courseRows[0];

    const lessons = await legacyQuery<LessonRow>(
      db,
      "SELECT id, course_id, title, lesson_type, sort_order, xp_reward, duration_minutes, requires_tier "
      + "FROM lessons WHERE course_id = ? ORDER BY sort_order ASC",
      [course.id],
    );

    const userTier = user && typeof user.tier === "string" ? (user.tier as string) : "free";
    const userTierLevel = TIER_ORDER[userTier] ?? 0;
    for (const lesson of lessons) {
      const reqTier = lesson.requires_tier ?? "free";
      const reqLevel = TIER_ORDER[String(reqTier)] ?? 0;
      lesson.locked = userTierLevel < reqLevel;
      lesson.requires_tier = reqTier;
    }

    if (user) {
      if (lessons.length > 0) {
        const placeholders = lessons.map(() => "?").join(",");
        const progressRows = await legacyQuery<RowDataPacket & { lesson_id: string; completed_at: Date | string | null }>(
          db,
          `SELECT lesson_id, completed_at FROM user_progress WHERE user_id = ? AND lesson_id IN (${placeholders})`,
          [user.id, ...lessons.map((lesson) => lesson.id)],
        );
        const completedMap = new Map(progressRows.map((row) => [row.lesson_id, row.completed_at]));
        for (const lesson of lessons) {
          lesson.dokonceno = completedMap.has(lesson.id);
          lesson.completed_at = completedMap.get(lesson.id) ?? null;
        }
      }
    } else {
      for (const lesson of lessons) {
        lesson.dokonceno = false;
        lesson.completed_at = null;
      }
    }

    const quizLessons = lessons.filter(
      (lesson) => lesson.lesson_type === "quiz" || lesson.lesson_type === "final_quiz",
    );
    if (quizLessons.length > 0) {
      const placeholders = quizLessons.map(() => "?").join(",");
      const quizzes = await legacyQuery<RowDataPacket>(
        db,
        `SELECT * FROM quizzes WHERE lesson_id IN (${placeholders}) ORDER BY sort_order ASC`,
        quizLessons.map((lesson) => lesson.id),
      );
      const quizzesByLesson = new Map<string, RowDataPacket[]>();
      for (const quiz of quizzes) {
        const list = quizzesByLesson.get(quiz.lesson_id as string) ?? [];
        list.push(quiz);
        quizzesByLesson.set(quiz.lesson_id as string, list);
      }
      for (const lesson of lessons) {
        const list = quizzesByLesson.get(lesson.id as string);
        if (list) lesson.quizzes = list;
      }
    }

    course.lessons = lessons;
    return legacyOdpoved(request, course);
  } catch (error) {
    return legacyCatch(request, error, "Chyba při načítání kurzu");
  }
}