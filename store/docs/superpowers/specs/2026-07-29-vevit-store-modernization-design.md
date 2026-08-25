# VeVit Store — bezpečná modernizace e-commerce

**Datum:** 29. 7. 2026
**Stav:** Schválený návrhový podklad; bezpečnostní Release 0 Tasky 0.1–0.4 jsou implementované, produkční nasazení čeká na Task 0.5
**Vstup:** [audit repozitáře](../../audits/2026-07-29-repository-audit.md)

## Cíl

Rozšířit současný PHP/PostgreSQL e-shop bez přepisu funkčního jádra do
bezpečného, modulárního a nasaditelného obchodu pro B2C i B2B. Produkce zůstává
kompatibilní s běžným WEDOS hostingem: Apache, PHP, PostgreSQL a statické assety;
nevyžaduje běžící Node.js ani Docker.

Nejdříve se opraví platební, objednávkový a download tok. Až poté přijdou
migrace, katalogový model, filtry a vizuální vrstva. Žádná etapa nesmí měnit
historické objednávky ani odstraňovat existující produkty, kategorie nebo
uživatele.

## Schválený vizuální směr

Uživatel potvrdil variantu **„klidný prémiový VeVit“**. Vizuální rozhodnutí je
podklad pro Etapu 5, nikoli důvod odložit bezpečnostní opravy.

- tmavé pozadí `#111312` až `#151716` a tři až čtyři klidné povrchové úrovně;
- primární akcent `#4EDEA3`; sytější zelená jen pro hlavní CTA a úspěšné stavy;
- radius: 10–16 px ovládací prvky/karty, 14–20 px velké panely a modaly,
  pill pouze pro štítky a filtry;
- měkké stíny, subtilní border, omezené sklo v navigaci a overlay panelech;
- bez posunutých hard-shadow efektů, neonových ploch a plošných agresivních
  gradientů;
- Plus Jakarta Sans může zůstat, pokud bude self-hosted nebo v produkčním asset
  balíku; text zůstane česky;
- respektovat `prefers-reduced-motion`, klávesnici a kontrast WCAG 2.1 AA.

Vizuální podklad a volba jsou uchovány lokálně v `.superpowers/` (adresář je
ignorovaný Git). Nejde o produkční asset.

## Architektonické principy

1. **Server je zdroj pravdy.** Klient nikdy neurčuje cenu, slevu, sklad,
   dostupnost, oprávnění ani objednávkový stav.
2. **Dopředné migrace.** Každá migrace má pořadové číslo, checksum, transakční
   provedení, preflight a písemný restore postup. Neprovádí se `DROP` ani změna
   významu existujícího sloupce v jedné operaci.
3. **Jedna doménová služba pro každé pravidlo.** Checkout, webhook a ruční admin
   změna volají stejné transakční služby; nepřepisují obchodní logiku v endpointu.
4. **Veřejné a interní údaje jsou striktně oddělené.** Dodavatel, nákupní cena,
   supplier SKU, poznámky a audit nejsou součástí veřejného SELECTu ani API.
5. **Nejmenší nutný stack.** PHP partialy + modulární vanilla JS + předem
   zbuilděné CSS; Composer nebo Node mohou běžet pouze při vývoji/build procesu,
   jejich výsledné soubory se nasadí na hosting.
6. **Zpětná kompatibilita přes adaptační vrstvu.** Staré `category_id`, `brand`
   a `stock` se čtou, dokud data nejsou migrována a nové čtení není otestované.

## Cílové moduly

| Modul | Odpovědnost | Veřejný přístup |
|---|---|---|
| `lib/config.php`, `lib/http.php`, `lib/session.php` | konfigurace, chyby, bezpečné hlavičky, request/response, session | nepřímý |
| `lib/catalog/` | produkty, strom kategorií, značky, filtry a bezpečné query building | ano, přes stránky/API |
| `lib/orders/` | normalizace košíku, cenový snapshot, objednávky, zásoby, stavový automat | ano, přes kontrolované endpointy |
| `lib/payments/` | Stripe klient, checkout session, signed webhook, idempotence | pouze endpointy |
| `lib/downloads/` | hashované capability tokeny, limity a bezpečná storage boundary | ano, ověřený token |
| `lib/admin/` | role, policy, audit log, formuláře a validace | pouze administrace |
| `lib/b2b/` | poptávky, attachment metadata, stavový automat | veřejný formulář + admin |
| `assets/` | zbuilděné CSS a malé JS moduly bez inline handlerů | ano |

