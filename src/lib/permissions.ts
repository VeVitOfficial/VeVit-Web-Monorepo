import "server-only";

import { accountSupabase } from "@/lib/account-auth";

/**
 * Ranks and permissions (migration 015). Permissions are the union of every
 * valid rank: level ranks reached, membership up to the effective tier
 * (personal subscription or Platinum via an organization), granted program /
 * staff ranks and organization roles. `*` (admin) grants everything.
 */

export type UserAccess = {
  tier: string;
  ranks: string[];
  permissions: string[];
};

export async function getUserAccess(userId: string): Promise<UserAccess> {
  const sb = accountSupabase();
  const [tier, ranks, permissions] = await Promise.all([
    sb.rpc("user_effective_tier", { p_user_id: userId }),
    sb.rpc("user_rank_keys", { p_user_id: userId }),
    sb.rpc("user_permissions", { p_user_id: userId }),
  ]);
  if (tier.error || ranks.error || permissions.error) {
    // Fail closed: no permissions rather than guessing.
    console.error("[permissions] access lookup failed");
    return { tier: "free", ranks: [], permissions: [] };
  }
  return {
    tier: typeof tier.data === "string" ? tier.data : "free",
    ranks: Array.isArray(ranks.data) ? (ranks.data as string[]) : [],
    permissions: Array.isArray(permissions.data) ? (permissions.data as string[]) : [],
  };
}

export function hasPermission(access: Pick<UserAccess, "permissions">, permission: string): boolean {
  return access.permissions.includes("*") || access.permissions.includes(permission);
}
