import "server-only";

import { phpIntCast, phpMbLength, phpTrim, randomHex, sha256Hex } from "@/lib/store-order-core";
import { StoreRestError, storeRest, storeRestSelect } from "@/lib/store-config";
import {
  AccessOrder,
  AgendaDomainError,
  identityUser,
  orderCanAccess,
  orderRowById,
  orderRowByPublicId,
  timingSafeStringEqual,
  type AgendaIdentity,
} from "@/lib/store-order-access";
import { auditActor, auditRecord, type AuditActorRow } from "@/lib/store-audit";
import { assertReservable, lockOrderItems } from "@/lib/store-availability";

/**
 * Port of store/lib/returns ReturnService + ReturnRepository over PostgREST —
 * same no-transaction strategy as the claims port: check-then-insert guarded
 * by the UNIQUE (idempotency_scope_hash, idempotency_key_hash) constraint, a
 * 409 from a concurrent winner falls back to the replay lookup.
 */

const ORDER_PUBLIC_ID_PATTERN = /^[a-f0-9]{32}$/;
const RETURN_MESSAGE_CLOSED_STATUSES = new Set(["rejected", "completed", "cancelled"]);

interface ReturnReplayRow {
  id: number;
  public_id: string;
  status: string;
  request_hash: string;
}

interface ReturnInsertResult {
  id: number;
  public_id: string;
  status: string;
  version: number;
}

/** config 'return_request_days': max(1, min(365, (int) env, default 14)). */
function returnRequestDays(): number {
  return Math.min(365, Math.max(1, phpIntCast(process.env.RETURN_REQUEST_DAYS ?? "14")));
}

/**
 * ReturnRepository::returnWindowStart — COALESCE(MAX(d.delivered_at), o.updated_at,
 * o.created_at), as an epoch timestamp (null when the order row vanished).
 */
async function returnWindowStartMs(orderId: number): Promise<number | null> {
  const rows = await storeRestSelect<{
    created_at: string;
    updated_at: string;
    store_deliveries: { delivered_at: string | null; status: string | null }[] | null;
  }>(
    "store_orders",
    `select=created_at,updated_at,store_deliveries(delivered_at,status)&id=eq.${orderId}&limit=1`,
  );
  const order = rows[0];
  if (order === undefined) return null;
  const deliveries = Array.isArray(order.store_deliveries) ? order.store_deliveries : order.store_deliveries != null ? [order.store_deliveries] : [];
  const delivered = deliveries
    .filter((delivery) => delivery.status === "delivered" && delivery.delivered_at !== null)
    .map((delivery) => Date.parse(delivery.delivered_at ?? ""))
    .filter((timestamp) => Number.isFinite(timestamp));
  if (delivered.length > 0) return Math.max(...delivered);
  const updated = Date.parse(order.updated_at);
  if (Number.isFinite(updated)) return updated;
  const created = Date.parse(order.created_at);
  return Number.isFinite(created) ? created : null;
}

/** ReturnService::orderForCreate — delivered-only orders inside the window. */
export async function returnOrderForCreate(orderPublicId: string, identity: AgendaIdentity): Promise<AccessOrder> {
  if (!ORDER_PUBLIC_ID_PATTERN.test(orderPublicId)) throw new AgendaDomainError("Order is unavailable.");
  const order = await orderRowByPublicId(orderPublicId);
  const user = identityUser(identity);
  if (order === null || !orderCanAccess(order, user, identity.grant, orderPublicId) || order.status !== "delivered") {
    throw new AgendaDomainError("Order is unavailable.");
  }
  const windowStart = await returnWindowStartMs(order.id);
  const days = returnRequestDays();
  if (windowStart === null || windowStart < Date.now() - days * 86_400_000) {
    throw new AgendaDomainError("Return request window is closed.");
  }
  return order;
}

async function findCreateReplay(scopeHash: string, keyHash: string): Promise<ReturnReplayRow | null> {
  const rows = await storeRestSelect<ReturnReplayRow>(
    "store_returns",
    `select=id,public_id,status,request_hash&idempotency_scope_hash=eq.${scopeHash}&idempotency_key_hash=eq.${keyHash}&limit=1`,
  );
  return rows[0] ?? null;
}

