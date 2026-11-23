import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/notifications.php: user_notification_prefs with
// defaults on GET, partial update (bool fields only) on POST/PATCH.

const DEFAULTS: Record<string, boolean | string> = {
  security_alerts: true,
  product_updates: true,
  marketing: false,
  billing_summary: true,
};

export async function GET() {
  return handleAccountRequest(async (session) => {
    const { data, error } = await accountSupabase()
      .from("user_notification_prefs")
      .select("*")
      .eq("user_id", session.user.id)
      .limit(1)
      .maybeSingle();
    if (error) return Response.json({ error: "Chyba serveru." }, { status: 400 });
    const row = (data as Record<string, unknown> | null) ?? DEFAULTS;
    return Response.json(
      { prefs: { ...DEFAULTS, ...row, user_id: undefined } },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

async function save(request: Request): Promise<Response> {
  return handleAccountRequest(async (session) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const allowed = ["product_updates", "marketing", "billing_summary"];
    const patch: Record<string, unknown> = { user_id: session.user.id };
    for (const key of allowed) {
      if (key in body) patch[key] = body[key] === true;
    }

    const { data: existing, error: lookupError } = await accountSupabase()
      .from("user_notification_prefs")
      .select("user_id")
      .eq("user_id", session.user.id)
      .limit(1)
      .maybeSingle();
    if (lookupError) return Response.json({ error: "Uložení selhalo." }, { status: 400 });

    const result = existing
      ? await accountSupabase()
          .from("user_notification_prefs")
          .update(patch)
          .eq("user_id", session.user.id)
      : await accountSupabase()
          .from("user_notification_prefs")
          .insert({ ...DEFAULTS, ...patch });
    if (result.error) return Response.json({ error: "Uložení selhalo." }, { status: 400 });

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  });
}

export const POST = save;
export const PATCH = save;

export async function DELETE(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET, POST, PATCH" } });
}