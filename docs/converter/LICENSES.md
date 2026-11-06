# Převodník DOCX ⇄ PDF — licence

Stav 2026-11-06. Kód převodníku se distribuuje přímo do prohlížečů, proto se copyleft uplatní naplno.
Pravidlo: v produkčním bundlu jen permisivní licence (MIT, BSD, Apache-2.0, ISC, Zlib, Unicode, BSL, OFL pro fonty).

## Komponenty v produkčním bundlu

| Komponenta | Verze | Licence | Kde | Povinnosti při distribuci |
|---|---|---|---|---|
| vetext crates (doc, docx, fonts, layout, pdf, geom, metafile, proof) — fork `storytold/wordcraft` | 1.0.0-rc1 (VeVit-office `32319dd`) | MIT OR Apache-2.0 (upstream Apache-2.0, ověřeno GitHub API) | `docx-pdf/vevit_docx_pdf_bg.wasm` | text licence + NOTICE v `public/tools/assets/js/lib/converter/LICENSES.txt` |
| ve-pdf + krilla (PDF writer) | 0.1.0 / 0.8.2 | MIT OR Apache-2.0 | dtto | dtto |
| Rust závislosti WASM buildu (139 crates, `cargo tree -e normal --target wasm32`) | viz níže | MIT / Apache-2.0 / BSD-2/3 / Zlib / Unicode-3.0 / BSL-1.0 | dtto | souhrnný text licencí |
| Fonty ve vetext buildu (Source Sans 3, Source Serif 4, Inter, JetBrains Mono) | — | OFL-1.1 | zakompilované ve WASM | přiložit OFL |
| Carlito | Google Fonts `ofl/carlito` | OFL-1.1 | `converter/fonts/Carlito-*.woff2` | `OFL-Carlito.txt` |
| Caladea | Google Fonts `ofl/caladea` | OFL-1.1 | `converter/fonts/Caladea-*.woff2` | `OFL-Caladea.txt` |
| Liberation Sans/Serif/Mono | 2.1.5 | OFL-1.1 | `converter/fonts/Liberation*.woff2` | `OFL-Liberation.txt` |
| pdfjs-dist | 6.4.299 | Apache-2.0 | chunk workeru PDF → DOCX | NOTICE v bundlu (licenční komentář zůstává) |
| fflate | 0.8.2 | MIT | chunky workerů | licenční komentář |

Žádná GPL/LGPL/AGPL/MPL závislost ve WASM stromu (`grep -v MIT|Apache|BSD|Zlib|ISC|Unicode|BSL` nad `cargo tree` je prázdný).

## Pouze testy / benchmark (nikdy v produkčním buildu)

| Komponenta | Licence | Použití |
|---|---|---|
| LibreOffice desktop 26.8 | MPL-2.0 | referenční DOCX → PDF (D3), renderuje se mimo prohlížeč |
| poppler-utils (pdftoppm, pdftotext, pdffonts) | GPL-2.0+ | render a text pro metriky (spouští se jako proces, nelinkuje se) |
| pdf2docx | AGPL-3.0 (přes PyMuPDF) | benchmark PDF → DOCX, jen lokálně (odpověď 5), ve venv mimo repo |
| @playwright/test 1.63 | Apache-2.0 | harness |
| pngjs 7, jsqr 1.4 | MIT, Apache-2.0 | metriky (PNG, dekódování QR) |
| zbarimg (zbar) | LGPL-2.1 | kontrolní dekódování QR v CLI (volitelné) |
| Noto Serif (fixture vloženého fontu) | OFL-1.1 | `tests/converter/fonts-embed/` |

## Posouzené a nepoužité varianty

| Varianta | Licence | Co by znamenala |
|---|---|---|
| LibreOffice WASM (ZetaOffice, zetajs) | jádro MPL-2.0 (copyleft na úrovni souborů), zetajs MIT; build obsahuje i LGPL/GPL-kompatibilní třetí strany (např. hunspell MPL/LGPL/GPL tri-licence, ICU, cairo LGPL/MPL) | MPL: změněné soubory LO musíme zveřejnit ve zdrojové podobě, naše vlastní soubory ne. Self-host = distribuujeme binárku → povinnost nabídnout zdrojový kód odpovídající verze a texty licencí všech komponent buildu. Proveditelné, ale zátěž + 52 MB (viz MEASUREMENTS). Zamítnuto technicky (D6), ne licenčně. |
| MuPDF.js / PyMuPDF | AGPL-3.0 | povinnost zveřejnit zdroj celé aplikace → nepoužito |
| pdf2docx v produkci | AGPL-3.0 | nepoužito (jen benchmark) |

## Rust závislosti WASM enginu (DOCX → PDF)

