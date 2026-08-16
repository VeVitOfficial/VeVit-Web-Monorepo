# Copy audit landing page VeVit

Stav: **Krok 0 — inventura + implementované P0.1 a P0.2**  
Datum inventury: 1. 8. 2026  
Rozsah kontroly: aktuální obsah adresáře `/home/vitekeee/Projects/VeVit-portal`

## 0. Aktualizace po P0.1 a P0.2

- Inventura v sekcích 1–6 zachycuje výchozí stav před implementací.
- `assets/js/ui.js` je nyní aktivně načtený z `index.html` a slouží jako zdroj pravdy pro dotčené texty, počet nástrojů a procenta roadmapy.
- `UI.values.TOOLS_COUNT` je na základě produktového rozhodnutí nastaveno na `100+` a všechny výskyty se dál hydratují z jednoho zdroje.
- Roadmap používá pouze schválené stavy a procenta; prošlé termíny byly odstraněny.
- Viditelné Premium CTA je oddělené od skrytého ceníku a připraví kontaktní formulář pro žádost o oznámení.

## 1. Soubory obsahující text landing page

### Aktivní zdroje

| Soubor | Role | Jak se text dostává na stránku |
|---|---|---|
| `index.html` | Hlavní a jediná HTML šablona landing page; obsahuje veškeré statické copy, meta texty, navigaci, CTA, formulář, roadmapu, statistiky a skryté Premium plány. | Přímo v HTML. |
| `assets/js/app.js` | Dynamické texty účtu a kontaktního formuláře: názvy levelů, XP údaj, předmět formuláře, loading, úspěch a chyba. | Soubor je načten na `index.html:946`; mění `textContent` a data načítá z `/api/user.php`. |
| `assets/js/premium.js` | Loading text `Přesměrovávám…`; formátování animovaných statistik a obsluha skrytých Premium CTA. | Soubor je načten na `index.html:947`. |
| `api/user.php` | Datový zdroj pro dynamický level a XP v kartě Account; neobsahuje landing copy, ale ovlivňuje zobrazená čísla. | JSON API volané z `assets/js/app.js:182`. |

### Existující, ale na aktuální landing page neaktivní zdroje

| Soubor | Nález |
|---|---|
| `assets/js/ui.js` | Obsahuje rozsáhlý objekt `translations` pro `cs`, `en`, `es`, `de`, `uk` a funkci `UI.t()`. `index.html` však soubor nenačítá, nemá překladové klíče a aktivní JS `UI.t()` nevolá. Copy je starší a liší se od aktuální stránky (např. 79 nástrojů, 18 her, 500+ lekcí). |
| `public/send-mail.php` | Obsahuje texty odpovědí a e-mailové šablony kontaktního endpointu. Aktuální formulář jej nepoužívá; `assets/js/app.js:232` odesílá data externě přes FormSubmit. |
| `assets/js/auth.js` | Obsahuje několik auth fallback textů, ale `index.html` jej nenačítá. |
| `api/login.php`, `api/register.php`, `api/user.php`, `api/setup.php`, `api/logout.php`, `api.php` | Obsahují API zprávy, které aktuální landing page s výjimkou dat z `api/user.php` přímo nezobrazuje. Nejsou proto aktivním zdrojem landing copy. |

CSS soubory `assets/css/main.css` a `assets/css/premium.css` jsou aktivní, ale jejich deklarace `content:` jsou prázdné; nevkládají uživatelské texty. `assets/css/style.css` není z `index.html` načten.

## 2. Jazyková vrstva

**Ano, ale je neaktivní a zjevně patří ke starší verzi stránky.**

- `assets/js/ui.js:49–213` definuje překlady v pěti jazycích.
- `assets/js/ui.js:215–226` definuje lookup `UI.t(key, lang)`.
- `index.html:946–947` načítá pouze `assets/js/app.js` a `assets/js/premium.js`; `ui.js` nenačítá.
- V aktuální šabloně nejsou `data-i18n` ani jiné překladové klíče.
- V repozitáři se nevyskytuje `dc-runtime`, `renderVals()`, `sc-if` ani `sc-for`.

