import {
  gramJsonResponse, gramotnostDbOrNull, gramotnostLocale, gramPreflight, gramQuery,
} from "@/lib/edu-gramotnost-config";
import {
  contentCourseDetail, contentCourseMeta, contentLesson,
} from "@/lib/edu-gramotnost-content";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/ai-gramotnost/api/courses.php: course catalog served from the
// gramotnost MariaDB when configured, otherwise from the bundled static
// content (no-DB fallback path). Plain JSON, CORS `*`, no auth.

function safeJsonParse(text: unknown): unknown {
  if (typeof text !== "string" || text === "") return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return gramPreflight();
}

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "";
  const locale = gramotnostLocale(request);

  if (action === "list") {
    let rows: unknown[] = [];
    const db = gramotnostDbOrNull();
    if (db !== null) {
      try {
        rows = await gramQuery<RowDataPacket>(
          db,
          "SELECT id, slug, title, description, icon, color, total_xp, estimated_hours, difficulty "
          + "FROM courses WHERE is_published = 1 ORDER BY id",
        );
      } catch {
        // empty — PHP swallows Throwable and falls through to the fallback
      }
    }
    if (rows.length === 0) rows = [contentCourseMeta(locale)];
    return gramJsonResponse(rows);
  }

  if (action === "detail") {
    const slug = url.searchParams.get("slug") ?? "";
    let course: unknown = null;
    const db = gramotnostDbOrNull();
    if (db !== null) {
      try {
        const courseRows = await gramQuery<RowDataPacket & Record<string, unknown>>(
          db,
          "SELECT * FROM courses WHERE slug = ? AND is_published = 1",
          [slug],
        );
        if (courseRows.length > 0) {
          const found: RowDataPacket & Record<string, unknown> = { ...courseRows[0] };
          const chapters = await gramQuery<RowDataPacket & Record<string, unknown>>(
            db,
            "SELECT id, sort_order, title, description FROM chapters WHERE course_id = ? ORDER BY sort_order, id",
            [found.id],
          );
          for (const chapter of chapters) {
            chapter.lessons = await gramQuery<RowDataPacket>(
              db,
              "SELECT id, sort_order, title, slug, description, duration, xp_reward "
              + "FROM lessons WHERE chapter_id = ? ORDER BY sort_order, id",
              [chapter.id],
            );
          }
          found.chapters = chapters;
          course = found;
        }
      } catch {
        course = null;
      }
    }
    if (course === null) course = contentCourseDetail(locale);
    return gramJsonResponse(course);
  }

  if (action === "lesson") {
    const slug = url.searchParams.get("slug") ?? "";
    let lesson: unknown = null;
    const db = gramotnostDbOrNull();
    if (db !== null) {
      try {
        const lessonRows = await gramQuery<RowDataPacket & Record<string, unknown>>(
          db,
          "SELECT l.*, ch.title AS chapter_title FROM lessons l "
          + "JOIN chapters ch ON ch.id = l.chapter_id "
          + "JOIN courses c ON c.id = ch.course_id "
          + "WHERE l.slug = ? AND c.is_published = 1",
          [slug],
        );
        if (lessonRows.length > 0) {
          const found = { ...lessonRows[0] };
          const exercises = await gramQuery<RowDataPacket & Record<string, unknown>>(
            db,
            "SELECT id, sort_order, title, type, prompt, config, explanation, xp_reward "
            + "FROM exercises WHERE lesson_id = ? ORDER BY sort_order, id",
            [found.id],
          );
          found.exercises = exercises.map((exercise) => ({
            ...exercise,
            config: safeJsonParse(exercise.config),
          }));
          delete found.correct_answer;
          lesson = found;
        }
      } catch {
        lesson = null;
      }
    }
    if (lesson === null) lesson = contentLesson(locale, slug);
    if (lesson === null) return gramJsonResponse({ error: "Lekce nenalezena" }, 404);
    return gramJsonResponse(lesson);
  }

  return gramJsonResponse({ error: "Unknown action" }, 404);
}

export async function GET(request: Request): Promise<Response> {
  return handler(request);
}

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}