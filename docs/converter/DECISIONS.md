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