Z toho plyne rozhodovací brána před implementací copy: změna pouze v `ui.js` by se na dnešní stránce neprojevila. Je potřeba potvrdit, zda (a) upravit aktivní české copy přímo v `index.html` a aktivních JS souborech, nebo (b) nejdřív znovu zapojit a aktualizovat i18n vrstvu, což je širší strukturální zásah.

## 3. Inventář tlačítek a odkazů

Poznámky:

- `externí` znamená odchod z `vevit.cz` na jinou doménu/subdoménu nebo otevření e-mailového klienta.
- `scroll` znamená odkaz na kotvu stejné stránky.
- U celých klikacích karet je ve sloupci „aktuální text“ uveden název a jejich viditelné CTA/meta; celý obsah karty je součást odkazu.
- Řádky 703–834 v `index.html` jsou nyní skryté atributem `hidden`, ale zůstávají v DOM, proto jsou zahrnuté.

| soubor:řádek | aktuální text | CSS třídy | cíl (href/onclick) | typ akce |
|---|---|---|---|---|
| `index.html:32` | VeVit Technologies | `wordmark` | `#` | scroll na začátek |
| `index.html:37` | Web apps | `nav-link` | JS dropdown `#dd-webapps` | navigace (otevření menu) |
| `index.html:42` | Tools — Beta — Kalkulačky a nástroje | `dd-item` | `https://tools.vevit.cz` | externí |
| `index.html:50` | Edu — Beta — Lekce a kvízy | `dd-item` | `https://edu.vevit.cz` | externí |
| `index.html:79` | Desktop apps | `nav-link` | JS dropdown `#dd-desktop` | navigace (otevření menu) |
| `index.html:97` | Služby VeVit | `nav-link` | JS dropdown `#dd-services` | navigace (otevření menu) |
| `index.html:102` | VeVit Software Studios — Software na míru | `dd-item` | `https://studios.vevit.cz` | externí |
| `index.html:106` | VeVit Art — Platforma pro umělce | `dd-item` | `https://vevit.art` | externí |
| `index.html:113` | O nás | `nav-link` | `#about` | scroll |
| `index.html:114` | Kontakt | `nav-link` | `#kontakt` | scroll |
| `index.html:118` | Přihlásit se | `btn btn-ghost btn-sm` | `https://account.vevit.cz/login.php` | externí |
| `index.html:119` | Registrovat se | `btn btn-primary btn-sm` | `https://account.vevit.cz/register.php` | externí |
| `index.html:122` | pouze ikona; aria-label `Otevřít menu` | `hamburger` | JS otevření `#mobile-panel` | navigace (otevření menu) |
| `index.html:139` | pouze ikona; aria-label `Zavřít menu` | `mobile-close` | JS zavření `#mobile-panel` | navigace (zavření menu) |
| `index.html:145` | Tools | bez třídy | `https://tools.vevit.cz` | externí |
| `index.html:146` | Games | bez třídy | `https://games.vevit.cz` | externí |
| `index.html:147` | Edu | bez třídy | `https://edu.vevit.cz` | externí |
| `index.html:148` | Services | bez třídy | `https://services.vevit.cz` | externí |
| `index.html:149` | Account | bez třídy | `https://account.vevit.cz` | externí |
| `index.html:151` | VeVit Software Studios | bez třídy | `https://studios.vevit.cz` | externí |
| `index.html:152` | VeVit Art | bez třídy | `https://vevit.art` | externí |
| `index.html:154` | O nás | bez třídy | `#about` | scroll |
| `index.html:155` | Kontakt | bez třídy | `#kontakt` | scroll |
| `index.html:158` | Přihlásit se | `btn btn-ghost` | `https://account.vevit.cz/login.php` | externí |
| `index.html:159` | Registrovat se | `btn btn-primary` | `https://account.vevit.cz/register.php` | externí |
| `index.html:184` | Otevřít Tools | `btn btn-primary` | `https://tools.vevit.cz` | externí |
| `index.html:188` | Prozkoumat ekosystém | `btn btn-ghost` | `#platforms` | scroll |
| `index.html:291` | VeVit Software Studios; CTA `studios.vevit.cz` | `explore-card` | `https://studios.vevit.cz` | externí (celá karta) |
| `index.html:299` | VeVit Art; CTA `vevit.art` | `explore-card` | `https://vevit.art` | externí (celá karta) |
| `index.html:321` | Tools; meta `tools.vevit.cz`; bez textového CTA, pouze ikona | `ec ec-tools` | `https://tools.vevit.cz` | externí (celá karta) |
| `index.html:381` | Edu; bez textového CTA, pouze ikona | `ec ec-edu` | `https://edu.vevit.cz` | externí (celá karta) |
| `index.html:471` | PDF Merge — 12 482× | `tool-mini` | `https://tools.vevit.cz/pdf-merge` | externí |
| `index.html:472` | Kalkulačka — 9 871× | `tool-mini` | `https://tools.vevit.cz/calculator` | externí |
| `index.html:473` | QR Generator — 8 204× | `tool-mini` | `https://tools.vevit.cz/qr` | externí |
| `index.html:474` | Image Compress — 7 558× | `tool-mini` | `https://tools.vevit.cz/image` | externí |
| `index.html:475` | AI Chat — 6 902× | `tool-mini` | `https://tools.vevit.cz/ai-chat` | externí |
| `index.html:476` | Konvertor — 5 414× | `tool-mini` | `https://tools.vevit.cz/converter` | externí |
| `index.html:477` | JSON Format — 4 880× | `tool-mini` | `https://tools.vevit.cz/json` | externí |
| `index.html:478` | Color Picker — 4 233× | `tool-mini` | `https://tools.vevit.cz/color` | externí |
| `index.html:699` | Vytvořit účet zdarma | `btn btn-primary` | `https://account.vevit.cz/register.php` | externí |
| `index.html:706` | Měsíčně | `billing-btn` | JS přepnutí cen | navigace (tab; skryté) |
| `index.html:707` | Ročně — 2 měsíce zdarma | `billing-btn` | JS přepnutí cen | navigace (tab; skryté) |
| `index.html:739` | Vybrat Bronze | `tier-cta` | JS checkout stub, bez navigace | disabled/nefunkční (skryté) |
| `index.html:768` | Vybrat Silver | `tier-cta` | JS checkout stub, bez navigace | disabled/nefunkční (skryté) |
| `index.html:797` | Vybrat Gold | `tier-cta` | JS checkout stub, bez navigace | disabled/nefunkční (skryté) |
| `index.html:826` | Vybrat Platinum | `tier-cta` | JS checkout stub, bez navigace | disabled/nefunkční (skryté) |
| `index.html:832` | Porovnat plány podrobně → | bez třídy | `https://account.vevit.cz/premium` | externí (skryté) |
| `index.html:864` | Odeslat zprávu | `btn btn-primary` | submit formuláře; JS → FormSubmit | submit |
| `index.html:870` | Instagram | `social-link` | `https://www.instagram.com/vevit.cz/` | externí, nové okno |
| `index.html:873` | Twitter / X | `social-link` | `https://x.com/VeVitOfficial` | externí, nové okno |
| `index.html:876` | Discord | `social-link` | `https://discord.gg/dJumMfWd6r` | externí, nové okno |
| `index.html:879` | info@vevit.cz | `social-link` | `mailto:info@vevit.cz` | externí (e-mail klient) |
| `index.html:899` | Hry | bez třídy | `https://games.vevit.cz` | externí |
| `index.html:900` | Nástroje | bez třídy | `https://tools.vevit.cz` | externí |
| `index.html:901` | Vzdělávání | bez třídy | `https://edu.vevit.cz` | externí |
| `index.html:902` | Služby | bez třídy | `https://services.vevit.cz` | externí |
| `index.html:909` | Přihlášení | bez třídy | `https://account.vevit.cz/login.php` | externí |
| `index.html:910` | Registrace | bez třídy | `https://account.vevit.cz/register.php` | externí |
| `index.html:911` | Premium | bez třídy | `#` | disabled/mrtvý odkaz |
| `index.html:912` | Dashboard | bez třídy | `https://account.vevit.cz` | externí |
| `index.html:919` | Kontakt | bez třídy | `#` | disabled/mrtvý odkaz; nevede na `#kontakt` |
| `index.html:920` | Ko-fi | bez třídy | `https://ko-fi.com` | externí; obecná doména |
| `index.html:921` | FAQ | bez třídy | `#` | disabled/mrtvý odkaz |
| `index.html:922` | Status | bez třídy | `#` | disabled/mrtvý odkaz |
| `index.html:934` | pouze ikona; aria-label `GitHub` | bez třídy | `https://github.com` | externí; obecná doména |
| `index.html:937` | pouze ikona; aria-label `X / Twitter` | bez třídy | `https://twitter.com` | externí; obecná doména |
| `index.html:940` | pouze ikona; aria-label `Ko-fi` | bez třídy | `https://ko-fi.com` | externí; obecná doména |

