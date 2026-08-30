import { createHash } from "node:crypto";
import { clientIp } from "@/lib/account-auth";
import {
  storeJsonError,
  storeRequireMethod,
  storeRequireSameOrigin,
  getStoreUser,
  StoreError,
} from "@/lib/store-config";
import { storeRateLimitConsume, StoreRateLimitExceededError } from "@/lib/store-ratelimit";
import {
  createCheckoutSnapshot,
  CheckoutValidationException,
  type VerifiedSnapshot,
} from "@/lib/store-checkout-service";
import { saveCheckoutGrant, readCheckoutGrant } from "@/lib/store-guest-grants";
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Port of store/api/create-checkout.php. The PHP-session CSRF token is
 * replaced by a same-origin Origin check (browsers always attach Origin on
 * JSON POSTs; cross-site requests cannot both match origin and pass CORS),
 * and guest grants move from $_SESSION into the HMAC-signed __Host-vvstore
 * cookie. The per-session rate-limit dimension uses a sha256(ip+UA) guest key
 * instead of session_id().
 */

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } as const;

function ok(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

const SECURITY_LOG_PREFIX = "[store:checkout]";

function logSecurity(event: string, details: Record<string, unknown> = {}): void {
  console.info(`${SECURITY_LOG_PREFIX} ${event}`, JSON.stringify(details));
}

function guestSessionKey(request: Request, ip: string): string {
  const ua = request.headers.get("user-agent") ?? "";
  return createHash("sha256").update(`${ip}\0${ua}`).digest("hex");
}

async function handler(request: Request): Promise<Response> {
  try {
    storeRequireMethod(request, ["POST"]);
    storeRequireSameOrigin(request);

    const contentType = (request.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
    if (contentType !== "application/json") {
      storeJsonError(415, "content_type_invalid", "Požadavek musí používat JSON.");
    }
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader !== null && (!/^\d+$/.test(contentLengthHeader) || Number(contentLengthHeader) > 32768)) {
      storeJsonError(413, "request_too_large", "Požadavek je příliš velký.");
    }
    const rawBody = await request.text();
    if (rawBody.length > 32768) {
      storeJsonError(413, "request_too_large", "Požadavek je příliš velký.");
    }
    let input: unknown;
    try {
      input = JSON.parse(rawBody);
    } catch {
      storeJsonError(400, "json_invalid", "Požadavek není platný JSON.");
    }
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      storeJsonError(400, "json_invalid", "Požadavek není platný JSON.");
    }
    const inputRecord = input as Record<string, unknown>;

    // Server-side logging of client-owned fields, which are then discarded.
    const untrustedFields = new Set<string>();
    const rawItems = Array.isArray(inputRecord.items) ? inputRecord.items : [];
    for (const item of rawItems) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
      for (const field of ["price", "sale_price", "currency", "name", "type", "stock", "shipping", "tax", "total", "download_url", "download_token"]) {
        if (field in (item as Record<string, unknown>)) untrustedFields.add(field);
      }
    }
    if (untrustedFields.size > 0) {
      logSecurity("checkout_client_owned_fields_ignored", { fields: [...untrustedFields] });
    }

    const headerKey = request.headers.get("idempotency-key") ?? "";
    inputRecord.idempotency_key = headerKey !== "" ? headerKey : inputRecord.idempotency_key ?? "";

    const user = await getStoreUser();
    const ip = clientIp(request);

    try {
      await storeRateLimitConsume("checkout_snapshot_ip", ip, 30, 60);
      await storeRateLimitConsume("checkout_snapshot_session", guestSessionKey(request, ip), 5, 60);
    } catch (error) {
      if (error instanceof StoreRateLimitExceededError) {
        logSecurity("checkout_rate_limited");
        storeJsonError(429, "checkout_rate_limited", "Příliš mnoho pokusů. Zkuste to prosím za chvíli.", { "Retry-After": String(error.retryAfter) });
      }
      throw error;
    }

    const result = await createCheckoutSnapshot({
      input: inputRecord,
      user: user !== null ? { id: user.id } : null,
      guestSessionKey: guestSessionKey(request, ip),
      now: new Date(),
    });

    if (result.reused) {
      const snapshot = result.snapshot as VerifiedSnapshot;
      const hasGuestGrant = (await readCheckoutGrant(snapshot.public_id)) !== null;
      if (user === null && !hasGuestGrant) {
        logSecurity("checkout_snapshot_access_rejected", { reason: "missing_guest_grant" });
        storeJsonError(409, "checkout_retry_required", "Objednávku nelze bezpečně obnovit. Opakujte prosím pokus.");
      }
      logSecurity("checkout_idempotency_reused", { public_id_prefix: snapshot.public_id.slice(0, 8) });
      return ok(200, {
        checkout: {
          id: snapshot.public_id,
          expires_at: snapshot.expires_at,
          currency: snapshot.currency,
          total_minor: snapshot.total_minor,
        },
        payment: { status: "not_started" },
      });
    }

    const snapshot = result.snapshot as {
      public_id: string;
      expires_at: string;
      currency: string;
      total_minor: number;
      user_id: string | null;
    };
    if (user === null) {
      await saveCheckoutGrant(snapshot.public_id, result.grant, snapshot.expires_at);
    }
    return ok(201, {
      checkout: {
        id: snapshot.public_id,
        expires_at: snapshot.expires_at,
        currency: snapshot.currency,
        total_minor: snapshot.total_minor,
      },
      payment: { status: "not_started" },
    });
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    if (error instanceof CheckoutValidationException) {
      logSecurity("checkout_validation_rejected", { code: error.errorCode });
      storeJsonError(422, error.errorCode, error.message);
    }
    logSecurity("checkout_unexpected_error", { type: (error as Error)?.name ?? "unknown" });
    console.error("[store:checkout] failure", error);
    storeJsonError(500, "checkout_unavailable", "Objednávku se nyní nepodařilo připravit. Zkuste to prosím znovu.");
  }
}

export const POST = handler;
export const OPTIONS = handler;
export const GET = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;