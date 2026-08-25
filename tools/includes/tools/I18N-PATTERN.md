# i18n vzor pro tool šablony (`tools/includes/tools/*.php`)

Tento dokument popisuje mechanický postup lokalizace UI řetězců v šablonách
nástrojů. Vzorová implementace: **`pdf-merge.php`** (hotová, ověřená).

## Kontext

- 104 šablon v `tools/includes/tools/*.php`. Každá má hardcoded české UI řetězce
  (labely, placeholdery, tlačítka, aria-labely, `<option>` texty, privacy poznámky).
- `pdf-merge.php` je už lokalizována — slouží jako reference.
- Zbytek 103 šablon je raw cs → čeká na mechanické zpracování.

## Scope (co se lokalizuje vs. ne)

**Lokalizovat:**
- Viditelný text: `<span>Název</span>`, `<label>Popis</label>`, `<h3>…</h3>`.
- `placeholder="…"`, `aria-label="…"`, `title="…"`.
- Texty tlačítek: `<button>Sloučit PDF</button>`.
- Texty `<option>WPA/WPA2</option>` (kde jsou jazykově specifické; technické
  zkratky WPA/WEP/None zůstávají as-is).
- Privacy poznámky (`.privacy-note`).

**NELokalizovat (zůstává as-is):**
- `id`, `class`, `data-*`, `for`, `type`, `name` atributy.
- URL, technické zkratky (PDF, JSON, JWT, SSID, URL, Wi-Fi, vCard), file
  extensions (.pdf), CSS.
- JS identifikátory v `id` (např. `qr-ssid`) — pouze jejich `<label>` se překládá.
- `icon_svg(...)` výstup — je trusted SVG path, nikdy ne `e()` escapovat.

## Postup (1 šablona)

1. **Identifikuj řetězce** v `<slug>.php`. Vypiš si je (label, placeholder, btn, …).
2. **Zvol schéma klíčů** — viz níže (doporučeno: sdílené pro běžné UI + per-slug pro specifické).
3. **Přidej klíče** do `tools/lang/{cs,en,de,es,uk,fr,sk}.php` (všechny 7, parita).
   - cs = výchozí (přepiš doslovně z šablony, ať se nic nerozbije).
   - en/de/es/uk/fr/sk = překlad. Viz `tools/lang/cs.php` pro konvenci.
   - Apostrofy v hodnotách escapuj jako `\'` (kritické pro fr/uk/de).
4. **Zapoj šablonu** — každý cs řetězec nahraď:
   `<?= e(vv_t('<prefix>.<klic>', $lang)) ?>`
5. **Lint + render-verify**: `php -l <slug>.php` a render přes
   `php /tmp/render-pm4.php <lang>` (uprav slug). Zkontroluj cs = beze změny.
6. **Cache-bust** pokud šablona mění něco načítaného (většinou ne — PHP render
   je vždy čerstvý; cache-bust jen pro `.js`/`.css`, viz `tools.php` script tag).

## Schéma klíčů

**Doporučeno: sdílené klíče pro běžné UI** (radikálně sníží objem 103×N×7):

```
tool_common.download        Stáhnout / Download / Herunterladen / …
tool_common.clear           Vyčistit / Clear / Leeren / …
tool_common.run             Spustit / Run / Ausführen / …
tool_common.drop_here       Přetáhněte sem soubory / Drop files here / …
tool_common.click_choose    nebo klikněte pro výběr / or click to choose / …
tool_common.processing_locally  …se zpracovává lokálně v prohlížeči…
tool_common.never_uploaded  Soubory se nikdy neodesílají na server.
tool_common.result          Výsledek / Result / Ergebnis / …
tool_common.error           Chyba / Error / Fehler / …
tool_common.copy            Kopírovat / Copy / Kopieren / …
tool_common.copied          Zkopírováno / Copied / Kopiert / …
```

