import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/subscription.php: the user's active subscription plus
// history, with payment_id reduced to last4 and the matching tier price when
// a subscription is active.

const SUBSCRIPTION_COLUMNS =
  "id,tier,billing_cycle,price,started_at,expires_at,auto_renew,payment_method,payment_id,status";

type SubscriptionRow = {
  status: string;
  tier: string;
  billing_cycle: string;
  payment_id?: string | null;
} & Record<string, unknown>;

function stripPaymentId(row: SubscriptionRow): SubscriptionRow {
  if (typeof row.payment_id === "string" && row.payment_id.length > 4) {
    row.payment_id_last4 = row.payment_id.slice(-4);
    delete row.payment_id;
  }
  return row;
}

export async function GET() {
  return handleAccountRequest(async (session) => {
    const { data, error } = await accountSupabase()
      .from("premium_subscriptions")
      .select(SUBSCRIPTION_COLUMNS)
      .eq("user_id", session.user.id)
      .limit(50);
    if (error) return Response.json({ error: "Chyba serveru." }, { status: 500 });

    const rows = (data as SubscriptionRow[]).toSorted((a, b) =>
      String(b.started_at).localeCompare(String(a.started_at)),
    );

    let active: SubscriptionRow | null = null;
    const history: SubscriptionRow[] = [];
    for (const row of rows) {
      if (active === null && row.status === "active") {
        active = stripPaymentId(row);
      } else {
        history.push(stripPaymentId(row));
      }
    }

    let price: Record<string, unknown> | null = null;
    if (active) {
      const priceRes = await accountSupabase()
        .from("tier_prices")
        .select("price_czk")
        .eq("tier", active.tier)
        .eq("billing_cycle", active.billing_cycle)
        .limit(1);
      price = (priceRes.data as Record<string, unknown>[] | null)?.[0] ?? null;
    }

    return Response.json(
      { subscription: active, price, history },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function POST(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET" } });
}