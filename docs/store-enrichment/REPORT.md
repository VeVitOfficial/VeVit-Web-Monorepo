# Obohacení produktů VeVit Store – report

Datum ověření: 13. 11. 2026 · Zdroj dat: `docs/store-enrichment/*.json` (aplikováno skriptem `npm run store:enrich`)

## Souhrn

| Ukazatel | Počet |
|---|---|
| Produktů (SKU) v katalogu | 962 |
| Zpracovaných SKU (prověřeno proti zdrojům) | 962 |
| SKU s doplněnými informacemi (název, popis, parametry, zdroje) | 228 |
| z toho s fotkami výrobce | 211 |
| Stažených fotografií (unikátní soubory) | 613 |
| SKU nepřiřazených (ponechány / vráceny na sourcingová data) | 734 |
| Značek beze změny (nelze ověřit) | 5 |


## Po značkách

| Značka | SKU celkem | Obohaceno | z toho s fotkami | Nepřiřazeno | Fotek |
|---|---|---|---|---|---|
| 70mai | 30 | 27 | 27 | 3 | 59 |
| Baseus | 68 | 35 | 26 | 33 | 120 |
| Comix | 20 | 0 | 0 | 20 | 0 |
| Deli | 40 | 0 | 0 | 40 | 0 |
| JIECANG | 80 | 0 | 0 | 80 | 0 |
| LDNIO | 84 | 28 | 23 | 56 | 79 |
| M&G | 100 | 0 | 0 | 100 | 0 |
| ORICO | 140 | 13 | 13 | 127 | 41 |
| PETKIT | 20 | 6 | 6 | 14 | 31 |
| SIHOO | 60 | 11 | 11 | 49 | 38 |
| SINOART | 30 | 0 | 0 | 30 | 0 |
| Tenda | 40 | 21 | 18 | 19 | 18 |
| UGREEN | 180 | 31 | 31 | 149 | 93 |
| Vention | 70 | 56 | 56 | 14 | 134 |

## Zjištěné problémy v katalogu

- **Sourcingové skupiny jsou kartézské součiny parametrů.** Velká část SKU (UGREEN, ORICO, SIHOO, LDNIO lišty…) neodpovídá žádnému skutečnému výrobku – např. kabel USB-A 240 W, Lightning 240 W, powerbanka 5 000 mAh / 200 W, 2,5" SATA rámeček 40 Gb/s, „premium armrest“ u židlí SIHOO. Takové SKU jsem nepřiřadil a doporučuji je z katalogu odstranit.
- **Předchozí obohacení (`ugreen-2.json`, `ugreen-showcase.json`, `orico-2.json`, `ldnio-2.json`) dávalo údaje jednoho produktu všem variantám skupiny** (např. „100 W, 3× USB-C + 1× USB-A“ i u 20W nabíječky) a odkazovalo na obrázky, které nikdy nebyly v repozitáři → v obchodě byly rozbité obrázky. Opraveno: data přepsána po SKU, staré soubory odstraněny.
- **Ceny jsou orientační odhady ze sourcingu a u řady položek zjevně nesedí** (např. NAS UGREEN DXP6800 Pro 809 Kč, DXP4800 1 619 Kč, 70mai za 2 509 Kč u všech položek). Ceny nebyly součástí úkolu – doporučuji revizi.
- **Produkční DB nemá sloupce `weight_grams` a `vat_rate`** (migrace `202610200003_checkout_details` zřejmě není aplikovaná). Detail produktu proto padal na chybu 400 a nezobrazoval kód produktu – opraveno v `src/lib/store-data.ts`, ale migraci je vhodné ověřit (pokladna je používá).

## Produkty s nedostatkem fotografií

### Bez fotek výrobce (17 SKU)

- `baseus-100w-4-port` – Baseus GaN2 100W 4-Port nabíječka: Oficiální fotografie existují jen pro americkou verzi (US vidlice/zásuvky) – nepoužito, ponechán obrázek značky.
- `baseus-140w-3-port` – Baseus PowerMega 140W 3-Port nabíječka: Oficiální fotografie existují jen pro americkou verzi (US vidlice/zásuvky) – nepoužito, ponechán obrázek značky.
- `baseus-30w-2-port` – Baseus Super Si Pro 30W dvouportová nabíječka: Oficiální fotografie existují jen pro americkou verzi (US vidlice/zásuvky) – nepoužito, ponechán obrázek značky.
- `baseus-65w-2c1a` – Baseus GaN2 65W 3-Port nabíječka: Oficiální fotografie existují jen pro americkou verzi (US vidlice/zásuvky) – nepoužito, ponechán obrázek značky.
- `baseus-67w-desktop` – Baseus GaN5 67W 4-Port nabíjecí stanice: Oficiální fotografie existují jen pro americkou verzi (US vidlice/zásuvky) – nepoužito, ponechán obrázek značky.
- `baseus-gan-2-in-1-10000-45w` – Baseus GaN 2v1 Power Bank & nabíječka 10000mAh 45W: Oficiální fotografie existují jen pro americkou verzi (US vidlice/zásuvky) – nepoužito, ponechán obrázek značky.
- `baseus-gan3-pro-100w` – Baseus GaN3 Pro 100W stolní nabíječka: Oficiální fotografie existují jen pro americkou verzi (US vidlice/zásuvky) – nepoužito, ponechán obrázek značky.
- `baseus-gan3-pro-65w` – Baseus GaN3 Pro 65W stolní nabíječka: Oficiální fotografie existují jen pro americkou verzi (US vidlice/zásuvky) – nepoužito, ponechán obrázek značky.
- `baseus-powercombo-pro-40w` – Baseus PowerCombo Pro 40W 6-Port: Oficiální fotografie existují jen pro americkou verzi (US vidlice/zásuvky) – nepoužito, ponechán obrázek značky.
- `ldnio-a1508c-us-plug` – LDNIO A1508C 30W USB-C PD nabíječka (US): Výrobce nemá fotografie verze s vidlicí US – ponechán obrázek značky.
- `ldnio-a2526c-uk-plug` – LDNIO A2526C 45W dvouportová nabíječka PD+QC (UK): Výrobce nemá fotografie verze s vidlicí UK – ponechán obrázek značky.
- `ldnio-a2526c-us-plug` – LDNIO A2526C 45W dvouportová nabíječka PD+QC (US): Výrobce nemá fotografie verze s vidlicí US – ponechán obrázek značky.
- `ldnio-q1415-uk-plug` – LDNIO Q1415 45W USB-C PD nabíječka (UK): Výrobce nemá fotografie verze s vidlicí UK – ponechán obrázek značky.
- `ldnio-q1415-us-plug` – LDNIO Q1415 45W USB-C PD nabíječka (US): Výrobce nemá fotografie verze s vidlicí US – ponechán obrázek značky.
- `tenda-tx9-ax3000-home` – Tenda TX9 AX3000 Wi-Fi 6 router (home): Oficiální stránka (EOL) nemá produktovou fotografii – ponechán obrázek značky.
- `tenda-tx9-ax3000-office` – Tenda TX9 AX3000 Wi-Fi 6 router (office): Oficiální stránka (EOL) nemá produktovou fotografii – ponechán obrázek značky.
- `tenda-tx9-ax3000-school` – Tenda TX9 AX3000 Wi-Fi 6 router (school): Oficiální stránka (EOL) nemá produktovou fotografii – ponechán obrázek značky.

