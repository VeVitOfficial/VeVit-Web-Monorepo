# Převodník Word ⇄ PDF — měření

Stav 2026-11-07. Prostředí: Linux x86_64 (Omarchy), Node 26, LibreOffice 26.8 (reference a neutrální
render), Playwright 1.63 (Chromium, Firefox, WebKit v kontejneru `mcr.microsoft.com/playwright:v1.63.0-noble`).
Reference DOCX → PDF = **LibreOffice desktop**, ne Word (D3) — po dodání PDF z Wordu přepočítat.

## Velikost stahování

Měřeno lokálně (`gzip -9`, `brotli -11`). Co uživatel skutečně stáhne, závisí na kompresi serveru:
`next start` posílá `.wasm` nekomprimovaně, Vercel komprimuje statické soubory podle typu — ověřit po
nasazení (čeká na Víta). Vše se stahuje až při prvním převodu a ukládá do Cache API (D12).

| soubor | raw | gzip -9 | brotli -11 | kdy se stahuje |
|---|---|---|---|---|
| `converter/docx-pdf/vevit_docx_pdf_bg.wasm` | 11MB | 4.8MB | 3.4MB | |
| `converter/docx-pdf/vevit_docx_pdf.js` | 13KB | 3.2KB | 2.8KB | |
| `converter/pdfjs/pdf.min.mjs` | 449KB | 129KB | 107KB | |
| `converter/pdfjs/pdf.worker.min.mjs` | 1.3MB | 366KB | 301KB | |
| `converter/pdfjs/wasm/openjpeg.wasm` | 246KB | 80KB | 66KB | |
| `converter/pdfjs/wasm/jbig2.wasm` | 102KB | 41KB | 33KB | |
| `converter/pdfjs/wasm/qcms_bg.wasm` | 95KB | 35KB | 29KB | |
| `tesseract/tesseract.min.js` | 66KB | 11KB | 8.4KB | |
| `tesseract/worker.min.js` | 121KB | 35KB | 28KB | |
| `tesseract/tesseract-core-simd-lstm.js` | 122KB | 28KB | 24KB | |
| `tesseract/tesseract-core-simd-lstm.wasm` | 2.8MB | 1.1MB | 805KB | |
| `tesseract/ces.traineddata` | 3.7MB | 1.7MB | 1.4MB | |
| `tesseract/eng.traineddata` | 4.0MB | 1.9MB | 1.6MB | |
| `converter/fonts/*.woff2` (20 řezů) | 2.5MB | (WOFF2) | (WOFF2) | jen potřebné rodiny |
|  – Carlito (4 řezy) | 778KB | | | |
|  – Caladea (4 řezy) | 127KB | | | |
|  – LiberationSans (4 řezy) | 586KB | | | |

| Scénář | stáhne se (brotli, odhad) |
|---|---|
| Word → PDF, dokument v Calibri (běžný Word) | engine 3,4 MB + Carlito ~0,2–0,8 MB (jen použité řezy) ≈ **3,6–4,2 MB** |
| Word → PDF, faktura v Arialu | engine 3,4 MB + Liberation Sans 2 řezy ~0,3 MB ≈ **3,7 MB** |
| PDF → Word (textové PDF) | pdf.js 0,41 MB (+ wasm dekodéry jen u JPX/JBIG2) ≈ **0,4 MB** |
| PDF → Word se skenem (OCR ces+eng) | + tesseract 0,9 MB + data 3,0 MB ≈ **4,3 MB** |
| Náhled výsledku PDF → Word | + engine Word → PDF 3,4 MB (jen na tlačítko, pokud není v cache) |

Engine DOCX → PDF obsahuje 4,2 MB raw zakompilovaných OFL fontů vetextu (Source Sans 3, Source Serif 4,
Inter, JetBrains Mono, ≈ 2 MB brotli). Odstranit je jde jen úpravou `vetext-fonts` (path závislost
všech crate; patch přes Cargo nejde) — příležitost na úsporu ~55 % enginu (PROGRESS, „další krok“).

## Volba enginu DOCX → PDF

| | vetext (zvoleno, D6) | LibreOffice WASM (ZetaOffice) |
|---|---|---|
| stažení (brotli) | 3,4 MB | 52,2 MB (`soffice.wasm` 36,3 MB + `soffice.data` 15,9 MB, hlavičky CDN 2026-11-06) |
| SharedArrayBuffer | ne (běží i v Safari bez `require-corp`) | ano (vlákna) |
| převod korpusu (Node, WASM) | 10–163 ms / dokument | neměřeno (viz níže) |
| převod v prohlížeči (e2e, studená cache, localhost) | 1,9–4,5 s vč. stažení a kompilace | neměřeno |
| licence | MIT/Apache-2.0 | MPL-2.0 + třetí strany buildu |

Čas načtení a převodu ZetaOffice v prohlížeči **nebyl změřen**: vyžaduje vlastní integraci UNO API
(zetajs), která nebyla v README; rozhodnutí stojí na 15× větším stažení a nutnosti SAB. Otevřený bod.

## Extrakce PDF: pdf.js vs PDFium (D13)

`tests/converter/tools/bench-extract.ts`, pravda = text zdrojových DOCX. „chybí/navíc“ = znaky (bez
ohledu na pořadí); „text“ = shoda slov v pořadí surového výstupu (pořadí řeší až rekonstrukce).

| dokument | pdf.js: text | chybí | navíc | ms | PDFium: text | chybí | navíc | ms |
|---|---|---|---|---|---|---|---|---|
| diakritika-fonty | 0.946 | 0 | 0 | 207 | 0.946 | 0 | 0 | 30 |
| dva-sloupce | 0.247 | 0 | 0 | 32 | 1.000 | 0 | 0 | 9 |
| faktura | 0.600 | 0 | 0 | 37 | 0.540 | 0 | 0 | 4 |
| landscape | 1.000 | 0 | 0 | 27 | 1.000 | 0 | 0 | 3 |
| obrazky | 1.000 | 0 | 0 | 102 | 1.000 | 0 | 0 | 3 |
| seznamy | 0.861 | 0 | 19 | 15 | 0.861 | 0 | 19 | 3 |
| sloucene-bunky | 0.949 | 0 | 0 | 19 | 1.000 | 0 | 0 | 3 |
| tabulka-vicestrankova | 0.867 | 0 | 123 | 82 | 0.983 | 0 | 123 | 15 |
| vlozeny-font | 1.000 | 0 | 0 | 30 | 1.000 | 0 | 0 | 2 |
| zahlavi-zapati | 0.963 | 1 | 44 | 19 | 0.954 | 1 | 44 | 6 |
