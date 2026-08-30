import { handleAccountRequest } from "@/lib/account-route";
import {
  accountSupabase,
  logActivity,
  registerNicknameIsValid,
} from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/onboarding.php: the OAuth-first-login profile completion
// — set full_name + nickname with an exact-nickname uniqueness check (note the
// legacy endpoint checks the raw nickname column, not nickname_normalized).

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const fullName = String(body.full_name ?? "").trim();
    const nickname = String(body.nickname ?? "").trim();
    if (Buffer.byteLength(fullName, "utf8") < 2) {
      return Response.json({ error: "Zadejte celé jméno alespoň o 2 znacích.", field: "full_name" }, { status: 422 });
    }
    if (!registerNicknameIsValid(nickname)) {
      return Response.json(
        { error: "Přezdívka musí mít 3–30 znaků a jen písmena, čísla, _ nebo tečku.", field: "nickname" },
        { status: 422 },
      );
    }
    const { data: taken, error: takenError } = await accountSupabase()
      .from("users")
      .select("id")
      .eq("nickname", nickname)
      .limit(1)
      .maybeSingle();
    if (takenError) return Response.json({ error: "Dostupnost přezdívky se nepodařilo ověřit." }, { status: 503 });
    if (taken && (taken as { id: string }).id !== session.user.id) {
      return Response.json({ error: "Tato přezdívka je již obsazená.", field: "nickname" }, { status: 409 });
    }
    const { error: updateError } = await accountSupabase()
      .from("users")
      .update({ full_name: fullName, nickname })
      .eq("id", session.user.id);
    if (updateError) return Response.json({ error: "Profil se nepodařilo uložit." }, { status: 500 });

    await logActivity(session.user.id, "profile_update", "Dokončení OAuth profilu");
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}