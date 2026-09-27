import "server-only";

import Stripe from "stripe";
import { timingSafeEqual } from "node:crypto";
import { accountSupabase } from "@/lib/account-auth";
import type { AccountSession } from "@/lib/account-session";
import type { BillingCycle, PaidTier } from "@/lib/ranks";

/**
 * Premium subscriptions (Bronze / Silver / Gold) via Stripe Checkout.
 * Only session creation lives here: activation is done by the `stripe-webhook`
 * edge function, which re-reads the session from Stripe, checks the price
 * against `premium_price_catalog` and then writes premium_subscriptions and
 * users.tier. So a checkout here must use exactly one catalogue price and no
 * discounts, or the webhook rejects it as an amount mismatch.
 */

export class BillingUnavailableError extends Error {}

export function billingStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!/^sk_(?:test|live)_[A-Za-z0-9_]+$/.test(secretKey)) {
    throw new BillingUnavailableError("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey);
}

export async function catalogPrice(tier: PaidTier, cycle: BillingCycle): Promise<string | null> {
  const { data, error } = await accountSupabase()
    .from("premium_price_catalog")
    .select("stripe_price_id")
    .eq("tier", tier)
    .eq("billing_cycle", cycle)
    .eq("active", true)
    .limit(2);
  if (error || !Array.isArray(data) || data.length !== 1) return null;
  const id = (data[0] as { stripe_price_id?: unknown }).stripe_price_id;
  return typeof id === "string" && id.startsWith("price_") ? id : null;
}

/** Reuse the user's Stripe customer or create one and remember it on users. */
export async function ensureStripeCustomer(stripe: Stripe, session: AccountSession): Promise<string> {
  const user = session.user as Record<string, unknown>;
  const { data } = await accountSupabase()
    .from("users")
    .select("stripe_customer_id")
    .eq("id", session.user.id)
    .limit(1)
    .maybeSingle();
  const existing = (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id;
  if (existing) return existing;

  const customer = await stripe.customers.create(
    {
      email: typeof user.email === "string" ? user.email : undefined,
      name: typeof user.full_name === "string" && user.full_name ? user.full_name : undefined,
      metadata: { user_id: session.user.id },
    },
    { idempotencyKey: `vevit-customer-${session.user.id}` },
  );
  const { error } = await accountSupabase()
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", session.user.id)
    .is("stripe_customer_id", null);
  if (error) throw new Error("Stripe customer could not be saved");
  return customer.id;
}

export async function stripeCustomerId(userId: string): Promise<string | null> {
  const { data } = await accountSupabase()
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();
  return (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null;
}

/** Writes must echo the session's CSRF token (X-CSRF-Token), as the account SPA does. */
export function csrfValid(request: Request, session: AccountSession): boolean {
  const submitted = Buffer.from(request.headers.get("x-csrf-token") ?? "");
  const expected = Buffer.from(session.csrfToken);
  return submitted.length === expected.length && timingSafeEqual(submitted, expected);
}
