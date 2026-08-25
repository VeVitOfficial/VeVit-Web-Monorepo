# Databázové migrace

Migrace se spouštějí proti zálohované PostgreSQL databázi v číselném pořadí.
Nejsou součástí `schema.sql`, protože ten soubor obsahuje historický seed a není
bezpečný pro opakované použití v produkci.

## Task 0.2

```bash
psql "$DB_DSN" -v ON_ERROR_STOP=1 -f migrations/202607290001_checkout_snapshot_up.sql
```

Před spuštěním vytvořte ověřenou databázovou zálohu. Rollback souborem
`202607290001_checkout_snapshot_down.sql` je přípustný pouze před vytvořením
prvního snapshotu; po reálných objednávkách obnovujte databázi ze zálohy.

## Task 0.3

Před spuštěním nové grantové migrace nejprve proveďte dry-run report starých
tokenů, potom zálohu a teprve následně migraci. Staré raw tokeny se záměrně
invalidují a nejsou migrovány.

```bash
psql "$DB_DSN" -v ON_ERROR_STOP=1 -f migrations/202607290002_legacy_download_token_report.sql
psql "$DB_DSN" -v ON_ERROR_STOP=1 -f migrations/202607290002_order_access_and_download_grants_up.sql
```

## Task 0.4

Tato skupina obsahuje tři kroky v přesném pořadí. Před každým krokem ověřte zálohu.

### Krok 1 — Rozšíření enumu (musí proběhnout a commitnout samostatně)

Pokud `store_orders.status` je PostgreSQL enum typ `order_status`, musíte jej
nejdříve rozšířit o nové hodnoty. `ALTER TYPE ADD VALUE` nesmí být ve stejné
transakci, ve které se nová hodnota poprvé použije.

Na databázích s VARCHAR + CHECK constraint je tato migrace automaticky no-op.

```bash
psql "$DB_DSN" -v ON_ERROR_STOP=1 -f migrations/2026072900025_order_status_enum_up.sql
```

Soubor nemá `BEGIN`/`COMMIT` — každý příkaz se commituje samostatně.

### Krok 2 — Preflight report (pouze pro čtení)

Duplicity Stripe identifikátorů musí být vyřešeny vědomě před hlavní migrací.

```bash
psql "$DB_DSN" -v ON_ERROR_STOP=1 -f migrations/202607290003_preflight_report.sql
```

### Krok 3 — Payments and inventory migration

```bash
psql "$DB_DSN" -v ON_ERROR_STOP=1 -f migrations/202607290003_payments_and_inventory_up.sql
```

Migrace staré objednávky automaticky neoznačuje jako zaplacené. Používá stav
`legacy_unknown`, přidává unikátní vazbu snapshot–objednávka, Stripe event
ledger, skladové pohyby a digitální entitlementy. Kontrola kladného množství je
`NOT VALID`: platí pro nové řádky, ale nezablokuje migraci kvůli historickému
nekonzistentnímu řádku, který vypíše preflight.

CHECK constraint nad `store_orders.status` je na enum sloupci technicky
redundantní (enum sám omezuje hodnoty), ale je ponechán jako explicitní
business-level dokumentace povolených stavů.

### Rollback Task 0.4

Down migraci payments/inventory používejte pouze před prvním novým payment eventem.
Po reálné platbě by odstranila auditní důkazy; bezpečný rollback je obnova celého
PostgreSQL backupu a předchozí verze aplikace v jednom servisním okně.

Enum hodnoty (`pending_checkout`, `awaiting_payment`, `manual_review`) nelze
odstranit přes `ALTER TYPE DROP VALUE` — PostgreSQL tuto operaci nepodporuje.
Rollback enumu vyžaduje buď obnovu ze zálohy, nebo ruční rekonstrukci typu
(viz `2026072900025_order_status_enum_down.sql`). Nespouštějte automatický
down skript — soubor obsahuje pouze varovný NOTICE.

## Customer agenda (202607300002)

`202607300001_customer_agenda_preflight.sql` je ručně spouštěný read-only
report, nikoliv migrace. Migration runner jej záměrně odmítne.

1. Zastavte změnový provoz a vytvořte ověřenou point-in-time zálohu.
2. Ručně spusťte report a uložte celý výstup:

   ```bash
   psql "$DB_DSN" -X -v ON_ERROR_STOP=1 \
     -f migrations/202607300001_customer_agenda_preflight.sql
   ```

3. Ověřte nulové kolize názvů, 32znaková hex public ID, 64znakové hash grantů,
   kladná množství a skutečnou PDO roli/RLS režim.
4. Aplikujte změnu právě jednou verzovaným runnerem:

   ```bash
   VEVIT_STORE_MIGRATION_DSN="$DB_DSN" \
   VEVIT_STORE_MIGRATION_DB_USER="$DB_USER" \
   VEVIT_STORE_MIGRATION_DB_PASS="$DB_PASS" \
   php bin/migrate.php migrations/202607300002_customer_agenda_up.sql
   ```

Runner uloží SHA-256 souboru do `store_schema_migrations`. Druhý běh se stejným
checksumem vrátí `SKIPPED`; změněný již aplikovaný soubor způsobí chybu. Slepé
druhé spuštění DDL přes `psql` není podporované a nesmí se používat k maskování
částečně aplikovaného schématu.

### Supabase/RLS gate

Migrace zapne RLS, odebere práva `PUBLIC` a podmíněně odebere tabulková i
sekvenční práva existujícím rolím `anon` a `authenticated`; nevytvoří žádnou veřejnou policy. PHP používá přímé PDO a musí
se připojovat rolí, která tabulky vlastní, nebo samostatnou minimálně oprávněnou
serverovou rolí s vědomě schváleným `BYPASSRLS`. Aplikace se nepřipojuje pomocí
Supabase `anon`, `authenticated` ani API `service_role` secretu. Produkční roli
je nutné ověřit dotazem z preflightu před aplikací migrace.

### Rollback a restore

`202607300002_customer_agenda_down.sql` je pouze nouzový guard pro úplně prázdné
nové tabulky. Jakmile existuje jediný zákaznický, favorite nebo auditní řádek,
odmítne pokračovat. Produkční rollback je obnovení ověřené databázové zálohy a
předchozí verze aplikace v jednom servisním okně. Samotný rollback PHP bez
obnovy databáze nesmí vést k fyzickému mazání nové historie.
