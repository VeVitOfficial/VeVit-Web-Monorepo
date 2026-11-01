# Office provider: what only you can provide

| What | Where | Now |
|---|---|---|
| **Signing keys** (EC P-256): generate two, see README.md | Vercel env `OFFICE_OIDC_KEY_ACTIVE` (and `OFFICE_OIDC_KEY_SECONDARY` for rotation) | not set: `/account/oidc/*` answers 503 |
| **Seal key** (32 random bytes, base64) | Vercel env `OFFICE_LINK_SEAL_KEY` | not set: pairing answers 503 |
| Apply the migration | Supabase SQL editor: `supabase/sql/account/026_office_oidc.sql` (adds `users.email_verified_at`, 11 tables with RLS, 3 functions, 2 default plans) | not applied |
| **Real DNS adapter** for the zone `office.vevit.cz` | implement `DnsAdapter` (`src/lib/office/dns.ts`) and select it with `OFFICE_DNS_PROVIDER`. Needed from the provider's API: create-or-replace and delete one TXT record by exact name (`_acme-challenge.<label>.office.vevit.cz`), TTL ≤ 60 s, an API token limited to that zone, and (best) a read call to check that the record is served before returning | mock only |
| DNS records for the zone | wildcard `*.office.vevit.cz` A/AAAA to the relay (TCP 443), the relay's QUIC name and certificate, `OFFICE_AUDIT_IP_SECRET` | not done |
| Cloud address | `OFFICE_CLOUD_REDIRECT_URIS` (comma separated exact URIs, e.g. `https://cloud.office.vevit.cz/api/oidc/callback`) | placeholder: empty |
| Stripe: products and prices for Office, checkout that stores `metadata.vevit_user_id`, the webhook endpoint `https://vevit.cz/api/office/stripe/webhook` with its signing secret | `OFFICE_STRIPE_WEBHOOK_SECRET`, `OFFICE_STRIPE_PRICE_PLANS` (JSON `{"price_xxx":"pro"}`); plans and limits in table `office_plans` | webhook inert (503) |
| E-mail verification flow that sets `users.email_verified_at` (or a backfill for users with a verified OAuth identity) | account section | no flow: `email_verified` is always false, so Office admits by e-mail nobody |
| Plans: real prices, limits (`bytes_per_month`, `max_streams`) | table `office_plans`; manual assignment in `office_subscriptions` | `free` and `pro` placeholders |
| Cron: call `select public.office_purge_expired()` daily | existing `/api/jobs/run` or Supabase cron | not scheduled |
| Legal text for the consent screen and the pairing page (privacy notice, who processes the data) | `src/components/office/office-pages.tsx` | neutral wording |
| Link from the account dashboard to `/office/devices` | account UI | page exists, no menu entry |
| In the vevit-office repository: `device_client_id` setting (today one `client_id` serves both flows) | `crates/auth` | works through the accepted `vevit-office` id on device endpoints |

Not verified here: a live run of the Rust client (`crates/auth`) against this provider (no deployment); the Rust mock's behaviour was matched by reading `crates/auth/src/oidc.rs` and the tests of this repo reproduce its flows (state, nonce, PKCE, JWKS rotation, device polling).