### Neaktivní prvky stylované jako položky/karty

Tyto prvky nejsou `<a>` ani `<button>`, ale kvůli roli `menuitem`, vzhledu karty nebo `aria-disabled` patří do inventury klikatelných očekávání.

| soubor:řádek | aktuální text | CSS třídy | cíl | typ akce |
|---|---|---|---|---|
| `index.html:46` | Games — Připravuje se | `dd-item dd-soon` | žádný | disabled |
| `index.html:54` | Services — Připravuje se | `dd-item dd-soon` | žádný | disabled |
| `index.html:58` | Account — Připravuje se | `dd-item dd-soon` | žádný | disabled |
| `index.html:62` | Search — Připravuje se | `dd-item dd-soon` | žádný | disabled |
| `index.html:66` | Store — Připravuje se | `dd-item dd-soon` | žádný | disabled |
| `index.html:84` | VeVit Browser — Připravuje se | `dd-item dd-soon` | žádný | disabled |
| `index.html:88` | VeVit Office — Připravuje se | `dd-item dd-soon` | žádný | disabled |
| `index.html:360` | Games — Připravuje se | `ec ec-games` | žádný | disabled karta |
| `index.html:403` | Services — Připravuje se | `ec ec-services` | žádný | disabled karta |
| `index.html:416` | Account — Připravuje se | `ec ec-account` | žádný | disabled karta |
| `index.html:432` | Search — Připravuje se | `ec ec-search` | žádný | disabled karta |
| `index.html:441` | Store — Připravuje se | `ec ec-store` | žádný | disabled karta |

