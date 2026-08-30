import { storeRest } from "@/lib/store-config";
import { canTransitionPayment } from "@/lib/store-payment-service";
import "server-only";

/**
 * Port of store/lib/payments/StripePaymentProcessor.php over PostgREST.
 *
 * Ledger dedup relies on the store_payment_events.stripe_event_id unique
 * constraint (inserted with resolution=ignore-duplicates), fulfillment side
 * effects on the (order_item_id, movement_type) and order_item_id unique
 * constraints of the movements/entitlements tables, and stock decrements on an
 * optimistic compare-and-set instead of SELECT ... FOR UPDATE row locks.
 */

export class StripeEventStructureError extends Error {
  constructor() {
    super("Invalid Stripe event structure.");
  }
}

export interface ProcessResult {
  result: string;
  http_status: number;
}

interface LedgerRow {
  id: number;
  processing_status: string;
  payload_hash: string;
  attempts: number;
}

interface OrderRow {
  id: number;
  user_id: string | null;
  payment_status: string;
  fulfillment_status: string;
  status: string;
  total_minor: number;
  currency: string;
  stripe_payment_intent: string | null;
  paid_at: string | null;
  payment_evidence_at: string | null;
  payment_effects_applied_at: string | null;
}

function dbBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "t" || value === "true";
}

// ── Event ledger (upsertAndLockEvent / markEvent) ────────────────────────────

async function upsertAndLockEvent(eventId: string, type: string, objectId: string | null, payloadHash: string): Promise<LedgerRow> {
  const inserted = await storeRest<LedgerRow[]>("POST", "store_payment_events", {
    prefer: "resolution=ignore-duplicates,return=representation",
    body: { stripe_event_id: eventId, event_type: type, stripe_object_id: objectId, payload_hash: payloadHash, attempts: 1 },
  });
  if (inserted.json.length === 1) return inserted.json[0]!;
  // Duplicate delivery: bump attempts on the existing ledger row.
  const existing = await storeRest<LedgerRow[]>("GET", "store_payment_events", {
    query: `select=id,processing_status,payload_hash,attempts&stripe_event_id=eq.${eventId}&limit=1`,
  });
  const row = existing.json[0];
  if (!row) throw new Error("Payment event ledger unavailable.");
  await storeRest("PATCH", "store_payment_events", {
    query: `stripe_event_id=eq.${eventId}`,
    prefer: "return=minimal",
    body: { attempts: Number(row.attempts) + 1 },
  });
  return row;
}

async function markEvent(eventRowId: number, status: string, result: string, orderId: number | null): Promise<void> {
  const body: Record<string, unknown> = {
    processing_status: status,
    result,
    processed_at: new Date().toISOString(),
  };
  if (orderId !== null) body.order_id = orderId;
  await storeRest("PATCH", "store_payment_events", {
    query: `id=eq.${eventRowId}`,
    prefer: "return=minimal",
    body,
  });
}

// ── Order correlation + payment checks (lockCorrelatedOrder/paymentMismatch) ─

async function lockCorrelatedOrder(object: Record<string, unknown>): Promise<OrderRow | null> {
  const sessionId = object.id;
  const publicId = (object.metadata as Record<string, unknown> | undefined)?.order_public_id;
  if (typeof sessionId !== "string" || typeof publicId !== "string" || !/^[a-f0-9]{32}$/.test(publicId)) return null;
  const rows = await storeRest<OrderRow[]>("GET", "store_orders", {
    query: `select=id,user_id,payment_status,fulfillment_status,status,total_minor,currency,stripe_payment_intent,paid_at,payment_evidence_at,payment_effects_applied_at&public_id=eq.${publicId}&stripe_session_id=eq.${sessionId}&limit=1`,
  });
  return rows.json[0] ?? null;
}

function paymentMismatch(order: OrderRow, object: Record<string, unknown>): string | null {
  if (object.payment_status !== "paid" || object.status !== "complete") return "payment_not_complete";
  if (!Number.isInteger(object.amount_total) || object.amount_total !== order.total_minor) return "amount_mismatch";
  if (typeof object.currency !== "string" || object.currency.toLowerCase() !== order.currency.toLowerCase()) return "currency_mismatch";
  const intent = object.payment_intent;
  if (typeof intent !== "string" || !/^pi_[A-Za-z0-9_]+$/.test(intent)) return "payment_intent_invalid";
  if (order.stripe_payment_intent && order.stripe_payment_intent !== intent) return "payment_intent_mismatch";
  if (["cancelled", "refunded"].includes(order.payment_status)) return "order_closed";
  return null;
}

// ── Fulfillment data (lockOrderItemsAndProducts / fulfillmentConflict) ───────

