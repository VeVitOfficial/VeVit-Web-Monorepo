import "server-only";

import { getStoreUser, storeRestSelect } from "@/lib/store-config";
import {
  AgendaDomainError,
  agendaActorForOrder,
  orderCanAccess,
  type AccessOrder,
  type AgendaIdentity,
} from "@/lib/store-order-access";
import type { DeliveryRow } from "@/lib/store-delivery";
import { deliveryCustomerDetail } from "@/lib/store-delivery";

/**
 * Server-side data helpers for the customer-agenda React pages:
 * ports of CustomerOrderService.php page queries and the order.php delivery
 * embed. Pages render null-safe empty states instead of PHP's
 * agenda_unavailable where possible; access failures still throw
 * AgendaDomainError and let the page render its own fallback.
 */

export interface AccountOrderRow {
  public_id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  total: string | null;
  currency: string | null;
  created_at: string;
}

/** CustomerOrderService::accountOrders — returns null when not signed in. */
export async function accountOrdersList(): Promise<AccountOrderRow[] | null> {
  const user = await getStoreUser();
  if (user === null || user.id === "") return null;
  return storeRestSelect<AccountOrderRow>(
    "store_orders",
    `select=public_id,order_number,status,payment_status,fulfillment_status,total,currency,created_at&user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc,id.desc`,
  );
}

export interface OrderDetail {
  order_number: string;
  status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  total: string | null;
  currency: string | null;
  created_at: string;
  items: { id: number; product_id: number | null; product_name: string | null; product_type: string | null; quantity: number; unit_price: number | null }[];
}

/** CustomerOrderService::detail — identity resolved through agendaActorForOrder. */
export async function orderDetailForPage(publicId: string): Promise<OrderDetail> {
  if (!/^[a-f0-9]{32}$/.test(publicId)) throw new AgendaDomainError("Order unavailable.");
  const identity = await agendaActorForOrder(publicId);
  const rows = await storeRestSelect<
    AccessOrder & { order_number: string; payment_status: string | null; fulfillment_status: string | null; total: string | null; currency: string | null; created_at: string }
  >(
    "store_orders",
    `select=id,public_id,order_number,user_id,guest_grant_hash,guest_grant_expires_at,status,payment_status,fulfillment_status,total,currency,created_at&public_id=eq.${encodeURIComponent(publicId)}&limit=1`,
  );
  if (rows.length === 0) throw new AgendaDomainError("Order unavailable.");
  const order = rows[0];
  if (!orderCanAccess(order, identityUser(identity), identity.grant, publicId)) throw new AgendaDomainError("Order unavailable.");
  const items = await storeRestSelect<OrderDetail["items"][number]>(
    "store_order_items",
    `select=id,product_id,product_name,product_type,quantity,unit_price&order_id=eq.${order.id}&order=id.asc`,
  );
  return {
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    fulfillment_status: order.fulfillment_status,
    total: order.total,
    currency: order.currency,
    created_at: order.created_at,
    items,
  };
}

export interface OrderDeliveries {
  detail: OrderDetail;
  deliveries: DeliveryRow[];
}

/** The order.php page bundle: detail + DeliveryService::customerDetail. */
export async function orderPageData(publicId: string): Promise<OrderDeliveries> {
  if (!/^[a-f0-9]{32}$/.test(publicId)) throw new AgendaDomainError("Order unavailable.");
  const identity = await agendaActorForOrder(publicId);
  const detail = await orderDetailForPage(publicId);
  // rawOrderForAuthorizedDelivery → full access row for deliveryCustomerDetail.
  const rows = await storeRestSelect<AccessOrder & { order_number: string; payment_status: string | null; fulfillment_status: string | null; total: string | null; currency: string | null; created_at: string }>(
    "store_orders",
    `select=id,public_id,user_id,status,guest_grant_hash,guest_grant_expires_at&public_id=eq.${encodeURIComponent(publicId)}&limit=1`,
  );
  const order = rows[0];
  const deliveries = order === undefined ? [] : await deliveryCustomerDetail(publicId, identity, order);
  return { detail, deliveries };
}

export interface SuccessOrder {
  order_number: string;
  status: string;
  payment_status: string | null;
  total_amount: string | null;
  items: { id: number; product_name: string; product_type: string; quantity: number; unit_price: number | null }[];
}

/**
 * The success.php page bundle — identity via the account session or the guest
 * grant cookie (PHP used $_SESSION['_store_order_grants']; the grant lives in
 * the HMAC cookie in this infrastructure).
 */
export async function successOrderForPage(publicId: string): Promise<SuccessOrder> {
  if (!/^[a-f0-9]{32}$/.test(publicId)) throw new AgendaDomainError("Order unavailable.");
  const identity: AgendaIdentity = await agendaActorForOrder(publicId);
  const rows = await storeRestSelect<AccessOrder & { order_number: string; payment_status: string | null; total_amount: string | null }>(
    "store_orders",
    `select=id,public_id,order_number,user_id,status,guest_grant_hash,guest_grant_expires_at,payment_status,total_amount&public_id=eq.${encodeURIComponent(publicId)}&limit=1`,
  );
  if (rows.length === 0) throw new AgendaDomainError("Order unavailable.");
  const order = rows[0];
  if (!orderCanAccess(order, identityUser(identity), identity.grant, publicId)) throw new AgendaDomainError("Order unavailable.");
  const items = await storeRestSelect<{ id: number; product_name: string; product_type: string; quantity: number; unit_price: number | null }>(
    "store_order_items",
    `select=id,product_name,product_type,quantity,unit_price&order_id=eq.${order.id}&order=id.asc`,
  );
  return { order_number: order.order_number, status: order.status ?? "", payment_status: order.payment_status, total_amount: order.total_amount, items };
}

function identityUser(identity: AgendaIdentity): { id: string } | null {
  return identity.actor.kind === "customer_account" ? { id: identity.actor.userId } : null;
}