import { randomBytes } from "node:crypto";
import {
  CHECKOUT_MAX_ITEMS,
  CHECKOUT_MAX_QUANTITY,
  CheckoutValidationException,
  deliveryMethodOf,
  finalizeCheckoutDetails,
  normalizeCheckoutInput,
  requestHashInput,
  type CheckoutBilling,
  type CheckoutConsents,
  type CheckoutPaymentMethod,
  type DeliveryInput,
  type NormalizedInput,
} from "@/lib/checkout/checkout-input";
import type { PostalAddress } from "@/lib/checkout/company";
import { shippingMinor as computeShippingMinor } from "@/lib/checkout/shipping";
import { lookupPacketaPoint } from "@/lib/packeta";
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

// Input normalization lives in the pure module so it is unit-tested; re-exported for existing callers.
export { CheckoutValidationException, CHECKOUT_MAX_ITEMS, CHECKOUT_MAX_QUANTITY, normalizeCheckoutInput };
export type { NormalizedInput };

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

export interface CheckoutSnapshot {
  public_id: string;
  user_id: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping: PostalAddress | null;
  delivery: DeliveryInput | null;
  billing: CheckoutBilling;
  payment_method: CheckoutPaymentMethod | null;
  consents: CheckoutConsents;
  terms_accepted_at: string | null;
  digital_waiver_at: string | null;
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
  /** Tier perk (Silver+), resolved server-side by the route — see store-perks.ts. */
  freeShipping?: boolean;
}

export async function createCheckoutSnapshot(params: CheckoutCreateInput): Promise<CheckoutCreateResult> {
  const normalized = normalizeCheckoutInput(params.input);
  const scopeHash = params.user !== null ? sha256Hex(`user:${params.user.id}`) : sha256Hex(`session:${params.guestSessionKey}`);
  const keyHash = sha256Hex(normalized.idempotencyKey);
  // PHP json_encode of the array-map with ksort(SORT_NUMERIC) keys: ascending
  // numeric order, which JSON.stringify reproduces from a sorted Map.
  const requestHash = sha256Hex(JSON.stringify(requestHashInput(normalized)));

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
  let hasDigital = false;
  for (const { productId, quantity } of normalized.items) {
    const item = buildItem(productsById.get(productId)!, quantity);
    items.push(item);
    subtotalMinor += item.line_total_minor;
    hasPhysical = hasPhysical || item.type === "physical";
    hasDigital = hasDigital || item.type === "digital";
  }
  if (items.some((item) => item.line_total_minor > CHECKOUT_MAX_TOTAL_MINOR - (subtotalMinor - item.line_total_minor))) {
    throw new CheckoutValidationException("order_total_limit", "Celková cena objednávky je příliš vysoká.");
  }

  const details = finalizeCheckoutDetails(normalized, { hasPhysical, hasDigital });
  if (details.delivery?.method === "packeta_pickup") {
    // The point arrives from the browser: Packeta confirms it exists and its data replaces the client's.
    const lookup = await lookupPacketaPoint(details.delivery.point);
    if (lookup.status === "invalid") {
      throw new CheckoutValidationException("invalid_delivery", "Vybrané výdejní místo už není dostupné. Vyber jiné.");
    }
    if (lookup.status === "valid") details.delivery = { method: "packeta_pickup", point: lookup.point };
  }
  const shipping = details.shipping;
  const shippingMinor = computeShippingMinor({
    method: deliveryMethodOf(details.delivery),
    hasPhysical,
    subtotalMinor,
    freePerk: params.freeShipping === true,
  });
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
    customer_phone: details.phone,
    shipping,
    delivery: details.delivery,
    billing: details.billing,
    payment_method: normalized.paymentMethod,
    consents: details.consents,
    terms_accepted_at: details.consents.terms ? phpAtom(params.now) : null,
    digital_waiver_at: hasDigital && details.consents.digital_waiver ? phpAtom(params.now) : null,
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