/** ReturnService::create. */
export async function returnCreate(
  orderPublicId: string,
  identity: AgendaIdentity,
  idempotencyKey: string,
  input: Record<string, unknown>,
): Promise<{ id: number; publicId: string; status: string }> {
  const order = await returnOrderForCreate(orderPublicId, identity);
  if (idempotencyKey === "" || Buffer.byteLength(idempotencyKey, "utf8") > 255) throw new AgendaDomainError("Invalid request.");
  const requested = new Map<number, number>();
  for (const entry of Array.isArray(input.items) ? input.items : []) {
    const item = (entry ?? {}) as Record<string, unknown>;
    const itemId = phpIntCast(item.order_item_id ?? 0);
    const quantity = phpIntCast(item.quantity ?? 0);
    if (itemId < 1 || quantity < 1 || requested.has(itemId)) throw new AgendaDomainError("Invalid return item.");
    requested.set(itemId, quantity);
  }
  if (requested.size === 0 || String(input.reason_code ?? "") === "") throw new AgendaDomainError("Invalid return.");
  const reasonCode = String(input.reason_code);
  const ordered = [...requested.entries()].sort((a, b) => a[0] - b[0]);
  const itemsObject: Record<string, number> = {};
  for (const [itemId, quantity] of ordered) itemsObject[String(itemId)] = quantity;
  const scopeHash = sha256Hex(
    `${identity.actor.kind}\0${order.id}\0${identity.actor.kind === "customer_account" ? identity.actor.userId : identity.grant ?? ""}`,
  );
  const keyHash = sha256Hex(idempotencyKey);
  const requestHash = sha256Hex(JSON.stringify({ reason_code: reasonCode, items: itemsObject }));
  const replay = await findCreateReplay(scopeHash, keyHash);
  if (replay !== null) {
    if (!timingSafeStringEqual(replay.request_hash, requestHash)) throw new AgendaDomainError("Idempotency conflict.");
    return { id: replay.id, publicId: replay.public_id, status: replay.status };
  }
  const locked = await lockOrderItems(order.id, ordered.map(([itemId]) => itemId));
  for (const item of locked.values()) {
    if (item.product_type !== "physical") throw new AgendaDomainError("Digital item cannot be returned.");
  }
  await assertReservable(locked, requested);

  const publicId = randomHex(16);
  const correlationId = randomHex(16);
  const auditInfo: AuditActorRow = auditActor(identity.actor, identity.authSource);
  let returnRow: ReturnInsertResult;
  try {
    const inserted = await storeRest<ReturnInsertResult[]>("POST", "store_returns", {
      body: {
        public_id: publicId,
        order_id: order.id,
        owner_type: identity.actor.kind === "customer_account" ? "account" : "guest",
        owner_user_id: identity.actor.kind === "customer_account" ? identity.actor.userId : null,
        reason_code: reasonCode,
        idempotency_scope_hash: scopeHash,
        idempotency_key_hash: keyHash,
        request_hash: requestHash,
      },
      prefer: "return=representation",
    });
    returnRow = inserted.json[0] as ReturnInsertResult;
  } catch (error) {
    if (error instanceof StoreRestError && error.status === 409) {
      const raced = await findCreateReplay(scopeHash, keyHash);
      if (raced !== null && timingSafeStringEqual(raced.request_hash, requestHash)) {
        return { id: raced.id, publicId: raced.public_id, status: raced.status };
      }
    }
    throw error;
  }
  if (returnRow === undefined) throw new Error("Return insert returned no row.");
  for (const [itemId, quantity] of ordered) {
    await storeRest("POST", "store_return_items", {
      body: { return_id: returnRow.id, order_id: order.id, order_item_id: itemId, requested_quantity: quantity },
      prefer: "return=minimal",
    });
  }
  await storeRest("POST", "store_return_events", {
    body: {
      public_id: randomHex(16),
      return_id: returnRow.id,
      action: "created",
      new_state: "requested",
      actor_type: auditInfo.type,
      actor_user_id: auditInfo.userId,
      actor_session_id: auditInfo.sessionId,
      auth_source: auditInfo.authSource,
      public_message: "Žádost o vrácení byla přijata.",
      correlation_id: correlationId,
      idempotency_key_hash: keyHash,
    },
    prefer: "return=minimal",
  });
  await auditRecord({
    publicId: randomHex(16),
    entityType: "return",
    entityId: returnRow.id,
    action: "create",
    outcome: "success",
    actor: auditInfo,
    correlationId,
    oldState: null,
    newState: "requested",
    metadata: {},
    idempotencyKeyHash: keyHash,
  });
  return { id: returnRow.id, publicId: returnRow.public_id, status: returnRow.status };
}

