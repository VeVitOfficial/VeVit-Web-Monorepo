import "server-only";

import { createHash } from "node:crypto";
import { clientIp } from "@/lib/account-auth";
import {
  StoreError,
  storeJsonError,
  storeRequireMethod,
  getStoreUser,
  type StoreUser,
} from "@/lib/store-config";
import { storeRateLimitConsume, StoreRateLimitExceededError } from "@/lib/store-ratelimit";

/**
 * Port of store/lib/customer-agenda.php request plumbing (agenda_prepare_http,
 * agenda_json_input, agenda_rate_limit) plus the customer-agenda auth context.
 *
 * The PHP factory still hands out AnonymousAuthContext everywhere
 * (vevit_account_contract_unavailable — the S2S contract was never wired), so
 * in the PHP deployment every customer-agenda endpoint answers 401
 * verified_account_required. In the Next.js infrastructure the shared
 * host-only account session IS the reviewed contract, so identity comes from
 * getStoreUser() instead — 401 only for genuinely unauthenticated requests.
 */

const AGENDA_CSRF_ALLOW_HEADERS = "Content-Type, X-CSRF-Token, Idempotency-Key";

/** app_url + extra allowed origins, matching store/lib/config.php resolution. */
function agendaAllowedOrigins(): string[] {
  const appUrl = (process.env.STORE_APP_URL?.trim() || process.env.APP_URL?.trim() || "")
    .replace(/\/+$/, "");
  const extra = process.env.STORE_ALLOWED_ORIGINS?.split(",").map((value) => value.trim().replace(/\/+$/, ""))
    .filter((value) => value !== "") ?? [];
  return [...new Set([appUrl, ...extra].filter((value) => value !== ""))];
}

/** Origin echo for allowed CORS origins (store_apply_cors). */
export function agendaCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowed = agendaAllowedOrigins();
  if (origin === "" || !allowed.includes(origin)) return {};
  return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
}

/**
 * Port of agenda_prepare_http: origin gate (403 origin_rejected on a
 * non-empty, unlisted Origin), CORS echo, OPTIONS→204 and method gate.
 */
export function agendaPrepareHttp(request: Request, methods: string[]): void {
  const origin = request.headers.get("origin");
  const allowed = agendaAllowedOrigins();
  if (typeof origin === "string" && origin !== "" && !allowed.includes(origin.replace(/\/+$/, ""))) {
    storeJsonError(403, "origin_rejected", "Původ požadavku není povolen.");
  }
  if (request.method === "OPTIONS") {
    throw new StoreError(new Response(null, {
      status: 204,
      headers: {
        Allow: methods.join(", "),
        "Access-Control-Allow-Methods": methods.join(", "),
        "Access-Control-Allow-Headers": AGENDA_CSRF_ALLOW_HEADERS,
        ...agendaCorsHeaders(request),
      },
    }));
  }
  storeRequireMethod(request, methods);
}

/**
 * Port of agenda_json_input: JSON-only content type, 32 KiB cap, decode with
 * PHP error codes. Arrays count as valid input (PHP $input is an array).
 */
export async function agendaJsonInput(request: Request): Promise<Record<string, unknown>> {
  const contentType = (request.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (contentType !== "application/json") {
    storeJsonError(415, "content_type_invalid", "Požadavek musí používat JSON.");
  }
  const contentLength = request.headers.get("content-length") ?? "0";
  if (!/^\d+$/.test(contentLength) || Number(contentLength) > 32768) {
    storeJsonError(413, "request_too_large", "Požadavek je příliš velký.");
  }
  const raw = await request.text();
  if (raw.length > 32768) {
    storeJsonError(413, "request_too_large", "Požadavek je příliš velký.");
  }
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    storeJsonError(400, "json_invalid", "Požadavek není platný JSON.");
  }
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    storeJsonError(400, "json_invalid", "Požadavek není platný JSON.");
  }
  return input as Record<string, unknown>;
}

/** Port of agenda_rate_limit: shared-window per-identity limiter. */
export async function agendaRateLimit(scope: string, identity: string, limit: number): Promise<void> {
  await storeRateLimitConsume(scope, identity, limit, 60);
}

/** sha256(ip+UA) fallback key for visitors without an account session. */
export function agendaGuestKey(request: Request, ip: string): string {
  const ua = request.headers.get("user-agent") ?? "";
  return createHash("sha256").update(`${ip}\0${ua}`).digest("hex");
}

/** Identity for the rate limiter: account user when signed in, else guest key. */
export function agendaRateLimitIdentity(request: Request, user: StoreUser): string {
  return user !== null ? user.id : agendaGuestKey(request, clientIp(request));
}

/**
 * Port of agenda_auth_context: the account session replaces the pending
 * AuthContextFactory (getStoreUser already fails closed on an account
 * backend outage).
 */
export async function agendaUser(): Promise<StoreUser> {
  return getStoreUser();
}

/** Flatten StoreRateLimitExceeded like the PHP catch — only inside the service try. */
export function agendaFlattenRateLimit(error: unknown, code: string, message: string): void {
  if (error instanceof StoreRateLimitExceededError) {
    storeJsonError(401, code, message);
  }
  throw error;
}

const AGENDA_JSON_RESPONSE_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } as const;

/** agenda response helper with the shared headers. */
export function agendaJson(payload: unknown, cacheControl = "no-store", status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...AGENDA_JSON_RESPONSE_HEADERS, "Cache-Control": cacheControl },
  });
}

/**
 * Non-throwing twin of storeJsonError for catch blocks: echo's an error body
 * directly instead of exit-ing (PHP store_emit_json_error semantics).
 */
export function agendaErrorPayload(status: number, code: string, message: string, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...AGENDA_JSON_RESPONSE_HEADERS, ...headers },
  });
}

export function isStoreRateLimitError(error: unknown): error is StoreRateLimitExceededError {
  return error instanceof StoreRateLimitExceededError;
}

/** The flattened 401 every PHP catch(Throwable) produced. */
export function agendaVerifiedAccountError(message: string): Response {
  return new Response(JSON.stringify({ error: { code: "verified_account_required", message } }), {
    status: 401,
    headers: AGENDA_JSON_RESPONSE_HEADERS,
  });
}