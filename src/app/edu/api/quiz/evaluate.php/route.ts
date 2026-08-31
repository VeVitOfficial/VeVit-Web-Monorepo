import {
  QUIZ_COURSE,
  handleQuizWriteRequest,
  quizAwardBadge,
  quizBadgeForCalibration,
  quizCalibrationSummary,
  quizFindQuestion,
  quizJsonBody,
  quizJsonErr,
  quizPreflight,
  quizJsonOk,
  quizUpdateReviewQueue,
  quizUserId,
  quizValidateAttemptPayload,
  quizXpForQuestion,
} from "@/lib/edu-quiz-lib";
import { quizEvaluateQuestion, wordCount, type QuizEvalResult } from "@/lib/edu-quiz-evaluator";
import { sbFindOne, sbGet, sbInsert, sbRpc } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/evaluate.php: server-side answer evaluation, XP via the
// atomic record_edu_quiz_attempt RPC (client xp fields are rejected upstream),
// lesson streak, idempotent text submissions, SRS review scheduling and the
// hidden badges (detektiv-halucinaci, tokenovy-lakomec, kalibrovany).

function asDict(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toInt(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const body = await quizJsonBody(request);
    const errors = quizValidateAttemptPayload(body);
    if (errors.length > 0) quizJsonErr(request, errors[0], 422);
    const userId = quizUserId(request, session);

    const lessonSlug = body.lesson_slug as string;
    const questionId = body.question_id as string;
    const question = quizFindQuestion(lessonSlug, questionId);
    if (question === null) quizJsonErr(request, "Otázka v obsahu neexistuje.", 404);
    const previousQuestionAttempts = await sbGet(
      "edu_quiz_attempt",
      { user_id: userId, course: QUIZ_COURSE, question_id: questionId },
      "client_attempt_uuid",
      2,
    );
    if (previousQuestionAttempts.error) quizJsonErr(request, "Pokus se nepodařilo ověřit.", 503);
    const isFirstQuestionAttempt = (previousQuestionAttempts.data ?? []).length === 0;
    const result = quizEvaluateQuestion(asDict(body.answer), question);
    if (result.valid !== true) quizJsonErr(request, String(result.detail.error ?? "Neplatná odpověď."), 422);

    const isCorrect = result.correct;
    const baseXp = quizXpForQuestion(question);
    const wager = Math.max(-30, Math.min(30, toInt(result.detail.wagerXp ?? 0)));
    const isWager = question.type === "wager";
    const xpCandidate = isWager
      ? wager + (isCorrect === true ? baseXp : 0)
      : isCorrect === false
        ? 0
        : baseXp;
    const saved = await sbRpc<Record<string, unknown>[]>("record_edu_quiz_attempt", {
      p_user_id: userId,
      p_course: QUIZ_COURSE,
      p_lesson_slug: lessonSlug,
      p_question_id: questionId,
      p_client_attempt_uuid: body.client_attempt_uuid,
      p_is_correct: isCorrect,
      p_score_pct: result.scorePct,
      p_payload_answer: asDict(body.answer),
      p_wager_xp: wager,
      p_xp_candidate: xpCandidate,
      p_duration_ms: body.duration_ms ?? null,
      p_difficulty: body.difficulty ?? "both",
    });
    if (saved.error || !Array.isArray(saved.data) || saved.data.length === 0) {
      quizJsonErr(request, "Pokus se nepodařilo uložit.", 503);
    }
    const record = saved.data[0];
    const duplicate = record.duplicate === true;
    let answerForSubmission = asDict(body.answer);
    let responseResult: QuizEvalResult = result;
    if (duplicate) {
      const original = await sbFindOne<Record<string, unknown>>(
        "edu_quiz_attempt",
        { user_id: userId, client_attempt_uuid: body.client_attempt_uuid },
        "payload_answer",
      );
      const payload = original.error || original.data === null
        ? null
        : (original.data.payload_answer ?? null);
      if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
        quizJsonErr(request, "Duplicitní pokus se nepodařilo načíst.", 503);
      }
      answerForSubmission = payload as Record<string, unknown>;
      responseResult = quizEvaluateQuestion(answerForSubmission, question);
    }
    const streakRpc = await sbRpc<unknown>("record_edu_quiz_lesson_streak", {
      p_user_id: userId,
      p_course: QUIZ_COURSE,
      p_lesson_slug: lessonSlug,
    });
    let streakData: unknown = streakRpc.data ?? 0;
    if (Array.isArray(streakData)) {
      const first = streakData[0];
      streakData = first !== null && typeof first === "object"
        ? ((first as Record<string, unknown>)["record_edu_quiz_lesson_streak"] ?? streakData[0] ?? 0)
        : streakData[0] ?? 0;
    }
    const lessonStreak = streakRpc.error ? 0 : toInt(streakData);
    const submissionKind =
      question.type === "prompt_lab"
        ? "prompt_lab"
        : question.type === "open_rubric"
          ? "open"
          : question.type === "microtask"
            ? "microtask"
            : null;
    if (submissionKind !== null) {
      const submissionText = String(answerForSubmission.text ?? "").trim();
      if (submissionText !== "") {
        const existingSubmission = await sbFindOne<{ id: number }>(
          "edu_quiz_submission",
          { user_id: userId, lesson_slug: lessonSlug, question_id: questionId },
          "id",
        );
        if (existingSubmission.error) {
          quizJsonErr(request, "Pokus byl uložen, ale text odpovědi se nepodařilo ověřit.", 503);
        }
        if (!existingSubmission.data) {
          const detail = responseResult.detail;
          const selfScores = Array.isArray(detail.selfScores) ? (detail.selfScores as unknown[]) : null;
          const selfRubric = selfScores !== null
            ? { scores: selfScores, score_pct: detail.selfScorePct ?? null }
            : {};
          const storedSubmission = await sbInsert("edu_quiz_submission", {
            user_id: userId,
            lesson_slug: lessonSlug,
            question_id: questionId,
            kind: submissionKind,
            body: submissionText,
            self_rubric: selfRubric,
          });
          if (storedSubmission.error) {
            quizJsonErr(request, "Pokus byl uložen, ale text odpovědi se nepodařilo uložit.", 503);
          }
        }
      }
    }
    if (!duplicate && typeof isCorrect === "boolean") {
      try {
        await quizUpdateReviewQueue(userId, questionId, isCorrect);
        const badgeMeta = { question_id: questionId, lesson_slug: lessonSlug };
        if (question.type === "hallucination_hunt" && isCorrect === true && isFirstQuestionAttempt) {
          await quizAwardBadge(userId, "detektiv-halucinaci", badgeMeta);
        }
        if (
          question.type === "prompt_lab"
          && result.scorePct >= 100
          && wordCount(String(asDict(body.answer).text ?? "")) < 30
        ) {
          await quizAwardBadge(userId, "tokenovy-lakomec", badgeMeta);
        }
        if (lessonSlug === "6-1-kriticke-mysleni" && questionId === "6-1-q3" && Array.isArray(result.detail.rounds)) {
          const history = await sbGet<Record<string, unknown>>(
            "edu_quiz_attempt",
            { user_id: userId, course: QUIZ_COURSE, lesson_slug: "6-1-kriticke-mysleni", question_id: "6-1-q3" },
            "payload_answer,created_at",
            100,
          );
          if (history.error) throw new Error("Calibration unavailable");
          const rounds: Array<{ stake: number; correct: boolean }> = [];
          for (const attempt of history.data ?? []) {
            const checked = quizEvaluateQuestion(asDict(attempt.payload_answer), question);
            const detailRounds = Array.isArray(checked.detail.rounds) ? (checked.detail.rounds as Array<Record<string, unknown>>) : [];
            for (const round of detailRounds) {
              rounds.push({ stake: toInt(round.stake ?? 0), correct: round.correct === true });
            }
          }
          const calibration = quizCalibrationSummary(rounds);
          const calibrationBadge = quizBadgeForCalibration(calibration);
          if (calibrationBadge !== null) {
            await quizAwardBadge(userId, calibrationBadge, {
              question_id: questionId,
              lesson_slug: lessonSlug,
              mean_absolute_error_pct: calibration.mean_absolute_error_pct,
            });
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === "Calibration unavailable") {
          quizJsonErr(request, "Pokus byl uložen, ale opakování se nepodařilo připravit.", 503);
        }
        if (error instanceof Error && (error.message.startsWith("SRS ") || error.message === "Badge save failed" || error.message === "Badge lesson unavailable")) {
          quizJsonErr(request, "Pokus byl uložen, ale opakování se nepodařilo připravit.", 503);
        }
        throw error;
      }
    }
    return quizJsonOk(request, {
      duplicate,
      result: responseResult,
      xp_awarded: toInt(record.xp_awarded ?? 0),
      state: {
        xp_total: toInt(record.lesson_xp_total ?? 0),
        best_score_pct: Number(record.best_score_pct ?? 0),
        streak: lessonStreak,
        multiplier: lessonStreak >= 3 ? 1.25 : 1,
      },
    });
  });
}