## 4. Inventář čísel na stránce

Inventář zahrnuje obsah viditelný běžně, dynamický obsah účtu a také skryté Premium plány. Nezahrnuje čistě prezentační CSS hodnoty, rozměry ikon, SVG souřadnice ani technické timeouty.

| soubor:řádek(y) | číslo | popisek / kontext | zdroj |
|---|---|---|---|
| `index.html:179` | 100+ | nástrojů v hero podnadpisu | hardcoded HTML |
| `index.html:180` | 21+ | her v hero podnadpisu | hardcoded HTML |
| `index.html:180` | 500+ | lekcí v hero podnadpisu | hardcoded HTML |
| `index.html:193` | 100+ | nástrojů v hero statbaru | hardcoded HTML |
| `index.html:198` | 21+ | her v hero statbaru | hardcoded HTML |
| `index.html:203` | 500+ | lekcí v hero statbaru | hardcoded HTML |
| `index.html:208` | 1 200+ | uživatelů v hero statbaru | hardcoded HTML |
| `index.html:263,271` | 100+ | nástrojů v marquee; položka je kvůli animaci dvakrát | hardcoded HTML |
| `index.html:264,272` | 21+ | her v marquee; položka je dvakrát | hardcoded HTML |
| `index.html:265,273` | 500+ | lekcí v marquee; položka je dvakrát | hardcoded HTML |
| `index.html:266,274` | 1 200+ | uživatelů v marquee; položka je dvakrát | hardcoded HTML |
| `index.html:330` | 100+ | počet Tools v produktové kartě | hardcoded HTML |
| `index.html:365,367` | 21+ | počet her v popisu a metadatu karty Games | hardcoded HTML |
| `index.html:365` | 2048 | název hry | hardcoded HTML |
| `index.html:386,388` | 500+ | počet lekcí v popisu a metadatu karty Edu | hardcoded HTML |
| `index.html:421,425` | level 1 | rozsah Account 1→100 a výchozí skrytý level | hardcoded HTML fallback; po přihlášení `/api/user.php` |
| `index.html:421` | 100 | horní hranice levelů | hardcoded HTML |
| `index.html:426`; `assets/js/app.js:159,187–197` | 0 / 10 000 XP | výchozí průběh levelu; aktuální XP a level jsou z API, hranice 10 000 je JS konstanta | HTML fallback + API + hardcoded JS konstanta |
| `index.html:467` | 79 | dostupných nástrojů nad showcase | hardcoded HTML |
| `index.html:471` | 12 482× | použití PDF Merge; období neuvedeno | hardcoded HTML |
| `index.html:472` | 9 871× | použití Kalkulačky; období neuvedeno | hardcoded HTML |
| `index.html:473` | 8 204× | použití QR Generatoru; období neuvedeno | hardcoded HTML |
| `index.html:474` | 7 558× | použití Image Compress; období neuvedeno | hardcoded HTML |
| `index.html:475` | 6 902× | použití AI Chatu; období neuvedeno | hardcoded HTML |
| `index.html:476` | 5 414× | použití Konvertoru; období neuvedeno | hardcoded HTML |
| `index.html:477` | 4 880× | použití JSON Format; období neuvedeno | hardcoded HTML |
| `index.html:478` | 4 233× | použití Color Pickeru; období neuvedeno | hardcoded HTML |
| `index.html:490` | 2 847 291 | `XP rozdáno`; pouze „napříč všemi aplikacemi“, bez časového rámce | hardcoded `data-stat-target` + HTML; JS jen animuje |
| `index.html:491` | +12,4 % za týden | změna metriky XP | hardcoded HTML; desetinná tečka v kódu |
| `index.html:496` | 48 312 | dokončených lekcí; časový rámec neuveden | hardcoded `data-stat-target` + HTML; JS jen animuje |
| `index.html:497` | +8,1 % za týden | změna dokončených lekcí | hardcoded HTML; desetinná tečka v kódu |
| `index.html:498` | 142 | kurzů v Edu | hardcoded HTML |
| `index.html:502` | 14 802 | aktivních uživatelů měsíčně (MAU) | hardcoded `data-stat-target` + HTML; JS jen animuje |
| `index.html:503` | +2,7 % za týden | změna aktivních uživatelů | hardcoded HTML; desetinná tečka v kódu |
| `index.html:508` | 912 557 | vyřešených úloh v Tools/AI/kalkulačkách; časový rámec neuveden | hardcoded `data-stat-target` + HTML; JS jen animuje |
| `index.html:509` | +14,9 % za týden | změna vyřešených úloh | hardcoded HTML; desetinná tečka v kódu |
| `index.html:527,534,541,548,558,570` | 01–06 | pořadová čísla šesti principů | hardcoded HTML |
| `index.html:535` | 79+ | nástrojů v sekci Proč VeVit existuje | hardcoded HTML |
| `index.html:544` | 1→100 | rozsah gamifikačních levelů | hardcoded HTML |
| `index.html:553` | 2024 | údaj „Premium Gold · od 2024“ u testimonialu | hardcoded HTML |
| `index.html:563–565` | 2023, 2024, 2025 | timeline: start, Tools, Premium | hardcoded HTML |
| `index.html:575–577` | v0.9, v1.0, v1.1 | produktová verze / roadmap timeline | hardcoded HTML |
| `index.html:601–602` | 85 % | průběh Tools | hardcoded HTML + inline CSS custom property |
| `index.html:612–613` | 80 % | průběh Edu | hardcoded HTML + inline CSS custom property |
| `index.html:622` | 21+ | plánovaný počet her | hardcoded HTML |
| `index.html:622` | 2048 | název hry | hardcoded HTML |
| `index.html:623–624` | 35 % | průběh Games | hardcoded HTML + inline CSS custom property |
| `index.html:634–635` | 25 % | průběh Services | hardcoded HTML + inline CSS custom property |
| `index.html:644` | 1→100 | rozsah levelů Account | hardcoded HTML |
| `index.html:645–646` | 20 % | průběh Account | hardcoded HTML + inline CSS custom property |
| `index.html:650` | Q4 2025 | termín Search; k datu auditu je v minulosti | hardcoded HTML |
| `index.html:655` | 79 | počet nástrojů pro Search | hardcoded HTML |
| `index.html:656–657` | 65 % | průběh Search | hardcoded HTML + inline CSS custom property |
| `index.html:661` | Q4 2025 | termín Store; k datu auditu je v minulosti | hardcoded HTML |
| `index.html:666` | 20 % | Premium sleva ve Store | hardcoded HTML |
| `index.html:667–668` | 30 % | průběh Store | hardcoded HTML + inline CSS custom property |
| `index.html:709` | 2 | měsíce zdarma při roční platbě (skryté) | hardcoded HTML |
| `index.html:725–727` | 99 Kč/měsíc; 990 Kč/rok | Bronze cena (skryté) | hardcoded HTML/data atributy |
| `index.html:732–733` | +20 % XP; +50 XP denně | Bronze výhody (skryté) | hardcoded HTML |
| `index.html:753–755` | 199 Kč/měsíc; 1 990 Kč/rok | Silver cena (skryté) | hardcoded HTML/data atributy |
| `index.html:760–763` | +50 % XP; +150 XP denně; 100 AI dotazů/měsíc | Silver výhody (skryté) | hardcoded HTML |
| `index.html:781–783` | 399 Kč/měsíc; 3 990 Kč/rok | Gold cena (skryté) | hardcoded HTML/data atributy |
| `index.html:788–794` | +100 % XP; +400 XP denně; podpora do 24 hodin | Gold výhody (skryté) | hardcoded HTML |
| `index.html:811–813` | 1 499 Kč/měsíc; 14 990 Kč/rok | Platinum cena (skryté) | hardcoded HTML/data atributy |
| `index.html:818–823` | až 10 účtů; +150 % XP; podpora do 4 hodin | Platinum výhody (skryté) | hardcoded HTML |
| `index.html:929` | 2026 | rok copyrightu | hardcoded HTML |

