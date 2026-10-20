import Stripe from "stripe";
import { paymentIntentIdempotencyKey } from "@/lib/payments/intent-keys";
import { canTransitionPayment } from "@/lib/store-payment-service";
import { storeJsonError, storeRest, storeStripeConfig } from "@/lib/store-config";
import "server-only";

/**
 * Stripe PaymentIntents for Store orders (custom payment gateway). Amounts always come from the
 * order row. This module never writes "paid": only the verified webhook does that.
 */

export type StorePaymentMethod = "card" | "wallet" | "paypal";

export const STORE_PAYMENT_METHODS: readonly StorePaymentMethod[] = ["card", "wallet", "paypal"];
export const MAX_FAILED_PAYMENT_ATTEMPTS = 5;

const PAYMENT_METHOD_TYPES: Record<StorePaymentMethod, string[]> = {
  card: ["card"],
  wallet: ["card"],
  paypal: ["paypal"],
};

const REUSABLE_STATUSES = new Set(["requires_payment_method", "requires_confirmation", "requires_action"]);
const PAYABLE_ORDER_STATES = ["pending_checkout", "awaiting_payment", "failed"];

export class PaymentIntentError extends Error {
  constructor(readonly code: "order_unavailable" | "order_not_payable" | "already_paid" | "intent_invalid") {
    super(code);
  }
}

export interface PaymentOrder {
  id: number;
  public_id: string;
  user_id: string | null;
  payment_status: string;
  total_minor: number;
  currency: string;
  stripe_payment_intent: string | null;
  payment_attempts: number;
  payment_intent_seq: number;
  last_payment_error: string | null;
}

const ORDER_FIELDS =
  "id,public_id,user_id,payment_status,total_minor,currency,stripe_payment_intent,payment_attempts,payment_intent_seq,last_payment_error";

export async function loadPaymentOrderByPublicId(publicId: string): Promise<PaymentOrder | null> {
  if (!/^[a-f0-9]{32}$/.test(publicId)) return null;
  const rows = await storeRest<PaymentOrder[]>("GET", "store_orders", {
    query: `select=${ORDER_FIELDS}&public_id=eq.${publicId}&limit=1`,
  });
  return rows.json[0] ?? null;
}

async function loadPaymentOrderById(orderId: number): Promise<PaymentOrder | null> {
  const rows = await storeRest<PaymentOrder[]>("GET", "store_orders", {
    query: `select=${ORDER_FIELDS}&id=eq.${orderId}&limit=1`,
  });
  return rows.json[0] ?? null;
}

export function stripeClient(): { stripe: Stripe; expectedLiveMode: boolean; appUrl: string } {
  const config = storeStripeConfig();
  if (config === null) throw new Error("Stripe configuration missing");
  return { stripe: new Stripe(config.secretKey), expectedLiveMode: config.expectedLiveMode, appUrl: config.appUrl };
}

function sameTypes(actual: string[], expected: string[]): boolean {
  return [...actual].sort().join(",") === [...expected].sort().join(",");
}

/** Throws when Stripe returned something that does not belong to this order. */
export function assertIntentMatchesOrder(intent: Stripe.PaymentIntent, order: PaymentOrder, expectedLiveMode: boolean): void {
  if (
    typeof intent.id !== "string" || !/^pi_[A-Za-z0-9_]+$/.test(intent.id) ||
    intent.amount !== order.total_minor ||
    String(intent.currency).toLowerCase() !== String(order.currency).toLowerCase() ||
    intent.livemode !== expectedLiveMode ||
    intent.metadata?.order_public_id !== order.public_id ||
    intent.metadata?.schema_version !== "2"
  ) {
    throw new PaymentIntentError("intent_invalid");
  }
}

async function cancelQuietly(stripe: Stripe, intentId: string): Promise<void> {
  try {
    await stripe.paymentIntents.cancel(intentId);
  } catch {
    // Already settled or canceled; the webhook ledger is authoritative either way.
  }
}

