import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { handleAccountRequest } from "@/lib/account-route";
import { ACCOUNT_LEGACY_SESSION_COOKIE, ACCOUNT_SESSION_COOKIE } from "@/lib/account-session";
import { accountSupabase, logActivity } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/sessions-revoke.php: revoke one session by id, or all
// other sessions at once (all_others). The current session can never revoke
// itself — that path is logout.

const SESSION_TOKEN_RE = /^[0-9a-f]{64}$/i;

function isoNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function currentTokenHash(): Promise<string> {
  const store = await cookies();
  const rawToken = store.get(ACCOUNT_SESSION_COOKIE)?.value ?? store.get(ACCOUNT_LEGACY_SESSION_COOKIE)?.value;
  return rawToken && SESSION_TOKEN_RE.test(rawToken)
    ? createHash("sha256").update(rawToken).digest("hex")
    : "";
}

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const currentHash = await currentTokenHash();
    const revokedAt = isoNow();

    if (body.all_others === true) {
      const now = isoNow();
      let query = accountSupabase()
        .from("sessions")
        .update({ revoked_at: revokedAt, revoked_reason: "revoke_others" })
        .eq("user_id", session.user.id)
        .is("revoked_at", null)
        .gt("expires_at", now);
      if (currentHash !== "") query = query.neq("token_hash", currentHash);
      const { error } = await query;
      if (error) return Response.json({ error: "Relace se nepodařilo ukončit." }, { status: 500 });
      await logActivity(session.user.id, "session_revoke", "All other sessions");
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }

    const sessionId = String(body.session_id ?? "");
    if (sessionId === "") return Response.json({ error: "session_id required." }, { status: 400 });

    const { data: found, error: lookupError } = await accountSupabase()
      .from("sessions")
      .select("user_id,token_hash,revoked_at,expires_at")
      .eq("id", sessionId)
      .limit(1)
      .maybeSingle();
    if (lookupError || !found) return Response.json({ error: "Relace nenalezena." }, { status: 404 });
    const s = found as { user_id: string; token_hash?: string; revoked_at: string | null };
    if (s.user_id !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
    if (s.revoked_at !== null) return Response.json({ error: "Relace již byla odvolána." }, { status: 409 });
    if (currentHash !== "" && currentHash === String(s.token_hash ?? "")) {
      return Response.json({ error: "Nemůžete zrušit aktuální relaci — použijte odhlášení." }, { status: 422 });
    }

    const { error } = await accountSupabase()
      .from("sessions")
      .update({ revoked_at: revokedAt, revoked_reason: "user_revoke" })
      .eq("id", sessionId);
    if (error) return Response.json({ error: "Relace se nepodařilo ukončit." }, { status: 500 });

    await logActivity(session.user.id, "session_revoke", `Session ${sessionId.slice(0, 8)}`);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}