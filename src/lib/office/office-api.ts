import { createHmac } from "node:crypto";
import { humanCode, ipFingerprint, normalizeHumanCode, openSecret, randomToken, safeEqual, sealSecret, sha256Hex } from "./crypto.ts";
import { LINK_TTL_S, LINK_URL, type OfficeDeps } from "./deps.ts";
import { bearer, json, readJson } from "./http.ts";
import type { Device } from "./store.ts";
import { acmeRecordName, acmeValueOk, checkSubdomain, cleanDisplayName, deviceHost, dnsNameAllowed } from "./validate.ts";

// Vevit API for Office online mode (docs/office/OIDC-SPEC.md, "Vevit API used by online mode").

export const MAX_DEVICES_PER_USER = 10;

const iso = (ms: number) => new Date(ms).toISOString();

export async function limit(d: OfficeDeps, key: string, ns: string, windowS: number, max: number): Promise<Response | null> {
  const r = await d.rateLimit(key, ns, windowS, max);
  if (r === "limited") return json(429, { error: "too_many_requests" }, { "retry-after": String(windowS) });
  if (r === "unavailable") return json(503, { error: "temporarily_unavailable" });
  return null;
}

type UserSession = { error: Response; session?: undefined } | { error?: undefined; session: { userId: string; csrf: string } };

export async function userSession(d: OfficeDeps, req: Request, write: boolean): Promise<UserSession> {
  const s = await d.session(req);
  if (!s) return { error: json(401, { error: "unauthorized" }) };
  if (write && !safeEqual(req.headers.get("x-csrf-token") ?? "", s.csrf)) return { error: json(403, { error: "csrf" }) };
  return { session: s };
}

/** The paired device behind a bearer token, or an error response. Revoked and unknown tokens look the same. */
async function deviceFromToken(d: OfficeDeps, req: Request): Promise<{ device: Device } | { error: Response }> {
  const t = bearer(req);
  if (!t) return { error: json(401, { error: "unauthorized" }, { "www-authenticate": "Bearer" }) };
  const device = await d.store.getDeviceByTokenHash(sha256Hex(t));
  if (!device || device.revokedAt) return { error: json(401, { error: "unauthorized" }, { "www-authenticate": "Bearer" }) };
  return { device };
}

/** POST /api/office/link/start (no authentication: the server has no account yet; the code is useless without a person confirming it) */
export async function linkStart(d: OfficeDeps, req: Request): Promise<Response> {
  const limited = await limit(d, d.clientIp(req), "office_link_start", 600, 10);
  if (limited) return limited;
  const code = humanCode();
  const poll = randomToken(32);
  await d.store.createLink({
    id: randomToken(12), pollHash: sha256Hex(poll), codeHash: sha256Hex(code), expiresAt: iso(d.now() + LINK_TTL_S * 1000),
    deviceId: null, sealedToken: null, consumedAt: null,
  });
  return json(200, { code, link_url: LINK_URL, poll_token: poll, expires_in: LINK_TTL_S });
}

/** POST /api/office/link/confirm {code, name}: the signed-in owner pairs the server that showed the code. */
export async function linkConfirm(d: OfficeDeps, req: Request): Promise<Response> {
  const u = await userSession(d, req, true);
  if (u.error) return u.error;
  if (!d.sealKey) return json(503, { error: "temporarily_unavailable" });
  // Guessing pairing codes: few tries per person and per address.
  const byUser = await limit(d, u.session.userId, "office_link_confirm_user", 600, 10);
  if (byUser) return byUser;
  const byIp = await limit(d, d.clientIp(req), "office_link_confirm_ip", 600, 20);
  if (byIp) return byIp;
  const body = await readJson(req);
  const code = normalizeHumanCode(body?.code);
  if (!body || !code) return json(400, { error: "invalid_code" });
  const name = checkSubdomain(body.name);
  if (!name.ok) return json(422, { error: "invalid_name", reason: name.reason });
  // Names are never handed out again, so an unlimited number of devices per account would let one person hoard them.
  if ((await d.store.listDevices(u.session.userId)).length >= MAX_DEVICES_PER_USER) return json(409, { error: "device_limit" });
  const link = await d.store.getLinkByCodeHash(sha256Hex(code));
  if (!link || link.deviceId || Date.parse(link.expiresAt) <= d.now()) return json(404, { error: "code_not_found" });
  const token = randomToken(32);
  const device = await d.store.createDevice({
    id: randomToken(12), ownerId: u.session.userId, name: name.name, displayName: cleanDisplayName(body.display_name, name.name), tokenHash: sha256Hex(token),
  });
  if (device === "name_taken") return json(409, { error: "name_taken" });
  if (!(await d.store.confirmLink(link.id, device.id, sealSecret(token, d.sealKey)))) {
    await d.store.revokeDevice(device.id, device.ownerId); // somebody confirmed the same code a moment earlier
    return json(409, { error: "code_already_used" });
  }
  await d.store.audit({ kind: "link_confirmed", userId: u.session.userId, deviceId: device.id, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret), detail: { name: device.name } });
  return json(200, { device: { id: device.id, name: device.name, host: deviceHost(device.name) } });
}

