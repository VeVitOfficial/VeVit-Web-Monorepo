import { randomBytes } from "node:crypto";
import Stripe from "stripe";
import {
  storeRest,
  storeStripeConfig,
} from "@/lib/store-config";
import { minorToDecimal, snapshotIntegrityHash, sha256Hex } from "@/lib/store-order-core";
import type { CheckoutItem, VerifiedSnapshot } from "@/lib/store-checkout-service";
import { phpAtom } from "@/lib/store-checkout-service";
import "server-only";

/**
 * Ports of store/lib/orders/PaymentOrderService.php,
 * store/lib/payments/StripeCheckoutService.php and OrderStateMachine.
 *
 * PostgREST has no SELECT ... FOR UPDATE, so the transactional flow becomes a
 * CAS: this request first wins the snapshot's pending → consumed transition,
 * and only the winner inserts the order. A CAS loser re-reads the order
 * created by the winner and returns it (reused). Payment status transitions
 * follow the same tables as the PHP OrderStateMachine.
 */

export class PaymentOrderException extends Error {
  constructor(readonly errorCode: string) {
    super("Objednávku nelze bezpečně vytvořit.");
  }
}

export class StripeSessionConflictError extends Error {}

const PAYMENT_TRANSITIONS: Record<string, string[]> = {
  pending_checkout: ["pending_checkout", "awaiting_payment", "cancelled"],
  awaiting_payment: ["awaiting_payment", "paid", "failed", "cancelled", "manual_review"],
  failed: ["failed", "awaiting_payment", "cancelled"],
  paid: ["paid", "refunded"],
  cancelled: ["cancelled"],
  refunded: ["refunded"],
  manual_review: ["manual_review", "paid", "refunded"],
  legacy_unknown: ["legacy_unknown"],
};

export function canTransitionPayment(from: string, to: string): boolean {
  return (PAYMENT_TRANSITIONS[from] ?? []).includes(to);
}

function dbBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "t" || value === "true";
}

// ── Row typing ───────────────────────────────────────────────────────────────

interface SnapshotRow {
  id: number;
  public_id: string;
  user_id: string | null;
  checkout_grant_hash: string | null;
  status: string;
  expires_at: string;
  currency: string;
  subtotal_minor: number;
  shipping_minor: number;
  total_minor: number;
  request_hash: string | null;
  snapshot_hash: string;
  snapshot_data: string;
}

export interface OrderRow {
  id: number;
  order_number: string;
  public_id: string;
  user_id: string | null;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total_minor: number;
  shipping_minor: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_checkout_url: string | null;
  stripe_session_status: string | null;
  stripe_session_attempt: number | null;
  stripe_session_expires_at: string | null;
  checkout_request_hash: string | null;
  [key: string]: unknown;
}

interface ItemRow {
  product_name: string;
  quantity: number;
  unit_price_minor: number;
}

async function selectOne<T>(path: string, query: string): Promise<T | null> {
  const rows = await storeRest<T[]>("GET", path, { query: `${query}&limit=1` });
  return rows.json[0] ?? null;
}

// ── Snapshot authorization (authorizeSnapshot) ───────────────────────────────

async function loadSnapshotRow(publicId: string): Promise<SnapshotRow | null> {
  return selectOne<SnapshotRow>(
    "store_checkout_snapshots",
    `select=id,public_id,user_id,checkout_grant_hash,status,expires_at,currency,subtotal_minor,shipping_minor,total_minor,request_hash,snapshot_hash,snapshot_data&public_id=eq.${publicId}`,
  );
}

function authorizeSnapshot(row: SnapshotRow, user: { id: string } | null, grant: string | null): void {
  const owned = user !== null && row.user_id !== null && row.user_id === user.id;
  const guest = row.user_id === null && typeof grant === "string" && grant.length === 64 &&
    row.checkout_grant_hash !== null && row.checkout_grant_hash === sha256Hex(grant);
  if (!owned && !guest) throw new PaymentOrderException("snapshot_unavailable");
}

// ── Product revalidation (revalidateProducts) ────────────────────────────────

interface OrderProductRow {
  id: number;
  name: string;
  sku: string | null;
  price: string;
  sale_price: string | null;
  type: string;
  stock: number | string | null;
  is_active: unknown;
  is_sellable: unknown;
  allow_backorder: unknown;
  currency: string;
  download_file: string | null;
}