Moduly se budou přidávat postupně. Přesun kódu sám o sobě nesmí změnit URL ani
datový formát bez kompatibilního přechodu.

## Okamžité opravy versus rozsah verzí

### Musí být opraveno okamžitě (Etapa 0)

- jedna validovaná sada aktivních položek pro Stripe i `store_order_items`;
- serverová kontrola množství, skladu a digitálního typu;
- náhodný veřejný identifikátor objednávky a přístup pouze přes session vlastníka
  nebo ověřený jednorázový capability token;
- hashované download tokeny a soubory mimo web root;
- fail-closed podpis Stripe webhooku, tolerance času, evidence event ID a
  atomický přechod stavu;
- jeden idempotentní skladový pohyb na zaplacenou objednávku;
- odstranění detailu interní chyby z odpovědí, cookie/session hardening,
  endpointové CORS/metody/CSRF;
- oprava syntaxe `assets/js/store.js` a admin chyb nalezených v auditu;
- regresní testy těchto scénářů.

### Technický dluh (Etapy 1–2)

- jednotná konfigurace a error handling;
- verzované migrace, idempotentní taxonomy seed a dokumentace PostgreSQL;
- odstranění Tailwind Play CDN, duplikované hlavičky/patičky a inline handlerů;
- odložený/odstraněný mrtvý `assets/js/store.js` podle skutečného použití;
- stránkování administrace a konzistentní validace formulářů.

### Nutné pro spuštění rozšířeného obchodu (Etapy 3–5)

- značky, varianty, nabídky dodavatelů, sklady a dostupnost;
- strom kategorií a produkt–kategorie; atributy a facety;
- serverově revalidovaný košík, doprava podle dat, firemní checkout;
- B2B poptávky, zabezpečené přílohy, administrace a audit log;
- přístupné komponenty, metadata, sitemap a robots.

### Pozdější verze

- automatická synchronizace dodavatelských feedů;
- automatizované registry IČO/DIČ bez potvrzeného poskytovatele;
- veřejné recenze s moderací;
- e-mailový marketing, doporučování a pokročilá analytika;
- lokalizace mimo češtinu.

## Bezpečný objednávkový a platební tok

```text
Košík (nedůvěryhodný JSON)
  -> normalizace ID + qty + varianty
  -> transakční načtení aktivních prodejných SKU
  -> kontrola skladu / backorder / cen a dopravy
  -> cenový snapshot do order_items
  -> pending objednávka s public UUID v session
  -> Stripe Session s idempotency key
  -> podepsaný webhook
  -> evidence event_id + atomický pending -> paid
  -> jeden stock movement na fyzickou položku
  -> autorizovaná success stránka / hashovaný download capability token
```

### Objednávková identita a přístup

- `order_number` zůstane lidsky čitelné pro podporu, ale nebude autorizovat.
- `public_id` bude náhodné UUID nebo 32bytový URL-safe token; není sekvenční.
- Guest success stránka ověří, že `public_id` odpovídá pending order grant v PHP
  session. Přihlášený zákazník musí odpovídat `orders.user_id`.
- E-mailový přístup se zavede až s potvrzeným SMTP. Použije samostatný hashovaný,
  časově omezený token, ne číslo objednávky.
- Download capability se generuje 32 náhodnými byty, do DB se ukládá jen SHA-256
  hash. Token se zobrazí výhradně autorizovanému paid zákazníkovi.

### Stripe a stavový automat

