import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase, logActivity } from "@/lib/account-auth";
import { avatarDeleteObject, avatarStoragePath } from "@/lib/account-avatar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/avatar-remove.php: null the stored avatar reference,
// delete the underlying object, log the removal.

export async function POST() {
  return handleAccountRequest(async (session) => {
    const previous = avatarStoragePath(String(session.user.avatar_url ?? ""), session.user.id);
    const { error } = await accountSupabase()
      .from("users")
      .update({ avatar_url: null })
      .eq("id", session.user.id);
    if (error) return Response.json({ error: "Fotografii se nepodařilo odebrat." }, { status: 500 });
    if (previous !== null) await avatarDeleteObject(previous);

    await logActivity(session.user.id, "avatar_remove", "Profilová fotografie byla odebrána");
    return Response.json({ avatar_url: null }, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}