**Per-slug klíče pro specifické** (labely unikátní pro daný nástroj):
```
qr_gen.field_text       Text
qr_gen.field_ssid       SSID (název sítě)
qr_gen.field_password   Heslo
qr_gen.encryption       Šifrování
qr_gen.hidden_network   Skrytá síť
```

> Pozn.: `pdf-merge.php` používá `pdf_merge.*` prefix (slovník vznikl dříve, před
> zavedením `tool_common.*`). Nové šablony preferuj `tool_common.*` + `<slug>.*`
> pro specifické. `pdf_merge.*` klíče už v 7 slovnících jsou — neměnit.

## Mechanizmus v scope šablony

`tools.php` (řádek 56) dělá `require $templatePath;` — v scope šablony jsou
dostupné:
- `$lang` — aktuální locale (cs/en/de/es/uk/fr/sk), z `vv_tools_lang()`.
- `vv_t(string $key, ?string $lang = null, array $vars = []): string` — překlad
  s fallbackem na cs. `vv_te()` = escapovaná varianta.
- `e(string $s): string` — `htmlspecialchars`, pro výstup do HTML.
- `icon_svg(string $name, int $size): string` — vnitřek SVG (Lucide path).

Příklad (z `pdf-merge.php`):
```php
<span class="dz-title"><?= e(vv_t('pdf_merge.drop_title', $lang)) ?></span>
<button id="pm-run" disabled><?= icon_svg('Files', 18) ?> <?= e(vv_t('pdf_merge.run', $lang)) ?></button>
```

## Dávkování (pro paralelní agenty)

103 šablon lze rozdělit mezi paralelní agenty (např. 6-8 agentů po ~13-17
šablon). Každý agent:
- Dostane seznam slugů.
- Pro každý slug: extrahuje cs řetězce → přidá klíče do 7 slovníků → zapojí
  šablonu → `php -l` + render-verify cs/en.
- **KONFLIKT:** všichni agenti editují `tools/lang/*.php` soubory → buď
  (a) sekvenčně per lang soubor, nebo (b) každý agent vlastní sadu klíčů a
  merge na konci. Bezpečnější: jeden agent přidá všechny `<slug>.*` klíče do
  7 slovníků napřed (jako bulk), pak 6 agentů jen zapojuje šablony (read-only
  lang, edit-only template). Template soubory jsou nezávislé (žádný konflikt).

## Verifikace (per šablona)

```bash
php -l tools/includes/tools/<slug>.php
# render cs — musí být identické s původním (beze změny viditelného textu):
php /tmp/render-tool.php <slug> cs   # (uprav script: $_GET['slug'], extrahuj tool-root)
# render en — musí ukázat anglické UI:
php /tmp/render-tool.php <slug> en
```

## Stav

- [x] `pdf-merge.php` — vzor, 9 klíčů `pdf_merge.*`, 7 slovníků, ověřeno.
- [x] **26 šablon (G2+G3) plně lokalizováno ve 7 jazycích** — 222 klíčů
  (5 sdílených `tool_common.*` + 217 per-slug `<slug>.*`) vloženo do všech
  7 slovníků (cs/en/de/es/uk/fr/sk), parita 0 chybějících/0 navíc, lint clean.
  Šablony zapojeny (225 editů). Render ověřen cs/en/de/es/uk/fr/sk = lokalizované,
  no key leak. Sluggy: ai-code-explainer, ai-commit-message, audio-convert,
  audio-trim-normalize, certificate-info, code-diff, csv-json-converter,
  date-diff-calc, gif-maker, gitignore-generator, image-collage, image-convert,
  img-compress, img-upscaler, markdown-editor, meme-generator, password-strength,
  pdf-compress, pdf-to-word, pdf-watermark, text-case-converter, text-counter,
  translate, unit-converter, video-merge, video-target-size.
