import "server-only";

import { accountSupabase, clientIp } from "../account-auth.ts";
import { loadAccountSession } from "../account-session.ts";
import { sha256Hex } from "./crypto.ts";
import type { OfficeDeps } from "./deps.ts";
import { dnsFromEnv } from "./dns.ts";
import { loadOfficeKeys } from "./jwt.ts";
import { SupabaseOfficeStore } from "./supabase-store.ts";

const COOKIE = "__Host-vvsession";

function sessionToken(req: Request): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return v.join("=");
  }
  return undefined;
}

let cached: OfficeDeps | null = null;
let storeInstance: SupabaseOfficeStore | null = null;

/** The production wiring: Supabase, the existing session cookie, the existing login_attempts rate limiter, keys from the environment. */
export function officeDeps(): OfficeDeps {
  if (cached) return cached;
  const env = process.env;
  let keys: OfficeDeps["keys"] = null;
  try { keys = loadOfficeKeys(env); } catch { console.error("[office] OIDC signing keys are invalid"); }
  const stripeSecret = env.OFFICE_STRIPE_WEBHOOK_SECRET?.trim();
  let pricePlans: Record<string, string> = {};
  try { pricePlans = JSON.parse(env.OFFICE_STRIPE_PRICE_PLANS ?? "{}"); } catch { /* none */ }
  cached = {
    // Created on first use, so discovery and the JWKS work without database access.
    get store() { return (storeInstance ??= new SupabaseOfficeStore()); },
    dns: dnsFromEnv(env),
    keys,
    now: () => Date.now(),
    issuer: env.OFFICE_OIDC_ISSUER?.trim() || "https://vevit.cz/account",
    cloudRedirectUris: (env.OFFICE_CLOUD_REDIRECT_URIS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    sealKey: env.OFFICE_LINK_SEAL_KEY?.trim() || null,
    ipSecret: env.OFFICE_AUDIT_IP_SECRET?.trim() || env.VEVIT_APP_SECRET?.trim() || "unset",
    session: async (req) => {
      const s = await loadAccountSession(sessionToken(req));
      return s ? { userId: String(s.user.id), csrf: s.csrfToken } : null;
    },
    // Fail closed: when the counter cannot be reached the endpoint answers 503 instead of running unlimited.
    rateLimit: async (key, ns, windowSeconds, max) => {
      if (!key || key === "unknown") return "unavailable";
      const { data, error } = await accountSupabase().rpc("office_rate_consume", { p_key: sha256Hex(`${ns}|${key}`), p_window_seconds: windowSeconds, p_max: max });
      if (error) return "unavailable";
      return data === true ? "ok" : "limited";
    },
    clientIp,
    stripe: stripeSecret ? { secret: stripeSecret, pricePlans } : null,
  };
  return cached;
}

/** Wraps a handler so backend outages become 503 and nothing else leaks. */
export async function guarded(run: (d: OfficeDeps) => Promise<Response>): Promise<Response> {
  try {
    return await run(officeDeps());
  } catch (error) {
    console.error("[office] request failed", { message: error instanceof Error ? error.message : String(error) });
    return new Response(JSON.stringify({ error: "temporarily_unavailable" }), { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
}
