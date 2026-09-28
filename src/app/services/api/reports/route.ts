import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, rateLimit, readJson, ServicesError, text } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set(["request", "provider", "message", "offer"]);

// Nahlášení obsahu do moderace (jedno hlášení na uživatele a cíl).
export async function POST(request: Request): Promise<Response> {
  return handleServicesWrite(request, async (session) => {
    await rateLimit("services_report", session.user.id, 10, 86400);
    const body = await readJson(request);
    const kind = typeof body.kind === "string" && KINDS.has(body.kind) ? body.kind : null;
    const target = typeof body.target === "string" && /^[A-Za-z0-9-]{1,64}$/.test(body.target) ? body.target : null;
    if (!kind || !target) throw new ServicesError(400, "invalid_input", "Neplatné nahlášení.");
    const reason = text(body.reason, "Důvod", 5, 1000);
    const { error } = await accountSupabase()
      .from("services_reports")
      .insert({ reporter_id: session.user.id, target_kind: kind, target_id: target, reason });
    if (error?.code === "23505") throw new ServicesError(409, "already_reported", "Tohle už jste nahlásili.");
    if (error) throw new Error(`report insert failed: ${error.code}`);
    return Response.json({ ok: true }, { status: 201 });
  });
}
