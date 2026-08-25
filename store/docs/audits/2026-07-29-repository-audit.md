# VeVit Store — audit repozitáře

**Datum:** 29. 7. 2026
**Auditovaný stav:** GitHub `VeVitOfficial/VeVit-store`, větev `main`, commit `0d83c13`
**Rozsah:** všech 39 projektových souborů, 4 092 řádků PHP/HTML/JS/CSS/SQL a konfigurace

## 1. Shrnutí

Projekt není statická maketa: obsahuje PHP katalog, produktový detail, localStorage
košík, checkout, serverový přepočet cen, Stripe Checkout, webhook, digitální
stahování, přihlášení proti tabulce `users` a základní administraci produktů a
objednávek.

Současně ale nejde o bezpečně nasaditelný e-shop. Nejzávažnější je nesoulad dvou
průchodů položkami při vytváření objednávky: do placené Stripe relace se dostanou
jen aktivní produkty, zatímco do objednávky se ve druhém průchodu uloží i
neaktivní produkt. To může po zaplacení levné aktivní položky zpřístupnit
neaktivní digitální produkt bez jeho zaplacení. Webhook navíc není idempotentní,
veřejná stránka úspěchu zpřístupňuje objednávku i tokeny podle odhadnutelného
čísla a databázový seed nelze bezpečně opakovat.

Před rozšířením katalogu je nutná stabilizační etapa: uzavřít platební a
download tok, zavést migrace a testovací infrastrukturu a rozhodnout skutečný
kontrakt VeVit autentizace. Teprve potom je bezpečné přidávat kategorie, značky,
varianty, skladovou logistiku, facety, wishlist a B2B.

## 2. Ověřený technický stav

- Backend: frameworkless PHP 8 s PDO.
- Databáze: PostgreSQL, nikoli MySQL uvedené ve starším návrhovém dokumentu.
- Frontend: server-renderované PHP stránky a statický `index.html`, čistý
  JavaScript, Tailwind Play CDN, Google Fonts a Material Symbols.
- Platby: vlastní 26řádkový cURL wrapper nad Stripe REST API; nejde o oficiální
  Stripe PHP SDK.
- Produkční server: Apache `.htaccess`; `DirectoryIndex index.html`.
- Testy: projekt nemá testovací adresář ani testovací skript.
- Build: `package.json` obsahuje jen spuštění vestavěného PHP serveru; CSS se
  nebuildí.
- Média: repozitář neobsahuje produktové obrázky ani upload systém. Sloupec
  `images` se veřejně nevykresluje.
- Lokální pracovní kopie obsahově přesně odpovídá GitHub `main`; lokální `.git`
  je však jen nepoužitelný read-only adresář. Historie byla ověřena v dočasném
  read-only klonu.

Aktuální auditovací prostředí nemá `pdo_pgsql`, `config_secret.php` ani přístup k
produkční databázi. Aplikaci proto nebylo možné objektivně spustit proti DB.
Read-only požadavek na `https://vevit.store/` skončil timeoutem. Runtime chování
databáze, Stripe a živého hostingu je proto označeno jako neověřené.

## 3. Architektura a odpovědnosti souborů

### Veřejné stránky

- `index.html`: statická homepage; vlastní duplikovaná navigace, přihlašovací
  modal, footer a přibližně 300 řádků inline JavaScriptu. Obsah načítá ze šesti
  API požadavků.
- `catalog.php`: serverový katalog, přesné filtrování jedné kategorie, typu,
  značky, slevy, hledaného textu a maximální ceny; serverová stránkování.
- `product.php`: detail produktu, placeholder galerie, vložení do košíku,
  podobné produkty a záznam naposledy prohlíženého produktu.
- `cart.php`: klientský košík; cenu a stav zobrazuje z localStorage.
- `checkout.php`: jednostránkový kontaktní a adresní formulář; odesílá jen ID a
  množství produktů.
