// Checkout request normalization and validation. Pure: no aliases or node_modules, so node --test
// can load it. The server (store-checkout-service.ts) re-exports it.
import { icoValid, type CompanyInfo, type PostalAddress } from "./company.ts";
import type { DeliveryMethod } from "./shipping.ts";

export class CheckoutValidationException extends Error {
  readonly errorCode: string;

  constructor(errorCode: string, message: string = "Objednávku se nepodařilo ověřit.") {
    super(message);
    this.errorCode = errorCode;
  }
}

export const CHECKOUT_MAX_ITEMS = 25;
export const CHECKOUT_MAX_QUANTITY = 100;

export type PacketaPoint = {
  id: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: "CZ" | "SK";
  kind: "pickup" | "zbox";
};

export type DeliveryInput = { method: "packeta_pickup"; point: PacketaPoint } | { method: "address" };

export type CheckoutPaymentMethod = "card" | "apple_pay" | "google_pay" | "paypal";

export type CheckoutConsents = { terms: boolean; digital_waiver: boolean };

export type CheckoutBilling = { company: CompanyInfo | null; address: PostalAddress | null };

export interface NormalizedInput {
  items: Array<{ productId: number; quantity: number }>;
  email: string;
  name: string;
  phone: string | null;
  shipping: PostalAddress | null;
  delivery: DeliveryInput | null;
  billing: CheckoutBilling;
  paymentMethod: CheckoutPaymentMethod | null;
  consents: CheckoutConsents;
  notes: string;
  idempotencyKey: string;
}

const CLIENT_OWNED_ITEM_FIELDS = ["price", "sale_price", "currency", "name", "type", "stock", "shipping", "tax", "total", "download_url", "download_token"];
const REQUIRED_ITEM_FIELDS = ["product_id", "quantity", "variant_id"];
const TOP_LEVEL_FIELDS = ["items", "email", "name", "shipping", "notes", "idempotency_key", "phone", "delivery", "billing", "payment_method", "consents"];
const PAYMENT_METHODS: CheckoutPaymentMethod[] = ["card", "apple_pay", "google_pay", "paypal"];

function positiveInteger(value: unknown, errorCode: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) return value;
  if (typeof value === "string" && /^[1-9][0-9]*$/.test(value)) {
    const number = Number(value);
    if (Number.isSafeInteger(number) && number >= 1) return number;
  }
  throw new CheckoutValidationException(errorCode, "Neplatné množství nebo produkt.");
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function boundedText(value: unknown, limit: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text !== "" && [...text].length <= limit ? text : null;
}

function onlyKeys(value: Record<string, unknown>, keys: string[], code: string, message: string): void {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new CheckoutValidationException(code, message);
  }
}

/** CZ/SK postcode "123 45" or "12345", stored without the space. */
function normalizeZip(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{3} ?\d{2}$/.test(value.trim())) return null;
  return value.trim().replace(" ", "");
}

function normalizeCountry(value: unknown): "CZ" | "SK" | null {
  const country = typeof value === "string" ? value.trim().toUpperCase() : "";
  return country === "CZ" || country === "SK" ? country : null;
}

function normalizeAddress(raw: unknown, code: string, message: string): PostalAddress {
  const source = record(raw);
  if (!source) throw new CheckoutValidationException(code, message);
  onlyKeys(source, ["street", "city", "zip", "country"], code, message);
  const street = boundedText(source.street, 160);
  const city = boundedText(source.city, 100);
  const zip = normalizeZip(source.zip);
  const country = normalizeCountry(source.country);
  if (!street || !city || !zip || !country) throw new CheckoutValidationException(code, message);
  return { street, city, zip, country };
}

const PHONE_ERROR = "Zadej platné telefonní číslo.";

