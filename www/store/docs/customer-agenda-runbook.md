# Customer agenda — implementační a provozní runbook

Tento release je modulární PHP monolit nad přímým PostgreSQL PDO připojením.
Nevytváří druhé objednávkové jádro a automaticky nic nenasazuje na Supabase.

## Bezpečné pořadí databázových kroků

1. Zastavit změnový provoz a ověřit obnovitelnou point-in-time zálohu.
2. Ručně spustit read-only
   `migrations/202607300001_customer_agenda_preflight.sql` a uložit výstup.
3. Vyřešit všechny kolize názvů a anomálie. Ověřit skutečnou PHP DB roli,
   její grants a `BYPASSRLS`/owner chování.
4. Spustit `bin/migrate.php` pouze pro
   `migrations/202607300002_customer_agenda_up.sql`. Runner eviduje SHA-256,
   stejný soubor podruhé přeskočí a checksum drift odmítne.
5. Spustit PostgreSQL, HTTP a security gate proti izolované testovací DB.
6. Teprve v samostatném schváleném deployment tasku nasadit PHP a vytvořit
   privátní storage root. Tento repozitář produkční migraci nespouští.

Guarded down soubor je přípustný jen pro zcela prázdné nové tabulky. Po vzniku
zákaznických nebo auditních dat se používá obnova ověřené zálohy; běžný admin
nemá fyzické mazání případů ani historie.

## Veřejná aplikační rozhraní

- Claims: `ClaimService` — create, customer detail/list, message, admin state
  transition.
- Returns: `ReturnService` — business window, create, detail/list, message,
  received/inspected quantities a admin state transition. Refund confirmation
  bez uložené provider evidence zůstává fail-closed.
- Delivery: `DeliveryService` — více zásilek, item mapping, create, tracking,
  customer detail a state transition. Nemění platbu.
- Attachments: `AttachmentService` a `LocalPrivateStorage` — parent
  authorization, metadata, privátní upload/download a cleanup.
- Favorites: `FavoriteService` — account-only add/remove/list; do dokončení
  Account kontraktu fail-closed.
- Admin: `AdminMutationService` — jediný vstup pro claim/return/delivery
  mutace a vytvoření zásilky.

Zákaznické endpointy jsou v `api/claims`, `api/returns`, `api/delivery`,
`api/attachments` a `api/favorites`. Admin endpointy jsou v `api/admin`.
Controllers ověřují HTTP metodu, origin, CSRF, rate limit a actor context;
business SQL ani transakce v nich nejsou.

## HTML stránky

- `orders.php`, `order.php`
- `claims.php`, `claim.php`
- `my-returns.php`, `return.php`
- `favorites.php`
- `admin/claims.php`, `admin/returns.php`, `admin/deliveries.php`

Account seznamy a favorites zobrazují bezpečný nedostupný stav, dokud nevznikne
ověřený `VeVitAccountAuthContext`. Guest vidí pouze konkrétní order/case přes
existující hashovaný grant v serverové session. Public ID nikdy není autorizace.

## Privátní storage

`APP_STORAGE_PATH` je absolutní existující adresář mimo document root, není
symlink, je zapisovatelný a má režim bez group/world práv (`0700`). Aplikace
detekuje MIME přes `finfo`, přijímá jen nakonfigurovaný allowlist, generuje
48znakové hex storage jméno se 192 bity entropie, odmítá
executable/dangerous dvojité přípony, zapisuje atomicky a soubory nastavuje na
`0600`.
Download je POST + CSRF + parent autorizace a posílá `nosniff` a bezpečný
`Content-Disposition`. Automatický antivirus a retenční cleanup jsou navazující
provozní tasky; raw soubory, cookies, granty a tokeny se neauditují.

## Izolovaný testovací gate

Runner vyžaduje výslovný `VEVIT_STORE_TEST_DSN` s názvem databáze obsahujícím
`test`, odmítá běžné `DB_DSN` i známé Supabase hosty:

```bash
VEVIT_STORE_TEST_DSN='pgsql:host=TEST_HOST;port=5432;dbname=vevit_store_test' \
VEVIT_STORE_TEST_DB_USER='TEST_USER' \
VEVIT_STORE_TEST_DB_PASS='TEST_PASSWORD' \
bash tests/run-customer-agenda.sh
```

Gate spouští unit testy, Release 0 PostgreSQL regrese, nové schema/service/
concurrency testy, HTTP smoke, PHP lint a JavaScript syntax kontrolu. Docker je
pouze testovací nástroj, nikoli produkční závislost.

## Blokující navazující tasky

- schválit a implementovat VeVit Account serverový kontrakt;
- ověřit konkrétní produkční PDO roli a její Supabase RLS model;
- nahradit `legacy_shared_admin` individuálními admin identitami a RBAC;
- implementovat důvěryhodný Stripe refund evidence workflow;
- rozhodnout antivirus a retenční cleanup příloh;
- provést samostatný WEDOS/browser/Stripe produkční release gate.