- `success.php`, `cancel.php`: výsledek Stripe přesměrování.
- `download.php`: download digitálního produktu podle tokenu.
- `logout.php`: odhlášení lokální PHP session.

### API

- `api/products.php`: JSON katalog.
- `api/categories.php`: plochý seznam stromových kategorií a přímé počty
  produktů.
- `api/brands.php`: agregace volného textu `store_products.brand`.
- `api/recent.php`: naposledy zobrazené produkty přihlášeného uživatele.
- `api/login.php`, `api/me.php`: lokální přihlášení a hydratace účtu.
- `api/create-checkout.php`: serverový přepočet cen, vytvoření objednávky a
  Stripe Checkout relace.
- `api/webhook.php`: označení objednávky jako zaplacené, odečet skladu a refund.

### Sdílená vrstva

- `config.php`: PostgreSQL připojení, globální `$pdo`, zapnuté produkční výpisy
  chyb.
- `lib/auth.php`: přímé čtení hesel z externě očekávané tabulky `users`.
- `lib/helpers.php`: ceny, sklad a produktová karta.
- `lib/header.php`, `lib/footer.php`: navigace, modal a mobilní navigace pro PHP
  stránky; homepage je nepoužívá.
- `lib/tw_config.php`: Tailwind Play CDN a runtime konfigurace.
- `assets/js/cart.js`: localStorage košík.
- `assets/js/app.js`: toast a nepoužitý obecný mobilní toggle.
- `assets/js/store.js`: starší klientský katalog; nikde se nenačítá a obsahuje
  syntaktickou chybu.

### Administrace

- `admin/auth.php`: jedno sdílené heslo z konstanty.
- `admin/middleware.php`: session boolean a CSRF token.
- `admin/index.php`: čtyři souhrnné metriky.
- `admin/products.php`: seznam bez stránkování; vytvoření, editace a deaktivace
  základního produktu.
- `admin/orders.php`: seznam do 200 objednávek, detail, ruční stav a poznámka.

## 4. Skutečný datový model

`schema.sql` vytváří pouze pět tabulek:

1. `store_categories`
2. `store_products`
3. `store_orders`
4. `store_order_items`
5. `store_product_views`

Kategorie mají `parent_id`, ale chybí popis, obrázek, aktivita a SEO. Produkty
mají jediný `category_id` a značku jako volný text. Neexistují varianty,
spojovací produkt–kategorie tabulka, značky, dodavatelé, nabídky dodavatelů,
sklady, logistické termíny, atributy, wishlist, recenze, B2B poptávky,
administrátorské role, audit log ani tabulka migrací.

Soubor vkládá 108 kategorií ve třech úrovních, ale žádné produkty. Komentář
uvádí osm hlavních, 25 podkategorií a 75 vnořených položek; skutečný počet je
108. Všech 108 `INSERT` příkazů postrádá `ON CONFLICT`, takže opakované spuštění
selže na unikátním slugu.

## 5. Datové toky

### Produkty a filtrování

1. PHP katalog sestaví allowlistovaný `ORDER BY`, parametrizované `WHERE` a
   provede count + datový dotaz.
2. Kategorie se připojí pouze přes `store_products.category_id`.
3. Kategorie filtruje jen přesný slug; potomci se nezahrnou.
4. Homepage provede šest paralelních API požadavků a skládá karty v DOM.
5. API produktů vždy implicitně používá `max_price=10000`, takže produkty nad
   10 000 Kč z API zmizí i bez zvoleného cenového filtru.

### Košík

1. Karta vloží do localStorage celé ID, název, cenu, typ a slug.
2. Košík slučuje pouze podle product ID; varianty neexistují.
3. Zobrazená cena, typ a doprava jsou klientská a mohou být změněny.
4. Checkout správně posílá serveru jen ID a množství.
5. Server načte cenu z DB, ale nekontroluje dostupný sklad, backorder ani limit
   množství.

