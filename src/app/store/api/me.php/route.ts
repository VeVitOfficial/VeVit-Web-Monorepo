import "server-only";

import { getStoreUser } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Port of store/api/me.php — nav hydration for the store UI. Identity comes
 * from the shared host-only account session (getStoreUser()); an unavailable
 * account backend counts as unauthenticated (fail closed).
 *
 * CORS echoes the Origin only when it is listed in STORE_ALLOWED_ORIGINS —
 * never a wildcard for authenticated data.
 */

function allowedOrigins(): string[] {
  return process.env.STORE_ALLOWED_ORIGINS?.split(",").map((value) => value.trim()).filter((value) => value !== "") ?? [];
}

/** CORS echo — mirrors the PHP block that runs before the OPTIONS short-circuit. */
function corsEchoHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowed = allowedOrigins();
  if (origin !== "" && allowed.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    };
  }
  return {};
}

export async function OPTIONS(request: Request): Promise<Response> {
  // PHP sets the CORS headers before the OPTIONS exit, so 204 carries them too.
  return new Response(null, { status: 204, headers: { Allow: "GET, OPTIONS", ...corsEchoHeaders(request) } });
}

async function handler(request: Request): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, private",
    Pragma: "no-cache",
    ...corsEchoHeaders(request),
  };
  const user = await getStoreUser();
  // PHP uses `$user['full_name'] ?? $user['nickname'] ?? ''` (null coalescing);
  // getStoreUser() coerces a missing full_name to '', so treat '' as absent.
  const displayName = user !== null && user.full_name === "" ? (user.nickname ?? "") : user?.full_name ?? "";
  return new Response(JSON.stringify({
    authenticated: user !== null,
    user: user
      ? {
          id: user.id,
          display_name: displayName,
          avatar_url: user.avatar_url,
        }
      : null,
  }), { status: 200, headers });
}

export async function GET(request: Request): Promise<Response> {
  return handler(request);
}