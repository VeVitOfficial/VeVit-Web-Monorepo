# Převodník DOCX ⇄ PDF — průběh a závěrečná zpráva

Začni čtením tohoto souboru a `DECISIONS.md`. Architektura a příkazy: `README.md`, licence:
`LICENSES.md`, měření: `MEASUREMENTS.md`. Větev `feat/converter-docx-pdf` (nepushnuto).

## Stav fází

| Fáze | Stav |
|---|---|
| 1 Průzkum, varianty, licence, velikosti, korpus, harness, baseline | hotovo (kromě časů LibreOffice WASM v prohlížeči — viz otevřené problémy) |
| 2 DOCX → PDF + fonty + testy | hotovo |
| 3 PDF → DOCX upravitelný režim | hotovo, faktura splňuje všechny kontroly; vizuální shoda pod úrovní přesného režimu |
| 4 PDF → DOCX přesný režim + OCR | hotovo; OCR rozpoznává text ve všech prohlížečích, rekonstrukce dvousloupcového skenu je slabá |
| 5 Integrace do hubu, i18n, cache, velikosti, dokumentace | hotovo (Service Worker záměrně ne, D12) |

## Závěrečná zpráva

### Co funguje (ověřeno testy)
- **Word → PDF** (`/[lang]/tools/word-to-pdf`, nahrazuje mammoth+html2canvas): engine vetext (Rust → WASM, 3,4 MB brotli) ve web workeru, text zůstává textem, fonty vložené v DOCX, metricky kompatibilní náhrady (Carlito/Caladea/Liberation, stahují se jen potřebné řezy), volitelně fonty ze systému (Local Font Access), hlášení každé substituce, PDF/A-2b (krilla validátor), tagované PDF s osnovou a odkazy, ochrana proti zip bombě, makra se nikdy nespouští, šifrovaný DOCX s heslem, náhled 1. strany.
  - 10/10 dokumentů korpusu: počet stran = reference, text 0,992–1,000, 0 chybějících/přebývajících znaků, QR faktury čitelný, v Chromiu, Firefoxu i WebKitu. Tolerantní SSIM 0,91–0,99 (kromě `diakritika-fonty` 0,37 — výška řádků Cambria/Caladea, viz otevřené problémy). Stará implementace: text 0 (rastr), SSIM 0,18–0,25.
- **PDF → Word** (`/[lang]/tools/pdf-to-word`, nahrazuje pdf.js 3.11 + pdf-text-layout): upravitelný a přesný režim, OCR skenů.
  - Faktura `faktura-2026001.pdf`: tabulka 3×4 s řádky „Webová stránka | 1 | 15 000,00 Kč | 15 000,00 Kč“ a „Správa obsahu (hodiny) | 6 | 800,00 Kč | 4 800,00 Kč“, 19 800,00 Kč v buňce, QR dekódovatelný po převodu (vektorový QR → PNG přesně na mřížku modulů), zelená linka, dvousloupcový blok dodavatel/odběratel, prostrkané nadpisy, 1 strana — ve všech třech prohlížečích.
  - Upravitelný režim: styly Nadpis 1–3 / Normální / Odstavec se seznamem / Záhlaví / Zápatí / Tabulka, přímé formátování jen rozdílů, 0 textových rámců, mřížkové tabulky se sloučenými buňkami a stínováním, tabulky jen s linkami mezi řádky, vícestránková tabulka spojená do jedné (91 řádků) s opakovaným záhlavím, sloupce sekce, seznamy s číslováním, záhlaví/zápatí s poli PAGE/NUMPAGES, odkazy, obrázky v původním rozlišení.
  - Průměr tolerantního SSIM na korpusu (Node + LibreOffice render): **VeVit upravitelný 0,65**, **VeVit přesný 0,89**, pdf2docx 0,52; textová shoda VeVit upravitelný 0,97, pdf2docx 0,79. pdf2docx má vyšší tolerantní SSIM na 5 dokumentech z 12 (diakritika, sloučené buňky, záhlaví, vícestránková tabulka, sken — u skenu jen proto, že ponechá obrázek bez textu) — tabulka v MEASUREMENTS.md.
- **Soukromí:** ve všech e2e testech 0 síťových požadavků mimo origin / s tělem / s obsahem či názvem souboru (kromě analytiky webu, která obsah nenese — test to ověřuje).
- **Odolnost:** zip bomba, nesmyslný DOCX, šifrovaný DOCX, useknuté PDF a šifrované PDF skončí srozumitelnou chybou, stránka zůstane funkční; šifrované PDF se po zadání hesla převede, odkaz na nástroj Ochrana PDF heslem.
- **Kvalita kódu:** `npm run lint` 0 chyb (37 varování, žádné v kódu převodníku), `npm run typecheck` čistý, `npm run build` projde, unit testy 11/11.

### Tabulka metrik
Souhrn posledního finálního běhu proti produkčnímu buildu je v `MEASUREMENTS.md` (sekce „E2E“), generuje ho `node tests/converter/tools/summary.mjs final`.