/** ReturnService::guestOrderPublicId. */
export async function returnGuestOrderPublicId(returnPublicId: string): Promise<string> {
  const returns = await storeRestSelect<{ order_id: number }>(
    "store_returns",
    `select=order_id&public_id=eq.${encodeURIComponent(returnPublicId)}&limit=1`,
  );
  if (returns.length === 0) throw new AgendaDomainError("Return unavailable.");
  const order = await orderRowById(returns[0].order_id);
  if (order === null) throw new AgendaDomainError("Return unavailable.");
  return order.public_id;
}

interface ReturnDetailQuery {
  id: number;
  public_id: string;
  order_id: number;
  reason_code: string;
  status: string;
  decision: string | null;
  refund_status: string | null;
  customer_note: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  store_return_events: {
    action: string;
    old_state: string | null;
    new_state: string | null;
    public_message: string | null;
    created_at: string;
  }[];
}

/** ClaimService detail equivalent — ReturnService::detail + access check. */
async function returnDetailContext(
  returnPublicId: string,
  identity: AgendaIdentity,
): Promise<{ rows: Record<string, unknown>[]; returnId: number; orderId: number }> {
  const returns = await storeRestSelect<ReturnDetailQuery>(
    "store_returns",
    "select=id,public_id,order_id,reason_code,status,decision,refund_status,customer_note,version,created_at,updated_at,store_return_events(action,old_state,new_state,public_message,created_at)" +
      `&public_id=eq.${encodeURIComponent(returnPublicId)}&store_return_events.order=created_at,id`,
  );
  const returnRow = returns[0];
  if (returnRow === undefined) throw new AgendaDomainError("Return unavailable.");
  const order = await orderRowById(returnRow.order_id);
  const user = identityUser(identity);
  if (order === null || !orderCanAccess(order, user, identity.grant, order.public_id)) {
    throw new AgendaDomainError("Return unavailable.");
  }
  const { id: returnId, order_id: orderId, store_return_events, ...base } = returnRow;
  const events = store_return_events ?? [];
  const rows: Record<string, unknown>[] = events.length === 0
    ? [
        // PHP LEFT JOIN: a return without events still yields one row with NULLs.
        {
          ...base,
          action: null,
          old_state: null,
          new_state: null,
          public_message: null,
          event_created_at: null,
        },
      ]
    : events.map((event) => ({
        ...base,
        action: event.action,
        old_state: event.old_state,
        new_state: event.new_state,
        public_message: event.public_message,
        event_created_at: event.created_at,
      }));
  return { rows, returnId, orderId };
}

/** ReturnRepository::customerItemsSql — INNER JOIN drops orphaned items. */
async function returnItems(orderId: number, returnId: number): Promise<Record<string, unknown>[]> {
  const items = await storeRestSelect<{
    order_item_id: number;
    requested_quantity: number;
    received_quantity: number;
    inspected_quantity: number;
    consumed_quantity: number;
  }>(
    "store_return_items",
    `select=order_item_id,requested_quantity,received_quantity,inspected_quantity,consumed_quantity&return_id=eq.${returnId}&order=order_item_id.asc`,
  );
  if (items.length === 0) return [];
  const orderItems = await storeRestSelect<{ id: number; product_name: string | null }>(
    "store_order_items",
    `select=id,product_name&order_id=eq.${orderId}&id=in.(${items.map((item) => item.order_item_id).join(",")})`,
  );
  const productNames = new Map(orderItems.map((row) => [row.id, row.product_name]));
  return items
    .filter((item) => productNames.has(item.order_item_id))
    .map((item) => ({ ...item, product_name: productNames.get(item.order_item_id) }));
}