interface FulfillmentItem {
  id: number;
  product_id: number;
  product_type: string;
  quantity: number;
  digital_content_path: string | null;
  product_stock: number | string | null;
  product_allow_backorder: unknown;
  product_is_active: unknown;
}

async function loadOrderItemsAndProducts(orderId: number): Promise<FulfillmentItem[]> {
  // Embedded store_products through the order_items → products foreign key.
  const rows = await storeRest<Array<Record<string, unknown>>>("GET", "store_order_items", {
    query: `select=id,product_id,product_type,quantity,digital_content_path,store_products(stock,allow_backorder,is_active)&order_id=eq.${orderId}&order=id.asc`,
  });
  return rows.json.map((row) => {
    const product = (row.store_products as Record<string, unknown> | null) ?? {};
    return {
      id: Number(row.id),
      product_id: Number(row.product_id),
      product_type: String(row.product_type),
      quantity: Number(row.quantity),
      digital_content_path: (row.digital_content_path as string | null) ?? null,
      product_stock: (product.stock as number | string | null) ?? null,
      product_allow_backorder: product.allow_backorder,
      product_is_active: product.is_active,
    };
  });
}

function fulfillmentConflict(items: FulfillmentItem[]): string | null {
  if (items.length === 0) return "order_items_missing";
  for (const item of items) {
    if (item.quantity <= 0) return "invalid_historical_quantity";
    if (item.product_type === "physical") {
      const backorder = dbBool(item.product_allow_backorder);
      if ((item.product_stock === null || Number(item.product_stock) < item.quantity) && !backorder) {
        return "inventory_conflict";
      }
    } else if (item.product_type === "digital") {
      if (!dbBool(item.product_is_active) || !item.digital_content_path) return "digital_content_conflict";
    } else {
      return "unsupported_item_type";
    }
  }
  return null;
}

// ── Side effects (applyInventoryMovement / createEntitlement / order update) ─

async function applyInventoryMovement(orderId: number, item: FulfillmentItem): Promise<void> {
  const inserted = await storeRest<Array<Record<string, unknown>>>("POST", "store_inventory_movements", {
    prefer: "resolution=ignore-duplicates,return=representation",
    body: {
      product_id: item.product_id,
      order_id: orderId,
      order_item_id: item.id,
      movement_type: "sale",
      quantity: -item.quantity,
      source_key: `order:${orderId}:item:${item.id}:paid-sale:v1`,
      audit_metadata: { source: "verified_stripe_payment" },
    },
  });
  if (inserted.json.length === 0) return; // movement already recorded

  if (item.product_stock === null) return;
  // Optimistic CAS decrement (ON CONFLICT cannot decrement over PostgREST).
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await storeRest<Array<Record<string, unknown>>>("GET", "store_products", {
      query: `select=stock,allow_backorder&id=eq.${item.product_id}&limit=1`,
    });
    const row = current.json[0];
    if (!row) throw new Error("Inventory changed during fulfillment.");
    const stock = Number(row.stock);
    if (!Number.isInteger(stock)) throw new Error("Inventory changed during fulfillment.");
    if (stock < item.quantity && !dbBool(row.allow_backorder)) throw new Error("Inventory changed after lock.");
    const patched = await storeRest<Array<Record<string, unknown>>>("PATCH", "store_products", {
      query: `id=eq.${item.product_id}&stock=eq.${stock}`,
      prefer: "return=representation",
      body: { stock: stock - item.quantity },
    });
    if (patched.json.length === 1) return;
  }
  throw new Error("Inventory changed after lock.");
}

async function createEntitlement(orderId: number, userId: string | null, itemId: number): Promise<void> {
  await storeRest("POST", "store_download_entitlements", {
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: {
      order_id: orderId,
      order_item_id: itemId,
      user_id: userId,
      audit_metadata: { source: "verified_stripe_payment" },
    },
  });
}

/** store_orders update with the PHP COALESCE(column, value) semantics. */
async function payOrder(order: OrderRow, paymentIntent: string | null, manualReviewReason: string | null, now: Date): Promise<void> {
  const nowIso = now.toISOString();
  const body: Record<string, unknown> = {
    payment_status: "paid",
    paid_at: order.paid_at ?? nowIso,
    payment_evidence_at: order.payment_evidence_at ?? nowIso,
    stripe_payment_intent: order.stripe_payment_intent ?? paymentIntent,
  };
  if (manualReviewReason !== null) {
    body.fulfillment_status = "manual_review";
    body.status = "manual_review";
    body.manual_review_reason = manualReviewReason;
  } else {
    body.fulfillment_status = "ready";
    body.status = "paid";
    body.payment_effects_applied_at = order.payment_effects_applied_at ?? nowIso;
    body.stripe_session_status = "complete";
  }
  await storeRest("PATCH", "store_orders", { query: `id=eq.${order.id}`, prefer: "return=minimal", body });
}

