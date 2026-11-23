import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";
import { consoleActor, consoleNotFound } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Console dashboard numbers: users by status and tier, new sign-ups, XP
// awarded in the last 24 h / 7 days, active subscriptions and organizations.

export async function GET() {
  return handleAccountRequest(async (session) => {
    const actor = await consoleActor(session);
    if (!actor) return consoleNotFound();
    const sb = accountSupabase();
    const day = new Date(Date.now() - 86_400_000).toISOString();
    const week = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [users, newWeek, blocked, subs, orgs, xpDay, xpWeek, tiers] = await Promise.all([
      sb.from("users").select("id", { count: "exact", head: true }),
      sb.from("users").select("id", { count: "exact", head: true }).gte("created_at", week),
      sb.from("users").select("id", { count: "exact", head: true }).eq("status", "blocked"),
      sb.from("premium_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("organizations").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("xp_ledger").select("base_amount,bonus_amount").gte("created_at", day).limit(10000),
      sb.from("xp_ledger").select("base_amount,bonus_amount").gte("created_at", week).limit(50000),
      sb.from("users").select("tier").neq("tier", "free").limit(10000),
    ]);

    const sum = (rows: unknown) =>
      Array.isArray(rows)
        ? (rows as { base_amount: number; bonus_amount: number }[]).reduce((s, r) => s + r.base_amount + r.bonus_amount, 0)
        : 0;
    const byTier: Record<string, number> = {};
    for (const row of (tiers.data ?? []) as { tier: string }[]) byTier[row.tier] = (byTier[row.tier] ?? 0) + 1;

    return Response.json(
      {
        actor: { is_owner: actor.isOwner, is_admin: actor.isAdmin, ranks: actor.access.ranks },
        users_total: users.count ?? 0,
        users_new_7d: newWeek.count ?? 0,
        users_blocked: blocked.count ?? 0,
        subscriptions_active: subs.count ?? 0,
        organizations_active: orgs.count ?? 0,
        xp_24h: sum(xpDay.data),
        xp_7d: sum(xpWeek.data),
        paid_users_by_tier: byTier,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
