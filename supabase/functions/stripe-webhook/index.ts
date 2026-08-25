import Stripe from "npm:stripe@14.25.0";

// Dedicated read-only restricted key. Edge secrets are project-wide, therefore
// this must not reuse STRIPE_SECRET_KEY needed by setup/worker write flows.
const stripeSecret = Deno.env.get("STRIPE_WEBHOOK_API_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");

function componentSecret(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "";
  try {
    const keys = JSON.parse(raw) as Record<string, unknown>;
    return typeof keys.stripe_webhook === "string" ? keys.stripe_webhook : "";
  } catch {
    return "";
  }
}

const supabaseSecret = componentSecret();
const stripe = new Stripe(stripeSecret, { apiVersion: "2024-04-10" });

class ProcessingError extends Error {
  constructor(readonly code: string, message: string, readonly httpStatus = 400) {
    super(message);
  }
}

function normalizeError(error: unknown): ProcessingError {
  if (error instanceof ProcessingError) return error;
  if (error instanceof Stripe.errors.StripeError) {
    if (error.type === "StripeAuthenticationError") {
      return new ProcessingError("stripe_authentication_failed", "Stripe server key was rejected", 500);
    }
    if (error.type === "StripePermissionError") {
      return new ProcessingError("stripe_permission_failed", "Stripe server key lacks permission", 500);
    }
    if (error.type === "StripeConnectionError" || error.type === "StripeAPIError") {
      return new ProcessingError("stripe_temporarily_unavailable", "Stripe API is unavailable", 503);
    }
    if (error.type === "StripeInvalidRequestError" && error.statusCode === 404) {
      return new ProcessingError("stripe_object_not_found", "Canonical Stripe object was not found", 400);
    }
    return new ProcessingError("stripe_api_error", "Stripe API rejected the canonical lookup", 500);
  }
  return new ProcessingError("unexpected_processing_error", "Unexpected processing error", 500);
}

function response(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('apikey', supabaseSecret);
  headers.set("accept", "application/json");
  if (init.body !== undefined) headers.set("content-type", "application/json");

  const result = await fetch(`${supabaseUrl}/rest/v1/${path}`, { ...init, headers });
  if (!result.ok) {
    throw new ProcessingError("data_api_failed", `Data API returned ${result.status}`, 500);
  }
  if (result.status === 204 || result.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return await result.json() as T;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function objectId(event: Stripe.Event): string | null {
  const object = event.data.object as { id?: unknown };
  return typeof object.id === "string" ? object.id : null;
}

async function claimEvent(event: Stripe.Event, payloadHash: string): Promise<string> {
  return await rest<string>("rpc/claim_stripe_webhook_event", {
    method: "POST",
    body: JSON.stringify({
      p_event_id: event.id,
      p_event_type: event.type,
      p_payload_sha256: payloadHash,
      p_object_id: objectId(event),
    }),
  });
}

async function finishEvent(eventId: string, status: "completed" | "ignored" | "failed", errorCode?: string): Promise<void> {
  await rest<void>(`stripe_webhook_events?event_id=eq.${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      error_code: errorCode ?? null,
      processed_at: new Date().toISOString(),
    }),
  });
}

type PriceRow = {
  stripe_price_id: string;
  stripe_product_id: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  billing_cycle: "monthly" | "yearly";
  currency: string;
  amount_minor: number;
};

async function priceFor(priceId: string): Promise<PriceRow> {
  const rows = await rest<PriceRow[]>(
    `premium_price_catalog?stripe_price_id=eq.${encodeURIComponent(priceId)}&active=eq.true&select=stripe_price_id,stripe_product_id,tier,billing_cycle,currency,amount_minor`,
  );
  if (rows.length !== 1) throw new ProcessingError("unknown_price", "Price is not in the server catalogue");
  return rows[0];
}

async function requireActiveUser(userId: string): Promise<void> {
  const rows = await rest<Array<{ id: string }>>(
    `users?id=eq.${encodeURIComponent(userId)}&status=eq.active&select=id&limit=2`,
  );
  if (rows.length !== 1) throw new ProcessingError("invalid_user", "User is not active");
}

function subscriptionPriceId(subscription: Stripe.Subscription): string {
  const items = subscription.items.data;
  if (items.length !== 1 || items[0].quantity !== 1) {
    throw new ProcessingError("invalid_subscription_items", "Subscription must have exactly one item");
  }
  const price = items[0].price;
  if (!price?.id) throw new ProcessingError("missing_price", "Subscription price is missing");
  return price.id;
}

async function upsertSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  catalog: PriceRow,
): Promise<void> {
  const state = ["active", "trialing"].includes(subscription.status) ? "active" : "cancelled";
  await rest<void>("premium_subscriptions?on_conflict=payment_id", {
    method: "POST",
    headers: { "prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      tier: catalog.tier,
      billing_cycle: catalog.billing_cycle,
      price: catalog.amount_minor / 100,
      started_at: new Date(subscription.current_period_start * 1000).toISOString(),
      expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      auto_renew: !subscription.cancel_at_period_end,
      payment_method: "stripe",
      payment_id: subscription.id,
      status: state,
    }),
  });

  await rest<void>(`users?id=eq.${encodeURIComponent(userId)}&status=eq.active`, {
    method: "PATCH",
    body: JSON.stringify({
      tier: state === "active" ? catalog.tier : "free",
      tier_billing: state === "active" ? catalog.billing_cycle : null,
      tier_expires: state === "active" ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    }),
  });
}

async function processCheckout(event: Stripe.Event): Promise<void> {
  const id = objectId(event);
  if (!id) throw new ProcessingError("missing_session_id", "Checkout Session id is missing");

  // The signed event is only a notification. Security decisions use a fresh
  // canonical object loaded from Stripe, never metadata or amounts in payload.
  const session = await stripe.checkout.sessions.retrieve(id, {
    expand: ["line_items.data.price"],
  });
  if (session.status !== "complete" || session.payment_status !== "paid" || session.mode !== "subscription") {
    throw new ProcessingError("checkout_not_paid", "Checkout Session is not a completed paid subscription");
  }

  const items = session.line_items?.data ?? [];
  if (items.length !== 1 || items[0].quantity !== 1) {
    throw new ProcessingError("invalid_line_items", "Checkout must contain exactly one item");
  }
  const price = items[0].price;
  const priceId = typeof price === "string" ? price : price?.id;
  if (!priceId) throw new ProcessingError("missing_price", "Checkout price is missing");
  const catalog = await priceFor(priceId);

  if (
    session.currency?.toLowerCase() !== catalog.currency ||
    session.amount_total !== catalog.amount_minor ||
    items[0].amount_total !== catalog.amount_minor
  ) {
    throw new ProcessingError("amount_mismatch", "Checkout amount or currency differs from catalogue");
  }

  const userId = session.metadata?.user_id;
  if (!userId) throw new ProcessingError("missing_user", "Checkout user id is missing");
  await requireActiveUser(userId);

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) throw new ProcessingError("missing_subscription", "Stripe subscription is missing");
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscriptionPriceId(subscription) !== catalog.stripe_price_id) {
    throw new ProcessingError("subscription_price_mismatch", "Subscription price differs from checkout");
  }
  const subscriptionUserId = subscription.metadata?.user_id;
  if (subscriptionUserId && subscriptionUserId !== userId) {
    throw new ProcessingError("subscription_user_mismatch", "Subscription belongs to a different user");
  }
  await upsertSubscription(userId, subscription, catalog);
}

async function storedSubscription(subscriptionId: string): Promise<{ user_id: string } | null> {
  const rows = await rest<Array<{ user_id: string }>>(
    `premium_subscriptions?payment_id=eq.${encodeURIComponent(subscriptionId)}&select=user_id&limit=2`,
  );
  if (rows.length > 1) throw new ProcessingError("duplicate_subscription", "Duplicate subscription mapping", 500);
  return rows[0] ?? null;
}

async function processSubscription(event: Stripe.Event): Promise<boolean> {
  const id = objectId(event);
  if (!id) throw new ProcessingError("missing_subscription_id", "Subscription id is missing");
  const stored = await storedSubscription(id);
  // The Stripe account may contain subscriptions unrelated to VeVit. They are
  // acknowledged without changing local state or causing endless retries.
  if (!stored) return false;

  if (event.type === "customer.subscription.deleted") {
    await rest<void>(`premium_subscriptions?payment_id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled", auto_renew: false }),
    });
    await rest<void>(`users?id=eq.${encodeURIComponent(stored.user_id)}&status=eq.active`, {
      method: "PATCH",
      body: JSON.stringify({ tier: "free", tier_billing: null, tier_expires: null }),
    });
    return true;
  }

  const subscription = await stripe.subscriptions.retrieve(id);
  const catalog = await priceFor(subscriptionPriceId(subscription));
  await requireActiveUser(stored.user_id);
  await upsertSubscription(stored.user_id, subscription, catalog);
  return true;
}

