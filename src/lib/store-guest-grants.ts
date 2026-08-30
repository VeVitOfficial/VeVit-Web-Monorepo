import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import "server-only";

/**
 * Replacement for the PHP-session-backed store guest grants
 * ($_SESSION['_store_checkout_grants'] / _store_order_grants). Vercel has no
 * PHP session store, so grants live in one HMAC-signed httpOnly cookie — the
 * raw grant values never reach client JavaScript, only the server can verify
 * them, and each entry carries its own expiry.
 *
 * Two entry kinds (mirroring the PHP session keys):
 *  - checkout: {public_id, grant, expires_at}  → authorizes create-payment
 *  - order:    {public_id, created_at}         → authorizes order access later
 */

export const STORE_GRANT_COOKIE = "__Host-vvstore";

type CheckoutGrant = { kind: "checkout"; public_id: string; grant: string; expires_at: string };
type OrderGrant = { kind: "order"; public_id: string; grant: string; created_at: number };
export type StoreGrant = CheckoutGrant | OrderGrant;

const MAX_ENTRIES = 20;
const MAX_COOKIE_BYTES = 3800; // RFC 6265 recommends ~4 KB per cookie

function signPayload(payload: string): string {
  const secret = process.env.VEVIT_APP_SECRET?.trim();
  if (!secret) throw new Error("VEVIT_APP_SECRET is not configured");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encodeCookie(entries: StoreGrant[]): string {
  const payload = Buffer.from(JSON.stringify(entries), "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function decodeCookieValue(value: string | undefined): StoreGrant[] {
  if (!value) return [];
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return [];
  const payload = value.slice(0, dot);
  const expected = Buffer.from(signPayload(payload));
  let actual: Buffer;
  try {
    actual = Buffer.from(value.slice(dot + 1), "base64url");
  } catch {
    return [];
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return [];
  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is StoreGrant =>
        entry !== null && typeof entry === "object" &&
        ((entry as StoreGrant).kind === "checkout" || (entry as StoreGrant).kind === "order"),
    );
  } catch {
    return [];
  }
}

function isExpired(entry: StoreGrant, now: number): boolean {
  if (entry.kind === "checkout") {
    const ts = Date.parse(entry.expires_at);
    return !Number.isFinite(ts) || ts <= now;
  }
  return now - entry.created_at > 30 * 86_400_000;
}

export function pruneGrants(entries: StoreGrant[], now = Date.now()): StoreGrant[] {
  const kept = entries.filter((entry) => !isExpired(entry, now));
  return kept.slice(-MAX_ENTRIES);
}

export async function readStoreGrants(): Promise<StoreGrant[]> {
  try {
    const jar = await cookies();
    return pruneGrants(decodeCookieValue(jar.get(STORE_GRANT_COOKIE)?.value));
  } catch {
    return [];
  }
}

async function writeStoreGrants(entries: StoreGrant[]): Promise<void> {
  // Drop oldest entries until the serialized value fits the cookie budget.
  let value = encodeCookie(entries);
  let trimmed = entries;
  while (Buffer.byteLength(value, "utf8") > MAX_COOKIE_BYTES && trimmed.length > 0) {
    trimmed = trimmed.slice(1);
    value = encodeCookie(trimmed);
  }
  const jar = await cookies();
  jar.set(STORE_GRANT_COOKIE, value, {
    name: STORE_GRANT_COOKIE,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86_400,
  });
}

export async function readCheckoutGrant(snapshotPublicId: string): Promise<StoreGrant | null> {
  const entries = await readStoreGrants();
  const found = entries.find((entry) => entry.kind === "checkout" && entry.public_id === snapshotPublicId);
  return found ?? null;
}

export async function saveCheckoutGrant(publicId: string, grant: string, expiresAt: string): Promise<void> {
  const entries = await readStoreGrants();
  entries.push({ kind: "checkout", public_id: publicId, grant, expires_at: expiresAt });
  await writeStoreGrants(entries);
}

export async function saveOrderGrant(orderPublicId: string, grant: string): Promise<void> {
  const entries = await readStoreGrants();
  entries.push({ kind: "order", public_id: orderPublicId, grant, created_at: Date.now() });
  await writeStoreGrants(entries);
}

export async function readOrderGrant(orderPublicId: string): Promise<string | null> {
  const entry = (await readStoreGrants()).find((e) => e.kind === "order" && e.public_id === orderPublicId);
  return entry && entry.kind === "order" ? entry.grant : null;
}

export async function hasOrderGrant(orderPublicId: string): Promise<boolean> {
  return (await readStoreGrants()).some((entry) => entry.kind === "order" && entry.public_id === orderPublicId);
}