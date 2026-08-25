# Konfigurace VeVit Store

## Umístění tajné konfigurace

Zkopírujte [config.example.php](../../config.example.php) jako
`config_secret.php` vedle `config.php`. Současný bootstrap tuto cestu vyžaduje;
Apache ji blokuje pravidlem `.htaccess`. Přesun mimo web root nebo načítání z
prostředí je možný až po samostatné úpravě loaderu. Soubor nesmí být v Gitu,
zálohách přístupných zákazníkům ani ve frontendovém JavaScriptu.

## Povinné hodnoty při spuštění aplikace

| Konstanta | Význam | Bezpečné pravidlo |
|---|---|---|
| `APP_ENV` | `development`, `staging`, `production` nebo `test` | produkci nastavujte explicitně |
| `APP_URL` | kanonická veřejná URL | v produkci pouze HTTPS |
| `APP_STORAGE_PATH` | existující čitelný a zapisovatelný adresář mimo veřejný web root | nesmí být symlink ani uvnitř adresáře aplikace; režim `0700` |
| `DB_DSN` | PostgreSQL PDO DSN | musí začínat `pgsql:` |
| `DB_USER`, `DB_PASS` | účet DB s minimálními právy | nikdy neposílat klientovi |
| `SESSION_NAME` | název PHP session cookie | pouze písmena, čísla, `_` a `-` |
| `SESSION_COOKIE_SECURE` | příznak Secure cookie | v produkci vždy `true` |
| `SESSION_COOKIE_SAMESITE` | `Lax` nebo `Strict` | nepoužívat `None` bez ověřené cross-site potřeby |
| `ADMIN_PASSWORD_HASH` | hash pro současné administrační přihlášení | vytvořit přes `password_hash()`, nikdy necommitovat |
| `CASE_ATTACHMENT_MAX_BYTES` | limit jednoho souboru, výchozí 10 MiB | musí odpovídat PHP/Apache upload limitu |
| `CASE_ATTACHMENT_MAX_FILES` | maximum aktivních příloh jednoho případu | 1–20 |
| `CASE_ATTACHMENT_ALLOWED_MIME` | serverový allowlist MIME | pouze JPEG, PNG, WebP a PDF |
| `RETURN_REQUEST_DAYS` | interní obchodní okno žádosti | není právním tvrzením; potvrďte s obchodem |
| `ADMIN_REAUTH_SECONDS` | okno recent admin authentication | 60–3600 sekund |
| `TRACKING_CARRIER_ORIGINS_JSON` | JSON mapování kódu dopravce na HTTPS origin | cizí tracking URL se nevykreslí |

Legacy kombinace `DB_HOST`, `DB_PORT` a `DB_NAME` je dočasně podporovaná pro
kompatibilitu s aktuálním projektem. Nové nasazení má používat `DB_DSN`.

## Konfigurace Stripe

`STRIPE_SECRET_KEY` a `STRIPE_WEBHOOK_SECRET` jsou povinné pro payment a webhook
endpointy; bez nich endpointy selžou uzavřeně. Volitelné `STRIPE_ACCOUNT_ID`
omezuje webhook na konkrétní Stripe účet (`acct_...`) u Connect/platformového
nasazení. Nezapisujte testovací ani produkční klíče do `config.example.php`.

## CORS a proxy

`STORE_ALLOWED_ORIGINS` je čárkami oddělený seznam přesných originů. Prázdná
hodnota znamená same-origin provoz; nepoužívejte `*` pro endpointy se session.
Trusted proxy pravidla se nepředpokládají, dokud nejsou výslovně dodány síťové
CIDR adresy a způsob ukončení TLS.

## Lokální ověření bez produkčních tajemství

1. Vytvořte izolovanou testovací PostgreSQL databázi a účet.
2. Nastavte `APP_ENV=development`, lokální `APP_URL`, `SESSION_COOKIE_SECURE=false`
   a dočasnou cestu `APP_STORAGE_PATH` mimo document root.
