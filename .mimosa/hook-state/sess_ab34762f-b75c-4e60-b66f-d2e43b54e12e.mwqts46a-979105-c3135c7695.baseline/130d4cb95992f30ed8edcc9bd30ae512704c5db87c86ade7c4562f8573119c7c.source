import {
  handleQuizWriteRequest,
  quizAwardVerifiedMilestone,
  quizValidateFinalReflection,
  quizValidateMilestonePayload,
  quizVerifyMilestoneSubmission,
  quizJsonBody,
  quizJsonErr,
  quizPreflight,
  quizJsonOk,
  quizUserId,
} from "@/lib/edu-quiz-lib";
import { sbFindOne, sbInsert } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/milestone.php: server-side boss/final verification,
// final-6 reflection persistence, verified badge award. The client never
// sends success flags or badge keys; everything is recomputed here.

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const body = await quizJsonBody(request);
    const errors = quizValidateMilestonePayload(body);
    if (errors.length > 0) quizJsonErr(request, errors[0], 422);
    const milestone = String(body.milestone);
    const rawAttempt = body.attempt;
    const attempt = Number.isInteger(rawAttempt) ? Math.max(1, Math.min(20, rawAttempt as number)) : 1;
    const answers = body.answers !== null && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : {};
    const verified = await quizVerifyMilestoneSubmission(milestone, answers, userId, attempt);
    if (verified === null) quizJsonErr(request, "Milník zatím nemá serverovou definici.", 409);
    const reflection = Array.isArray(body.reflection) ? (body.reflection as Record<string, unknown>[]) : [];
    if (milestone === "final-6") {
      const reflectionErrors = quizValidateFinalReflection(reflection);
      if (reflectionErrors.length > 0) quizJsonErr(request, reflectionErrors[0], 422);
      for (let index = 0; index < reflection.length; index++) {
        const entry = reflection[index];
        const questionId = `reflection-${index + 1}`;
        const existing = await sbFindOne(
          "edu_quiz_submission",
          { user_id: userId, lesson_slug: "6-4-zaverecny-test", question_id: questionId },
          "id",
        );
        if (existing.error) quizJsonErr(request, "Reflexi se nepodařilo uložit.", 503);
        if (!existing.data) {
          const savedReflection = await sbInsert("edu_quiz_submission", {
            user_id: userId,
            lesson_slug: "6-4-zaverecny-test",
            question_id: questionId,
            kind: "open",
            body: String(entry.text ?? "").trim(),
            self_rubric: { mode: "self", score: entry.score, scale: 5 },
          });
          if (savedReflection.error) quizJsonErr(request, "Reflexi se nepodařilo uložit.", 503);
        }
      }
    }
    const awarded = await quizAwardVerifiedMilestone(userId, milestone, verified.passed, {
      score_pct: verified.scorePct,
      question_count: verified.questionCount,
    });
    return quizJsonOk(request, { passed: verified.passed, score_pct: verified.scorePct, badge_awarded: awarded });
  });
}