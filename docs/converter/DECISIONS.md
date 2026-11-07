# Převodník DOCX ⇄ PDF — rozhodnutí

Každé rozhodnutí: co, proč, alternativy. Nová rozhodnutí přidávej na konec, stará neměň
(když se rozhodnutí změní, napiš nové a odkaž na staré).

## D1 — Vendorované soubory do `public/tools/assets/js/lib/converter/`
- **Co:** WASM enginy, fonty a další statické soubory převodníku leží přímo v `public/tools/assets/js/lib/converter/`.
- **Proč:** `prepare:vercel` byl odstraněn v `dea3ca9` („public/ je zdroj (bez kopírovacího kroku prepare-vercel-assets)“). Od té doby je `public/` zdrojový strom, stejně jako u qpdf a ffmpeg.
- **Pozor:** `.gitignore` stále obsahuje `/public/`, takže nové soubory je nutné přidávat `git add -f`. Zapsáno jako nesrovnalost v PROGRESS.md (neopravuji, mimo scope).
- **Alternativy:** obnovit kopírovací skript (zbytečná složitost, odporuje dea3ca9).

## D2 — Nástroje nahrazují stávající slugy `word-to-pdf` a `pdf-to-word`
- **Co:** nové implementace pod stejnými slugy, stará implementace se smaže až po splnění prahů.
- **Proč:** zachová URL, SEO a odkazy; rozhodnutí Víta (odpověď 3).
- **Alternativy:** nové slugy `docx-to-pdf` / `pdf-to-docx` (duplicity v hubu, rozdělení SEO).

## D3 — Referenční výstup = desktopový LibreOffice (dočasně)
- **Co:** DOCX → PDF se porovnává proti `soffice --convert-to pdf` (LibreOffice desktop, verze v metrikách). V tabulkách metrik je sloupec označen „ref: LO desktop“.
- **Proč:** referenční PDF z Wordu zatím nejsou (odpověď 6). Až budou, metriky se přepočítají (`tests/converter/corpus/word-ref/`).

## D4 — Upstream licence vetext / vepdf ověřena
- **Co:** `vetext` je fork `storytold/wordcraft`, `vepdf` fork `storytold/pdfcraft`. GitHub API (2026-11-06) hlásí u obou `Apache-2.0` (`LICENSE-APACHE`); fork deklaruje `MIT OR Apache-2.0`. Při distribuci do prohlížeče stačí přiložit text licence a NOTICE (viz `docs/converter/LICENSES.md`).
- **Závislosti:** `deny.toml` forků povoluje jen permisivní licence (MIT, Apache, BSD, ISC, Zlib, Unicode, BSL, CC0) — kontrola konkrétního stromu závislostí WASM buildu je v `docs/converter/LICENSES.md`.

## D5 — Kód převodníku v TypeScriptu, workery bundluje Next (Turbopack)
- **Co:** logika v `src/lib/converter/`, workery `new Worker(new URL("./x.worker.ts", import.meta.url), { type: "module" })`. Malé npm závislosti (fflate, pdfjs-dist) se bundlují do chunku workeru, takže se stáhnou až s workerem. Velké binárky (WASM enginy, fonty) jsou vendorované statické soubory (D1) a stahují se `fetch` + Cache API.
- **Proč:** typová kontrola, testovatelnost čistých modulů v Node (type stripping), lazy loading zadarmo (chunk workeru). Repo jinak používá UMD skripty přes `loadScript()`, ty ale nejdou do workeru bez `importScripts` a nemají typy.
- **Alternativy:** ruční JS workery v `public/` (bez typů, duplicitní kód), Rust pro celou rekonstrukci (pomalejší iterace).