/** POST /api/office/link/poll {poll_token}: pending, then once the device token. */
export async function linkPoll(d: OfficeDeps, req: Request): Promise<Response> {
  const limited = await limit(d, d.clientIp(req), "office_link_poll", 60, 40);
  if (limited) return limited;
  const body = await readJson(req);
  const poll = typeof body?.poll_token === "string" ? body.poll_token : "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(poll)) return json(400, { error: "invalid_request" });
  const link = await d.store.getLinkByPollHash(sha256Hex(poll));
  if (!link || link.consumedAt || Date.parse(link.expiresAt) <= d.now()) return json(410, { error: "expired" });
  if (!link.deviceId || !link.sealedToken) return json(200, { status: "pending" });
  const device = await d.store.getDevice(link.deviceId);
  if (!device || device.revokedAt || !d.sealKey) return json(410, { error: "expired" });
  const token = openSecret(link.sealedToken, d.sealKey);
  // Only the first poll that wins the atomic consume receives the token; the sealed copy is wiped with it.
  if (!token || !(await d.store.consumeLink(link.id))) return json(410, { error: "expired" });
  await d.store.audit({ kind: "link_collected", userId: device.ownerId, deviceId: device.id, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret) });
  return json(200, { status: "linked", device_id: device.id, name: device.name, device_token: token, owner_sub: device.ownerId });
}