async function processInvoice(event: Stripe.Event): Promise<boolean> {
  const id = objectId(event);
  if (!id) throw new ProcessingError("missing_invoice_id", "Invoice id is missing");
  const invoice = await stripe.invoices.retrieve(id);
  if (!invoice.paid || invoice.status !== "paid") {
    throw new ProcessingError("invoice_not_paid", "Invoice is not paid");
  }
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return false;
  const stored = await storedSubscription(subscriptionId);
  if (!stored) return false;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const catalog = await priceFor(subscriptionPriceId(subscription));
  if (invoice.currency.toLowerCase() !== catalog.currency || invoice.amount_paid !== catalog.amount_minor) {
    throw new ProcessingError("invoice_amount_mismatch", "Invoice amount or currency differs from catalogue");
  }
  await requireActiveUser(stored.user_id);
  await upsertSubscription(stored.user_id, subscription, catalog);
  return true;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return response(405, { error: "method_not_allowed" });
  if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseSecret) {
    return response(503, { error: "service_not_configured" });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return response(400, { error: "missing_signature" });
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch {
    return response(400, { error: "invalid_signature" });
  }

  try {
    const claim = await claimEvent(event, await sha256(payload));
    if (claim === "duplicate") return response(200, { received: true, duplicate: true });
    if (claim === "busy") return response(409, { error: "event_in_progress" });
    if (claim === "conflict") return response(409, { error: "event_payload_conflict" });
    if (claim !== "claimed") throw new ProcessingError("invalid_claim_result", "Unexpected ledger result", 500);

    if (event.type === "checkout.session.completed") {
      await processCheckout(event);
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      if (!await processSubscription(event)) {
        await finishEvent(event.id, "ignored");
        return response(200, { received: true, ignored: true });
      }
    } else if (event.type === "invoice.payment_succeeded") {
      if (!await processInvoice(event)) {
        await finishEvent(event.id, "ignored");
        return response(200, { received: true, ignored: true });
      }
    } else {
      await finishEvent(event.id, "ignored");
      return response(200, { received: true, ignored: true });
    }

    await finishEvent(event.id, "completed");
    return response(200, { received: true });
  } catch (error) {
    const failure = normalizeError(error);
    try {
      await finishEvent(event.id, "failed", failure.code);
    } catch {
      // Stripe receives a non-2xx and retries; no secrets or payloads are logged.
    }
    return response(failure.httpStatus, { error: failure.code });
  }
});
