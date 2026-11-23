import Stripe from "stripe";
import { clientIp } from "@/lib/account-auth";
import { declineMessage, publicDeclineCode } from "@/lib/payments/decline-messages";
import {
  getStoreUser,
  StoreError,
  storeJsonError,
  storeRequireMethod,
  storeRequireSameOrigin,
  storeStripeConfig,
} from "@/lib/store-config";
import { readOrderGrant } from "@/lib/store-guest-grants";
import { orderCanAccess, orderRowByPublicId } from "@/lib/store-order-access";
import {
  assertIntentMatchesOrder,
  jsonResponse,
  loadPaymentOrderByPublicId,
  markAwaitingPayment,
  MAX_FAILED_PAYMENT_ATTEMPTS,
  PaymentIntentError,
  readJsonObject,
  recordDecline,
  reserveConfirmationAttempt,
  stripeClient,
} from "@/lib/store-payment-intents";
import { StoreRateLimitExceededError, storeRateLimitConsume } from "@/lib/store-ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confirms the order's PaymentIntent with a payment method the browser created directly at Stripe
 * (pm_...). The server never sees card details. "Paid" is not decided here: only the webhook
 * writes that state.
 */

function logSecurity(event: string, details: Record<string, unknown> = {}): void {
  console.info(`[store:pay-card] ${event}`, JSON.stringify(details));
}

async function handler(request: Request): Promise<Response> {
  try {
    storeRequireMethod(request, ["POST"]);
    storeRequireSameOrigin(request);
    const input = await readJsonObject(request, ["order", "payment_method", "turnstile_token"]);
    const publicId = input.order;
    const paymentMethod = input.payment_method;
    const token = input.turnstile_token;
    if (
      typeof publicId !== "string" || !/^[a-f0-9]{32}$/.test(publicId) ||
      typeof paymentMethod !== "string" || !/^pm_[A-Za-z0-9_]{1,100}$/.test(paymentMethod) ||
      typeof token !== "string" || token.length > 2048
    ) {
      storeJsonError(400, "request_invalid", "Požadavek není platný.");
    }
    if (storeStripeConfig() === null) {
      storeJsonError(503, "payment_unavailable", "Platba se nyní nepodařila.");
    }

    const ip = clientIp(request);
    try {
      await storeRateLimitConsume("store_pay_card", ip, 10, 600);
    } catch (error) {
      if (error instanceof StoreRateLimitExceededError) {
        storeJsonError(429, "rate_limited", "Příliš mnoho pokusů. Zkus to za chvíli.", { "Retry-After": String(error.retryAfter) });
      }
      throw error;
    }

    const user = await getStoreUser();
    const access = await orderRowByPublicId(publicId);
    const grant = await readOrderGrant(publicId);
    if (access === null || !orderCanAccess(access, user !== null ? { id: user.id } : null, grant, publicId)) {
      storeJsonError(404, "order_unavailable", "Objednávka není dostupná.");
    }
    const order = await loadPaymentOrderByPublicId(publicId);
    if (order === null || !order.stripe_payment_intent) {
      storeJsonError(409, "payment_not_available", "Tuto objednávku už nelze zaplatit.");
    }
    if (order.payment_attempts >= MAX_FAILED_PAYMENT_ATTEMPTS) {
      storeJsonError(429, "too_many_attempts", "Příliš mnoho neúspěšných pokusů. Zkus jiný způsob platby nebo to později.");
    }

    // Card testing guards: a challenge on every confirmation, never open in production, and
    // limits per order and per account on top of the per-IP one.
    if (process.env.NODE_ENV === "production" && !process.env.TURNSTILE_SECRET?.trim()) {
      console.error("[store:pay-card] TURNSTILE_SECRET missing, refusing card payments");
      storeJsonError(503, "payment_unavailable", "Platba se nyní nepodařila.");
    }
    if (!(await verifyTurnstile(token, ip, "store_payment"))) {
      storeJsonError(403, "challenge_failed", "Ověření selhalo. Obnov stránku a zkus to znovu.");
    }
    try {
      await storeRateLimitConsume("store_pay_card_order", publicId, 10, 600);
      if (user !== null) await storeRateLimitConsume("store_pay_card_user", user.id, 20, 3600);
    } catch (error) {
      if (error instanceof StoreRateLimitExceededError) {
        storeJsonError(429, "rate_limited", "Příliš mnoho pokusů. Zkus to za chvíli.", { "Retry-After": String(error.retryAfter) });
      }
      throw error;
    }

    const { stripe, expectedLiveMode, appUrl } = stripeClient();
    const existing = await stripe.paymentIntents.retrieve(order.stripe_payment_intent);
    assertIntentMatchesOrder(existing, order, expectedLiveMode);
    if (existing.id !== order.stripe_payment_intent || !existing.payment_method_types.includes("card")) {
      throw new PaymentIntentError("intent_invalid");
    }
    if (existing.status === "succeeded") return jsonResponse({ status: "succeeded", client_secret: null });
    if (existing.status === "processing") return jsonResponse({ status: "processing", client_secret: null });
    if (existing.status === "requires_action") {
      return jsonResponse({ status: "requires_action", client_secret: existing.client_secret });
    }
    if (existing.status !== "requires_payment_method" && existing.status !== "requires_confirmation") {
      storeJsonError(409, "payment_not_available", "Tuto objednávku už nelze zaplatit.");
    }
    await markAwaitingPayment(order, null);
    if (!(await reserveConfirmationAttempt(order))) {
      storeJsonError(409, "payment_in_progress", "Platba už se zpracovává.");
    }

    let confirmed: Stripe.PaymentIntent;
    try {
      confirmed = await stripe.paymentIntents.confirm(
        existing.id,
        { payment_method: paymentMethod, return_url: `${appUrl}/checkout/platba?order=${publicId}` },
        { idempotencyKey: `vevit-store:pi-confirm:v1:${publicId}:${order.payment_intent_seq}:${order.payment_attempts}:${paymentMethod}` },
      );
    } catch (error) {
      if (error instanceof Stripe.errors.StripeCardError) {
        const code = publicDeclineCode(error.decline_code || error.code);
        await recordDecline(order, code);
        logSecurity("card_declined", { order_public_prefix: publicId.slice(0, 8), code });
        return jsonResponse({ error: { code, message: declineMessage(code) } }, 402);
      }
      throw error;
    }

    if (confirmed.status === "succeeded" || confirmed.status === "processing") {
      return jsonResponse({ status: confirmed.status, client_secret: null });
    }
    if (confirmed.status === "requires_action") {
      return jsonResponse({ status: "requires_action", client_secret: confirmed.client_secret });
    }
    // requires_payment_method after confirm = the attempt failed without a thrown card error.
    const code = publicDeclineCode(confirmed.last_payment_error?.decline_code || confirmed.last_payment_error?.code);
    await recordDecline(order, code);
    return jsonResponse({ error: { code, message: declineMessage(code) } }, 402);
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    if (error instanceof PaymentIntentError) {
      logSecurity("pay_card_rejected", { reason: error.code });
      return storeJsonError(409, "payment_not_available", "Tuto objednávku už nelze zaplatit.");
    }
    // Stripe error type/code only: never the request, which could echo identifiers.
    const stripeError = error instanceof Stripe.errors.StripeError ? { type: error.type, code: error.code ?? null } : null;
    logSecurity("pay_card_failed", stripeError ?? { reason: (error as Error)?.name ?? "unknown" });
    return storeJsonError(503, "payment_unavailable", "Platba se nepodařila. Zkus to prosím znovu.");
  }
}

export const POST = handler;
export const OPTIONS = handler;
export const GET = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
