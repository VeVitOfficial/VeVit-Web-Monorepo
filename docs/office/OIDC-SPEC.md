# Vevit account as OIDC provider: contract with VeVit Office

Source of truth: `docs/OIDC-SPEC.md` in the vevit-office repository. The vevit.cz monorepo keeps an unchanged copy in `docs/office/OIDC-SPEC.md`; change it in vevit-office first and copy it over.

Implemented in `src/lib/office/` (logic), `src/app/account/oidc`, `src/app/account/.well-known` and `src/app/api/office` (routes), `src/app/office` (pages), migration `supabase/sql/account/026_office_oidc.sql`. The client is VeVit Office (online and cloud modes): a public OIDC client, PKCE required, no client secret. Mock used by the Office tests: `crates/auth/src/mock.rs` in the vevit-office repository.

## Issuer and discovery
Issuer `https://vevit.cz/account`. Discovery: `GET https://vevit.cz/account/.well-known/openid-configuration` with, all on the issuer's origin: `authorization_endpoint` `/account/oidc/authorize`, `token_endpoint` `/account/oidc/token`, `jwks_uri` `/account/oidc/jwks`, `device_authorization_endpoint` `/account/oidc/device`. Supported: `response_type=code`, `code_challenge_methods_supported=["S256"]`, `id_token_signing_alg_values_supported=["ES256"]`, `token_endpoint_auth_methods_supported=["none"]`.
JWKS: EC P-256 public keys with `kid` (first 16 hex digits of the SHA-256 of the SPKI), `alg` ES256, `use` sig. Two keys are published during a rotation (README.md, "Key rotation").

## Clients
| client_id | kind | redirect URIs |
|---|---|---|
| `vevit-office` | public, PKCE S256 | exactly `https://<name>.office.vevit.cz/api/oidc/callback` where `<name>` is a paired, not unlinked device (checked on every request); plus the Cloud addresses from `OFFICE_CLOUD_REDIRECT_URIS` (exact match, first-party, no consent screen) |
| `vevit-office-device` | public, device flow | none |
The device endpoints serve only `vevit-office-device`; asking with `vevit-office` is refused (`invalid_client`). The Office client uses `vevit-office` for the code flow and `vevit-office-device` for the device flow.

## Authorization code flow
1. `GET /account/oidc/authorize?response_type=code&client_id&redirect_uri&scope=openid profile email&state&nonce&code_challenge&code_challenge_method=S256`. `nonce` and PKCE S256 are mandatory. Errors about the client or the redirect URI are answered on the page (400), never redirected; other errors are redirected back with `error` and `state`. Not signed in: redirect to the Vevit login (`/cs/account/login?return_to=…`) and back.
2. A person who is not the owner of the device and has no stored consent first sees `/office/consent`: the server's name and address, its owner, and that name and e-mail are shared. "Allow" stores the consent (revocable in the account), "Deny" returns `access_denied`. The owner and Cloud never see this screen.
3. The redirect carries `code` and `state`. The code is 256 random bits, valid 60 s, single use, stored only as SHA-256. Using it twice fails and is written to the audit log.
4. `POST /account/oidc/token` (form): `grant_type=authorization_code, code, redirect_uri, client_id, code_verifier`. `redirect_uri` must be byte-identical to the one the code was issued for. Answer `{token_type:"Bearer", expires_in:300, id_token}`; errors `{error}` with 400 (`invalid_grant`, `invalid_request`, `unsupported_grant_type`) or 401 (`invalid_client`). A failed verifier burns the code.

## ID token
ES256, `kid` header. Claims: `iss`, `sub` (= `public.users.id`, stable, never reused), `aud` (client_id), `iat`, `exp` (5 minutes), `nonce` (code flow), `email`, `email_verified`, `name`, `preferred_username`. `email_verified` is true only when `users.email_verified_at` is set: by the one-time link sent to the address (`/office/verify-email`, valid 24 hours, only its hash stored) and cleared again when the address changes. The consent screen offers the verification to a person without a verified address.

## Device flow (RFC 8628)
`POST /account/oidc/device` (form: `client_id`, `scope`) → `{device_code, user_code "XXXX-XXXX", verification_uri "https://vevit.cz/office/device", verification_uri_complete, expires_in 600, interval 5}`. The person enters the code at `/office/device` and allows or denies. `POST /account/oidc/token` with `grant_type=urn:ietf:params:oauth:grant-type:device_code`: `authorization_pending`, `slow_down` (polling faster than the interval; the interval grows by 5 s), `access_denied`, `expired_token`, `invalid_grant` (unknown or already used), or the `id_token` once (without `nonce`).

## Vevit API for online mode (`https://vevit.cz/api/office/…`)
- `POST /link/start` → `{code, link_url:"https://vevit.cz/office/link", poll_token, expires_in:600}`. No authentication; 10 per 10 minutes per address.
- `POST /link/poll {poll_token}` → `{status:"pending"}`, then once `{status:"linked", device_id, name, device_token, owner_sub}`; afterwards and after expiry `410 {error:"expired"}`. The token is 256 random bits; the database holds its SHA-256 and, until collected, an AES-GCM sealed copy.
- `POST /link/confirm {code, name, display_name?}` (session + `X-CSRF-Token`): the owner pairs. Names: `[a-z0-9]` with single hyphens, 3–40 characters, not reserved; `409 name_taken` (names are never given out again), `409 device_limit` (10 per account), `422 invalid_name`, `404` for an unknown or expired code.
- `PUT /dns/acme {name, value}` and `DELETE /dns/acme {name}` (bearer device token): only `_acme-challenge.<name>.office.vevit.cz` of the calling device (a trailing dot is tolerated), `value` a 43-character base64url string. `204`; `403 forbidden_name`; `503 dns_unavailable`.
- `GET /subscription` (bearer device token) → `{name, active, plan, bytes_per_month, max_streams}`. `name` is added to the four documented fields because the relay routes by it. An unlinked device gets `401` at once.
- Account: `GET /devices`, `PATCH /devices/{id} {display_name}`, `DELETE /devices/{id}` (revokes the token and every consent, clears the TXT record), `GET /consents`, `DELETE /consents/{id}`. Pages: `/office/link`, `/office/consent`, `/office/device`, `/office/devices`.
- `POST /stripe/webhook`: Stripe signature (`OFFICE_STRIPE_WEBHOOK_SECRET`, 5 minutes tolerance); `customer.subscription.created|updated|deleted` set the plan through `OFFICE_STRIPE_PRICE_PLANS`. `503` while unconfigured.

Rate limits (atomic counter in `office_rate_limits`, fail closed with `503`): authorize 60/min, token 60/min, device start 20 per 10 min, device approve 10 per person and 20 per address per 10 min, pairing confirm 10 per person and 20 per address per 10 min, poll 40/min, DNS 30 per 10 min per device, subscription 30/min per device. Every path that withdraws access (unlink, consent revoke) takes effect on the next request.

Audit (`office_audit`, no raw IPs, no secrets, no TXT values): `oidc_authorize`, `oidc_login`, `oidc_device_login`, `oidc_code_reuse`, `oidc_bad_verifier`, `oidc_bad_redirect`, `oidc_consent_granted|denied`, `oidc_device_approved|denied`, `link_confirmed`, `link_collected`, `dns_set|cleared|refused`, `device_renamed|unlinked`, `consent_revoked`, `subscription_changed`.
