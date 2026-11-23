import { timingSafeEqual } from "node:crypto";
import { handleQuizPublicRequest, quizJsonBody, quizJsonErr,
  quizPreflight, quizJsonOk, quizIsoNow } from "@/lib/edu-quiz-lib";
import { sbGet, sbUpdate } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/predictions/dispatch.php: cron-style endpoint, no
// session auth — guarded by the X-Quiz-Dispatch-Secret header against the
// QUIZ_DISPATCH_SECRET env (>= 32 chars). Acknowledged ids get delivered_at,
// the response lists everything now due.

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

const ACK_ID_RE = /^[0-9a-f-]{36}$/i;

export async function POST(request: Request) {
  return handleQuizPublicRequest(request, async () => {
    if (request.method.toUpperCase() !== "POST") {
      quizJsonErr(request, "Method not allowed", 405, { Allow: "POST" });
    }
    const configured = process.env.QUIZ_DISPATCH_SECRET?.trim() ?? "";
    const provided = request.headers.get("x-quiz-dispatch-secret") ?? "";
    if (configured.length < 32 || !provided || provided.length !== configured.length
      || !timingSafeEqual(Buffer.from(provided), Buffer.from(configured))) {
      quizJsonErr(request, "Unauthorized", 401);
    }
    const body = await quizJsonBody(request);
    const ackIds = Array.isArray(body.ack_ids) ? (body.ack_ids as unknown[]) : [];
    for (const id of ackIds) {
      if (typeof id === "string" && ACK_ID_RE.test(id)) {
        await sbUpdate("edu_quiz_prediction", { id }, { delivered_at: quizIsoNow() });
      }
    }
    const rows = await sbGet<Record<string, unknown>>(
      "edu_quiz_prediction",
      {},
      "id,user_id,body,deliver_at,delivered_at",
      1000,
    );
    if (rows.error) quizJsonErr(request, "Dispatch unavailable", 503);
    const now = Date.now();
    const due = (rows.data ?? []).filter((row) => {
      if (row.delivered_at !== null && row.delivered_at !== undefined) return false;
      const deliverMs = Date.parse(String(row.deliver_at ?? ""));
      return !Number.isNaN(deliverMs) && deliverMs <= now;
    });
    return quizJsonOk(request, { items: due, ack_required: true });
  });
}