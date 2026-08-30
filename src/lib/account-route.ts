import { NextResponse } from "next/server";
import {
  AccountBackendUnavailableError,
  loadSessionFromCookies,
  type AccountSession,
} from "@/lib/account-session";

/** Error results share the PHP jsonErr() shape { error: string }. */
class UnauthorizedAccountError extends Error {}
class ServerAccountError extends Error {}

function jsonAccountError(error: Error, status: number): Response {
  const message = status === 401
    ? "Unauthorized"
    : status === 503
      ? "Service temporarily unavailable"
      : "Chyba serveru.";
  return NextResponse.json(
    { error: message, ...(status === 503 ? { code: "ACCOUNT_BACKEND_UNAVAILABLE" } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Shared plumbing for migrated account API routes: resolves the session from
 * the __Host-vvsession cookie, maps backend outages to 503 and unknown
 * failures to 500 — mirroring the PHP requireAuth()/jsonErr() error shape.
 */
export async function handleAccountRequest(
  handler: (session: AccountSession) => Promise<Response>,
): Promise<Response> {
  try {
    const session = await loadSessionFromCookies();
    if (!session) return jsonAccountError(new UnauthorizedAccountError(), 401);
    return await handler(session);
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) return jsonAccountError(error, 503);
    console.error("Account route failed", { message: error instanceof Error ? error.message : String(error) });
    return jsonAccountError(new ServerAccountError(), 500);
  }
}