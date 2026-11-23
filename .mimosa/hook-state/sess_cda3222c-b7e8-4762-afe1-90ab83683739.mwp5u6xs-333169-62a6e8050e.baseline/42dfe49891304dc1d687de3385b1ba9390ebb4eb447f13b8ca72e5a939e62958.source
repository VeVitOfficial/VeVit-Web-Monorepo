import { randomBytes } from "node:crypto";
import { handleAccountRequest } from "@/lib/account-route";
import {
  avatarDeleteObject,
  avatarStoragePath,
  avatarUploadObject,
  validateAvatarUpload,
} from "@/lib/account-avatar";
import { accountSupabase, logActivity } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/avatar-upload.php: multipart POST (field "avatar"),
// magic-byte + dimension validation, upload into the private bucket, save the
// storage: reference on the user, delete the previous object.

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    let file: File;
    try {
      const form = await request.formData();
      const entry = form.get("avatar");
      if (!(entry instanceof File)) throw new Error("missing");
      file = entry;
    } catch {
      return Response.json({ error: "Fotografie musí být obrázek JPG, PNG nebo WebP do 5 MB.", field: "avatar" }, { status: 422 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid = validateAvatarUpload(file.size, bytes);
    if (valid === null) {
      return Response.json({ error: "Fotografie musí být obrázek JPG, PNG nebo WebP do 5 MB.", field: "avatar" }, { status: 422 });
    }

    const random = randomBytes(16).toString("hex");
    const path = `${session.user.id}/${random}.${valid.extension}`;
    const uploaded = await avatarUploadObject(path, valid.mime, bytes.buffer as ArrayBuffer);
    if (!uploaded) {
      return Response.json({ error: "Fotografii se nepodařilo uložit. Zkuste to prosím znovu." }, { status: 503 });
    }
    const value = `storage:${session.user.id}/${random}.${valid.extension}`;
    const { error: updateError } = await accountSupabase()
      .from("users")
      .update({ avatar_url: value })
      .eq("id", session.user.id);
    if (updateError) {
      await avatarDeleteObject(path);
      return Response.json({ error: "Fotografii se nepodařilo uložit. Zkuste to prosím znovu." }, { status: 500 });
    }

    const previous = avatarStoragePath(String(session.user.avatar_url ?? ""), session.user.id);
    if (previous !== null) await avatarDeleteObject(previous);

    await logActivity(session.user.id, "avatar_update", "Profilová fotografie byla změněna");
    return Response.json({ avatar_url: value }, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}