function normalizePhone(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") throw new CheckoutValidationException("invalid_phone", PHONE_ERROR);
  let phone = raw.replace(/[\s().-]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (!/^\+(420|421)\d{9}$/.test(phone)) throw new CheckoutValidationException("invalid_phone", PHONE_ERROR);
  return phone;
}

const DELIVERY_ERROR = "Způsob doručení není platný.";

function normalizeDelivery(raw: unknown): DeliveryInput | null {
  if (raw === undefined || raw === null) return null;
  const source = record(raw);
  if (!source) throw new CheckoutValidationException("invalid_delivery", DELIVERY_ERROR);
  if (source.method === "address") {
    onlyKeys(source, ["method"], "invalid_delivery", DELIVERY_ERROR);
    return { method: "address" };
  }
  if (source.method !== "packeta_pickup") throw new CheckoutValidationException("invalid_delivery", DELIVERY_ERROR);
  onlyKeys(source, ["method", "point"], "invalid_delivery", DELIVERY_ERROR);
  const point = record(source.point);
  if (!point) throw new CheckoutValidationException("invalid_delivery", DELIVERY_ERROR);
  onlyKeys(point, ["id", "name", "street", "city", "zip", "country", "kind"], "invalid_delivery", DELIVERY_ERROR);
  const id = typeof point.id === "string" || typeof point.id === "number" ? String(point.id) : "";
  const name = boundedText(point.name, 160);
  const street = boundedText(point.street, 160);
  const city = boundedText(point.city, 100);
  const zip = normalizeZip(point.zip);
  const country = normalizeCountry(point.country);
  if (!/^\d{1,10}$/.test(id) || !name || !street || !city || !zip || !country || (point.kind !== "pickup" && point.kind !== "zbox")) {
    throw new CheckoutValidationException("invalid_delivery", DELIVERY_ERROR);
  }
  return { method: "packeta_pickup", point: { id, name, street, city, zip, country, kind: point.kind } };
}

const COMPANY_ERROR = "Firemní údaje nejsou platné.";

function normalizeCompany(raw: unknown): CompanyInfo | null {
  if (raw === undefined || raw === null) return null;
  const source = record(raw);
  if (!source) throw new CheckoutValidationException("invalid_company", COMPANY_ERROR);
  onlyKeys(source, ["ico", "name", "dic", "address"], "invalid_company", COMPANY_ERROR);
  const ico = typeof source.ico === "string" ? source.ico.trim() : "";
  const name = boundedText(source.name, 200);
  const dic = source.dic === null || source.dic === undefined || source.dic === "" ? null : boundedText(source.dic, 14);
  if (!icoValid(ico) || !name || (source.dic && (dic === null || !/^[A-Z]{2}[0-9A-Z]{2,12}$/.test(dic)))) {
    throw new CheckoutValidationException("invalid_company", COMPANY_ERROR);
  }
  return { ico, name, dic, address: normalizeAddress(source.address, "invalid_company", COMPANY_ERROR) };
}

function normalizeBilling(raw: unknown): CheckoutBilling {
  if (raw === undefined || raw === null) return { company: null, address: null };
  const source = record(raw);
  if (!source) throw new CheckoutValidationException("invalid_billing", "Fakturační údaje nejsou platné.");
  onlyKeys(source, ["company", "address"], "invalid_billing", "Fakturační údaje nejsou platné.");
  const address = source.address === undefined || source.address === null
    ? null
    : normalizeAddress(source.address, "invalid_billing", "Fakturační adresa není platná.");
  return { company: normalizeCompany(source.company), address };
}

function normalizeConsents(raw: unknown): CheckoutConsents {
  if (raw === undefined || raw === null) return { terms: false, digital_waiver: false };
  const source = record(raw);
  if (!source) throw new CheckoutValidationException("invalid_consents", "Souhlasy nejsou platné.");
  onlyKeys(source, ["terms", "digital_waiver"], "invalid_consents", "Souhlasy nejsou platné.");
  for (const value of Object.values(source)) {
    if (typeof value !== "boolean") throw new CheckoutValidationException("invalid_consents", "Souhlasy nejsou platné.");
  }
  return { terms: source.terms === true, digital_waiver: source.digital_waiver === true };
}

export function normalizeCheckoutInput(input: Record<string, unknown>): NormalizedInput {
  for (const key of Object.keys(input)) {
    if (!TOP_LEVEL_FIELDS.includes(key)) {
      throw new CheckoutValidationException("unexpected_field", "Požadavek obsahuje nepodporovaná data.");
    }
  }
  const rawItems = input.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > CHECKOUT_MAX_ITEMS) {
    throw new CheckoutValidationException("invalid_items", "Košík není platný.");
  }
  const merged = new Map<number, number>();
  for (const item of rawItems) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new CheckoutValidationException("invalid_items", "Košík není platný.");
    }
    const itemRecord = item as Record<string, unknown>;
    for (const key of Object.keys(itemRecord)) {
      if (!REQUIRED_ITEM_FIELDS.includes(key) && !CLIENT_OWNED_ITEM_FIELDS.includes(key)) {
        throw new CheckoutValidationException("unexpected_field", "Požadavek obsahuje nepodporovaná data.");
      }
    }
    if (itemRecord.variant_id !== undefined && itemRecord.variant_id !== null && itemRecord.variant_id !== "") {
      throw new CheckoutValidationException("variants_not_supported", "Vybraná varianta není dostupná.");
    }
    const productId = positiveInteger(itemRecord.product_id ?? null, "invalid_product");
    const quantity = positiveInteger(itemRecord.quantity ?? null, "invalid_quantity");
    if (quantity > CHECKOUT_MAX_QUANTITY) {
      throw new CheckoutValidationException("quantity_limit", "Požadované množství je příliš vysoké.");
    }
    const next = (merged.get(productId) ?? 0) + quantity;
    if (next > CHECKOUT_MAX_QUANTITY) {
      throw new CheckoutValidationException("quantity_limit", "Požadované množství je příliš vysoké.");
    }
    merged.set(productId, next);
  }
  if (merged.size > CHECKOUT_MAX_ITEMS) {
    throw new CheckoutValidationException("invalid_items", "Košík obsahuje příliš mnoho položek.");
  }
  const items = [...merged.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([productId, quantity]) => ({ productId, quantity }));

  const email = typeof input.email === "string" ? input.email : "";
  if (!isValidEmail(email) || email.length > 255) {
    throw new CheckoutValidationException("invalid_contact", "Zadejte platný e-mail.");
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name === "" || [...name].length > 120) {
    throw new CheckoutValidationException("invalid_contact", "Zadejte jméno objednatele.");
  }
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if ([...notes].length > 2000) {
    throw new CheckoutValidationException("invalid_notes", "Poznámka je příliš dlouhá.");
  }
  const key = typeof input.idempotency_key === "string" ? input.idempotency_key : "";
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(key)) {
    throw new CheckoutValidationException("invalid_idempotency_key", "Požadavek nelze bezpečně zopakovat.");
  }

  const paymentRaw = input.payment_method;
  if (paymentRaw !== undefined && paymentRaw !== null && !PAYMENT_METHODS.includes(paymentRaw as CheckoutPaymentMethod)) {
    throw new CheckoutValidationException("invalid_payment_method", "Způsob platby není platný.");
  }
  const shippingRaw = input.shipping;
  return {
    items,
    email,
    name,
    phone: normalizePhone(input.phone),
    shipping: shippingRaw === undefined || shippingRaw === null || record(shippingRaw) === null
      ? null
      : normalizeAddress(shippingRaw, "invalid_shipping", "Doručovací adresa není platná."),
    delivery: normalizeDelivery(input.delivery),
    billing: normalizeBilling(input.billing),
    paymentMethod: (paymentRaw ?? null) as CheckoutPaymentMethod | null,
    consents: normalizeConsents(input.consents),
    notes,
    idempotencyKey: key,
  };
}

