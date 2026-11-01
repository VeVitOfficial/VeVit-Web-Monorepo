# Office provider: what only you can provide

| What | Where | Now |
|---|---|---|
| **Signing keys** (EC P-256): generate two, see README.md | Vercel env `OFFICE_OIDC_KEY_ACTIVE` (and `OFFICE_OIDC_KEY_SECONDARY` for rotation) | not set: `/account/oidc/*` answers 503 |
| **Seal key** (32 random bytes, base64) | Vercel env `OFFICE_LINK_SEAL_KEY` | not set: pairing answers 503 |
| Apply the migrations in order | Supabase SQL editor: `026_office_oidc.sql` (adds `users.email_verified_at`, 11 tables with RLS, 3 functions, 2 default plans), `027_office_email_verification.sql` (verification tokens, trigger on `users.email`, `office_verify_email`, wider purge), `028_office_purge_cron.sql` (schedule) | not applied |
| **Real DNS adapter** for the zone `office.vevit.cz` | implement `DnsAdapter` (`src/lib/office/dns.ts`) and select it with `OFFICE_DNS_PROVIDER`. Needed from the provider's API: create-or-replace and delete one TXT record by exact name (`_acme-challenge.<label>.office.vevit.cz`), TTL ≤ 60 s, an API token limited to that zone, and (best) a read call to check that the record is served before returning | mock only |
| DNS records for the zone | wildcard `*.office.vevit.cz` A/AAAA to the relay (TCP 443), the relay's QUIC name and certificate, `OFFICE_AUDIT_IP_SECRET` | not done |
| Cloud address | `OFFICE_CLOUD_REDIRECT_URIS` (comma separated exact URIs, e.g. `https://cloud.office.vevit.cz/api/oidc/callback`) | placeholder: empty |
| Stripe: products and prices for Office, checkout that stores `metadata.vevit_user_id`, the webhook endpoint `https://vevit.cz/api/office/stripe/webhook` with its signing secret | `OFFICE_STRIPE_WEBHOOK_SECRET`, `OFFICE_STRIPE_PRICE_PLANS` (JSON `{"price_xxx":"pro"}`); plans and limits in table `office_plans` | webhook inert (503) |
| **Mail delivery for the verification link**: the existing Resend setup (`RESEND_API_KEY`, optional `MAIL_FROM`, a verified sender domain) must exist on Vercel; it is the same one `forgot-password` uses | Vercel env | adapter written; without the key the send endpoint answers 503 `mail_unavailable` |
| Backfill `users.email_verified_at` for people whose address was already proven (verified OAuth identity, completed password reset); the verification flow covers everyone else | one-off SQL, your decision | all existing users start unverified |
| Plans: real prices, limits (`bytes_per_month`, `max_streams`) | table `office_plans`; manual assignment in `office_subscriptions` | `free` and `pro` placeholders |
| Enable the `pg_cron` extension (Supabase: Database → Extensions), then re-run `028_office_purge_cron.sql`; it schedules `office_purge_expired()` daily at 03:17 UTC | Supabase | the migration only prints a notice until the extension is on |
| **Legal text** for the sign-in consent screen: wording of the data-processing notice (who processes name and e-mail, the legal basis, retention) and the content of the page `/office/legal` that the consent screen links to | `LegalPage` and `TEXT.legalNote` in `src/components/office/office-pages.tsx` | placeholder page, neutral one-line note |
| In the vevit-office repository: `device_client_id` setting (today one `client_id` serves both flows) | `crates/auth` | the Office server must send `client_id=vevit-office-device` on the device endpoints; the provider refuses `vevit-office` there |

Not verified here: a live run of the Rust client (`crates/auth`) against this provider (no deployment); the Rust mock's behaviour was matched by reading `crates/auth/src/oidc.rs` and the tests of this repo reproduce its flows (state, nonce, PKCE, JWKS rotation, device polling).