function decimalToMinor(value: string): number {
  const match = /^([0-9]+)(?:\.([0-9]{1,2}))?$/.exec(value.trim());
  if (!match) throw new PaymentOrderException("price_changed");
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  if (whole > 92233720368547758) throw new PaymentOrderException("price_changed");
  return whole * 100 + fraction;
}

/**
 * The digital binding check mirrors the PHP safeDigitalPath, which verifies the
 * file inside the storage root. On the Vercel runtime there is no storage root
 * unless VEVIT_DIGITAL_STORAGE_PATH exists as a real directory, so without it
 * revalidation fails closed with digital_unavailable.
 */
async function safeDigitalPath(relative: string): Promise<boolean> {
  if (relative === "" || relative.startsWith("/") || relative.includes("..") ||
    relative.includes("\0") || /^[a-z][a-z0-9+.-]*:\/\//i.test(relative)) return false;
  const { promises: fs } = await import("node:fs");
  const base = process.env.VEVIT_DIGITAL_STORAGE_PATH?.trim();
  if (!base) return false;
  try {
    const resolvedBase = await fs.realpath(base);
    const resolved = await fs.realpath(`${base}/${relative}`);
    const stat = await fs.stat(resolved);
    return stat.isFile() && resolved.startsWith(`${resolvedBase}/`);
  } catch {
    return false;
  }
}

async function revalidateProducts(snapshot: VerifiedSnapshot): Promise<Map<number, OrderProductRow>> {
  const items = snapshot.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > 25) throw new PaymentOrderException("snapshot_invalid");
  const productIds: number[] = [];
  for (const item of items) {
    if (!Number.isInteger(item.product_id) || !Number.isInteger(item.quantity) ||
      item.quantity < 1 || item.quantity > 100 || item.variant_id !== null) {
      throw new PaymentOrderException("snapshot_invalid");
    }
    productIds.push(item.product_id);
  }
  if (new Set(productIds).size !== productIds.length) throw new PaymentOrderException("snapshot_invalid");
  const { json } = await storeRest<OrderProductRow[]>(
    "GET",
    "store_products",
    { query: `select=id,name,sku,price::text,sale_price::text,type,stock,is_active,is_sellable,allow_backorder,currency,download_file&id=in.(${productIds.join(",")})&order=id.asc` },
  );
  const products = new Map<number, OrderProductRow>();
  for (const product of json) products.set(Number(product.id), product);
  if (products.size !== productIds.length) throw new PaymentOrderException("product_unavailable");

  let subtotal = 0;
  for (const item of items) {
    const product = products.get(item.product_id)!;
    if (!dbBool(product.is_active) || !dbBool(product.is_sellable)) throw new PaymentOrderException("product_unavailable");
    if ((product.type !== "physical" && product.type !== "digital") ||
      product.type !== item.type ||
      String(product.currency).toLowerCase() !== "czk" ||
      item.currency !== "czk") {
      throw new PaymentOrderException("product_changed");
    }
    const sale = product.sale_price;
    const price = sale !== null && sale !== undefined && decimalToMinor(String(sale)) > 0 ? String(sale) : String(product.price);
    const minor = decimalToMinor(price);
    if (minor <= 0 || minor !== item.unit_amount_minor || minor * item.quantity !== item.line_total_minor) {
      throw new PaymentOrderException("price_changed");
    }
    subtotal += item.line_total_minor;
    if (product.type === "physical") {
      if (product.stock === null && !dbBool(product.allow_backorder)) throw new PaymentOrderException("stock_changed");
      if (product.stock !== null && Number(product.stock) < item.quantity && !dbBool(product.allow_backorder)) {
        throw new PaymentOrderException("stock_changed");
      }
    } else if (!(await safeDigitalPath(String(product.download_file ?? "")))) {
      throw new PaymentOrderException("digital_unavailable");
    }
  }
  if (subtotal !== snapshot.subtotal_minor) throw new PaymentOrderException("snapshot_invalid");
  return products;
}

// ── Order insertion (insertOrder / insertItems) ──────────────────────────────

