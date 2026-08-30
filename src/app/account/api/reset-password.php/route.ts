import { createHash } from "node:crypto";
import { AccountBackendUnavailableError } from "@/lib/account-session";
import { accountSupabase, logActivity } from "@/lib/account-auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/reset-password.php (token-based reset, no session):
// verify the reset token, set the new bcrypt hash, clear the token and revoke
// every session (force re-login everywhere). NOTE: password length ≥ 8 only —
// the legacy endpoint applies no complexity rule here.

export async function POST(request: Request) {
  // Token reset runs unauthenticated, so no handleAccountRequest() here.
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const rawToken = typeof body.token === "string" ? body.token : "";
    const newPass = typeof body.new_password === "string" ? body.new_password : "";

    if (rawToken.length !== 64) {
      return Response.json({ error: "Neplatný nebo expirovaný odkaz." }, { status: 400 });
    }
    if (newPass.length < 8) {
      return Response.json({ error: "Heslo musí mít alespoň 8 znaků.", field: "new_password" }, { status: 422 });
    }

    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const now = new Date().toISOString();

    const { data: rows, error: findError } = await accountSupabase()
      .from("users")
      .select("id")
      .eq("reset_token_hash", tokenHash)
      .gt("reset_token_expires_at", now)
      .limit(1);
    if (findError) throw findError;
    const userId = (rows?.[0] as { id: string } | undefined)?.id;
    if (!userId) return Response.json({ error: "Neplatný nebo expirovaný odkaz." }, { status: 400 });

    const newHash = await bcrypt.hash(newPass, 10);
    const { error: updateError } = await accountSupabase()
      .from("users")
      .update({
        password: newHash,
        reset_token_hash: null,
        reset_token_expires_at: null,
      })
      .eq("id", userId);
    if (updateError) throw updateError;

    // Revoke all sessions (force re-login everywhere) — PHP does sb_delete.
    await accountSupabase().from("sessions").delete().eq("user_id", userId);

    await logActivity(userId, "password_change", "Via password reset");
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) {
      return Response.json({ error: "Service temporarily unavailable", code: "ACCOUNT_BACKEND_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Account route failed", { message: error instanceof Error ? error.message : String(error) });
    return Response.json({ error: "Chyba serveru." }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}