### Přihlášení

1. E-mail a heslo jdou na lokální `api/login.php`.
2. Server přímo načte `users.password` ze sdílené databáze a provede
   `password_verify`.
3. Po úspěchu rotuje ID PHP session a uloží `user_id`.
4. Nejde o SSO, OAuth-like flow ani ověřování centrálního session tokenu.

### Objednávka a platba

1. Server poprvé načte pouze aktivní produkty, vypočte ceny a Stripe položky.
2. Vytvoří odhadnutelné pořadové číslo pomocí `COUNT(*) + 1`.
3. Objednávku uloží ještě před úspěšným vytvořením Stripe relace.
4. Podruhé načte produkty bez kontroly `is_active` a uloží order items.
5. Stripe webhook nastaví `paid` a odečte fyzický sklad.
6. Duplicitní webhook odečte sklad znovu.
7. `success.php` pouze podle čísla objednávky ukáže zákaznické údaje a download
   tokeny; neověřuje session vlastníka ani stav před tvrzením, že platba
   proběhla.

### Změna stavu

- Stripe webhook mění `pending` na `paid`.
- Administrátor může stav nastavit libovolně bez stavového automatu nebo audit
  logu.
- Refund webhook nastaví `refunded`, ale nevrací sklad.
- Ruční nastavení `paid` neprovádí stejnou doménovou logiku jako webhook.

## 6. Funkční stav

| Oblast | Stav | Důkaz / omezení |
|---|---|---|
| PHP syntax | Ověřeno | Všech 27 PHP souborů prošlo `php -l`. |
| Homepage HTML | Staticky platné | DOM parser: 177 elementů, 0 parse chyb, 0 duplicitních ID. |
| JavaScript | Nefunkční část | `assets/js/store.js:157` má syntax error; soubor je nyní mrtvý kód. |
| Katalog | Částečně implementován | SQL je parametrizované, ale facety a stromové filtrování chybí. |
| Vyhledávání | Částečně implementováno | Jen název a krátký popis; bez autocomplete/rate limitu. |
| Produktový detail | Částečně implementován | Funkční DB načtení; galerie, SKU, varianty, parametry a recenze jsou makety/chybí. |
| Košík | Implementován klientsky | Bez variant, serverové hydratace a kontroly skladu do checkoutu. |
| Checkout | Rizikově implementován | Server přepočítává cenu, ale tok obsahuje kritické chyby níže. |
| Stripe | Staticky nalezen | Bez klíčů a sítě nebyl proveden testovací nákup ani webhook. |
| Digitální download | Rizikově implementován | Token/expirace/limit existují; autorizace a cesta souboru nejsou dostatečné. |
| VeVit přihlášení | Částečně implementováno | Lokální ověření sdíleného hash hesla, ne centrální bezpečný tok. |
| Admin produkty | Částečně implementován | Základní CRUD/deaktivace; bez obrázků, variant, validace a stránkování. |
| Admin objednávky | Částečně implementován | Stav/detail existuje; přidání poznámky obsahuje chybu. |
| Kategorie | Datový základ | Strom je v DB, veřejné filtrování a správa stromu nejsou hotové. |
| Značky | Vizuální agregace | Neexistuje entita ani admin správa/detail značky. |
| Wishlist, B2B, dodavatelé, atributy, recenze | Neexistuje | Bez tabulek, API i UI. |
| SEO | Prakticky chybí | Jen `<title>`; bez canonical, OG, JSON-LD, sitemap a robots. |
| Produkční CSS | Nevhodné | Tailwind Play CDN a velké inline konfigurace na každé stránce. |

## 7. Bezpečnostní nálezy

### Kritické

#### SEC-001 — Nezaplacený neaktivní digitální produkt v zaplacené objednávce

