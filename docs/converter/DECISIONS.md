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
