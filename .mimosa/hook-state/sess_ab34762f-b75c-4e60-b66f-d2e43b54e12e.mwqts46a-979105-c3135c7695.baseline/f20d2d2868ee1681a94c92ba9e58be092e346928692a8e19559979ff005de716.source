import { clientIp } from "@/lib/account-auth";
import { icoValid, mapAresSubject, type CompanyInfo } from "@/lib/checkout/company";
import { StoreError, storeJsonError, storeRequireMethod, storeRequireSameOrigin } from "@/lib/store-config";
import { StoreRateLimitExceededError, storeRateLimitConsume } from "@/lib/store-ratelimit";
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Company lookup for the checkout. The browser never talks to ARES directly: this route validates
 * the ICO, asks ARES with a short timeout and caches answers for an hour per server instance.
 */

const ARES_URL = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";
const TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

const cache = new Map<string, { expires: number; value: CompanyInfo }>();

function reply(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function handler(request: Request): Promise<Response> {
  try {
    storeRequireMethod(request, ["GET"]);
    storeRequireSameOrigin(request);
    const ico = new URL(request.url).searchParams.get("ico") ?? "";
    if (!icoValid(ico)) return storeJsonError(422, "ico_invalid", "IČO není platné. Zkontroluj, jestli v něm není překlep.");

    try {
      await storeRateLimitConsume("store_ares", clientIp(request), 20, 600);
    } catch (error) {
      if (error instanceof StoreRateLimitExceededError) {
        return storeJsonError(429, "rate_limited", "Příliš mnoho dotazů. Zkus to za chvíli.", { "Retry-After": String(error.retryAfter) });
      }
      throw error;
    }

    const cached = cache.get(ico);
    if (cached && cached.expires > Date.now()) return reply(cached.value);

    let response: Response;
    try {
      response = await fetch(`${ARES_URL}/${ico}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return storeJsonError(503, "ares_unavailable", "Registr ARES teď neodpovídá. Údaje vyplň ručně.");
    }
    if (response.status === 404) return storeJsonError(404, "ico_not_found", "Firmu s tímto IČO jsme v registru nenašli.");
    if (!response.ok) return storeJsonError(503, "ares_unavailable", "Registr ARES teď neodpovídá. Údaje vyplň ručně.");

    let company: CompanyInfo | null;
    try {
      company = mapAresSubject(await response.json());
    } catch {
      company = null;
    }
    if (company === null) return storeJsonError(503, "ares_unavailable", "Registr ARES teď neodpovídá. Údaje vyplň ručně.");

    if (cache.size >= CACHE_MAX_ENTRIES) cache.clear();
    cache.set(ico, { expires: Date.now() + CACHE_TTL_MS, value: company });
    return reply(company);
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    console.error("[store:ares] failure", error instanceof Error ? error.name : "unknown");
    return storeJsonError(503, "ares_unavailable", "Registr ARES teď neodpovídá. Údaje vyplň ručně.");
  }
}

export const GET = handler;
export const OPTIONS = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