- webhook bez konfigurovaného secretu vrátí 503; nezpracuje payload;
- akceptuje se pouze ověřený event, jehož `id` ještě není v `store_webhook_events`;
- `checkout.session.completed` musí souhlasit s uloženým `stripe_session_id`,
  měnou, cenou a očekávaným payment stavem;
- přechod `pending -> paid` je podmíněný SQL update v transakci;
- sklad se mění přes append-only `store_stock_movements` s unikátním
  `(order_item_id, kind)`; duplicate event nemá co odečíst;
- refund provede vlastní jednorázový return movement až po obchodním rozhodnutí
  o skutečném vrácení zboží; automaticky nepředpokládá fyzické naskladnění.

## Cílový datový model

Všechny změny jsou dopředné; tabulky mají `created_at`, relevantní `updated_at`,
cizí klíče a indexy pro reálné filtry. Názvy níže jsou závazné pro plán.

### Stávající tabulky rozšířené kompatibilně

#### `store_categories`

Zachovat `id`, `name`, `slug`, `icon`, `sort_order`, `parent_id`; přidat
`description`, `image_path`, `is_active`, `seo_title`, `seo_description`,
`created_at`, `updated_at`. Strom se čte pomocí rekurzivního CTE; nepoužije se
PostgreSQL extension `ltree`, aby instalace fungovala na běžném hostingu.

#### `store_products`

Zachovat všechna data. Přidat `sku`, `brand_id`, `product_kind`,
`stock_status`, `warehouse_country`, `dispatch_time_min`, `dispatch_time_max`,
`delivery_time_min`, `delivery_time_max`, `allow_backorder`, `restock_date`,
`is_new`, `is_recommended`, `free_shipping`, `tax_rate`, `updated_at`.

Textový `brand`, `category_id` a `stock` zůstávají ve čtecí kompatibilitě,
dokud migrační ověřovací report nepotvrdí převod do `store_brands`,
`store_product_categories` a `store_inventory_levels`.

#### `store_orders` a `store_order_items`

Přidat `public_id`, `checkout_grant_hash`, `payment_status`, `company_name`,
`company_id`, `vat_id`, `contact_phone`, `billing_address`, `shipping_method`,
`shipping_total`, `discount_total`, `subtotal`, `tax_total` a auditní timestamps.
Na order item přidat snapshot varianty/SKU, brand, tax rate, fulfillment data a
`download_token_hash`; původní raw `download_token` se migruje s vynucenou
expirací a poté se přestane číst.

### Nové tabulky

| Tabulka | Účel | Klíčová pravidla |
|---|---|---|
| `store_schema_migrations` | pořadí a SHA-256 checksum migrací | migrace se aplikuje právě jednou |
| `store_brands` | veřejné značky | unikátní slug, `is_verified` neznamená partnerství, `is_active` |
| `store_product_categories` | M:N produkt–kategorie | unikátní `(product_id, category_id)`, `is_primary` pouze jednou na produkt |
| `store_suppliers` | interní dodavatelé | žádný veřejný SELECT/API |
| `store_warehouses` | české a EU sklady | země ISO 3166-1 alpha-2, interní aktivita |
| `store_supplier_offers` | více nabídek na produkt/variantu | interní cena, MOQ, lead time, supplier SKU |
| `store_product_variants` | prodejné SKU varianty | unikátní SKU, cena/sleva/obrázek/dostupnost může přepsat produkt |
| `store_attribute_definitions` | definice filtrů | typ `select|number|boolean|text`, jednotka, public filter flag |
| `store_attribute_options` | volby select atributu | unikátní option slug v atributu |
| `store_category_attribute_assignments` | atributy platné v kategorii | pořadí, required/filterable |
| `store_product_attribute_values` | hodnoty produktu nebo varianty | přesný typ hodnoty validuje služba |
| `store_inventory_levels` | aktuální zásoba produktu/varianty ve skladu | právě jeden target: product nebo variant |
| `store_stock_movements` | neměnná historie rezervací/odečtů/vratek | idempotency unikát pro zdrojovou událost |
| `store_wishlists` | wishlist přihlášeného uživatele | unikátní `(user_id, product_id, variant_id)` |
| `store_b2b_inquiries` | B2B formuláře a stav | stavový automat a PII retention |
| `store_b2b_inquiry_items` | produkty/množství poptávky | snapshot názvu a SKU |
| `store_b2b_attachments` | metadata bezpečných příloh | fyzický soubor mimo web root |
| `store_webhook_events` | idempotence Stripe eventů | unikátní `provider,event_id` |
| `store_audit_log` | admin bezpečnostní audit | actor, akce, subject, request correlation ID |