## D6 — DOCX → PDF engine: vetext (Rust → WASM), ne LibreOffice WASM
- **Co:** headless wrapper `wasm/docx-pdf` nad crates `vetext-docx` + `vetext-layout` + `vetext-pdf` (krilla). Vlastní TS engine (varianta C) zavržen.
- **Proč (měřeno, viz MEASUREMENTS.md):**
  - velikost: vetext 3,5 MB brotli (10,3 MB raw, včetně 4,2 MB zakompilovaných OFL fontů) vs. ZetaOffice 52,2 MB brotli (`soffice.wasm` 36,3 MB + `soffice.data` 15,9 MB, CDN hlavičky 2026-11-06);
  - shoda s LO desktop referencí na korpusu: počty stran 10/10 shodné, textová shoda 0,992–1,000, žádné chybějící ani přebývající znaky, QR dekódovatelný; vizuální SSIM 0,63–0,96 (rozdíly = svislý posun řádků, ne chybějící obsah);
  - rychlost: 10–160 ms na dokument (Node, WASM); LO WASM: studený start a převod viz MEASUREMENTS.md (benchmark v prohlížeči);
  - ZetaOffice potřebuje SharedArrayBuffer (vlákna) → v Safari bez `require-corp` nejede; vetext běží jednovláknově všude;
  - licence: vetext MIT/Apache, LO MPL-2.0 + povinnost nabízet zdroj buildu.
- **Riziko:** referencí je LO, ne Word (D3). Rozdíl LO ↔ Word u řádkování může být větší než LO ↔ vetext; vetext implementuje Word metriky řádku (`vetext_fonts::word::line_metrics`). Po dodání Word PDF přepočítat.
- **Alternativy:** LO WASM jako volitelný „maximální věrnost“ engine — odloženo (velikost, Vercel limity, CDN čeká na Víta).

## D7 — pdf.js 6.4.299 vendorovaný do `converter/pdfjs/`, ne bundlovaný
- **Co:** `pdf.min.mjs`, `pdf.worker.min.mjs`, `cmaps/`, `standard_fonts/`, `wasm/` (openjpeg, jbig2, qcms) a `iccs/` z npm `pdfjs-dist` zkopírované do `public/tools/assets/js/lib/converter/pdfjs/`; načítá se `import()` s `turbopackIgnore` (`assets.ts → importStatic`). `pdfjs-dist` je devDependency jen kvůli typům.
- **Proč:** pdf.js potřebuje vlastní worker a podpůrná data na stálých URL; bundlování přes Turbopack přidává riziko (top-level await, node polyfilly) a pdf.js by se zdvojil s chunkem workeru. Starý pdf.js 3.11 zůstává pro ostatních 35 PDF nástrojů beze změny.
- **Bezpečnost:** `isEvalSupported: false`, `enableXfa: false`, skriptovací `quickjs-eval.wasm` není vůbec nasazený.
- **Alternativy:** bundlovat `pdfjs-dist` (viz výše), upgradovat i starou 3.11 (mimo scope, riziko pro 35 nástrojů).

## D8 — PDF/A-2b přímo v enginu (vendorovaný `vetext-pdf` s jednou změnou)
- **Co:** `wasm/vendor/vetext-pdf` = kopie `vetext/crates/pdf` + `PdfOptions::pdfa`, které krille předá archival validator `A2_B` (`PATCH.md`).
- **Proč:** vetext export nemá jak předat krilla `Configuration`. Dodatečná úprava hotového PDF (XMP, OutputIntent přes pdf-lib) by nezaručila splnění (krilla validátor hlídá fonty, průhlednost, metadata už při zápisu).
- **Ověření:** všech 10 dokumentů korpusu se uloží jako PDF/A-2b (XMP `pdfaid:part=2`). Validace veraPDF neproběhla — instalace veraPDF (Java instalátor z webu) byla v tomto prostředí zamítnuta → čeká na Víta.

## D9 — Bez SharedArrayBuffer, jednovláknově; COEP beze změny
- **Co:** žádná část převodníku nepotřebuje SharedArrayBuffer: vetext běží v jednom vlákně, pdf.js má vlastní worker, OCR a stránky PDF → DOCX se paralelizují více workery. COEP zůstává `credentialless` pro celý web; `require-corp` pro stránky převodníku se nezavádí.
- **Proč:** Safari/WebKit `credentialless` nepodporuje, takže by bez `require-corp` neměl SAB — ale převodník SAB nevyžaduje, takže v Safari funguje stejně (WebKit e2e 10/10). `require-corp` by bez CORP hlaviček rozbil Turnstile/Google Fonts na těchto stránkách a nic by nepřinesl. Jednovláknová cesta je tak jediná cesta → není co rozbít „fallbackem“.
- **Alternativy:** `require-corp` jen na `/tools/word-to-pdf` a `/tools/pdf-to-word` (zkoušeno v úvaze, bez přínosu); vícevláknový build vetext (rayon + wasm threads) — layout je i tak 10–160 ms/dokument.

