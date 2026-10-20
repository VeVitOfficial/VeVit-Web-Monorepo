import Stripe from "stripe";
import { intentMismatch, paymentMethodFromCharge } from "@/lib/payments/intent-checks";
import { storeRest, storeStripeConfig } from "@/lib/store-config";
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
async function payOrder(
  order: OrderRow,
  paymentIntent: string | null,
  manualReviewReason: string | null,
  now: Date,
  paymentMethod: string | null = null,
): Promise<void> {
  const nowIso = now.toISOString();
  const body: Record<string, unknown> = {
    payment_status: "paid",
    paid_at: order.paid_at ?? nowIso,
    payment_evidence_at: order.payment_evidence_at ?? nowIso,
    stripe_payment_intent: order.stripe_payment_intent ?? paymentIntent,
  };
  // Only the PaymentIntent flow records the method (column comes from migration 202610200002).
  if (paymentMethod !== null) body.payment_method = paymentMethod;
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
  const isIntentEvent = eventType === "payment_intent.succeeded" || eventType === "payment_intent.payment_failed";
  if (eventType !== "checkout.session.completed" && !isIntentEvent) {
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
  if (isIntentEvent) return processPaymentIntentEvent(eventType, objectRecord, ledger.id, expectedLiveMode);

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

  const intent = typeof objectRecord.payment_intent === "string" && objectRecord.payment_intent !== "" ? objectRecord.payment_intent : null;
  return fulfillPaidOrder(ledger.id, order, intent, null);
}

// ── Shared fulfillment tail (checkout.session.completed and payment_intent.succeeded) ─

async function fulfillPaidOrder(ledgerId: number, order: OrderRow, intent: string | null, paymentMethod: string | null): Promise<ProcessResult> {
  if (order.payment_status === "paid" && order.payment_effects_applied_at !== null) {
    await markEvent(ledgerId, "processed", "already_fulfilled", order.id);
    return { result: "duplicate_payment", http_status: 200 };
  }
  if (order.payment_status === "paid" && order.fulfillment_status === "manual_review") {
    await markEvent(ledgerId, "processed", "already_manual_review", order.id);
    return { result: "paid_manual_review", http_status: 200 };
  }
  if (!canTransitionPayment(order.payment_status, "paid")) {
    throw new Error(`Forbidden payment transition ${order.payment_status} -> paid`);
  }

  const items = await loadOrderItemsAndProducts(order.id);
  const conflict = fulfillmentConflict(items);
  const now = new Date();
  if (conflict !== null) {
    await payOrder(order, intent, conflict, now, paymentMethod);
    await markEvent(ledgerId, "processed", conflict, order.id);
    return { result: "paid_manual_review", http_status: 200 };
  }

  for (const item of items) {
    if (item.product_type === "physical") await applyInventoryMovement(order.id, item);
  }
  for (const item of items) {
    if (item.product_type === "digital") await createEntitlement(order.id, order.user_id, item.id);
  }
  await payOrder(order, intent, null, now, paymentMethod);
  await markEvent(ledgerId, "processed", "paid", order.id);
  return { result: "paid", http_status: 200 };
}

// ── PaymentIntent events (custom payment gateway) ────────────────────────────

const ORDER_FIELDS =
  "id,user_id,payment_status,fulfillment_status,status,total_minor,currency,stripe_payment_intent,paid_at,payment_evidence_at,payment_effects_applied_at,public_id";

interface IntentOrderRow extends OrderRow {
  public_id: string;
}

async function chargePaymentMethod(intent: Record<string, unknown>): Promise<string | null> {
  const latest = intent.latest_charge;
  try {
    if (latest !== null && typeof latest === "object") {
      return paymentMethodFromCharge((latest as Record<string, unknown>).payment_method_details as Parameters<typeof paymentMethodFromCharge>[0]);
    }
    const config = storeStripeConfig();
    if (typeof latest !== "string" || !/^ch_[A-Za-z0-9_]+$/.test(latest) || config === null) return null;
    const charge = await new Stripe(config.secretKey).charges.retrieve(latest);
    return paymentMethodFromCharge(charge.payment_method_details as unknown as Parameters<typeof paymentMethodFromCharge>[0]);
  } catch {
    // The method is bookkeeping only; a failed lookup must not hold back a verified payment.
    return null;
  }
}

async function processPaymentIntentEvent(
  eventType: "payment_intent.succeeded" | "payment_intent.payment_failed",
  intent: Record<string, unknown>,
  ledgerId: number,
  expectedLiveMode: boolean,
): Promise<ProcessResult> {
  const metadata = (intent.metadata ?? null) as Record<string, string> | null;
  const publicId = metadata?.order_public_id;
  const intentId = intent.id;
  // Intents created by other flows (e.g. Premium subscriptions) share this endpoint: not ours.
  if (metadata?.schema_version !== "2" || typeof publicId !== "string" || !/^[a-f0-9]{32}$/.test(publicId) ||
    typeof intentId !== "string" || !/^pi_[A-Za-z0-9_]+$/.test(intentId)) {
    await markEvent(ledgerId, "ignored", "not_store_intent", null);
    return { result: "ignored", http_status: 200 };
  }

  const rows = await storeRest<IntentOrderRow[]>("GET", "store_orders", {
    query: `select=${ORDER_FIELDS}&public_id=eq.${publicId}&limit=1`,
  });
  const order = rows.json[0];
  if (!order) {
    await markEvent(ledgerId, "manual_review", "order_correlation_failed", null);
    return { result: "manual_review", http_status: 200 };
  }
  await storeRest("PATCH", "store_payment_events", { query: `id=eq.${ledgerId}`, prefer: "return=minimal", body: { order_id: order.id } });

  const amount = eventType === "payment_intent.succeeded" ? intent.amount_received : intent.amount;
  const mismatch = intentMismatch(
    order,
    {
      id: intentId,
      amount_received: amount as number,
      currency: intent.currency as string,
      metadata,
      livemode: intent.livemode as boolean,
    },
    expectedLiveMode,
  );

  if (eventType === "payment_intent.payment_failed") {
    // A superseded intent (method switch) failing later is harmless noise.
    if (mismatch === "intent_mismatch") {
      await markEvent(ledgerId, "ignored", "superseded_intent", order.id);
      return { result: "ignored", http_status: 200 };
    }
    if (mismatch !== null) {
      await markEvent(ledgerId, "manual_review", mismatch, order.id);
      return { result: "manual_review", http_status: 200 };
    }
    // Never move a paid (or otherwise settled) order back to failed.
    if (order.payment_status !== "awaiting_payment" || !canTransitionPayment(order.payment_status, "failed")) {
      await markEvent(ledgerId, "processed", "ignored_state", order.id);
      return { result: "ignored", http_status: 200 };
    }
    const lastError = (intent.last_payment_error ?? null) as { decline_code?: string; code?: string } | null;
    const rawCode = lastError?.decline_code || lastError?.code || "card_declined";
    await storeRest("PATCH", "store_orders", {
      query: `id=eq.${order.id}&payment_status=eq.awaiting_payment`,
      prefer: "return=minimal",
      body: { payment_status: "failed", last_payment_error: /^[a-z0-9_]{1,64}$/.test(rawCode) ? rawCode : "card_declined" },
    });
    await markEvent(ledgerId, "processed", "payment_failed", order.id);
    return { result: "payment_failed", http_status: 200 };
  }

  if (intent.status !== "succeeded") {
    await markEvent(ledgerId, "manual_review", "payment_not_complete", order.id);
    return { result: "manual_review", http_status: 200 };
  }
  if (mismatch !== null) {
    await markEvent(ledgerId, "manual_review", mismatch, order.id);
    return { result: "manual_review", http_status: 200 };
  }
  if (["cancelled", "refunded"].includes(order.payment_status)) {
    await markEvent(ledgerId, "manual_review", "order_closed", order.id);
    return { result: "manual_review", http_status: 200 };
  }
  const reused = await storeRest<Array<Pick<OrderRow, "id">>>("GET", "store_orders", {
    query: `select=id&stripe_payment_intent=eq.${intentId}&id=neq.${order.id}&limit=1`,
  });
  if (reused.json.length > 0) {
    await markEvent(ledgerId, "manual_review", "payment_intent_reused", order.id);
    return { result: "manual_review", http_status: 200 };
  }
  if (order.payment_status === "failed") {
    // A retry on the same intent can succeed after an earlier decline marked the order failed.
    // The verified success is authoritative: reopen the order so the normal paid transition applies.
    await storeRest("PATCH", "store_orders", {
      query: `id=eq.${order.id}&payment_status=eq.failed`,
      prefer: "return=minimal",
      body: { payment_status: "awaiting_payment" },
    });
    order.payment_status = "awaiting_payment";
  }
  return fulfillPaidOrder(ledgerId, order, intentId, await chargePaymentMethod(intent));
}
