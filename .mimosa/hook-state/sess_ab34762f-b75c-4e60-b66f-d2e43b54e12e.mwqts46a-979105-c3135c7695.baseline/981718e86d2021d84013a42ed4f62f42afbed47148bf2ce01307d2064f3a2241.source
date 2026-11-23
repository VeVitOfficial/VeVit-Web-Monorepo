import "server-only";

import { AccountBackendUnavailableError } from "@/lib/account-session";

/**
 * Supabase Storage helpers for profile photos, ported from
 * account/lib/avatar-storage.php. Avatars live in the private `vevit-avatars`
 * bucket and are referenced in users.avatar_url as "storage:<user>/<random>.<ext>".
 */

export const AVATAR_BUCKET = "vevit-avatars";
export const AVATAR_MAX_BYTES = 5242880; // 5 MB

function supabaseConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) throw new AccountBackendUnavailableError("Supabase server configuration is missing");
  return { url, key };
}

export type AvatarExtension = "jpg" | "png" | "webp";

/** Port of avatar_storage_path: strict "<userId>/<32 hex>.<jpg|png|webp>" check. */
export function avatarStoragePath(value: string, userId: string): string | null {
  const prefix = `storage:${userId}/`;
  if (!value.startsWith(prefix)) return null;
  const path = value.slice("storage:".length);
  return new RegExp(`^${userId}/[a-f0-9]{32}\\.(jpg|png|webp)$`).test(path) ? path : null;
}

function avatarObjectUrl(kind: "upload" | "download", path: string): string {
  const { url } = supabaseConfig();
  const base = kind === "download" ? "object/authenticated" : "object";
  return `${url}/storage/v1/${base}/${AVATAR_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function avatarStorageHeaders(extra?: HeadersInit): Headers {
  const { key } = supabaseConfig();
  const headers = new Headers(extra);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  return headers;
}

export type AvatarStorageResult = {
  http: number;
  body: ArrayBuffer | null;
  contentType: string | null;
  error: string | null;
};

/** Port of avatar_storage_request via fetch (PHP cURL equivalent). */
export async function avatarStorageRequest(
  method: string,
  url: string,
  headers: HeadersInit,
  body?: BodyInit,
): Promise<AvatarStorageResult> {
  try {
    const res = await fetch(url, { method, headers: avatarStorageHeaders(headers), body, cache: "no-store" });
    return {
      http: res.status,
      body: res.ok || res.status < 400 ? await res.arrayBuffer() : null,
      contentType: res.headers.get("content-type"),
      error: null,
    };
  } catch (error) {
    return {
      http: 0,
      body: null,
      contentType: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Port of avatar_upload_object: POST (upsert=false) the raw file into the bucket. */
export async function avatarUploadObject(path: string, mime: string, contents: ArrayBuffer): Promise<boolean> {
  const res = await avatarStorageRequest("POST", avatarObjectUrl("upload", path), {
    "Content-Type": mime,
    "x-upsert": "false",
  }, contents);
  return res.error === null && res.http >= 200 && res.http < 300;
}

/** Port of avatar_delete_object: bulk-prefixed DELETE matching the PHP helper. */
export async function avatarDeleteObject(path: string): Promise<boolean> {
  const res = await avatarStorageRequest("DELETE", avatarObjectUrl("upload", ""), {
    "Content-Type": "application/json",
  }, JSON.stringify({ prefixes: [path] }));
  return res.error === null && res.http >= 200 && res.http < 300;
}

/** Port of avatar_download_object: GET the private object (no signed URL). */
export async function avatarDownloadObject(path: string): Promise<AvatarStorageResult> {
  return avatarStorageRequest("GET", avatarObjectUrl("download", path), {});
}

// ── Upload validation (port of avatar_validate_upload) ─────────────────────────
// finfo() magic-byte sniffing + getimagesize() dimension caps, reimplemented.

function sniffImageType(bytes: Uint8Array): AvatarExtension | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "webp";
  return null;
}

const EXTENSIONS: Record<AvatarExtension, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/**
 * Port of the getimagesize() dimension half of avatar_validate_upload.
 * Returns null when the dimensions cannot be parsed (treated like PHP's
 * non-array result → invalid file).
 */
function imageDimensions(bytes: Uint8Array, ext: AvatarExtension): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (ext === "png") {
    if (bytes.length < 24) return null;
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (ext === "webp") {
    if (bytes.length < 30) return null;
    const format = String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!);
    // VP8L: bits 14–24 of the 4-byte little-endian bignum encode size-1 (14 bits each).
    if (format === "VP8L") {
      const n = bytes[21]! | (bytes[22]! << 8) | (bytes[23]! << 16) | (bytes[24]! << 24);
      return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 };
    }
    if (format === "VP8X") {
      return { width: (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16)) + 1, height: (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16)) + 1 };
    }
    if (format === "VP8") {
      // Lossy: 24-bit start code FFE0 then 3-byte keyframe tag, then 14-bit dims.
      if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
      const w = view.getUint16(26, true) & 0x3fff;
      const h = view.getUint16(28, true) & 0x3fff;
      return { width: w, height: h };
    }
    return null;
  }
  // JPEG: walk markers for an SOFn frame header.
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1]!;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (offset + 9 > bytes.length) return null;
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

/**
 * Port of avatar_validate_upload: returns { mime, extension } for a valid
 * JPG/PNG/WebP within the size and dimension caps, or null when invalid.
 */
export function validateAvatarUpload(size: number, bytes: Uint8Array): { mime: string; extension: AvatarExtension } | null {
  if (size < 1 || size > AVATAR_MAX_BYTES) return null;
  const ext = sniffImageType(bytes);
  if (ext === null) return null;
  const dimensions = imageDimensions(bytes, ext);
  if (dimensions === null || dimensions.width > 6000 || dimensions.height > 6000) return null;
  return { mime: EXTENSIONS[ext], extension: ext };
}