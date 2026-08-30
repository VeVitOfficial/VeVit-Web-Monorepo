import { randomBytes } from "node:crypto";
import { snapshotIntegrityHash, sha256Hex } from "@/lib/store-order-core";
import { storeRest, StoreRestError } from "@/lib/store-config";
import "server-only";

/**
 * Port of store/lib/orders/CheckoutService.php. The PDO repository is replaced
 * by PostgREST: advisory transaction locks do not exist over REST, so
 * idempotency reuse is guarded by the request_hash comparison plus a CAS
 * expire transition (pending → expired). Two racers re-creating an expired
 * snapshot for the same idempotency key can in theory both insert a fresh
 * row; each carries its own grant, and the consumed transition in
 * create-payment stays the single point of winner-takes-all enforcement.
 *
 * Digital products: the PHP binding check is a filesystem containment check
 * against APP_STORAGE_PATH, which does not exist in the Vercel runtime unless
 * VEVIT_DIGITAL_STORAGE_PATH is configured. Without it every digital binding
 * is invalid → checkout fails closed with digital_content_unavailable, the
 * same outcome the PHP code produces for a missing or unsafe binding.
 */

export class CheckoutValidationException extends Error {
  constructor(readonly errorCode: string, message: string = "Objednávku se nepodařilo ověřit.") {
    super(message);
  }
}

export const CHECKOUT_MAX_ITEMS = 25;
export const CHECKOUT_MAX_QUANTITY = 100;
export const CHECKOUT_SNAPSHOT_TTL_SECONDS = 1800;
export const CHECKOUT_MAX_TOTAL_MINOR = 9999999999;

export interface CheckoutItem {
  product_id: number;
  variant_id: null;
  sku: string;
  name: string;
  type: "physical" | "digital";
  quantity: number;
  currency: "czk";
  unit_amount_minor: number;
  line_total_minor: number;
  stock_status: "digital" | "backorder" | "in_stock";
  backorder: boolean;
}

export interface NormalizedInput {
  items: Array<{ productId: number; quantity: number }>;
  email: string;
  name: string;
  shipping: { street: string; city: string; zip: string; country: "CZ" | "SK" } | null;
  notes: string;
  idempotencyKey: string;
}

export interface CheckoutSnapshot {
  public_id: string;
  user_id: string | null;
  customer_email: string;
  customer_name: string;
  shipping: { street: string; city: string; zip: string; country: string } | null;
  notes: string;
  currency: "czk";
  items: CheckoutItem[];
  subtotal_minor: number;
  shipping_minor: number;
  total_minor: number;
  created_at: string;
  expires_at: string;
  price_version: string;
  checkout_grant_hash: string;
  idempotency_scope_hash: string;
  idempotency_key_hash: string;
  request_hash: string;
  snapshot_hash: string;
}

// ── Time formatting (DATE_ATOM in UTC = Y-m-dTH:i:s+00:00) ────────────────────

