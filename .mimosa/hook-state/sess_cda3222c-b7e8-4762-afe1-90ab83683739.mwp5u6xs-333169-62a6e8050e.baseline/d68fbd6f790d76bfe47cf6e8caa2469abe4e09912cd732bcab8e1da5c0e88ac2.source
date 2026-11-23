import "server-only";

import { timingSafeEqual } from "node:crypto";
import { sha256Hex } from "@/lib/store-order-core";
import { getStoreUser, storeRestSelect } from "@/lib/store-config";
import { readOrderGrant } from "@/lib/store-guest-grants";

/**
 * Port of store/lib/orders/OrderAccessService.php plus the customer side of
 * store/lib/auth/ActorContext.php (legacy shared-admin/system actors stay in
 * the PHP admin API).
 *
 * agendaActorForOrder replaces agenda_actor_for_order: the PHP AuthContextFactory
 * always answered AnonymousAuthContext (vevit_account_contract_unavailable), so
 * the account half never worked. The shared host-only account session IS the
 * reviewed contract in this infrastructure, so identity comes from getStoreUser();
 * guest grants come from the HMAC store-grant cookie instead of
 * $_SESSION['_store_order_grants'].
 */

/** DomainException equivalent — routes map these to the 4xx error payloads. */
export class AgendaDomainError extends Error {}

export type AgendaActor =
  | { kind: "customer_account"; userId: string }
  | { kind: "customer_guest" };

export interface AgendaIdentity {
  actor: AgendaActor;
  authSource: string;
  grant: string | null;
}

/** Aggregate of the store_orders fields OrderAccessService.canAccess reads. */
export interface AccessOrder {
  id: number;
  public_id: string;
  user_id: string | null;
  status: string | null;
  guest_grant_hash: string | null;
  guest_grant_expires_at: string | null;
}

const ORDER_ACCESS_FIELDS = "id,public_id,user_id,status,guest_grant_hash,guest_grant_expires_at";

export async function orderRowByPublicId(publicId: string): Promise<AccessOrder | null> {
  const rows = await storeRestSelect<AccessOrder>(
    "store_orders",
    `select=${ORDER_ACCESS_FIELDS}&public_id=eq.${encodeURIComponent(publicId)}&limit=1`,
  );
  return rows[0] ?? null;
}

export async function orderRowById(orderId: number): Promise<AccessOrder | null> {
  const rows = await storeRestSelect<AccessOrder>(
    "store_orders",
    `select=${ORDER_ACCESS_FIELDS}&id=eq.${orderId}&limit=1`,
  );
  return rows[0] ?? null;
}

/** hash_equals(): false on length mismatch, constant time otherwise. */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length || ab.length === 0) return false;
  return timingSafeEqual(ab, bb);
}

/** The user array ClaimService constructs for customer_account actors. */
export function identityUser(identity: AgendaIdentity): { id: string } | null {
  return identity.actor.kind === "customer_account" ? { id: identity.actor.userId } : null;
}

/** OrderAccessService::canAccess (customer paths; the admin bypass is not ported). */
export function orderCanAccess(order: AccessOrder, user: { id: string } | null, guestGrant: string | null, requestedPublicId: string): boolean {
  if (!timingSafeStringEqual(order.public_id ?? "", requestedPublicId)) return false;
  if (user !== null && (order.user_id ?? "") !== "" && timingSafeStringEqual(order.user_id ?? "", user.id)) return true;
  if (guestGrant === null || guestGrant === "" || (order.guest_grant_hash ?? "") === "" || (order.guest_grant_expires_at ?? "") === "") {
    return false;
  }
  // PHP wraps the expiry in try/catch — an unparsable timestamp denies access.
  const expiresAt = Date.parse(order.guest_grant_expires_at ?? "");
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;
  return timingSafeStringEqual(order.guest_grant_hash ?? "", sha256Hex(guestGrant));
}

/**
 * Port of agenda_actor_for_order: account session wins, otherwise the guest
 * grant from the signed cookie; no grant → "Order unavailable." (the caller
 * decides whether that surfaces as 404 order_unavailable or the flattened
 * family error).
 */
export async function agendaActorForOrder(orderPublicId: string): Promise<AgendaIdentity> {
  const user = await getStoreUser();
  if (user !== null && user.id !== "") {
    return { actor: { kind: "customer_account", userId: user.id }, authSource: "account_session", grant: null };
  }
  const grant = await readOrderGrant(orderPublicId);
  if (grant === null || grant === "") throw new AgendaDomainError("Order unavailable.");
  return { actor: { kind: "customer_guest" }, authSource: "guest_order_grant", grant };
}