### Indexy a query strategie

- btree: aktivita/slugs, parent/sort, brand, primary category, dostupnost,
  warehouse country, product/variant SKU, order public ID, webhook event ID;
- kombinované indexy: `(is_active, stock_status)`, `(brand_id, is_active)`,
  `(warehouse_id, product_id)`, `(order_id, id)`;
- search: PostgreSQL `to_tsvector('simple', ...)` a GIN index až po ověření
  verze a reálných dat; do té doby parametrizované `ILIKE` s minimální délkou
  hledaného dotazu;
- facety se počítají jen pro aktuální výsledek; bez N+1 a bez interpolace vstupu
  do SQL.

## Migrace a obnova

### Struktura

```text
database/
  migrations/
    202607290001_create_schema_migrations.sql
    202607290002_harden_orders_and_webhooks.sql
    202607290003_extend_categories_and_brands.sql
    202607290004_catalog_supply_inventory.sql
    202607290005_variants_attributes_wishlist_b2b.sql
  seeds/
    202607290001_catalog_taxonomy.sql
    202607290002_catalog_brands.sql
bin/
  migrate.php
  preflight-migration.php
  verify-migration.php
```

### Protokol nasazení migrace

1. Záloha databáze ověřená obnovou do testovací instance.
2. `bin/preflight-migration.php` zkontroluje PostgreSQL verzi, volné místo,
   neexistenci duplicit a očekávaný počet řádků.
3. Web se přepne do krátkého maintenance režimu pouze pro Etapu 0, pokud změna
   checkoutu vyžaduje atomické nasazení kódu a DB.
4. `bin/migrate.php --dry-run`, pak `bin/migrate.php`; runner obaluje každou
   migraci transakcí a zapíše checksum.
5. `bin/verify-migration.php` porovná počty produktů, kategorií a objednávek
   před/po; ověří FK a nový čtecí path.
6. Po smoke testu se maintenance režim ukončí.

Rollback není automatický SQL `DOWN` skript pro datové migrace. Bezpečný postup
je obnovit ověřený snapshot DB a vrátit poslední nasazený release. Přídavné
sloupce/tabulky jsou proto nejdříve nepoužívané; změna čtení se aktivuje až v
dalším release. Tento expand–migrate–switch–contract postup snižuje riziko.

## Autentizace VeVit účtu

Aktuální přímé ověřování `users.password` je přechodné a nesmí být rozšiřováno.
Fáze 0 jen izoluje lokální session a zabrání úniku hesel; nezavádí domnělé SSO.

Pro skutečné centrální přihlášení jsou nutné: authorize URL, token endpoint nebo
introspection URL, formát claims, client ID, klientské tajemství/PKCE pravidla,
callback URL, allowed origins, cookie doména a testovací účet. Po dodání se
navrhne Authorization Code + PKCE nebo jiný explicitně potvrzený VeVit flow.
Dokud tyto údaje nejsou k dispozici, zůstane bezpečný fallback „pokračovat jako
host“ a účet nebude vydáván za SSO.

## Produkční assety a šablony

1. Přidat Tailwind input/config, který skenuje PHP/HTML/JS; v CI nebo lokálním
   build kroku vytvoří `assets/dist/store.css`.
2. Do repozitáře a deploy balíku patří výsledný CSS soubor; WEDOS jen servíruje
   statiku. Node není runtime závislost.
3. `lib/layout.php` nebo ekvivalent sestaví `<head>`, bezpečné metadata, skip
   link, globální dialog root a asset manifest. `lib/header.php`/`footer.php`
   se postupně zmenší na společné komponenty.
