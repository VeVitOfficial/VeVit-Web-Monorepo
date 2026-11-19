import { quizJsonErr, quizJsonOk, quizPreflight, handleQuizRequest } from "@/lib/edu-quiz-lib";
import { sbRpc } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/poll.php: anonymized option distribution for a poll
// question (no session user id required beyond auth).

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function GET(request: Request) {
  return handleQuizRequest(request, async () => {
    const questionId = new URL(request.url).searchParams.get("question_id") ?? "";
    if (!/^[1-6]-[0-9]+-q[0-9]+$/.test(questionId)) quizJsonErr(request, "Neplatná otázka.", 422);
    const result = await sbRpc<unknown>("edu_quiz_poll_distribution", { p_question_id: questionId });
    if (result.error) quizJsonErr(request, "Rozložení odpovědí se nepodařilo načíst.", 503);
    return quizJsonOk(request, { distribution: result.data ?? [] });
  });
}