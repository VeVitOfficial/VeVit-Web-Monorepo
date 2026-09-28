import "server-only";

import { accountSupabase } from "@/lib/account-auth";
import {
  AccountBackendUnavailableError,
  loadSessionFromCookies,
  type AccountSession,
} from "@/lib/account-session";
import { StoreRateLimitExceededError, storeRateLimitConsume } from "@/lib/store-ratelimit";

/**
 * VeVit Services MVP (migration 023). Every read and write goes through the
 * service-role client; clients have no direct table access. Ownership and
 * visibility rules live here, state transitions that must be atomic live in
 * the SQL functions services_accept_offer / services_mark_done.
 */

export type ServicesCategory = { slug: string; name_cs: string };

export type ServicesRequest = {
  id: string;
  author_id: string;
  category: string;
  title: string;
  description: string;
  city: string;
  remote: boolean;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: "open" | "assigned" | "completed" | "cancelled" | "expired";
  accepted_offer_id: string | null;
  author_done: boolean;
  provider_done: boolean;
  expires_at: string;
  created_at: string;
};

export type ServicesOffer = {
  id: string;
  request_id: string;
  provider_id: string;
  price: number;
  delivery: string;
  message: string;
  status: "sent" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
};

export type ServicesMessage = { id: number; offer_id: string; sender_id: string; body: string; created_at: string };

export type ServicesProvider = {
  user_id: string;
  headline: string;
  bio: string;
  categories: string[];
  city: string;
  radius_km: number;
  remote: boolean;
  active: boolean;
};

export type PublicUser = { id: string; name: string; avatar_url: string | null };

const REQUEST_COLUMNS =
  "id,author_id,category,title,description,city,remote,budget_min,budget_max,deadline,status,accepted_offer_id,author_done,provider_done,expires_at,created_at";
const OFFER_COLUMNS = "id,request_id,provider_id,price,delivery,message,status,created_at";

export class ServicesError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

function db() {
  return accountSupabase();
}

function fail(status: number, code: string, message: string): never {
  throw new ServicesError(status, code, message);
}

// ── Request plumbing ─────────────────────────────────────────────────────────

/** Same-origin check for JSON writes (the store pattern; forms never cross origins). */
function requireSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    originHost = "";
  }
  if (host && originHost !== host) fail(403, "origin_rejected", "Neplatný požadavek. Obnovte prosím stránku.");
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Wraps a Services API write: origin check, session, JSON errors. */
export async function handleServicesWrite(
  request: Request,
  handler: (session: AccountSession) => Promise<Response>,
): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  try {
    requireSameOrigin(request);
    const session = await loadSessionFromCookies();
    if (!session) fail(401, "login_required", "Pro tuto akci se přihlaste.");
    if (session.user.status !== "active") fail(403, "account_inactive", "Účet není aktivní.");
    return await handler(session);
  } catch (error) {
    if (error instanceof ServicesError) {
      return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status, headers });
    }
    if (error instanceof StoreRateLimitExceededError) {
      return Response.json(
        { error: { code: "rate_limited", message: "Příliš mnoho pokusů. Zkuste to prosím za chvíli." } },
        { status: 429, headers: { ...headers, "Retry-After": String(error.retryAfter) } },
      );
    }
    if (error instanceof AccountBackendUnavailableError) {
      return Response.json({ error: { code: "unavailable", message: "Služba je dočasně nedostupná." } }, { status: 503, headers });
    }
    console.error("[services] request failed", error instanceof Error ? error.message : error);
    return Response.json({ error: { code: "server_error", message: "Něco se nepovedlo. Zkuste to znovu." } }, { status: 500, headers });
  }
}

export async function rateLimit(scope: string, userId: string, limit: number, windowSeconds: number): Promise<void> {
  await storeRateLimitConsume(scope, `user:${userId}`, limit, windowSeconds);
}

// ── Validation ───────────────────────────────────────────────────────────────

export function text(value: unknown, field: string, min: number, max: number): string {
  const result = typeof value === "string" ? value.trim().replace(/\r\n/g, "\n") : "";
  if (result.length < min || result.length > max) {
    fail(400, "invalid_input", min > 0
      ? `${field}: zadejte ${min}–${max} znaků.`
      : `${field}: nejvýš ${max} znaků.`);
  }
  return result;
}