/** ReturnService::detailPayload. */
export async function returnDetailPayload(
  returnPublicId: string,
  identity: AgendaIdentity,
): Promise<{ summary: Record<string, unknown>; events: Record<string, unknown>[]; items: Record<string, unknown>[] }> {
  const { rows, returnId, orderId } = await returnDetailContext(returnPublicId, identity);
  if (rows.length === 0) throw new AgendaDomainError("Return unavailable.");
  const first = { ...rows[0] };
  if ("id" in first) delete first.id; // internal id is not part of the customer payload
  for (const field of ["action", "old_state", "new_state", "public_message", "event_created_at"]) {
    delete first[field];
  }
  return { summary: first, events: rows, items: await returnItems(orderId, returnId) };
}

/** ReturnService::accountList → ReturnRepository::customerListByOwner. */
export async function returnAccountList(userId: string): Promise<Record<string, unknown>[]> {
  return storeRestSelect<Record<string, unknown>>(
    "store_returns",
    `select=public_id,reason_code,status,decision,refund_status,version,created_at,updated_at,closed_at&owner_type=eq.account&owner_user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc,id.desc`,
  );
}

/** ReturnService::addCustomerMessage. */
export async function returnAddCustomerMessage(
  returnPublicId: string,
  identity: AgendaIdentity,
  rawMessage: string,
  idempotencyKey: string,
): Promise<{ public_id: string }> {
  const message = phpTrim(rawMessage);
  if (message === "" || phpMbLength(message) > 2000 || idempotencyKey === "") throw new AgendaDomainError("Invalid message.");
  const returns = await storeRestSelect<{ id: number; order_id: number; status: string }>(
    "store_returns",
    `select=id,order_id,status&public_id=eq.${encodeURIComponent(returnPublicId)}&limit=1`,
  );
  if (returns.length === 0) throw new AgendaDomainError("Return unavailable.");
  const returnRow = returns[0];
  const order = await orderRowById(returnRow.order_id);
  const user = identityUser(identity);
  if (order === null || !orderCanAccess(order, user, identity.grant, order.public_id)) {
    throw new AgendaDomainError("Return unavailable.");
  }
  if (RETURN_MESSAGE_CLOSED_STATUSES.has(returnRow.status)) throw new AgendaDomainError("Return is closed.");
  const keyHash = sha256Hex(idempotencyKey);
  const requestHash = sha256Hex(message);
  const replay = await storeRestSelect<{ public_id: string; request_hash: string }>(
    "store_return_events",
    `select=public_id,request_hash&return_id=eq.${returnRow.id}&action=eq.customer_message&idempotency_key_hash=eq.${keyHash}&limit=1`,
  );
  if (replay.length > 0) {
    if (!timingSafeStringEqual(replay[0].request_hash, requestHash)) throw new AgendaDomainError("Idempotency conflict.");
    return replay[0];
  }

  const auditInfo: AuditActorRow = auditActor(identity.actor, identity.authSource);
  const correlationId = randomHex(16);
  const eventPublicId = randomHex(16);
  try {
    await storeRest("POST", "store_return_events", {
      body: {
        public_id: eventPublicId,
        return_id: returnRow.id,
        action: "customer_message",
        old_state: returnRow.status,
        new_state: returnRow.status,
        actor_type: auditInfo.type,
        actor_user_id: auditInfo.userId,
        actor_session_id: auditInfo.sessionId,
        auth_source: auditInfo.authSource,
        public_message: message,
        correlation_id: correlationId,
        idempotency_key_hash: keyHash,
        request_hash: requestHash,
      },
      prefer: "return=minimal",
    });
  } catch (error) {
    if (error instanceof StoreRestError && error.status === 409) {
      const raced = await storeRestSelect<{ public_id: string; request_hash: string }>(
        "store_return_events",
        `select=public_id,request_hash&return_id=eq.${returnRow.id}&action=eq.customer_message&idempotency_key_hash=eq.${keyHash}&limit=1`,
      );
      if (raced.length > 0 && timingSafeStringEqual(raced[0].request_hash, requestHash)) return raced[0];
    }
    throw error;
  }
  await auditRecord({
    publicId: randomHex(16),
    entityType: "return",
    entityId: returnRow.id,
    action: "customer_message",
    outcome: "success",
    actor: auditInfo,
    correlationId,
    oldState: returnRow.status,
    newState: returnRow.status,
    metadata: {},
    idempotencyKeyHash: keyHash,
  });
  return { public_id: eventPublicId };
}