## D10 — Vizuální metrika: přísné SSIM i tolerantní SSIM
- **Co:** reportuje se `ssim` (8×8 okna, 150 DPI, bez prázdných oken) a `ssimSoft` (totéž po box blur r=2 ×2). Prahy CI jsou na `ssimSoft`; přísné SSIM se ukládá a hlídá v tabulkách.
- **Proč:** posun řádku o 1–2 px (jiné zaokrouhlení výšky řádku, jiné rozložení mezer u zarovnání do bloku) shodí přísné SSIM na 0,6 i u vizuálně shodné stránky; tolerantní varianta to odpustí, ale chybějící/přidaný obsah stále trestá (stará implementace word-to-pdf: 0,18–0,25; nová 0,91–0,99).

## D11 — WebKit testy v kontejneru, když hostitel nemá knihovny
- **Co:** `PW_WEBKIT_WS` = ws:// Playwright `run-server` v oficiálním obrazu `mcr.microsoft.com/playwright:v1.63.0-noble` (`--network host`). Testy, metriky a dev server běží na hostiteli. V CI (Ubuntu) se WebKit spouští normálně (`playwright install --with-deps`).
- **Proč:** Arch/Omarchy hostitel nemá systémové knihovny WebKitu a jejich instalace vyžaduje sudo.

## D12 — Cache API místo Service Workeru
- **Co:** engine, fonty, pdf.js a OCR data se po prvním stažení ukládají do Cache API (`vevit-converter-v1`); verze enginu v URL (`?v=` z `build.json`, který se čte vždy ze sítě, offline z cache). Service Worker se nezavádí.
- **Proč:** cíl „druhé použití okamžité“ splní Cache API (měřeno v MEASUREMENTS.md). Service Worker pro celý web je riziko (zachytává i navigace ostatních sekcí, aktualizace, COEP) bez přínosu pro převod.
- **Alternativy:** SW s precache převodníku — lze doplnit, pokud bude požadavek na plně offline stránku nástroje.

## D13 — Extrakce PDF: pdf.js 6, ne PDFium
- **Co:** pdf.js (Apache-2.0) a vlastní interpret operator listu (`pdf/extract.ts`).
- **Měřeno (`tools/bench-extract.ts`, korpus 10 PDF z LibreOffice, pravda = text zdrojových DOCX):** chybějící znaky pdf.js 0–1, PDFium (`@hyzyla/pdfium` 3.0.0) 0–1 — shodné; rozdíl jen v pořadí čtení surového textu, které stejně řeší rekonstrukce. Velikost: PDFium WASM 5,1 MB raw / 1,9 MB brotli, pdf.js 1,75 MB raw / 0,41 MB brotli (pdf.min.mjs + worker). pdf.js navíc dává barvy, cesty (konstrukce čar a výplní), obrázky v plném rozlišení, odkazy a strukturní strom.
- **Alternativy:** PDFium (rychlejší surová extrakce, větší, bez cest v JS API), vepdf/hayro z VeVit-office (Rust; ponecháno jako možnost pro budoucí výkon).

## D14 — OCR: tesseract.js 5 v okně, worker posílá obrázek stránky
- **Co:** worker PDF → DOCX pošle pixely obrázku skenované stránky (transferable), okno spustí tesseract.js (vlastní worker, data ces+eng ze stejného originu), vrátí slova s účařím řádku. `pdf/ocr.ts` slova narovná (deskew podle sklonu řádků) a převede na glyfy.
- **Proč:** tesseract.js je UMD (`importScripts`), modulový worker ho nenačte; v okně běží jen orchestrace, rozpoznávání je ve workeru tesseractu, UI nezamrzá. Data už jsou vendorovaná (nástroj ocr-pdf).
- **Oprava:** k vendorovanému tesseractu chyběl `tesseract-core-simd-lstm.js` (124 kB, Apache-2.0, z `tesseract.js-core@5.1.1`, stejný `.wasm`); převodník ho používá přes `corePath`. Nástroj ocr-pdf stále odkazuje na `.wasm.js` (nález mimo scope).

