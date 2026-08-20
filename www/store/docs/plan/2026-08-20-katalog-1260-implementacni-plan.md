# Implementační plán — nasazení katalogu 1 260 položek do VeVit Store

Datum: 20. 8. 2026
Vstup: `VeVit_sourcing_master_1260_20260820.xlsx` (listy `Katalog_1260`, `Značky`,
`Ověřené_listings`, `Top_250_k_ověření`, `Metodika`)
Cíl: převést sourcingový master do prodejního katalogu `/store/` tak, aby
storefront zůstal čistě produktový — bez sourcingové stopy a bez jakéhokoli
odkazu na nákupní kanál.

---

## 0. Shrnutí rozsahu

| Metrika | Hodnota |
|---|---|
| Řádků v masteru | 1 260 (každý = značka + model + varianta, unikátní) |
| Unikátních produktových řad (značka + model) | 338 |
| Značek | 14 |
| Segmentů | 7 |
| Kategorií (surových) | 49, po normalizaci ~30 |
| Položek s nízkým compliance rizikem a prioritou 4–5 | 556 (vlna 1) |
| Položek s vysokým rizikem (pilot / EU sklad) | 624 |
| Položek „EU sklad partnera / zakázkově“ | 80 |

Rozložení značek: UGREEN 180, Baseus 180, Deli 160, ORICO 140, LDNIO 100,
M&G 100, JIECANG 80, Vention 80, Comix 60, SIHOO 60, Tenda 40, SINOART 30,
70mai 30, PETKIT 20.

**Master není katalog.** List `Metodika` sám říká, že řádek je *kandidát na
sourcing*, ne existující nabídka, a benchmark cena je skupinový orientační údaj.
Plán proto nikde nepočítá s hromadným automatickým publikováním — import končí
v neaktivním stavu a publikaci uvolňuje kurátorský krok.

---

## 1. Klíčový požadavek: storefront bez sourcingové stopy

Zadání: *„to, že jsou z Číny, nebude nikde jasně najevo“*. Překládám do
technického pravidla, které je vymahatelné testem:

> **Žádná sourcingová data se nikdy nedostanou do veřejné vrstvy.** Do
> `store_products` a do žádné veřejné odpovědi/šablony nesmí vstoupit dodavatel,
> odkaz na marketplace, nákupní cena, MOQ, compliance příznak ani jakýkoli
> řetězec typu `alibaba`, `dhgate`, `made-in-china`, `1688`, `aliexpress`,
> `sourcing`, `supplier`, `MOQ`.

Prakticky to znamená:

1. **Oddělená tabulka.** Sourcing žije v `store_sourcing_items`, ne ve sloupcích
   `store_products` (viz §3). Důvod je konkrétní: `catalog.php:59`,
   `product.php:7` a `product.php:34` dělají `SELECT p.*` — cokoli přidaného do
   `store_products` automaticky přiteče do šablonového kontextu a stačí jeden
   nepozorný `<?= ?>`, aby to bylo na stránce.
2. **Vlastní obsah.** Názvy, popisy a fotografie píšeme/vyrábíme sami v češtině.
   Nekopírovat texty z listingu (styl strojového překladu prozradí kanál) a
   nehotlinkovat obrázky z dodavatelské CDN — doména v `src` je nejrychlejší
   způsob, jak to prozradit, a je to i autorskoprávní problém.
3. **Žádné strukturované pole původu.** Do JSON-LD produktu nedávat
   `countryOfOrigin` ani `manufacturer`, dokud nejde o povinný právní údaj
   (viz níže). Nepoužívat na webu slova „dropshipping“, „import“, „přímo od
   výrobce“.
4. **Interní artefakty mimo webroot.** Zdrojový XLSX ani jeho CSV export nepatří
   do `www/`. Nginx sice `/store/(lib|migrations|tests|docs|bin|vendor)/` blokuje
   (`nginx-vevit.conf:99`), ale spoléhat se u sourcingových dat na konfiguraci
   webserveru je zbytečné riziko — patří do `vevit-private/` mimo deploy.
   Doplňkově přidat `Disallow: /store/docs/` do `robots.txt`.
5. **Guard test.** Zákaz musí selhat v CI, ne v code review — viz §10.

### Co naopak zamlčet nejde

Dvě věci držím vědomě mimo „neviditelnost“, protože jsou to zákonné povinnosti
a jejich obcházení by z obchodního rizika udělalo právní:

- **GPSR (nařízení EU 2023/988), čl. 19** — nabídka na dálku musí u výrobku
  uvádět jméno a kontaktní údaje výrobce a odpovědné osoby v EU (u dovozu tedy
  dovozce). U značek jako UGREEN nebo Baseus je výrobce čínská entita. Řešení:
  tyto údaje jdou do **samostatného bloku „Bezpečnostní a technické informace“**
  na detailu produktu (rozbalovací sekce, ne marketingový text) — splňují zákon,
  ale nejsou obsahem, který stránka komunikuje.
- **Zákaz klamavého tvrzení** — nikde neuvádět „vyrobeno v ČR/EU“, „česká
  výroba“ ani vlajku EU u zboží, kde to neplatí. Nezmiňovat původ je legální;
  tvrdit nepravdivý původ je klamavá obchodní praktika (§ 5 zákona
  č. 634/1992 Sb. / směrnice 2005/29/ES) a u celního prohlášení navíc problém.

To je jediné omezení, které do zadání vnáším; zbytek požadavku plán plní beze
zbytku.

---

## 2. Stav sekce `/store/` — co je hotové a co katalog rozbije

Stav zjištěný v repozitáři:

**Existuje:** PHP storefront (`index.html`, `catalog.php`, `product.php`,
`cart.php`, `checkout.php`), Stripe platby s inventory ledgerem
(`lib/orders/PaymentOrderService.php`), zákaznická agenda (reklamace, vratky,
doručení), admin (`admin/products.php`), verzovaný migration runner
(`bin/migrate.php`), 33 unit a 21 integračních testů.

**Nálezy, které je nutné opravit před nebo současně s importem:**

| # | Soubor | Problém | Dopad při 1 260 položkách |
|---|---|---|---|
| N1 | `api/products.php:19-24` | PostgREST větev načte `limit=1000` a filtruje/řadí v PHP | Při 1 260 aktivních produktech tiše zmizí ~260 položek; filtr i stránkování vracejí špatné výsledky |
| N2 | `api/categories.php:16-25` | Počty produktů se počítají z `limit=1000` řádků | Špatné počty u kategorií |
| N3 | `api/brands.php:10-16` | Totéž pro dlaždice značek | Špatné počty u značek |
| N4 | `admin/products.php:49` | `SELECT p.* … ORDER BY created_at` bez stránkování a bez vyhledávání | Admin načte 1 260 řádků do jedné HTML tabulky |
| N5 | `admin/products.php` | Používá výhradně `$pdo` | V režimu `postgrest` je `$pdo === null` → fatální chyba |
| N6 | `catalog.php:59`, `product.php:7,34` | `SELECT p.*` | Únikový vektor pro každý nový sloupec (viz §1) |
| N7 | `store_products` | Kromě PK a unique `slug` nemá **žádný index** | Sekvenční scany u filtrů brand/kategorie/cena |
| N8 | `catalog.php:29`, `api/products.php` | Hledání přes `ILIKE '%…%'` | Nepoužije index, ignoruje diakritiku („nabijecka“ nenajde „nabíječka“) |
| N9 | `schema.sql:104-211` | Demo strom 108 kategorií (svíčky, matcha, macramé) | Nemá průnik s reálným sortimentem, musí být nahrazen |
| N10 | `lib/helpers.php:4` | `vv_category_bg()` zná 4 slugy | 30 nových kategorií spadne na jediné výchozí pozadí |
| N11 | schéma | Neexistuje pojem varianty | 1 260 variant by se rozpadlo na 1 260 nesouvisejících karet |

---

## 3. Datový model

### 3.1 Varianty: plochý model + skupina

Doporučení: **zůstat u ploché `store_products` (1 řádek = 1 prodejní varianta)**
a doplnit skupinu. Zavádět samostatnou tabulku variant by znamenalo přepsat
košík, checkout snapshot, inventory ledger i vratky — tedy nejrizikovější a
nejlépe otestovanou část systému. Plochý model tohle celé nechává být.

```sql
-- migrations/2026xxxx_catalog_product_groups_up.sql
CREATE TABLE IF NOT EXISTS store_product_groups (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(255) NOT NULL UNIQUE,   -- ugreen-usb-c-usb-c
    name         VARCHAR(255) NOT NULL,          -- veřejný název řady
    brand        VARCHAR(100) NULL,
    category_id  INT NULL REFERENCES store_categories(id) ON DELETE SET NULL,
    description  TEXT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE store_products
    ADD COLUMN IF NOT EXISTS group_id      INT NULL REFERENCES store_product_groups(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS variant_label VARCHAR(120) NULL,  -- "100W, 2 m"
    ADD COLUMN IF NOT EXISTS variant_order INT NOT NULL DEFAULT 0;
```

