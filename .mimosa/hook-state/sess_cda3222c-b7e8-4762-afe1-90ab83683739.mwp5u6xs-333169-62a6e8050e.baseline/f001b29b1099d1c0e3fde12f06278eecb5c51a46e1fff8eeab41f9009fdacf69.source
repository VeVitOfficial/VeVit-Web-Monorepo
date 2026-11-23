import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase, logActivity } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/connections-disconnect.php: unlink an OAuth provider,
// refusing to remove the last remaining login method when no password is set.

const OAUTH_PROVIDERS = new Set(["google", "github", "discord"]);

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const provider = String(body.provider ?? "").toLowerCase();
    if (!OAUTH_PROVIDERS.has(provider)) {
      return Response.json({ error: "Neplatný poskytovatel." }, { status: 422 });
    }

    const { data: connections, error: connectionsError } = await accountSupabase()
      .from("oauth_identities")
      .select("provider")
      .eq("user_id", session.user.id)
      .limit(10);
    if (connectionsError) {
      return Response.json({ error: "Propojené účty se nepodařilo načíst." }, { status: 400 });
    }

    const { data: passwordRow, error: passwordError } = await accountSupabase()
      .from("users")
      .select("password")
      .eq("id", session.user.id)
      .limit(1)
      .maybeSingle();
    if (passwordError) return Response.json({ error: "Stav přihlášení se nepodařilo načíst." }, { status: 400 });

    const password = (passwordRow as { password?: string } | null)?.password;
    const hasPassword = typeof password === "string" && password !== "";
    if (!hasPassword && (connections?.length ?? 0) <= 1) {
      return Response.json({ error: "Nelze odpojit poslední způsob přihlášení." }, { status: 422 });
    }

    const { error: deleteError } = await accountSupabase()
      .from("oauth_identities")
      .delete()
      .eq("user_id", session.user.id)
      .eq("provider", provider);
    if (deleteError) return Response.json({ error: "Účet se nepodařilo odpojit." }, { status: 400 });

    await logActivity(session.user.id, "oauth_disconnect", `OAuth ${provider}`);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}