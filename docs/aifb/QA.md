# AIFB – kontrola kvality (F8)

Datum: 2026-10-22. Prostředí: lokální `next dev` (Chromium 1243, Lighthouse z DevTools MCP).
Pozn.: Lighthouse „Performance" tento nástroj nevrací, výkon je posouzen jen podle velikostí a požadavků níže.

## 1. Přístupnost (F8.1, WCAG 2.2 AA jako minimum)

Lighthouse, kategorie Accessibility:

| Stránka | Zařízení | Výsledek | Poznámka |
|---|---|---|---|
| Hub `/edu/ai-gramotnost` | desktop | 96 → **100** | nález: 2 uzly s kontrastem pod 4,5:1 (neaktivní karta „Online kurz", průhlednost 0,6). Opraveno: karta už nepoužívá průhlednost, text má sekundární barvu a čárkovaný okraj |
| Kategorie 1. stupně (mapa) | mobil | **100** | |
| Lekce SŠ (cvičení s AI) | desktop | **100** | měřeno před zrušením režimů |

Další kontroly (E2E, `tests/e2e/aifb.e2e.mjs`):

- Mapa ostrovů je ovladatelná klávesnicí (Tab, Enter) a každý ostrov má cíl alespoň 64 × 64 px.
- Seznamové zobrazení všech tří témat existuje a je ve stejném počtu položek jako mapa (4 / 6 / 6).
- Tabulka levelů pro SŠ má záhlaví sloupců (`th scope="col"`) i řádků a skrytý popisek.
- Teorie má běžnou velikost písma (17 px) a čitelnou délku řádku; režim Projekce byl na pokyn vlastníka zrušen.
- Žádný vodorovný posun na šířce 360 px (hub, kategorie, level, lekce).
- Stav lekce je vždy text („Nezačato", „Rozpracováno", „Hotovo"), ne jen barva. Cíle v tlačítkách interaktivních cvičení mají min-height 44 px.
- `prefers-reduced-motion`: animace a přechody AIFB se vypínají; animace maskota a scén „Již brzy" mají vlastní pravidlo.

Neověřeno / otevřeno:

- Ruční test se čtečkou obrazovky (NVDA, VoiceOver) nebyl proveden. Lighthouse zachytí jen část problémů WCAG.
- Plná matice snímků (360, 768, 1280 px × světlý i tmavý režim) není pro každou obrazovku. K dispozici jsou výběry v `docs/aifb/screenshots/`.
- Kontrast ve světlém režimu pro mapy (pirate-map, trail) jsem neměřil nástrojem, jen vizuálně.

## 2. Výkon

- Hub čte jen katalog: `aifb-catalog.json` má 8,2 kB před kompresí (limit plánu 20 kB). Obsah kategorie (70–90 kB) se načítá až při vstupu do kategorie a zůstává na serveru; klientovi se posílá jen potřebný podstrom (`LevelSummary`).
- Mapa je SVG bez rastrových závislostí. Rastry: maskot `maskot-v1.webp` (107 kB, jen hub a domovské stránky Edu), loga jazyků SVG (jen Programování).
- Měření výkonu na produkčním buildu (LCP, TBT) zatím chybí.

## 3. Testy a CI (F8.2)

- Jednotkové: `npm run test:unit` (132 testů; markdown renderer s U+00A0, validace obsahu a jeho porušení, teorie, průběh, PII kontrola, žákovská vrstva, brána AI endpointu). Spouští se nově i v `security.yml`.
- Validace obsahu: `npm run validate:aifb` (v `npm run build` a v CI). Změna id lekce, počtu lekcí, odkazu na oddíl nebo certifikace s jiným stavem než `planned` validaci shodí (pokryto testy).
- Smoke: `npm run smoke:aifb`, 135 stránek (16 teorií, 80 lekcí, 16 bloků/levelů, 16 tisků, kategorie, průvodci, hub), všechny 200 s `<h1>`. Po přestavbě zatím nespuštěno.
- E2E: `npm run test:e2e:aifb` (playwright-core + node:test, bez nové závislosti). 16 testů: hub → kategorie → level → lekce pro každou kategorii, přímé otevření a obnovení, zpět/vpřed, seznamové zobrazení, klávesnice na mapě, pořadí teorie a lekcí, stránka teorie, tisk, průběh, soukromí, 360 px, produkce bez návrhů. Po přestavbě zatím nespuštěno (dev server zastaven kvůli paměti).
  Výsledek proti `next dev` i proti produkčnímu `next start`: všechny spuštěné testy prošly; test pro produkční běh se spouští jen s `E2E_PRODUCTION=1`, test AI endpointu s návrhy jen ve vývoji.
  E2E odhalil skutečnou chybu: při návštěvě lekce označené jako hotová ji hydratace přepsala na „rozpracováno". Opraveno (`getProgressNow`).
- CI: nový workflow `.github/workflows/aifb-e2e.yml` (validace, produkční build, `next start`, smoke, E2E). Zatím nespuštěn na GitHubu.
- **Produkční běh ověřen lokálně:** `npm run build` bez `.env.local` (jako v CI) skončil úspěšně, všechny trasy AIFB jsou v buildu. Proti `next start` prošlo 15 E2E testů (test jen pro vývoj se přeskakuje) a smoke 327/327. Produkční testy potvrdily, že návrhy žákovských textů se nezobrazují a AI endpoint vrací 404.

## 4. Soukromí (F8.3)

Požadavky prohlížeče na stránkách AIFB (hub, kategorie, lekce, průvodce) míří **jen na vlastní doménu** (kontroluje E2E test „soukromí"):

- skripty a styly Next.js, `/assets/vendor/lucide`, `/assets/vendor/katex`, `/edu/assets/js/*` (sanitizace, sandbox), `/assets/shared/*` (přepínač aplikací, jazyk, session),
- lokální písma `/assets/fonts/*.woff2`,
- `/account/api/me.php` (stav přihlášení pro odznak v hlavičce Edu; 401 pro nepřihlášeného).

Žádná analytika (AIFB je vyřazeno z Vercel Analytics a Speed Insights i po klientské navigaci), žádná externí písma, žádné cookies třetích stran. Místní průběh obsahuje jen id lekce, stav a datum (E2E test kontroluje tvar úložiště).

## 5. Otevřené problémy

| # | Problém | Dopad | Poznámka |
|---|---|---|---|
| 1 | Konzole hlásí chyby `GET /favicon.ico 404` a `GET /account/api/me.php 401` | Lighthouse Best Practices 92 | Společné celému Edu (sdílená hlavička), ne AIFB. Opravit zvlášť: favicon a tiché 401 |
| 2 | Chybí DOCX pro 1. a 2. stupeň a všechna PDF | Pro učitele ukazuje „Soubory ke stažení se připravují" | Dodá vlastník |
| 3 | Texty pro žáky (pilotní lekce) jsou jen návrhy | Na produkci se nezobrazují | Čeká na schválení vlastníkem (R7); poznámky v `pupil-pilots.json` |
| 4 | Souhlas zákonných zástupců na 2. stupni nelze ověřit na serveru | Ovládací prvek jen v rozhraní | AIFB nemá účty; viz RECON § 19 |
| 5 | Ruční test čtečkou obrazovky, měření výkonu (LCP, TBT) na produkčním buildu | Nezměřeno | Doporučeno před vydáním |
| 6 | `vevit-tailwind.css` (tracked) se při buildu přegeneruje | Diff v repozitáři | Zahrnout do commitu, jinak třídy Tailwindu z novějších komponent (např. přepínač jazyka Wikipedie) v produkci chybí |