### Méně než 3 fotografie (25 SKU)

- `70mai-gps-module` – 70mai External GPS Module (Lite 2): 1 fotka
- `70mai-4g-hardwire-kit` – 70mai 4G Hardwire Kit: 1 fotka
- `70mai-up03-hardwire-kit` – 70mai Hardwire Kit UP03: 1 fotka
- `ldnio-a2317c-us-plug` – LDNIO A2317C 30W PD/QC nabíječka (US): 2 fotky
- `ldnio-q5-eu-plug` – LDNIO Q5 33W nabíječka USB-C/A (EU): 1 fotka
- `ldnio-q5-uk-plug` – LDNIO Q5 33W nabíječka USB-C/A (UK): 1 fotka
- `ldnio-q5-us-plug` – LDNIO Q5 33W nabíječka USB-C/A (US): 1 fotka
- `orico-storage-enclosure-2-5-sata-5gbps-abs` – ORICO 2,5" USB 3.0 rámeček na disk (černý): 1 fotka
- `sihoo-b100-black-footrest` – SIHOO B100 (černá, s podnožkou): 2 fotky
- `sihoo-m57-grey-standard` – SIHOO M57 (šedá): 2 fotky
- `tenda-ac8-home` – Tenda AC8 AC1200 dual-band gigabitový router (home): 2 fotky
- `tenda-ac8-office` – Tenda AC8 AC1200 dual-band gigabitový router (office): 2 fotky
- `tenda-ac8-school` – Tenda AC8 AC1200 dual-band gigabitový router (school): 2 fotky
- `tenda-f3-home` – Tenda F3 N300 Wi-Fi router (home): 1 fotka
- `tenda-f3-office` – Tenda F3 N300 Wi-Fi router (office): 1 fotka
- `tenda-f3-school` – Tenda F3 N300 Wi-Fi router (school): 1 fotka
- `ugreen-nasync-dxp2800-gt` – UGREEN NASync DXP2800 GT: 1 fotka
- `ugreen-nasync-dxp4800-gt` – UGREEN NASync DXP4800 GT: 1 fotka
- `ugreen-nexode-gan-100w-3-port-eu-plug` – UGREEN Nexode Pro 100W 3-Port Mini GaN (EU): 1 fotka – Výrobce má pro EU verzi jen 1 fotografii.
- `ugreen-nexode-gan-100w-4-port-eu-plug` – UGREEN Nexode 100W 4-Port GaN (EU): 1 fotka – Výrobce má pro EU verzi jen 1 fotografii.
- `ugreen-nexode-magflow-10000mah-30w-built-in-cable` – UGREEN Nexode Power Bank 10000mAh 30W s vestavěným kabelem: 1 fotka – Ostatní oficiální fotografie mají arabský text – použita pouze čistá produktová fotografie.
- `ugreen-usb-c-usb-c-60w-0-5m` – UGREEN kabel USB-C ↔ USB-C 60W (0,5 m): 1 fotka – Fotografie stejné produktové řady; délky se liší pouze délkou kabelu. Výrobce má jen 1 fotografii.
- `ugreen-usb-c-usb-c-60w-1m` – UGREEN kabel USB-C ↔ USB-C 60W (1 m): 1 fotka – Fotografie stejné produktové řady; délky se liší pouze délkou kabelu. Výrobce má jen 1 fotografii.
- `ugreen-usb-c-usb-c-60w-2m` – UGREEN kabel USB-C ↔ USB-C 60W (2 m): 1 fotka – Fotografie stejné produktové řady; délky se liší pouze délkou kabelu. Výrobce má jen 1 fotografii.
- `ugreen-usb-c-usb-c-60w-3m` – UGREEN kabel USB-C ↔ USB-C 60W (3 m): 1 fotka – Fotografie stejné produktové řady; délky se liší pouze délkou kabelu. Výrobce má jen 1 fotografii.

## Rozpory mezi zdroji, neověřené údaje a poznámky k přiřazení

