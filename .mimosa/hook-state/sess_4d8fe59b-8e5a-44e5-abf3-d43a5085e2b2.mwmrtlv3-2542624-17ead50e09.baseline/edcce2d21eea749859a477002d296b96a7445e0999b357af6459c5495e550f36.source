import { createHmac } from "node:crypto";

// Pure secret resolution (no server-only / no logging), unit-testable under node:test.

export type AppSecret = { secret: string; source: "VEVIT_APP_SECRET" | "derived"; weak: boolean };

export function resolveAppSecret(env: Record<string, string | undefined>, purpose: string): AppSecret {
  const explicit = env.VEVIT_APP_SECRET?.trim();
  if (explicit) return { secret: explicit, source: "VEVIT_APP_SECRET", weak: explicit.length < 32 };
  const key = env.SUPABASE_SECRET_KEY?.trim();
  if (!key) throw new Error("VEVIT_APP_SECRET is not configured");
  return { secret: createHmac("sha256", key).update(`vevit-app-secret-v1|${purpose}`).digest("hex"), source: "derived", weak: false };
}