### Rozpory a neověřené metriky zjištěné při inventuře

- Počet nástrojů: současně `100+`, `79` a `79+`.
- Počet her: aktivní stránka uvádí `21+`, zatímco neaktivní český překlad v `assets/js/ui.js:63` uvádí `18`.
- Všechny čtyři velké statistiky i jejich týdenní delty jsou hardcoded. V tomto repozitáři není dohledatelný jejich původ ani datum začátku měření.
- Osm počtů použití nejpoužívanějších nástrojů je hardcoded a nemá uvedené období ani zdroj.
- Roadmap termíny Q4 2025 a Q1 2026 jsou vzhledem k datu auditu 1. 8. 2026 zastaralé.
- Repozitář neobsahuje endpoint ani config s počty nástrojů, her, lekcí či uživatelů. Skutečné hodnoty nelze z tohoto checkoutu určit bez dalšího datového zdroje nebo přístupu k příslušné databázi/API.

## 5. Nálezy mimo rozsah

Tyto body nebyly opravovány:

1. **Kritické: přihlašovací údaj k databázi je uložen přímo v `api/config.php`.** Hodnota zde záměrně není opsána. Soubor by měl být považován za kompromitovaný secret, údaj rotován a konfigurace přesunuta mimo veřejný/document root nebo do bezpečné serverové konfigurace.
2. Adresář ani jeho nadřazené cesty neobsahují `.git`; `git status` končí chybou „not a git repository“. Standardní diff/worktree a commit workflow proto není dostupný.
3. Zadání popisuje `dc-runtime`, `renderVals()`, `sc-if` / `sc-for` a Supabase/PostgREST proxy. V aktuálním checkoutu se nic z toho nevyskytuje; nalezený účetní backend používá PDO/MySQL. Je nutné potvrdit, zda jde o správnou verzi projektu.
4. `index.html:21` načítá Tailwind z CDN a `index.html:22` Lucide z CDN. Nejde o lokální Node build step, ale stránka má runtime závislost na externích skriptech.
5. Kontaktní formulář obchází lokální `public/send-mail.php` a odesílá jméno, e-mail a zprávu službě FormSubmit (`assets/js/app.js:232`). To je důležité pro budoucí GDPR microcopy.
6. Skryté Premium plány obsahují konkrétní ceny, benefity a nefunkční checkout stub. Skrytí není odstranění z HTML; obsah je dostupný ve zdrojovém kódu stránky.
7. Footer obsahuje mrtvé odkazy `href="#"` pro Premium, Kontakt, FAQ a Status a obecné, nikoli projektové cíle pro GitHub, X/Twitter a Ko-fi.
8. Celé produktové a showcase karty jsou odkazy bez samostatné textové CTA. To komplikuje požadavek, aby každý interaktivní prvek patřil do jedné ze čtyř tříd tlačítek, aniž by se měnila struktura/layout.
9. Požadovaný soubor `vevit---vše-na-jednom-místě-DESIGN.md` v tomto checkoutu neexistuje. Produkční soubory neobsahují nevalidní `#10b98`; nalezené zelené tokeny používají platné `#10b981`.
10. `assets/js/auth.js` a `assets/css/style.css` vypadají jako osiřelé soubory starší implementace; nejsou načtené z `index.html`. Soubor `assets/js/ui.js` byl v rámci schváleného rozšíření jazykové vrstvy zapojen před `assets/js/app.js`.
11. Odpovědi `GET` ani `OPTIONS` z `https://account.vevit.cz/api/me.php` při požadavku s `Origin: https://tools.vevit.cz` neobsahovaly hlavičku `Access-Control-Allow-Origin`. Jde o potenciální blokátor budoucího SSO z prohlížeče napříč doménami; náprava patří do Account backendu, nikoli do tohoto landing page checkoutu.

