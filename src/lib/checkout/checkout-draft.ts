// Client-side checkout draft (choices from steps 2-3), kept in sessionStorage. Pure parsing only,
// so a tampered or outdated value can never break the checkout. Never holds card data.
import type { CompanyInfo, PostalAddress } from "./company.ts";
import type { CheckoutConsents, CheckoutPaymentMethod, PacketaPoint } from "./checkout-input.ts";

export const DRAFT_KEY = "vevit_checkout_draft_v1";

export type DraftDelivery = { method: "packeta_pickup"; point: PacketaPoint } | { method: "address" };

export type CheckoutDraft = {
  delivery: DraftDelivery | null;
  paymentMethod: CheckoutPaymentMethod | null;
  contact: { name: string; email: string; phone: string };
  shippingAddress: PostalAddress | null;
  company: CompanyInfo | null;
  billingAddress: PostalAddress | null;
  notes: string;
  consents: CheckoutConsents;
};

export function emptyDraft(): CheckoutDraft {
  return {
    delivery: null,
    paymentMethod: null,
    contact: { name: "", email: "", phone: "" },
    shippingAddress: null,
    company: null,
    billingAddress: null,
    notes: "",
    consents: { terms: false, digital_waiver: false },
  };
}

const PAYMENT_METHODS = ["card", "apple_pay", "google_pay", "paypal"];

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function address(value: unknown): PostalAddress | null {
  const source = record(value);
  if (!source) return null;
  const country = source.country === "SK" ? "SK" : source.country === "CZ" ? "CZ" : null;
  if (!country || typeof source.street !== "string" || typeof source.city !== "string" || typeof source.zip !== "string") return null;
  return { street: source.street, city: source.city, zip: source.zip, country };
}

function company(value: unknown): CompanyInfo | null {
  const source = record(value);
  const addr = address(source?.address);
  if (!source || !addr || typeof source.ico !== "string" || typeof source.name !== "string") return null;
  return { ico: source.ico, name: source.name, dic: typeof source.dic === "string" ? source.dic : null, address: addr };
}

function delivery(value: unknown): DraftDelivery | null {
  const source = record(value);
  if (!source) return null;
  if (source.method === "address") return { method: "address" };
  if (source.method !== "packeta_pickup") return null;
  const point = record(source.point);
  const country = point?.country === "SK" ? "SK" : point?.country === "CZ" ? "CZ" : null;
  if (!point || !country || !/^\d{1,10}$/.test(str(point.id)) || (point.kind !== "pickup" && point.kind !== "zbox")) return null;
  const name = str(point.name);
  const street = str(point.street);
  const city = str(point.city);
  const zip = str(point.zip);
  if (!name || !street || !city || !zip) return null;
  return { method: "packeta_pickup", point: { id: str(point.id), name, street, city, zip, country, kind: point.kind } };
}

export function parseDraft(raw: string | null): CheckoutDraft {
  const base = emptyDraft();
  if (raw === null) return base;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return base;
  }
  const source = record(parsed);
  if (!source) return base;
  const contact = record(source.contact);
  const consents = record(source.consents);
  return {
    delivery: delivery(source.delivery),
    paymentMethod: PAYMENT_METHODS.includes(str(source.paymentMethod)) ? (source.paymentMethod as CheckoutPaymentMethod) : null,
    contact: { name: str(contact?.name), email: str(contact?.email), phone: str(contact?.phone) },
    shippingAddress: address(source.shippingAddress),
    company: company(source.company),
    billingAddress: address(source.billingAddress),
    notes: str(source.notes),
    consents: { terms: consents?.terms === true, digital_waiver: consents?.digital_waiver === true },
  };
}
