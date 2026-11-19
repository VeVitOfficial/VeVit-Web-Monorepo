import {
  QUIZ_COURSE,
  QUIZ_XP,
  handleQuizRequest,
  handleQuizWriteRequest,
  quizJsonBody,
  quizJsonErr,
  quizJsonOk,
  quizPreflight,
  quizUpdateReviewQueue,
  quizUserId,
  quizWarmupQuestions,
} from "@/lib/edu-quiz-lib";
import { quizEvaluateQuestion } from "@/lib/edu-quiz-evaluator";
import { sbGet, sbRpc } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/warmup.php: spaced-repetition warmup selection (GET)
// and single-shot evaluation of all warmup answers (POST, XP only when all
// three are correct).

const LESSON_PATH_RE = /^[1-6]-[0-9]+-[a-z0-9-]+$/;
const WARMUP_UUID_RE = /^[0-9a-f-]{36}$/i;

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function GET(request: Request) {
  return handleQuizRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const lesson = new URL(request.url).searchParams.get("lesson_slug") ?? "";
    if (typeof lesson !== "string" || !LESSON_PATH_RE.test(lesson)) {
      quizJsonErr(request, "Neplatná lekce.", 422);
    }
    const attempts = await sbGet<Record<string, unknown>>(
      "edu_quiz_attempt",
      { user_id: userId, course: QUIZ_COURSE },
      "question_id,is_correct,created_at",
      300,
    );
    const reviews = await sbGet<Record<string, unknown>>(
      "edu_quiz_review_queue",
      { user_id: userId },
      "question_id,due_at,last_result",
      300,
    );
    if (attempts.error || reviews.error) quizJsonErr(request, "Rozcvičku se nepodařilo připravit.", 503);
    return quizJsonOk(request, {
      questions: quizWarmupQuestions(lesson, userId, attempts.data ?? [], reviews.data ?? []),
    });
  });
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const body = await quizJsonBody(request);
    const lesson = body.lesson_slug;
    const answers = body.answers !== null && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : null;
    const uuid = body.client_attempt_uuid;
    if (typeof lesson !== "string" || answers === null || typeof uuid !== "string" || !WARMUP_UUID_RE.test(uuid)) {
      quizJsonErr(request, "Neplatná rozcvička.", 422);
    }
    const attempts = await sbGet<Record<string, unknown>>(
      "edu_quiz_attempt",
      { user_id: userId, course: QUIZ_COURSE },
      "question_id,is_correct,created_at",
      300,
    );
    const reviews = await sbGet<Record<string, unknown>>(
      "edu_quiz_review_queue",
      { user_id: userId },
      "question_id,due_at,last_result",
      300,
    );
    if (attempts.error || reviews.error) quizJsonErr(request, "Rozcvičku se nepodařilo ověřit.", 503);
    const questions = quizWarmupQuestions(lesson, userId, attempts.data ?? [], reviews.data ?? []);
    if (questions.length < 2) quizJsonErr(request, "Rozcvička nemá dost kandidátů.", 409);
    let correct = 0;
    for (const question of questions) {
      const questionId = String(question.id);
      const answer = answers[questionId];
      if (answer === null || typeof answer !== "object" || Array.isArray(answer)) {
        quizJsonErr(request, "Chybí odpověď rozcvičky.", 422);
      }
      const result = quizEvaluateQuestion(answer as Record<string, unknown>, question);
      if (result.valid !== true) quizJsonErr(request, "Neplatná odpověď rozcvičky.", 422);
      if (result.correct === true) correct++;
      await quizUpdateReviewQueue(userId, questionId, result.correct === true);
    }
    const score = Math.round((100 * correct) / questions.length);
    const award = correct === questions.length ? QUIZ_XP.warmup : 0;
    const saved = await sbRpc<Record<string, unknown>[]>("record_edu_quiz_attempt", {
      p_user_id: userId,
      p_course: QUIZ_COURSE,
      p_lesson_slug: lesson,
      p_question_id: `warmup-${lesson}`,
      p_client_attempt_uuid: uuid,
      p_is_correct: null,
      p_score_pct: score,
      p_payload_answer: answers,
      p_wager_xp: 0,
      p_xp_candidate: award,
      p_duration_ms: null,
      p_difficulty: "both",
    });
    if (saved.error || !Array.isArray(saved.data) || saved.data.length === 0) {
      quizJsonErr(request, "Rozcvičku se nepodařilo uložit.", 503);
    }
    const record = saved.data[0];
    return quizJsonOk(request, {
      score_pct: score,
      xp_awarded: Math.trunc(Number(record.xp_awarded ?? 0)) || 0,
      duplicate: record.duplicate === true,
    });
  });
}