- [x] **Batch 1 (8 AI+audio šablon) plně lokalizováno ve 7 jazycích** — 47 klíčů
  (2 nové sdílené `tool_common.stop/model` + 45 per-slug) × 7 = 329 překladů.
  7 slovníků lint clean, parita 0/0 (382 klíčů each). Render ověřen cs/en/de/sk
  (fatal:0, leak:none). Sluggy: ai-chat, ai-email-writer, ai-regex-generator,
  ai-seo, ai-sql-gen, ai-text-qa, ai-vision, audio-waveform.
  **BUG FIX `tools/tools.php`:** přidán `require_once includes/config.php` —
  AI šablony volají `ollama_model()` (definováno v config.php), ale tools.php
  config.php nenačítal. Dev `router.php` ho načítal globálně (maskoval bug),
  produkce (Apache) nikoliv → 7 AI tool pages bylo v produkci rozbitých
  (fatal „undefined function ollama_model()"). Po opravě AI tools renderují.
- [x] **Batch 2 (6 šablon) plně lokalizováno ve 7 jazycích** — 52 klíčů
  (3 nové sdílené `tool_common.local/generate/compute` + 49 per-slug) × 7
  = 364 překladů. 7 slovníků lint clean, parita 0/0 (434 klíčů each). Render
  ověřen cs/en/de/sk (fatal:0, leak:0/24). Sluggy: password-gen, uuid-gen,
  token-generator, hash-gen, qr-generator, base64-tool. POZNÁMKA: render-tool
  extrahuje jen textové uzly (ne atributy) → placeholdery se neukážou, ale jsou
  zapojeny vv_t + lint-clean + bez leaku. Sdílené `tool_common.*` nyní 10:
  clear, click_choose, copy, download, result, stop, model, local, generate,
  compute. Celkem hotovo: 41 šablon.
- [x] **Batch 3 (6 šablon) plně lokalizováno ve 7 jazycích** — 48 per-slug klíčů
  (0 nových sdílených) × 7 = 336 překladů. 7 slovníků lint clean, parita 0/0
  (482 klíčů each). Render ověřen cs/en/de/sk (fatal:0, leak:0/24). Sluggy:
  bg-remover, birth-number-validator, bmi-calc, bmr-calc, color-converter,
  color-palette-generator. Speciální: bg_remover.footer `<strong>` split
  (footer_pre/strong/post). color-converter jen badge→tool_common.local.
  Celkem hotovo: 47 šablon.
- [x] **Batch 4 (6 šablon) plně lokalizováno ve 7 jazycích** — 70 per-slug klíčů
  (0 nových sdílených — css-js-html-formatter používá tool_common.copy, encrypt-decrypt
  tool_common.copy/clear) × 7 = 490 překladů. 7 slovníků lint clean, parita 0/0
  (552 klíčů each). Render ověřen cs/en/de/sk (fatal:0, leak:0/24). Sluggy:
  compound-interest-calc, contrast-checker, cron-builder, css-js-html-formatter,
  discount-calc, encrypt-decrypt. Poznámka: encrypt_decrypt run button má JS-toggle
  label (ed-run-label) — zapojen statický run_enc; JS-toggle do "Dešifrovat" je
  mimo PHP-template scope (konzistentní s ostatními tools jejichž JS má cs strings).
  (Kč) currency code univerzální napříč jazyky (tool počítá v korunách).
  Celkem hotovo: 53 šablon.
- [x] **Batch 5 (6 šablon) plně lokalizováno ve 7 jazycích** — 32 per-slug klíčů
  (0 nových sdílených — fake-data používá tool_common.generate/download,
  favicon tool_common.download, gradient tool_common.copy) × 7 = 224 překladů.
  7 slovníků lint clean, parita 0/0 (584 klíčů each). Render ověřen cs/en/de/sk
  (fatal:0, leak:0/24). Sluggy: fake-data-generator, favicon-generator,
  file-encryption, fuel-consumption-calc, grade-average-calc, gradient-gen.
  Poznámky: fuel-consumption seg buttons + result k's = technické jednotky
  (l/100 km, mpg, US/UK) → literál. gradient-gen "CSS" label = technická
  zkratka → literál. file-encryption (drop-title/run-label) + fuel-consumption
  (input-label) mají JS-toggle labely → zapojen statický enc/l; JS-toggle
  mimo PHP-template scope. Celkem hotovo: 59 šablon.
- [x] **Batch 6 (6 šablon) plně lokalizováno ve 7 jazycích** — 51 per-slug klíčů
  (0 nových sdílených — grammar-check používá tool_common.model/stop/copy,
  image-filters tool_common.download, iban tool_common.copy) × 7 = 357 překladů.
  7 slovníků lint clean, parita 0/0 (635 klíčů each). Render ověřen cs/en/de/sk
  (fatal:0, leak:0/24). Sluggy: grammar-check, html-to-pdf, iban-converter,
  image-crop, image-exif, image-filters. Poznámky: grammar-check "český text"
  v placeholder denotuje jazyk nástroje → "Czech text" napříč locale; fix/stop
  = JS-toggle run button (fix per-slug, stop→tool_common.stop). html-to-pdf má
  default textarea sample obsah "Ahoj"/"Toto je ukázkový `<strong>HTML</strong>`
  obsah"/"Položka 1/2" → lokalizován (pre/strong-literal/post split, "HTML"
  univerzální); A4/Letter/1×/2×/3×/IBAN/CZ/PNG/JPEG/WebP/ratios = technické
  literály. image-filters "Invert"/"Sepia"/"Reset" borrowingy → lokalizovány
  (grayscale/sepia/reset); %/°/px jednotky literál. Celkem hotovo: 65 šablon.