- **70mai** (`70mai-cpl-filter`): Záznam ze sourcingu („CPL filter“) neuvádí model – přiřazeno k univerzálnímu CPL filtru 70mai pro řady A510/A500S/A800S; u modelů 4K T800/Omni/A810 se používají jiné filtry.
- **70mai** (`70mai-gps-module`): Sourcing uvádí jen „GPS module“ – v oficiálním obchodě je jediný externí GPS modul (pro Lite 2). Ověřit u dodavatele.
- **70mai** (`70mai-4g-hardwire-kit`): Výrobce 4G kit pro EU neuvádí (UP04 = AU/KR, UP05 = USA) – před naskladněním ověřit regionální verzi a podporu operátorů v ČR.
- **Baseus** (`baseus-10-in-1` a další): Sourcing neuvádí kód SKU – přiřazeno k odpovídajícímu oficiálnímu produktu Baseus.
- **LDNIO** (`ldnio-a1508c-us-plug` a další): Přiřazeno podle typového označení výrobce.
- **LDNIO** (`ldnio-scw1050-smart-plug-b2b` a další): Oficiální tabulka parametrů uvádí chybně model SCW3451 – použity jen údaje shodné s popisem.
- **ORICO** (`orico-nas-metabox-2-bay-premium` a další): Sourcing uvádí jen parametry (typ/rozhraní/materiál) – přiřazeno k odpovídajícímu oficiálnímu produktu ORICO; ověřit SKU u dodavatele. Rozlišení „premium/standard“ výrobce nezná.
- **ORICO** (`orico-orico-ssd-sata-ssd-1tb` a další): Sourcing uvádí jen parametry (typ/rozhraní/materiál) – přiřazeno k odpovídajícímu oficiálnímu produktu ORICO; ověřit SKU u dodavatele.
- **PETKIT** (`petkit-litter-pad-max-accessory`): Sourcing: „litter pad Max (accessory)“ – přiřazeno k oficiální podložce pro PuraMax.
- **PETKIT** (`petkit-pet-carrier-air-circulation`): Sourcing: „pet carrier (air circulation)“ – přiřazeno k batohu Breezy 2 s ventilátorem; použita krémově bílá barva.
- **PETKIT** (`petkit-smart-feeder-camera`): Sourcing: „smart feeder (camera)“ – přiřazeno k aktuálnímu krmítku PETKIT s kamerou (YumShare Solo 2).
- **PETKIT** (`petkit-water-fountain-wireless-pump`): Sourcing: „water fountain (wireless pump)“ – přiřazeno k fontáně EverSweet 3 Pro s bezdrátovým čerpadlem.
- **Tenda** (`tenda-ac6-home` a další): Varianty „home/office/school“ jsou jen segmenty ze sourcingu – výrobek je stejný.
- **UGREEN** (`ugreen-nasync-dx4800-plus`): Sourcing uvádí „DX4800 Plus“ – UGREEN tento název používá v EU pro model DXP4800 Plus.
- **UGREEN** (`ugreen-nasync-dxp480t-plus`): Rozměry se mezi zdroji liší (178–179 × 142 × 48–52 mm) – neuvedeno.
- **UGREEN** (`ugreen-nasync-dxp4800-gt`): Počet portů 10GbE se mezi zdroji liší (1 vs. 2) – uvedeno jen „10 Gb/s“.
- **Vention** (`vention-10-in-1-dock-premium` a další): Sourcing neuvádí kód SKU – přiřazeno k odpovídající oficiální řadě Vention; ověřit SKU u dodavatele.
- **Obecně:** u řady produktů je v parametrech jen to, co výrobce uvádí v názvu nebo tabulce (u UGREEN a Baseus nejsou textové specifikace na webu – část údajů je jen v obrázcích). Chybějící údaje (rozměry, hmotnost, obsah balení) nebyly dopočítávány ani odhadovány.
- **Značky, u kterých výrobce nemá EU galerii:** Baseus publikuje jen americké verze síťových nabíječek (US vidlice) – fotky nepoužity; LDNIO u části nabíječek ukazuje jen EU nebo US vidlici.

## Nepřiřazené produkty

### Značky beze změny

- **Comix** (20 SKU): Obecné názvy („A4 (premium)“, „heavy duty (premium)“) bez typového označení; oficiální katalog Comix (značka Deli) není veřejně dostupný.
- **Deli** (40 SKU): Typová označení (EQ20520, EG16, S801…) v oficiálním katalogu deliworld.com nejsou (vyhledávání běží jen přes JS a kódy nevrací); dohledatelná jen u třetích prodejců – fotky nepřevzaty.
- **M&G** (100 SKU): Obecné názvy („A4 (12-pack)“, „gel pen 0.5“) bez kódu produktu; oficiální web mgstationery.com je jen v čínštině a bez katalogu s kódy.
- **SINOART** (30 SKU): Obecné názvy („6pc“, „canvas pad“) bez typového označení; oficiální zdroj značky nenalezen.
- **JIECANG** (80 SKU): Typová označení rámů (JC35TS-E13S, JC35TF-R13S-2, Primer6.1…) se objevují jen v PDF z veletrhů a u velkoobchodníků; oficiální produktové stránky s fotkami neexistují. Ostatní položky jsou obecné („casters“, „drawer“).

### Ostatní nepřiřazené SKU (vráceny / ponechány na sourcingových datech)

<details><summary><b>70mai</b> – 3 SKU</summary>

- Název „64GB bundle“ neurčuje, jaké produkty sada obsahuje – výrobce nabízí řadu různých balíčků.  
  `70mai-64gb-bundle`
- Název „128GB bundle“ neurčuje, jaké produkty sada obsahuje.  
  `70mai-128gb-bundle`
- Obecný „hardwire kit“ – výrobce má UP02 (micro USB), UP03 a UP06 (USB-C); bez typového označení nelze jednoznačně určit.  
  `70mai-hardwire-kit`

</details>

<details><summary><b>Baseus</b> – 33 SKU</summary>

- V oficiální nabídce Baseus není produkt s těmito parametry.  
  `baseus-120w-car-charger`, `baseus-20w-1c`, `baseus-45w-2c1a`, `baseus-magnetic-100w`, `baseus-usb-c-60w-1m`, `baseus-usb-c-lightning`
- Obecný název bez typového označení – odpovídá více různým produktům Baseus, nelze jednoznačně přiřadit.  
  `baseus-3-in-1-retractable`, `baseus-battery-camera`, `baseus-bowie-anc-tws`, `baseus-bowie-open-ear`, `baseus-bowie-tws`, `baseus-cable-organizer-mid`, `baseus-cable-organizer-premium`, `baseus-car-vacuum`, `baseus-desktop-eu-6-port`, `baseus-dual-monitor-dock`, `baseus-laptop-stand-black`, `baseus-laptop-stand-mid`, `baseus-laptop-stand-premium`, `baseus-laptop-stand-white`, `baseus-office-headset`, `baseus-over-ear-anc`, `baseus-phone-mount`, `baseus-phone-stand-black`, `baseus-phone-stand-mid`, `baseus-phone-stand-premium`, `baseus-phone-stand-white`, `baseus-solar-camera`, `baseus-tablet-stand-black`, `baseus-tablet-stand-mid`, `baseus-tablet-stand-premium`, `baseus-tablet-stand-white`, `baseus-travel-strip`

</details>

<details><summary><b>LDNIO</b> – 56 SKU</summary>

