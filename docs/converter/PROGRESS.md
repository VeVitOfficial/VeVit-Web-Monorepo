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
- Hotové moduly (zatím bez testů a typecheck): `src/lib/converter/assets.ts` (fetch + průběh + Cache API), `limits.ts` (profil zařízení, limity), `zip-guard.ts` (centrální adresář ZIP, zip bomba, makra, šifrovaný DOCX), font manifest `public/.../converter/fonts/manifest.json`.
- Další kroky v tomto pořadí:
  1. `src/lib/converter/fonts.ts` (alias tabulka Calibri→Carlito…, sběr rFonts/theme fontů z DOCX regexem, ne DOMParserem), `docx-pdf.worker.ts` (dynamický import `docx-pdf/vevit_docx_pdf.js` s `turbopackIgnore`, initSync s bajty z cache), `client.ts`.
  2. Nová komponenta `word-to-pdf.tsx` (drag & drop, průběh stahování enginu a převodu zvlášť, varování o substituci, náhled 1. strany).
  3. Playwright harness `tests/converter/e2e/` (Chromium/Firefox/WebKit, síťový log soukromí) + baseline starých nástrojů; CI workflow (poppler-utils).
  4. Benchmark ZetaOffice v prohlížeči (studený start, převod) do MEASUREMENTS.md.
  5. PDF/A-2b: vendorovat `vetext-pdf` do `wasm/vendor/` a předat krilla `configuration` s archival validatorem (vetext export ji neumí nastavit).
- Měření nalezené cestou: wasm engine 10,3 MB raw / 3,5 MB brotli / 5,0 MB gzip; převod korpusu ve WASM (Node) 10–163 ms; LO WASM (ZetaOffice CDN) 36,3 + 15,9 MB brotli. Fonty WOFF2 celkem 2,6 MB (načítat jen potřebné rodiny).
- Pozor: `add_font` vyžaduje jméno rodiny (z manifestu); bez něj byl probe pomalý (6,4 s / 20 fontů).
- Poznámka: všechny části převodníku jsou jednovláknové, SharedArrayBuffer nepotřebují (běží i v Safari s `credentialless`). Test COEP `require-corp` pro Safari zatím neproběhl.

## Nálezy mimo scope (neopravuji)
- `.gitignore` obsahuje `/public/`, ale `public/` je od `dea3ca9` zdrojový strom (210+ souborů force-tracked). Nové soubory převodníku přidávám `git add -f`.
- `src/lib/tools-seo.ts`: hreflang jen cs/en/x-default při 7 jazycích (de, es, uk, fr, sk chybí).

## Čeká na Víta
- Referenční PDF z Wordu („Uložit jako PDF“) pro korpus `tests/converter/corpus/docx/*.docx` → uložit do `tests/converter/corpus/word-ref/`, metriky se přepočítají.