338 skupin, 1 260 variant. Detail produktu pak zobrazí přepínač variant v rámci
skupiny, katalog listuje reprezentanta skupiny (nejlevnější aktivní variantu).

### 3.2 Sourcingová tabulka (interní)

```sql
CREATE TABLE IF NOT EXISTS store_sourcing_items (
    id                SERIAL PRIMARY KEY,
    product_id        INT NULL REFERENCES store_products(id) ON DELETE SET NULL,
    import_key        VARCHAR(160) NOT NULL UNIQUE,  -- hash(brand|model|variant)
    brand             VARCHAR(100) NOT NULL,
    model_line        VARCHAR(255) NOT NULL,
    variant_spec      VARCHAR(255) NULL,
    segment           VARCHAR(100) NULL,
    source_category   VARCHAR(120) NULL,
    price_tier        VARCHAR(20)  NULL,   -- Budget | Střední | Premium
    cost_benchmark    TEXT NULL,           -- surový text benchmarku z masteru
    cost_min_usd      NUMERIC(10,2) NULL,
    cost_max_usd      NUMERIC(10,2) NULL,
    moq               VARCHAR(40) NULL,
    eu_stock_status   VARCHAR(60) NULL,
    fulfilment_model  VARCHAR(80) NULL,
    compliance_risk   VARCHAR(20) NULL,
    priority          SMALLINT NULL CHECK (priority BETWEEN 1 AND 5),
    research_links    JSONB NOT NULL DEFAULT '[]'::jsonb,  -- marketplace URL
    supplier_note     TEXT NULL,
    stage             VARCHAR(24) NOT NULL DEFAULT 'candidate'
                      CHECK (stage IN ('candidate','quoted','sampled','approved','rejected','live')),
    imported_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

REVOKE ALL ON store_sourcing_items FROM PUBLIC;
ALTER TABLE store_sourcing_items ENABLE ROW LEVEL SECURITY;
```

Vazba je jednosměrná: `store_sourcing_items.product_id → store_products.id`.
Veřejný kód nemá důvod tabulku znát a přes RLS + odebraná práva na ni nedosáhne
ani omylem. Migrace následuje konvenci z `migrations/README.md` (preflight
report, verzovaný runner `bin/migrate.php`, `up`/`down` dvojice).

### 3.3 Indexy (řeší N7/N8)

```sql
CREATE INDEX IF NOT EXISTS idx_products_active_cat    ON store_products (category_id, is_active)
    WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active_brand  ON store_products (brand)
    WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_group         ON store_products (group_id, variant_order);
CREATE INDEX IF NOT EXISTS idx_products_price         ON store_products ((COALESCE(sale_price, price)));
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm     ON store_products USING gin (name gin_trgm_ops);
```

Vyhledávání přepsat na `unaccent(name) ILIKE unaccent(?)` nad trigram indexem
(imutabilní wrapper `f_unaccent()` kvůli indexovatelnosti).

---

## 4. Taxonomie a mapování kategorií

7 segmentů → **5 hlavních kategorií**, 49 surových kategorií → ~30 kanonických.

| Nová hlavní kategorie | Zdrojové segmenty | Položek |
|---|---|---|
| IT a elektronika | IT a elektronika + IT a síť | 702 |
| Škola a kancelář | Škola a kancelář | 320 |
| Kancelářský nábytek | Kancelářský nábytek | 140 |
| Auto | Auto | 48 |
| Výtvarné potřeby | Škola a vzdělávání | 30 |
| Pet | Pet | 20 |

Slučování duplicitních kategorií (surová → kanonická):

- `Kabely` + `Datové kabely` + `Audio kabely` + `Video kabely` + `Síťové kabely` → **Kabely** (podkategorie podle typu)
- `Huby` + `Huby a docking stanice` + `Docking / storage` → **Huby a dokovací stanice**
- `Power strips` + `Power strips / smart socket` + `Smart plug` → **Prodlužovací přívody a chytré zásuvky**
- `Pera` + `Pera a gelová pera` + `Psací potřeby` + `Náplně` → **Psací potřeby**
- `Sešity` + `Sešity a bloky` → **Sešity a bloky**
- `Routery a síťové prvky` + `Síťové prvky` → **Síťové prvky**