async function insertOrder(row: SnapshotRow, snapshot: VerifiedSnapshot, guestGrant: string | null, now: Date): Promise<OrderRow> {
  const publicId = randomBytes(16).toString("hex");
  const ymd = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const orderNumber = `VVS-${ymd}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const body: Record<string, unknown> = {
    order_number: orderNumber,
    public_id: publicId,
    user_id: snapshot.user_id,
    guest_grant_hash: guestGrant === null ? null : sha256Hex(guestGrant),
    guest_grant_expires_at: guestGrant === null ? null : atomToIso(new Date(now.getTime() + 30 * 86_400_000)),
    status: "pending_checkout",
    payment_status: "pending_checkout",
    fulfillment_status: "pending",
    total: minorToDecimal(snapshot.total_minor),
    currency: "czk",
    customer_email: snapshot.customer_email,
    customer_name: snapshot.customer_name,
    shipping_address: snapshot.shipping === null ? null : JSON.stringify(snapshot.shipping),
    notes: snapshot.notes,
    checkout_snapshot_id: row.id,
    checkout_request_hash: row.request_hash,
    subtotal_minor: snapshot.subtotal_minor,
    shipping_minor: snapshot.shipping_minor,
    total_minor: snapshot.total_minor,
    audit_metadata: { snapshot_hash: row.snapshot_hash, schema_version: 1 },
  };
  let created: OrderRow[];
  try {
    const result = await storeRest<OrderRow[]>("POST", "store_orders", { prefer: "return=representation", body });
    created = result.json;
  } catch (error) {
    throw new Error(`Order insert failed: ${(error as Error).message}`);
  }
  return created[0]!;
}

function atomToIso(date: Date): string {
  // PHP used 'Y-m-d H:i:s' (server-local=UTC in prod); store as ISO instead —
  // timestamp columns accept ISO and comparisons stay consistent.
  return new Date(phpAtom(date).replace("+00:00", "Z")).toISOString();
}

async function insertItems(orderId: number, items: CheckoutItem[], products: Map<number, OrderProductRow>): Promise<void> {
  const payload = items.map((item) => {
    const product = products.get(item.product_id)!;
    return {
      order_id: orderId,
      product_id: item.product_id,
      variant_id: null,
      product_name: item.name,
      product_type: item.type,
      quantity: item.quantity,
      unit_price: minorToDecimal(item.unit_amount_minor),
      product_sku: item.sku === "" ? null : item.sku,
      unit_price_minor: item.unit_amount_minor,
      line_total_minor: item.line_total_minor,
      stock_context: {
        snapshot_status: item.stock_status,
        allow_backorder: dbBool(product.allow_backorder),
        stock_at_order: product.stock === null ? null : Number(product.stock),
      },
      digital_content_path: item.type === "digital" ? product.download_file : null,
    };
  });
  await storeRest("POST", "store_order_items", { prefer: "return=minimal", body: payload });
}

// ── createFromSnapshot ───────────────────────────────────────────────────────

export interface CreateFromSnapshotResult {
  order: OrderRow;
  guest_grant: string;
  reused: boolean;
}

export async function createOrderFromSnapshot(
  publicId: string,
  user: { id: string } | null,
  checkoutGrant: string | null,
  now: Date,
): Promise<CreateFromSnapshotResult> {
  const snapshotRow = await loadSnapshotRow(publicId);
  if (snapshotRow === null) throw new PaymentOrderException("snapshot_unavailable");

  authorizeSnapshot(snapshotRow, user, checkoutGrant);

  const existing = await selectOne<OrderRow>("store_orders", `select=*&checkout_snapshot_id=eq.${snapshotRow.id}`);
  if (existing !== null) {
    if (existing.checkout_request_hash !== (snapshotRow.request_hash ?? "")) {
      throw new PaymentOrderException("idempotency_conflict");
    }
    return { order: existing, guest_grant: "", reused: true };
  }
  if (snapshotRow.status !== "pending") throw new PaymentOrderException("snapshot_consumed");
  if (new Date(snapshotRow.expires_at) <= now) {
    try {
      await storeRest("PATCH", "store_checkout_snapshots", {
        query: `id=eq.${snapshotRow.id}&status=eq.pending`,
        prefer: "return=minimal",
        body: { status: "expired", updated_at: now.toISOString() },
      });
    } catch {
      // CAS loss: another racer already transitioned it.
    }
    throw new PaymentOrderException("snapshot_expired");
  }

  let snapshot: VerifiedSnapshot;
  try {
    snapshot = JSON.parse(snapshotRow.snapshot_data) as VerifiedSnapshot;
  } catch {
    throw new PaymentOrderException("snapshot_invalid");
  }
  if (snapshot === null || typeof snapshot !== "object") throw new PaymentOrderException("snapshot_invalid");
  verifySnapshotIntegrity(snapshot, snapshotRow.snapshot_hash);
  if (snapshot.user_id !== snapshotRow.user_id || String(snapshot.currency) !== String(snapshotRow.currency)) {
    throw new PaymentOrderException("snapshot_invalid");
  }
  const products = await revalidateProducts(snapshot);

  for (const field of ["subtotal_minor", "shipping_minor", "total_minor"] as const) {
    const value = (snapshot as unknown as Record<string, unknown>)[field];
    if (!Number.isInteger(value) || (value as number) !== snapshotRow[field]) {
      throw new PaymentOrderException("snapshot_invalid");
    }
  }
  if (snapshot.subtotal_minor + snapshot.shipping_minor !== snapshot.total_minor) {
    throw new PaymentOrderException("snapshot_invalid");
  }

  const isOwner = user !== null && snapshotRow.user_id !== null && snapshotRow.user_id === user.id;
  if (isOwner) {
    // Owner flow: consume then insert (consume is the race gate).
    await consumeSnapshot(snapshotRow.id, now);
    const newOrder = await insertOrder(snapshotRow, snapshot, null, now);
    await insertItems(newOrder.id, snapshot.items, products);
    return { order: newOrder, guest_grant: "", reused: false };
  }
  const guestGrant = randomBytes(32).toString("hex");
  await consumeSnapshot(snapshotRow.id, now);
  const newOrder = await insertOrder(snapshotRow, snapshot, guestGrant, now);
  await insertItems(newOrder.id, snapshot.items, products);
  return { order: newOrder, guest_grant: guestGrant, reused: false };
}

/** CAS consume: only one racer can move pending → consumed. */
async function consumeSnapshot(snapshotDbId: number, now: Date): Promise<void> {
  try {
    const result = await storeRest<Pick<SnapshotRow, "public_id">[]>("PATCH", "store_checkout_snapshots", {
      query: `id=eq.${snapshotDbId}&status=eq.pending`,
      prefer: "return=representation",
      body: { status: "consumed", updated_at: now.toISOString() },
    });
    // Zero affected rows = another request won the consume race.
    if (result.json.length === 0) throw new PaymentOrderException("snapshot_consumed");
  } catch (error) {
    if (error instanceof PaymentOrderException) throw error;
    throw new PaymentOrderException("snapshot_consumed");
  }
}

function verifySnapshotIntegrity(snapshot: VerifiedSnapshot, storedHash: string): void {
  const embedded = String((snapshot as unknown as Record<string, unknown>).snapshot_hash ?? "");
  const calculated = snapshotIntegrityHash(snapshot as unknown as Record<string, unknown>);
  if (embedded === "" || storedHash !== embedded || embedded !== calculated) {
    throw new PaymentOrderException("snapshot_invalid");
  }
}

// ── Stripe checkout session (StripeCheckoutService.createOrReuse) ────────────

export async function createOrReuseStripeSession(orderId: number, appUrl: string): Promise<{ url: string; order: OrderRow; reused: boolean }> {
  const stripeConfig = storeStripeConfig();
  if (stripeConfig === null) throw new StripeSessionConflictError("Stripe configuration missing");
  const stripe = new Stripe(stripeConfig.secretKey);

  const order = await selectOne<OrderRow>("store_orders", `select=*&id=eq.${orderId}`);
  if (order === null) throw new Error("Order unavailable.");
  if (!["pending_checkout", "awaiting_payment", "failed"].includes(order.payment_status)) {
    throw new Error("Order may not start checkout in its current state.");
  }

  const now = new Date();
  const sessionExpiresAt = order.stripe_session_expires_at ? new Date(order.stripe_session_expires_at) : null;
  if (order.stripe_session_id && order.stripe_checkout_url &&
    (sessionExpiresAt === null || sessionExpiresAt > now)) {
    return { url: order.stripe_checkout_url, order, reused: true };
  }

  let attempt = Number(order.stripe_session_attempt ?? 0);
  if (order.stripe_session_id && sessionExpiresAt !== null && sessionExpiresAt <= now) {
    attempt += 1;
    await storeRest("PATCH", "store_orders", {
      query: `id=eq.${orderId}`,
      prefer: "return=minimal",
      body: { stripe_session_id: null, stripe_checkout_url: null, stripe_session_status: "expired", stripe_session_attempt: attempt },
    });
  } else {
    await storeRest("PATCH", "store_orders", {
      query: `id=eq.${orderId}`,
      prefer: "return=minimal",
      body: { stripe_session_status: "creating" },
    });
  }

  const itemRows = await storeRest<ItemRow[]>("GET", "store_order_items", {
    query: `select=product_name,quantity,unit_price_minor&order_id=eq.${orderId}&order=id.asc`,
  });
  const items = itemRows.json;
  if (items.length === 0) throw new Error("Order has no items.");
  let stripeTotal = 0;
  for (const item of items) {
    const unit = Number(item.unit_price_minor);
    const quantity = Number(item.quantity);
    if (unit <= 0 || quantity <= 0 || !Number.isSafeInteger(unit * quantity)) {
      throw new Error("Order contains invalid monetary data.");
    }
    stripeTotal += unit * quantity;
  }
  const shippingMinor = Number(order.shipping_minor);
  if (shippingMinor < 0) throw new Error("Order contains invalid shipping.");
  stripeTotal += shippingMinor;
  if (stripeTotal !== order.total_minor) throw new Error("Order total does not match Stripe line items.");

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: order.currency,
      product_data: { name: item.product_name.slice(0, 120) },
      unit_amount: item.unit_price_minor,
    },
    quantity: item.quantity,
  }));
  if (shippingMinor > 0) {
    lineItems.push({
      price_data: {
        currency: order.currency,
        product_data: { name: "Doprava" },
        unit_amount: shippingMinor,
      },
      quantity: 1,
    });
  }

  const idempotencyKey = `vevit-store:checkout:v1:${order.public_id}:${attempt}`;
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Release 0 uses one synchronous authoritative event.
      payment_method_types: ["card"],
      success_url: `${appUrl}/success.php?order=${encodeURIComponent(order.public_id)}`,
      cancel_url: `${appUrl}/cancel.php?order=${encodeURIComponent(order.public_id)}`,
      client_reference_id: order.public_id,
      metadata: { order_public_id: order.public_id, schema_version: "1" },
      line_items: lineItems,
    }, { idempotencyKey });
  } catch (error) {
    throw new Error(`Stripe checkout request failed: ${(error as Error).message}`);
  }

  const amountTotal = typeof session.amount_total === "number" ? session.amount_total : NaN;
  if (
    typeof session.id !== "string" || !/^cs_(?:test|live)_[A-Za-z0-9_]+$/.test(session.id) ||
    typeof session.url !== "string" || !session.url.startsWith("https://checkout.stripe.com/") ||
    session.mode !== "payment" || session.status !== "open" ||
    session.payment_status !== "unpaid" ||
    session.livemode !== stripeConfig.expectedLiveMode ||
    session.client_reference_id !== order.public_id ||
    (session.metadata?.order_public_id ?? null) !== order.public_id ||
    (session.metadata?.schema_version ?? null) !== "1" ||
    !Number.isInteger(amountTotal) || amountTotal !== order.total_minor ||
    typeof session.currency !== "string" || session.currency.toLowerCase() !== order.currency.toLowerCase()
  ) {
    throw new Error("Stripe returned an invalid checkout session.");
  }

  // Re-read: another request may have stored its own session meanwhile.
  const current = await selectOne<OrderRow>("store_orders", `select=*&id=eq.${orderId}`);
  if (current === null) throw new Error("Order unavailable.");
  if (current.stripe_session_id) {
    if (current.stripe_session_id !== session.id) {
      throw new StripeSessionConflictError("Conflicting Stripe checkout session.");
    }
    const stored = await selectOne<OrderRow>("store_orders", `select=*&id=eq.${orderId}`);
    return { url: stored?.stripe_checkout_url ?? session.url, order: current, reused: true };
  }
  if (!canTransitionPayment(current.payment_status, "awaiting_payment")) {
    throw new Error(`Forbidden payment transition ${current.payment_status} -> awaiting_payment`);
  }
  const expiresAtSeconds = typeof session.expires_at === "number" ? session.expires_at : Math.floor(Date.now() / 1000) + 86400;
  await storeRest("PATCH", "store_orders", {
    query: `id=eq.${orderId}`,
    prefer: "return=minimal",
    body: {
      stripe_session_id: session.id,
      stripe_checkout_url: session.url,
      stripe_session_status: "open",
      stripe_session_expires_at: new Date(expiresAtSeconds * 1000).toISOString(),
      payment_status: "awaiting_payment",
      status: "awaiting_payment",
    },
  });
  const stored = await selectOne<OrderRow>("store_orders", `select=*&id=eq.${orderId}`);
  return { url: stored?.stripe_checkout_url ?? session.url, order: stored ?? current, reused: false };
}