- [x] **Batch 7 (6 šablon) plně lokalizováno ve 7 jazycích** — 59 per-slug klíčů
  (0 nových sdílených — pdf_split/pdf_rotate/pdf_organize používají
  tool_common.click_choose, pdf_split tool_common.clear/download) × 7
  = 413 překladů. 7 slovníků lint clean, parita 0/0 (694 klíčů each). Render
  ověřen cs/en/de/sk (fatal:0, leak:0/24). Sluggy: pdf-split, invoice-gen,
  pdf-to-images, images-to-pdf, pdf-rotate, pdf-organize. Poznámky: invoice-gen
  = 19 klíčů (plný fakturační formulář); IČO/DIČ/variabilní/konstantní symbol
  lokalizovány popisně (Company ID/VAT ID/Variable symbol/Constant symbol);
  pre-filled `value=` defaulty (Jan Novák — Živnost, Dlouhá 1, CZ0708…, 2026001)
  zůstaly cs sample-data (překlad jmen nedává smysl); IBAN placeholder literál;
  `\n` v ph_addr literál backslash-n; DPH→VAT/MwSt./IVA/ПДВ/TVA. pdf-rotate 180°
  literál. pdf-split "pdf-split.zip" literál; "Stáhnout ZIP"→download + " ZIP".
  Celkem hotovo: 71 šablon.
- [x] **Batch 8 (6 šablon) plně lokalizováno ve 7 jazycích** — 53 per-slug klíčů
  (0 nových sdílených — pdf-page-numbers používá tool_common.click_choose,
  pdf-extract-text tool_common.copy, image-rotate-flip/image-watermark
  tool_common.download) × 7 = 371 překladů. 7 slovníků lint clean, parita 0/0
  (747 klíčů each). Render ověřen cs/en/de/sk (fatal:0, leak:0/24). Sluggy:
  pdf-page-numbers, pdf-extract-text, image-rotate-flip, image-watermark,
  video-convert, video-compress. Poznámky: pdf-page-numbers "Strana {n} z {t}"
  → fmt_page_of lokalizován (value i text stejný klíč); `{n}`/`{n}/{t}` options
  literál (JS placeholder). image-watermark "© 2026" default cs sample-data;
  9 pozic = šipkové symboly literál; "Průhlednost: <span>60</span> %" = label +
  literál. video footery ~100 MB/ffmpeg.wasm/WASM/CRF/bitrate/720p/480p/360p
  technické literály; "Původní"→res_original lokalizován. PNG/JPEG/WebP/GIF/BMP
  + MP4(H.264/AAC)/WebM(VP8/Vorbis) literál. Verifikace: mise shim šum
  znečišťuje grep → použít `command grep -vE` + node regex. Celkem hotovo: 77 šablon.
