# Office provider: decisions

1. The issuer is `https://vevit.cz/account` and the protocol endpoints sit at fixed locale-less paths (`/account/oidc/*`, `/account/.well-known/*`) that `src/proxy.ts` now passes through; a locale redirect would break discovery.
2. Handlers are plain `(deps, Request) => Response` functions over an `OfficeStore` interface (Supabase in production, memory in tests), so every endpoint is tested with `node --test` without a Next.js runtime or a database.
3. Keys come only from the environment (`OFFICE_OIDC_KEY_ACTIVE` signs, `OFFICE_OIDC_KEY_SECONDARY` is published only); `kid` is derived from the public key so no extra variable can drift.
4. Codes, device codes, user codes, poll tokens and device tokens are stored as SHA-256 only; the one recoverable secret (the device token between "confirmed" and "collected", at most 10 minutes) is AES-256-GCM sealed with `OFFICE_LINK_SEAL_KEY` and wiped on collection.
5. `email_verified` is false until `users.email_verified_at` is set, because registration here does not verify e-mail addresses; Office must not admit anybody by an unverified address.
6. Device names are never reused after unlinking and are limited to 10 per account, so a name cannot be hoarded or taken over; the validation forbids `--` (punycode), reserved words and anything outside `[a-z0-9-]`.
7. The redirect URI is validated against the registered shape and the live device table on every request, and again at the token endpoint against the URI stored with the code.
8. The device endpoints accept both `vevit-office` and `vevit-office-device`, because the Office server presently uses one `client_id` for both flows; codes are bound to the asking client.
9. The consent screen applies to somebody else's device only; the owner and the first-party Cloud do not see it. Consents are per user and device and die with the device.
10. Rate limiting uses a new atomic SQL counter (`office_rate_consume`) instead of `login_attempts`, whose column types are not in the repository; any limiter outage answers 503 (fail closed).
11. The DNS provider sits behind `DnsAdapter`; until a real adapter exists the endpoints answer 503 (`OFFICE_DNS_PROVIDER=mock` is for previews only), and the mock cannot be enabled by accident in production because the variable is unset there.
12. The audit log stores an HMAC of the IP, never the address, and never secrets or TXT values; audit write failures are logged but never fail the request.
13. `GET /subscription` returns `name` in addition to the four documented fields, because `vevit-relay` registers devices by it.
14. Stripe is wired as an inert webhook (signature, tolerance, price→plan map); plans are rows in `office_plans` that an administrator edits by hand until billing exists.
15. The Office work is based on `master` (there is no `main`), which is 71 commits behind `feat/aifb-teorie`; it adds the `allowImportingTsExtensions` flag and a `test:unit` script identical to that branch so a later merge stays trivial.