export async function createOrReuseOrderPaymentIntent(
  orderId: number,
  method: StorePaymentMethod,
): Promise<{ clientSecret: string; intentId: string; amountMinor: number }> {
  const { stripe, expectedLiveMode } = stripeClient();
  const order = await loadPaymentOrderById(orderId);
  if (order === null) throw new PaymentIntentError("order_unavailable");
  if (order.payment_status === "paid") throw new PaymentIntentError("already_paid");
  if (!PAYABLE_ORDER_STATES.includes(order.payment_status)) throw new PaymentIntentError("order_not_payable");
  if (!Number.isInteger(order.total_minor) || order.total_minor <= 0) throw new PaymentIntentError("order_not_payable");

  const types = PAYMENT_METHOD_TYPES[method];
  let seq = Number(order.payment_intent_seq);

  if (order.stripe_payment_intent) {
    const existing = await stripe.paymentIntents.retrieve(order.stripe_payment_intent);
    if (existing.status === "succeeded" || existing.status === "processing") throw new PaymentIntentError("already_paid");
    const reusable =
      REUSABLE_STATUSES.has(existing.status) &&
      sameTypes(existing.payment_method_types, types) &&
      existing.amount === order.total_minor &&
      typeof existing.client_secret === "string";
    if (reusable) {
      assertIntentMatchesOrder(existing, order, expectedLiveMode);
      await markAwaitingPayment(order, method === "paypal" ? "paypal" : null);
      return { clientSecret: existing.client_secret!, intentId: existing.id, amountMinor: order.total_minor };
    }
    if (REUSABLE_STATUSES.has(existing.status)) await cancelQuietly(stripe, existing.id);
    seq += 1;
  }

  const intent = await stripe.paymentIntents.create(
    {
      amount: order.total_minor,
      currency: "czk",
      payment_method_types: types,
      metadata: { order_public_id: order.public_id, schema_version: "2" },
    },
    { idempotencyKey: paymentIntentIdempotencyKey(order.public_id, seq) },
  );
  assertIntentMatchesOrder(intent, order, expectedLiveMode);
  if (typeof intent.client_secret !== "string" || intent.client_secret === "") throw new PaymentIntentError("intent_invalid");

  if (!canTransitionPayment(order.payment_status, "awaiting_payment")) throw new PaymentIntentError("order_not_payable");
  await storeRest("PATCH", "store_orders", {
    query: `id=eq.${order.id}`,
    prefer: "return=minimal",
    body: {
      stripe_payment_intent: intent.id,
      payment_intent_seq: seq,
      payment_provider: "stripe",
      payment_method: method === "paypal" ? "paypal" : null,
      payment_status: "awaiting_payment",
      status: "awaiting_payment",
    },
  });
  return { clientSecret: intent.client_secret, intentId: intent.id, amountMinor: order.total_minor };
}

/** A failed order may be paid again: failed → awaiting_payment (CAS on the current state). */
export async function markAwaitingPayment(order: PaymentOrder, paymentMethod: string | null): Promise<void> {
  if (order.payment_status === "awaiting_payment" && paymentMethod === null) return;
  if (!canTransitionPayment(order.payment_status, "awaiting_payment")) throw new PaymentIntentError("order_not_payable");
  const body: Record<string, unknown> = { payment_status: "awaiting_payment", status: "awaiting_payment" };
  if (paymentMethod !== null) body.payment_method = paymentMethod;
  await storeRest("PATCH", "store_orders", {
    query: `id=eq.${order.id}&payment_status=eq.${order.payment_status}`,
    prefer: "return=minimal",
    body,
  });
}

/** Counts a declined confirmation. CAS on the counter, so concurrent declines may count once. */
export async function recordFailedAttempt(order: PaymentOrder, errorCode: string): Promise<void> {
  const safeCode = /^[a-z0-9_]{1,64}$/.test(errorCode) ? errorCode : "card_declined";
  await storeRest("PATCH", "store_orders", {
    query: `id=eq.${order.id}&payment_attempts=eq.${order.payment_attempts}`,
    prefer: "return=minimal",
    body: { payment_attempts: Number(order.payment_attempts) + 1, last_payment_error: safeCode },
  });
}

/** Reads and parses a small JSON object body with an exact key whitelist. */
export async function readJsonObject(request: Request, keys: string[], maxBytes = 4096): Promise<Record<string, unknown>> {
  const contentType = (request.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (contentType !== "application/json") storeJsonError(415, "content_type_invalid", "Požadavek musí používat JSON.");
  const body = await request.text();
  if (body.length > maxBytes) storeJsonError(413, "request_too_large", "Požadavek je příliš velký.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    storeJsonError(400, "json_invalid", "Požadavek není platný.");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    storeJsonError(400, "request_invalid", "Požadavek není platný.");
  }
  const input = parsed as Record<string, unknown>;
  const present = Object.keys(input);
  if (present.length !== keys.length || !present.every((key) => keys.includes(key))) {
    storeJsonError(400, "request_invalid", "Požadavek není platný.");
  }
  return input;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