/** PUT /api/office/dns/acme {name, value} and DELETE {name}: only this device's own `_acme-challenge` TXT record. */
export async function dnsAcme(d: OfficeDeps, req: Request): Promise<Response> {
  if (req.method !== "PUT" && req.method !== "DELETE") return json(405, { error: "method_not_allowed" }, { allow: "PUT, DELETE" });
  const a = await deviceFromToken(d, req);
  if ("error" in a) return a.error;
  const limited = await limit(d, a.device.id, "office_dns", 600, 30);
  if (limited) return limited;
  const body = await readJson(req);
  if (!body) return json(400, { error: "invalid_request" });
  if (!dnsNameAllowed(body.name, a.device.name)) {
    await d.store.audit({ kind: "dns_refused", userId: a.device.ownerId, deviceId: a.device.id, detail: { name: String(body.name).slice(0, 200) } });
    return json(403, { error: "forbidden_name" });
  }
  const name = acmeRecordName(a.device.name);
  try {
    if (req.method === "PUT") {
      if (!acmeValueOk(body.value)) return json(400, { error: "invalid_value" });
      await d.dns.setTxt(name, body.value);
      await d.store.saveDnsRecord(a.device.id, name, body.value);
      await d.store.audit({ kind: "dns_set", userId: a.device.ownerId, deviceId: a.device.id, detail: { name } });
    } else {
      await d.dns.clearTxt(name);
      await d.store.saveDnsRecord(a.device.id, name, null);
      await d.store.audit({ kind: "dns_cleared", userId: a.device.ownerId, deviceId: a.device.id, detail: { name } });
    }
  } catch {
    return json(503, { error: "dns_unavailable" });
  }
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

/** GET /api/office/subscription (device token). `name` is an addition to the four documented fields: the relay routes by it. */
export async function subscription(d: OfficeDeps, req: Request): Promise<Response> {
  const a = await deviceFromToken(d, req);
  if ("error" in a) return a.error;
  const limited = await limit(d, a.device.id, "office_subscription", 60, 30);
  if (limited) return limited;
  const s = await d.store.getSubscription(a.device.ownerId);
  await d.store.touchDevice(a.device.id);
  return json(200, { name: a.device.name, active: s.active, plan: s.plan, bytes_per_month: s.bytesPerMonth, max_streams: s.maxStreams });
}

function publicDevice(x: Device) {
  return { id: x.id, name: x.name, host: deviceHost(x.name), display_name: x.displayName, created_at: x.createdAt, last_seen_at: x.lastSeenAt };
}

/** GET /api/office/devices: the signed-in person's paired servers. */
export async function devicesList(d: OfficeDeps, req: Request): Promise<Response> {
  const u = await userSession(d, req, false);
  if (u.error) return u.error;
  const me = await d.store.getUser(u.session.userId);
  return json(200, { devices: (await d.store.listDevices(u.session.userId)).map(publicDevice), email_verified: Boolean(me?.emailVerified) });
}

/** PATCH /api/office/devices/{id} {display_name} */
export async function deviceRename(d: OfficeDeps, req: Request, id: string): Promise<Response> {
  const u = await userSession(d, req, true);
  if (u.error) return u.error;
  const body = await readJson(req);
  const name = cleanDisplayName(body?.display_name, "");
  if (!name) return json(400, { error: "invalid_name" });
  if (!(await d.store.renameDevice(id, u.session.userId, name))) return json(404, { error: "not_found" });
  await d.store.audit({ kind: "device_renamed", userId: u.session.userId, deviceId: id });
  return json(200, { ok: true });
}

/** DELETE /api/office/devices/{id}: revokes the token and every consent; the TXT record is cleared on a best-effort basis. */
export async function deviceUnlink(d: OfficeDeps, req: Request, id: string): Promise<Response> {
  const u = await userSession(d, req, true);
  if (u.error) return u.error;
  const device = await d.store.getDevice(id);
  if (!device || device.ownerId !== u.session.userId || device.revokedAt) return json(404, { error: "not_found" });
  if (!(await d.store.revokeDevice(id, u.session.userId))) return json(404, { error: "not_found" });
  try { await d.dns.clearTxt(acmeRecordName(device.name)); } catch { /* the record only matters during validation */ }
  await d.store.audit({ kind: "device_unlinked", userId: u.session.userId, deviceId: id });
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

/** GET /api/office/consents: the servers this person agreed to sign in to. */
export async function consentsList(d: OfficeDeps, req: Request): Promise<Response> {
  const u = await userSession(d, req, false);
  if (u.error) return u.error;
  const rows = await d.store.listConsents(u.session.userId);
  return json(200, { consents: rows.map((c) => ({ id: c.id, server: c.deviceDisplayName, host: deviceHost(c.deviceName), owner: c.ownerName, granted_at: c.grantedAt })) });
}

/** DELETE /api/office/consents/{id} */
export async function consentRevoke(d: OfficeDeps, req: Request, id: string): Promise<Response> {
  const u = await userSession(d, req, true);
  if (u.error) return u.error;
  if (!(await d.store.revokeConsent(id, u.session.userId))) return json(404, { error: "not_found" });
  await d.store.audit({ kind: "consent_revoked", userId: u.session.userId });
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

/** POST /api/office/stripe/webhook: ready for Stripe, inert without OFFICE_STRIPE_WEBHOOK_SECRET. */
export async function stripeWebhook(d: OfficeDeps, req: Request): Promise<Response> {
  if (!d.stripe) return json(503, { error: "not_configured" });
  const raw = await req.text();
  if (raw.length > 262144) return json(413, { error: "too_large" });
  const header = req.headers.get("stripe-signature") ?? "";
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  // Stripe's scheme: HMAC-SHA256 over "<t>.<body>", five minutes of tolerance against replays.
  if (!Number.isFinite(t) || Math.abs(d.now() / 1000 - t) > 300) return json(400, { error: "bad_signature" });
  const expected = createHmac("sha256", d.stripe.secret).update(`${t}.${raw}`).digest("hex");
  if (!parts.v1 || !safeEqual(parts.v1, expected)) return json(400, { error: "bad_signature" });
  type StripeObject = { id?: string; customer?: unknown; status?: string; metadata?: Record<string, string>; items?: { data?: { price?: { id?: string } }[] } };
  let event: { type?: string; data?: { object?: StripeObject } };
  try { event = JSON.parse(raw); } catch { return json(400, { error: "bad_json" }); }
  const obj = event.data?.object ?? {};
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const customer = typeof obj.customer === "string" ? obj.customer : "";
    const userId = (typeof obj.metadata?.vevit_user_id === "string" ? obj.metadata.vevit_user_id : null) ?? (await d.store.userByStripeCustomer(customer));
    const price = obj.items?.data?.[0]?.price?.id;
    const plan = typeof price === "string" ? d.stripe.pricePlans[price] : undefined;
    if (!userId || !plan) return json(200, { ok: true, ignored: true });
    const active = event.type !== "customer.subscription.deleted" && (obj.status === "active" || obj.status === "trialing");
    await d.store.setSubscription(userId, { plan, active, stripeCustomerId: customer || undefined, stripeSubscriptionId: typeof obj.id === "string" ? obj.id : undefined });
    await d.store.audit({ kind: "subscription_changed", userId, detail: { plan, active, event: event.type } });
  }
  return json(200, { ok: true });
}
