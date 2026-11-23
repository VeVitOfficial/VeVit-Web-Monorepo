import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/export-data.php: GDPR data export as a downloadable
// JSON attachment — user row plus every user-scoped table (≤1000 rows each).
// $res['data'] ?? [] semantics: a failed table simply exports as [].

const TABLES: Array<{ table: string; columns: string | "*"; key: string }> = [
  { table: "premium_subscriptions", columns: "*", key: "premium_subscriptions" },
  { table: "cal_events", columns: "*", key: "cal_events" },
  { table: "cal_reminders", columns: "*", key: "cal_reminders" },
  { table: "certificates", columns: "*", key: "certificates" },
  { table: "lesson_comments", columns: "*", key: "lesson_comments" },
  { table: "games_stats", columns: "*", key: "games_stats" },
  { table: "store_orders", columns: "*", key: "store_orders" },
  { table: "daily_bonus_log", columns: "*", key: "daily_bonus_log" },
  { table: "ai_usage_log", columns: "*", key: "ai_usage_log" },
  { table: "sessions", columns: "id,created_at,expires_at,remember,ip_address,user_agent,last_seen_at", key: "sessions" },
  { table: "account_activity", columns: "kind,detail,created_at", key: "account_activity" },
  { table: "user_notification_prefs", columns: "security_alerts,product_updates,marketing,billing_summary", key: "user_notification_prefs" },
  { table: "oauth_identities", columns: "provider,provider_user_id,provider_email,created_at,updated_at", key: "oauth_identities" },
  { table: "user_preferences", columns: "timezone,date_format,week_starts_on,region,updated_at", key: "user_preferences" },
];

export async function POST() {
  return handleAccountRequest(async (session) => {
    const uid = session.user.id;
    const sb = accountSupabase();

    const { data: user } = await sb.from("users").select("*").eq("id", uid).limit(1);

    const exportData: Record<string, unknown> = {
      user: user?.[0] ?? null,
      exported_at: new Date().toISOString(),
    };
    for (const { table, columns, key } of TABLES) {
      const { data } = await sb.from(table).select(columns).eq("user_id", uid).limit(1000);
      exportData[key] = data ?? [];
    }

    const today = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="vevit-export-${today}.json"`,
        "Cache-Control": "no-store",
      },
    });
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}