## 6. Rozhodnutí potřebná před krokem 1

1. Potvrdit, že jde o správný checkout i přes zásadní rozdíl oproti popsanému stacku.
2. Určit autoritativní databázi/API pro reálné počty nástrojů, her, lekcí a uživatelů; v tomto checkoutu není připojení ani schéma `tool_*`.
3. Rozhodnout, zda aktivní copy upravovat přímo v `index.html`, nebo nejprve zapojit starou i18n vrstvu. Druhá možnost je strukturální práce nad rámec pouhého copy.
4. Dodat nebo potvrdit umístění chybějícího `vevit---vše-na-jednom-místě-DESIGN.md`.

## 7. Přehled provedených změn

| soubor:řádek | před | po | důvod |
|---|---|---|---|
| `copy-audit.md:1` | soubor neexistoval | vytvořen audit kroku 0 | Povinný výstup inventury před jakoukoli implementací. |
| `assets/js/ui.js:3` | neaktivní překladový objekt bez číselných konstant | aktivní `UI.values`, interpolace `{TOOLS_COUNT}`, hydratace textů a progress hodnot | Jeden zdroj pravdy bez `renderVals()`. |
| `index.html:179,193,263,271,330,467,535,655` | hardcoded `100+`, `79` nebo `79+` | vazby na `landing.counts.*` | Odstranění rozporů bez odhadu skutečného počtu. |
| `index.html:595–679` | smíšené stavové texty, procenta a prošlé termíny | schválené stavy z `ui.js`, pouze procenta | P0.1 varianta A. |
| `index.html:689–699` | opakované „již brzy“, `Prémium připravujeme`, registrační CTA | sjednocené `VeVit Premium`, CTA `Upozornit na spuštění` → `#kontakt` | P0.2 varianta A. |
| `assets/js/app.js:252` | bez notification flow | předvyplnění předmětu a zprávy, fokus na e-mail | Funkční a pravdivé chování Premium CTA. |
| `copy-open-questions.md:1` | soubor neexistoval | přidán produktový blokátor skrytého ceníku | Ceník zůstává bez funkčního checkoutu. |
| `tests/copy-p0-test.php:1` | test neexistoval | regresní kontrola P0.1, P0.2 a zdroje pravdy | Opakovatelné ověření bez Node.js. |
| `index.html:225` | textové `Ve / CORE` | dekorativní `images/logo_text.png` | Schválené logo uprostřed atomu bez změny geometrie nebo animací. |
| `assets/css/main.css:1154` | typografie `orbit-core-mark/tag` | contained `.orbit-core-logo` s jemným drop-shadow | Čitelnost tyrkysového loga na tmavém radiálním pozadí. |
| `assets/js/ui.js:97` | Services popsané jako PDF/AI utility | tržiště poptávek a nabídek ve stylu cechovní nástěnky | Schválená copy varianta A a aktivní jazykový zdroj pravdy. |
| `index.html:56,407–410,633` | hardcoded a věcně nesprávné Services popisy | vazby `landing.services.*` | Konzistentní popis v navigaci, kartě a roadmapě. |
| `assets/js/ui.js`, `index.html` | Account jako neaktivní „Připravuje se“ s neověřenými sliby SSO, XP a levelů | aktivní odkaz, stav `V betě`, schválené omezené popisy a ponechaných 20 % | Veřejné přihlášení je dostupné, úplnost profilových a cross-domain funkcí nebyla potvrzena. |
| `copy-open-questions.md` | Account a počet nástrojů čekaly na produktové rozhodnutí | Account položka uzavřena a počet nástrojů nastaven na schválených `100+` | Zapracována schválená produktová rozhodnutí. |
| `copy-audit.md` | chybělo zjištění z ověření Account endpointu | nález chybějícího `Access-Control-Allow-Origin` pro `tools.vevit.cz` | Potenciální blokátor budoucího cross-origin SSO je zaznamenán mimo rozsah. |
| `docs/superpowers/specs/2026-08-01-orbit-logo-services-copy-design.md:1` | soubor neexistoval | schválený mini-design | Dokumentace hranic změny a vizuálního ověření. |
| `docs/superpowers/plans/2026-08-01-orbit-logo-services-copy.md:1` | soubor neexistoval | implementační plán | Test-first provedení schválené změny. |