- Typové označení se na oficiálním webu LDNIO nepodařilo dohledat nebo jde o obecný název.  
  `ldnio-100w-cable-b2b`, `ldnio-45w-car-charger-b2b`, `ldnio-65w-cable-b2b`, `ldnio-a303q-eu-plug`, `ldnio-a303q-uk-plug`, `ldnio-a303q-us-plug`, `ldnio-ds-101-hub-usb-c`, `ldnio-ds-104u-hub-b2b`, `ldnio-lc101-cable-1m`, `ldnio-lc102-cable-2m`, `ldnio-lc441c-c15-1m`, `ldnio-lc441c-c15-2m`, `ldnio-lc441c-c15-3m`, `ldnio-sc3604c-eu`, `ldnio-sc3604c-office`, `ldnio-sc3604c-travel`, `ldnio-sc5319-eu`, `ldnio-sc5319-office`, `ldnio-sc5319-travel`, `ldnio-se3631c-eu`, `ldnio-se3631c-office`, `ldnio-se3631c-travel`, `ldnio-sew4485-eu`, `ldnio-sew4485-office`, `ldnio-sew4485-travel`
- LDNIO A1508C vyrábí jen s americkou vidlicí (US).  
  `ldnio-a1508c-eu-plug`, `ldnio-a1508c-uk-plug`
- LDNIO A2317C se dodává jen s vidlicí EU nebo US.  
  `ldnio-a2317c-uk-plug`
- Kabel LS851/LS852 má varianty konektorů (USB-C/micro/Lightning) a délky jen 1/2 m – sourcing neurčuje konektor.  
  `ldnio-ls851-1m`, `ldnio-ls851-2m`, `ldnio-ls851-3m`
- Kabely LS901/LS902 se liší konektorem a délkou (1/2 m) – sourcing neurčuje konektor.  
  `ldnio-ls901-1m`, `ldnio-ls901-2m`, `ldnio-ls901-3m`, `ldnio-ls902-1m`, `ldnio-ls902-2m`, `ldnio-ls902-3m`
- Sourcing uvádí 10 000 mAh, oficiální LDNIO PQ27 má 20 000 mAh – rozpor, nelze přiřadit.  
  `ldnio-pq27-power-bank-10000mah`
- Sourcing uvádí 10 000 mAh, oficiální LDNIO PQ30 má 30 000 mAh – rozpor, nelze přiřadit.  
  `ldnio-pq30-power-bank-10000mah`
- Varianta „office“ není u výrobce rozlišena (smyšlená varianta ze sourcingu).  
  `ldnio-sc4383-office`, `ldnio-se2337-office`, `ldnio-se3436-office`, `ldnio-sew3452-office`
- Varianta „travel“ není u výrobce rozlišena (smyšlená varianta ze sourcingu).  
  `ldnio-sc4383-travel`, `ldnio-se2337-travel`, `ldnio-se3436-travel`, `ldnio-sew3452-travel`
- SK4396 je britská verze (UK zásuvky) – neodpovídá variantám EU/office/travel.  
  `ldnio-sk4396-eu`, `ldnio-sk4396-office`, `ldnio-sk4396-travel`
- SKW6457 je verze s britskými zásuvkami pro 100–120 V – neodpovídá variantám EU.  
  `ldnio-skw6457-eu`, `ldnio-skw6457-office`, `ldnio-skw6457-travel`
- SN5311 má americké zásuvky a vstup 100–120 V – pro EU nevhodné.  
  `ldnio-sn5311-eu`, `ldnio-sn5311-office`, `ldnio-sn5311-travel`

</details>

<details><summary><b>ORICO</b> – 127 SKU</summary>

