import { AccountBackendUnavailableError } from "@/lib/account-session";
import { loadSessionFromCookies } from "@/lib/account-session";
import "server-only";

/**
 * Store runtime configuration + shared request helpers ported from
 * store/config.php, store/lib/http.php and store/lib/auth.php.
 *
 * The store does not issue its own identity: account-bound operations use the
 * shared host-only account session (__Host-vvsession). An unavailable account
 * backend counts as anonymous (fail closed), exactly like getCurrentUser().
 */

export function storeJsonError(status: number, code: string, message: string, headers: Record<string, string> = {}): never {
  const response = Response.json(
    { error: { code, message } },
    { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } },
  );
  throw new StoreError(response);
}

/** Throwable wrapper so `store_emit_json_error()`'s `never` semantics survive. */
export class StoreError extends Error {
  constructor(readonly response: Response) {
    super("store error response");
  }
}

export interface StoreStripeConfig {
  secretKey: string;
  webhookSecret: string;
  expectedLiveMode: boolean;
  accountId: string | null;
  appUrl: string;
}

export function storeStripeConfig(): StoreStripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!/^sk_(?:test|live)_[A-Za-z0-9_]+$/.test(secretKey)) return null;
  if (!/^whsec_[A-Za-z0-9_]+$/.test(webhookSecret)) return null;
  const appUrl = (process.env.STORE_APP_URL?.trim() || process.env.APP_URL?.trim() || "https://www.vevit.cz/store").replace(/\/+$/, "");
  return {
    secretKey,
    webhookSecret,
    expectedLiveMode: secretKey.startsWith("sk_live_"),
    accountId: process.env.STRIPE_ACCOUNT_ID?.trim() || null,
    appUrl,
  };
}

export type StoreUser = { id: string; email: string; full_name: string; nickname: string | null; avatar_url: string | null; tier: string | null } | null;

export async function getStoreUser(): Promise<StoreUser> {
  let session: Awaited<ReturnType<typeof loadSessionFromCookies>>;
  try {
    session = await loadSessionFromCookies();
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) return null; // fail closed
    throw error;
  }
  const user = session?.user as Record<string, unknown> | undefined;
  if (!user || typeof user.id !== "string" || user.id === "") return null;
  return {
    id: user.id,
    email: String(user.email ?? ""),
    full_name: String(user.full_name ?? ""),
    nickname: typeof user.nickname === "string" ? user.nickname : null,
    avatar_url: typeof user.avatar_url === "string" ? user.avatar_url : null,
    tier: typeof user.tier === "string" ? user.tier : null,
  };
}

/** POST-only gate with store_method_is_allowed() semantics. */
export function storeRequireMethod(request: Request, allowed: string[]): void {
  if (request.method === "OPTIONS") {
    throw new StoreError(
      new Response(null, {
        status: 204,
        headers: { Allow: allowed.join(", "), "Cache-Control": "no-store" },
      }),
    );
  }
  if (!allowed.includes(request.method.toUpperCase())) {
    storeJsonError(405, "method_not_allowed", "Nepodporovaná metoda požadavku.", { Allow: allowed.join(", ") });
  }
}

/**
 * CSRF replacement for the PHP-session token the JSON clients never send:
 * same-origin POSTs always carry an Origin header, so reject mismatching
 * cross-site origins (a real CSRF attempt has no legitimate same-origin form).
 */
export function storeRequireSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // same-site tools without Origin (server-to-server, curl)
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    originHost = "";
  }
  if (originHost !== "" && originHost !== host) {
    storeJsonError(403, "csrf_invalid", "Platnost požadavku vypršela. Obnovte prosím stránku.");
  }
}

/** Supabase PostgREST helpers over the store tables (server-side, service role). */
export function storeSupabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) throw new AccountBackendUnavailableError("Store database not configured");
  return { url, key };
}

export async function storeRest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: { query?: URLSearchParams | string; body?: unknown; prefer?: string } = {},
): Promise<{ json: T; count: number | null; status: number }> {
  const { url, key } = storeSupabase();
  const query = options.query ? `?${options.query}` : "";
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const prefer = options.prefer ?? (method === "POST" ? "return=representation" : "return=representation");
  headers.Prefer = prefer;
  const response = await fetch(`${url}/rest/v1/${path}${query}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  const countHeader = response.headers.get("content-range");
  let count: number | null = null;
  if (countHeader) {
    const total = countHeader.split("/")[1];
    if (total && total !== "*") count = Number(total);
  }
  let json: T;
  const text = await response.text();
  try {
    json = text === "" ? ([] as T) : (JSON.parse(text) as T);
  } catch {
    json = text as T;
  }
  if (!response.ok) throw new StoreRestError(response.status, typeof text === "string" ? text.slice(0, 400) : "");
  return { json, count, status: response.status };
}

export async function storeRestSelect<T>(table: string, query: string): Promise<T[]> {
  const { json } = await storeRest<T[]>("GET", table, { query });
  return json;
}

export class StoreRestError extends Error {
  constructor(readonly status: number, readonly detail: string) {
    super(`Store REST call failed (${status}): ${detail}`);
  }
}