import "server-only";

import { accountSupabase } from "@/lib/account-auth";

/**
 * Store benefits of the customer's effective tier (migration 022). Only the
 * server decides: the checkout snapshot uses this for shipping_minor and the
 * payment/webhook then trust the snapshot. Any lookup failure means no perk
 * (shipping is charged), never a free order by accident.
 */
export async function userHasFreeShipping(userId: string): Promise<boolean> {
  try {
    const sb = accountSupabase();
    const tier = await sb.rpc("user_effective_tier", { p_user_id: userId });
    if (tier.error || typeof tier.data !== "string") return false;
    const { data, error } = await sb.from("tiers").select("free_shipping").eq("key", tier.data).limit(1).maybeSingle();
    if (error) return false;
    return (data as { free_shipping?: unknown } | null)?.free_shipping === true;
  } catch {
    return false;
  }
}
