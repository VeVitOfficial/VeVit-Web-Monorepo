# Přirozenější vícejazyčné texty portálu VeVit

## Cíl

Upravit veřejné texty portálu tak, aby zněly přirozeně, konkrétně a méně jako automaticky vytvořený marketing. Z uživatelského copy odstranit dlouhé pomlčky a nahradit strojené fráze běžným jazykem.

## Rozsah

Úprava zahrnuje:

- veřejné texty, metadata a přístupnostní popisky v `index.html`,
- všechny jazykové varianty v `assets/js/ui.js`,
- dynamické uživatelské hlášky v `assets/js/app.js`,
- dynamické uživatelské hlášky v `assets/js/premium.js`, pokud obsahují text určený návštěvníkům.

Úprava nezahrnuje:

- komentáře ve zdrojovém kódu,
- CSS názvy, JavaScriptové identifikátory a HTML atributy,
- URL, e-mailové adresy a technickou konfiguraci,
- interní auditní a plánovací dokumentaci,
- backendové zprávy, které se na landing page nepoužívají.

## Jazykový styl

Texty mají být krátké, přímé a srozumitelné. Každá věta má sdělovat konkrétní informaci. Obecné formulace jako „digitální svět bez hranic“, „vše pod jednou střechou“ nebo „tvoříme budoucnost“ se nahradí popisem skutečné funkce nebo nabídky.

Marketingové superlativy, neurčité sliby a zbytečně vznešené formulace se odstraní. Text může zůstat přátelský, ale nemá působit přehnaně ani strojeně. Herní výrazy jako „quest“ a „skill“ se použijí jen tam, kde jsou součástí skutečné produktové terminologie. Jinak se nahradí běžnými výrazy jako „poptávka“ a „služba“.

Každý překlad se upraví jako přirozený text daného jazyka. Angličtina, španělština, němčina a ukrajinština se nebudou vytvářet mechanickou náhradou českých vět.

## Pravidla pro pomlčky

Z uživatelsky viditelných textů se odstraní znaky `—` a `–`. Věty se rozdělí, spojí čárkou nebo přeformulují podle významu.

Běžný spojovník `-` zůstane tam, kde je součástí názvu nebo zápisu. Týká se to například názvu `Ko-fi`, e-mailových adres, URL a zavedených technických výrazů.

## Zachování faktů a funkcí

Redakční úprava nesmí měnit:

- schválené počty a procenta,
- názvy produktů a veřejné domény,
- stav jednotlivých projektů,
- odkazy a chování ovládacích prvků,
- desktopové kopírování e-mailu a mobilní `mailto:`,
- význam právních, bezpečnostních a formulářových sdělení.

Text nesmí doplňovat neověřené funkce, výsledky, termíny, reference ani jiné veřejné sliby.

## Implementační přístup

Aktivní české texty zůstanou v současném zdroji pravdy. Texty napojené přes `data-ui-text` se upraví v `assets/js/ui.js`; ostatní viditelné texty se upraví přímo v `index.html`. Dynamické stavy zůstanou ve stávajících JavaScriptových handlerech.

Struktura HTML, CSS vzhled, odkazy a JavaScriptové chování se nebudou v rámci této změny předělávat.

## Ověření

Regresní test bude kontrolovat, že:

- veřejné HTML a aktivní uživatelské JavaScriptové texty neobsahují dlouhou ani krátkou typografickou pomlčku,
- schválené hodnoty roadmapy a počet nástrojů zůstaly zachované,
- odstraněný produkt se do veřejných zdrojů nevrátil,
- sociální ikony a chování kontaktního e-mailu zůstaly zachované.

Po automatických kontrolách se česká landing page otevře na localhostu v Chromiu. Zkontroluje se hydratace textů, rozložení po změně délky vět a absence prázdných textových prvků. Ostatní jazykové varianty se ověří strukturálně v překladovém objektu, protože stránka nyní nemá aktivní přepínač jazyků.

## Kritéria dokončení

- Veškeré veřejné copy v určeném rozsahu je přepracované ve všech pěti jazycích.
- V uživatelském copy nezůstaly znaky `—` ani `–`.
- Texty jsou konkrétní a neobsahují generické marketingové fráze uvedené v této specifikaci.
- Nezměnila se fakta, hodnoty, odkazy ani chování stránky.
- Automatické testy, syntaktické kontroly a česká kontrola v Chromiu projdou bez chyby.