- **Místo:** `api/create-checkout.php:54-72` a `api/create-checkout.php:104-119`
- **Důkaz:** první dotaz vyžaduje `is_active = TRUE`; druhý dotaz už ne.
- **Dopad:** útočník může přidat ID neaktivního digitálního produktu k levné
  aktivní položce. Stripe jej nezpoplatní, ale objednávka získá download token a
  po webhooku stav `paid`.
- **Oprava:** načíst a validovat všechny položky přesně jednou, zamknout potřebné
  řádky v transakci a ze stejného neměnného snapshotu vytvořit Stripe řádky i
  order items.

#### SEC-002 — IDOR a únik download tokenů přes odhadnutelné číslo objednávky

- **Místo:** `success.php:4-15`, `success.php:45-64`;
  `api/create-checkout.php:92-102`
- **Důkaz:** veřejný GET přijme `?order=VVS-YYYY-00001` bez ověření vlastníka a
  načte položky i `download_token`.
- **Dopad:** enumerace čísel objednávek může odhalit e-mail, nákup a digitální
  soubory jiných zákazníků.
- **Oprava:** veřejný kryptograficky náhodný confirmation token, kontrola
  přihlášeného vlastníka nebo guest secret a nikdy nezobrazovat download token
  před ověřeným stavem `paid`.

### Vysoké

#### SEC-003 — Webhook lze opakovat a opakovaně odečítá sklad

- **Místo:** `api/webhook.php:49-64`
- **Důkaz:** chybí evidence Stripe event ID, podmíněný přechod stavu a
  transakce.
- **Dopad:** legitimní retry nebo replay stejné události snižuje sklad opakovaně.
- **Oprava:** tabulka zpracovaných eventů s unikátním `event_id`, atomický
  stavový přechod a skladová transakce.

#### SEC-004 — Ověření webhooku je volitelné a bez časové tolerance

- **Místo:** `api/webhook.php:15-31`
- **Důkaz:** pokud secret nebo hlavička chybí, podpis se nekontroluje;
  `timestamp` se nevaliduje a podpisy se porovnávají běžným `in_array`.
- **Dopad:** chybná konfigurace zpřístupní endpoint falešným událostem; zachycená
  událost je replayovatelná.
- **Oprava:** fail-closed konfigurace, oficiální Stripe verifier nebo ekvivalent
  s `hash_equals`, tolerancí timestampu a event idempotencí.

#### SEC-005 — Produkční výpis databázové chyby

- **Místo:** `config.php:4-5`, `config.php:14-17`
- **Důkaz:** `display_errors=1` a klientovi se vypisuje `$e->getMessage()`.
- **Dopad:** únik topologie DB, názvů hostů, schématu a diagnostiky.
- **Oprava:** veřejná obecná chyba s correlation ID, detail pouze do bezpečného
  logu; režim řízený prostředím.

#### SEC-006 — Download cesta není omezena na bezpečný adresář

- **Místo:** `download.php:26-42`
- **Důkaz:** `__DIR__ . '/' . download_file` bez `realpath` boundary checku.
- **Dopad:** při manipulaci DB/admin vstupu může `../` zpřístupnit libovolný
  čitelný soubor serveru.
- **Oprava:** soubory mimo web root, interní opaque storage key, `realpath` a
  explicitní ověření prefixu povoleného adresáře.

#### SEC-007 — DOM XSS v mrtvém klientském katalogu a nebezpečné HTML sinky

- **Místo:** `assets/js/store.js:117-133`; `assets/js/app.js:2-12`
- **Důkaz:** API hodnoty `category_name`, ceny, typ a slug se skládají do
  `innerHTML`; toast vkládá `message` přes `innerHTML`.
- **Dopad:** po opětovném zapojení souboru může uložená DB hodnota vykonat skript
  v originu e-shopu.
- **Oprava:** stavět DOM přes `createElement`/`textContent`, URL validovat a toast
  používat výhradně s `textContent`.

### Střední

