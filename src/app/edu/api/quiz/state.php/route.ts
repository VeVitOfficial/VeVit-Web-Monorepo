import { QUIZ_COURSE, quizJsonErr, quizJsonOk, quizPreflight, quizUserId, handleQuizRequest } from "@/lib/edu-quiz-lib";
import { sbGet } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/state.php: lesson states, badges, review queue and the
// current correct-answer streak (most recent attempts first, stop on a wrong
// answer, null results skipped).

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function GET(request: Request) {
  return handleQuizRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const states = await sbGet<Record<string, unknown>>(
      "edu_quiz_lesson_state",
      { user_id: userId, course: QUIZ_COURSE },
      "lesson_slug,status,xp_total,best_score_pct,completed_at,updated_at",
      200,
    );
    if (states.error) quizJsonErr(request, "Postup se nepodařilo načíst.", 503);
    const badges = await sbGet<Record<string, unknown>>("edu_quiz_badge", { user_id: userId }, "badge_key,awarded_at,meta", 100);
    if (badges.error) quizJsonErr(request, "Odznaky se nepodařilo načíst.", 503);
    const reviews = await sbGet<Record<string, unknown>>(
      "edu_quiz_review_queue",
      { user_id: userId },
      "question_id,due_at,interval_days,last_result",
      200,
    );
    if (reviews.error) quizJsonErr(request, "Opakování se nepodařilo načíst.", 503);
    const attempts = await sbGet<Record<string, unknown>>("edu_quiz_attempt", { user_id: userId }, "is_correct,created_at", 100);
    if (attempts.error) quizJsonErr(request, "Streak se nepodařilo načíst.", 503);
    const bytewise = (left: string, right: string) => (left < right ? -1 : left > right ? 1 : 0);
    const attemptRows = [...(attempts.data ?? [])].sort((a, b) =>
      bytewise(String(b.created_at ?? ""), String(a.created_at ?? "")),
    );
    let streak = 0;
    for (const attempt of attemptRows) {
      if (attempt.is_correct === true) streak++;
      else if (attempt.is_correct === false) break;
    }
    return quizJsonOk(request, {
      states: states.data ?? [],
      badges: badges.data ?? [],
      reviews: reviews.data ?? [],
      streak,
    });
  });
}