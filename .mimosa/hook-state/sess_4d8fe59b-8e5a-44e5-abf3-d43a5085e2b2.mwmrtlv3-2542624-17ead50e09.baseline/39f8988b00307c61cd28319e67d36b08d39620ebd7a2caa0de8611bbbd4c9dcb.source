import { NextResponse } from "next/server";
import { ACCOUNT_LEGACY_SESSION_COOKIE, ACCOUNT_SESSION_COOKIE } from "@/lib/account-session";

/**
 * Port of destroySession()'s cookie cleanup: expired Set-Cookie headers for
 * both session cookies, to be attached to the 204 responses of logout,
 * delete-account and any other endpoint that ends the session.
 */
export function destroyedSessionResponse(): NextResponse {
  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  const expired = { value: "", path: "/", secure: true, httpOnly: true, sameSite: "lax" as const, maxAge: 0 };
  response.cookies.set({ name: ACCOUNT_SESSION_COOKIE, ...expired });
  response.cookies.set({ name: ACCOUNT_LEGACY_SESSION_COOKIE, ...expired });
  return response;
}