import { handleAccountRequest } from "@/lib/account-route";
import { localeRedirectTarget } from "@/lib/account-auth";
import {
  BillingUnavailableError,
  billingStripe,
  catalogPrice,
  csrfValid,
  ensureStripeCustomer,
} from "@/lib/billing";
import { getUserAccess } from "@/lib/permissions";
import { isPaidTier, type BillingCycle } from "@/lib/ranks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Starts a Stripe Checkout for Bronze / Silver / Gold. The stripe-webhook edge
// function activates the tier once Stripe confirms payment. Changing an
// existing subscription goes through the customer portal instead.

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    if (!csrfValid(request, session)) {
      return Response.json({ error: "Neplatný požadavek." }, { status: 403 });
    }
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const tier = body.tier;
    const cycle = body.billing_cycle;
    if (!isPaidTier(tier) || (cycle !== "monthly" && cycle !== "yearly")) {
      return Response.json({ error: "Neplatný tarif." }, { status: 400 });
    }

    const access = await getUserAccess(session.user.id);
    if (access.tier !== "free") {
      return Response.json(
        { error: "Předplatné už máte. Změnu tarifu provedete ve správě předplatného.", code: "ALREADY_SUBSCRIBED" },
        { status: 409 },
      );
    }

    const priceId = await catalogPrice(tier, cycle as BillingCycle);
    if (priceId === null) {
      return Response.json({ error: "Platby zatím nejsou dostupné." }, { status: 503 });
    }

    try {
      const stripe = billingStripe();
      const customer = await ensureStripeCustomer(stripe, session);
      const lang = typeof session.user.language === "string" ? session.user.language : "cs";
      const origin = new URL(request.url).origin;
      const billingUrl = `${origin}${localeRedirectTarget("/account/billing", lang)}`;
      const checkout = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { user_id: session.user.id },
        subscription_data: { metadata: { user_id: session.user.id } },
        // The webhook compares the paid amount with the catalogue: no coupons.
        allow_promotion_codes: false,
        automatic_tax: { enabled: process.env.STRIPE_TAX_ENABLED === "1" },
        ...(process.env.STRIPE_TAX_ENABLED === "1"
          ? { customer_update: { address: "auto" as const, name: "auto" as const }, tax_id_collection: { enabled: true } }
          : {}),
        locale: "cs",
        success_url: `${billingUrl}?checkout=success`,
        cancel_url: `${billingUrl}?checkout=cancelled`,
      });
      if (!checkout.url) return Response.json({ error: "Platbu se nepodařilo zahájit." }, { status: 502 });
      return Response.json({ url: checkout.url }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof BillingUnavailableError) {
        return Response.json({ error: "Platby zatím nejsou dostupné." }, { status: 503 });
      }
      console.error("[billing] checkout failed", error instanceof Error ? error.message : error);
      return Response.json({ error: "Platbu se nepodařilo zahájit." }, { status: 502 });
    }
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