export function optionalInt(value: unknown, field: string, max = 10_000_000): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
  if (!Number.isInteger(number) || number < 0 || number > max) fail(400, "invalid_input", `${field}: zadejte celé číslo.`);
  return number;
}

export function uuid(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    fail(404, "not_found", "Záznam nebyl nalezen.");
  }
  return value.toLowerCase();
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function listCategories(): Promise<ServicesCategory[]> {
  const { data, error } = await db().from("services_categories").select("slug,name_cs").eq("active", true).order("sort_order");
  if (error) throw new AccountBackendUnavailableError("categories unavailable");
  return (data ?? []) as ServicesCategory[];
}

export async function categoryExists(slug: string): Promise<boolean> {
  const { data } = await db().from("services_categories").select("slug").eq("slug", slug).eq("active", true).maybeSingle();
  return data !== null;
}

export async function listOpenRequests(filters: { category?: string; city?: string; remote?: boolean; q?: string }): Promise<ServicesRequest[]> {
  await db().rpc("services_expire_requests");
  let query = db().from("services_requests").select(REQUEST_COLUMNS).eq("status", "open").order("created_at", { ascending: false }).limit(60);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.remote) query = query.eq("remote", true);
  if (filters.city) query = query.ilike("city", `%${escapeLike(filters.city)}%`);
  if (filters.q) query = query.ilike("title", `%${escapeLike(filters.q)}%`);
  const { data, error } = await query;
  if (error) throw new AccountBackendUnavailableError("requests unavailable");
  return (data ?? []) as ServicesRequest[];
}

function escapeLike(value: string): string {
  return value.slice(0, 60).replace(/[%_\\,()]/g, " ");
}

export async function getRequest(id: string): Promise<ServicesRequest | null> {
  const { data, error } = await db().from("services_requests").select(REQUEST_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new AccountBackendUnavailableError("request unavailable");
  return data as ServicesRequest | null;
}

export async function requireRequest(id: string): Promise<ServicesRequest> {
  const request = await getRequest(uuid(id));
  if (!request) fail(404, "not_found", "Poptávka nebyla nalezena.");
  return request;
}

export async function getOffer(id: string): Promise<ServicesOffer | null> {
  const { data } = await db().from("services_offers").select(OFFER_COLUMNS).eq("id", id).maybeSingle();
  return data as ServicesOffer | null;
}

export async function requireOffer(id: string): Promise<ServicesOffer> {
  const offer = await getOffer(uuid(id));
  if (!offer) fail(404, "not_found", "Nabídka nebyla nalezena.");
  return offer;
}

/** Offers the viewer may see: all for the request author, own offer for a provider. */
export async function offersForViewer(request: ServicesRequest, viewerId: string | null): Promise<ServicesOffer[]> {
  if (!viewerId) return [];
  let query = db().from("services_offers").select(OFFER_COLUMNS).eq("request_id", request.id).order("created_at");
  if (viewerId !== request.author_id) query = query.eq("provider_id", viewerId);
  const { data } = await query;
  return (data ?? []) as ServicesOffer[];
}

/** Only the two parties of an offer (request author + provider) see its messages. */
export async function canAccessOffer(offer: ServicesOffer, userId: string): Promise<{ request: ServicesRequest; counterpartId: string } | null> {
  const request = await getRequest(offer.request_id);
  if (!request) return null;
  if (userId === offer.provider_id) return { request, counterpartId: request.author_id };
  if (userId === request.author_id) return { request, counterpartId: offer.provider_id };
  return null;
}

export async function listMessages(offerId: string): Promise<ServicesMessage[]> {
  const { data } = await db()
    .from("services_messages")
    .select("id,offer_id,sender_id,body,created_at")
    .eq("offer_id", offerId)
    .eq("hidden", false)
    .order("id")
    .limit(500);
  return (data ?? []) as ServicesMessage[];
}

export async function publicUsers(ids: string[]): Promise<Map<string, PublicUser>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, PublicUser>();
  if (unique.length === 0) return map;
  const { data } = await db().from("users").select("id,nickname,full_name,avatar_url").in("id", unique);
  for (const row of (data ?? []) as { id: string; nickname: string | null; full_name: string | null; avatar_url: string | null }[]) {
    map.set(row.id, { id: row.id, name: row.nickname || firstName(row.full_name) || "Uživatel", avatar_url: row.avatar_url });
  }
  return map;
}

