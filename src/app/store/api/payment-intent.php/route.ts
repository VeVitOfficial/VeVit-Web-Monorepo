import { clientIp } from "@/lib/account-auth";
import {
  getStoreUser,
  StoreError,
  storeJsonError,
  storeRequireMethod,
  storeRequireSameOrigin,
  storeStripeConfig,
} from "@/lib/store-config";
import { readCheckoutGrant, readOrderGrant, saveOrderGrant } from "@/lib/store-guest-grants";
import { orderCanAccess, orderRowByPublicId } from "@/lib/store-order-access";
import { createOrderFromSnapshot, PaymentOrderException } from "@/lib/store-payment-service";
import {
  createOrReuseOrderPaymentIntent,
  jsonResponse,
  PaymentIntentError,
  readJsonObject,
  STORE_PAYMENT_METHODS,
  type StorePaymentMethod,
} from "@/lib/store-payment-intents";
import { StoreRateLimitExceededError, storeRateLimitConsume } from "@/lib/store-ratelimit";
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Creates (or reuses) the order for a checkout snapshot and a Stripe PaymentIntent for it.
 * Same guarantees as create-payment.php: same-origin check, snapshot authorization through the
 * checkout grant, server-side amounts.
 */

function logSecurity(event: string, details: Record<string, unknown> = {}): void {
  console.info(`[store:payment-intent] ${event}`, JSON.stringify(details));
}

async function handler(request: Request): Promise<Response> {
  try {
    storeRequireMethod(request, ["POST"]);
    storeRequireSameOrigin(request);
    const input = await readJsonObject(request, [["snapshot", "method"], ["order", "method"]]);
    const method = input.method;
    const snapshotId = input.snapshot;
    const existingOrderId = input.order;
    if (
      (snapshotId !== undefined && (typeof snapshotId !== "string" || !/^[a-f0-9]{32}$/.test(snapshotId))) ||
      (existingOrderId !== undefined && (typeof existingOrderId !== "string" || !/^[a-f0-9]{32}$/.test(existingOrderId)))
    ) {
      storeJsonError(404, "payment_unavailable", "Platbu se nyní nepodařilo připravit.");
    }
    if (typeof method !== "string" || !(STORE_PAYMENT_METHODS as readonly string[]).includes(method)) {
      storeJsonError(400, "request_invalid", "Požadavek není platný.");
    }
    if (storeStripeConfig() === null) {
      logSecurity("payment_configuration_missing");
      storeJsonError(503, "payment_unavailable", "Platbu se nyní nepodařilo připravit.");
    }

    try {
      await storeRateLimitConsume("store_payment_intent", clientIp(request), 30, 600);
    } catch (error) {
      if (error instanceof StoreRateLimitExceededError) {
        storeJsonError(429, "rate_limited", "Příliš mnoho pokusů. Zkus to za chvíli.", { "Retry-After": String(error.retryAfter) });
      }
      throw error;
    }

    const user = await getStoreUser();
    let order: { id: number; public_id: string };
    if (typeof existingOrderId === "string") {
      // Retry or method switch on an order that already exists: same access rules as the order pages.
      const access = await orderRowByPublicId(existingOrderId);
      const grant = await readOrderGrant(existingOrderId);
      if (access === null || !orderCanAccess(access, user !== null ? { id: user.id } : null, grant, existingOrderId)) {
        storeJsonError(404, "order_unavailable", "Objednávka není dostupná.");
      }
      order = { id: access.id, public_id: access.public_id };
    } else {
      const grantEntry = await readCheckoutGrant(snapshotId as string);
      const checkoutGrant = grantEntry !== null && grantEntry.kind === "checkout" ? grantEntry.grant : null;
      const orderResult = await createOrderFromSnapshot(snapshotId as string, user !== null ? { id: user.id } : null, checkoutGrant, new Date());
      order = orderResult.order;
      if (orderResult.guest_grant !== "" && user === null) {
        await saveOrderGrant(order.public_id, orderResult.guest_grant);
      }
    }

    const intent = await createOrReuseOrderPaymentIntent(order.id, method as StorePaymentMethod);
    logSecurity("intent_ready", { order_public_prefix: order.public_id.slice(0, 8), method });
    return jsonResponse({ client_secret: intent.clientSecret, order: { public_id: order.public_id }, amount_minor: intent.amountMinor });
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    if (error instanceof PaymentOrderException) {
      logSecurity("payment_order_rejected", { reason: error.errorCode });
      return storeJsonError(409, "payment_refresh_required", "Košík se změnil. Obnov prosím objednávku.");
    }
    if (error instanceof PaymentIntentError) {
      logSecurity("payment_intent_rejected", { reason: error.code });
      return storeJsonError(409, "payment_not_available", "Tuto objednávku už nelze zaplatit.");
    }
    logSecurity("payment_intent_failed", { reason: (error as Error)?.name ?? "unknown" });
    // Name/status only: Stripe and PostgREST messages can echo request data.
    console.error("[store:payment-intent] failure", error instanceof Error ? error.name : "unknown");
    return storeJsonError(503, "payment_unavailable", "Platbu se nyní nepodařilo připravit.");
  }
}

export const POST = handler;
export const OPTIONS = handler;
export const GET = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