4. `index.html` se při redesignu nahradí `index.php`, aby sdílela session,
   metadata a komponenty. Stará URL `/` zůstane stejná přes `DirectoryIndex`.
5. Inline JS se rozpadne na `assets/js/modules/` a init soubory. HTML se skládá
   přes `textContent` a `addEventListener`, ne přes inline `onclick`.

## Katalog a filtry

Veřejná stránka katalogu používá HTML GET formulář a URL jako zdroj stavu.
Parametry jsou allowlistované a normalizované: `q`, `category`, `brand`, `type`,
`min_price`, `max_price`, `availability`, `warehouse_country`, `in_stock`,
`sale`, `rating`, `free_shipping`, `new`, `recommended`, `sort`, `page` a
`attr[slug][]`. Neznámé nebo chybné parametry se ignorují nebo vrátí 400 pro API;
nikdy se neinterpolují do SQL.

Stromová kategorie znamená filtr zvolené kategorie i všech potomků přes
rekurzivní CTE. Facety se vyhodnocují nad stejným base query a vracejí počty. Na
desktopu je levý sbalitelný panel, na mobilu přístupný dialog/drawer s počtem
výsledků. Aktivní filtry jsou odkazy/chips, které odstraní jediný parametr,
zatímco „Vymazat vše“ vytvoří čisté URL.

## Přístupnost, SEO a výkon

- skip link, viditelný focus, label pro každé pole, chybové texty spojené přes
  `aria-describedby`, dialog focus trap/return focus, Escape a reduced motion;
- navigace/mega menu: button + `aria-expanded`, arrow keys pouze kde přinášejí
  hodnotu, click outside bez rozbití klávesnice;
- canonical na produkt/kategorii/značku; filtrované query URL `noindex,follow`
  kromě schválených landing filtrů; XML sitemap a robots;
- JSON-LD Product, BreadcrumbList, Organization, WebSite/SearchAction z dat,
  která jsou skutečně dostupná; žádná fiktivní recenze nebo certifikace;
- obrázky s explicitními rozměry, WebP/AVIF podle dodaných zdrojů, lazy loading
  mimo první viewport; CSS/JS cache headers a malé moduly.

## Předpoklady a otevřené vstupy

| Oblast | Předpoklad návrhu | Co chybí k ověření |
|---|---|---|
| PostgreSQL | externí PostgreSQL je dostupná z WEDOS PHP s `pdo_pgsql` | tarif, PHP extension, verze DB, síťový allowlist |
| Stripe | Checkout zůstane platební branou | test keys, webhook secret, povolené metody, refund politika |
| VeVit účet | bude poskytovat ověřitelný central auth contract | URL, OAuth/token pravidla, claims, callback, test účet |
| Soubory | digitální data a B2B přílohy půjdou mimo web root | skutečný WEDOS writable path / object storage rozhodnutí |
| E-mail | download/recovery odkazy se neposílají bez provideru | SMTP/provider, šablony, sender doména |
| Doprava | ceny a termíny jsou datově řízené, ne tvrzené v UI | dopravci, sazby, země, SLA, DPH |
| Produkty | značky nejsou partneři bez důkazu | schválená data, licence obrázků, dokumenty a certifikace |

## Akceptační hranice celé modernizace

Obchod lze označit za připravený k produkci až když:

1. kritické scénáře z Etapy 0 mají regresní testy a signed Stripe test webhook;
2. migrace je dry-run, apply a verify otestovaná na kopii produkčních dat;
3. každý veřejný produkt má pravdivou dostupnost z dat;
4. žádný veřejný endpoint neposkytuje dodavatelské interní údaje;
5. katalog, detail, košík, checkout a B2B formulář projdou desktop/mobile a
   keyboard smoke sadou;
6. nasazený WEDOS build je ověřený na cílové PHP/PostgreSQL konfiguraci;
7. VeVit SSO je buď prokazatelně integrováno, nebo je UI přesně označené jako
   lokální/host checkout bez nepravdivého tvrzení.