**Kolize slugů** (`store_categories.slug` je UNIQUE): `Stojany` existuje v
IT i ve Výtvarných potřebách, `Auto elektronika` v segmentu Auto i v IT. Slug
proto generovat z cesty rodiče: `it-stojany` vs `vytvarne-stojany`.

Migrace taxonomie: demo strom (`schema.sql:104-211`) **nemazat destruktivně** —
označit `is_active = FALSE` u kategorií bez produktů a nový strom vložit vedle;
demo kategorie odstranit až po ověření, že na ně nevede žádná objednávka ani
externí odkaz. Zároveň rozšířit `vv_category_bg()` (N10) o mapu 30 slugů →
pozadí, ať nové kategorie nevypadají jako jedna šedá zeď.

---

## 5. Importní pipeline

Tři fáze, každá spustitelná samostatně a idempotentní.

```
XLSX (mimo repo)  →  [1] normalize  →  sourcing.jsonl
sourcing.jsonl    →  [2] import     →  store_sourcing_items      (stage=candidate)
store_sourcing_items → [3] promote  →  store_product_groups + store_products
                                        (is_active=FALSE, is_sellable=FALSE)
```

Nové soubory:

| Soubor | Účel |
|---|---|
| `www/store/bin/sourcing-normalize.php` | XLSX/CSV → `sourcing.jsonl`, normalizace kategorií, slugů, cenových hladin, `import_key` |
| `www/store/bin/sourcing-import.php` | UPSERT do `store_sourcing_items` podle `import_key`; nikdy nesahá na `store_products` |
| `www/store/bin/catalog-promote.php` | Z `stage='approved'` položek založí/aktualizuje skupiny a produkty |
| `www/store/lib/catalog/SourcingNormalizer.php` | Čistá logika mapování (testovatelná bez DB) |
| `www/store/lib/catalog/CatalogPromoter.php` | Cenotvorba, generování slugu/SKU, tvorba skupin |

Pravidla:

- `import_key = sha1(brand|model_line|variant_spec)` — opakovaný běh aktualizuje,
  nezakládá duplicitu.
- **Promote nikdy nepublikuje.** Produkt vzniká s `is_active = FALSE`,
  `is_sellable = FALSE`, `stock = 0`. Publikaci dělá člověk v adminu po vzorku a
  dokumentaci. Odpovídá to workflow z listu `Metodika` (vzorek → dokumentace →
  pilot) a chrání to před nabídkou zboží, které nemáme.
- **Promote nikdy nepřepíše ruční obsah.** Jakmile má produkt vyplněný
  `description` nebo vlastní obrázky, opakovaný import mění jen technická pole
  (`group_id`, `variant_order`, `sku`).
- SKU: `VV-{BRAND3}-{KATEGORIE3}-{seq}`, např. `VV-UGR-KAB-0142`. Bez informace
  o dodavateli, bez čísla listingu.
- Import běží jako CLI proti stejné DSN jako `bin/migrate.php`; v produkci pouze
  ručně, nikdy z webového requestu.

---

## 6. Cenotvorba

Benchmark v masteru je skupinový a v USD — jako prodejní cena nepoužitelný.
Výpočet dělá `CatalogPromoter` a ukládá **jen výsledek**; vstupy zůstávají
v sourcingové tabulce.

```
landed_cost_czk = cost_usd × FX × (1 + clo) × (1 + doprava)
cena_bez_dph    = landed_cost_czk × marže(cenová_hladina, kategorie)
cena_s_dph      = zaokrouhli_psychologicky(cena_bez_dph × 1.21)
```

- FX kurz jako konfigurovatelná konstanta (ne živé API — cena se nesmí měnit
  mezi zobrazením a checkoutem), přepočet plánovaně, ne za běhu.
- Marže návrh: Budget ×2,6 / Střední ×2,4 / Premium ×2,2 (nábytek a židle níž,
  drobné příslušenství výš), minimální absolutní marže v Kč kvůli poplatkům.
- Zaokrouhlení na `…9` / `…90` podle cenového pásma.
- `store_products.currency` už existuje (`czk`) a je hlídaný CHECK constraintem
  — ceny ukládat v CZK včetně DPH konzistentně se současným storefrontem.
- Sleva (`sale_price`) se nikdy nepočítá z nákupu, jen ze základní ceny; jinak
  by se z výše slevy dala odvodit nákupní cena.

---

