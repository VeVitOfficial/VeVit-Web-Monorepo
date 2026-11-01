// Data access for the Office provider and API as an interface: Supabase in production (supabase-store.ts), memory in tests.

export type OfficeUser = { id: string; email: string; name: string; preferredUsername: string; emailVerified: boolean };

export type Device = {
  id: string;
  ownerId: string;
  /** The sub-domain label: `<name>.office.vevit.cz`. Unique for as long as the row exists; never handed to somebody else. */
  name: string;
  displayName: string;
  tokenHash: string;
  createdAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
};

export type LinkRequest = {
  id: string;
  pollHash: string;
  codeHash: string;
  expiresAt: string;
  deviceId: string | null;
  /** AES-GCM sealed device token, present only between confirmation and the first successful poll. */
  sealedToken: string | null;
  consumedAt: string | null;
};

export type Consent = { id: string; userId: string; deviceId: string; grantedAt: string; revokedAt: string | null };

export type AuthCode = {
  codeHash: string;
  clientId: string;
  userId: string;
  deviceId: string | null;
  redirectUri: string;
  codeChallenge: string;
  nonce: string;
  scope: string;
  expiresAt: string;
  usedAt: string | null;
};

export type PendingAuth = {
  id: string;
  userId: string;
  clientId: string;
  deviceId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  scope: string;
  codeChallenge: string;
  expiresAt: string;
};

export type DeviceCode = {
  deviceCodeHash: string;
  userCodeHash: string;
  clientId: string;
  userId: string | null;
  status: "pending" | "approved" | "denied" | "consumed";
  intervalSeconds: number;
  lastPollAt: string | null;
  expiresAt: string;
};

export type Subscription = { plan: string; active: boolean; bytesPerMonth: number; maxStreams: number };

export type AuditEvent = { kind: string; userId?: string | null; deviceId?: string | null; ipHash?: string | null; detail?: Record<string, unknown> };

export interface OfficeStore {
  getUser(id: string): Promise<OfficeUser | null>;

  createDevice(d: Omit<Device, "createdAt" | "lastSeenAt" | "revokedAt">): Promise<Device | "name_taken">;
  getDevice(id: string): Promise<Device | null>;
  getDeviceByName(name: string): Promise<Device | null>;
  getDeviceByTokenHash(hash: string): Promise<Device | null>;
  listDevices(ownerId: string): Promise<Device[]>;
  renameDevice(id: string, ownerId: string, displayName: string): Promise<boolean>;
  /** Revokes the token and every consent given for the device. */
  revokeDevice(id: string, ownerId: string): Promise<boolean>;
  touchDevice(id: string): Promise<void>;

  createLink(l: LinkRequest): Promise<void>;
  getLinkByPollHash(hash: string): Promise<LinkRequest | null>;
  getLinkByCodeHash(hash: string): Promise<LinkRequest | null>;
  /** Atomically attaches the device and the sealed token to a still-open request; false when it was already confirmed. */
  confirmLink(id: string, deviceId: string, sealedToken: string): Promise<boolean>;
  /** Marks collected and wipes the sealed token; false when somebody collected it first. */
  consumeLink(id: string): Promise<boolean>;

  getConsent(userId: string, deviceId: string): Promise<Consent | null>;
  saveConsent(userId: string, deviceId: string): Promise<void>;
  listConsents(userId: string): Promise<(Consent & { deviceName: string; deviceDisplayName: string; ownerName: string })[]>;
  revokeConsent(id: string, userId: string): Promise<boolean>;

  savePending(p: PendingAuth): Promise<void>;
  getPending(id: string, userId: string): Promise<PendingAuth | null>;
  /** Reads and deletes: a decision is made once. */
  takePending(id: string, userId: string): Promise<PendingAuth | null>;
  saveCode(c: AuthCode): Promise<void>;
  /** Marks used and returns it; null when unknown or already used (the second use reports `reused` so tokens can be revoked). */
  useCode(codeHash: string): Promise<{ code: AuthCode; reused: boolean } | null>;

  saveDeviceCode(c: DeviceCode): Promise<void>;
  getDeviceCode(deviceCodeHash: string): Promise<DeviceCode | null>;
  getDeviceCodeByUserCode(userCodeHash: string): Promise<DeviceCode | null>;
  updateDeviceCode(deviceCodeHash: string, patch: Partial<Pick<DeviceCode, "status" | "userId" | "lastPollAt" | "intervalSeconds">>): Promise<void>;

  /** The plan from `office_subscriptions` with the limits from `office_plans`; inactive with zero limits when there is none. */
  getSubscription(userId: string): Promise<Subscription>;
  setSubscription(userId: string, s: { plan: string; active: boolean; stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<void>;
  /** The user with this Stripe customer id (set by an earlier checkout), or null. */
  userByStripeCustomer(customerId: string): Promise<string | null>;
  saveDnsRecord(deviceId: string, name: string, value: string | null): Promise<void>;
  audit(e: AuditEvent): Promise<void>;
}
