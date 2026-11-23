import "server-only";

import { accountSupabase } from "@/lib/account-auth";

/**
 * Profile completion for the account overview. Filling every field gets the
 * profile to 99 %; the last 1 % is the "Dokončit profil" button, which awards
 * XP once (xp_ledger source `account.profile_complete`) and marks it 100 %.
 */

export const PROFILE_FIELDS: [field: string, label: string][] = [
  ["full_name", "jméno a příjmení"],
  ["nickname", "přezdívka"],
  ["bio", "bio"],
  ["location", "lokalita"],
  ["birth_date", "datum narození"],
  ["avatar_url", "profilová fotografie"],
];

export type ProfileCompletion = {
  completion: number;
  missing: string[];
  claimable: boolean;
  claimed: boolean;
};

export function missingProfileFields(user: Record<string, unknown>): string[] {
  return PROFILE_FIELDS
    .filter(([field]) => {
      const value = user[field];
      return typeof value !== "string" || value.trim() === "";
    })
    .map(([, label]) => label);
}

export async function profileClaimed(userId: string): Promise<boolean> {
  const { data, error } = await accountSupabase()
    .from("xp_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("source", "account.profile_complete")
    .limit(1);
  return !error && Array.isArray(data) && data.length > 0;
}

export async function profileCompletion(user: Record<string, unknown> & { id: string }): Promise<ProfileCompletion> {
  const missing = missingProfileFields(user);
  const claimed = await profileClaimed(user.id);
  const done = PROFILE_FIELDS.length - missing.length;
  if (missing.length === 0) {
    return { completion: claimed ? 100 : 99, missing, claimable: !claimed, claimed };
  }
  return {
    completion: Math.floor((done / PROFILE_FIELDS.length) * 99),
    missing,
    claimable: false,
    claimed,
  };
}
