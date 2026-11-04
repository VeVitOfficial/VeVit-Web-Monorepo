import type {
  AuditEvent, AuthCode, Consent, Device, DeviceCode, LinkRequest, OfficeStore, OfficeUser, PendingAuth, Subscription,
} from "./store.ts";

/** In-memory OfficeStore with the same semantics as the Supabase one. Used by the tests. */
export class MemoryStore implements OfficeStore {
  users = new Map<string, OfficeUser>();
  devices = new Map<string, Device>();
  links = new Map<string, LinkRequest>();
  consents = new Map<string, Consent>();
  pending = new Map<string, PendingAuth>();
  codes = new Map<string, AuthCode>();
  deviceCodes = new Map<string, DeviceCode>();
  subscriptions = new Map<string, Subscription>();
  plans = new Map<string, { bytesPerMonth: number; maxStreams: number }>([["free", { bytesPerMonth: 10_000_000_000, maxStreams: 8 }], ["pro", { bytesPerMonth: 500_000_000_000, maxStreams: 64 }]]);
  stripeCustomers = new Map<string, string>();
  dns = new Map<string, string>();
  emailVerifications = new Map<string, { id: string; userId: string; email: string; expiresAt: string; usedAt: string | null }>();
  auditLog: AuditEvent[] = [];
  /** The tests drive this with their fake clock; the database uses now(). */
  now: () => number = () => Date.now();
  private seq = 0;
  private id(): string {
    this.seq += 1;
    return `id${this.seq}`;
  }

  async getUser(id: string) { return this.users.get(id) ?? null; }

  /** Mirrors the users.email trigger of migration 027: a new address is unverified and pending links die. */
  changeEmail(id: string, email: string) {
    const u = this.users.get(id);
    if (!u || u.email.toLowerCase() === email.toLowerCase()) return;
    u.email = email;
    u.emailVerified = false;
    for (const [h, v] of this.emailVerifications) if (v.userId === id) this.emailVerifications.delete(h);
  }
  async createEmailVerification(v: { id: string; userId: string; email: string; tokenHash: string; expiresAt: string }) {
    for (const [h, x] of this.emailVerifications) if (x.userId === v.userId && !x.usedAt) this.emailVerifications.delete(h);
    this.emailVerifications.set(v.tokenHash, { id: v.id, userId: v.userId, email: v.email, expiresAt: v.expiresAt, usedAt: null });
  }
  async consumeEmailVerification(tokenHash: string) {
    const v = this.emailVerifications.get(tokenHash);
    if (!v || v.usedAt || Date.parse(v.expiresAt) <= this.now()) return null;
    v.usedAt = new Date(this.now()).toISOString();
    const u = this.users.get(v.userId);
    if (!u || u.email.toLowerCase() !== v.email.toLowerCase()) return null;
    u.emailVerified = true;
    return { userId: v.userId, email: v.email };
  }
  async deleteEmailVerification(tokenHash: string) { this.emailVerifications.delete(tokenHash); }

  async createDevice(d: Omit<Device, "createdAt" | "lastSeenAt" | "revokedAt">) {
    // The name stays taken even after the device is unlinked: it is never given to a different owner.
    if ([...this.devices.values()].some((x) => x.name === d.name)) return "name_taken" as const;
    const row: Device = { ...d, createdAt: new Date().toISOString(), lastSeenAt: null, revokedAt: null };
    this.devices.set(row.id, row);
    return row;
  }
  async getDevice(id: string) { return this.devices.get(id) ?? null; }
  async getDeviceByName(name: string) { return [...this.devices.values()].find((d) => d.name === name) ?? null; }
  async getDeviceByTokenHash(hash: string) { return [...this.devices.values()].find((d) => d.tokenHash === hash) ?? null; }
  async listDevices(ownerId: string) { return [...this.devices.values()].filter((d) => d.ownerId === ownerId && !d.revokedAt); }
  async renameDevice(id: string, ownerId: string, displayName: string) {
    const d = this.devices.get(id);
    if (!d || d.ownerId !== ownerId || d.revokedAt) return false;
    d.displayName = displayName;
    return true;
  }
  async revokeDevice(id: string, ownerId: string) {
    const d = this.devices.get(id);
    if (!d || d.ownerId !== ownerId || d.revokedAt) return false;
    d.revokedAt = new Date().toISOString();
    for (const c of this.consents.values()) if (c.deviceId === id && !c.revokedAt) c.revokedAt = d.revokedAt;
    this.dns.delete(id);
    return true;
  }
  async touchDevice(id: string) { const d = this.devices.get(id); if (d) d.lastSeenAt = new Date().toISOString(); }

