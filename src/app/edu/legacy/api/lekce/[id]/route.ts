import {
  legacyCatch, legacyChyba, legacyEduDb, legacyGetVevitUser, legacyOdpoved, legacyPreflight,
  legacyQuery, legacyRawJson,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/lekce.php (renderLekce branch): lesson detail with
// breadcrumb course, tier gating and per-user completion state.

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

const TIER_ORDER: Record<string, number> = { free: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 };

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = Number.parseInt((await context.params).id, 10) || 0;
  try {
    if (id <= 0) legacyChyba(request, "Neplatné ID lekce", 400);
    const db = legacyEduDb();
    const user = legacyGetVevitUser(request);

    const lessonRows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      db,
      "SELECT * FROM lessons WHERE id = ?",
      [id],
    );
    if (lessonRows.length === 0) legacyChyba(request, "Lekce nenalezena", 404);
    const lesson = lessonRows[0];

    const courseRows = await legacyQuery<RowDataPacket & { slug: string; title: string }>(
      db,
      "SELECT slug, title FROM courses WHERE id = ?",
      [lesson.course_id],
    );
    lesson.course = courseRows[0] ?? null;

    const requiresTier = lesson.requires_tier ?? "free";
    const userTier = user && typeof user.tier === "string" ? (user.tier as string) : "free";
    if (requiresTier !== "free") {
      const userTierLevel = TIER_ORDER[userTier] ?? 0;
      const requiredTierLevel = TIER_ORDER[String(requiresTier)] ?? 0;
      if (userTierLevel < requiredTierLevel) {
        const capitalized = requiresTier.length > 0
          ? requiresTier.charAt(0).toUpperCase() + requiresTier.slice(1)
          : requiresTier;
        return legacyRawJson(
          request,
          {
            ok: false,
            error: "premium_required",
            requires_tier: requiresTier,
            user_tier: userTier,
            message: `Tato lekce vyžaduje ${capitalized} předplatné.`,
            upgrade_url: "https://account.vevit.fun/premium.html",
          },
          403,
        );
      }
    }

    lesson.requires_tier = requiresTier;
    lesson.locked = false;

    if (lesson.lesson_type === "quiz" || lesson.lesson_type === "final_quiz") {
      lesson.quizzes = await legacyQuery(
        db,
        "SELECT * FROM quizzes WHERE lesson_id = ? ORDER BY sort_order ASC",
        [id],
      );
    }

    if (user) {
      const progressRows = await legacyQuery<RowDataPacket & { completed_at: Date | string | null }>(
        db,
        "SELECT completed_at FROM user_progress WHERE user_id = ? AND lesson_id = ?",
        [user.id, id],
      );
      lesson.dokonceno = progressRows.length > 0;
      lesson.completed_at = progressRows.length > 0 ? progressRows[0].completed_at : null;
    }

    return legacyOdpoved(request, lesson);
  } catch (error) {
    return legacyCatch(request, error, "Chyba při načítání lekce");
  }
}