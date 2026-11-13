# Výkon – baseline (Fáze 0)

Měřeno 2026-11-13 na commitu `067bbbe`, Next.js 16.4.6 (Turbopack), lokálně (`next start -p 3100`).

Nástroje (vše v `scripts/perf/`):

- `route-sizes.mjs`: first-load JS/CSS per route z build manifestů. Next 16 už v `next build` velikosti nevypisuje.
- `lighthouse.sh`: Lighthouse 12.8.2, mobile preset, 3 běhy, medián.
- `heavy-net.cjs`: otevře stránku nástroje bez interakce a vypíše, jestli se stáhlo něco těžkého (WASM, modely).
- Bundle analýza: `npm run analyze` (`next analyze`). `@next/bundle-analyzer` funguje jen s webpackem, projekt builduje Turbopack. Proto vestavěný analyzer Next 16.1+, bez nové závislosti.

## 1. Build

- `npm run build`: OK za 2 min 57 s (compile 60 s, TypeScript 61 s).
- 78 statických výstupů, ze 74 stránkových rout je statických jen 15:
  - `/`, `/_not-found`
  - `/office/*` (6 rout)
  - `/store/cart`, `/store/cancel`, `/store/logout`, `/store/checkout`, `/store/checkout/doprava`, `/store/checkout/platba`, `/store/checkout/udaje`
- Všechno ostatní (home, tools, edu, services, account, zbytek store) je ƒ.

### First-load JS / CSS per route (gzip, včetně frameworku)

Základ (framework + root layout) je **132 kB gzip** (`/_global-error`).

