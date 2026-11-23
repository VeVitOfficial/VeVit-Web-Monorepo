import "server-only";

import { accountSupabase } from "../account-auth.ts";
import type {
  AuditEvent, AuthCode, Consent, Device, DeviceCode, LinkRequest, OfficeStore, OfficeUser, PendingAuth, Subscription,
} from "./store.ts";

// PostgREST rows are untyped here; every field is read through the mappers below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function fail(op: string, error: { code?: string; message?: string } | null): never {
  console.error("[office] database error", { op, code: error?.code });
  throw new Error("office_store_unavailable");
}

const toDevice = (r: Row): Device => ({
  id: r.id, ownerId: r.owner_id, name: r.name, displayName: r.display_name, tokenHash: r.token_hash,
  createdAt: r.created_at, lastSeenAt: r.last_seen_at, revokedAt: r.revoked_at,
});
const toLink = (r: Row): LinkRequest => ({
  id: r.id, pollHash: r.poll_hash, codeHash: r.code_hash, expiresAt: r.expires_at, deviceId: r.device_id, sealedToken: r.sealed_token, consumedAt: r.consumed_at,
});
const toConsent = (r: Row): Consent => ({ id: r.id, userId: r.user_id, deviceId: r.device_id, grantedAt: r.granted_at, revokedAt: r.revoked_at });
const toPending = (r: Row): PendingAuth => ({
  id: r.id, userId: r.user_id, clientId: r.client_id, deviceId: r.device_id, redirectUri: r.redirect_uri, state: r.state, nonce: r.nonce,
  scope: r.scope, codeChallenge: r.code_challenge, expiresAt: r.expires_at,
});
const toCode = (r: Row): AuthCode => ({
  codeHash: r.code_hash, clientId: r.client_id, userId: r.user_id, deviceId: r.device_id, redirectUri: r.redirect_uri,
  codeChallenge: r.code_challenge, nonce: r.nonce, scope: r.scope, expiresAt: r.expires_at, usedAt: r.used_at ?? null,
});
const toDeviceCode = (r: Row): DeviceCode => ({
  deviceCodeHash: r.device_code_hash, userCodeHash: r.user_code_hash, clientId: r.client_id, userId: r.user_id, status: r.status,
  intervalSeconds: r.interval_seconds, lastPollAt: r.last_poll_at, expiresAt: r.expires_at,
});

export class SupabaseOfficeStore implements OfficeStore {
  private db = accountSupabase();

  async getUser(id: string): Promise<OfficeUser | null> {
    const { data, error } = await this.db.from("users").select("id,email,nickname,full_name,status,email_verified_at").eq("id", id).maybeSingle();
    if (error) fail("getUser", error);
    if (!data || data.status !== "active") return null;
    const local = String(data.email ?? "").split("@")[0] ?? "";
    return {
      id: data.id, email: data.email, name: data.full_name || data.nickname || local, preferredUsername: data.nickname || local,
      emailVerified: Boolean(data.email_verified_at),
    };
  }

  async createDevice(d: Omit<Device, "createdAt" | "lastSeenAt" | "revokedAt">) {
    const { data, error } = await this.db.from("office_devices").insert({ id: d.id, owner_id: d.ownerId, name: d.name, display_name: d.displayName, token_hash: d.tokenHash }).select("*").single();
    if (error?.code === "23505") return "name_taken" as const;
    if (error || !data) fail("createDevice", error);
    return toDevice(data);
  }
  private async oneDevice(col: string, val: string): Promise<Device | null> {
    const { data, error } = await this.db.from("office_devices").select("*").eq(col, val).maybeSingle();
    if (error) fail("getDevice", error);
    return data ? toDevice(data) : null;
  }
  getDevice(id: string) { return this.oneDevice("id", id); }
  getDeviceByName(name: string) { return this.oneDevice("name", name); }
  getDeviceByTokenHash(hash: string) { return this.oneDevice("token_hash", hash); }
  async listDevices(ownerId: string) {
    const { data, error } = await this.db.from("office_devices").select("*").eq("owner_id", ownerId).is("revoked_at", null).order("created_at");
    if (error) fail("listDevices", error);
    return (data ?? []).map(toDevice);
  }
  async renameDevice(id: string, ownerId: string, displayName: string) {
    const { data, error } = await this.db.from("office_devices").update({ display_name: displayName }).eq("id", id).eq("owner_id", ownerId).is("revoked_at", null).select("id");
    if (error) fail("renameDevice", error);
    return (data ?? []).length === 1;
  }
  async revokeDevice(id: string, ownerId: string) {
    const now = new Date().toISOString();
    const { data, error } = await this.db.from("office_devices").update({ revoked_at: now }).eq("id", id).eq("owner_id", ownerId).is("revoked_at", null).select("id");
    if (error) fail("revokeDevice", error);
    if ((data ?? []).length !== 1) return false;
    const c = await this.db.from("office_consents").update({ revoked_at: now }).eq("device_id", id).is("revoked_at", null);
    if (c.error) fail("revokeDevice.consents", c.error);
    await this.db.from("office_dns_records").delete().eq("device_id", id);
    return true;
  }
  async touchDevice(id: string) {
    await this.db.from("office_devices").update({ last_seen_at: new Date().toISOString() }).eq("id", id);
  }