- Kombinace parametrů neodpovídá konkrétnímu ověřitelnému produktu ORICO (nebo neexistuje, např. 2,5" SATA s 40 Gb/s).  
  `orico-hdd-ssd-dock-1-bay-nas-das`, `orico-hdd-ssd-dock-1-bay-offline-clone`, `orico-hdd-ssd-dock-1-bay-raid`, `orico-hdd-ssd-dock-1-bay-sata-dock`, `orico-hdd-ssd-dock-2-bay-nas-das`, `orico-hdd-ssd-dock-2-bay-offline-clone`, `orico-hdd-ssd-dock-2-bay-raid`, `orico-hdd-ssd-dock-2-bay-sata-dock`, `orico-hdd-ssd-dock-4-bay-nas-das`, `orico-hdd-ssd-dock-4-bay-offline-clone`, `orico-hdd-ssd-dock-4-bay-raid`, `orico-hdd-ssd-dock-4-bay-sata-dock`, `orico-hdd-ssd-dock-5-bay-nas-das`, `orico-hdd-ssd-dock-5-bay-offline-clone`, `orico-hdd-ssd-dock-5-bay-raid`, `orico-hdd-ssd-dock-5-bay-sata-dock`, `orico-kabely-thunderbolt4-1m-premium`, `orico-kabely-thunderbolt4-1m-standard`, `orico-kabely-usb-c-20gbps-premium`, `orico-kabely-usb-c-20gbps-standard`, `orico-kabely-usb3-2-10gbps-premium`, `orico-kabely-usb3-2-10gbps-standard`, `orico-kabely-usb4-40gbps-1m-premium`, `orico-kabely-usb4-40gbps-1m-standard`, `orico-kabely-usb4-40gbps-2m-premium`, `orico-kabely-usb4-40gbps-2m-standard`, `orico-mini-pc-mini-workstation-premium`, `orico-mini-pc-mini-workstation-standard`, `orico-mini-pc-n100-office-premium`, `orico-mini-pc-n100-office-standard`, `orico-mini-pc-ryzen-office-premium`, `orico-mini-pc-ryzen-office-standard`, `orico-nas-cyberdata-2-bay-premium`, `orico-nas-cyberdata-2-bay-standard`, `orico-nas-cyberdata-4-bay-premium`, `orico-nas-cyberdata-4-bay-standard`, `orico-nas-metacube-4-bay-premium`, `orico-nas-metacube-4-bay-standard`, `orico-nas-metahome-premium`, `orico-nas-metahome-standard`, `orico-orico-hub-dock-10-port-thunderbolt-4`, `orico-orico-hub-dock-10-port-usb-3-0`, `orico-orico-hub-dock-10-port-usb-c`, `orico-orico-hub-dock-10-port-usb4`, `orico-orico-hub-dock-12-port-thunderbolt-4`, `orico-orico-hub-dock-12-port-usb-3-0`, `orico-orico-hub-dock-12-port-usb-c`, `orico-orico-hub-dock-12-port-usb4`, `orico-orico-hub-dock-4-port-thunderbolt-4`, `orico-orico-hub-dock-4-port-usb-3-0`, `orico-orico-hub-dock-4-port-usb-c`, `orico-orico-hub-dock-4-port-usb4`, `orico-orico-hub-dock-6-port-thunderbolt-4`, `orico-orico-hub-dock-6-port-usb-3-0`, `orico-orico-hub-dock-6-port-usb-c`, `orico-orico-hub-dock-6-port-usb4`, `orico-orico-hub-dock-8-port-thunderbolt-4`, `orico-orico-hub-dock-8-port-usb-3-0`, `orico-orico-hub-dock-8-port-usb-c`, `orico-orico-hub-dock-8-port-usb4`, `orico-orico-ssd-msata-ssd-1tb`, `orico-orico-ssd-msata-ssd-256gb`, `orico-orico-ssd-msata-ssd-2tb`, `orico-orico-ssd-msata-ssd-4tb`, `orico-orico-ssd-msata-ssd-512gb`, `orico-orico-ssd-nvme-ssd-1tb`, `orico-orico-ssd-nvme-ssd-256gb`, `orico-orico-ssd-nvme-ssd-2tb`, `orico-orico-ssd-nvme-ssd-4tb`, `orico-orico-ssd-nvme-ssd-512gb`, `orico-orico-ssd-portable-ssd-1tb`, `orico-orico-ssd-portable-ssd-256gb`, `orico-orico-ssd-portable-ssd-2tb`, `orico-orico-ssd-portable-ssd-4tb`, `orico-orico-ssd-portable-ssd-512gb`, `orico-orico-ssd-sata-ssd-256gb`, `orico-stojany-laptop-premium`, `orico-stojany-laptop-standard`, `orico-stojany-mac-mini-premium`, `orico-stojany-mac-mini-standard`, `orico-stojany-pc-premium`, `orico-stojany-pc-standard`, `orico-stojany-phone-premium`, `orico-stojany-phone-standard`, `orico-stojany-tablet-premium`, `orico-stojany-tablet-standard`, `orico-storage-enclosure-2-5-sata-10gbps-abs`, `orico-storage-enclosure-2-5-sata-10gbps-aluminum`, `orico-storage-enclosure-2-5-sata-10gbps-transparent`, `orico-storage-enclosure-2-5-sata-20gbps-abs`, `orico-storage-enclosure-2-5-sata-20gbps-aluminum`, `orico-storage-enclosure-2-5-sata-20gbps-transparent`, `orico-storage-enclosure-2-5-sata-40gbps-abs`, `orico-storage-enclosure-2-5-sata-40gbps-aluminum`, `orico-storage-enclosure-2-5-sata-40gbps-transparent`, `orico-storage-enclosure-3-5-sata-10gbps-abs`, `orico-storage-enclosure-3-5-sata-10gbps-aluminum`, `orico-storage-enclosure-3-5-sata-10gbps-transparent`, `orico-storage-enclosure-3-5-sata-20gbps-abs`, `orico-storage-enclosure-3-5-sata-20gbps-aluminum`, `orico-storage-enclosure-3-5-sata-20gbps-transparent`, `orico-storage-enclosure-3-5-sata-40gbps-abs`, `orico-storage-enclosure-3-5-sata-40gbps-aluminum`, `orico-storage-enclosure-3-5-sata-40gbps-transparent`, `orico-storage-enclosure-3-5-sata-5gbps-abs`, `orico-storage-enclosure-m-2-nvme-10gbps-abs`, `orico-storage-enclosure-m-2-nvme-10gbps-aluminum`, `orico-storage-enclosure-m-2-nvme-20gbps-abs`, `orico-storage-enclosure-m-2-nvme-20gbps-aluminum`, `orico-storage-enclosure-m-2-nvme-20gbps-transparent`, `orico-storage-enclosure-m-2-nvme-40gbps-abs`, `orico-storage-enclosure-m-2-nvme-40gbps-aluminum`, `orico-storage-enclosure-m-2-nvme-5gbps-abs`, `orico-storage-enclosure-m-2-nvme-5gbps-aluminum`, `orico-storage-enclosure-m-2-nvme-5gbps-transparent`, `orico-storage-enclosure-m-2-sata-10gbps-abs`, `orico-storage-enclosure-m-2-sata-10gbps-aluminum`, `orico-storage-enclosure-m-2-sata-10gbps-transparent`, `orico-storage-enclosure-m-2-sata-20gbps-abs`, `orico-storage-enclosure-m-2-sata-20gbps-aluminum`, `orico-storage-enclosure-m-2-sata-20gbps-transparent`, `orico-storage-enclosure-m-2-sata-40gbps-abs`, `orico-storage-enclosure-m-2-sata-40gbps-aluminum`, `orico-storage-enclosure-m-2-sata-40gbps-transparent`, `orico-storage-enclosure-m-2-sata-5gbps-abs`, `orico-storage-enclosure-m-2-sata-5gbps-aluminum`, `orico-storage-enclosure-m-2-sata-5gbps-transparent`

</details>

<details><summary><b>PETKIT</b> – 14 SKU</summary>

- Obecný název bez typového označení – v oficiální nabídce PETKIT nelze produkt jednoznačně dohledat.  
  `petkit-2-in-1-trimmer-cat-dog`, `petkit-76l-litter-box-app`, `petkit-feeding-mat-silicone`, `petkit-grooming-brush`, `petkit-paw-cleaner-portable`, `petkit-smart-bowl-scale`
- Oficiální sušicí box AirSalon Max má 60 l, sourcing uvádí 63 l – nelze potvrdit shodu.  
  `petkit-grooming-dryer-box-63l`
- PuraMax 2 v oficiálním obchodě PETKIT není dostupná.  
  `petkit-pura-max-2-litter-box`
- Oficiální obchod nabízí jen Purobot Max Pro 2 (jiná generace).  
  `petkit-purobot-max-pro-litter-box`
- Oficiální filtry PETKIT se prodávají po 5 ks, ne 4/8 ks.  
  `petkit-replacement-filters-4-pack`, `petkit-replacement-filters-8-pack`
- Sourcing neuvádí model krmítka (3 l / 5 l) – nelze jednoznačně určit.  
  `petkit-smart-feeder-3l`, `petkit-smart-feeder-5l`
- Neurčený model fontány z nerezové oceli.  
  `petkit-water-fountain-stainless`

</details>

<details><summary><b>SIHOO</b> – 49 SKU</summary>

- Varianta „premium armrest“ není v oficiální nabídce SIHOO.  
  `sihoo-b100-black-premium-armrest`, `sihoo-b100-grey-premium-armrest`, `sihoo-c300-black-premium-armrest`, `sihoo-c300-grey-premium-armrest`, `sihoo-m18-black-premium-armrest`, `sihoo-m18-grey-premium-armrest`, `sihoo-m57-black-premium-armrest`, `sihoo-m57-grey-premium-armrest`, `sihoo-m59as-black-premium-armrest`, `sihoo-m59as-grey-premium-armrest`, `sihoo-s100-black-premium-armrest`, `sihoo-s100-grey-premium-armrest`, `sihoo-s300-black-premium-armrest`, `sihoo-s300-grey-premium-armrest`
- SIHOO tento model v šedé barvě nenabízí.  
  `sihoo-b100-grey-footrest`, `sihoo-b100-grey-standard`, `sihoo-c300-grey-footrest`, `sihoo-c300-grey-standard`, `sihoo-m18-grey-footrest`, `sihoo-m18-grey-standard`, `sihoo-m57-grey-footrest`, `sihoo-m59as-grey-footrest`, `sihoo-s100-grey-footrest`, `sihoo-s100-grey-standard`, `sihoo-s300-grey-footrest`, `sihoo-s300-grey-standard`
- Model SIHOO M105 není v oficiálních obchodech SIHOO dostupný – nelze ověřit fotografie ani parametry.  
  `sihoo-m105-black-footrest`, `sihoo-m105-black-premium-armrest`, `sihoo-m105-black-standard`, `sihoo-m105-grey-footrest`, `sihoo-m105-grey-premium-armrest`, `sihoo-m105-grey-standard`
- Verze s podnožkou není u tohoto modelu v oficiální nabídce SIHOO.  
  `sihoo-m18-black-footrest`, `sihoo-m57-black-footrest`, `sihoo-m59as-black-footrest`, `sihoo-s100-black-footrest`, `sihoo-s300-black-footrest`
- Model SIHOO M76A není v oficiálních obchodech SIHOO dostupný – nelze ověřit fotografie ani parametry.  
  `sihoo-m76a-black-footrest`, `sihoo-m76a-black-premium-armrest`, `sihoo-m76a-black-standard`, `sihoo-m76a-grey-footrest`, `sihoo-m76a-grey-premium-armrest`, `sihoo-m76a-grey-standard`
- Model SIHOO V1 není v oficiálních obchodech SIHOO dostupný – nelze ověřit fotografie ani parametry.  
  `sihoo-v1-black-footrest`, `sihoo-v1-black-premium-armrest`, `sihoo-v1-black-standard`, `sihoo-v1-grey-footrest`, `sihoo-v1-grey-premium-armrest`, `sihoo-v1-grey-standard`

</details>

<details><summary><b>Tenda</b> – 19 SKU</summary>

- Obecný název bez typového označení (switch, mesh, adaptér…) – odpovídá více modelům Tenda.  
  `tenda-16-port-gigabit-switch`, `tenda-16-port-poe`, `tenda-24-port-gigabit-switch`, `tenda-4g-lte-router`, `tenda-5-port-gigabit-switch`, `tenda-5-port-poe-switch`, `tenda-8-port-gigabit-switch`, `tenda-8-port-poe`, `tenda-ax1800-mesh-node`, `tenda-ax3000-mesh-node`, `tenda-ceiling-ap`, `tenda-mesh-2-pack`, `tenda-mesh-3-pack`, `tenda-outdoor-ap-5ghz`, `tenda-usb-wifi-adapter`, `tenda-wifi6-repeater`
- Model O3S Tenda nevyrábí (existuje O3 – 2,4 GHz a OS3 – 5 GHz); nelze jednoznačně určit.  
  `tenda-o3s-home`, `tenda-o3s-office`, `tenda-o3s-school`

</details>

<details><summary><b>UGREEN</b> – 149 SKU</summary>

- Kombinace výkonu/počtu portů/provedení neodpovídá žádnému produktu v oficiální nabídce UGREEN – nelze přiřadit fotky ani parametry.  
  `ugreen-nexode-gan-100w-1-port-desktop`, `ugreen-nexode-gan-100w-1-port-eu-plug`, `ugreen-nexode-gan-100w-2-port-desktop`, `ugreen-nexode-gan-100w-2-port-eu-plug`, `ugreen-nexode-gan-100w-3-port-desktop`, `ugreen-nexode-gan-140w-1-port-desktop`, `ugreen-nexode-gan-140w-1-port-eu-plug`, `ugreen-nexode-gan-140w-2-port-desktop`, `ugreen-nexode-gan-140w-2-port-eu-plug`, `ugreen-nexode-gan-20w-1-port-desktop`, `ugreen-nexode-gan-20w-2-port-desktop`, `ugreen-nexode-gan-20w-2-port-eu-plug`, `ugreen-nexode-gan-20w-3-port-desktop`, `ugreen-nexode-gan-20w-3-port-eu-plug`, `ugreen-nexode-gan-20w-4-port-desktop`, `ugreen-nexode-gan-20w-4-port-eu-plug`, `ugreen-nexode-gan-30w-1-port-desktop`, `ugreen-nexode-gan-30w-2-port-desktop`, `ugreen-nexode-gan-30w-2-port-eu-plug`, `ugreen-nexode-gan-30w-3-port-desktop`, `ugreen-nexode-gan-30w-3-port-eu-plug`, `ugreen-nexode-gan-30w-4-port-desktop`, `ugreen-nexode-gan-30w-4-port-eu-plug`, `ugreen-nexode-gan-45w-1-port-desktop`, `ugreen-nexode-gan-45w-2-port-desktop`, `ugreen-nexode-gan-45w-3-port-desktop`, `ugreen-nexode-gan-45w-3-port-eu-plug`, `ugreen-nexode-gan-45w-4-port-desktop`, `ugreen-nexode-gan-45w-4-port-eu-plug`, `ugreen-nexode-gan-65w-1-port-desktop`, `ugreen-nexode-gan-65w-1-port-eu-plug`, `ugreen-nexode-gan-65w-2-port-desktop`, `ugreen-nexode-gan-65w-2-port-eu-plug`, `ugreen-nexode-gan-65w-3-port-desktop`, `ugreen-nexode-gan-65w-4-port-desktop`, `ugreen-nexode-gan-65w-4-port-eu-plug`
- Kombinace kapacity/výkonu/typu neodpovídá produktu v oficiální nabídce UGREEN (např. 5 000 mAh / 200 W neexistuje).  
  `ugreen-nexode-magflow-10000mah-100w-built-in-cable`, `ugreen-nexode-magflow-10000mah-100w-magnetic-qi2`, `ugreen-nexode-magflow-10000mah-100w-standard`, `ugreen-nexode-magflow-10000mah-145w-built-in-cable`, `ugreen-nexode-magflow-10000mah-145w-magnetic-qi2`, `ugreen-nexode-magflow-10000mah-145w-standard`, `ugreen-nexode-magflow-10000mah-165w-built-in-cable`, `ugreen-nexode-magflow-10000mah-165w-magnetic-qi2`, `ugreen-nexode-magflow-10000mah-165w-standard`, `ugreen-nexode-magflow-10000mah-200w-built-in-cable`, `ugreen-nexode-magflow-10000mah-200w-magnetic-qi2`, `ugreen-nexode-magflow-10000mah-200w-standard`, `ugreen-nexode-magflow-10000mah-30w-magnetic-qi2`, `ugreen-nexode-magflow-10000mah-30w-standard`, `ugreen-nexode-magflow-10000mah-65w-built-in-cable`, `ugreen-nexode-magflow-10000mah-65w-magnetic-qi2`, `ugreen-nexode-magflow-10000mah-65w-standard`, `ugreen-nexode-magflow-20000mah-30w-built-in-cable`, `ugreen-nexode-magflow-20000mah-30w-magnetic-qi2`, `ugreen-nexode-magflow-20000mah-30w-standard`, `ugreen-nexode-magflow-20000mah-65w-standard`, `ugreen-nexode-magflow-5000mah-100w-built-in-cable`, `ugreen-nexode-magflow-5000mah-100w-magnetic-qi2`, `ugreen-nexode-magflow-5000mah-100w-standard`, `ugreen-nexode-magflow-5000mah-145w-built-in-cable`, `ugreen-nexode-magflow-5000mah-145w-magnetic-qi2`, `ugreen-nexode-magflow-5000mah-145w-standard`, `ugreen-nexode-magflow-5000mah-165w-built-in-cable`, `ugreen-nexode-magflow-5000mah-165w-magnetic-qi2`, `ugreen-nexode-magflow-5000mah-165w-standard`, `ugreen-nexode-magflow-5000mah-200w-built-in-cable`, `ugreen-nexode-magflow-5000mah-200w-magnetic-qi2`, `ugreen-nexode-magflow-5000mah-200w-standard`, `ugreen-nexode-magflow-5000mah-30w-built-in-cable`, `ugreen-nexode-magflow-5000mah-30w-magnetic-qi2`, `ugreen-nexode-magflow-5000mah-30w-standard`, `ugreen-nexode-magflow-5000mah-65w-built-in-cable`, `ugreen-nexode-magflow-5000mah-65w-magnetic-qi2`, `ugreen-nexode-magflow-5000mah-65w-standard`
- Kombinace počtu portů/rozhraní/rozlišení neodpovídá konkrétnímu modelu Revodok/Maxidok s ověřitelnými parametry.  
  `ugreen-revodok-maxidok-10-in-1-usb-c-4k60`, `ugreen-revodok-maxidok-10-in-1-usb-c-8k60`, `ugreen-revodok-maxidok-5-in-1-thunderbolt-4-4k60`, `ugreen-revodok-maxidok-5-in-1-thunderbolt-4-8k60`, `ugreen-revodok-maxidok-5-in-1-thunderbolt-4-dual-display`, `ugreen-revodok-maxidok-5-in-1-thunderbolt-5-4k60`, `ugreen-revodok-maxidok-5-in-1-thunderbolt-5-8k60`, `ugreen-revodok-maxidok-5-in-1-thunderbolt-5-dual-display`, `ugreen-revodok-maxidok-5-in-1-usb-c-4k60`, `ugreen-revodok-maxidok-5-in-1-usb-c-8k60`, `ugreen-revodok-maxidok-5-in-1-usb-c-dual-display`, `ugreen-revodok-maxidok-6-in-1-thunderbolt-4-4k60`, `ugreen-revodok-maxidok-6-in-1-thunderbolt-4-8k60`, `ugreen-revodok-maxidok-6-in-1-thunderbolt-4-dual-display`, `ugreen-revodok-maxidok-6-in-1-thunderbolt-5-4k60`, `ugreen-revodok-maxidok-6-in-1-thunderbolt-5-8k60`, `ugreen-revodok-maxidok-6-in-1-thunderbolt-5-dual-display`, `ugreen-revodok-maxidok-6-in-1-usb-c-4k60`, `ugreen-revodok-maxidok-6-in-1-usb-c-8k60`, `ugreen-revodok-maxidok-6-in-1-usb-c-dual-display`, `ugreen-revodok-maxidok-7-in-1-thunderbolt-4-4k60`, `ugreen-revodok-maxidok-7-in-1-thunderbolt-4-8k60`, `ugreen-revodok-maxidok-7-in-1-thunderbolt-4-dual-display`, `ugreen-revodok-maxidok-7-in-1-thunderbolt-5-4k60`, `ugreen-revodok-maxidok-7-in-1-thunderbolt-5-8k60`, `ugreen-revodok-maxidok-7-in-1-thunderbolt-5-dual-display`, `ugreen-revodok-maxidok-7-in-1-usb-c-4k60`, `ugreen-revodok-maxidok-7-in-1-usb-c-8k60`, `ugreen-revodok-maxidok-7-in-1-usb-c-dual-display`, `ugreen-revodok-maxidok-9-in-1-thunderbolt-4-4k60`, `ugreen-revodok-maxidok-9-in-1-thunderbolt-4-8k60`, `ugreen-revodok-maxidok-9-in-1-thunderbolt-4-dual-display`, `ugreen-revodok-maxidok-9-in-1-thunderbolt-5-4k60`, `ugreen-revodok-maxidok-9-in-1-thunderbolt-5-8k60`, `ugreen-revodok-maxidok-9-in-1-thunderbolt-5-dual-display`, `ugreen-revodok-maxidok-9-in-1-usb-c-4k60`, `ugreen-revodok-maxidok-9-in-1-usb-c-8k60`, `ugreen-revodok-maxidok-9-in-1-usb-c-dual-display`
- UGREEN v oficiální nabídce nemá USB-C kabel 140 W v těchto délkách – nelze ověřit.  
  `ugreen-usb-c-usb-c-140w-0-5m`, `ugreen-usb-c-usb-c-140w-1m`, `ugreen-usb-c-usb-c-140w-2m`, `ugreen-usb-c-usb-c-140w-3m`
- USB-A nepřenese 100–240 W a ani 60W kabel USB-A→USB-C UGREEN nenabízí – kombinace neexistuje.  
  `ugreen-usb-a-usb-c-100w-0-5m`, `ugreen-usb-a-usb-c-100w-1m`, `ugreen-usb-a-usb-c-100w-2m`, `ugreen-usb-a-usb-c-100w-3m`, `ugreen-usb-a-usb-c-140w-0-5m`, `ugreen-usb-a-usb-c-140w-1m`, `ugreen-usb-a-usb-c-140w-2m`, `ugreen-usb-a-usb-c-140w-3m`, `ugreen-usb-a-usb-c-240w-0-5m`, `ugreen-usb-a-usb-c-240w-1m`, `ugreen-usb-a-usb-c-240w-2m`, `ugreen-usb-a-usb-c-240w-3m`, `ugreen-usb-a-usb-c-60w-0-5m`, `ugreen-usb-a-usb-c-60w-1m`, `ugreen-usb-a-usb-c-60w-2m`, `ugreen-usb-a-usb-c-60w-3m`
- Lightning nabíjí max. desítky W – kabel USB-C→Lightning 60–240 W neexistuje.  
  `ugreen-usb-c-lightning-100w-0-5m`, `ugreen-usb-c-lightning-100w-1m`, `ugreen-usb-c-lightning-100w-2m`, `ugreen-usb-c-lightning-100w-3m`, `ugreen-usb-c-lightning-140w-0-5m`, `ugreen-usb-c-lightning-140w-1m`, `ugreen-usb-c-lightning-140w-2m`, `ugreen-usb-c-lightning-140w-3m`, `ugreen-usb-c-lightning-240w-0-5m`, `ugreen-usb-c-lightning-240w-1m`, `ugreen-usb-c-lightning-240w-2m`, `ugreen-usb-c-lightning-240w-3m`, `ugreen-usb-c-lightning-60w-0-5m`, `ugreen-usb-c-lightning-60w-1m`, `ugreen-usb-c-lightning-60w-2m`, `ugreen-usb-c-lightning-60w-3m`

</details>

<details><summary><b>Vention</b> – 14 SKU</summary>

- Vention v oficiálním obchodě nenabízí 4portový USB 3.0 hub.  
  `vention-4-port-usb3-premium`
- Vention nabízí DisplayPort 8K kabel jen jako optický v délkách 15–100 m; varianty 1–3 m nelze ověřit.  
  `vention-dp1-4-1m`, `vention-dp1-4-2m`, `vention-dp1-4-3m`
- Vention tento produkt v délce 2m nenabízí (oficiálně: 1M, 1.5M).  
  `vention-usb-c-audio-2m`
- Vention tento produkt v délce 3m nenabízí (oficiálně: 1M, 1.5M).  
  `vention-usb-c-audio-3m`
- Vention tento produkt v délce 3m nenabízí (oficiálně: 1M, 1.5M, 2M).  
  `vention-usb-c-dp-3m`, `vention-usb-c-hdmi-3m`
- Vention tento produkt v délce 3m nenabízí (oficiálně: 0.5M, 1M, 1.5M, 2M).  
  `vention-usb-c100w-3m`
- Vention nemá standardní 240W kabel USB-C ↔ USB-C (jen magnetickou verzi) – nelze ověřit.  
  `vention-usb-c240w-1m`, `vention-usb-c240w-2m`, `vention-usb-c240w-3m`
- Vention nabízí tento kabel jen v délce 1 m.  
  `vention-usb4-40gbps-2m`, `vention-usb4-40gbps-3m`

</details>

## Zdroje a licence

- Každý obohacený produkt má v DB (`store_products.sources`) URL oficiální produktové stránky, případně recenzí použitých k ověření, a datum ověření; každý soubor fotky má v JSON (`imageSources`) původní URL a rozlišení.
- Fotografie pocházejí výhradně z oficiálních webů a obchodů výrobců (70mai.store, ugreen.com, sihoooffice.com, petkit.com, ventiontech.com, baseus.com, oricotechs.com, ldnio.com, tendacn.com). Obrázky z Amazonu/AliExpressu ani od prodejců nebyly použity.
- **Licence:** dostupnost obrázku na webu výrobce neznamená automaticky právo k použití. Produktové fotky výrobci obvykle poskytují autorizovaným prodejcům – před ostrým spuštěním doporučuji potvrdit u dodavatelů / distributorů souhlas s použitím (případně si vyžádat oficiální press/marketing balíček).

## Testování

- Konzistence DB ↔ repozitář: 0 odkazů na chybějící soubor, 0 necommitnutých obrázků.
- Lokální server proti produkční DB: všech 228 obohacených produktových stránek vrací 200 a obsahuje popis, tabulku parametrů a všechny své fotky; všech 613 fotek vrací 200 (image/webp); optimalizátor `next/image` ověřen na vzorku 40 fotek.
- Prohlížeč (Playwright, desktop 1440 px a mobil 390 px): 10 produktů napříč značkami + katalog – 0 rozbitých obrázků, přepínání galerie funguje, tabulka parametrů vyplněná, žádný horizontální scroll; neobohacený produkt (Comix) se zobrazuje beze změny.
- `tsc --noEmit` a ESLint bez chyb.

## Změněné a nové soubory

- `scripts/store-enrich.mjs` – párování produktů bez `variant_group`, `officialName`, data po SKU (`variants`, `reset`), kontrola skupin bez shody.
- `src/lib/store-data.ts` – oprava dotazu na doplňkové údaje (chybějící sloupce v DB).
- `docs/store-enrichment/` – nové: `70mai.json`, `ugreen.json`, `sihoo.json`, `petkit.json`, `vention.json`, `baseus.json`, `orico.json`, `ldnio.json`, `tenda.json`, `REPORT.md`; odstraněno: `ugreen-2.json`, `ugreen-showcase.json`, `orico-2.json`, `ldnio-2.json`.
- `public/store/img/products/<produkt>/N.webp` – 613 fotografií (WebP, kvalita 85, max. 1600 px) v 141 složkách.
