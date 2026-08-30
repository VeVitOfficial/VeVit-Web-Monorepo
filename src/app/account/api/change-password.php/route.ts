import bcrypt from "bcryptjs";
import { handleAccountRequest } from "@/lib/account-route";
import {
  accountSupabase,
  logActivity,
  registerPasswordError,
  verifyBcrypt,
} from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/change-password.php: verify the current password, apply
// the shared password policy to the new one, hash + store + activity log.

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const currentPass = typeof body.current_password === "string" ? body.current_password : "";
    const newPass = typeof body.new_password === "string" ? body.new_password : "";

    const passwordError = registerPasswordError(newPass);
    if (passwordError !== null) {
      return Response.json({ error: passwordError, field: "new_password" }, { status: 422 });
    }

    const { data: row, error: lookupError } = await accountSupabase()
      .from("users")
      .select("password")
      .eq("id", session.user.id)
      .limit(1)
      .maybeSingle();
    if (lookupError || !row) return Response.json({ error: "Chyba serveru." }, { status: 500 });

    const existingHash = (row as { password?: string }).password;
    if (typeof existingHash === "string" && existingHash !== "") {
      if (!(await verifyBcrypt(currentPass, existingHash))) {
        return Response.json({ error: "Současné heslo je nesprávné.", field: "current_password" }, { status: 401 });
      }
    } else if (currentPass !== "") {
      return Response.json({ error: "Tento účet zatím nemá nastavené heslo.", field: "current_password" }, { status: 422 });
    }

    const newHash = await bcrypt.hash(newPass, 10);
    const { error: updateError } = await accountSupabase()
      .from("users")
      .update({ password: newHash })
      .eq("id", session.user.id);
    if (updateError) return Response.json({ error: "Chyba serveru." }, { status: 500 });

    await logActivity(session.user.id, "password_change", "Via settings");
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}