## 7. Produktový obsah

Největší část práce a hlavní obrana proti prozrazení kanálu.

1. **Názvy** — šablona `{Značka} {Řada} {Varianta}`, česky, bez marketingových
   superlativů z listingu: „UGREEN USB-C kabel 100 W, 2 m“.
2. **Popisy** — 338 textů (na skupinu, ne na variantu), 400–700 znaků, psané
   v češtině. Pokud se použije AI koncept, vždy s vlastním briefem a lidskou
   redakcí; nikdy překlad dodavatelského textu.
3. **Parametry** — strukturovaně (výkon, délka, konektory, materiál).
   Rozšíření: `store_product_specs (product_id, key, value, sort_order)`,
   ať se nemusí parsovat z popisu.
4. **Fotografie** — vlastní focení vzorků na jednotném pozadí, nebo oficiální
   brand assety s doloženým souhlasem. **Nikdy hotlink na cizí CDN.**
   Do doby vlastních fotek nechat kategorií generovaný placeholder, který už
   `vv_render_product_card()` umí. Formát WebP, 3 velikosti, `srcset`, lazy.
   Před uložením strip EXIF (metadata zdroje jsou další únik).
5. **Doba dodání** — jednotná formulace („Skladem — odesíláme do 24 hodin“ /
   „Na cestě — odesíláme do X pracovních dnů“). Žádné „doba dodání 15–30 dnů“,
   které kanál prozradí samo. Z toho plyne provozní důsledek: vlna 1 musí být
   fyzicky na skladě, ne objednávaná po prodeji.

---

## 8. Storefront a admin

**Storefront**

- Oprava N1–N3: filtrování, řazení, stránkování a počty přesunout na databázi
  i v PostgREST větvi (`Range` hlavičky + `count=exact`, `or=(…)` filtry),
  ne do PHP nad 1 000 řádky.
- Katalog: přidat řazení podle skupin, filtr značky ze `store_brands`
  (materializovaný počet), cenové rozpětí podle skutečného min/max.
- Detail produktu: přepínač variant v rámci `store_product_groups`, canonical
  na skupinu, `noindex` na varianty s duplicitním obsahem.
- Facetové URL (`?brand=&category=&max_price=`) už mají `noindex`
  (`catalog.php:95`) — ponechat.

**Admin (`admin/products.php`)**

- Stránkování + fulltext + filtry (značka, kategorie, stav) — bez toho je
  správa 1 260 položek nepoužitelná (N4).
- Hromadné akce: aktivovat/deaktivovat, přepsat marži, přiřadit kategorii.
- Doplnit PostgREST větev nebo explicitně vyžadovat PDO režim (N5) — dnes admin
  v režimu `postgrest` spadne.
- Nová obrazovka **Sourcing** (jen pro admina, oddělený soubor
  `admin/sourcing.php`): pipeline kandidátů, stage, poznámky, odkazy. Jediné
  místo v aplikaci, kde se sourcingová data zobrazují.

---

## 9. SEO a výkon

- Generovaný `sitemap-store.xml` (aktivní produkty + kategorie + skupiny),
  odkazovaný z hlavní `sitemap.xml`; statický seznam 7 URL dnes nestačí.
- JSON-LD `Product` + `Offer` (cena, dostupnost, měna) — bez pole původu.
- Katalogové stránky: cache HTML fragmentu seznamu na 60 s, `Cache-Control`
  pro obrázky 1 rok s hashem v názvu.
- **Zúžit CSP `img-src`.** Kořenový `.htaccess:34` má dnes
  `img-src 'self' data: https:`, takže hotlink na cizí CDN by prošel bez
  varování. Po zavedení vlastních obrázků zúžit na `img-src 'self' data:` —
  je to druhá, technická pojistka pravidla z §1. Zúžení nejdřív ověřit
  v report-only režimu, protože politika je dnes `Content-Security-Policy-Report-Only`.

---

## 10. Testy a guardy

Rozšíření stávající sady (`tests/unit`, `tests/integration`, runner
`tests/run-*.sh`):

