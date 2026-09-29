# VeVit – promo video k prvnímu veřejnému releasu

Samostatný projekt v [Remotion](https://www.remotion.dev/) (React). Aplikaci
v kořeni repozitáře nijak nemění: má vlastní `package.json`, vlastní
`node_modules` a kořenový `tsconfig`, ESLint ani Next.js build do této složky
nesahají.

| Výstup | Rozměr | Délka |
|---|---|---|
| `out/vevit-promo-1920x1080.mp4` | 1920 × 1080, 30 fps, H.264 | 74,5 s |
| `out/vevit-promo-1080x1920.mp4` | 1080 × 1920, 30 fps, H.264 (sociální sítě) | 74,5 s |

## Scény

Časy platí pro obě verze. Vertikální verze má stejné scény a texty, jen místo
okna prohlížeče ukazuje mobilní zobrazení v telefonu.

| # | Čas | Na obrazovce | Titulek | Přechod |
|---|---|---|---|---|
| 1 | 0:00–0:04,5 | Hook: tři rychlé střihy skutečného UI (Komprese PDF, kurz Pythonu, poptávka na elektrikáře) | „Zmenšit PDF.“ / „Naučit se Python.“ / „Sehnat elektrikáře.“ → „Všechno na jednom místě.“ | tvrdé střihy, prolnutí |
| 2 | 0:04–0:09,5 | Logo VeVit, pak domovská stránka vevit.cz | Český digitální ekosystém – Nástroje, lekce a služby na jednom místě. **Bez reklam.** | posun zprava |
| 3 | 0:09–0:15 | Tools: psaní „pdf“ do hledání, průjezd mřížkou nástrojů, počítadla | VeVit Tools – 107 nástrojů zdarma, bez registrace | prolnutí |
| 4 | 0:14,5–0:21,5 | QR generátor (živé psaní URL), Komprese PDF (−60 %), Generátor hesel; zvýrazněný štítek „Lokálně“ | Soubory neopouštějí tvůj počítač. | posun zprava |
| 5 | 0:21–0:27,5 | Edu: přehled kurzů programování, spuštění JavaScriptu v lekci | VeVit Edu – 18 kurzů programování, 342 lekcí. → JavaScript si spustíš přímo v lekci. | prolnutí |
| 6 | 0:27–0:33 | AI gramotnost: postup, odznaky, lekce s rozcvičkou | AI gramotnost – Od základů po prompt engineering. S certifikátem. | posun zprava |
| 7 | 0:32,5–0:42,5 | Services: úvod, seznam poptávek, detail poptávky se třemi nabídkami | VeVit Services + kroky 1–3, „Kontakt až po výběru · Hlídací pes“ | posun zprava |
| 8 | 0:42–0:50 | Account: Level 12 a ranky, 2FA, tarify Premium | Jeden účet pro všechno – XP a levely · 2FA · 7 jazyků | zelená maska |
| 9 | 0:49,5–0:58 | vevit.space: výřezy webu (hero, proces, ceník) | VeVit Software Studios – Software na míru. Ceny veřejně, nabídka do 3 dnů. | zelená maska |
| 10 | 0:57,5–1:05 | vevit.art: hero webu + aktivity komunity (bez fotek členů) | VeVit Art – Prostor, kde umění roste. | prolnutí |
| 11 | 1:04,5–1:14,5 | Závěr: logo, **vevit.cz**, aplikace, 28 her na vevit.fun, vevit.space · vevit.art | Vyzkoušej zdarma · Bez reklam · Postaveno v ČR | stmívání |

## Rychlý start

```bash
cd promo-video
npm install
npm run studio          # náhled a úpravy v prohlížeči (Remotion Studio)
npm run render          # obě verze do out/
```

`npm run render:landscape` nebo `npm run render:vertical` vyrenderuje jen jednu
verzi. Remotion si při prvním renderu stáhne Chrome Headless Shell. Pokud to
prostředí nedovolí, nastav vlastní binárku:
`PROMO_CHROMIUM=/cesta/k/headless_shell npm run render`.

## Úprava textů

Všechny texty ve videu jsou v jediném souboru **`src/texts.ts`**. Uprav text,
spusť `npm run studio` a zkontroluj, že se vejde na řádek (hlavně ve vertikální
verzi), a pak `npm run render`.

- Délky scén: `src/timeline.ts`. Časování uvnitř scén (kdy se přepne záběr,
  kam se posouvá stránka, co se zvýrazní) je na začátku každého souboru ve
  `src/scenes/`.
- Barvy a písma: `src/theme.ts`. Písma (Bricolage Grotesque, Geist,
  Geist Mono) jsou zkopírovaná z `public/assets/fonts` aplikace a logo
  z `public/home/images`.
- Rozvržení obou formátů: `src/layout.ts`.

## Hudba

Podkres je volitelný. Stačí vložit soubor **`public/music.mp3`**. Při renderu se
automaticky přidá se zesílením na začátku a zeslabením na konci. Bez souboru se
video vyrenderuje bez zvukové stopy. Hláška
`music.mp3 … 404` v logu v tom případě neznamená chybu. Soubor je
v `.gitignore`, aby se omylem necommitla hudba bez licence. Pokud ho chceš
verzovat, řádek z `.gitignore` odstraň.

## Záběry UI (`public/captures/`)

Záběry jsou skutečné screenshoty aplikace z tohoto repozitáře, pořízené přes
Playwright (desktop 1600×900 @2x, mobil 390×844 @3x). Data v nich jsou
smyšlená (uživatelka „Klára Dvořáková“, poptávky, nabídky, hodnocení). Nejsou
v nich žádné reálné osobní údaje a e-maily jsou na doméně `example.com`.

Jak je pořídit znovu (např. po změně UI):

```bash
cd promo-video
npm run fonts:setup     # jen Linux bez systémových písem: Geist jako výchozí sans-serif
npm run app:start       # mock Supabase (port 54321) + aplikace (port 3000)
npm run capture         # všechny záběry; nebo např. npm run capture -- services
```

- `capture/mock-supabase.mjs` je malá náhrada Supabase Data API v paměti, aby
  šly vykreslit Services, Account a Edu bez produkční databáze. Aplikace jen
  dostane `SUPABASE_URL=http://127.0.0.1:54321`.
- `capture/fixtures.mjs` obsahuje ukázková data. Kategorie Services se čtou
  přímo z migrace `supabase/sql/account/024_services_search.sql`.
- `capture/capture.mjs` obsahuje seznam záběrů a interakcí (psaní, klikání)
  a zapisuje rozměry do `src/captures.json`.
- Výřezy vevit.space a vevit.art (`public/external/`) jsou ze snímků webů
  pořízených 29. 9. 2026 (`capture/crop-external.mjs`). Fotky a tvorba členů
  komunity VeVit Art v nich záměrně nejsou.

## Kontrola

```bash
npm run stills                      # 3 snímky z každé scény, obě verze → out/stills/
npm run stills -- Promo --frames=120,900
npm run typecheck
```