#### SEC-008 — Session cookies nemají bezpečné výchozí nastavení

- **Místo:** `lib/auth.php:4-6`, `admin/middleware.php:2`
- **Důkaz:** `session_start()` proběhne před nastavením `Secure`, `HttpOnly`,
  `SameSite` a strict mode. Logout používá parametry, které nemusí odpovídat
  původní cookie.
- **Oprava:** centrální bootstrap session podle prostředí, strict mode,
  HttpOnly, SameSite=Lax, Secure pouze na HTTPS, shodné mazání cookie.

#### SEC-009 — Přihlášení a admin login nemají rate limit

- **Místo:** `api/login.php:20-35`, `admin/auth.php:6-15`
- **Dopad:** online hádání hesel. Admin používá jedno sdílené heslo bez identity
  a auditu.
- **Oprava:** persistentní rate limit, obecná odpověď, administrátorské identity,
  role a audit.

#### SEC-010 — CORS je plošně `*`

- **Místo:** všechny veřejné API endpointy, například `api/login.php:4-7`
- **Důkaz:** API se session daty deklaruje libovolný origin.
- **Oprava:** same-origin bez CORS, nebo endpointově přesný allowlist a korektní
  OPTIONS/credentials politika.

#### SEC-011 — Host header ovládá Stripe návratové URL

- **Místo:** `api/create-checkout.php:124-125`
- **Důkaz:** URL se skládá z `$_SERVER['HTTP_HOST']`.
- **Dopad:** při nedostatečné proxy/server validaci může vzniknout návrat na
  útočníkovu doménu.
- **Oprava:** kanonická `APP_URL` z validované konfigurace.

#### SEC-012 — Objednávka nemá transakci, skladovou kontrolu ani limit množství

- **Místo:** `api/create-checkout.php:54-151`
- **Dopad:** částečné objednávky, overselling, záporná obchodní logika a DoS
  extrémním množstvím.
- **Oprava:** normalizovaný vstup, rozumné limity, transakce, kontrola/rezervace
  skladu a jednotný rollback.

#### SEC-013 — Třetí strany bez CSP/SRI a Tailwind Play CDN v produkci

- **Místo:** `lib/tw_config.php:5-9`, `index.html:7-11`, admin hlavičky
- **Důkaz:** měnitelný CDN skript bez SRI; `.htaccess` nemá CSP.
- **Dopad:** supply-chain riziko, obtížná CSP a zbytečný runtime výkonový náklad.
- **Oprava:** lokální minifikovaný CSS build a self-hosted/pinované fonty/ikony;
  následně CSP bez `unsafe-eval`.

### Nízké / hardening

- `.htaccess` používá zastaralý `X-XSS-Protection`, nemá Referrer-Policy ani
  Permissions-Policy; aktuální produkční edge hlavičky nebylo možné ověřit.
- Registrace otevírá nový tab bez explicitního `rel="noopener"`; moderní
  prohlížeče jej obvykle doplní implicitně, ale explicitní hodnota je čitelnější.
- Download counter se kontroluje a inkrementuje dvěma oddělenými dotazy, takže
  souběžná stažení mohou limit překročit.
- localStorage košík je správně považován jen za klientský stav; musí však být
  vždy validován jako nedůvěryhodný i při budoucím rozšiřování.

## 8. Funkční chyby a technický dluh

1. `assets/js/store.js:157` je syntakticky neplatný.
2. `admin/orders.php:25` připraví SELECT poznámky, ale nikdy jej neprovede.
3. `admin/auth.php` nepřipojuje `config.php`, přesto při chybě volá `h()` na
   řádku 43; neplatné heslo tak může skončit fatální chybou.
4. `admin/products.php:184-185` má neuzavřený atribut `selected`, takže text
   volby se stává součástí atributu a select je rozbitý.
5. `.htaccess` přepisuje `/category/slug` na `index.html?category=slug`, ale
   homepage tento parametr jako katalogový filtr nepoužívá.
