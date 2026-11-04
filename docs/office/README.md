# VeVit Office: Vevit account as OIDC provider and the Office API

Contract: `OIDC-SPEC.md`. Decisions: `DECISIONS.md`. What you must provide: `TODO-VIT.md`. Code: `src/lib/office/` (logic, no framework imports), thin routes in `src/app/account/oidc`, `src/app/account/.well-known`, `src/app/api/office`, pages in `src/app/office`, migration `supabase/sql/account/026_office_oidc.sql`.

Tests: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/unit/office/` (26 tests, no network, no database); the same command with `tests/unit/` runs everything.

## Environment variables (set on Vercel, Production and Preview as needed)
| Variable | Required | Meaning |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | yes (existing) | server access to Supabase |
| `OFFICE_OIDC_KEY_ACTIVE` | yes | base64 of the PKCS#8 PEM of the EC P-256 **private** key that signs ID tokens |
| `OFFICE_OIDC_KEY_SECONDARY` | during a rotation | base64 of a PEM (private or public) of the second key; published in the JWKS, never used to sign |
| `OFFICE_LINK_SEAL_KEY` | yes | 32 random bytes, base64: seals the device token until the server collects it |
| `RESEND_API_KEY`, `MAIL_FROM` | for e-mail verification | the existing Resend settings (also used by `forgot-password`); without a key the verification mail cannot be sent and the endpoint answers 503 |
| `OFFICE_MAIL_PROVIDER` | local only | `mock` keeps mails in memory for the integration run; ignored when `NODE_ENV=production` |
| `OFFICE_AUDIT_IP_SECRET` | recommended | secret for the HMAC of IP addresses in the audit log (falls back to `VEVIT_APP_SECRET`) |
| `OFFICE_OIDC_ISSUER` | no | default `https://vevit.cz/account`; change only together with the clients |
| `OFFICE_CLOUD_REDIRECT_URIS` | for Cloud | comma separated exact redirect URIs of the Cloud service (placeholder: empty) |
| `OFFICE_DNS_PROVIDER` | no | `mock` accepts DNS calls without touching DNS (previews only); unset = the DNS endpoints answer 503 until the real adapter exists |
| `OFFICE_STRIPE_WEBHOOK_SECRET` | for billing | Stripe signing secret; unset = the webhook answers 503 |
| `OFFICE_STRIPE_PRICE_PLANS` | for billing | JSON map `{"price_xxx": "pro"}` to plans in `office_plans` |

Generate keys (nothing is committed; keep the private keys only in Vercel and your password manager):
```
openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt | base64 -w0     # a signing key
openssl rand -base64 32                                                                          # OFFICE_LINK_SEAL_KEY
```

## Key rotation
ID tokens live 5 minutes and Office caches the JWKS for an hour, so rotate in three steps with at least an hour between them:
1. Generate the new key. Set `OFFICE_OIDC_KEY_SECONDARY` to its public (or private) key and redeploy. The JWKS now lists both keys; the old key still signs.
2. After an hour, swap: `OFFICE_OIDC_KEY_ACTIVE` = the new private key, `OFFICE_OIDC_KEY_SECONDARY` = the old key. Redeploy. New tokens carry the new `kid`; tokens signed before are still verifiable.
3. After another hour, remove `OFFICE_OIDC_KEY_SECONDARY` and redeploy. The old key is retired.
Emergency (key leaked): set a new `OFFICE_OIDC_KEY_ACTIVE` and delete `OFFICE_OIDC_KEY_SECONDARY` in one deploy; tokens of the old key stop verifying immediately and people simply sign in again.

## Operations
- Revoke everything of a server: the owner unlinks it at `/office/devices` (token, consents and TXT record go at once), or `update public.office_devices set revoked_at = now() where name = '…'` as an administrator.
- Look at activity: `select at, kind, user_id, device_id, detail from public.office_audit order by id desc limit 100;`
- Set a plan by hand: `insert into public.office_subscriptions (user_id, plan, active) values ('<users.id>', 'pro', true) on conflict (user_id) do update set plan = excluded.plan, active = excluded.active;`
- Mark an address verified by hand: `update public.users set email_verified_at = now() where id = '<users.id>';` (changing the e-mail clears it again).
- Daily purge: `028_office_purge_cron.sql` schedules `office_purge_expired()` with `pg_cron`; check with `select * from cron.job;`.
- Nothing here is deployed by this change; the migration and the variables are yours to apply.

## Cross-repository integration test

`tests/integration/office-harness.mjs` serves the real handlers of `src/lib/office/*` (the functions the route files call) on a loopback port over an in-memory store, with a DNS adapter that writes ACME TXT records to Pebble's challenge server and a mock mailer. The Office repository drives it from `tools/integration-vevit.sh` (pairing, DNS-01 certificate, relay, sign-in with a verified and an unverified account, consent, e-mail verification, desktop device flow, revoking a server). It never touches Supabase, a network service or production. Not covered: SQL migrations 026-028 on Postgres, Next.js routing and the pages, real DNS.

## Verification of the branch (2026-11-01)

- `npm ci`, then `npx tsc --noEmit`: one error remains, in `src/app/account/api/admin/config.php/route.ts` (`Cannot find module '@/lib/admin'`). That directory is git-ignored (the `**/config.php` rule in `.gitignore` matches the folder name) and is not in this branch or on master; it is a local leftover, so a clean checkout does not have it. tsc over the tracked sources (that directory excluded) reports 0 errors.
- Earlier `mysql2` errors came from a stale `node_modules` and are gone after `npm ci`; `mysql2` serves the edu course API (`src/app/edu/legacy/api`, `src/app/edu/ai-gramotnost/api`), which is still in use and unrelated to Office.
- `npm run test:unit`: 38 passed, 0 failed.