| Test | Typ | Co hlídá |
|---|---|---|
| `sourcing-leak-guard-test.php` | unit | Grep přes `catalog.php`, `product.php`, `index.html`, `api/*.php`, `assets/js/*` na zakázané řetězce (`alibaba`, `dhgate`, `made-in-china`, `1688`, `aliexpress`, `sourcing`, `supplier`, `MOQ`, `store_sourcing_items`). **Blokující.** |
| rozšíření `public-product-api-test.php` | unit | Zákaz `SELECT p.*` rozšířit z `api/` i na `catalog.php` a `product.php` (N6) |
| `sourcing-normalizer-test.php` | unit | Mapování kategorií, kolize slugů (`Stojany`), `import_key` stabilita |
| `catalog-pricing-test.php` | unit | Cenotvorba, zaokrouhlení, minimální marže, žádná zpětná odvoditelnost nákupu |
| `catalog-import-postgres-test.php` | integrace | Idempotence importu, promote nepublikuje, promote nepřepíše ruční obsah |
| `catalog-scale-postgres-test.php` | integrace | 1 260 produktů: stránkování vrací správný `total`, žádná ztráta položek (regrese N1) |

Guard test je nejdůležitější položka celého plánu — je to jediná věc, která
požadavek z §1 udrží i za rok a po dvaceti dalších commitech.

---

## 11. Fáze

| Fáze | Obsah | Výstup / akceptace |
|---|---|---|
| **F0 — Základ** (2–3 dny) | Migrace: skupiny, `store_sourcing_items`, indexy, unaccent/trgm. Preflight report. | `bin/migrate.php` doběhne, integrační testy zelené |
| **F1 — Oprava škálování** (2–3 dny) | N1–N5, N7, N8; scale test na 1 260 fixture řádcích | Katalog i API vracejí správné počty a stránkování nad 1 260 položkami |
| **F2 — Taxonomie** (2 dny) | Nový strom kategorií, mapovací tabulka, `vv_category_bg()` | 5 hlavních / ~30 kanonických kategorií, žádná kolize slugů |
| **F3 — Import** (3–4 dny) | `sourcing-normalize` / `-import` / `catalog-promote`, admin Sourcing | 1 260 kandidátů v interní tabulce, 0 z nich veřejně viditelných |
| **F4 — Guardy** (1 den) | Leak guard, rozšířený API test, CI napojení | Guard testy blokují merge |
| **F5 — Vlna 1** (průběžně) | 556 položek s nízkým rizikem a prioritou 4–5: obsah, fotky, ceny, publikace | Postupně publikované produkty s vlastním obsahem a fotkou |
| **F6 — Vlna 2** (po pilotu) | 624 vysoce rizikových + 80 zakázkových, teprve po EU skladu a dokumentaci | Rozhodnutí per značka podle výsledku pilotu |

F0–F4 je technická práce (~10–13 dní), F5–F6 je obsahová a nákupní práce, která
technikou omezená není.

---

## 12. Rizika

| Riziko | Závažnost | Ošetření |
|---|---|---|
| Prodej značkového zboží bez oprávnění (UGREEN, Baseus, 70mai, PETKIT, Tenda) — sám master v poznámce vyžaduje *„ověřit originalitu a oprávnění prodejce“* | **Vysoká** | Doklad původu ke každé značce před publikací; padělek je odpovědnost prodejce, ne dodavatele |
| Compliance elektro a baterií (RED/LVD/EMC/RoHS, UN38.3 u powerbanek) | **Vysoká** | Publikace jen s doloženým EU prohlášením o shodě; blokující kontrola v adminu |
| Registrace EPR/WEEE a obalů v ČR při dovozu | Vysoká | Vyřešit před prvním dovozem, ne po něm |
| Únik sourcingu do veřejné vrstvy | Střední | §1 + guard testy |
| Únik přes doby dodání a fotky | Střední | Vlastní fotky, jednotné lhůty, zboží fyzicky skladem |
| Kapitál vázaný v 1 260 SKU | Střední | Vlna 1 = 556 položek, ostatní až po pilotu |
| Migrace taxonomie rozbije existující odkazy | Nízká | Demo strom deaktivovat, nemazat; 301 na nové slugy |

---

## 13. Otevřené otázky

1. **Marže a FX kurz** — konkrétní čísla v §6 jsou návrh, ne rozhodnutí.
2. **Fotografie** — vlastní focení vzorků, nebo jednání o brand assets? Určuje
   časovou osu F5 víc než cokoli jiného.
3. **Sklad** — vlna 1 předpokládá vlastní sklad („Sklad doma po vzorku“
   u všech 556 položek). Platí to i kapacitně?
4. **Rozsah vlny 1** — 556 položek je hodně obsahové práce. Nabízí se začít
   dvěma značkami (UGREEN + Deli) a model ověřit na ~150 položkách.