6. `api/products.php` implicitně skrývá vše nad 10 000 Kč.
7. Homepage třetí banner odkazuje digitální produkty do výtvarné kategorie.
8. Dokumentace tvrdí MySQL, `index.php`, demo produkty a CORS jen pro
   `vevit.store`; skutečný kód používá PostgreSQL, `index.html`, žádné product
   seedy a CORS `*`.
9. Hlavička, footer, login modal, Tailwind config a design markup jsou
   duplikované mezi homepage, sdílenými PHP partialy a administrací.
10. Footer právní a kontaktní odkazy jsou pouze `#`.
11. `images`, `stripe_price_id`, telefon z checkoutu a část `assets/js/app.js`
    nejsou funkčně využité.
12. Kategorie a produkty nemají `updated_at`; změny administrace nelze
    auditovat.
13. Admin načítá všechny produkty a až 200 objednávek bez skutečného stránkování.
14. Pořadové číslo objednávky přes `COUNT + 1` je závodní podmínka a období
    „posledních 12 měsíců“ neodpovídá kalendářnímu roku v prefixu.
15. Vlastní Stripe wrapper nemá timeout, detekci cURL chyby, idempotency key ani
    řízení verze Stripe API.

## 9. Přístupnost, UX, SEO a výkon

- Chybí skip link, focus trap a návrat focusu u login modalu.
- Dialog nemá `aria-labelledby`; pozadí a inline handlery komplikují ovládání a
  CSP.
- Desktopový katalogový sidebar zůstává na mobilu jako dlouhý blok; drawer není.
- Karty nemají skutečné obrázky ani explicitní rozměry reálných médií.
- Homepage je obsahově orientovaná na merch/digitální produkty a nesplňuje nové
  B2B positioning.
- Hard-shadow efekty, radius 2–8 px a duplikované tokeny odporují požadovanému
  měkčímu systému.
- Chybí reduced motion pravidla.
- Neexistují canonical, meta description, OG/Twitter, JSON-LD, sitemap ani
  robots.
- Kategorické URL nemají funkční landing page ani breadcrumb strom.
- Tailwind Play CDN generuje CSS v prohlížeči a blokuje cestu k přísné CSP.
- Homepage vyvolá šest API requestů; může je nahradit jeden účelový,
  cacheovatelný payload nebo server render bez N+1.

## 10. Doporučené rozdělení implementace

Rozsah není bezpečné realizovat jako jednu migraci nebo jeden release.

### Etapa 0 — Stabilizace a testovací základ

- konfigurační bootstrap, bezpečné chyby a session;
- integrační testovací PostgreSQL schéma;
- oprava checkout snapshotu, transakcí, order tokenů, webhook idempotence,
  download boundary a admin chyb;
- API response standard, validace, method/CORS politika;
- zachování stávajících produktů a objednávek.

### Etapa 1 — Datový základ katalogu

- verzované dopředné migrace a migration runner;
- plné stromové kategorie a `product_categories`;
- značky, dodavatelé, supplier offers, sklady a dostupnost;
- varianty a atributový EAV model s datovými constraints;
- idempotentní seed požadovaných kategorií a neaktivních ukázkových značek.

### Etapa 2 — Design systém a shell

- produkční CSS build bez Node serveru;
- společná PHP homepage/header/footer;
- design tokeny, navigace, přístupné mega menu a mobilní shell;
- nová homepage a B2B positioning bez falešných tvrzení.

### Etapa 3 — Katalog, hledání a SEO

- stromové filtrování, facety, atributy, dostupnost, značky a řazení;
- URL state, chips, desktop sidebar a mobilní drawer;
- autocomplete s limity a cache;
- kategorie/značky landing pages, metadata a strukturovaná data.

### Etapa 4 — Produkt, wishlist, košík a checkout