// ── process() ────────────────────────────────────────────────────────────────

export async function processStripeEvent(
  event: Record<string, unknown>,
  payloadHash: string,
  expectedLiveMode: boolean,
  expectedAccountId: string | null,
): Promise<ProcessResult> {
  const eventId = event.id;
  const eventType = event.type;
  const data = (event.data ?? null);
  const object = data !== null && typeof data === "object" ? (data as Record<string, unknown>).object : null;
  if (typeof eventId !== "string" || !/^evt_[A-Za-z0-9_]+$/.test(eventId) ||
    typeof eventType !== "string" || object === null || typeof object !== "object") {
    throw new StripeEventStructureError();
  }
  const objectRecord = object as Record<string, unknown>;

  const ledger = await upsertAndLockEvent(eventId, eventType, typeof objectRecord.id === "string" ? objectRecord.id : null, payloadHash);
  if (ledger.payload_hash !== payloadHash) {
    await markEvent(ledger.id, "manual_review", "event_id_payload_mismatch", null);
    return { result: "manual_review", http_status: 200 };
  }
  if (["processed", "ignored", "manual_review"].includes(ledger.processing_status)) {
    return { result: "duplicate", http_status: 200 };
  }
  if (eventType !== "checkout.session.completed") {
    if (ledger.processing_status === "received") {
      await markEvent(ledger.id, "ignored", "unsupported_event", null);
      return { result: "ignored", http_status: 200 };
    }
    return { result: "ignored", http_status: 200 };
  }
  if (event.livemode !== expectedLiveMode || (expectedAccountId !== null && event.account !== expectedAccountId)) {
    await markEvent(ledger.id, "manual_review", "environment_mismatch", null);
    return { result: "manual_review", http_status: 200 };
  }

  const order = await lockCorrelatedOrder(objectRecord);
  if (order === null) {
    await markEvent(ledger.id, "manual_review", "order_correlation_failed", null);
    return { result: "manual_review", http_status: 200 };
  }
  const ledgerOrderPatch = storeRest("PATCH", "store_payment_events", {
    query: `id=eq.${ledger.id}`,
    prefer: "return=minimal",
    body: { order_id: order.id },
  });

  const mismatch = paymentMismatch(order, objectRecord);
  if (mismatch === null && typeof objectRecord.payment_intent === "string") {
    // payment_intent_reused: the intent must not belong to another order.
    const reused = await storeRest<Array<Pick<OrderRow, "id">>>("GET", "store_orders", {
      query: `select=id&stripe_payment_intent=eq.${objectRecord.payment_intent}&id=neq.${order.id}&limit=1`,
    });
    if (reused.json.length > 0) {
      await ledgerOrderPatch;
      await markEvent(ledger.id, "manual_review", "payment_intent_reused", order.id);
      return { result: "manual_review", http_status: 200 };
    }
  }
  if (mismatch !== null) {
    await ledgerOrderPatch;
    await markEvent(ledger.id, "manual_review", mismatch, order.id);
    return { result: "manual_review", http_status: 200 };
  }
  await ledgerOrderPatch;

  if (order.payment_status === "paid" && order.payment_effects_applied_at !== null) {
    await markEvent(ledger.id, "processed", "already_fulfilled", order.id);
    return { result: "duplicate_payment", http_status: 200 };
  }
  if (order.payment_status === "paid" && order.fulfillment_status === "manual_review") {
    await markEvent(ledger.id, "processed", "already_manual_review", order.id);
    return { result: "paid_manual_review", http_status: 200 };
  }
  if (!canTransitionPayment(order.payment_status, "paid")) {
    throw new Error(`Forbidden payment transition ${order.payment_status} -> paid`);
  }

  const items = await loadOrderItemsAndProducts(order.id);
  const conflict = fulfillmentConflict(items);
  const now = new Date();
  const intent = typeof objectRecord.payment_intent === "string" && objectRecord.payment_intent !== "" ? objectRecord.payment_intent : null;
  if (conflict !== null) {
    await payOrder(order, intent, conflict, now);
    await markEvent(ledger.id, "processed", conflict, order.id);
    return { result: "paid_manual_review", http_status: 200 };
  }

  for (const item of items) {
    if (item.product_type === "physical") await applyInventoryMovement(order.id, item);
  }
  for (const item of items) {
    if (item.product_type === "digital") await createEntitlement(order.id, order.user_id, item.id);
  }
  await payOrder(order, intent, null, now);
  await markEvent(ledger.id, "processed", "paid", order.id);
  return { result: "paid", http_status: 200 };
}