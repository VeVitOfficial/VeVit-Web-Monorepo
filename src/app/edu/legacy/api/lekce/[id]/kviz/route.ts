import {
  legacyCatch, legacyChyba, legacyEduDb, legacyOdpoved, legacyQuery,
} from "@/lib/edu-legacy-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/lekce.php (renderKviz /lekce/{id}/kviz branch).

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const lessonId = Number.parseInt((await context.params).id, 10) || 0;
  try {
    const questions = await legacyQuery(
      legacyEduDb(),
      "SELECT * FROM quizzes WHERE lesson_id = ? ORDER BY sort_order ASC",
      [lessonId],
    );
    if (questions.length === 0) legacyChyba(request, "Kvíz nemá otázky", 404);
    return legacyOdpoved(request, questions);
  } catch (error) {
    return legacyCatch(request, error, "Chyba při načítání kvízu");
  }
}