### Seznam rozhodnutí
D1 vendorování do `public/…/converter/` · D2 stejné slugy · D3 reference = LibreOffice desktop · D4 licence vetext/vepdf ověřeny · D5 TypeScript + workery přes Next · D6 vetext místo LibreOffice WASM · D7 pdf.js 6 vendorovaný · D8 PDF/A-2b v enginu (vendorovaný vetext-pdf) · D9 bez SharedArrayBuffer, COEP beze změny · D10 přísné + tolerantní SSIM · D11 WebKit v kontejneru · D12 Cache API místo SW · D13 pdf.js místo PDFium · D14 OCR přes tesseract.js v okně · D15 prahy podle režimu · D16 řádkování „alespoň“ (viz DECISIONS.md).

## Otevřené problémy (zkoušeno, nevyřešeno)
1. **Výška řádku `diakritika-fonty` (Word → PDF):** odstavce s ručním zalomením a fontem Cambria/Caladea mají v enginu rozteč 14,49 pt, LibreOffice 13,65 pt → tolerantní SSIM 0,37 (prah s výjimkou 0,3). Engine implementuje Word metriky; kdo má pravdu, rozhodne PDF z Wordu. Oprava by byla ve vetext-layout (VeVit-office).
2. **Sken ve dvou sloupcích (OCR):** text se rozpozná (Chromium/Firefox/WebKit shodně, offline tesseract CLI textová shoda 0,77), ale rekonstrukce sloupců ze skenu je nespolehlivá (textová shoda v pořadí 0,29 v prohlížeči). Zkoušeno: narovnání podle sklonu řádků, velikost z výšky slov, svislý řez před pásy, „umožňující“ vodorovný řez. Další krok: brát bloky a pořadí přímo z tesseractu (`data.blocks`/`paragraphs`) místo vlastního XY-cutu.
3. **Upravitelný režim vs. LibreOffice render:** první řádek stránky bývá v LO o 1–2 pt níž (LO má pro Carlito jiný ascent než Word) → přísné SSIM 0,1–0,4 i u vizuálně shodných stran (`zahlavi-zapati`). Měřit ve Wordu.
4. **Časy LibreOffice WASM (ZetaOffice) v prohlížeči** nezměřeny (vyžaduje vlastní integraci UNO API). Rozhodnutí D6 stojí na změřené velikosti (52 MB brotli) a nutnosti SharedArrayBuffer.
5. **Paměť v prohlížeči:** `performance.measureUserAgentSpecificMemory` v testovacím Chromiu nedostupné; změřeno jen v Node — lineární paměť WASM enginu Word → PDF 15–26 MB na korpusu.
6. **Velikost enginu:** 47 % WASM tvoří zakompilované fonty vetextu (4,2 MB raw) a slovníky dělení slov (0,9 MB). Odstranit jde jen ve VeVit-office (cargo feature), viz „čeká na Víta“.
7. **Strukturní strom tagovaného PDF** se načítá (`page.getStructTree`), ale rekonstrukce ho zatím nevyužívá; geometrická rekonstrukce dává na korpusu správné tabulky i bez něj.

## Nálezy mimo scope (neopraveno)
- `.gitignore` obsahuje `/public/`, ale `public/` je od `dea3ca9` zdrojový strom (210+ souborů force-tracked). Nové soubory převodníku přidávám `git add -f`.
- `src/lib/tools-seo.ts`: hreflang jen cs/en/x-default při 7 jazycích (de, es, uk, fr, sk chybí).
- Nástroj `ocr-pdf` odkazuje na `tesseract-core-simd-lstm.wasm.js`, který ve vendorovaném tesseractu chybí (převodník používá doplněný `tesseract-core-simd-lstm.js`); ocr-pdf je pravděpodobně nefunkční.
- `TOOL_UI_I18N` a `HUB_I18N` mají pro de/es/uk/fr/sk jen češtinu (převodníky mají vlastní plné překlady).

## Čeká na Víta
- **Referenční PDF z Wordu** („Uložit jako PDF“) pro `tests/converter/corpus/docx/*.docx` → `tests/converter/corpus/word-ref/`; pak přepočítat metriky (D3) a rozhodnout otevřené body 1 a 3.
- **Validace PDF/A-2b veraPDF:** instalace veraPDF (Java instalátor z webu) byla v mém prostředí zamítnuta; spusťte `verapdf --flavour 2b` nad výstupem s volbou PDF/A.
- **Komprese `.wasm` na Vercelu:** `next start` posílá WASM nekomprimovaně (11 MB); ověřit po nasazení, že Vercel posílá brotli (`content-encoding: br`, ~3,4 MB). Jinak zvážit předkomprimovaný soubor.
- **Cargo features ve VeVit-office** (`vetext-fonts` bez zakompilovaných fontů, `vetext-proof` bez slovníků dělení) — engine by se zmenšil asi na polovinu; v tomto repu to nejde (path závislosti nelze patchovat).
- **Push / PR / merge / deploy** větve `feat/converter-docx-pdf` — neprovedeno dle pravidel.
- CI workflow `.github/workflows/converter.yml` je připravený, ale neběžel (žádný push).