  async createLink(l: LinkRequest) { this.links.set(l.id, { ...l }); }
  async getLinkByPollHash(h: string) { return [...this.links.values()].find((l) => l.pollHash === h) ?? null; }
  async getLinkByCodeHash(h: string) { return [...this.links.values()].find((l) => l.codeHash === h) ?? null; }
  async confirmLink(id: string, deviceId: string, sealed: string) {
    const l = this.links.get(id);
    if (!l || l.deviceId) return false;
    l.deviceId = deviceId;
    l.sealedToken = sealed;
    return true;
  }
  async consumeLink(id: string) {
    const l = this.links.get(id);
    if (!l || l.consumedAt || !l.sealedToken) return false;
    l.consumedAt = new Date().toISOString();
    l.sealedToken = null;
    return true;
  }

  async getConsent(userId: string, deviceId: string) {
    return [...this.consents.values()].find((c) => c.userId === userId && c.deviceId === deviceId && !c.revokedAt) ?? null;
  }
  async saveConsent(userId: string, deviceId: string) {
    if (await this.getConsent(userId, deviceId)) return;
    const c = { id: this.id(), userId, deviceId, grantedAt: new Date().toISOString(), revokedAt: null };
    this.consents.set(c.id, c);
  }
  async listConsents(userId: string) {
    return [...this.consents.values()].filter((c) => c.userId === userId && !c.revokedAt).flatMap((c) => {
      const d = this.devices.get(c.deviceId);
      if (!d || d.revokedAt) return [];
      return [{ ...c, deviceName: d.name, deviceDisplayName: d.displayName, ownerName: this.users.get(d.ownerId)?.name ?? "" }];
    });
  }
  async revokeConsent(id: string, userId: string) {
    const c = this.consents.get(id);
    if (!c || c.userId !== userId || c.revokedAt) return false;
    c.revokedAt = new Date().toISOString();
    return true;
  }

  async savePending(p: PendingAuth) { this.pending.set(p.id, p); }
  async getPending(id: string, userId: string) { const p = this.pending.get(id); return p && p.userId === userId ? p : null; }
  async takePending(id: string, userId: string) {
    const p = this.pending.get(id);
    if (!p || p.userId !== userId) return null;
    this.pending.delete(id);
    return p;
  }
  async saveCode(c: AuthCode) { this.codes.set(c.codeHash, { ...c }); }
  async useCode(hash: string) {
    const c = this.codes.get(hash);
    if (!c) return null;
    if (c.usedAt) return { code: c, reused: true };
    c.usedAt = new Date().toISOString();
    return { code: c, reused: false };
  }

  async saveDeviceCode(c: DeviceCode) { this.deviceCodes.set(c.deviceCodeHash, { ...c }); }
  async getDeviceCode(h: string) { return this.deviceCodes.get(h) ?? null; }
  async getDeviceCodeByUserCode(h: string) { return [...this.deviceCodes.values()].find((c) => c.userCodeHash === h) ?? null; }
  async updateDeviceCode(h: string, patch: Partial<DeviceCode>) { const c = this.deviceCodes.get(h); if (c) Object.assign(c, patch); }
  async consumeApprovedDeviceCode(h: string) {
    const c = this.deviceCodes.get(h);
    if (!c || c.status !== "approved") return null;
    c.status = "consumed";
    return { ...c };
  }

  async getSubscription(userId: string): Promise<Subscription> {
    return this.subscriptions.get(userId) ?? { plan: "none", active: false, bytesPerMonth: 0, maxStreams: 0 };
  }
  async setSubscription(userId: string, s: { plan: string; active: boolean; stripeCustomerId?: string }) {
    const lim = this.plans.get(s.plan);
    // An unknown plan never grants anything.
    this.subscriptions.set(userId, { plan: s.plan, active: s.active && !!lim, bytesPerMonth: lim?.bytesPerMonth ?? 0, maxStreams: lim?.maxStreams ?? 0 });
    if (s.stripeCustomerId) this.stripeCustomers.set(s.stripeCustomerId, userId);
  }
  async userByStripeCustomer(customerId: string) { return this.stripeCustomers.get(customerId) ?? null; }
  async saveDnsRecord(deviceId: string, name: string, value: string | null) {
    if (value === null) this.dns.delete(`${deviceId}|${name}`); else this.dns.set(`${deviceId}|${name}`, value);
  }
  async audit(e: AuditEvent) { this.auditLog.push(e); }
}
