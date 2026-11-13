# Fáze 3: JavaScript

## Co se změnilo

- **Nástroje:** registry (`components/tools/registry/*.ts`) načítají komponenty přes `next/dynamic` a renderuje je klientská `tool-host.tsx`. Stránka nástroje tak stahuje jen chunk zobrazeného nástroje, ne všech ~104. SSR zůstává, takže UI nástroje je hned v HTML.
- **Account i18n:** slovník 7 jazyků (cca 170 kB) je teď v `lib/account-i18n-dict.ts`, které běží jen na serveru (`server-only`).
  - Klient dostane přes `AccountI18n` (dashboard layout, auth stránky) jen aktuální jazyk + cs.
  - Registr je klíčovaný jazykem, takže souběžné SSR požadavky v různých jazycích si data nepřepíšou.
  - 21 klientských souborů se nezměnilo.
- **Edu i18n:**
  - `lib/edu/i18n-core.ts` obsahuje typy a čisté funkce, slovníky zůstávají v `i18n-data.ts`.
  - `EduRoot` je teď serverový obal, který předá `EduRootClient` slovník jen pro aktuální jazyk + cs. Stránky ho volají beze změny.
  - 4 mapy a karty AIFB uvnitř klientské `LevelsOverview` berou texty z `useEduLang()`.
  - `countWord` je v samostatném modulu bez slovníků.
- **KaTeX** (76 kB) se stahuje jen u lekce se vzorcem, dřív na každé edu stránce.
- **`session.js` se načítal dvakrát:** `localization.js` ho importoval s jiným `?v=`, takže vznikaly dvě instance modulu. Verze jsou sjednocené a `localization.js` dostal nový `?v=`.
- Lint: v `account-shell.tsx` je `eslint-disable` pro `<a href="/home">`. Pravidlo začalo hlásit chybu po přesunu home pod `[locale]`, ale jde o záměrnou plnou navigaci do jiné aplikace.

## Měření

First-load JS (gzip, kB):

| Route | Baseline | Fáze 3 |
|---|---:|---:|
| /tools/[tool] | 391 | 161 |
| /edu | 186 | 157 |
| /edu/kurzy/[slug] | 179 | 151 |
| /edu/ai-gramotnost/kurz | 186 | 165 |
| /account dashboard | 189 | 151 |
| /account/login | 180 | 141 |

Skutečně stažené JS v prohlížeči (`scripts/perf/page-js.cjs`):

| Stránka | Baseline | Fáze 3 |
|---|---:|---:|
| /cs/tools/pdf-merge | 437 kB | 209 kB |
| /cs/edu | 420 kB | 350 kB |

Lighthouse (lokálně, medián ze 3):

| Stránka | Baseline | Fáze 3 |
|---|---:|---:|
| home | 70 | 74 |
| tools | 86 | 87 |
| pdf-merge | 90 | 90 |
| edu | 74 | 78 |
| ai-gramotnost/kurz | 90 | 83 |
| store | 93 | 91 |
| services | 91 | 86 |
| login | 91 | 91 |

AIFB a services jsou dynamické. Rozptyl je ±3–5 bodů.

## Ověření

- `typecheck`, `lint` (0 errors), `build` a `test:unit` (281/281) prošly.
- Překlady cs/en/de na loginu, registraci, edu a AIFB (role admin/teacher) se zobrazují bez nepřeložených klíčů a bez chyb hydratace.

## Nedělal jsem

- Audit 307 souborů s `"use client"`.
- `registry/data.ts` v hubu (26 kB raw).
- Lucide (98 kB, subset dřív zamítnut).
