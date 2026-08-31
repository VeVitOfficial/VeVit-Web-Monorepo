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
 * Port of store/lib/claims ClaimService + ClaimRepository over PostgREST.
 *
 * PHP runs every mutation in one transaction with SELECT … FOR UPDATE; PostgREST
 * has neither, so idempotent replays rely on the UNIQUE
 * (idempotency_scope_hash, idempotency_key_hash) constraint on store_claims and
 * the partial unique (claim_id, action, idempotency_key_hash) on
 * store_claim_events: check-then-insert, and a 409 from a concurrent winner
 * falls back to the replay lookup. The request_hash uses plain
 * JSON.stringify (self-consistent within this port — no legacy PHP rows
 * existed because the PHP agenda family was dead behind the anonymous
 * AuthContextFactory).
 */

const ORDER_PUBLIC_ID_PATTERN = /^[a-f0-9]{32}$/;
const CLAIM_CREATE_STATUSES = ["paid", "processing", "shipped", "delivered"];
const CLAIM_MESSAGE_CLOSED_STATUSES = new Set(["rejected", "resolved", "cancelled"]);
const CLAIM_RESOLUTIONS = ["repair", "replacement", "refund", "store_credit", "other"];

interface ClaimReplayRow {
  id: number;
  public_id: string;
  status: string;
  request_hash: string;
}

interface ClaimInsertResult {
  id: number;
  public_id: string;
  version: number;
  status: string;
}

async function findCreateReplay(scopeHash: string, keyHash: string): Promise<ClaimReplayRow | null> {
  // PHP findCreateReplay selected only id/public_id/request_hash, so the
  // replay route answered {"status": null}; the port selects status too.
  const rows = await storeRestSelect<ClaimReplayRow>(
    "store_claims",
    `select=id,public_id,status,request_hash&idempotency_scope_hash=eq.${scopeHash}&idempotency_key_hash=eq.${keyHash}&limit=1`,
  );
  return rows[0] ?? null;
}

/** ClaimService::orderForCreate. */
export async function claimOrderForCreate(orderPublicId: string, identity: AgendaIdentity): Promise<AccessOrder> {
  if (!ORDER_PUBLIC_ID_PATTERN.test(orderPublicId)) throw new AgendaDomainError("Order is unavailable.");
  const order = await orderRowByPublicId(orderPublicId);
  const user = identityUser(identity);
  if (
    order === null ||
    !orderCanAccess(order, user, identity.grant, orderPublicId) ||
    !CLAIM_CREATE_STATUSES.includes(String(order.status ?? ""))
  ) {
    throw new AgendaDomainError("Order is unavailable.");
  }
  return order;
}

