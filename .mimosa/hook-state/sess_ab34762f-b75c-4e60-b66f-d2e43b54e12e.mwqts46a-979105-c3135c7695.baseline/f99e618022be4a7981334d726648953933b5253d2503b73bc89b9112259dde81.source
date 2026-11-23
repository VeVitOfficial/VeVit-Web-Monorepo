import { randomBytes } from "node:crypto";
import { formatWeightKg, minorToCzk, splitRecipientName } from "@/lib/checkout/packeta-xml";
import { createPacket } from "@/lib/packeta";
import { nextRunDelaySeconds } from "@/lib/jobs/backoff";
import { sha256Hex } from "@/lib/store-order-core";
import { storeRest, StoreRestError } from "@/lib/store-config";
import "server-only";

/**
 * Jobs that follow a verified payment. A paid order never depends on them: a failing job is retried
 * with a growing delay and, once the tries are used up, stays visible as status "failed" with the
 * reason in last_error. Jobs run right after the payment webhook (after()) and from Vercel Cron.
 */

export type JobKind = "packeta_create_packet";

/** Not worth retrying: the job is marked failed at once and an operator has to look at it. */
export class JobPermanentError extends Error {}

interface JobRow {
  id: number;
  kind: string;
  ref: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  updated_at: string;
}

/** A job stuck in "running" this long belongs to a run that died; it is taken over. */
const STALE_RUNNING_MS = 10 * 60 * 1000;
const PACKETA_TRACKING_URL = "https://tracking.packeta.com/cs/?id=";

export async function enqueueJob(kind: JobKind, ref: string, payload: Record<string, unknown> = {}): Promise<void> {
  await storeRest("POST", "payment_jobs", {
    query: "on_conflict=kind,ref",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: { kind, ref, payload },
  });
}

/** Queues the packet for a paid pickup point order; other orders (address delivery, digital) need none. */
export async function enqueueShipmentForOrder(orderId: number): Promise<void> {
  const { json } = await storeRest<Array<{ public_id: string; delivery_method: string | null }>>("GET", "store_orders", {
    query: `select=public_id,delivery_method&id=eq.${orderId}&limit=1`,
  });
  const order = json[0];
  if (order?.delivery_method === "packeta_pickup") await enqueueJob("packeta_create_packet", order.public_id);
}

// ── packeta_create_packet ────────────────────────────────────────────────────

interface PacketOrder {
  id: number;
  public_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_method: string | null;
  packeta_point: { id?: string } | null;
  total_minor: number;
  payment_status: string;
  status: string;
  fulfillment_status: string;
}

interface PacketItem {
  id: number;
  quantity: number;
  store_products: { weight_grams: number | null } | null;
}

async function handlePacketaCreatePacket(job: JobRow): Promise<void> {
  const { json: orders } = await storeRest<PacketOrder[]>("GET", "store_orders", {
    query: `select=id,public_id,order_number,customer_name,customer_email,customer_phone,delivery_method,packeta_point,total_minor,payment_status,status,fulfillment_status&public_id=eq.${encodeURIComponent(job.ref)}&limit=1`,
  });
  const order = orders[0];
  if (!order) throw new JobPermanentError("order_not_found");
  if (order.delivery_method !== "packeta_pickup" || !/^\d{1,10}$/.test(order.packeta_point?.id ?? "")) {
    throw new JobPermanentError("order_has_no_packeta_point");
  }
  if (order.status === "manual_review" || order.fulfillment_status === "manual_review") {
    throw new JobPermanentError("order_in_manual_review");
  }
  // The webhook enqueues before it marks the order paid: wait for the payment instead of shipping unpaid goods.
  if (order.payment_status !== "paid") throw new Error("order_not_paid_yet");

  const { json: items } = await storeRest<PacketItem[]>("GET", "store_order_items", {
    query: `select=id,quantity,store_products(weight_grams)&order_id=eq.${order.id}&product_type=eq.physical&order=id.asc`,
  });
  if (items.length === 0) throw new JobPermanentError("order_has_no_physical_items");

  const { json: existing } = await storeRest<Array<{ id: number }>>("GET", "store_deliveries", {
    query: `select=id&order_id=eq.${order.id}&carrier_code=eq.packeta&limit=1`,
  });
  let deliveryId = existing[0]?.id ?? null;

  if (deliveryId === null) {
    // A packet created by an earlier run that died before saving the delivery is reused, never created twice.
    let packet = job.payload.packet as { id: string; barcode: string } | undefined;
    if (!packet) {
      if (!order.customer_phone) throw new JobPermanentError("order_has_no_phone");
      const grams = items.reduce((sum, item) => sum + (item.store_products?.weight_grams ?? 500) * item.quantity, 0);
      const { name, surname } = splitRecipientName(order.customer_name);
      const result = await createPacket({
        number: order.order_number,
        name,
        surname,
        email: order.customer_email,
        phone: order.customer_phone,
        addressId: order.packeta_point!.id!,
        valueCzk: minorToCzk(order.total_minor),
        weightKg: formatWeightKg(grams),
      });
      if (!result.ok) throw new Error(`packeta: ${result.fault}`);
      packet = { id: result.id, barcode: result.barcode };
      await storeRest("PATCH", "payment_jobs", {
        query: `id=eq.${job.id}`,
        prefer: "return=minimal",
        body: { payload: { ...job.payload, packet } },
      });
    }
    deliveryId = await insertDelivery(order, packet);
  }

  await storeRest("POST", "store_delivery_items", {
    query: "on_conflict=delivery_id,order_item_id",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: items.map((item) => ({ delivery_id: deliveryId, order_id: order.id, order_item_id: item.id, shipped_quantity: item.quantity })),
  });
  // Existing fulfillment states only: ready -> processing (packet registered, not handed over yet).
  await storeRest("PATCH", "store_orders", {
    query: `id=eq.${order.id}&status=eq.paid&fulfillment_status=eq.ready`,
    prefer: "return=minimal",
    body: { status: "processing", fulfillment_status: "processing" },
  });
}