- [x] **Batch 9 (6 šablon) plně lokalizováno ve 7 jazycích** — 45 per-slug klíčů
  (0 nových sdílených — json-formatter tool_common.clear/copy, jwt-decoder/
  jwt-generator/lorem-ipsum tool_common.copy, lorem-ipsum tool_common.generate,
  mind-map tool_common.download) × 7 = 315 překladů. 7 slovníků lint clean,
  parita 0/0 (792 klíčů each). Render ověřen cs/en/de/sk (fatal:0, leak:0/24).
  Sluggy: json-formatter, jwt-decoder, jwt-generator, loan-calc, lorem-ipsum,
  mind-map. Poznámky: json-formatter output≠result (per-slug). jwt-decoder
  Payload label LITERAL (borrowing); jwt-generator Payload (JSON)/JWT (HS256)
  LITERAL, "Jan Novák" default cs sample-data. loan-calc 18 klíčů (plný
  amortizační formulář), Kč/p.a./% + "#" literál. lorem-ipsum start_classic s
  kudrnatými uvozovkami „…" (build-batch9.js regenerován z scratche — ASCII `"`
  v JS double-quoted hodnotě s typografickými uvozovkami = SyntaxError; řešení:
  literální Unicode znaky). mind-map default textarea cs sample-data, " SVG"
  literál za download. Verifikace: render-tool + `command grep -vE` mise-strip
  + `/tmp/verify-batch9.js` node regex. Celkem hotovo: 83 šablon.
- [x] **Batch 10 (6 šablon) plně lokalizováno ve 7 jazycích** — 51 per-slug klíčů
  (0 nových sdílených — number-base-converter/regex-tester tool_common.local,
  og-meta-generator tool_common.copy, percentage-calc tool_common.result) × 7
  = 357 překladů. 7 slovníků lint clean, parita 0/0 (1053 entries/lang — skutečný
  indent2 count; předchozí "792" měly chybný regex [a-z_.]+ vynechávající
  číslice). Render ověřen cs/en/de/sk (fatal:0; 0 reálných leaků — 8×
  api.pwnedpasswords.com = benign literal domain v footer, nikoliv missing key).
  Sluggy: net-salary-calc, number-base-converter, og-meta-generator,
  password-breach-check, percentage-calc, regex-tester. Poznámky: net-salary-calc
  = Czech-tax calc, footer sazeb lokalizován deskriptivně (čísla literál),
  discount_yes/no. number-base-converter radix_* (select i row labels reuse).
  og-meta-generator url label LITERAL "URL (og:url)", og:type options literal,
  card/ph sample text lokalizován. password-breach-check footer_pre/strong/post
  split (vzor password_strength), api.pwnedpasswords.com/HIBP/SHA-1/k-anonymity
  literal. percentage-calc 3 mode tabs + seg labels + "?" literál, result→
  tool_common.result. regex-tester "Flags" LITERAL, ph_pattern "např. \d+"
  (backslash: \\d v build JS → \d value → \\d PHP dict → \d browser). Verifikace:
  `/tmp/verify-batch10.js` + `/tmp/parity-check.js`. Celkem hotovo: 89 šablon.
- [x] **Batch 11 (6 šablon) plně lokalizováno ve 7 jazycích** — 56 per-slug klíčů
  (0 nových sdílených — remove-diacritics/summarize-text/text-lines-tool
  tool_common.copy, summarize-text tool_common.model/stop, text-to-speech
  tool_common.stop, time-calc tool_common.result) × 7 = 392 překladů. 7 slovníků
  lint clean, parita 0/0 (868 keys/lang — parity-check.js flawed regex absolute,
  indent2 real ~1109; parita drží napříč 7). Render ověřen cs/en/de/sk (fatal:0,
  leak:0/24). Sluggy: remove-diacritics, steganography, summarize-text,
  text-lines-tool, text-to-speech, time-calc. Poznámky: steganography LSB typo
  "LSG"→"LSB" opraven ve 7 jazycích, LSB/RGB/canvas/JPEG/PNG technické literály.
  summarize-text style option VALUES ("odrážky"/"krátký odstavec"/"jedna věta")
  zůstávají cs LITERAL = AI prompt do Ollamy (jen <option> label lokalizován).
  text-lines-tool ph "\n" literál backslash-n, "⇅" šipka literál, 9 op_* tlačítek.
  text-to-speech rate/pitch label ": <span>1.0</span>×" literál suffix,
  footer "Český hlas"→faithful ("Czech voice"/"tschechische Stimme"). time-calc
  "+/−" minus (U+2212) literál, HH:MM:SS placeholdery literál, +/− select options
  literál. Build lekce: ASCII apostrophe `'` v single-quoted JS string = SyntaxError
  (fr `s'affiche`) → curly `'` U+2019. Verifikace: `/tmp/verify-batch11.js` +
  `/tmp/parity-check.js` + `command grep -vE` mise-strip. Celkem hotovo: 95 šablon.
