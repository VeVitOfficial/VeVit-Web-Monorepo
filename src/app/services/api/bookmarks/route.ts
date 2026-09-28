import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, rateLimit, readJson, requireRequest } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Uložení / odebrání poptávky do záložek přihlášeného uživatele.
export async function POST(request: Request): Promise<Response> {
  return handleServicesWrite(request, async (session) => {
    await rateLimit("services_bookmark", session.user.id, 120, 3600);
    const body = await readJson(request);
    const target = await requireRequest(String(body.request_id ?? ""));
    const supabase = accountSupabase();
    if (body.saved === false) {
      await supabase.from("services_bookmarks").delete().eq("user_id", session.user.id).eq("request_id", target.id);
      return Response.json({ saved: false });
    }
    const { error } = await supabase
      .from("services_bookmarks")
      .upsert({ user_id: session.user.id, request_id: target.id }, { onConflict: "user_id,request_id", ignoreDuplicates: true });
    if (error) throw new Error(`bookmark failed: ${error.code}`);
    return Response.json({ saved: true });
  });
}
