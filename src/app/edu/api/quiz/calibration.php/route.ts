import {
  QUIZ_COURSE,
  quizCalibrationSummary,
  handleQuizRequest,
  quizFindQuestion,
  quizJsonErr,
  quizJsonOk,
  quizPreflight,
  quizUserId,
} from "@/lib/edu-quiz-lib";
import { quizEvaluateQuestion } from "@/lib/edu-quiz-evaluator";
import { sbGet } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/calibration.php: confidence calibration summary over
// the wager question 6-1-q3 from 6-1-kriticke-mysleni.

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function GET(request: Request) {
  return handleQuizRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const attempts = await sbGet<Record<string, unknown>>(
      "edu_quiz_attempt",
      { user_id: userId, course: QUIZ_COURSE, lesson_slug: "6-1-kriticke-mysleni", question_id: "6-1-q3" },
      "payload_answer,created_at",
      100,
    );
    if (attempts.error) quizJsonErr(request, "Kalibrační data se nepodařilo načíst.", 503);
    const question = quizFindQuestion("6-1-kriticke-mysleni", "6-1-q3");
    const rounds: Array<{ stake: number; correct: boolean }> = [];
    if (question !== null) {
      for (const attempt of attempts.data ?? []) {
        const answer = attempt.payload_answer !== null && typeof attempt.payload_answer === "object"
          ? (attempt.payload_answer as Record<string, unknown>)
          : {};
        const evaluation = quizEvaluateQuestion(answer, question);
        const roundsDetail = Array.isArray(evaluation.detail.rounds) ? evaluation.detail.rounds : [];
        for (const round of roundsDetail as Array<Record<string, unknown>>) {
          rounds.push({
            stake: Math.trunc(Number(round.stake ?? 0)) || 0,
            correct: round.correct === true,
          });
        }
      }
    }
    return quizJsonOk(request, quizCalibrationSummary(rounds));
  });
}