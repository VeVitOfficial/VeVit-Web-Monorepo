# Inventura konzumentů Supabase

Ověřeno 5. 8. 2026 úplným `rg --hidden --no-ignore` nad repozitářem, kontrolou
cronů a Vaultu v PostgreSQL, seznamem nasazených Edge Functions a produkčním
smoke testem. Tajné hodnoty nejsou součástí tohoto souboru.

| Konzument | Přístup | Pověření | Stav |
|---|---|---|---|
| Account PHP | PostgREST + Storage API | samostatný `account` secret key, pouze `apikey` | ověřeno live |
| Home PHP | PostgREST | samostatný `home` secret key, pouze `apikey` | ověřeno live |
| Store PHP | PostgREST pro veřejný katalog | samostatný `store` secret key, pouze `apikey` | ověřeno live |
| Edge Function `auth` | Supabase Data API | samostatný `edge_auth` secret key | ověřeno live |
| Edge Function `api` | Supabase Data API | samostatný `edge_api` secret key | ověřeno live |
| Edge Function `stripe-webhook` | Supabase Data API + Stripe read API | samostatný `stripe_webhook` secret key (`apikey`) + omezený `STRIPE_WEBHOOK_API_KEY` jen pro čtení faktur, subscriptions a Checkout Sessions | ověřeno skutečným Stripe eventem |
| Edge Function `stripe-setup` | přímé DB/Stripe prostředí | bez Supabase API key | inventarizováno |
| Edge Function `stripe-worker` | přímé DB/Stripe prostředí | aplikační worker secret + projektový Stripe key | po rotaci ověřeno HTTP 200 |
| PostgreSQL cron `stripe-sync-worker` | `pg_net` → `stripe-worker` | Vault `stripe_sync_worker_secret` jako aplikační Bearer | aktivní, ověřeno |
| Store migrace/testy | přímé PostgreSQL DSN | DB uživatel a heslo mimo webroot | pouze CLI/test, ne WEDOS runtime |

Frontendové JS/HTML/CSS nevolají Supabase přímo a nepotřebují publishable key.
V databázi není vlastní Database Webhook; tabulka `stripe._managed_webhooks`
patří Stripe integraci. Repozitář neobsahuje další deploy skript, worker ani CI
job s runtime Supabase pověřením.