/** ClaimService::create. */
export async function claimCreate(
  orderPublicId: string,
  identity: AgendaIdentity,
  idempotencyKey: string,
  input: Record<string, unknown>,
): Promise<{ id: number; publicId: string; status: string }> {
  const order = await claimOrderForCreate(orderPublicId, identity);
  if (idempotencyKey === "" || Buffer.byteLength(idempotencyKey, "utf8") > 255) throw new AgendaDomainError("Invalid request.");
  const rawItems = input.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new AgendaDomainError("Claim items are required.");
  const requested = new Map<number, number>();
  for (const entry of rawItems) {
    const item = (entry ?? {}) as Record<string, unknown>;
    const itemId = phpIntCast(item.order_item_id ?? 0);
    const quantity = phpIntCast(item.quantity ?? 0);
    if (itemId < 1 || quantity < 1 || requested.has(itemId)) throw new AgendaDomainError("Invalid claim item.");
    requested.set(itemId, quantity);
  }
  const ordered = [...requested.entries()].sort((a, b) => a[0] - b[0]);
  const itemsObject: Record<string, number> = {};
  for (const [itemId, quantity] of ordered) itemsObject[String(itemId)] = quantity;
  const reasonCode = String(input.reason_code ?? "");
  const problemDescription = String(input.problem_description ?? "");
  const requestedResolution = String(input.requested_resolution ?? "");
  if (reasonCode === "" || problemDescription === "" || !CLAIM_RESOLUTIONS.includes(requestedResolution)) {
    throw new AgendaDomainError("Invalid claim data.");
  }
  // sha256(actorType \0 orderId \0 (userId ?? guestGrant))
  const scopeHash = sha256Hex(
    `${identity.actor.kind}\0${order.id}\0${identity.actor.kind === "customer_account" ? identity.actor.userId : identity.grant ?? ""}`,
  );
  const keyHash = sha256Hex(idempotencyKey);
  const requestHash = sha256Hex(
    JSON.stringify({
      reason_code: reasonCode,
      problem_description: problemDescription,
      requested_resolution: requestedResolution,
      items: itemsObject,
    }),
  );
  const replay = await findCreateReplay(scopeHash, keyHash);
  if (replay !== null) {
    if (!timingSafeStringEqual(replay.request_hash, requestHash)) throw new AgendaDomainError("Idempotency conflict.");
    return { id: replay.id, publicId: replay.public_id, status: replay.status };
  }
  const locked = await lockOrderItems(order.id, ordered.map(([itemId]) => itemId));
  await assertReservable(locked, requested);

  const publicId = randomHex(16);
  const correlationId = randomHex(16);
  const auditInfo: AuditActorRow = auditActor(identity.actor, identity.authSource);
  let claimRow: ClaimInsertResult;
  try {
    const inserted = await storeRest<ClaimInsertResult[]>("POST", "store_claims", {
      body: {
        public_id: publicId,
        order_id: order.id,
        owner_type: identity.actor.kind === "customer_account" ? "account" : "guest",
        owner_user_id: identity.actor.kind === "customer_account" ? identity.actor.userId : null,
        reason_code: reasonCode,
        problem_description: problemDescription,
        requested_resolution: requestedResolution,
        customer_note: null,
        idempotency_scope_hash: scopeHash,
        idempotency_key_hash: keyHash,
        request_hash: requestHash,
      },
      prefer: "return=representation",
    });
    claimRow = inserted.json[0] as ClaimInsertResult;
  } catch (error) {
    // Concurrent create hit the same idempotency key — fall back to the replay.
    if (error instanceof StoreRestError && error.status === 409) {
      const raced = await findCreateReplay(scopeHash, keyHash);
      if (raced !== null && timingSafeStringEqual(raced.request_hash, requestHash)) {
        return { id: raced.id, publicId: raced.public_id, status: raced.status };
      }
    }
    throw error;
  }
  if (claimRow === undefined) throw new Error("Claim insert returned no row.");
  for (const [itemId, quantity] of ordered) {
    await storeRest("POST", "store_claim_items", {
      body: {
        claim_id: claimRow.id,
        order_id: order.id,
        order_item_id: itemId,
        requested_quantity: quantity,
        reason_code: reasonCode,
        requested_resolution: requestedResolution,
      },
      prefer: "return=minimal",
    });
  }
  await storeRest("POST", "store_claim_events", {
    body: {
      public_id: randomHex(16),
      claim_id: claimRow.id,
      action: "created",
      new_state: "submitted",
      actor_type: auditInfo.type,
      actor_user_id: auditInfo.userId,
      actor_session_id: auditInfo.sessionId,
      auth_source: auditInfo.authSource,
      public_message: "Reklamace byla přijata.",
      correlation_id: correlationId,
      idempotency_key_hash: keyHash,
    },
    prefer: "return=minimal",
  });
  await auditRecord({
    publicId: randomHex(16),
    entityType: "claim",
    entityId: claimRow.id,
    action: "create",
    outcome: "success",
    actor: auditInfo,
    correlationId,
    oldState: null,
    newState: "submitted",
    metadata: {},
    idempotencyKeyHash: keyHash,
  });
  return { id: claimRow.id, publicId: claimRow.public_id, status: claimRow.status };
}

/** ClaimService::guestOrderPublicId. */
export async function claimGuestOrderPublicId(claimPublicId: string): Promise<string> {
  const claims = await storeRestSelect<{ order_id: number }>(
    "store_claims",
    `select=order_id&public_id=eq.${encodeURIComponent(claimPublicId)}&limit=1`,
  );
  if (claims.length === 0) throw new AgendaDomainError("Claim unavailable.");
  const order = await orderRowById(claims[0].order_id);
  if (order === null) throw new AgendaDomainError("Claim unavailable.");
  return order.public_id;
}

interface ClaimDetailQuery {
  id: number;
  public_id: string;
  order_id: number;
  reason_code: string;
  problem_description: string;
  requested_resolution: string;
  status: string;
  customer_note: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  store_claim_events: {
    public_id: string;
    action: string;
    old_state: string | null;
    new_state: string | null;
    public_message: string | null;
    created_at: string;
  }[];
}

/**
 * ClaimService::detail — access check + customerDetailSql rows. The embedded
 * events order mirrors `ORDER BY e.created_at, e.id`.
 */
async function claimDetailContext(
  claimPublicId: string,
  identity: AgendaIdentity,
): Promise<{ rows: Record<string, unknown>[]; claimId: number; orderId: number }> {
  const claims = await storeRestSelect<ClaimDetailQuery>(
    "store_claims",
    "select=id,public_id,order_id,reason_code,problem_description,requested_resolution,status,customer_note,version,created_at,updated_at,closed_at,store_claim_events(public_id,action,old_state,new_state,public_message,created_at)" +
      `&public_id=eq.${encodeURIComponent(claimPublicId)}&store_claim_events.order=created_at,id`,
  );
  const claimRow = claims[0];
  if (claimRow === undefined) throw new AgendaDomainError("Claim unavailable.");
  const order = await orderRowById(claimRow.order_id);
  const user = identityUser(identity);
  if (order === null || !orderCanAccess(order, user, identity.grant, order.public_id)) {
    throw new AgendaDomainError("Claim unavailable.");
  }
  const { id: claimId, order_id: orderId, store_claim_events, ...base } = claimRow;
  const events = store_claim_events ?? [];
  const rows: Record<string, unknown>[] = events.length === 0
    ? [
        // PHP LEFT JOIN: a claim without events still yields one row with NULLs.
        {
          ...base,
          event_public_id: null,
          action: null,
          old_state: null,
          new_state: null,
          public_message: null,
          event_created_at: null,
        },
      ]
    : events.map((event) => ({
        ...base,
        event_public_id: event.public_id,
        action: event.action,
        old_state: event.old_state,
        new_state: event.new_state,
        public_message: event.public_message,
        event_created_at: event.created_at,
      }));
  return { rows, claimId, orderId };
}