| Crate | Verze | Licence |
|---|---|---|
| adler2 | 2.0.1 | 0BSD OR MIT OR Apache-2.0 |
| aes | 0.9.3 | MIT OR Apache-2.0 |
| alloc-no-stdlib | 2.0.4 | BSD-3-Clause |
| alloc-stdlib | 0.2.4 | BSD-3-Clause |
| arrayref | 0.3.9 | BSD-2-Clause |
| arrayvec | 0.7.8 | MIT OR Apache-2.0 |
| base64 | 0.22.1 | MIT OR Apache-2.0 |
| base64 | 0.23.1 | MIT OR Apache-2.0 |
| bitflags | 2.13.2 | MIT OR Apache-2.0 |
| block-buffer | 0.12.1 | MIT OR Apache-2.0 |
| brotli-decompressor | 5.0.3 | BSD-3-Clause/MIT |
| bumpalo | 3.20.3 | MIT OR Apache-2.0 |
| bytemuck | 1.25.2 | Zlib OR Apache-2.0 OR MIT |
| bytemuck_derive | 1.12.1 | (proc-macro) Zlib OR Apache-2.0 OR MIT |
| byteorder-lite | 0.1.0 | Unlicense OR MIT |
| bytes | 1.12.1 | MIT |
| cfb | 0.15.0 | MIT |
| cfg-if | 1.0.5 | MIT OR Apache-2.0 |
| chrono | 0.4.45 | MIT OR Apache-2.0 |
| cipher | 0.5.2 | MIT OR Apache-2.0 |
| cmov | 0.5.4 | Apache-2.0 OR MIT |
| color_quant | 1.1.0 | MIT |
| const-oid | 0.10.2 | Apache-2.0 OR MIT |
| cpubits | 0.1.1 | MIT OR Apache-2.0 |
| crc32fast | 1.5.2 | MIT OR Apache-2.0 |
| crypto-common | 0.2.2 | MIT OR Apache-2.0 |
| ctutils | 0.4.7 | Apache-2.0 OR MIT |
| digest | 0.11.3 | MIT OR Apache-2.0 |
| equivalent | 1.0.2 | Apache-2.0 OR MIT |
| fax | 0.2.7 | MIT |
| fdeflate | 0.3.7 | MIT OR Apache-2.0 |
| flate2 | 1.1.10 | MIT OR Apache-2.0 |
| float-cmp | 0.9.0 | MIT |
| fnv | 1.0.7 | Apache-2.0 / MIT |
| font-types | 0.11.3 | MIT OR Apache-2.0 |
| font-types | 0.12.6 | MIT OR Apache-2.0 |
| futures-core | 0.3.34 | MIT OR Apache-2.0 |
| futures-task | 0.3.34 | MIT OR Apache-2.0 |
| futures-util | 0.3.34 | MIT OR Apache-2.0 |
| getrandom | 0.3.4 | MIT OR Apache-2.0 |
| gif | 0.14.2 | MIT OR Apache-2.0 |
| half | 2.7.1 | MIT OR Apache-2.0 |
| harfrust | 0.13.3 | MIT |
| hashbrown | 0.17.1 | MIT OR Apache-2.0 |
| hmac | 0.13.0 | MIT OR Apache-2.0 |
| hybrid-array | 0.4.15 | MIT OR Apache-2.0 |
| image | 0.25.10 | MIT OR Apache-2.0 |
| imagesize | 0.14.0 | MIT |
| image-webp | 0.2.4 | MIT OR Apache-2.0 |
| indexmap | 2.14.2 | Apache-2.0 OR MIT |
| inout | 0.2.2 | MIT OR Apache-2.0 |
| itoa | 1.0.18 | MIT OR Apache-2.0 |
| js-sys | 0.3.106 | MIT OR Apache-2.0 |
| krilla | 0.8.2 | MIT OR Apache-2.0 |
| kurbo | 0.13.1 | Apache-2.0 OR MIT |
| log | 0.4.35 | MIT OR Apache-2.0 |
| memchr | 2.8.3 | Unlicense OR MIT |
| miniz_oxide | 0.8.9 | MIT OR Zlib OR Apache-2.0 |
| miniz_oxide | 0.9.1 | MIT OR Zlib OR Apache-2.0 |
| moxcms | 0.8.1 | BSD-3-Clause OR Apache-2.0 |
| num-traits | 0.2.19 | MIT OR Apache-2.0 |
| once_cell | 1.21.4 | MIT OR Apache-2.0 |
| pdf-writer | 0.15.0 | MIT OR Apache-2.0 |
| pin-project-lite | 0.2.17 | Apache-2.0 OR MIT |
| png | 0.18.1 | MIT OR Apache-2.0 |
| polycool | 0.4.0 | MIT OR Apache-2.0 |
| proc-macro2 | 1.0.107 | MIT OR Apache-2.0 |
| pxfm | 0.1.30 | BSD-3-Clause OR Apache-2.0 |
| quick-error | 2.0.1 | MIT/Apache-2.0 |
| quick-xml | 0.41.0 | MIT |
| quote | 1.0.47 | MIT OR Apache-2.0 |
| read-fonts | 0.39.2 | MIT OR Apache-2.0 |
| read-fonts | 0.43.3 | MIT OR Apache-2.0 |
| read-fonts | 0.44.0 | MIT OR Apache-2.0 |
| rustc-hash | 2.1.3 | Apache-2.0 OR MIT |
| ryu | 1.0.23 | Apache-2.0 OR BSL-1.0 |
| serde | 1.0.229 | MIT OR Apache-2.0 |
| serde_core | 1.0.229 | MIT OR Apache-2.0 |
| serde_derive | 1.0.229 | (proc-macro) MIT OR Apache-2.0 |
| serde_json | 1.0.154 | MIT OR Apache-2.0 |
| sha1 | 0.11.0 | MIT OR Apache-2.0 |
| sha2 | 0.11.1 | MIT OR Apache-2.0 |
| simd-adler32 | 0.3.10 | MIT |
| siphasher | 1.0.4 | MIT OR Apache-2.0 |
| skrifa | 0.42.1 | MIT OR Apache-2.0 |
| skrifa | 0.47.0 | MIT OR Apache-2.0 |
| slab | 0.4.12 | MIT |
| smallvec | 1.16.2 | MIT OR Apache-2.0 |
| stable_deref_trait | 1.2.1 | MIT OR Apache-2.0 |
| strict-num | 0.1.1 | MIT |
| subsetter | 0.2.6 | MIT OR Apache-2.0 |
| syn | 2.0.119 | MIT OR Apache-2.0 |
| syn | 3.0.6 | MIT OR Apache-2.0 |
| synstructure | 0.14.0 | MIT |
| thiserror | 2.0.21 | MIT OR Apache-2.0 |
| thiserror-impl | 2.0.21 | (proc-macro) MIT OR Apache-2.0 |
| tiff | 0.11.3 | MIT |
| tiny-skia-path | 0.12.0 | BSD-3-Clause |
| tinyvec | 1.13.3 | Zlib OR Apache-2.0 OR MIT |
| typenum | 1.20.1 | MIT OR Apache-2.0 |
| unicode-bidi | 0.3.18 | MIT OR Apache-2.0 |
| unicode-ident | 1.0.26 | (MIT OR Apache-2.0) AND Unicode-3.0 |
| unicode-linebreak | 0.1.5 | Apache-2.0 |
| unicode-normalization | 0.1.26 | (MIT OR Apache-2.0) AND Unicode-3.0 |
| unicode-script | 0.5.8 | MIT OR Apache-2.0 |
| unicode-segmentation | 1.13.3 | MIT OR Apache-2.0 |
| uuid | 1.29.0 | Apache-2.0 OR MIT |
| ve-pdf | 0.1.0 | MIT OR Apache-2.0 |
| vetext-doc | 1.0.0-rc1 | MIT OR Apache-2.0 |
| vetext-docx | 1.0.0-rc1 | MIT OR Apache-2.0 |
| vetext-fonts | 1.0.0-rc1 | MIT OR Apache-2.0 |
| vetext-geom | 1.0.0-rc1 | MIT OR Apache-2.0 |
| vetext-layout | 1.0.0-rc1 | MIT OR Apache-2.0 |
| vetext-metafile | 1.0.0-rc1 | MIT OR Apache-2.0 |
| vetext-pdf | 1.0.0-rc1 | MIT OR Apache-2.0 |
| vetext-proof | 1.0.0-rc1 | MIT OR Apache-2.0 |
| vevit-docx-pdf | 0.1.0 | MIT OR Apache-2.0 |
| wasm-bindgen | 0.2.129 | MIT OR Apache-2.0 |
| wasm-bindgen-macro | 0.2.129 | (proc-macro) MIT OR Apache-2.0 |
| wasm-bindgen-macro-support | 0.2.129 | MIT OR Apache-2.0 |
| wasm-bindgen-shared | 0.2.129 | MIT OR Apache-2.0 |
| web-time | 1.1.0 | MIT OR Apache-2.0 |
| weezl | 0.1.12 | MIT OR Apache-2.0 |
| write-fonts | 0.48.1 | MIT OR Apache-2.0 |
| wuff | 0.2.9 | MIT |
| xmp-writer | 0.3.3 | MIT OR Apache-2.0 |
| yoke | 0.8.4 | Unicode-3.0 |
| yoke-derive | 0.8.4 | (proc-macro) Unicode-3.0 |
| zerocopy | 0.8.61 | BSD-2-Clause OR Apache-2.0 OR MIT |
| zerocopy-derive | 0.8.61 | (proc-macro) BSD-2-Clause OR Apache-2.0 OR MIT |
| zerofrom | 0.1.8 | Unicode-3.0 |
| zerofrom-derive | 0.1.8 | (proc-macro) Unicode-3.0 |
| zeroize | 1.9.1 | Apache-2.0 OR MIT |
| zip | 3.0.0 | MIT |
| zlib-rs | 0.6.8 | Zlib |
| zmij | 1.0.23 | MIT |
| zopfli | 0.8.3 | Apache-2.0 |
| zune-core | 0.5.3 | MIT OR Apache-2.0 OR Zlib |
| zune-jpeg | 0.5.15 | MIT OR Apache-2.0 OR Zlib |
