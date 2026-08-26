import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCOUNT_LEGACY_SESSION_COOKIE,
  ACCOUNT_SESSION_COOKIE,
  AccountBackendUnavailableError,
  loadAccountSession
} from "@/lib/account-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearStaleSessionCookies(response: NextResponse) {
  response.cookies.set(ACCOUNT_SESSION_COOKIE, "", {
    expires: new Date(0), httpOnly: true, secure: true, sameSite: "lax", path: "/"
  });
  response.cookies.set(ACCOUNT_LEGACY_SESSION_COOKIE, "", {
    expires: new Date(0), httpOnly: true, secure: true, sameSite: "lax", path: "/"
  });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value
      || cookieStore.get(ACCOUNT_LEGACY_SESSION_COOKIE)?.value;
    const session = await loadAccountSession(rawToken);
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (rawToken) clearStaleSessionCookies(response);
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      csrf_token: session.csrfToken
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Account session endpoint failed", {
      code: error instanceof AccountBackendUnavailableError ? "ACCOUNT_BACKEND_UNAVAILABLE" : "ACCOUNT_SESSION_ERROR"
    });
    return NextResponse.json(
      { error: "Service temporarily unavailable", code: "ACCOUNT_BACKEND_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