## D15 — Prahy PDF → DOCX podle režimu
- **Co:** upravitelný režim: tolerantní SSIM ≥ 0,4, text ≥ 0,95, ≤ 5 chybějících znaků; přesný režim: tolerantní SSIM ≥ 0,7, ≤ 5 chybějících znaků, pořadí textu se nehodnotí. Výjimky s důvodem v `thresholds.json`.
- **Proč:** upravitelný režim záměrně mění sazbu (odstavce tečou, Word metriky řádků) a referenční render je LibreOffice; posun o 1–2 pt na řádek sníží SSIM i u vizuálně shodné stránky. Pro srovnání: pdf2docx dosahuje na stejném korpusu 0,05–0,84.

## D16 — Řádkování víceřádkových odstavců „alespoň“ = rozteč z PDF
- **Co:** odstavce s více řádky dostanou `w:lineRule="atLeast"` s roztečí účaří změřenou v PDF; jednořádkové zůstávají „jednoduché“.
- **Proč:** násobek („auto“) závisí na metrikách fontu v aplikaci, která DOCX zobrazuje (LibreOffice a Word se liší), a chyba se sčítá po řádcích. Měřeno (tolerantní SSIM, LO render): dva-sloupce 0,20 → 0,61, diakritika 0,59 → 0,79, obrázky 0,88 → 0,995, sken 0,16 → 0,38; zhoršení jen zahlavi-zapati 0,57 → 0,35 (konstantní posun prvního nadpisu, otevřený problém 3). „Alespoň“ se při zvětšení písma neořízne, takže úpravy zůstávají pohodlné.
- **Zkoušeno a zamítnuto:** „alespoň“ i u jednořádkových odstavců (diakritika 0,79 → 0,66).

## D17 — PR proti `feat/tools-overhaul`
- **Co:** PR #3 `feat/converter-docx-pdf` → `feat/tools-overhaul` (obě větve pushnuté). Výchozí větev remote je `master`; `feat/tools-overhaul` (102 commitů mimo převodník) nebyla na remote.
- **Proč:** review obsahuje jen převodník. PR proti `master` by nesl i celou nepublikovanou práci `feat/tools-overhaul`. Merge pořadí: nejdřív `feat/tools-overhaul` → `master`, pak tento PR (rozhodne Vít).

## D18 — Příčina horší vizuální shody „diakritika-fonty“ (PDF → Word): ruční zalomení řádků
- **Zjištění (měřeno, `pdftotext -bbox-layout` originál vs. render):** vodorovně vše sedí — pravé okraje řádků ±0,1 pt, takže **šířky glyfů a mapování fontů jsou správně**; textová shoda 1,000 a 0 chybějících/přebývajících znaků, takže **ToUnicode ani kombinující znaky (č, ř, ů…) problém nejsou** (pdf.js dává předskládané znaky, NFC normalizace v metrice nic nemění). Chyba je **svislá**: v blocích Cambria/Arial/Times se řádky posouvaly o 0,25–0,35 pt na řádek (−1,6 pt po pěti řádcích).
- **Příčina:** řádky každého bloku jsou ve zdrojovém DOCX oddělené ručním zalomením (`<w:br/>`), nezalamují se. Rekonstrukce je správně nespojila do tekoucího odstavce, ale zapsala jako samostatné jednořádkové odstavce s „jednoduchým“ řádkováním. Výška takového řádku se pak počítá z metrik fontu v aplikaci, která DOCX zobrazí (LibreOffice ≠ Word metriky Caladea/Liberation), a rozdíl se sčítá po řádcích.
- **Oprava:** po sobě jdoucí řádky se stejnou roztečí, stejným odsazením a velikostí se spojí do jednoho odstavce se zalomeními (`<w:br/>`) a roztečí „alespoň“ z PDF (D16). Neplatí pro rozteč menší než přirozená výška řádku (šlo by jen „přesně“, které aplikace sázejí různě). Výsledek: tolerantní SSIM 0,793 → 0,918 (pdf2docx 0,835).