3. Zkopírujte hodnoty do neveřejného `config_secret.php`.
4. Ověřte `php -m | rg pdo_pgsql`; bez rozšíření aplikaci proti PostgreSQL
   nespouštějte.
5. Spusťte `bash tests/run-task-0-1.sh` a potom PHP server pouze pro lokální
   smoke test.

## Checkout snapshot a PostgreSQL test

Před nasazením Tasku 0.2 proveďte ověřenou zálohu a spusťte aditivní migraci:

```bash
psql "$DB_DSN" -v ON_ERROR_STOP=1 -f migrations/202607290001_checkout_snapshot_up.sql
```

Integrační test nesmí používat produkční databázi. Vyžaduje samostatný název
databáze obsahující `test` a proměnné `VEVIT_STORE_TEST_DSN`,
`VEVIT_STORE_TEST_DB_USER`, `VEVIT_STORE_TEST_DB_PASS`:

```bash
php tests/integration/checkout-snapshot-postgres-test.php
```

Test předpokládá, že testovací databáze už obsahuje základní tabulky projektu.
Bez těchto proměnných se test označí jako `SKIP`; není tím potvrzena funkčnost
PostgreSQL transakce.

## Platební integrační test Tasku 0.4

Izolovaný Docker test (Docker není produkční závislost) spustíte takto:

```bash
docker network create vevit-task04-net
docker run --rm -d --name vevit-task04-postgres --network vevit-task04-net \
  -e POSTGRES_DB=vevit_store_test -e POSTGRES_USER=vevit_test \
  -e POSTGRES_PASSWORD=test-only-password postgres:16-alpine
docker build -t vevit-task04-php tests/docker/php-postgres
docker run --rm --network vevit-task04-net -v "$PWD:/app" -w /app \
  -e 'VEVIT_STORE_TEST_DSN=pgsql:host=vevit-task04-postgres;port=5432;dbname=vevit_store_test' \
  -e VEVIT_STORE_TEST_DB_USER=vevit_test \
  -e VEVIT_STORE_TEST_DB_PASS=test-only-password \
  vevit-task04-php bash tests/run-task-0-4.sh
```

Stejnou sadu spouští workflow `.github/workflows/task-0-4-postgres.yml`.

## Bezpečné selhání

Chybějící nebo neplatná kritická konfigurace vrátí zákazníkovi pouze
„Služba je dočasně nedostupná.“ Detail se zapisuje do serverového error logu.
Neopravujte problém přidáním výchozích produkčních hostů, hesel nebo Stripe
klíčů do kódu.

## Privátní přílohy

`APP_STORAGE_PATH` musí být absolutní, existující, zapisovatelný adresář mimo
document root, nesmí být symlink a musí mít režim bez group/world přístupu
(doporučeno `0700`). Aplikace vytváří podadresáře `0700` a soubory `0600`.
Výchozí Apache limity v `.htaccess` jsou 10 MiB/11 MiB; při jiné hodnotě
`CASE_ATTACHMENT_MAX_BYTES` je upravte v panelu hostingu. Přílohy se nikdy
nezpřístupňují statickou URL.

Doporučená retence: revokovaný/soft-deleted objekt nejprve ponechat pro audit,
poté jej odstranit samostatným, evidovaným cleanup jobem až po obchodně a právně
schválené retenční době. Tento release automatický retenční job nespouští.

## Blokující deployment kontroly

- produkční PostgreSQL role PHP a její RLS chování musí být potvrzeny;
- serverový kontrakt VeVit Account není dokončen, proto account seznamy a
  favorites zůstávají fail-closed;
- sdílené admin heslo je pouze legacy režim, nikoli individuální RBAC;
- automatický Stripe refund a důvěryhodný import refund evidence nejsou součástí
  tohoto releasu; potvrzení refundu zůstává fail-closed.
