import { handleAccountRequest } from "@/lib/account-route";
import { logActivity } from "@/lib/account-auth";
import { csrfValid } from "@/lib/billing";
import { missingProfileFields } from "@/lib/profile-completion";
import { awardXp } from "@/lib/xp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Dokončit profil": once every profile field is filled, awards the one-time
// profile XP and moves completion from 99 % to 100 %. Idempotent — a second
// call returns the same state without new XP.

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    if (!csrfValid(request, session)) {
      return Response.json({ error: "Neplatný požadavek." }, { status: 403 });
    }
    const missing = missingProfileFields(session.user);
    if (missing.length > 0) {
      return Response.json(
        { error: `Nejdřív doplňte: ${missing.join(", ")}.`, missing },
        { status: 409 },
      );
    }

    const award = await awardXp(session.user.id, "account.profile_complete", "completed");
    if (award === null) return Response.json({ error: "Profil se nepodařilo dokončit." }, { status: 500 });
    if (award.awarded > 0) await logActivity(session.user.id, "profile_update", "Profil dokončen");

    return Response.json(
      { completion: 100, xp_award: award.awarded > 0 ? award : null },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
