import "server-only";

import { resolveAppSecret } from "@/lib/app-secret-core";

/**
 * Server secret for HMAC signing (CSRF tokens, store grant cookies, audit IP
 * fingerprints). VEVIT_APP_SECRET is the configured source. When it is missing
 * the secret is DERIVED from the Supabase service key with a per-purpose label:
 * the service key itself is never used directly as a signing key, and the
 * purposes cannot be replayed against each other. Production should still set
 * VEVIT_APP_SECRET (>= 32 random characters) so signing keys are independent
 * of the database credential and can be rotated separately.
 */

let warned = false;

export function appSecret(purpose: string): string {
  const { secret, source, weak } = resolveAppSecret(process.env, purpose);
  if (!warned && (source === "derived" || weak)) {
    warned = true;
    console.warn(source === "derived"
      ? "[security] VEVIT_APP_SECRET is not set; deriving signing keys from the Supabase service key"
      : "[security] VEVIT_APP_SECRET is shorter than 32 characters");
  }
  return secret;
}