/** Every field except the idempotency key: the request hash proves a retry carries the same data. */
export function requestHashInput(n: NormalizedInput): Record<string, unknown> {
  return {
    items: Object.fromEntries(n.items.map((item) => [item.productId, item.quantity])),
    email: n.email,
    name: n.name,
    phone: n.phone,
    shipping: n.shipping,
    delivery: n.delivery,
    billing: n.billing,
    payment_method: n.paymentMethod,
    consents: n.consents,
    notes: n.notes,
  };
}

export function requireConsents(hasDigital: boolean, consents: CheckoutConsents): void {
  if (!consents.terms) {
    throw new CheckoutValidationException("terms_required", "Potvrď souhlas s obchodními podmínkami.");
  }
  if (hasDigital && !consents.digital_waiver) {
    throw new CheckoutValidationException(
      "digital_waiver_required",
      "Potvrď souhlas se zpřístupněním digitálního obsahu před uplynutím lhůty pro odstoupení.",
    );
  }
}

export interface FinalCheckoutDetails {
  phone: string | null;
  delivery: DeliveryInput | null;
  shipping: PostalAddress | null;
  billing: CheckoutBilling;
  consents: CheckoutConsents;
}

/** Applies the rules that depend on what is in the cart (physical / digital). */
export function finalizeCheckoutDetails(n: NormalizedInput, cart: { hasPhysical: boolean; hasDigital: boolean }): FinalCheckoutDetails {
  requireConsents(cart.hasDigital, n.consents);
  if (!cart.hasPhysical) {
    // Digital-only: no delivery step, no phone requirement, nothing to ship.
    return { phone: n.phone, delivery: null, shipping: null, billing: n.billing, consents: n.consents };
  }
  if (n.phone === null) throw new CheckoutValidationException("invalid_phone", PHONE_ERROR);
  if (n.delivery === null) throw new CheckoutValidationException("delivery_required", "Vyber způsob doručení.");
  if (n.delivery.method === "address" && n.shipping === null) {
    throw new CheckoutValidationException("shipping_required", "Doplňte doručovací adresu.");
  }
  return {
    phone: n.phone,
    delivery: n.delivery,
    shipping: n.delivery.method === "address" ? n.shipping : null,
    billing: n.billing,
    consents: n.consents,
  };
}

export function deliveryMethodOf(delivery: DeliveryInput | null): DeliveryMethod | null {
  return delivery === null ? null : delivery.method;
}

/** filter_var(FILTER_VALIDATE_EMAIL) approximation with the same spirit. */
function isValidEmail(value: string): boolean {
  if (value === "" || value.includes("\0")) return false;
  return /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(value) && value.length <= 320;
}