## D19 — Výška řádků tabulky bez tloušťky linek; linky záhlaví/zápatí patří k nim
- **Tabulky:** výška řádku z PDF je od středu linky ke středu další; Word i LibreOffice k `trHeight` přičtou polovinu horní a polovinu dolní linky (měřeno: mřížka 0,5 pt → +0,5 pt na řádek, jen dolní linka 0,75 pt → +0,375 pt). `trHeight` se o ni zmenší. Vícestránková tabulka 0,508 → 0,757 (pdf2docx 0,643), sloučené buňky 0,510 → 0,734 (0,538).
- **Záhlaví/zápatí:** vodorovná linka mezi textem záhlaví a tělem (a nad zápatím) se dřív brala jako obsah těla: posunula horní okraj stránky o ~17 pt a v těle vznikla prázdná linka. Teď je dolním (horním) ohraničením odstavce záhlaví (zápatí). 0,353 → 0,853 (pdf2docx 0,739).

## D20 — Pokus: COEP `require-corp` jen pro stránky převodníku (Safari)
- **Postup a výsledek (měřeno v Chromiu, Firefoxu a WebKitu 2026-11-07, dev server):**
  1. Výchozí stav (`credentialless` pro celý web): `crossOriginIsolated` Chromium **true**, Firefox **true**, WebKit **false** (credentialless nezná) — převodník funguje ve všech, SAB nepotřebuje.
  2. `require-corp` jen na `/[lang]/tools/{word-to-pdf,pdf-to-word}`: WebKit **true** (SharedArrayBuffer k dispozici), Chromium a Firefox převádějí dál. **WebKit ale nespustí worker enginu** („Převodní engine se nepodařilo stáhnout“, 6/6 testů převodu selhalo): skripty workerů (`/_next/static/…`, `/tools/assets/js/lib/…`) mají globální `credentialless`, které WebKit nezná, a pod dokumentem s `require-corp` je zablokuje.
  3. `require-corp` navíc na `/_next/static/*` a `/tools/assets/js/lib/*`: WebKit převádí (4/4), izolace zůstává.
- **Rozhodnutí:** nenasazeno, `next.config.ts` beze změny. Krok 3 mění hlavičky statických souborů celého webu (workery ffmpeg, OCR a dalších nástrojů by běžely s `require-corp`), a převodník přitom SharedArrayBuffer nepoužívá (D9) — přínos nulový, riziko pro ostatní nástroje nenulové.
- **Kdy se k tomu vrátit:** kdyby převodník dostal vícevláknový WASM (rayon + wasm threads). Pak stačí krok 3 omezit na `/_next/static/*` + `/tools/assets/js/lib/converter/*` a `tesseract/*` a ověřit ostatní nástroje s workery.

## D21 — Data OCR předkomprimovaná (`.traineddata.gz`) a statické přípony v proxy
- **Nález na preview deploymentu:** `/tools/assets/js/lib/tesseract/*.traineddata` vracel `308` na `/cs/tools/…` (proxy `src/proxy.ts` nezná příponu `.traineddata`, stejně tak `.bcmap` a `.pfb` z pdf.js) a po přesměrování se data posílala nekomprimovaná (`application/octet-stream`, 3,8 + 4,0 MB).
- **Oprava:** přípony `traineddata|gz|bcmap|pfb|txt` doplněny do `publicFile` v proxy; převodník stahuje `ces/eng.traineddata.gz` (`gzip: true` v tesseract.js, 1,7 + 1,9 MB). Původní `.traineddata` zůstávají pro nástroj ocr-pdf.

## D22 — Paměť v prohlížeči: plný Chromium, ne headless shell
- `performance.measureUserAgentSpecificMemory()` je v Chromiu dostupné na stránkách převodníku i s COEP `credentialless` (`crossOriginIsolated === true`), ale **ne v headless shellu**, který Playwright spouští ve výchozím stavu („not available“). Harness proto pro projekt chromium používá `channel: "chromium"` a `--enable-blink-features=ForceEagerMeasureMemory` (výsledek hned, ne až po GC).