- galerie, varianty, dostupnost, dokumenty, související produkty;
- localStorage + DB wishlist s bezpečným merge;
- serverová revalidace košíku, logistické skupiny, firma/host/účet;
- stavový automat objednávek a konzistentní stock ledger.

### Etapa 5 — B2B a administrace

- poptávky, bezpečné přílohy a anti-spam;
- admin moduly kategorií, značek, dodavatelů, atributů, variant a skladů;
- vyhledávání, stránkování, bulk akce, role, oprávnění a audit log.

### Etapa 6 — QA a nasazení

- automatické unit/integration/browser testy;
- matice viewportů, klávesnice, WCAG, konzole a 404;
- Stripe test mode a podepsané webhook fixtures;
- WEDOS preflight, deploy checklist, rollback a post-deploy smoke test.

Každá etapa musí mít vlastní návrh, dopřednou migraci, regresní testy a možnost
nasadit ji bez čekání na další etapu.

## 11. Chybějící vstupy před produkční implementací

1. **VeVit účet:** URL a kontrakt centrální autentizace/token introspection,
   callback/allowed origins, cookie pravidla a testovací účet. Bez toho se nemá
   vymýšlet nové SSO.
2. **Databáze:** anonymizovaný dump nebo testovací PostgreSQL instance a přesná
   verze/extension politika. Schéma `users` není součástí repozitáře.
3. **WEDOS:** potvrzení tarifu, PHP verze, dostupnosti `pdo_pgsql`, externích DB
   spojení, cronů a zapisovatelných adresářů.
4. **Stripe:** testovací konfigurace, webhook secret, povolené platební metody a
   business pravidla refundů.
5. **Doprava a obchod:** dopravci, ceny, země, DPH, měny, firemní identita,
   obchodní podmínky a pravidla digitálního obsahu.
6. **Média a soubory:** cílové úložiště, limity, zálohy a skutečné produktové
   materiály.
7. **E-mail:** dostupný SMTP/provider a požadované transakční šablony.

## 12. Skutečně provedené testy

| Test | Jak | Výsledek |
|---|---|---|
| Shoda workspace s GitHub | dočasný `git clone --depth 1` + `diff -rq` | Shoda všech 39 projektových souborů. |
| PHP syntax | `php -l` nad 27 PHP soubory | PASS, bez syntax chyb. |
| JavaScript syntax | `node --check assets/js/*.js` | FAIL v `assets/js/store.js:157`. |
| Statický HTML parse | PHP `DOMDocument` nad `index.html` | PASS, 0 parse chyb a duplicitních ID. |
| Inventář tras a zdrojů | `rg` nad `href`, `src`, `action`, `fetch` | Nalezeny `#` odkazy a rozbitý category rewrite. |
| Inventář DB | statická kontrola `schema.sql` | 5 tabulek, 108 category insertů, 0 product insertů. |
| Secret scan | cílené hledání DB/Stripe/admin konstant a konfigurace | Tajné hodnoty v repu nenalezeny; chybí template konfigurace. |
| Lokální runtime | kontrola PHP extensions/config | BLOCKED: chybí `pdo_pgsql` a `config_secret.php`. |
| Živý runtime | HTTPS HEAD na `vevit.store` | BLOCKED: síťový timeout po 15 s. |
| Stripe a DB scénáře | vyžadují test DB a test keys | NEPROVEDENO; nelze je označit za funkční. |

## 13. Auditní závěr

Další práce má začít Etapou 0, nikoli redesignem homepage. Kritické platební a
download chyby jsou blokující. Po stabilizaci doporučuji zachovat jednoduchý
PHP/PostgreSQL/vanilla JS základ, ale rozdělit globální logiku do malých
serverových služeb a repozitářů, zavést dopředné migrace a používat předem
builděné statické CSS. Tím zůstane produkce kompatibilní se sdíleným hostingem
bez trvale spuštěného Node serveru.
