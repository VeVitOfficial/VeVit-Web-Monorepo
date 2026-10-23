# 09 · Testy a kontroly

## Příkazy

| Příkaz | Co dělá | Potřebuje server |
|---|---|---|
| `npm run validate:aifb` | validace obsahu + kontrola, že `types.generated.ts` odpovídá schématu | ne |
| `npm run test:unit` | jednotkové testy (`tests/unit/`, 139 testů, z toho AIFB 7 souborů) | ne |
| `npm run smoke:aifb` | otevře 172 stránek a čeká 200 + `<h1>` | ano |
| `npm run test:e2e:aifb` | E2E v Chromiu (playwright-core + node:test) | ano |
| `npm run docs:aifb` | přegeneruje přehledy v `docs/aifb/prehled/generovano/` | ne |
| `npm run gen:aifb-types` | přegeneruje typy ze schématu | ne |

Server: `npm run dev` (vývoj, návrhy viditelné) nebo `npm run build && npm start` (produkce). Adresa přes `BASE_URL` (výchozí `http://localhost:3000`). Prohlížeč pro E2E: `CHROMIUM_PATH=/usr/bin/chromium` nebo `npx playwright-core install chromium`.

`npm run build` spouští validaci obsahu jako první krok: neplatný obsah build zastaví.

## Validace obsahu (`scripts/aifb-validate.mjs`)

- schéma (vlastní validátor podmnožiny JSON Schema, bez závislostí) pro tři obsahové soubory,
- počty: 3 kategorie, 16 levelů, 96 položek (teorie + lekce), shoda katalogu s obsahem (téma, jednotka, počty, contentFile),
- unikátní id, správný tvar id lekcí, teorie s `order` 0, cvičení 1–5,
- odkazy na oddíly průvodce („oddíl 7.2“) vedou na existující oddíl,
- certifikace jen ve stavu `planned` (R4),
- soubory ke stažení existují a mají uvedenou velikost,
- pilotní cvičení: platná konfigurace, stav `draft`, AI lekce mají serverovou konfiguraci a naopak,
- teorie: každý level má teorii, sekce mají unikátní id, bloky jsou platné, ilustrace existují,
- online kurz: `validateCourse` (kapitola 05).

## Jednotkové testy AIFB

| Soubor | Co testuje |
|---|---|
| `aifb-markdown.test.mjs` | lehký Markdown, U+00A0, odkazy do průvodce, žádné HTML |
| `aifb-content.test.mjs` | validace obsahu a že ji porušení shodí (změna id, počtu, odkazu, certifikace) |
| `aifb-progress.test.mjs` | průběh, XP, import / export, odmítnutí špatných souborů |
| `aifb-guide.test.mjs` | pravidla průvodce a upozornění na ochranu údajů |
| `aifb-pupil.test.mjs` | konfigurace cvičení, vyhodnocení, PII kontrola, brána AI endpointu |
| `aifb-theory.test.mjs` | teorie pro všech 16 levelů, aspoň 5 sekcí a ilustrace, každá ilustrace použitá |
| `aifb-course.test.mjs` | kurz je platný a návrh, bere ze všech kategorií, bez AI, adresy, průběh a XP, validace odhalí chyby |

## Smoke test (`scripts/aifb-smoke.mjs`)

172 stránek: hub, 3 kategorie, 3 průvodci, 16 bloků / levelů, 16 tisků, 16 teorií, 80 lekcí a 37 stránek kurzu (přehled, 6 modulů, 6 teorií, 24 lekcí). S `E2E_PRODUCTION=1` čeká u kurzu ve stavu návrhu 404 (ověřuje, že se na produkci neukáže).

## E2E (`tests/e2e/aifb.e2e.mjs`)

- pro každou kategorii: hub → kategorie → level → lekce kliknutím; přímé otevření a obnovení,
- zpět / vpřed v historii,
- seznamové zobrazení map, přepínač Karty / Tabulka,
- mapa z klávesnice, cíle aspoň 64 px,
- blok: teorie nad lekcemi, 5 lekcí, žádný přepínač režimů,
- teorie: písmo 15–19 px, aspoň 5 sekcí, ilustrace, shrnutí, metodika sbalená, „Pokračovat“ na lekci 1,
- tisk: bez navigace, černá na bílé,
- průběh přežije obnovení a neobsahuje osobní údaje,
- soukromí: žádné požadavky mimo vlastní doménu,
- 360 px bez vodorovného posunu (včetně stránek kurzu),
- online kurz: hub → kurz → modul → teorie → lekce → cvičení → další lekce,
- AI endpoint: osobní údaje a lekce 1. stupně se odmítnou (jen vývoj),
- produkce (`E2E_PRODUCTION=1`): žádné návrhy, AI endpoint 404, online kurz 404 a karta bez odkazu.

Poslední výsledek proti `next dev` (2026-10-23): 17 prošlo, 0 selhalo. Testy pro produkci se přeskakují; lokálně proti `next start` naposledy běžely před přidáním kurzu.

## CI (GitHub Actions)

- `.github/workflows/security.yml`: mimo jiné `npm run test:unit` a `npm run validate:aifb`.
- `.github/workflows/aifb-e2e.yml`: validace, instalace Chromia, produkční build, `next start`, smoke (s `E2E_PRODUCTION=1`), E2E (s `E2E_PRODUCTION=1`). Spouští se při změně `src/**`, testů, skriptů AIFB nebo `package.json`. Na GitHubu zatím neběžel (větve nejsou pushnuté).

## Ruční kontroly (viz `QA.md`)

Lighthouse přístupnost 100 na hubu, mapě 1. stupně a lekci SŠ. Chybí: test se čtečkou obrazovky, měření výkonu (LCP, TBT) na produkčním buildu.