## D23 — E2E proti Vercel preview: Security Checkpoint
- **Zjištění:** preview deployment (`*-vevit.vercel.app`) po prvních automatizovaných požadavcích odpoví stránkou „Vercel Security Checkpoint — Failed to verify your browser (Code 21)“; další testy pak nenajdou stránku nástroje. První 4 převody stihly proběhnout a daly stejné metriky jako lokálně (Word → PDF faktura: 1/1 strana, text 1,000, QR čitelný; vícestránková tabulka 4/4, tolerantní SSIM 0,966; PDF → Word faktura 0,765, text 1,000, QR čitelný).
- Preview navíc vkládá Vercel Toolbar (`vercel.live`, GET bez těla) — test soukromí ho teď povoluje stejně jako analytiku (žádné tělo, žádný obsah souboru).
- **Čeká na Víta:** pro e2e proti preview v CI je potřeba „Protection Bypass for Automation“ (tajný klíč projektu na Vercelu, hlavička `x-vercel-protection-bypass`) nebo výjimka ve firewallu — nastavení cloudu nedělám.

## D24 — Dvousloupcový sken: příčina pořadí textu a oprava v rekonstrukci (3. kolo)
- **Měřeno:** v prohlížeči textová shoda 0,29, v Node s tesseract CLI 0,77 — stejný sken i data. Slova zachycená z tesseract.js (`postMessage` workeru, Playwright) ukázala, že **tesseract.js má výchozí segmentaci PSM 6 (jeden blok)**, CLI PSM 3: každý řádek OCR vede přes oba sloupce („… Dokument Převodník běží …“) se společným účařím.
- **Zkoušeno:**
  1. PSM 3 v tesseract.js (`setParameters`): pořadí 0,776, ale tesseract při segmentaci stránky **zahodí celé řádky** („Tabulky zachovávají šířky sloupců, sloučené“ v obou sloupcích, 125 chybějících znaků — v CLI i v prohlížeči). Zamítnuto.
  2. PSM 6 a oprava rekonstrukce (přijato). Řádky přes sloupce samy o sobě nevadí — sloupce rozdělí XY-cut podle mezery. Tabulku z nich dělaly tři chyby: (a) tečka šumu u pravého okraje (box 2×2 px, OCR „i“ s jistotou 0,44) vytvořila třetí „sloupec“ zarovnané tabulky a nejširší svislou mezeru; (b) narovnání skenu otáčelo jen svisle, pravé okraje sloupce proto ujížděly o sklon × výška (280 → 285 pt); (c) `isTextColumn` bral za společný okraj maximum konců řádků, jeden přečnívající řádek ho posunul.
- **Oprava:** šum = jednoznakové slovo s jistotou < 0,6 a boxem < ⅓ typické výšky; narovnání je otočení (x i y); společný okraj = nejčastější konec řádků; zarovnaná tabulka se nevytvoří, když jde oblast rozříznout na dva sloupce tekoucího textu (pojistka pro skutečné slovo na okraji); sloupce sekce uvnitř buňky zapíše writer jako tabulku bez ohraničení (dřív se text zahodil).
- **Font a velikost z šířek slov:** OCR text dostával vždy Liberation Serif s velikostí z výšky slov; originál v Caladea pak v DOCX zalamoval jinak. Tabulka šířek čtyř dodávaných fontů (`pdf/ocr-widths.ts`, generuje `scripts/converter/gen-ocr-widths.mjs`, 3 kB) a pro každou rodinu „šířková velikost“ slova = šířka / šířka textu v em. Správná rodina má velikost u všech slov stejnou: na skenu mezikvartilové rozpětí Caladea 1,5 %, Liberation Serif 8 %, Carlito 6 %. Vybere se rodina s nejmenším rozpětím (pod 4 %, jinak Liberation Serif jako dřív), velikost z šířek, zbytek po zaokrouhlení na půl bodu dorovná prostrkání.
- **Přesný režim:** rámce jdou v pořadí čtení (`readingOrder`: svislý řez jen mezi sloupci prózy — dlouhé řádky z písmen, ne sloupce tabulky), dřív řádek po řádku přes oba sloupce.
- **Výsledek (Node, slova z tesseract.js):** upravitelný režim pořadí 0,292 → 0,804, chybí 12 znaků; přesný 0,267 → 0,787; nativní `dva-sloupce` v přesném režimu 0,292 → 0,792. Ostatních 11 dokumentů korpusu v obou režimech beze změny. Tolerantní SSIM upravitelného režimu skenu kleslo 0,54 → 0,36: dřív tabulka držela každý řádek na pixelu, teď tekoucí sloupce (nadpis není tučný — OCR tučnost nerozpozná). Pro vizuální shodu je přesný režim.
