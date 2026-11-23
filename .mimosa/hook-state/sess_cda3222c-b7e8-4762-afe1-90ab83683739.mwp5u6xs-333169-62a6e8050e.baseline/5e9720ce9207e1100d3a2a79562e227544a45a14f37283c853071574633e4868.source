import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { handleAccountRequest } from "@/lib/account-route";
import {
  ACCOUNT_LEGACY_SESSION_COOKIE,
  ACCOUNT_SESSION_COOKIE,
} from "@/lib/account-session";
import { accountSupabase } from "@/lib/account-auth";
import { destroyedSessionResponse } from "@/lib/account-session-destroy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/logout.php (destroySession): revoke the session row(s)
// for both session cookies, clear the cookies, answer 204 — empty body like
// PHP's jsonOk(null, 204). The legacy __vvsession may have been set with a
// Domain attribute by the edge function, so a host-only delete cookie may not
// clear that one in the browser — but the DB row revocation already makes any
// surviving cookie inert.

export async function POST() {
  return handleAccountRequest(async () => {
    const cookieStore = await cookies();
    const tokens = [ACCOUNT_SESSION_COOKIE, ACCOUNT_LEGACY_SESSION_COOKIE]
      .map((name) => cookieStore.get(name)?.value ?? "")
      .filter((token) => /^[0-9a-f]{64}$/i.test(token));
    const now = new Date().toISOString();
    let revoked = true;
    for (const token of tokens) {
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const { error } = await accountSupabase()
        .from("sessions")
        .update({ revoked_at: now, revoked_reason: "logout" })
        .eq("token_hash", tokenHash);
      if (error) revoked = false;
    }
    if (!revoked) return Response.json({ error: "Unable to end session" }, { status: 500 });
    return destroyedSessionResponse();
  });
}