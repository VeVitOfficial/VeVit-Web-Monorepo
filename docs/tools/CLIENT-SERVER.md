# Kde se nástroje VeVit Tools zpracovávají — podle reality kódu

Stav k datu 2026-11-05, ověřeno čtením zdrojů (src/components/tools/tools/*,
src/app/tools/api/*, public/tools/assets/js/lib/*) a prohlížečovým testem
všech 107 stránek nástrojů.

## Shrnutí

| Kategorie | Počet | Co to znamená |
|---|---|---|
| **Čistě v prohlížeči** | **92** | Data nikdy neopustí váš počítač. Všechny knihovny jsou vlastní (vendored) pod `public/tools/assets/` — žádné CDN. |
| **VEVIT server (API route)** | **14** | Požadavek jde na `/tools/api/…` na našem serveru. |
| **Třetí strana (přímo z prohlížeče)** | **1** | Prohlížeč volá externí API přímo, bez naší služby v cestě. |

Z 14 serverových je 12 AI nástrojů (text jde na AI inferenci — AWS Bedrock
nebo Ollama, viz [AWS-BEDROCK.md](AWS-BEDROCK.md)), dále SSL/TLS inspekce
(node:tls — musí být server, prohlížeč se TLS socketem k cizímu hostu
nepřipojí) a screenshot (remote Chromium přes Browserbase).

## Detailní tabulka

### PDF (vše lokálně, pdf-lib 1.17.1 + pdf.js 3.11.174 + qpdf.wasm)

| Nástroj | Mechanismus |
|---|---|
| pdf-merge, pdf-split, pdf-organize, pdf-rotate, pdf-watermark, pdf-page-numbers, images-to-pdf, invoice-gen (+ QR) | pdf-lib (client-side) |
| pdf-compress, pdf-to-images, pdf-extract-text, pdf-to-word | pdf.js render/extrakce + pdf-lib/JSZip + layout engine `src/lib/pdf-text-layout.ts` |
| pdf-password | qpdf WASM (`public/tools/assets/js/lib/qpdf/`) |
| html-to-pdf | html2canvas + jsPDF |

### Obrázky (lokálně)

| Nástroj | Mechanismus |
|---|---|
| image-convert, image-crop, image-rotate-flip, image-filters, image-watermark, img-compress, img-upscaler, image-collage, meme-generator, favicon-generator (+JSZip) | Canvas API |
| bg-remover | onnxruntime-web (WASM SIMD) + MODNet model (`modnet.onnx`) — inference v prohlížeči |
| gif-maker | gifenc |
| image-exif | exifr |

### Média (lokálně)

| Nástroj | Mechanismus |
|---|---|
| video-convert, video-compress, video-trim, video-to-gif, video-merge, video-extract-audio, video-target-size, audio-convert, audio-trim-normalize | **ffmpeg WASM** (`@ffmpeg/ffmpeg` 0.12.15, core 0.12.10 — 32 MB wasm vendored) |
| video-thumbnail | HTML5 `<video>` + canvas |
| audio-waveform | Web Audio API |

### Text, dev, security, kalkulačky (lokálně)

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
| ai-chat, ai-vision, ai-seo, ai-sql-gen, ai-text-qa, summarize-text, grammar-check, ai-email-writer, ai-commit-message, ai-regex-generator, ai-code-explainer, translate | `/tools/api/ai/[tool]` | AWS Bedrock ConverseStream (Claude), fallback Ollama (`OLLAMA_URL`) — 30 req/min/IP, prompt max 20 kB, obrázky jen vision (4 × 8 MB) |
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
