import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/connections.php: linked OAuth identities keyed by
// provider plus whether the account still has a password to fall back to.

const OAUTH_PROVIDERS = new Set(["google", "github", "discord"]);

export async function GET() {
  return handleAccountRequest(async (session) => {
    const { data, error } = await accountSupabase()
      .from("oauth_identities")
      .select("provider,provider_email,created_at,updated_at")
      .eq("user_id", session.user.id)
      .limit(10);
    if (error) return Response.json({ error: "Propojené účty se nepodařilo načíst." }, { status: 400 });

    const byProvider: Record<string, unknown> = {};
    for (const row of data as Record<string, unknown>[]) {
      const provider = String(row.provider ?? "");
      if (OAUTH_PROVIDERS.has(provider)) byProvider[provider] = row;
    }

    const { data: passwordRow, error: passwordError } = await accountSupabase()
      .from("users")
      .select("password")
      .eq("id", session.user.id)
      .limit(1)
      .maybeSingle();
    if (passwordError) return Response.json({ error: "Stav přihlášení se nepodařilo načíst." }, { status: 400 });

    const password = (passwordRow as { password?: string } | null)?.password;
    return Response.json(
      { connections: byProvider, has_password: typeof password === "string" && password !== "" },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function POST(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET" } });
}