# Fáze 1 — produkční verifikace 2026-08-05

Spuštěny byly migrace `sso_001_sessions_lockdown`, `sso_002_api_tokens` a
`sso_004_session_cleanup`. Soubor `003_drop_plaintext_token.up.sql` je pouze
připravený a nebyl spuštěn; vyžaduje S-3.

## Relace bez odhlášení

| Kontrola | Před | Po |
|---|---:|---:|
| celkem relací | 15 | 15 |
| aktivních relací | 15 | 15 |
| revokovaných relací | 0 | 0 |
| hash odpovídá plaintext tokenu | — | 15 |
| fingerprint `id:user_id:expires_at` | `985beabfa835a1fdd92609f45bef7327` | `985beabfa835a1fdd92609f45bef7327` |

Žádná expirace ani identita relace se nezměnila. Plaintext zůstává do Fáze 5
kvůli dual-read přechodu, ale všech 15 řádků už má správný SHA-256 hash.

## RLS, granty a citlivá funkce

- `sessions`, `api_refresh_tokens` a `store_product_views`: RLS `enabled` +
  `forced`, bez policies; jediný aplikační grantee je `service_role`.
- `delete_user_account(text)`: `anon=false`, `authenticated=false`,
  `service_role=true`, `search_path=''`.
- `users.status` má povolené pouze `active`, `blocked`, `deleted`.
- Cron `vevit-session-cleanup` je aktivní denně v `03:17`.

Security Advisor má pro tři záměrně deny-all tabulky pouze informační lint
`rls_enabled_no_policy`. Jde o požadovaný model bez klientské policy; původní
ERROR/WARN nálezy pro `store_product_views` a `delete_user_account` zmizely.
