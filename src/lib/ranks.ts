/**
 * Level curve and rank catalog shared by server and client. The database
 * (`level_thresholds`, `ranks`, migrations 015/016) is the source of truth;
 * these constants mirror it for display only — permissions are always decided
 * server-side by `user_permissions()`.
 */

export const MAX_LEVEL = 100;

/** Total XP needed to reach `level`: 50 · (L − 1) · L. */
export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.min(MAX_LEVEL, Math.trunc(level)));
  return 50 * (l - 1) * l;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= xp) level++;
  return level;
}

export type LevelProgress = {
  level: number;
  xp: number;
  levelStart: number;
  nextLevelAt: number | null;
  pct: number;
};

export function levelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, Math.trunc(xp) || 0);
  const level = levelForXp(safeXp);
  const levelStart = xpForLevel(level);
  if (level >= MAX_LEVEL) return { level, xp: safeXp, levelStart, nextLevelAt: null, pct: 100 };
  const nextLevelAt = xpForLevel(level + 1);
  const pct = Math.floor(((safeXp - levelStart) / (nextLevelAt - levelStart)) * 100);
  return { level, xp: safeXp, levelStart, nextLevelAt, pct };
}

export type RankKind = "level" | "membership" | "program" | "staff";

export type RankMeta = { key: string; kind: RankKind; color: string; minLevel?: number };

export const LEVEL_RANKS: readonly RankMeta[] = [
  { key: "novacek", kind: "level", color: "#9aa4b2", minLevel: 1 },
  { key: "ucen", kind: "level", color: "#7cc4a4", minLevel: 5 },
  { key: "pruzkumnik", kind: "level", color: "#4fb3d9", minLevel: 10 },
  { key: "tvurce", kind: "level", color: "#7a8cf0", minLevel: 20 },
  { key: "expert", kind: "level", color: "#b57cf0", minLevel: 35 },
  { key: "mistr", kind: "level", color: "#f0a44f", minLevel: 50 },
  { key: "legenda", kind: "level", color: "#f05f5f", minLevel: 75 },
];

export const RANKS: Record<string, RankMeta> = Object.fromEntries(
  [
    ...LEVEL_RANKS,
    { key: "bronze", kind: "membership", color: "#cd7f32" },
    { key: "silver", kind: "membership", color: "#c0c0c0" },
    { key: "gold", kind: "membership", color: "#ffd700" },
    { key: "platinum", kind: "membership", color: "#e5e4e2" },
    { key: "betatester", kind: "program", color: "#2ec4b6" },
    { key: "partner", kind: "program", color: "#ff9f1c" },
    { key: "moderator", kind: "staff", color: "#3a86ff" },
    { key: "admin", kind: "staff", color: "#e63946" },
  ].map((rank) => [rank.key, rank as RankMeta]),
);

export function rankForLevel(level: number): RankMeta {
  let current = LEVEL_RANKS[0];
  for (const rank of LEVEL_RANKS) {
    if ((rank.minLevel ?? 1) <= level) current = rank;
  }
  return current;
}

export const PAID_TIERS = ["bronze", "silver", "gold"] as const;
export type PaidTier = (typeof PAID_TIERS)[number];
export type BillingCycle = "monthly" | "yearly";

export function isPaidTier(value: unknown): value is PaidTier {
  return typeof value === "string" && (PAID_TIERS as readonly string[]).includes(value);
}
