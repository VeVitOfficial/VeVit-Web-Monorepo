import "server-only";

import { storeRest } from "@/lib/store-config";
import type { AgendaActor } from "@/lib/store-order-access";

/** Port of store/lib/audit/AuditActor.php + AuditService.php. */

export interface AuditActorRow {
  type: string;
  userId: string | null;
  sessionId: string | null;
  authSource: string;
}

/** AuditActor::fromContext — customer actors carry no session id. */
export function auditActor(actor: AgendaActor, authSource: string): AuditActorRow {
  if (actor.kind === "customer_account") {
    return { type: "customer_account", userId: actor.userId, sessionId: null, authSource };
  }
  return { type: "customer_guest", userId: null, sessionId: null, authSource };
}

const RESTRICTED_KEY = /(?:password|cookie|token|grant|authorization|file_content)/i;

function sanitizeValue(value: unknown): unknown {
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    // Control characters become spaces, values capped at 2048 bytes in PHP.
    return value.replace(/[\x00-\x1F\x7F]/g, " ").slice(0, 2048);
  }
  if (Array.isArray(value)) {
    // PHP treats JSON arrays and objects alike (array), keys stay positional.
    return auditSanitize(Object.fromEntries(value.map((entry, index) => [String(index), entry])));
  }
  if (typeof value === "object") return auditSanitize(value);
  return null;
}

/** AuditService::sanitize — drop secret-ish keys, strip control bytes. */
export function auditSanitize(data: unknown): Record<string, unknown> {
  const source = data !== null && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
  const result: Record<string, unknown> = {};
  for (const [rawKey, value] of Object.entries(source)) {
    if (RESTRICTED_KEY.test(rawKey)) continue;
    const safeKey = rawKey.replace(/[\x00-\x1F\x7F]/g, "").slice(0, 128);
    if (safeKey === "") continue;
    result[safeKey] = sanitizeValue(value);
  }
  return result;
}

/** AuditService::record → store_audit_events insert. */
export async function auditRecord(args: {
  publicId: string;
  entityType: string;
  entityId: number;
  action: string;
  outcome: string;
  actor: AuditActorRow;
  correlationId: string;
  oldState?: string | null;
  newState?: string | null;
  metadata?: unknown;
  idempotencyKeyHash?: string | null;
}): Promise<void> {
  await storeRest("POST", "store_audit_events", {
    body: {
      public_id: args.publicId,
      entity_type: args.entityType,
      entity_id: args.entityId,
      action: args.action,
      outcome: args.outcome,
      old_state: args.oldState ?? null,
      new_state: args.newState ?? null,
      actor_type: args.actor.type,
      actor_user_id: args.actor.userId,
      actor_session_id: args.actor.sessionId,
      auth_source: args.actor.authSource,
      correlation_id: args.correlationId,
      idempotency_key_hash: args.idempotencyKeyHash ?? null,
      metadata: auditSanitize(args.metadata ?? {}),
    },
    prefer: "return=minimal",
  });
}