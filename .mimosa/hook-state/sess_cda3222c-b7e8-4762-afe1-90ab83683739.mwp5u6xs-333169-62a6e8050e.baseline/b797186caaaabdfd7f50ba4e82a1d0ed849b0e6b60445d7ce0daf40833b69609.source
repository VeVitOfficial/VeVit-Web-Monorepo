import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";
import { getUserAccess } from "@/lib/permissions";
import { levelProgress } from "@/lib/ranks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// XP overview for the account dashboard: level progress, ranks, tier,
// permissions, XP gained in the last 7 days and the latest ledger rows.

type LedgerRow = { source: string; base_amount: number; bonus_amount: number; created_at: string };

export async function GET() {
  return handleAccountRequest(async (session) => {
    const userId = session.user.id;
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const [access, recent, week] = await Promise.all([
      getUserAccess(userId),
      accountSupabase()
        .from("xp_ledger")
        .select("source,base_amount,bonus_amount,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      accountSupabase()
        .from("xp_ledger")
        .select("base_amount,bonus_amount")
        .eq("user_id", userId)
        .gte("created_at", since)
        .limit(1000),
    ]);
    if (recent.error || week.error) return Response.json({ error: "Chyba serveru." }, { status: 500 });

    const weekXp = (week.data as Pick<LedgerRow, "base_amount" | "bonus_amount">[])
      .reduce((sum, row) => sum + row.base_amount + row.bonus_amount, 0);

    return Response.json(
      {
        progress: levelProgress(Number(session.user.xp) || 0),
        week_xp: weekXp,
        access,
        recent: (recent.data as LedgerRow[]).map((row) => ({
          source: row.source,
          amount: row.base_amount + row.bonus_amount,
          bonus: row.bonus_amount,
          created_at: row.created_at,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function POST(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET" } });
}