V samotném kroku 0 nebyl změněn žádný produkční HTML, CSS, JS ani PHP soubor. Následné změny P0.1/P0.2 jsou uvedeny výše.

## 8. Definice hotovo

Kontrolní seznam bude vyhodnocen po dokončení kroků 1–8. V kroku 0 jsou body záměrně ponechány neuzavřené; inventura výše už dokládá, že několik z nich v aktuálním stavu neprochází.

- [ ] Žádné dvě čísla na stránce si neodporují
- [ ] Žádné číslo nástrojů/her/lekcí/uživatelů není hardcoded v HTML
- [ ] Každá statistika má popisek s jednotkou i časovým rámcem
- [ ] Celá stránka tyká, nikde není vykání
- [ ] Žádný nadpis nepoužívá anglický Title Case
- [ ] Stavové štítky používají jen čtyři schválené hodnoty
- [ ] Každý interaktivní prvek patří do jedné ze čtyř tříd tlačítek
- [ ] Žádné tlačítko nemá jako text holou doménu
- [ ] Žádné tlačítko nepoužívá `Zjistit více` / `Klikni sem` / holé `Odeslat`
- [ ] Každé tlačítko má všech šest stavů včetně `:focus-visible`
- [ ] Zelená tlačítka mají tmavý text `#0a0a0a`, nikde není bílá na `#10b981`
- [ ] `#6b7280` se nepoužívá pro text menší než 18px
- [ ] Každý dotykový cíl má minimálně 44×44 px
- [ ] Celá stránka je proklikatelná Tabem s viditelným focusem
- [ ] Formulář má labely, chyby u polí, `aria-live` a hlášku o GDPR
- [ ] Každá karta „Připravujeme“ má akci nebo termín
- [ ] `#10b98` se nikde nevyskytuje
- [x] Nepřibyla žádná Node.js závislost ani build step
- [x] `service_role` klíč se nikde nedostal do klientského kódu (v aktuálním checkoutu se Supabase/service role nepoužívá)