function firstName(fullName: string | null): string {
  return (fullName ?? "").trim().split(/\s+/)[0] ?? "";
}

/** Contact details are revealed only between the parties of an accepted offer. */
export async function contactFor(userId: string): Promise<{ email: string; phone: string | null }> {
  const { data } = await db().from("users").select("email,phone_e164").eq("id", userId).maybeSingle();
  const row = data as { email?: string; phone_e164?: string | null } | null;
  return { email: row?.email ?? "", phone: row?.phone_e164 ?? null };
}

export async function getProvider(userId: string): Promise<ServicesProvider | null> {
  const { data } = await db()
    .from("services_providers")
    .select("user_id,headline,bio,categories,city,radius_km,remote,active")
    .eq("user_id", userId)
    .maybeSingle();
  return data as ServicesProvider | null;
}

export async function reviewSummary(userId: string): Promise<{ count: number; average: number | null; reviews: { stars: number; body: string; author_id: string; created_at: string }[] }> {
  const { data } = await db()
    .from("services_reviews")
    .select("stars,body,author_id,created_at")
    .eq("subject_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const reviews = (data ?? []) as { stars: number; body: string; author_id: string; created_at: string }[];
  const average = reviews.length ? reviews.reduce((sum, row) => sum + row.stars, 0) / reviews.length : null;
  return { count: reviews.length, average, reviews };
}

export async function myRequests(userId: string): Promise<ServicesRequest[]> {
  const { data } = await db().from("services_requests").select(REQUEST_COLUMNS).eq("author_id", userId).order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as ServicesRequest[];
}

export async function myOffers(userId: string): Promise<(ServicesOffer & { request: Pick<ServicesRequest, "id" | "title" | "status"> | null })[]> {
  const { data } = await db()
    .from("services_offers")
    .select(`${OFFER_COLUMNS},request:services_requests!services_offers_request_id_fkey(id,title,status)`)
    .eq("provider_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as (ServicesOffer & { request: Pick<ServicesRequest, "id" | "title" | "status"> | null })[];
}

export async function offerCounts(requestIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (requestIds.length === 0) return map;
  const { data } = await db().from("services_offers").select("request_id").in("request_id", requestIds).neq("status", "withdrawn");
  for (const row of (data ?? []) as { request_id: string }[]) map.set(row.request_id, (map.get(row.request_id) ?? 0) + 1);
  return map;
}

// ── E-mail (Resend) ──────────────────────────────────────────────────────────

const SITE = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.vevit.cz").replace(/\/+$/, "");

export function requestUrl(requestId: string): string {
  return `${SITE}/cs/services/poptavka/${requestId}`;
}

/** Transactional notice to one user; failures are logged, never thrown. */
export async function notifyUser(userId: string, subject: string, lines: string[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;
  try {
    const { email } = await contactFor(userId);
    if (!email) return;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: process.env.MAIL_FROM?.trim() || "vevit <noreply@vevit.cz>",
        to: [email],
        subject: `VeVit Services: ${subject}`,
        text: `${lines.join("\n\n")}\n\n— VeVit Services`,
      }),
    });
    if (!response.ok) console.error("[services] e-mail delivery failed", response.status);
  } catch (error) {
    console.error("[services] e-mail request failed", error instanceof Error ? error.message : error);
  }
}

export function formatCzk(value: number): string {
  return `${new Intl.NumberFormat("cs-CZ").format(value)} Kč`;
}

/** Přihlášený návštěvník pro serverové stránky; výpadek backendu = anonym. */
export async function viewer(): Promise<AccountSession | null> {
  try {
    return await loadSessionFromCookies();
  } catch {
    return null;
  }
}

export async function hasReviewed(requestId: string, authorId: string): Promise<boolean> {
  const { data } = await db().from("services_reviews").select("id").eq("request_id", requestId).eq("author_id", authorId).limit(1);
  return Array.isArray(data) && data.length > 0;
}

export function categoryName(categories: ServicesCategory[], slug: string): string {
  return categories.find((category) => category.slug === slug)?.name_cs ?? slug;
}

/** Čas vykreslení serverové stránky (pro „před 3 h“), mimo tělo komponenty. */
export function renderTime(): number {
  return Date.now();
}
