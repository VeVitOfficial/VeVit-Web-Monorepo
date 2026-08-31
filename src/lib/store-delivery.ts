import "server-only";

import { storeRestSelect } from "@/lib/store-config";
import { AgendaDomainError, identityUser, orderCanAccess, type AccessOrder, type AgendaIdentity } from "@/lib/store-order-access";

/** Port of store/lib/delivery TrackingUrlPolicy + DeliveryService::customerDetail. */

function trackingCarrierOrigins(): Record<string, string> {
  const raw = process.env.TRACKING_CARRIER_ORIGINS_JSON?.trim();
  if (raw === undefined || raw === "") return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const carriers: Record<string, string> = {};
    for (const [code, origin] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof origin === "string" && origin.startsWith("https://") && /^[a-z0-9_-]{1,32}$/.test(code)) {
        carriers[code] = origin;
      }
    }
    return carriers;
  } catch {
    // PHP throws a StoreConfigurationException at boot; the port degrades to
    // "no carrier allowed", which only ever affects unsafe tracking URLs.
    return {};
  }
}

/** TrackingUrlPolicy::isSafe — https, known carrier host, no creds, port 443. */
export function trackingUrlIsSafe(carrierCode: string, url: string | null): boolean {
  if (url === null || url === "") return true;
  const origin = trackingCarrierOrigins()[carrierCode];
  if (origin === undefined) return false;
  if (url.length > 2048) return false;
  let actual: URL;
  let expected: URL;
  try {
    actual = new URL(url);
    expected = new URL(origin);
  } catch {
    return false; // FILTER_VALIDATE_URL equivalent
  }
  if (actual.protocol !== "https:") return false;
  if (actual.host.toLowerCase() !== expected.host.toLowerCase()) return false;
  if (actual.username !== "" || actual.password !== "") return false;
  if (actual.port !== "" && actual.port !== "443") return false;
  return true;
}

export interface DeliveryRow {
  public_id: string;
  carrier_code: string | null;
  carrier_name: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  last_updated_at: string;
  status: string;
  customer_message: string | null;
  version: number;
}

/** DeliveryService::customerDetail — rows for the order, unsafe URLs nulled. */
export async function deliveryCustomerDetail(orderPublicId: string, identity: AgendaIdentity, order: AccessOrder): Promise<Record<string, unknown>[]> {
  const user = identityUser(identity);
  if (!orderCanAccess(order, user, identity.grant, orderPublicId)) throw new AgendaDomainError("Delivery unavailable.");
  const rows = await storeRestSelect<DeliveryRow>(
    "store_deliveries",
    `select=public_id,carrier_code,carrier_name,shipping_method,tracking_number,tracking_url,shipped_at,estimated_delivery_at,delivered_at,last_updated_at,status,customer_message,version&order_id=eq.${order.id}&order=created_at.asc,id.asc`,
  );
  const mapped: Record<string, unknown>[] = rows.map((row): Record<string, unknown> => {
    const safe = trackingUrlIsSafe(row.carrier_code ?? "", row.tracking_url);
    return safe ? { ...row } : { ...row, tracking_url: null };
  });
  return mapped;
}