export function phpAtom(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+00:00`;
}

function phpYmdHis(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

// ── Input normalization (normalizeInput) ─────────────────────────────────────

const CLIENT_OWNED_ITEM_FIELDS = ["price", "sale_price", "currency", "name", "type", "stock", "shipping", "tax", "total", "download_url", "download_token"];
const REQUIRED_ITEM_FIELDS = ["product_id", "quantity", "variant_id"];

function positiveInteger(value: unknown, errorCode: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) return value;
  if (typeof value === "string" && /^[1-9][0-9]*$/.test(value)) {
    const number = Number(value);
    if (Number.isSafeInteger(number) && number >= 1) return number;
  }
  throw new CheckoutValidationException(errorCode, "Neplatné množství nebo produkt.");
}

export function normalizeCheckoutInput(input: Record<string, unknown>): NormalizedInput {
  const allowedTopLevel = ["items", "email", "name", "shipping", "notes", "idempotency_key"];
  for (const key of Object.keys(input)) {
    if (!allowedTopLevel.includes(key)) {
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
  const shippingRaw = (input.shipping === undefined) ? null : input.shipping;
  return {
    items,
    email,
    name,
    shipping: (shippingRaw === null || typeof shippingRaw !== "object" || Array.isArray(shippingRaw)) ? null : (shippingRaw as NormalizedInput["shipping"]),
    notes,
    idempotencyKey: key,
  };
}

/** filter_var(FILTER_VALIDATE_EMAIL) approximation with the same spirit. */
function isValidEmail(value: string): boolean {
  if (value === "" || value.includes("\0")) return false;
  return /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(value) && value.length <= 320;
}

function databaseBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "t" || value === "true";
}

// ── Product pricing (effectivePriceMinor / decimalToMinor) ───────────────────

function decimalToMinor(value: string): number {
  const match = /^([0-9]+)(?:\.([0-9]{1,2}))?$/.exec(value.trim());
  if (!match) throw new CheckoutValidationException("invalid_price", "Cena produktu není platná.");
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  if (whole > 92233720368547758) throw new CheckoutValidationException("invalid_price", "Cena produktu není platná.");
  return whole * 100 + fraction;
}

export interface StoreProductRow {
  id: number;
  name: string;
  sku: string | null;
  price: string;
  sale_price: string | null;
  type: string;
  stock: number | string | null;
  is_active: boolean | string | number | null;
  is_sellable: boolean | string | number | null;
  allow_backorder: boolean | string | number | null;
  currency: string;
  download_file: string | null;
}

function effectivePriceMinor(product: StoreProductRow): number {
  const sale = product.sale_price;
  const candidate = sale !== null && sale !== undefined && decimalToMinor(String(sale)) > 0 ? String(sale) : String(product.price ?? "");
  const minor = decimalToMinor(candidate);
  if (minor <= 0) throw new CheckoutValidationException("invalid_price", "Cena produktu není platná.");
  return minor;
}

/**
 * hasValidDigitalBinding. The PHP version verifies the file inside
 * APP_STORAGE_PATH; the Vercel runtime has no such filesystem by default, so
 * any digital content is rejected (fail closed) until a real storage root is
 * configured via VEVIT_DIGITAL_STORAGE_PATH. Unsafe bindings are rejected
 * regardless of configuration, exactly like the PHP original.
 */
function isUnsafeDigitalBinding(binding: string): boolean {
  return binding === "" || /^[/]/.test(binding) || binding.includes("..") || binding.includes("\0") ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(binding);
}

function hasValidDigitalBinding(product: StoreProductRow): boolean {
  const binding = String(product.download_file ?? "");
  if (isUnsafeDigitalBinding(binding)) return false;
  if (!process.env.VEVIT_DIGITAL_STORAGE_PATH?.trim()) return false;
  // Without a reachable filesystem the binding cannot be verified.
  return false;
}

function buildItem(product: StoreProductRow, quantity: number): CheckoutItem {
  if (!databaseBoolean(product.is_active) || !databaseBoolean(product.is_sellable)) {
    throw new CheckoutValidationException("product_unavailable", "Jedna nebo více položek již nejsou dostupné.");
  }
  const type = product.type ?? "";
  if (type !== "physical" && type !== "digital") {
    throw new CheckoutValidationException("product_unavailable", "Jedna nebo více položek již nejsou dostupné.");
  }
  if (String(product.currency ?? "").toLowerCase() !== "czk") {
    throw new CheckoutValidationException("unsupported_currency", "Měna produktu není podporovaná.");
  }
  const unitAmountMinor = effectivePriceMinor(product);
  if (unitAmountMinor > Math.floor(CHECKOUT_MAX_TOTAL_MINOR / quantity)) {
    throw new CheckoutValidationException("order_total_limit", "Celková cena objednávky je příliš vysoká.");
  }
  if (type === "digital" && !hasValidDigitalBinding(product)) {
    throw new CheckoutValidationException("digital_content_unavailable", "Digitální produkt není právě dostupný.");
  }

  const stockRaw = product.stock ?? null;
  const stock = stockRaw === null ? null : Number(stockRaw);
  let backorder = false;
  if (type === "physical" && stockRaw === null && !databaseBoolean(product.allow_backorder)) {
    throw new CheckoutValidationException("product_unavailable", "Jedna nebo více položek již nejsou dostupné.");
  }
  if (type === "physical" && (stockRaw === null || quantity > stock!)) {
    if (!databaseBoolean(product.allow_backorder)) {
      throw new CheckoutValidationException("insufficient_stock", "Požadované množství není skladem.");
    }
    backorder = stockRaw === null || quantity > stock!;
  }

  return {
    product_id: Number(product.id),
    variant_id: null,
    sku: String(product.sku ?? ""),
    name: String(product.name),
    type,
    quantity,
    currency: "czk",
    unit_amount_minor: unitAmountMinor,
    line_total_minor: unitAmountMinor * quantity,
    stock_status: type === "digital" ? "digital" : backorder ? "backorder" : "in_stock",
    backorder,
  };
}

// ── Shipping (normalizeShipping) ─────────────────────────────────────────────

function normalizeShipping(shipping: NormalizedInput["shipping"], required: boolean): { street: string; city: string; zip: string; country: string } | null {
  if (!required) return null;
  if (shipping === null || typeof shipping !== "object") {
    throw new CheckoutValidationException("shipping_required", "Doplňte doručovací adresu.");
  }
  const record = shipping as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!["street", "city", "zip", "country"].includes(key)) {
      throw new CheckoutValidationException("invalid_shipping", "Doručovací adresa není platná.");
    }
  }
  const result: Record<string, string> = {};
  const limits: Array<[string, number]> = [["street", 160], ["city", 100], ["zip", 24]];
  for (const [field, limit] of limits) {
    const value = String(record[field] ?? "").trim();
    if (value === "" || [...value].length > limit) {
      throw new CheckoutValidationException("invalid_shipping", "Doručovací adresa není platná.");
    }
    result[field] = value;
  }
  const country = String(record.country ?? "").trim().toUpperCase();
  if (country !== "CZ" && country !== "SK") {
    throw new CheckoutValidationException("invalid_shipping", "Země doručení není podporovaná.");
  }
  result.country = country;
  return result as { street: string; city: string; zip: string; country: string };
}

// ── Snapshot persistence ─────────────────────────────────────────────────────

type PublicSnapshot = Omit<CheckoutSnapshot, "checkout_grant_hash" | "idempotency_scope_hash" | "idempotency_key_hash" | "request_hash">;

function publicSnapshot(snapshot: CheckoutSnapshot): PublicSnapshot {
  const rest: Record<string, unknown> = { ...snapshot };
  delete rest.checkout_grant_hash;
  delete rest.idempotency_scope_hash;
  delete rest.idempotency_key_hash;
  delete rest.request_hash;
  return rest as PublicSnapshot;
}

export interface CheckoutCreateResult {
  snapshot: CheckoutSnapshot | VerifiedSnapshot;
  grant: string;
  reused: boolean;
}

export type VerifiedSnapshot = CheckoutSnapshot & { request_hash: string; persisted_status: string };

export interface FindExistingRow {
  public_id: string;
  snapshot_data: string;
  request_hash: string | null;
  status: string;
  expires_at: string | null;
}

/**
 * findExistingSnapshot/expireSnapshot. On the PostgREST transport a consumed
 * snapshot's snapshot_data does not carry the grant, so a reused checkout is
 * always returned with grant="" and the caller re-derives access from the
 * cookie grant store.
 */
export async function findExistingSnapshot(scopeHash: string, keyHash: string): Promise<FindExistingRow | null> {
  const rows = await storeRest<FindExistingRow[]>(
    "GET",
    "store_checkout_snapshots",
    { query: `select=public_id,snapshot_data,request_hash,status,expires_at&idempotency_scope_hash=eq.${scopeHash}&idempotency_key_hash=eq.${keyHash}&status=in.("pending","consumed")&limit=1` },
  );
  return rows.json[0] ?? null;
}

/** Verifies and parses a persisted snapshot; throws on integrity mismatch. */
export function verifyPersistedSnapshot(row: FindExistingRow): VerifiedSnapshot {
  if (!row.snapshot_data) {
    throw new Error("Persisted checkout snapshot integrity check failed.");
  }
  const snapshot = JSON.parse(row.snapshot_data) as CheckoutSnapshot;
  const storedHash = String(snapshot.snapshot_hash ?? "");
  const expectedHash = snapshotIntegrityHash(snapshot as unknown as Record<string, unknown>);
  if (storedHash === "" || storedHash !== expectedHash) {
    throw new Error("Persisted checkout snapshot integrity check failed.");
  }
  return { ...snapshot, request_hash: row.request_hash ?? "", persisted_status: row.status };
}

/** CAS expire (pending → expired); true only when this request won it. */
export async function expireSnapshotByPublicId(publicId: string, nowIso: string): Promise<boolean> {
  const result = await storeRest<Pick<FindExistingRow, "public_id">[]>(
    "PATCH",
    "store_checkout_snapshots",
    { query: `public_id=eq.${publicId}&status=eq.pending`, prefer: "return=representation", body: { status: "expired", updated_at: nowIso } },
  );
  return result.json.length > 0;
}

async function fetchProductsForCheckout(productIds: number[]): Promise<StoreProductRow[]> {
  const { json } = await storeRest<StoreProductRow[]>(
    "GET",
    "store_products",
    { query: `select=id,name,sku,price::text,sale_price::text,type,stock,is_active,is_sellable,allow_backorder,currency,download_file&id=in.(${productIds.join(",")})` },
  );
  return json;
}

export interface CheckoutCreateInput {
  input: Record<string, unknown>;
  user: { id: string } | null;
  guestSessionKey: string;
  now: Date;
}

export async function createCheckoutSnapshot(params: CheckoutCreateInput): Promise<CheckoutCreateResult> {
  const normalized = normalizeCheckoutInput(params.input);
  const scopeHash = params.user !== null ? sha256Hex(`user:${params.user.id}`) : sha256Hex(`session:${params.guestSessionKey}`);
  const keyHash = sha256Hex(normalized.idempotencyKey);
  // PHP json_encode of the array-map with ksort(SORT_NUMERIC) keys: ascending
  // numeric order, which JSON.stringify reproduces from a sorted Map.
  const requestHash = sha256Hex(JSON.stringify({
    items: Object.fromEntries(normalized.items.map((item) => [item.productId, item.quantity])),
    email: normalized.email,
    name: normalized.name,
    shipping: normalized.shipping,
    notes: normalized.notes,
  }));

  const existing = await findExistingSnapshot(scopeHash, keyHash);
  if (existing !== null && existing.request_hash !== requestHash) {
    throw new CheckoutValidationException("idempotency_conflict", "Stejný požadavek již obsahuje jiné údaje. Obnovte prosím stránku.");
  }
  if (existing !== null) {
    if (existing.status === "consumed") {
      return { snapshot: verifyPersistedSnapshot(existing), grant: "", reused: true };
    }
    if (existing.expires_at === null || new Date(existing.expires_at) > params.now) {
      return { snapshot: verifyPersistedSnapshot(existing), grant: "", reused: true };
    }
    // Expired: CAS expire, then fall through to create a fresh snapshot.
    const nowIso = params.now.toISOString().replace(/\.\d{3}Z$/, "Z");
    try {
      await expireSnapshotByPublicId(existing.public_id, nowIso);
    } catch {
      // CAS loss (another request consumed/expired it) re-reads below.
    }
    const reread = await findExistingSnapshot(scopeHash, keyHash);
    if (reread !== null && reread.status === "consumed") {
      return { snapshot: verifyPersistedSnapshot(reread), grant: "", reused: true };
    }
    if (reread !== null && reread.status === "pending" && reread.expires_at !== null && new Date(reread.expires_at) > params.now) {
      return { snapshot: verifyPersistedSnapshot(reread), grant: "", reused: true };
    }
  }

  const productIds = normalized.items.map((item) => item.productId);
  const productRows = await fetchProductsForCheckout(productIds);
  const productsById = new Map<number, StoreProductRow>();
  for (const row of productRows) productsById.set(Number(row.id), row);
  if (productsById.size !== productIds.length) {
    throw new CheckoutValidationException("product_unavailable", "Jedna nebo více položek již nejsou dostupné.");
  }

  const items: CheckoutItem[] = [];
  let subtotalMinor = 0;
  let hasPhysical = false;
  for (const { productId, quantity } of normalized.items) {
    const item = buildItem(productsById.get(productId)!, quantity);
    items.push(item);
    subtotalMinor += item.line_total_minor;
    hasPhysical = hasPhysical || item.type === "physical";
  }
  if (items.some((item) => item.line_total_minor > CHECKOUT_MAX_TOTAL_MINOR - (subtotalMinor - item.line_total_minor))) {
    throw new CheckoutValidationException("order_total_limit", "Celková cena objednávky je příliš vysoká.");
  }

  const shipping = normalizeShipping(normalized.shipping, hasPhysical);
  const shippingMinor = hasPhysical && subtotalMinor < 100000 ? 9900 : 0;
  const totalMinor = subtotalMinor + shippingMinor;
  if (totalMinor > CHECKOUT_MAX_TOTAL_MINOR) {
    throw new CheckoutValidationException("order_total_limit", "Celková cena objednávky je příliš vysoká.");
  }
  const expiresAtDate = new Date(params.now.getTime() + CHECKOUT_SNAPSHOT_TTL_SECONDS * 1000);
  const grant = randomBytes(32).toString("hex");
  const publicId = randomBytes(16).toString("hex");
  const snapshot: CheckoutSnapshot = {
    public_id: publicId,
    user_id: params.user !== null ? params.user.id : null,
    customer_email: normalized.email,
    customer_name: normalized.name,
    shipping,
    notes: normalized.notes,
    currency: "czk",
    items,
    subtotal_minor: subtotalMinor,
    shipping_minor: shippingMinor,
    total_minor: totalMinor,
    created_at: phpAtom(params.now),
    expires_at: phpAtom(expiresAtDate),
    price_version: phpYmdHis(params.now),
    checkout_grant_hash: sha256Hex(grant),
    idempotency_scope_hash: scopeHash,
    idempotency_key_hash: keyHash,
    request_hash: requestHash,
    snapshot_hash: "",
  };
  snapshot.snapshot_hash = snapshotIntegrityHash(publicSnapshot(snapshot) as unknown as Record<string, unknown>);

  try {
    await storeRest(
      "POST",
      "store_checkout_snapshots",
      {
        prefer: "return=minimal",
        body: {
          public_id: snapshot.public_id,
          user_id: snapshot.user_id,
          customer_email: snapshot.customer_email,
          customer_name: snapshot.customer_name,
          shipping_address: snapshot.shipping === null ? null : JSON.stringify(snapshot.shipping),
          notes: snapshot.notes,
          currency: "czk",
          subtotal_minor: snapshot.subtotal_minor,
          shipping_minor: snapshot.shipping_minor,
          total_minor: snapshot.total_minor,
          snapshot_data: JSON.stringify(publicSnapshot(snapshot)),
          snapshot_hash: snapshot.snapshot_hash,
          checkout_grant_hash: snapshot.checkout_grant_hash,
          expires_at: expiresAtDate.toISOString(),
          idempotency_scope_hash: scopeHash,
          idempotency_key_hash: keyHash,
          request_hash: requestHash,
          status: "pending",
        },
      },
    );
  } catch (error) {
    if (error instanceof StoreRestError) {
      throw new Error("Persisted checkout snapshot write failed.");
    }
    throw error;
  }

  return { snapshot, grant, reused: false };
}