| Route | JS gzip kB | CSS gzip kB |
|---|---:|---:|
| /tools/[tool] | **391** | 22 |
| /account/(dashboard)/* | 186–191 | 16 |
| /edu/* (veřejné i školní) | 173–187 | 29–43 |
| /account/login, register | 180–181 | 13–15 |
| /home | 160 | 32 |
| /tools | 160 | 22 |
| /store/* | 147–159 | 27–29 |
| /services/* | 142–147 | 14 |
| /home/support | 141 | 18 |

Plná tabulka (raw + gzip, všech 74 rout) je v sekci [Příloha A](#příloha-a-first-load-per-route).

## 2. 15 největších chunků (`next analyze`)

Velikosti jsou minifikované, před gzipem.

| # | Chunk | Velikost | Obsah |
|---:|---|---:|---|
| 1 | 2xn9224scario.js | 1014 kB | **Všech ~104 komponent nástrojů** (`src/components/tools/tools/*` 930 kB), converter i18n 30 kB, invoice, file-preview |
| 2 | 2lznr4km5kz1a.js | 223 kB | Next/React runtime |
| 3 | 370dvni2_ag-b.js | 167 kB | `account-i18n.ts` 110 kB + `account-auth-i18n.ts` 57 kB (**všech 7 jazyků**) |
| 4 | 0yvhfu2d5fab3.js | 156 kB | Next runtime |
| 5 | 0cz1d0mv5g_q7.js | 110 kB | Next runtime |
| 6 | 284ep98tuwz5-.js | 101 kB | `edu/i18n-data.ts` 69 kB (všechny jazyky), aifb 21 kB, school 11 kB |
| 7 | 0e8dj9zsmes91.css | 77 kB | `tools.css` celé |
| 8 | 2ge72je2ghymi.js | 71 kB | `lib/converter/pdf/*` 67 kB |
| 9 | 31slihga2rtwc.js | 70 kB | Home scéna: eco-board, board-extras, scene-i18n, home-behaviors, road-towers, eco-atom |
| 10 | 00etozjh9ogmt.css | 69 kB | `aifb.css` 55 kB + `ai-gramotnost.css` 15 kB |
| 11 | 1_h_5xjvawqiy.css | 67 kB | `edu.css` 42 kB + KaTeX CSS 25 kB |
| 12 | 1vq5gx8gx0r-w.js | 46 kB | `tool-icons.tsx` 24 kB, `hub-app.tsx` 16 kB |
| 13 | 3ctnnp55d4072.js | 45 kB | edu aifb komponenty |
| 14 | 0moe7_cj4hoao.js | 44 kB | edu blocks + pages |
| 15 | 33km0lgfvq0b7.js | 42 kB | edu pages, wiki, search-suggest |

**Hlavní nález:** `src/components/tools/registry/index.ts` staticky importuje všechny komponenty nástrojů do `TOOL_COMPONENTS`. Každá stránka nástroje proto stahuje kód všech ~104 nástrojů (1 MB raw, cca 230 kB gzip), i když zobrazí jen jeden.

## 3. Proč jsou routy dynamické

Žádná veřejná stránka nemá `force-dynamic`. Dynamické je dělají tři věci.

### a) Locale přes hlavičku `x-vv-locale`

Proxy (`src/proxy.ts`) přepisuje `/<locale>/<sekce>/...` na `/<sekce>/...` a locale posílá v request hlavičce. Stránky ho čtou přes `headers()`, a to je request-time API, takže stránka nemůže být statická.

| Sekce | Kde se čte locale |
|---|---|
| home | `home/page.tsx`, `home/support/page.tsx`, `home/soon/[app]/page.tsx` (`readLocale`) |
| tools | `tools/layout.tsx`, `tools/page.tsx`, `tools/[tool]/page.tsx` (+ `connection()`), `tools/podminky-uziti` |
| edu | `lib/edu/locale.ts` → `readEduLocale()` ve všech edu stránkách |
| services | `lib/services-locale.ts` |
| account | `headers()` v auth stránkách a v dashboard layoutu |

`home/page.tsx` volá `headers()` **jen kvůli locale**. Nic jiného (user agent, session) se tam nečte.

### b) `connection()` (55× v `src/app`)

Store:

- `store/page.tsx`, `store/product/[slug]`, `store/catalog` čtou katalog ze Supabase při každém requestu.
- `store-config.ts` → `dataApi()` má `cache: "no-store"`.
- `getProducts()` stahuje až 1000 produktů.

### c) Session / cookies (uživatelská data)

- account dashboard, `/store/{orders,order,claims,claim,return,my-returns,favorites,success}` (`force-dynamic`)
- edu dashboard / school / `lekce/moje` / `lekce/vytvorit`
- services moje / profil / poptávky
- **AIFB stránky** v `edu/ai-gramotnost/*` čtou server-side `lib/edu/aifb/viewer.ts` (cookies), tedy průchod a progres žáka.

### Soubory s `force-dynamic` / `revalidate = 0` / `no-store`

Skutečný počet je **167**, ne 144.

| Skupina | Počet | Verdikt |
|---|---:|---|
| Route handlery (`route.ts`) | 137: account 53, edu 26, store 22, api 16, services 15, tools 5 | **musí** zůstat (API, auth, platby, webhooky) |
| Store uživatelské stránky (`force-dynamic`) | 8 | **musí** (objednávky, reklamace, oblíbené, success) |
| `src/lib/*`, komponenty | 22 | **musí**: jde o `Cache-Control: no-store` v API odpovědích nebo o `fetch` uživatelských / platebních dat (Stripe, BIN lookup, Packeta, avatar, OIDC) |
| … z toho `store-config.ts` → `dataApi()` | 1 | **nemusí plošně**: stejný helper slouží i čtení veřejného katalogu, katalogové čtení jde cachovat |

Závěr: rychlost nebrzdí `force-dynamic`. Brzdí ji **locale v hlavičce** a **`connection()` v katalogu**.

## 4. Syrové `<img>`

Skutečný počet je **63**, ne 60.

| Kategorie | Počet | Kandidát na `next/image`? |
|---|---:|---|
| Blob/data URL v nástrojích (náhledy výstupů, PDF thumbnaily, QR, screenshoty) | 38 | **Ne**: blob URL `next/image` neoptimalizuje, nemají pevné rozměry |
| Platební / dopravní loga (`BRAND_LOGOS`, SVG/PNG 20–40 px), banky | 13 | Ne: drobné SVG ikony, optimalizace nic nepřinese |
| Avatary (account, eco-board, eco-atom, services), QR 2FA (data URL) | 6 | Ne / volitelně: user obsah z různých originů, malé |
| Wiki náhledy (Wikipedia URL) | 2 | Ne: externí doména mimo `remotePatterns` |
| `free-media-banner.tsx` (LCP na /home!) | 1 | **Ano** |
| Edu maskot `maskot-v1.webp` 860×1290 (2×) | 2 | **Ano** |
| Cookie banner art `cookie-banner.webp` | 1 | **Ano** |
| `login-form.tsx` maskot (už WebP + lazy) | 1 | Volitelně |

Reálný přínos má tedy cca 4–5 obrázků. Store produkty už `next/image` používají.

## 5. Fonty

- `public/assets/fonts/vevit-fonts.css` je **prázdný** (jen komentář, 0 `@font-face`). Importuje ho 10 souborů, ale nic nenačítá a **nic neduplikuje**.
- Písmo jde jen přes `next/font/google`, IBM Plex Sans (400/500/600/700) a Mono (400/500), latin + latin-ext, v root layoutu.
- `public/assets/fonts/` obsahuje 31 souborů `.woff2`, 4,5 MB, a **nikdo na ně neodkazuje** (pozůstatek). Mazat bez souhlasu nebudu.
- Ověřit zbývá, jestli se reálně používají všechny řezy (600 a Mono 500).

## 6. Lighthouse (mobile, lokálně, medián ze 3 běhů)

Lokální server nemá síťovou latenci Vercelu. Čísla slouží pro porovnání před/po, ne jako absolutní hodnoty.

| URL | Perf | FCP s | LCP s | TBT ms | CLS | SI s | LCP element |
|---|---:|---:|---:|---:|---:|---:|---|
| /cs/home | 70 | 1.5 | 4.2 | 486 | 0.003 | 3.5 | banner `free-media-sm.jpg` |
| /cs/tools | 86 | 1.2 | 3.0 | 323 | 0.001 | 1.4 | `<h1>` |
| /cs/tools/pdf-merge | 90 | 1.2 | 3.2 | 195 | 0.004 | 1.2 | `<p>` |
| /cs/edu | 74 | 1.4 | **5.6** | 253 | 0.001 | 1.4 | `<p class="eh-lead">` (text!) |
| /cs/edu/ai-gramotnost → /kurz | 90 | 1.5 | 3.2 | 135 | 0.000 | 2.4 | `<p class="th-lead">` |
| /cs/store | 93 | 1.2 | 3.1 | 93 | 0.000 | 1.4 | `<p>` |
| /cs/services | 91 | 1.2 | 3.2 | 167 | 0.000 | 1.9 | `<h1>` |
| /cs/account/login | 91 | 1.1 | 3.2 | 144 | 0.000 | 1.1 | input placeholder |

`/` jen přesměruje na `/cs/home`, samostatně se neměří.

## 7. WASM a modely

Ověřeno `scripts/perf/heavy-net.cjs` na 21 nástrojích s ffmpeg, onnx, tesseract, libheif a qpdf (video-*, audio-*, bg-remover, blur-background, heic-to-jpg, ocr-pdf, pdf-to-word, pdf-password, img-upscaler…).

Bez interakce se **nestáhne nic těžkého**. Lazy loading WASM už funguje správně, problém je jen JS bundle nástrojů (bod 2).

## 8. Ostatní nálezy

- **Žádný `loading.tsx`.** Error boundary má jen `edu/ai-gramotnost`, not-found mají store a ai-gramotnost.
- „Načítám…“ / „Loading…“ je ve 53 souborech (tools 45, edu 6, office 1, store 1).
- `next/dynamic` ani `React.lazy` se nepoužívají nikde.
- `account-i18n.ts` (120 kB src) importuje 21 klientských souborů, takže všech 7 jazyků jde do klienta. `edu/i18n-data.ts` má 5 klientských importérů.
- Obrázky: 622 WebP, jen 56 PNG/JPG (nejtěžší `public/store/images/holka.png`, `home/images/* premium/rámeček.png`, pár produktových). Konverze má tedy malý dopad.
- `next.config.ts` nemá `optimizePackageImports`. Projekt ale nemá velké barrel knihovny (lucide se načítá z public), takže přínos bude malý.

---

## Příloha A: first-load per route

| Route | JS raw kB | JS gzip kB | CSS raw kB | CSS gzip kB |
|---|---:|---:|---:|---:|
| /tools/[tool] | 1539 | 391 | 111 | 22 |
| /account/(dashboard)/admin | 672 | 191 | 69 | 16 |
| /account/(dashboard) | 669 | 189 | 69 | 16 |
| /account/(dashboard)/security | 663 | 189 | 69 | 16 |
| /account/(dashboard)/profile | 658 | 188 | 69 | 16 |
| /account/(dashboard)/billing | 656 | 188 | 69 | 16 |
| /edu/hledat | 621 | 187 | 143 | 29 |
| /account/(dashboard)/services | 658 | 187 | 69 | 16 |
| /account/(dashboard)/preferences | 654 | 187 | 69 | 16 |
| /account/(dashboard)/connections | 652 | 186 | 69 | 16 |
| /account/(dashboard)/notifications | 653 | 186 | 69 | 16 |
| /account/(dashboard)/privacy | 653 | 186 | 69 | 16 |
| /edu/ai-gramotnost/kurz/[modul]/[lekce] | 628 | 186 | 213 | 42 |
| /edu/ai-gramotnost/kurz/[modul] | 628 | 186 | 213 | 42 |
| /edu/ai-gramotnost/kurz | 628 | 186 | 213 | 42 |
| /edu/dashboard | 618 | 186 | 143 | 29 |
| /edu | 618 | 186 | 143 | 29 |
| /edu/ai-gramotnost/aifb/[category]/[level]/[lesson] | 628 | 185 | 213 | 42 |
| /edu/ai-gramotnost/aifb/ukazky | 626 | 185 | 213 | 42 |
| /edu/lekce/[id] | 623 | 184 | 143 | 29 |
| /edu/skoly | 611 | 182 | 143 | 29 |
| /edu/lekce/moje/detail | 621 | 182 | 143 | 29 |
| /account/register | 643 | 181 | 67 | 15 |
| /account/login | 635 | 180 | 62 | 13 |
| /edu/kurzy/[slug] | 603 | 179 | 143 | 29 |
| /edu/programovani | 599 | 179 | 143 | 29 |
| /edu/lekce/vytvorit | 603 | 179 | 143 | 29 |
| /edu/ai-gramotnost | 592 | 178 | 213 | 42 |
| /edu/ai-gramotnost/aifb/[category] | 593 | 177 | 213 | 42 |
| /account/forgot-password | 626 | 177 | 59 | 13 |
| /account/reset-password | 625 | 177 | 59 | 13 |
| /account/verify-2fa | 625 | 177 | 30 | 6 |
| /edu/ai-gramotnost/upravy | 589 | 176 | 213 | 42 |
| /edu/school/tridy/[id] | 590 | 176 | 217 | 43 |
| /edu/school/sprava | 588 | 175 | 217 | 43 |
| /edu/ai-gramotnost/aifb/[category]/[level] | 583 | 175 | 213 | 42 |
| /edu/chemie | 588 | 175 | 143 | 29 |
| /edu/historie | 588 | 175 | 143 | 29 |
| /edu/ai-gramotnost/aifb/[category]/pro-ucitele | 583 | 175 | 213 | 42 |
| /edu/school/tridy | 582 | 174 | 217 | 43 |
| /edu/ai-gramotnost/aifb/[category]/[level]/tisk | 582 | 174 | 213 | 42 |
| /edu/school/admin | 582 | 174 | 217 | 43 |
| /edu/ai-gramotnost/ucitel | 581 | 174 | 213 | 42 |
| /edu/school/komunita | 578 | 173 | 217 | 43 |
| /edu/school/obsah | 578 | 173 | 217 | 43 |
| /edu/school | 578 | 173 | 217 | 43 |
| /edu/school/prubeh | 578 | 173 | 217 | 43 |
| /edu/school/sesit | 578 | 173 | 217 | 43 |
| /edu/school/tvorba | 578 | 173 | 217 | 43 |
| /home | 532 | 160 | 147 | 32 |
| /tools | 534 | 160 | 111 | 22 |
| /store/checkout/platba | 526 | 159 | 138 | 29 |
| /store/checkout/doprava | 513 | 155 | 130 | 27 |
| /store/checkout/udaje | 514 | 154 | 130 | 27 |
| /store/cart | 500 | 150 | 130 | 27 |
| /store/success | 499 | 149 | 130 | 27 |
| /store/claim | 500 | 149 | 130 | 27 |
| /store/favorites | 500 | 149 | 130 | 27 |
| /store/return | 500 | 149 | 130 | 27 |
| /store/product/[slug] | 497 | 149 | 130 | 27 |
| /store/catalog | 496 | 148 | 130 | 27 |
| /store | 496 | 148 | 130 | 27 |
| /store/checkout | 495 | 148 | 130 | 27 |
| /store/logout | 495 | 148 | 130 | 27 |
| /tools/podminky-uziti | 490 | 148 | 111 | 22 |
| /store/[page] | 494 | 147 | 130 | 27 |
| /store/cancel | 494 | 147 | 130 | 27 |
| /store/claims | 494 | 147 | 130 | 27 |
| /store/my-returns | 494 | 147 | 130 | 27 |
| /store/order | 494 | 147 | 130 | 27 |
| /store/orders | 494 | 147 | 130 | 27 |
| /services/poptavka/[id]/upravit | 492 | 147 | 69 | 14 |
| /services/poptavka/nova | 492 | 147 | 69 | 14 |
| /services/poptavky | 483 | 144 | 69 | 14 |
| /services/poskytovatele | 481 | 144 | 69 | 14 |
| /services/poptavka/[id] | 481 | 143 | 69 | 14 |
| /services | 478 | 143 | 69 | 14 |
| /services/profil | 478 | 143 | 69 | 14 |
| /services/poskytovatel/[id] | 476 | 142 | 69 | 14 |
| /services/moje | 475 | 142 | 69 | 14 |
| /home/support | 473 | 141 | 82 | 18 |
| /office/* (6 rout) | 470 | 139 | 59 | 12 |
| /account/onboarding | 458 | 136 | 59 | 12 |
| /home/soon/[app] | 457 | 135 | 94 | 20 |
| / , /_not-found | 456 | 135 | 29 | 6 |
| /_global-error | 448 | 132 | 0 | 0 |
