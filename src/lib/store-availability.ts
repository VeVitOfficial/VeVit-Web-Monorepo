import "server-only";

import { storeRestSelect } from "@/lib/store-config";
import { AgendaDomainError } from "@/lib/store-order-access";

/**
 * Port of store/lib/orders/CaseQuantityAvailability.php.
 *
 * PostgREST has no SELECT … FOR UPDATE, so lockOrderItems() is a plain
 * consistent read (the concurrent-reservation race this leaves open is
 * accepted for the port — the UNIQUE idempotency constraints keep replays
 * safe) and assertReservable() aggregates the guard sums in JS from two
 * embedded-status queries instead of the four PHP correlated subqueries.
 */

export interface LockedOrderItem {
  id: number;
  order_id: number;
  quantity: number;
  product_type: string | null;
}

export const ACTIVE_CLAIM_STATUSES = new Set(["submitted", "under_review", "waiting_for_customer", "accepted"]);
export const ACTIVE_RETURN_STATUSES = new Set(["requested", "approved", "waiting_for_goods", "received", "inspected", "refund_pending"]);
export const FINAL_CLAIM_STATUS = "resolved";
export const FINAL_RETURN_STATUS = "completed";

/** CaseQuantityAvailability::eligible. */
export function eligibleQuantity(purchased: number, finalClaims: number, finalReturns: number, activeClaims: number, activeReturns: number): number {
  for (const quantity of [purchased, finalClaims, finalReturns, activeClaims, activeReturns]) {
    if (quantity < 0) throw new AgendaDomainError("Quantity cannot be negative.");
  }
  const eligible = purchased - finalClaims - finalReturns - activeClaims - activeReturns;
  if (eligible < 0) throw new AgendaDomainError("Stored case quantities exceed purchased quantity.");
  return eligible;
}

/** CaseQuantityAvailability::lockOrderItems — consistent read, same guards. */
export async function lockOrderItems(orderId: number, requestedItemIds: number[]): Promise<Map<number, LockedOrderItem>> {
  const ids = [...new Set(requestedItemIds.map((id) => Math.trunc(id)))].sort((a, b) => a - b);
  if (orderId < 1 || ids.length === 0 || Math.min(...ids) < 1) throw new Error("Invalid order items.");
  const rows = await storeRestSelect<LockedOrderItem>(
    "store_order_items",
    `select=id,order_id,quantity,product_type&order_id=eq.${orderId}&id=in.(${ids.join(",")})`,
  );
  if (rows.length !== ids.length) throw new AgendaDomainError("Order item is unavailable.");
  return new Map(rows.map((row) => [row.id, row]));
}

type StatusEmbed = { status: string | null } | { status: string | null }[];

function firstStatus(embed: StatusEmbed | null): string {
  if (Array.isArray(embed)) return embed[0]?.status ?? "";
  return embed?.status ?? "";
}

interface UsageEntry { active: number; final: number }

type UsageRow = {
  order_item_id: number;
  requested_quantity: number;
  consumed_quantity: number;
  store_claims?: StatusEmbed | null;
  store_returns?: StatusEmbed | null;
};

async function usageFor(
  table: "store_claim_items" | "store_return_items",
  embeds: "store_claims" | "store_returns",
  ids: number[],
): Promise<Map<number, UsageEntry>> {
  const rows = await storeRestSelect<UsageRow>(
    table,
    `select=order_item_id,requested_quantity,consumed_quantity,${embeds}(status)&order_item_id=in.(${ids.join(",")})`,
  );
  const usage = new Map<number, UsageEntry>();
  for (const row of rows) {
    const entry = usage.get(row.order_item_id) ?? { active: 0, final: 0 };
    const status = firstStatus((row as UsageRow)[embeds] ?? null);
    if (table === "store_claim_items") {
      if (ACTIVE_CLAIM_STATUSES.has(status)) entry.active += row.requested_quantity;
      if (status === FINAL_CLAIM_STATUS) entry.final += row.consumed_quantity;
    } else {
      if (ACTIVE_RETURN_STATUSES.has(status)) entry.active += row.requested_quantity;
      if (status === FINAL_RETURN_STATUS) entry.final += row.consumed_quantity;
    }
    usage.set(row.order_item_id, entry);
  }
  return usage;
}

/** CaseQuantityAvailability::assertReservable with the sums computed in JS. */
export async function assertReservable(locked: Map<number, LockedOrderItem>, requested: Map<number, number>): Promise<void> {
  const ids = [...requested.keys()];
  const [claims, returns] = await Promise.all([usageFor("store_claim_items", "store_claims", ids), usageFor("store_return_items", "store_returns", ids)]);
  for (const [itemId, quantity] of requested) {
    const item = locked.get(itemId);
    if (item === undefined || quantity < 1) throw new AgendaDomainError("Invalid requested quantity.");
    const usedClaims = claims.get(itemId) ?? { active: 0, final: 0 };
    const usedReturns = returns.get(itemId) ?? { active: 0, final: 0 };
    const eligible = eligibleQuantity(item.quantity, usedClaims.final, usedReturns.final, usedClaims.active, usedReturns.active);
    if (quantity > eligible) throw new AgendaDomainError("Requested quantity exceeds eligible quantity.");
  }
}