# Převodník Word ⇄ PDF (VeVit Tools)

Dva nástroje hubu: `/[lang]/tools/word-to-pdf` a `/[lang]/tools/pdf-to-word`. Veškerý převod
běží v prohlížeči ve web workerech; server jen servíruje statické soubory. Stav, metriky a
otevřené problémy: [PROGRESS.md](PROGRESS.md), rozhodnutí: [DECISIONS.md](DECISIONS.md),
licence: [LICENSES.md](LICENSES.md), měření: [MEASUREMENTS.md](MEASUREMENTS.md).

## Architektura

```
UI (React, src/components/tools/tools/{word-to-pdf,pdf-to-word}.tsx, converter-ui.tsx)
 │  i18n: src/lib/converter/i18n.ts (7 jazyků)
 ├─ docx-pdf-client.ts ──► docx-pdf.worker.ts (modulový worker, bundluje Next)
 │                          ├─ zip-guard.ts (ZIP adresář, zip bomba, makra, šifrování)
 │                          ├─ fonts.ts (potřebné rodiny, metrické náhrady, hlášení substitucí)
 │                          ├─ assets.ts (fetch + průběh + Cache API)
 │                          └─ /tools/assets/js/lib/converter/docx-pdf/*.wasm  (vetext, Rust → WASM)
 │                               ← wasm/docx-pdf (wrapper), wasm/vendor/vetext-pdf (PDF/A-2b)
 ├─ pdf-docx-client.ts ──► pdf-docx.worker.ts
 │   └─ OCR v okně:        ├─ pdf.js 6 (/tools/assets/js/lib/converter/pdfjs/, D7)
 │      tesseract.js       ├─ pdf/extract.ts   glyfy, cesty, obrázky, odkazy, MCID
 │      (vlastní worker)   ├─ pdf/layout.ts    řádky, XY-cut, tabulky, odstavce, seznamy, záhlaví
 │                          ├─ pdf/ocr.ts       slova OCR → glyfy (narovnání, velikost písma)
 │                          ├─ pdf/convert.ts   upravitelný / přesný režim → DocModel
 │                          └─ pdf/docx-writer.ts  DocModel → OOXML (fflate)
 └─ preview.ts (náhled 1. strany přes pdf.js)
```

Soukromí: workery stahují jen soubory ze stejného originu (`/tools/assets/…`, `/_next/static/…`).
E2E testy zaznamenávají všechny požadavky po výběru souboru a selžou, když některý odejde
jinam, má tělo, nebo nese název či obsah souboru (`tests/converter/e2e/helpers.ts`).

## Vývoj

| Úkol | Příkaz |
|---|---|
| Unit testy (Node) | `node --test tests/converter/unit/` |
| E2E (Chromium, Firefox, WebKit) | `npx playwright test -c tests/converter/playwright.config.ts` (spustí `next dev`; `CONVERTER_BASE_URL=…` pro běžící server) |
| WebKit na hostiteli bez knihoven | `docker run -d --rm --network host mcr.microsoft.com/playwright:v1.63.0-noble npx -y playwright@1.63.0 run-server --port 3333 --host 127.0.0.1` a `PW_WEBKIT_WS=ws://127.0.0.1:3333/` |
| Přesný režim v e2e | `CONVERTER_MODES=editable,exact` |
| Výkon (Chromium, CDP) | `npx playwright test -c tests/converter/playwright.config.ts e2e/perf.spec.ts --project=chromium` |
| Souhrn metrik (markdown) | `node tests/converter/tools/summary.mjs [label]` |
| PDF → DOCX v Node (rychlá iterace) | `node tests/converter/tools/pdf2docx-node.ts [editable\|exact] [doc…]` |
| Strom bloků rekonstrukce | `node tests/converter/tools/layout-dump.ts <pdf> [--hocr file.hocr]` |
| Benchmark pdf2docx (AGPL, jen lokálně) | `PDF2DOCX_PY=… tests/converter/tools/bench-pdf2docx.sh` a `node tests/converter/tools/score-docx.ts tests/converter/out/pdf2docx` |
| Benchmark extrakce pdf.js vs PDFium | `PDFIUM_DIR=… node tests/converter/tools/bench-extract.ts` |
| Přestavba korpusu | `node tests/converter/corpus/generate.mjs && tests/converter/corpus/make-pdfs.sh` |
| Přestavba WASM enginu | `scripts/converter/build-wasm.sh` (potřebuje `../VeVit-office`) |

Reference DOCX → PDF je zatím desktopový LibreOffice (D3). Až budou PDF z Wordu, uložte je do
`tests/converter/corpus/word-ref/<název>.pdf` a přepněte referenci v `e2e/docx-pdf.spec.ts`.
