# Office provider: decisions

1. The issuer is `https://vevit.cz/account` and the protocol endpoints sit at fixed locale-less paths (`/account/oidc/*`, `/account/.well-known/*`) that `src/proxy.ts` now passes through; a locale redirect would break discovery.
2. Handlers are plain `(deps, Request) => Response` functions over an `OfficeStore` interface (Supabase in production, memory in tests), so every endpoint is tested with `node --test` without a Next.js runtime or a database.
3. Keys come only from the environment (`OFFICE_OIDC_KEY_ACTIVE` signs, `OFFICE_OIDC_KEY_SECONDARY` is published only); `kid` is derived from the public key so no extra variable can drift.
4. Codes, device codes, user codes, poll tokens and device tokens are stored as SHA-256 only; the one recoverable secret (the device token between "confirmed" and "collected", at most 10 minutes) is AES-256-GCM sealed with `OFFICE_LINK_SEAL_KEY` and wiped on collection.
5. `email_verified` is false until `users.email_verified_at` is set, because registration here does not verify e-mail addresses; Office must not admit anybody by an unverified address.
6. Device names are never reused after unlinking and are limited to 10 per account, so a name cannot be hoarded or taken over; the validation forbids `--` (punycode), reserved words and anything outside `[a-z0-9-]`.
7. The redirect URI is validated against the registered shape and the live device table on every request, and again at the token endpoint against the URI stored with the code.
8. The device endpoints serve only `vevit-office-device` as the specification says; the code-flow client `vevit-office` is refused there, and an approved device code is consumed by one atomic conditional update.
9. The consent screen applies to somebody else's device only; the owner and the first-party Cloud do not see it. Consents are per user and device and die with the device.
10. Rate limiting uses a new atomic SQL counter (`office_rate_consume`) instead of `login_attempts`, whose column types are not in the repository; any limiter outage answers 503 (fail closed).
11. The DNS provider sits behind `DnsAdapter`; until a real adapter exists the endpoints answer 503 (`OFFICE_DNS_PROVIDER=mock` is for previews only), and the mock cannot be enabled by accident in production because the variable is unset there.
12. The audit log stores an HMAC of the IP, never the address, and never secrets or TXT values; audit write failures are logged but never fail the request.
13. `GET /subscription` returns `name` in addition to the four documented fields, because `vevit-relay` registers devices by it.
14. Stripe is wired as an inert webhook (signature, tolerance, price→plan map); plans are rows in `office_plans` that an administrator edits by hand until billing exists.
15. The Office work is based on `master` (there is no `main`), which is 71 commits behind `feat/aifb-teorie`; it adds the `allowImportingTsExtensions` flag and a `test:unit` script identical to that branch so a later merge stays trivial.
16. The ID token of the device flow is bound to the client (`aud = vevit-office-device`) as the specification says, not to a server: a desktop sign-in is not tied to a paired server, and the server-bound tokens of the code flow already carry `aud = vevit-office` plus the exact device redirect URI.
17. E-mail verification reuses the monorepo's Resend HTTP setup (`RESEND_API_KEY`, `MAIL_FROM`); the link holds a 256-bit token valid for 24 hours, stored as SHA-256 only, and a page button (not the GET) spends it so mail scanners cannot.
18. Changing `users.email` un-verifies the address through a database trigger (migration 027), so every code path, including legacy PHP, is covered.
19. Resending is limited to one mail per minute and three per hour per person, plus ten per hour per address of origin.
20. The consent screen offers verification for an unverified address; owners and the first-party Cloud never see that screen, so the same notice sits on `/office/devices`.
21. The daily `office_purge_expired()` runs from `pg_cron` inside Supabase (no public endpoint, no `CRON_SECRET`); Vercel Cron was rejected because it would need both.
22. The legal text on the consent screen is a placeholder linking to `/office/legal`; the real wording is yours (TODO-VIT.md).
23. The Office pages import `account/assets/styles.css` because that is where `master` keeps the account stylesheet; `feat/aifb-teorie` moved it to `src/styles/account.css`, so the six imports in `src/app/office/*/page.tsx` must be switched when the two branches meet.

- The integration harness reuses the production handlers over `MemoryStore` rather than a local Supabase: no Docker or Supabase binaries are available here and the base schema is not in this repository.
