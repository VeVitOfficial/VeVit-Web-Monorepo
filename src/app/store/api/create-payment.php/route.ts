import {
  storeJsonError,
  storeRequireMethod,
  storeRequireSameOrigin,
  getStoreUser,
  storeStripeConfig,
  StoreError,
} from "@/lib/store-config";
import { createOrderFromSnapshot, createOrReuseStripeSession, PaymentOrderException } from "@/lib/store-payment-service";
import { readCheckoutGrant, saveOrderGrant } from "@/lib/store-guest-grants";
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Port of store/api/create-payment.php. Same-origin Origin check replaces the
 * PHP-session CSRF token; guest grants live in the __Host-vvstore cookie
 * instead of $_SESSION. Stripe sessions are created with the official SDK and
 * the same idempotency key scheme (vevit-store:checkout:v1:<public>:<attempt>).
 */

function logSecurity(event: string, details: Record<string, unknown> = {}): void {
  console.info(`[store:payment] ${event}`, JSON.stringify(details));
}

async function handler(request: Request): Promise<Response> {
  try {
    storeRequireMethod(request, ["POST"]);
    storeRequireSameOrigin(request);

    const contentType = (request.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
    if (contentType !== "application/json") {
      storeJsonError(415, "content_type_invalid", "Požadavek musí používat JSON.");
    }
    const body = await request.text();
    if (body.length > 4096) {
      storeJsonError(413, "request_too_large", "Požadavek je příliš velký.");
    }
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
    const inputKeys = Object.keys(input);
    if (inputKeys.length !== 1 || inputKeys[0] !== "snapshot") {
      storeJsonError(400, "request_invalid", "Požadavek není platný.");
    }
    const snapshotId = input.snapshot;
    if (typeof snapshotId !== "string" || !/^[a-f0-9]{32}$/.test(snapshotId)) {
      storeJsonError(404, "payment_unavailable", "Platbu se nyní nepodařilo připravit.");
    }
    if (storeStripeConfig() === null) {
      logSecurity("payment_configuration_missing");
      console.error("[store:payment] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET missing");
      storeJsonError(503, "payment_unavailable", "Platbu se nyní nepodařilo připravit.");
    }

    const user = await getStoreUser();
    const grantEntry = await readCheckoutGrant(snapshotId);
    const checkoutGrant = grantEntry !== null && grantEntry.kind === "checkout" ? grantEntry.grant : null;

    const orderResult = await createOrderFromSnapshot(snapshotId, user !== null ? { id: user.id } : null, checkoutGrant, new Date());
    const order = orderResult.order;
    if (orderResult.guest_grant !== "" && user === null) {
      await saveOrderGrant(order.public_id, orderResult.guest_grant);
    }

    const config = storeStripeConfig()!;
    const session = await createOrReuseStripeSession(order.id, config.appUrl);
    logSecurity("stripe_checkout_ready", { order_public_prefix: order.public_id.slice(0, 8), reused: session.reused ? 1 : 0 });

    return new Response(JSON.stringify({ url: session.url, order: { public_id: order.public_id } }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    if (error instanceof PaymentOrderException) {
      logSecurity("payment_order_rejected", { reason: error.errorCode });
      storeJsonError(409, "payment_refresh_required", "Košík se změnil. Obnovte prosím objednávku.");
    }
    logSecurity("payment_creation_failed", { reason: (error as Error)?.name ?? "unknown" });
    console.error("[store:payment] failure", error instanceof Error ? error.message : error);
    storeJsonError(503, "payment_unavailable", "Platbu se nyní nepodařilo připravit.");
  }
}

export const POST = handler;
export const OPTIONS = handler;
export const GET = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;