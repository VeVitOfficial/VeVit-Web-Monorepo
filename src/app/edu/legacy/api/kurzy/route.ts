import {
  legacyCatch, legacyEduDb, legacyGetVevitUser, legacyOdpoved, legacyPreflight, legacyQuery,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/kurzy.php (list branch): all active courses plus
// completed-lesson counts for the logged-in legacy user.

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const courses = await legacyQuery(
      legacyEduDb(),
      "SELECT * FROM courses WHERE is_active = 1 ORDER BY sort_order ASC",
    );
    const user = legacyGetVevitUser(request);
    if (user) {
      const progressRows = await legacyQuery<RowDataPacket & { course_id: string; completed: number }>(
        legacyEduDb(),
        "SELECT course_id, COUNT(*) as completed FROM user_progress WHERE user_id = ? GROUP BY course_id",
        [user.id],
      );
      const progress = new Map(progressRows.map((row) => [row.course_id, Math.trunc(Number(row.completed))]));
      for (const course of courses) {
        (course as Record<string, unknown>).completed_lessons = progress.get(course.id as string) ?? 0;
      }
    }
    return legacyOdpoved(request, courses);
  } catch (error) {
    return legacyCatch(request, error, "Chyba při načítání kurzů");
  }
}