import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";
import { totpMethod } from "@/lib/account-totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/2fa/status.php: enabled flag, enabled_at timestamp and
// the number of unused recovery codes.

export async function GET() {
  return handleAccountRequest(async (session) => {
    const method = await totpMethod(session.user.id);
    const { data: codes, error } = await accountSupabase()
      .from("user_recovery_codes")
      .select("id")
      .eq("user_id", session.user.id)
      .is("used_at", null)
      .limit(20);
    return Response.json(
      {
        enabled: !!method && typeof method.enabled_at === "string",
        enabled_at: method?.enabled_at ?? null,
        recovery_codes_remaining: error ? 0 : (codes as unknown[] | null)?.length ?? 0,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function POST(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET" } });
}