async function insertDelivery(order: PacketOrder, packet: { id: string; barcode: string }): Promise<number> {
  const body = {
    public_id: randomBytes(16).toString("hex"),
    order_id: order.id,
    carrier_code: "packeta",
    carrier_name: "Zásilkovna",
    shipping_method: "packeta_pickup",
    tracking_number: packet.barcode,
    tracking_url: `${PACKETA_TRACKING_URL}${encodeURIComponent(packet.id)}`,
    status: "prepared",
    audit_metadata: { source: "payment_job", packeta_packet_id: packet.id },
    // The unique (scope, key) pair makes a second insert for the same order impossible.
    idempotency_scope_hash: sha256Hex("system:packeta_create_packet"),
    idempotency_key_hash: sha256Hex(order.public_id),
    request_hash: sha256Hex(JSON.stringify({ order: order.public_id, packet: packet.id })),
  };
  try {
    const { json } = await storeRest<Array<{ id: number }>>("POST", "store_deliveries", { prefer: "return=representation", body });
    return json[0]!.id;
  } catch (error) {
    if (!(error instanceof StoreRestError) || error.status !== 409) throw error;
    const { json } = await storeRest<Array<{ id: number }>>("GET", "store_deliveries", {
      query: `select=id&order_id=eq.${order.id}&carrier_code=eq.packeta&limit=1`,
    });
    if (!json[0]) throw error;
    return json[0].id;
  }
}

// ── runner ───────────────────────────────────────────────────────────────────

const HANDLERS: Record<JobKind, (job: JobRow) => Promise<void>> = {
  packeta_create_packet: handlePacketaCreatePacket,
};

/** Stored errors are for operators: short, and never carrying the Packeta API password. */
function describeError(error: unknown): string {
  let message = error instanceof Error ? error.message : "unknown_error";
  const password = process.env.PACKETA_API_PASSWORD?.trim();
  if (password) message = message.split(password).join("[redacted]");
  return message.slice(0, 500);
}

/**
 * Claims up to `limit` due jobs (compare-and-set on status and updated_at, so two runners never
 * take the same one), runs them and records the outcome. `failed` counts jobs whose run threw,
 * whether they were rescheduled or are now out of tries.
 */
export async function runDueJobs(limit: number): Promise<{ done: number; failed: number }> {
  const now = new Date();
  const nowIso = now.toISOString();
  const staleIso = new Date(now.getTime() - STALE_RUNNING_MS).toISOString();
  const { json: due } = await storeRest<JobRow[]>("GET", "payment_jobs", {
    query: `select=id,kind,ref,payload,status,attempts,updated_at&or=(and(status.eq.pending,next_run_at.lte.${nowIso}),and(status.eq.running,updated_at.lt.${staleIso}))&order=next_run_at.asc&limit=${limit}`,
  });

  let done = 0;
  let failed = 0;
  for (const row of due) {
    const attempts = row.attempts + 1;
    const { json: claimed } = await storeRest<JobRow[]>("PATCH", "payment_jobs", {
      query: `id=eq.${row.id}&status=eq.${row.status}&updated_at=eq.${encodeURIComponent(row.updated_at)}`,
      prefer: "return=representation",
      body: { status: "running", attempts, updated_at: nowIso },
    });
    if (claimed.length === 0) continue;
    const job = claimed[0]!;
    try {
      const handler = HANDLERS[job.kind as JobKind];
      if (!handler) throw new JobPermanentError(`unknown_job_kind:${job.kind}`);
      await handler(job);
      await storeRest("PATCH", "payment_jobs", {
        query: `id=eq.${job.id}`,
        prefer: "return=minimal",
        body: { status: "done", last_error: null, updated_at: new Date().toISOString() },
      });
      done += 1;
    } catch (error) {
      failed += 1;
      const delay = error instanceof JobPermanentError ? null : nextRunDelaySeconds(attempts - 1);
      const finished = new Date();
      await storeRest("PATCH", "payment_jobs", {
        query: `id=eq.${job.id}`,
        prefer: "return=minimal",
        body: delay === null
          ? { status: "failed", last_error: describeError(error), updated_at: finished.toISOString() }
          : { status: "pending", last_error: describeError(error), next_run_at: new Date(finished.getTime() + delay * 1000).toISOString(), updated_at: finished.toISOString() },
      });
      console.error("[store:jobs] job failed", job.kind, delay === null ? "final" : `retry in ${delay}s`);
    }
  }
  return { done, failed };
}
