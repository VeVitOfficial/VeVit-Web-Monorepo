# 🛠️ VeVit Tools

Sada rychlých nástrojů pro vývojáře a kreativce — PDF, obrázky, média, text, AI,
vývoj, bezpečnost a kalkulačky. Většinu vstupů zpracovává **lokálně v prohlížeči**,
bez nahrávání na server.

Tato verze je napsaná **čistě ve statických technologiích** — HTML, CSS, JS a PHP.
Žádné Node.js, žádné buildovací kroky, žádný framework.

## ✨ Funkce

* **Lokální zpracování:** Většina nástrojů běží přímo v prohlížeči — data nikdy
  neopustí zařízení. U souborových nástrojů je to klíčové USP a je dodrženo.
* **AI asistent:** Chat přes proxy (viz `api/ai/`). Ve vývoji přes lokální
  [Ollamu](https://ollama.com) (model `llama3.2`); v produkci na Wedosu lze
  proxy nasměrovat na externí LLM API (klíč v PHP env, rate limiting).
* **16 hotových nástrojů (Fáze 0 + 1, čistě client-side):**
  * *Dev/Bezpečnost/Kalkulačky:* JSON formátovač, UUID generátor (v4/v7),
    hash generátor (MD5/SHA-256/SHA-512), regex tester, generátor hesel,
    konvertor barev (HEX/RGB/HSL), konvertor číselných soustav.
  * *Kalkulačky (Fáze 1):* procenta, půjčka (anuita + amortizace),
    převodník jednotek.
  * *Text/Bezpečnost (Fáze 1):* Markdown editor (live náhled),
    šifrování textu (AES-256-GCM + PBKDF2 přes Web Crypto).
  * *PDF (Fáze 1):* sloučení, rozdělení (do ZIPu), komprese
    (bezztrátové přeuložení nebo silná komprese přes rastr).
  * *AI:* AI chat.
  Zbylé nástroje zobrazují přehledný placeholder „ve vývoji".

## 🧱 Technologie

* **Frontend:** HTML, CSS (proměnné, glassmorphism), vanilla JavaScript (IIFE moduly).
* **Backend:** PHP — serverové includy (header/footer/registry), handler nástrojů
  a proxy k Ollamě. Žádné závislosti.
* **Markdown v AI chatu a editoru:** `marked` + `DOMPurify` (lokalně vendored v
  `assets/js/lib/`).
* **PDF nástroje:** `pdf-lib` (sloučení/rozdělení/bezztrátová komprese),
  `JSZip` (balení rozdělených souborů), `pdf.js` (rastr pro silnou kompresi).
  Vše lokalně vendored v `assets/js/lib/`, na stránky se načítají líně až při
  použití nástroje.

## 🚀 Spuštění

### Vývoj (PHP built-in server)

```bash
php -S localhost:3939 router.php
```

Otevři `http://localhost:3939`. Pro AI chat je potřeba běžící Ollama:

```bash
ollama serve                 # výchozí port 11434
ollama pull llama3.2          # stáhne model
```

URL Ollamy a model lze přepsat proměnnými prostředí:

```bash
OLLAMA_URL=http://localhost:11434 OLLAMA_MODEL=llama3.2 php -S localhost:3939 router.php
```

### Produkce (Wedos / Apache)

Landing (`/`) je **statický `index.html`** — žádné PHP se pro výchozí stránku
nepoužívá. PHP běží jen pro detail nástroje a AI proxy. Nahraj obsah na Wedos
(Apache s `mod_rewrite`). Hezká URL zajišťuje `.htaccess`:

* `/` → `index.html` (statický landing, `DirectoryIndex index.html`)
* `/tools/<slug>` → `tools.php?slug=<slug>`
* `/api/ai/ollama` → `api/ai/ollama.php`

### Přegenerování landing page

`index.html` se generuje z `includes/registry.php` + `includes/icons.php`
(jediný zdroj pravdy). Po změně registrů jej přegeneruj:

```bash
python3 scripts/generate-index.py
```

(Generátor jen čte PHP data a vyplivne hotové HTML — PHP k běhu nepotřebuje.)

## 📁 Struktura

```
index.html             # statický landing (hub + vyhledávání) — generovaný
index.php              # (smazáno — nahrazeno index.html)
tools.php              # detail nástroje /tools/<slug>
router.php             # dev router pro `php -S` (hezká URL)
.htaccess              # hezká URL + DirectoryIndex pro Apache/Wedos
api/ai/ollama.php      # proxy ke Ollamě (NDJSON stream)
scripts/generate-index.py  # generátor statického index.html z registrů
includes/
  config.php           # konfigurace (OLLAMA_URL, OLLAMA_MODEL)
  registry.php         # registr nástrojů + kategorií
  icons.php            # inline SVG ikony (lucide)
  header.php, footer.php   # sdílené pro tools.php
  tools/<slug>.php     # HTML jednotlivých nástrojů
assets/
  css/style.css        # celý design systém (dark / glass)
  js/lib/             # toast, icons (DOM-safe), tool-ui (dropzone/progress), md5, marked, purify, pdf-lib, jszip, pdf.js
  js/site.js           # header dropdown
  js/hub.js            # vyhledávání + scroll-spy (na index.html)
  js/tools/<slug>.js   # chování nástrojů
  favicon.ico
```

## 🔒 Bezpečnost

* **Žádné API klíče třetích stran.** AI inference běží přes lokální Ollamu.
* **XSS-safe DOM:** uživatelský vstup se do DOMu vkládá přes `textContent` / DOM
  metody, nikoliv `innerHTML`. Jediná výjimka je výstup AI chatu, který je
  sanitizován `DOMPurify.sanitize(...)` dříve, než se vloží.
* **Bez `eval`** na nedůvěryhodném vstupu.
* Konfigurační a includované PHP soubory jsou přes `.htaccess` chráněny proti
  přímému přístupu.

## 📝 Poznámky

* Web je **tématicky tmavý** (dark-only) — odpovídá vizuální identitě originálu.
* Kategorií je 8 (PDF, Obrázky, Média, Text, AI, Vývoj, Bezpečnost, Kalkulačky).
  Kategorie „Média" slučuje video + audio nástroje.