  async createLink(l: LinkRequest) {
    const { error } = await this.db.from("office_link_requests").insert({ id: l.id, poll_hash: l.pollHash, code_hash: l.codeHash, expires_at: l.expiresAt });
    if (error) fail("createLink", error);
  }
  private async oneLink(col: string, val: string): Promise<LinkRequest | null> {
    const { data, error } = await this.db.from("office_link_requests").select("*").eq(col, val).maybeSingle();
    if (error) fail("getLink", error);
    return data ? toLink(data) : null;
  }
  getLinkByPollHash(h: string) { return this.oneLink("poll_hash", h); }
  getLinkByCodeHash(h: string) { return this.oneLink("code_hash", h); }
  async confirmLink(id: string, deviceId: string, sealedToken: string) {
    const { data, error } = await this.db.from("office_link_requests").update({ device_id: deviceId, sealed_token: sealedToken }).eq("id", id).is("device_id", null).select("id");
    if (error) fail("confirmLink", error);
    return (data ?? []).length === 1;
  }
  async consumeLink(id: string) {
    const { data, error } = await this.db.from("office_link_requests").update({ consumed_at: new Date().toISOString(), sealed_token: null }).eq("id", id).is("consumed_at", null).not("sealed_token", "is", null).select("id");
    if (error) fail("consumeLink", error);
    return (data ?? []).length === 1;
  }

