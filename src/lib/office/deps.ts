import type { DnsAdapter } from "./dns.ts";
import type { OfficeKey } from "./jwt.ts";
import type { OfficeStore } from "./store.ts";

export type RateResult = "ok" | "limited" | "unavailable";

export type OfficeDeps = {
  store: OfficeStore;
  dns: DnsAdapter;
  /** null until OFFICE_OIDC_KEY_ACTIVE is set: the provider endpoints then answer 503. */
  keys: { active: OfficeKey; published: OfficeKey[] } | null;
  now: () => number;
  issuer: string;
  /** Exact redirect URIs of the Cloud service (first-party: no consent screen). Placeholder until Cloud has an address. */
  cloudRedirectUris: string[];
  /** 32 bytes, base64: seals the device token while it waits to be collected. */
  sealKey: string | null;
  ipSecret: string;
  session: (req: Request) => Promise<{ userId: string; csrf: string } | null>;
  rateLimit: (key: string, namespace: string, windowSeconds: number, max: number) => Promise<RateResult>;
  clientIp: (req: Request) => string;
  /** Stripe webhook signing secret and price → plan map; absent = the webhook answers 503. */
  stripe: { secret: string; pricePlans: Record<string, string> } | null;
};

export const CLIENT_OFFICE = "vevit-office";
export const CLIENT_DEVICE = "vevit-office-device";
/** Clients allowed on the device endpoints. `vevit-office` is accepted too: the Office server uses one client_id for both flows today. */
export const DEVICE_CLIENTS = [CLIENT_DEVICE, CLIENT_OFFICE];
export const CODE_TTL_MS = 60_000;
export const ID_TOKEN_TTL_S = 300;
export const DEVICE_CODE_TTL_S = 600;
export const LINK_TTL_S = 600;
export const LINK_URL = "https://vevit.cz/office/link";
export const DEVICE_VERIFY_URL = "https://vevit.cz/office/device";
