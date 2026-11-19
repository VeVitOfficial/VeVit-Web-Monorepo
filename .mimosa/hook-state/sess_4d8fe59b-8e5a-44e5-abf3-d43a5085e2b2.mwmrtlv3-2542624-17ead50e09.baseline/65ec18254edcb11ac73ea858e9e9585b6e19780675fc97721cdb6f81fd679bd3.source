import {
  QUIZ_COURSE,
  QUIZ_XP,
  handleQuizWriteRequest,
  phpMbLength,
  quizJsonBody,
  quizJsonErr,
  quizPreflight,
  quizJsonOk,
  quizUserId,
} from "@/lib/edu-quiz-lib";
import { eduLesson } from "@/lib/edu-quiz-content";
import { sbFindOne, sbInsert, sbRpc } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/microtask.php: confirmed text micro-task, XP via the
// atomic attempt RPC, proof mirrored into edu_quiz_submission (idempotent).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const body = await quizJsonBody(request);
    const lessonSlug = body.lesson_slug;
    const uuid = body.client_attempt_uuid;
    const text = String(body.text ?? "").trim();
    if (typeof lessonSlug !== "string" || typeof uuid !== "string" || !UUID_RE.test(uuid)) {
      quizJsonErr(request, "Neplatný mikro-úkol.", 422);
    }
    const lesson = typeof lessonSlug === "string" ? eduLesson(lessonSlug) : null;
    const microtask = lesson !== null && lesson.microtask !== null && typeof lesson.microtask === "object"
      ? (lesson.microtask as Record<string, unknown>)
      : null;
    if (microtask === null || microtask.proof !== "text") {
      quizJsonErr(request, "Mikro-úkol v lekci neexistuje.", 404);
    }
    if (text === "" || phpMbLength(text) > 12000) {
      quizJsonErr(request, "Doplň krátký důkaz splnění mikro-úkolu.", 422);
    }
    const saved = await sbRpc<Record<string, unknown>[]>("record_edu_quiz_attempt", {
      p_user_id: userId,
      p_course: QUIZ_COURSE,
      p_lesson_slug: lessonSlug,
      p_question_id: `microtask-${lessonSlug}`,
      p_client_attempt_uuid: uuid,
      p_is_correct: null,
      p_score_pct: 100,
      p_payload_answer: { text, confirmed: true },
      p_wager_xp: 0,
      p_xp_candidate: QUIZ_XP.microtask,
      p_duration_ms: null,
      p_difficulty: "both",
    });
    if (saved.error || !Array.isArray(saved.data) || saved.data.length === 0) {
      quizJsonErr(request, "Mikro-úkol se nepodařilo uložit.", 503);
    }
    const record = saved.data[0];
    const duplicate = record.duplicate === true;
    let proofText = text;
    if (duplicate) {
      const original = await sbFindOne<Record<string, unknown>>(
        "edu_quiz_attempt",
        { user_id: userId, client_attempt_uuid: uuid },
        "payload_answer",
      );
      const payloadAnswer = original.error || original.data === null ? null : original.data.payload_answer;
      const payload = payloadAnswer !== null && typeof payloadAnswer === "object"
        ? (payloadAnswer as Record<string, unknown>)
        : null;
      if (payload === null) quizJsonErr(request, "Duplicitní mikro-úkol se nepodařilo načíst.", 503);
      proofText = String(payload.text ?? "").trim();
    }
    const existing = await sbFindOne<{ id: number }>(
      "edu_quiz_submission",
      { user_id: userId, lesson_slug: lessonSlug, question_id: "microtask" },
      "id",
    );
    if (existing.error) quizJsonErr(request, "XP bylo uloženo, ale důkaz se nepodařilo ověřit.", 503);
    if (!existing.data) {
      const submission = await sbInsert("edu_quiz_submission", {
        user_id: userId,
        lesson_slug: lessonSlug as string,
        question_id: "microtask",
        kind: "microtask",
        body: proofText,
        self_rubric: [],
      });
      if (submission.error) quizJsonErr(request, "XP bylo uloženo, ale důkaz se nepodařilo uložit.", 503);
    }
    return quizJsonOk(request, {
      duplicate,
      xp_awarded: Math.trunc(Number(record.xp_awarded ?? 0)) || 0,
      state: { xp_total: Math.trunc(Number(record.lesson_xp_total ?? 0)) || 0 },
    });
  });
}