import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase, verifyBcrypt } from "@/lib/account-auth";
import { destroyedSessionResponse } from "@/lib/account-session-destroy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/delete-account.php: explicit "SMAZAT" confirmation,
// password re-check when the account has one, session teardown before the
// delete_user_account RPC.

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    if (body.confirmation !== "SMAZAT") {
      return Response.json({ error: "Pro smazání napište SMAZAT.", field: "confirmation" }, { status: 422 });
    }

    const { data: row, error: fetchError } = await accountSupabase()
      .from("users")
      .select("password")
      .eq("id", session.user.id)
      .limit(1)
      .maybeSingle();
    if (fetchError) return Response.json({ error: "Účet se nepodařilo ověřit." }, { status: 500 });
    const hash = (row as Record<string, unknown> | null)?.password;
    if (typeof hash === "string" && hash !== "") {
      const provided = typeof body.current_password === "string" ? body.current_password : "";
      if (!(await verifyBcrypt(provided, hash))) {
        return Response.json({ error: "Současné heslo je nesprávné.", field: "current_password" }, { status: 401 });
      }
    }

    // Clear the session cookie BEFORE deleting the account (PHP order).
    const response = destroyedSessionResponse();

    const { data, error: rpcError } = await accountSupabase().rpc("delete_user_account", {
      target_id: session.user.id,
    });
    if (rpcError || (data !== true && data !== null)) {
      console.error("delete_user_account RPC failed", session.user.id);
      return Response.json({ error: "Smazání selhalo. Kontaktujte podporu." }, { status: 500 });
    }
    return response;
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}