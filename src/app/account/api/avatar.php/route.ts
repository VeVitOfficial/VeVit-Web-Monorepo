import { handleAccountRequest } from "@/lib/account-route";
import { avatarDownloadObject, avatarStoragePath } from "@/lib/account-avatar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/avatar.php: stream the user's stored profile photo from
// the private storage bucket. 404 with an empty body when unset/missing, 415
// for non-image content, private 300s caching like the PHP endpoint.

export async function GET() {
  return handleAccountRequest(async (session) => {
    const path = avatarStoragePath(String(session.user.avatar_url ?? ""), session.user.id);
    if (path === null) return new Response(null, { status: 404 });

    const result = await avatarDownloadObject(path);
    if (result.error !== null || result.http < 200 || result.http >= 300) {
      return new Response(null, { status: 404 });
    }
    const type = result.contentType ?? "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(type.split(";")[0]!.toLowerCase())) {
      return new Response(null, { status: 415 });
    }
    return new Response(result.body, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}

export async function POST(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET" } });
}