- [x] **Batch 12 (6 šablon) plně lokalizováno ve 7 jazycích** — 53 per-slug klíčů
  (0 nových sdílených — timestamp-converter/time-calc tool_common.result,
  url-encoder/yaml-json-converter tool_common.copy, video-thumbnail
  tool_common.download) × 7 = 371 překladů. 7 slovníků lint clean, parita 0/0
  (916 keys/lang parity-check.js). Render ověřen cs/en/de/sk (fatal:0, leak:0/24).
  Sluggy: timestamp-converter, totp-generator, url-encoder, vat-calc,
  video-extract-audio, video-thumbnail. Poznámky: timestamp-converter HH:MM:SS
  placeholdery + UTC/city names literal, tz_local lokalizován, relative label.
  totp-generator qr_hint_pre/strong/post split (<br><br> + <strong> struktura
  LITERAL v template, jen text přes e()). url-encoder swap button + title.
  vat-calc 4 sazby (21/12/0/custom), DPH→VAT/MwSt./IVA/ПДВ/TVA lokalizováno,
  Kč literal. video-extract-audio format MP3/WAV/OGG/FLAC literal, bitrate label.
  video-thumbnail `<video>` v drop_hint/footer = RAW v dict → e() escapuje na
  `&lt;video&gt;` (zobrazí se jako text, NE renderovaný element — matches original).
  Celkem hotovo: 101 šablon.
- [x] **Batch 13 (3 šablony) plně lokalizováno ve 7 jazycích** — 26 per-slug klíčů
  (0 nových sdílených — yaml-json-converter tool_common.copy) × 7 = 182 překladů.
  7 slovníků lint clean, parita 0/0 (940 keys/lang). Render ověřen cs/en/de/sk
  (fatal:0, leak:0/12). Sluggy: video-to-gif, video-trim, yaml-json-converter.
  Poznámky: video-to-gif dur/fps/width labels, palettegen/paletteuse literal.
  video-trim start/end HH:MM:SS, reenc select (Copy fast/Re-encode precise),
  footer „Kopírovat"/„Překódovat" curly quotes (cs ASCII `"` → U+201D fix).
  yaml-json-converter 2-mode tabs + swap button, js-yaml lazy-load footer.
  Build lekce: ASCII `"` (U+0022) v cs footer hodnotě s kudrnatými uvozovkami
  → reject inner-quote scan → curly `"` (U+201D).
- [x] **VŠECH 104 tool šablon (s templates) plně lokalizováno ve 7 jazycích.**
  3 VPS-only stubs (pdf-password, screenshot-tool, ai-image-gen, loc='server')
  nemají template soubory → skipped (registry metadata localized via
  tool.{slug}.name/desc). Celkem: 104 šablon × ~940 dict klíčů/lang × 7 jazyků.