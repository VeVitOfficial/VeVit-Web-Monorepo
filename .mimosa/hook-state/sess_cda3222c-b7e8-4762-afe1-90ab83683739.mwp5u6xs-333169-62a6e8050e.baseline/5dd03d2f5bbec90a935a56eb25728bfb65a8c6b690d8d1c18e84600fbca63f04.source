import { clientIp } from "@/lib/account-auth";
import { lookupBin } from "@/lib/payment-bin-lookup";
import { storeRateLimitConsume, StoreRateLimitExceededError } from "@/lib/store-ratelimit";
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bank lookup for the card gateway. Accepts only the first 6-8 digits of a card number; the
 * prefix is never logged. 204 = unknown or lookup service not configured.
 */

const headers = { "Cache-Control": "no-store" };

function problem(status: number, code: string, message: string, extra: Record<string, string> = {}): Response {
  return Response.json({ error: { code, message } }, { status, headers: { ...headers, ...extra } });
}

export async function GET(request: Request): Promise<Response> {
  const prefix = new URL(request.url).searchParams.get("prefix") ?? "";
  if (!/^\d{6,8}$/.test(prefix)) return problem(400, "prefix_invalid", "Neplatný požadavek.");

  try {
    await storeRateLimitConsume("card_bin", clientIp(request), 30, 600);
  } catch (error) {
    if (error instanceof StoreRateLimitExceededError) {
      return problem(429, "rate_limited", "Příliš mnoho požadavků.", { "Retry-After": String(error.retryAfter) });
    }
    return new Response(null, { status: 204, headers });
  }

  try {
    const info = await lookupBin(prefix);
    if (info === null) return new Response(null, { status: 204, headers });
    return Response.json(
      { bank_key: info.bankKey, bank_name: info.bankName, scheme: info.scheme, funding: info.funding, country: info.country },
      { headers },
    );
  } catch {
    return new Response(null, { status: 204, headers });
  }
}