/** ClaimRepository::customerItemsSql — INNER JOIN drops orphaned items. */
async function claimItems(orderId: number, claimId: number): Promise<Record<string, unknown>[]> {
  const items = await storeRestSelect<{
    order_item_id: number;
    requested_quantity: number;
    approved_quantity: number | null;
    consumed_quantity: number;
    reason_code: string | null;
    requested_resolution: string | null;
    resolution_outcome: string | null;
  }>(
    "store_claim_items",
    `select=order_item_id,requested_quantity,approved_quantity,consumed_quantity,reason_code,requested_resolution,resolution_outcome&claim_id=eq.${claimId}&order=order_item_id.asc`,
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

/** ClaimService::detailPayload. */
export async function claimDetailPayload(
  claimPublicId: string,
  identity: AgendaIdentity,
): Promise<{ summary: Record<string, unknown>; events: Record<string, unknown>[]; items: Record<string, unknown>[] }> {
  const { rows, claimId, orderId } = await claimDetailContext(claimPublicId, identity);
  if (rows.length === 0) throw new AgendaDomainError("Claim unavailable.");
  const first = { ...rows[0] };
  if ("id" in first) delete first.id; // internal id is not part of the customer payload
  for (const field of ["event_public_id", "action", "old_state", "new_state", "public_message", "event_created_at"]) {
    delete first[field];
  }
  return { summary: first, events: rows, items: await claimItems(orderId, claimId) };
}

/** ClaimService::accountList → ClaimRepository::customerListByOwner. */
export async function claimAccountList(userId: string): Promise<Record<string, unknown>[]> {
  return storeRestSelect<Record<string, unknown>>(
    "store_claims",
    `select=public_id,reason_code,requested_resolution,status,version,created_at,updated_at,closed_at&owner_type=eq.account&owner_user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc,id.desc`,
  );
}

/** ClaimService::addCustomerMessage. */
export async function claimAddCustomerMessage(
  claimPublicId: string,
  identity: AgendaIdentity,
  rawMessage: string,
  idempotencyKey: string,
): Promise<{ public_id: string }> {
  const message = phpTrim(rawMessage);
  if (message === "" || phpMbLength(message) > 2000 || idempotencyKey === "") throw new AgendaDomainError("Invalid message.");
  const claims = await storeRestSelect<{ id: number; order_id: number; status: string }>(
    "store_claims",
    `select=id,order_id,status&public_id=eq.${encodeURIComponent(claimPublicId)}&limit=1`,
  );
  if (claims.length === 0) throw new AgendaDomainError("Claim unavailable.");
  const claim = claims[0];
  const order = await orderRowById(claim.order_id);
  const user = identityUser(identity);
  if (order === null || !orderCanAccess(order, user, identity.grant, order.public_id)) {
    throw new AgendaDomainError("Claim unavailable.");
  }
  if (CLAIM_MESSAGE_CLOSED_STATUSES.has(claim.status)) throw new AgendaDomainError("Claim is closed.");
  const keyHash = sha256Hex(idempotencyKey);
  const requestHash = sha256Hex(message);
  const replay = await storeRestSelect<{ public_id: string; request_hash: string }>(
    "store_claim_events",
    `select=public_id,request_hash&claim_id=eq.${claim.id}&action=eq.customer_message&idempotency_key_hash=eq.${keyHash}&limit=1`,
  );
  if (replay.length > 0) {
    if (!timingSafeStringEqual(replay[0].request_hash, requestHash)) throw new AgendaDomainError("Idempotency conflict.");
    return replay[0];
  }

  const auditInfo: AuditActorRow = auditActor(identity.actor, identity.authSource);
  const correlationId = randomHex(16);
  const eventPublicId = randomHex(16);
  try {
    await storeRest("POST", "store_claim_events", {
      body: {
        public_id: eventPublicId,
        claim_id: claim.id,
        action: "customer_message",
        old_state: claim.status,
        new_state: claim.status,
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
        "store_claim_events",
        `select=public_id,request_hash&claim_id=eq.${claim.id}&action=eq.customer_message&idempotency_key_hash=eq.${keyHash}&limit=1`,
      );
      if (raced.length > 0 && timingSafeStringEqual(raced[0].request_hash, requestHash)) return raced[0];
    }
    throw error;
  }
  await auditRecord({
    publicId: randomHex(16),
    entityType: "claim",
    entityId: claim.id,
    action: "customer_message",
    outcome: "success",
    actor: auditInfo,
    correlationId,
    oldState: claim.status,
    newState: claim.status,
    metadata: {},
    idempotencyKeyHash: keyHash,
  });
  return { public_id: eventPublicId };
}