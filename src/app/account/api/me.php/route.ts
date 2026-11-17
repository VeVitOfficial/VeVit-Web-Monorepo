import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  ACCOUNT_LEGACY_SESSION_COOKIE,
  ACCOUNT_SESSION_COOKIE,
  AccountBackendUnavailableError,
  loadAccountSession
} from "@/lib/account-session";
import { getUserAccess } from "@/lib/permissions";
import { awardXp, pragueDay } from "@/lib/xp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Den, kdy už tento prohlížeč dostal denní XP za návštěvu (vázáno na uživatele).
// Ušetří volání award_xp u všech dalších me.php toho dne.
const XP_DAY_COOKIE = "vv_xp_day";

function xpDayValue(userId: string, day: string): string {
  return `${day}.${createHash("sha256").update(userId).digest("hex").slice(0, 16)}`;
}

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
    const session = await loadAccountSession(rawToken, { cache: true });
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (rawToken) clearStaleSessionCookies(response);
      return response;
    }

    const userId = session.user.id;
    const day = pragueDay();
    const xpDay = xpDayValue(userId, day);
    const needsDailyXp = cookieStore.get(XP_DAY_COOKIE)?.value !== xpDay;

    // Daily visit XP is idempotent per Prague day; award first so the returned
    // xp/level/ranks already include it. Další volání toho dne jdou rovnou na oprávnění.
    const daily = needsDailyXp ? await awardXp(userId, "account.daily", day) : null;
    const user = daily && daily.awarded > 0
      ? { ...session.user, xp: daily.xp, level: daily.level }
      : session.user;
    const access = await getUserAccess(userId);

    const response = NextResponse.json({
      authenticated: true,
      user,
      access,
      xp_award: daily && daily.awarded > 0 ? daily : null,
      csrf_token: session.csrfToken
    }, { headers: { "Cache-Control": "no-store" } });
    if (needsDailyXp && daily) {
      response.cookies.set(XP_DAY_COOKIE, xpDay, {
        httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2 * 24 * 60 * 60
      });
    }
    return response;
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