  async getConsent(userId: string, deviceId: string) {
    const { data, error } = await this.db.from("office_consents").select("*").eq("user_id", userId).eq("device_id", deviceId).is("revoked_at", null).maybeSingle();
    if (error) fail("getConsent", error);
    return data ? toConsent(data) : null;
  }
  async saveConsent(userId: string, deviceId: string) {
    if (await this.getConsent(userId, deviceId)) return;
    const { error } = await this.db.from("office_consents").insert({ id: crypto.randomUUID(), user_id: userId, device_id: deviceId });
    if (error && error.code !== "23505") fail("saveConsent", error);
  }
  async listConsents(userId: string) {
    const { data, error } = await this.db.from("office_consents").select("*, office_devices!inner(name,display_name,owner_id,revoked_at)").eq("user_id", userId).is("revoked_at", null);
    if (error) fail("listConsents", error);
    const rows = (data ?? []).filter((r: Row) => !r.office_devices.revoked_at);
    const owners = new Map<string, string>();
    for (const r of rows) {
      const oid = r.office_devices.owner_id as string;
      if (!owners.has(oid)) owners.set(oid, (await this.getUser(oid))?.name ?? "");
    }
    return rows.map((r: Row) => ({ ...toConsent(r), deviceName: r.office_devices.name, deviceDisplayName: r.office_devices.display_name, ownerName: owners.get(r.office_devices.owner_id) ?? "" }));
  }
  async revokeConsent(id: string, userId: string) {
    const { data, error } = await this.db.from("office_consents").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId).is("revoked_at", null).select("id");
    if (error) fail("revokeConsent", error);
    return (data ?? []).length === 1;
  }

  async savePending(p: PendingAuth) {
    const { error } = await this.db.from("office_oidc_pending").insert({
      id: p.id, user_id: p.userId, client_id: p.clientId, device_id: p.deviceId, redirect_uri: p.redirectUri, state: p.state, nonce: p.nonce,
      scope: p.scope, code_challenge: p.codeChallenge, expires_at: p.expiresAt,
    });
    if (error) fail("savePending", error);
  }
  async getPending(id: string, userId: string) {
    const { data, error } = await this.db.from("office_oidc_pending").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) fail("getPending", error);
    return data ? toPending(data) : null;
  }
  async takePending(id: string, userId: string) {
    const { data, error } = await this.db.from("office_oidc_pending").delete().eq("id", id).eq("user_id", userId).select("*").maybeSingle();
    if (error) fail("takePending", error);
    return data ? toPending(data) : null;
  }
  async saveCode(c: AuthCode) {
    const { error } = await this.db.from("office_oidc_codes").insert({
      code_hash: c.codeHash, client_id: c.clientId, user_id: c.userId, device_id: c.deviceId, redirect_uri: c.redirectUri,
      code_challenge: c.codeChallenge, nonce: c.nonce, scope: c.scope, expires_at: c.expiresAt,
    });
    if (error) fail("saveCode", error);
  }
  async useCode(codeHash: string) {
    const { data, error } = await this.db.rpc("office_use_code", { p_hash: codeHash });
    if (error) fail("useCode", error);
    const r = (data as Row[] | null)?.[0];
    if (!r) return null;
    return { code: toCode({ ...r, code_hash: codeHash }), reused: Boolean(r.reused) };
  }

  async saveDeviceCode(c: DeviceCode) {
    const { error } = await this.db.from("office_device_codes").insert({
      device_code_hash: c.deviceCodeHash, user_code_hash: c.userCodeHash, client_id: c.clientId, status: c.status, interval_seconds: c.intervalSeconds, expires_at: c.expiresAt,
    });
    if (error) fail("saveDeviceCode", error);
  }
  private async oneDeviceCode(col: string, val: string): Promise<DeviceCode | null> {
    const { data, error } = await this.db.from("office_device_codes").select("*").eq(col, val).maybeSingle();
    if (error) fail("getDeviceCode", error);
    return data ? toDeviceCode(data) : null;
  }
  getDeviceCode(h: string) { return this.oneDeviceCode("device_code_hash", h); }
  getDeviceCodeByUserCode(h: string) { return this.oneDeviceCode("user_code_hash", h); }
  async updateDeviceCode(hash: string, patch: Partial<Pick<DeviceCode, "status" | "userId" | "lastPollAt" | "intervalSeconds">>) {
    const row: Row = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.userId !== undefined) row.user_id = patch.userId;
    if (patch.lastPollAt !== undefined) row.last_poll_at = patch.lastPollAt;
    if (patch.intervalSeconds !== undefined) row.interval_seconds = patch.intervalSeconds;
    const { error } = await this.db.from("office_device_codes").update(row).eq("device_code_hash", hash);
    if (error) fail("updateDeviceCode", error);
  }
  async consumeApprovedDeviceCode(hash: string) {
    // One conditional UPDATE: only the caller that flips approved -> consumed gets the row back.
    const { data, error } = await this.db.from("office_device_codes").update({ status: "consumed" })
      .eq("device_code_hash", hash).eq("status", "approved").select("*").maybeSingle();
    if (error) fail("consumeApprovedDeviceCode", error);
    return data ? toDeviceCode(data) : null;
  }

  async createEmailVerification(v: { id: string; userId: string; email: string; tokenHash: string; expiresAt: string }) {
    const del = await this.db.from("office_email_verifications").delete().eq("user_id", v.userId).is("used_at", null);
    if (del.error) fail("createEmailVerification", del.error);
    const { error } = await this.db.from("office_email_verifications").insert({
      id: v.id, user_id: v.userId, email: v.email, token_hash: v.tokenHash, expires_at: v.expiresAt,
    });
    if (error) fail("createEmailVerification", error);
  }
  async consumeEmailVerification(tokenHash: string) {
    const { data, error } = await this.db.rpc("office_verify_email", { p_hash: tokenHash });
    if (error) fail("consumeEmailVerification", error);
    const row = (Array.isArray(data) ? data[0] : data) as Row | undefined;
    return row && row.o_outcome === "ok" ? { userId: String(row.o_user_id), email: String(row.o_email) } : null;
  }
  async deleteEmailVerification(tokenHash: string) {
    const { error } = await this.db.from("office_email_verifications").delete().eq("token_hash", tokenHash);
    if (error) fail("deleteEmailVerification", error);
  }

  async getSubscription(userId: string): Promise<Subscription> {
    const none = { plan: "none", active: false, bytesPerMonth: 0, maxStreams: 0 };
    const { data: sub, error } = await this.db.from("office_subscriptions").select("plan,active").eq("user_id", userId).maybeSingle();
    if (error) fail("getSubscription", error);
    if (!sub) return none;
    const { data: plan, error: e2 } = await this.db.from("office_plans").select("bytes_per_month,max_streams,active").eq("plan", sub.plan).maybeSingle();
    if (e2) fail("getPlan", e2);
    if (!plan) return { ...none, plan: sub.plan };
    return { plan: sub.plan, active: Boolean(sub.active && plan.active), bytesPerMonth: Number(plan.bytes_per_month), maxStreams: plan.max_streams };
  }
  async setSubscription(userId: string, s: { plan: string; active: boolean; stripeCustomerId?: string; stripeSubscriptionId?: string }) {
    const { error } = await this.db.from("office_subscriptions").upsert({
      user_id: userId, plan: s.plan, active: s.active, source: s.stripeCustomerId ? "stripe" : "manual",
      stripe_customer_id: s.stripeCustomerId ?? null, stripe_subscription_id: s.stripeSubscriptionId ?? null, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) fail("setSubscription", error);
  }
  async userByStripeCustomer(customerId: string) {
    const { data, error } = await this.db.from("office_subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    if (error) fail("userByStripeCustomer", error);
    return data?.user_id ?? null;
  }

  async saveDnsRecord(deviceId: string, name: string, value: string | null) {
    const q = value === null
      ? this.db.from("office_dns_records").delete().eq("device_id", deviceId).eq("name", name)
      : this.db.from("office_dns_records").upsert({ device_id: deviceId, name, value, updated_at: new Date().toISOString() }, { onConflict: "device_id,name" });
    const { error } = await q;
    if (error) fail("saveDnsRecord", error);
  }

  async audit(e: AuditEvent) {
    // The audit write must never break the request it describes; a failure is logged without its content.
    const { error } = await this.db.from("office_audit").insert({ kind: e.kind, user_id: e.userId ?? null, device_id: e.deviceId ?? null, ip_hash: e.ipHash ?? null, detail: e.detail ?? {} });
    if (error) console.error("[office] audit write failed", { code: error.code, kind: e.kind });
  }
}
