# Kde se nástroje VeVit Tools zpracovávají — podle reality kódu

Stav k datu 2026-11-05 (po rozšíření o sadu iLovePDF/TinyWow), ověřeno
čtením zdrojů (src/components/tools/tools/*, src/app/tools/api/*,
public/tools/assets/js/lib/*) a prohlížečovým testem všech 171 stránek.

## Shrnutí

| Kategorie | Počet | Co to znamená |
|---|---|---|
| **Čistě v prohlížeči** | **132** | Data nikdy neopustí váš počítač. Všechny knihovny jsou vlastní (vendored) pod `public/tools/assets/` — žádné CDN. |
| **AI (server-side proxy)** | **36** | Text jde přes `/tools/api/ai/[tool]` na AI inferenci — AWS Bedrock (Claude) nebo Ollama, viz [AWS-BEDROCK.md](AWS-BEDROCK.md). 30 funkčních + 6 v přípravě. |
| **VEVIT server (API route)** | **2** | SSL/TLS inspekce (node:tls) a screenshot (Browserbase Chromium). |
| **Třetí strana (přímo z prohlížeče)** | **1** | password-breach-check volá HIBP přímo (k-anonymity, jen prefix hashe). |

Celkem **171 nástrojů** (163 funkčních + 8 „Připravujeme": ai-image-gen,
audio-to-text, ai-restore-photo, ai-colorize, ai-remove-object, pdf-to-pdfa,
epub-to-mobi, epub-to-azw3 — vyžadují infrastrukturu, kterou prohlížeč/
stávající backend neposkytuje).

## Detailní tabulka

### PDF (35 nástrojů, vše lokálně, pdf-lib 1.17.1 + pdf.js 3.11.174 + qpdf.wasm + SheetJS + mammoth + pptxgenjs + tesseract)

| Nástroj | Mechanismus |
|---|---|
| pdf-merge, pdf-split, pdf-organize, pdf-rotate, pdf-watermark, pdf-page-numbers, images-to-pdf, invoice-gen (+ QR) | pdf-lib (client-side) |
| pdf-compress, pdf-to-images, pdf-extract-text | pdf.js render/extrakce + pdf-lib/JSZip + layout engine `src/lib/pdf-text-layout.ts` |
| pdf-to-word | pdf.js 6 ve web workeru → rekonstrukce odstavců/tabulek (`src/lib/converter/pdf/`) → OOXML; OCR skenů přes tesseract.js; viz [docs/converter](../converter/README.md) |
| pdf-password | qpdf WASM (`public/tools/assets/js/lib/qpdf/`) |
| pdf-remove-pages, pdf-extract-pages, pdf-crop, pdf-redact, pdf-sign, pdf-forms, pdf-repair, scan-to-pdf, pdf-compare, pdf-edit | pdf-lib + pdf.js (nová iLovePDF sada) |
| pdf-to-markdown | pdf.js + sdílený layout engine (`src/lib/pdf-text-layout.ts`) |
| word-to-pdf | vetext (Rust → WASM) ve web workeru, fonty Carlito/Caladea/Liberation, volitelně PDF/A-2b; viz [docs/converter](../converter/README.md) |
| excel-to-pdf, pdf-to-excel, csv-to-excel, excel-to-csv, split-excel | SheetJS (xlsx.full.min.js) |
| pptx-to-pdf | JSZip (rozbalení PPTX) + jsPDF |
| pdf-to-pptx | pdf.js render + pptxgenjs |
| ocr-pdf | tesseract.js 5 (wasm + ces/eng data, vše lokálně) |
| translate-pdf | extrakce lokálně, překlad přes AI route |
| html-to-pdf | html2canvas + jsPDF |

### Obrázky (24 nástrojů, lokálně)

| Nástroj | Mechanismus |
|---|---|
| image-convert, image-crop, image-rotate-flip, image-filters, image-watermark, img-compress, img-upscaler, image-collage, meme-generator, favicon-generator (+JSZip) | Canvas API |
| bg-remover | onnxruntime-web (WASM SIMD) + MODNet model (`modnet.onnx`) — inference v prohlížeči |
| gif-maker | gifenc |
| image-exif | exifr |
| image-resize, image-add-text, image-border, image-pixelate, image-round, image-splitter, chart-maker, image-bw | Canvas API (nová TinyWow sada) |
| blur-background | onnxruntime-web + MODNet (maska popředí) + canvas blur |
| heic-to-jpg | libheif wasm (`libheif/`) |

### Média (15 nástrojů, lokálně)

| Nástroj | Mechanismus |
|---|---|
| video-convert, video-compress, video-trim, video-to-gif, video-merge, video-extract-audio, video-target-size, audio-convert, audio-trim-normalize | **ffmpeg WASM** (`@ffmpeg/ffmpeg` 0.12.15, core 0.12.10 — 32 MB wasm vendored) |
| video-thumbnail | HTML5 `<video>` + canvas |
| audio-waveform | Web Audio API |
| video-resize, video-mute, video-to-webp | ffmpeg WASM (škálování, -an, libwebp) |

### Text, dev, security, kalkulačky (lokálně)

Text zahrnuje i 17 AI Writing nástrojů (paragraph-writer … youtube-script)
— ty jsou loc `ai`, viz sekce serverové níže. Dev obsahuje nové souborové:
create-zip, split-csv, xml↔json (nativní DOMParser, bez knihovny), excel↔xml.

Veškeré zbylé nástroje těchto kategorií jsou čistě prohlížečové: kalkulačky
(bmi, bmr, úrok, mzda, DPH, sleva, palivo, známky, čas, datum, procenta,
půjčka, jednotky), textové nástroje (počítadlo, velikost písmen, řádky,
diakritika, lorem, markdown editor, myšlenková mapa, TTS přes Web Speech),
dev nástroje (JSON/YAML/CSV, regex, cron, timestamp, diff, beautify, JWT,
base64, URL, UUID, hash — MD5 vendored + zbytek WebCrypto, gitignore,
fake data, paleta, kontrast, QR, OG meta, gradient, barvy, soustavy, IBAN,
rodné číslo) a security nástroje (šifry přes WebCrypto, steganografie přes
canvas LSB, tokeny, TOTP, síla hesla).

### Serverové (14)

| Nástroj | Endpoint | Backend |
|---|---|---|
| ai-chat, ai-vision, ai-seo, ai-sql-gen, ai-text-qa, summarize-text, grammar-check, ai-email-writer, ai-commit-message, ai-regex-generator, ai-code-explainer, translate, translate-pdf + 17 AI Writing (paragraph-writer, sentence-rewriter, essay-writer, article-writer, paragraph-completer, content-improver, story-generator, ai-humanizer, tone-of-voice, faq-generator, business-name-generator, blog-outline-generator, blog-post-ideas, instagram-caption, linkedin-post, fb-headline-generator, youtube-script) | `/tools/api/ai/[tool]` | AWS Bedrock ConverseStream (Claude), fallback Ollama (`OLLAMA_URL`) — 30 req/min/IP, prompt max 20 kB, obrázky jen vision (4 × 8 MB) |
| certificate-info | `/tools/api/ssl-check.php` | node:tls + node:dns (DNS-rebinding-safe), 10 req/min/IP |
| screenshot-tool | `/tools/api/screenshot` | Browserbase remote Chromium, 10 req/min/IP, SSRF ochrana |

### Třetí strana (1)

| Nástroj | Kam | Poznámka |
|---|---|---|
| password-breach-check | `api.pwnedpasswords.com` (HaveIBeenPwned) | k-anonymity: do světa odejde jen prvních 5 znaků SHA-1 hashe hesla — samotné heslo nikdy |

### Nepoužité API cesty (info)

- `/tools/api/feedback.php` — jen Beta testovací banner (Resend e-mail), ne nástroj.
- `/tools/api/ai/ollama` a `/tools/api/ai/ollama.php` — 308 redirecty na sjednocený route (legacy kompatibilita).
- `/tools/api/[...path]` — tvrdý 404 (dřív tichý Supabase proxy — odstraněno).

## Jak ověřit

V hlavičce každého nástroje je badge místa zpracování (Lokálně / Na serveru /
Přes AI / Třetí strana) a pásmo „Kde se vaše data zpracovávají" na hubu počítá
počty z registru (`src/components/tools/registry/data.ts`, pole
`processing_location`). Síťový provoz je nejjednodušší ověřit v DevTools →
Network: kromě statických assetů z vlastní domény lokální nástroje nic
neodesílají.
