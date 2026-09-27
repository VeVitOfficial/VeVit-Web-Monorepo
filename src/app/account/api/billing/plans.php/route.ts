import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";
import { getUserAccess } from "@/lib/permissions";
import { PAID_TIERS } from "@/lib/ranks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public tiers with their benefits (tiers), display prices incl. VAT
// (tier_prices) and whether online checkout is set up (premium_price_catalog).

type TierRow = { key: string; xp_bonus_pct: number; ai_daily_limit: number | null; store_discount_pct: number };
type PriceRow = { tier: string; billing_cycle: string; price_czk: number };
type CatalogRow = { tier: string; billing_cycle: string };

export async function GET() {
  return handleAccountRequest(async (session) => {
    const sb = accountSupabase();
    const [tiers, prices, catalog, access] = await Promise.all([
      sb.from("tiers").select("key,xp_bonus_pct,ai_daily_limit,store_discount_pct").in("key", [...PAID_TIERS]).order("sort_order"),
      sb.from("tier_prices").select("tier,billing_cycle,price_czk").in("tier", [...PAID_TIERS]),
      sb.from("premium_price_catalog").select("tier,billing_cycle").eq("active", true),
      getUserAccess(session.user.id),
    ]);
    if (tiers.error || prices.error) return Response.json({ error: "Chyba serveru." }, { status: 500 });

    const priceRows = prices.data as PriceRow[];
    const catalogRows = catalog.error ? [] : (catalog.data as CatalogRow[]);
    const priceOf = (tier: string, cycle: string) =>
      priceRows.find((row) => row.tier === tier && row.billing_cycle === cycle)?.price_czk ?? null;
    const available = (tier: string, cycle: string) =>
      catalogRows.some((row) => row.tier === tier && row.billing_cycle === cycle);

    return Response.json(
      {
        current_tier: access.tier,
        plans: (tiers.data as TierRow[]).map((tier) => ({
          key: tier.key,
          xp_bonus_pct: tier.xp_bonus_pct,
          ai_daily_limit: tier.ai_daily_limit,
          store_discount_pct: tier.store_discount_pct,
          prices: { monthly: priceOf(tier.key, "monthly"), yearly: priceOf(tier.key, "yearly") },
          available: { monthly: available(tier.key, "monthly"), yearly: available(tier.key, "yearly") },
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
