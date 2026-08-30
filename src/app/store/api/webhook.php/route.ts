import { createHash } from "node:crypto";
import Stripe from "stripe";
import { StoreError, storeStripeConfig } from "@/lib/store-config";
import { processStripeEvent, StripeEventStructureError } from "@/lib/store-webhook-processor";
import { resolveEdgeFunctionUrl } from "@/lib/edge-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Port of store/api/webhook.php. The raw body is verified against
 * STRIPE_WEBHOOK_SECRET with the official SDK, then store-relevant events
 * (checkout.session.completed) are processed locally against the store tables,
 * mirroring the PHP StripePaymentProcessor. Every verified event is still
 * forwarded to the stripe-webhook edge function so subscription handling keeps
 * its existing behavior during the migration.
 */

function logSecurity(event: string, details: Record<string, unknown> = {}): void {
  console.info(`[store:webhook] ${event}`, JSON.stringify(details));
}

function fail(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  try {
    if (request.method !== "POST") {
      return fail(405, "method_not_allowed", "Nepodporovaná metoda požadavku.");
    }

    const body = await request.text();
    if (body.length > 1_048_576) {
      return fail(400, "webhook_invalid", "Neplatný webhook.");
    }
    const config = storeStripeConfig();
    if (config === null) {
      logSecurity("stripe_webhook_configuration_missing");
      return fail(503, "webhook_unavailable", "Webhook není dostupný.");
    }

    const signature = request.headers.get("stripe-signature") ?? "";
    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(body, signature, config.webhookSecret);
    } catch {
      logSecurity("stripe_signature_rejected");
      return fail(400, "webhook_invalid", "Neplatný webhook.");
    }

    const payloadHash = createSha256(body);

    let localResult: { result: string; http_status: number } | null = null;
    try {
      localResult = await processStripeEvent(event as unknown as Record<string, unknown>, payloadHash, config.expectedLiveMode, config.accountId);
    } catch (error) {
      if (error instanceof StripeEventStructureError) {
        logSecurity("stripe_payload_rejected", { reason: "structure" });
        return fail(400, "webhook_invalid", "Neplatný webhook.");
      }
      throw error;
    }

    await forwardToEdgeFunction(request, body);

    return Response.json({ received: true, result: localResult.result }, {
      status: localResult.http_status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    logSecurity("stripe_webhook_retry", { reason: (error as Error)?.name ?? "unknown" });
    console.error("[store:webhook] failure", error instanceof Error ? error.message : error);
    return fail(500, "webhook_retry", "Dočasná chyba.");
  }
}

function createSha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Best-effort forward; the store event response is already authoritative. */
async function forwardToEdgeFunction(request: Request, body: string): Promise<void> {
  try {
    const target = resolveEdgeFunctionUrl("stripe");
    if (!target) return;
    const headers = new Headers({ "Content-Type": "application/json" });
    const signature = request.headers.get("stripe-signature");
    if (signature) headers.set("stripe-signature", signature);
    const incoming = new URL(request.url);
    headers.set("x-vevit-original-path", incoming.pathname);
    headers.set("x-forwarded-host", incoming.host);
    if (process.env.VEVIT_EDGE_PROXY_SECRET) {
      headers.set("x-vevit-proxy-secret", process.env.VEVIT_EDGE_PROXY_SECRET);
    }
    const upstream = await fetch(target, { method: "POST", headers, body, cache: "no-store", redirect: "manual" });
    if (!upstream.ok) {
      console.error("[store:webhook] edge forward failed", upstream.status);
    }
  } catch (error) {
    console.error("[store:webhook] edge forward error", error instanceof Error ? error.message : error);
  }
}

export const OPTIONS = (): Response => new Response(null, { status: 204, headers: { Allow: "POST" } });
export const GET = POST;
export const PUT = POST;
export const PATCH = POST;
export const DELETE = POST;