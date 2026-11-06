# Převodník DOCX ⇄ PDF — průběh

Začni čtením tohoto souboru a `DECISIONS.md`. Licence: `LICENSES.md`, měření: `MEASUREMENTS.md`.

## Stav fází

| Fáze | Stav |
|---|---|
| 1 Průzkum, varianty, licence, velikosti, korpus, harness, baseline | rozpracováno |
| 2 DOCX → PDF + fonty + testy | čeká |
| 3 PDF → DOCX upravitelný režim | čeká |
| 4 PDF → DOCX přesný režim + OCR | čeká |
| 5 Integrace do hubu, i18n, cache/SW, velikosti, dokumentace | čeká |

## Hotovo
- Korpus: `tests/converter/corpus/` — `faktura-2026001.pdf` (originál od Víta), 10 generovaných DOCX (`generate.mjs`), PDF verze + sken (`make-pdfs.sh`), reference LO desktop v `ref-lo/`.
- Metriky (Node): `tests/converter/lib/metrics.mjs` — SSIM 8×8 bez prázdných oken, pixel diff s diff PNG, textová shoda (slova), chybějící/přebývající znaky, fonty, QR (jsQR).
- DOCX → PDF engine `wasm/docx-pdf` (vetext), vendorovaný build `public/tools/assets/js/lib/converter/docx-pdf/`.
- Fonty Carlito, Caladea, Liberation (WOFF2) v `public/tools/assets/js/lib/converter/fonts/`.

## Rozpracováno / další krok
- Worker + Playwright harness (Chromium/Firefox/WebKit), baseline stávajících `word-to-pdf` a `pdf-to-word`.

## Nálezy mimo scope (neopravuji)
- `.gitignore` obsahuje `/public/`, ale `public/` je od `dea3ca9` zdrojový strom (210+ souborů force-tracked). Nové soubory převodníku přidávám `git add -f`.
- `src/lib/tools-seo.ts`: hreflang jen cs/en/x-default při 7 jazycích (de, es, uk, fr, sk chybí).

## Čeká na Víta
- Referenční PDF z Wordu („Uložit jako PDF“) pro korpus `tests/converter/corpus/docx/*.docx` → uložit do `tests/converter/corpus/word-ref/`, metriky se přepočítají.
