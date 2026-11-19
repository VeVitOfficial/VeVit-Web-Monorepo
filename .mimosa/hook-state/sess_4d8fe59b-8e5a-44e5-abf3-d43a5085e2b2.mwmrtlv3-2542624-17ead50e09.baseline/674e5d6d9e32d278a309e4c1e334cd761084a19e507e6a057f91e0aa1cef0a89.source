import "server-only";

import { accountSupabase } from "@/lib/account-auth";

/**
 * Server-side XP entry point. Every award goes through the `award_xp` RPC
 * (migration 016): it applies the rule amount, daily cap and tier bonus,
 * dedupes on (user, source, refKey) and updates users.xp / users.level.
 * Never pass an amount the client sent unless the source's rule clamps it.
 */

export type XpSource =
  | "edu.quiz"
  | "edu.lesson_complete"
  | "edu.course_complete"
  | "games.session"
  | "games.highscore"
  | "tools.use"
  | "account.daily"
  | "account.streak_7"
  | "account.onboarding"
  | "account.2fa"
  | "account.profile_complete"
  | "services.request_created"
  | "services.job_completed"
  | "services.review";

export type XpAward = {
  awarded: number;
  base?: number;
  bonus?: number;
  tier?: string;
  xp?: number;
  level?: number;
  level_up?: boolean;
  reason?: string;
};

/** Returns null when the award could not be recorded; XP must never break the calling flow. */
export async function awardXp(
  userId: string,
  source: XpSource,
  refKey: string,
  amount?: number,
): Promise<XpAward | null> {
  const { data, error } = await accountSupabase().rpc("award_xp", {
    p_user_id: userId,
    p_source: source,
    p_ref_key: refKey.slice(0, 200),
    p_amount: amount === undefined ? null : Math.trunc(amount),
  });
  if (error || data === null || typeof data !== "object") {
    console.error("[xp] award_xp failed", { source, code: error?.code });
    return null;
  }
  return data as XpAward;
}

/** Today's date in Prague as YYYY-MM-DD — the day key for daily awards. */
export function pragueDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague" }).format(date);
}
