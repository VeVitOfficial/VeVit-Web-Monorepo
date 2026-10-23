# 02 · Jak to funguje technicky

## Prostředí

- Next.js 16 (App Router), React 19, TypeScript, nasazení na Vercel.
- Stránky jsou serverové komponenty; v prohlížeči běží jen to, co musí (průběh, cvičení, přepínače).
- Žádná databáze: obsah je v JSON souborech, které jsou součástí buildu.
- Žádné nové závislosti: validace schématu i generátor typů jsou vlastní skripty.

## Cesta požadavku

1. Návštěvník otevře `/cs/edu/ai-gramotnost/aifb/zs1/blok-a`.
2. `src/proxy.ts` odebere jazyk z adresy, interně přepíše na `/edu/ai-gramotnost/aifb/zs1/blok-a` a jazyk předá hlavičkou `x-vv-locale`.
3. Stránka zavolá `await connection()` (vykresluje se při každém požadavku) a `readEduLocale()` (přečte jazyk).
4. Načte obsah přes `src/lib/edu/aifb/content.ts` a vykreslí komponenty uvnitř `AifbFrame` (hlavička Edu, rámeček, upozornění „Obsah je zatím pouze v češtině“ pro jiné jazyky).

## Trasy (URL)

Všechny pod `/<jazyk>/edu/ai-gramotnost`:

| Adresa | Soubor | Co zobrazí |
|---|---|---|
| ` ` (kořen) | `src/app/edu/ai-gramotnost/page.tsx` | Hub |
| `/aifb/[category]` | `aifb/[category]/page.tsx` | Mapa / seznam bloků a levelů |
| `/aifb/[category]/pro-ucitele` | `aifb/[category]/pro-ucitele/page.tsx` | Průvodce pro učitele |
| `/aifb/[category]/[level]` | `aifb/[category]/[level]/page.tsx` | Blok / level: teorie, potom lekce |
| `/aifb/[category]/[level]/tisk` | `.../tisk/page.tsx` | Tisk celého bloku |
| `/aifb/[category]/[level]/teorie` | `.../[lesson]/page.tsx` | Teorie (`TheoryView`) |
| `/aifb/[category]/[level]/cv1`…`cv5` | `.../[lesson]/page.tsx` | Lekce (`LessonView`) |
| `/aifb/ukazky` | `aifb/ukazky/page.tsx` | Knihovna komponent (jen vývoj a náhled) |
| `/kurz` | `kurz/page.tsx` | Online kurz: přehled |
| `/kurz/m1` | `kurz/[modul]/page.tsx` | Modul: teorie, potom lekce |
| `/kurz/m1/teorie`, `/kurz/m1/cv1` | `kurz/[modul]/[lekce]/page.tsx` | Teorie modulu / lekce kurzu |
| `/edu/api/aifb/complete` (POST) | `src/app/edu/api/aifb/complete/route.ts` | Cvičení s AI (viz kapitola 06) |

Neplatná adresa vrací 404 (`not-found.tsx`), chyba při vykreslení stránku `error.tsx` s tlačítkem „Zkusit znovu“.

### Jak vznikají krátké adresy

Id v obsahu jsou dlouhá a stabilní (`zs1-blok-a`, `zs1-blok-a-cv3`). Adresa z nich odebere předponu (`src/lib/edu/aifb/routes.ts`):

- level `zs1-blok-a` v kategorii `zs1` → `blok-a`
- lekce `zs1-blok-a-cv3` → `cv3`, `zs1-blok-a-teorie` → `teorie`
- modul kurzu `kurz-m2` → `m2`, lekce `kurz-m2-cv3` → `cv3`

Id se nikdy nepřečíslovávají, jinak by se rozbily odkazy i uložený průběh.

## Soubory s obsahem (`src/content/aifb/`)

| Soubor | Původ | Smí se měnit? |
|---|---|---|
| `aifb-catalog.json` | z plánu | **ne** (pravidlo R6) |
| `aifb-content-zs1.json`, `-zs2.json`, `-ss.json` | z plánu | **ne** (R6) |
| `aifb-content.schema.json` | z plánu | **ne** |
| `aifb-theory.json` | nový text teorie | ano (návrh, čeká na kontrolu) |
| `aifb-kurz.json` | nový online kurz | ano (návrh, čeká na kontrolu) |
| `pupil-pilots.json` | pilotní cvičení pro žáky | ano (návrh) |
| `downloads.json` | seznam souborů ke stažení | ano |

Originální soubory z plánu zůstávají beze změny; všechno nové je ve vlastních souborech, které je doplňují (např. teorie se k levelu připojí podle jeho id).

## Knihovny (`src/lib/edu/aifb/`)

| Soubor | Účel |
|---|---|
| `content.ts` | Načítání obsahu (katalog staticky, kategorie až při vstupu), `getTheory`, `getCourse`, `getPupilLayer`, `draftPreviewEnabled`, `courseVisible` |
| `types.ts`, `types.generated.ts` | Typy; `types.generated.ts` se generuje ze schématu (`npm run gen:aifb-types`) |
| `routes.ts` | Převod id ↔ adresa, funkce pro sestavení URL |
| `theory.ts` | Typy teorie, `FIGURE_IDS`, `resolveTheory`, `readingMinutes`, `validateTheory` |
| `course.ts` | Typy a pomocné funkce online kurzu, `validateCourse` |
| `markdown.ts` | Lehký Markdown (jen **tučně**, *kurzíva*, odkazy na oddíly průvodce) bez HTML |
| `pupil.ts` | Žákovská vrstva: typy cvičení, validace, brány `pupilVisible`, `aiLessonAvailable` |
| `interactive-logic.ts` | Vyhodnocení cvičení (kvíz, třídění, semafor), čisté funkce |
| `progress.ts`, `xp.ts` | Místní průběh a výpočet XP |
| `guide.ts` | Pravidla průvodce (upozornění na ochranu údajů, oddíly k tisku) |
| `pii.ts` | Rozpoznání osobních údajů v textu |
| `ai-config.ts`, `ai-service.ts` | Cvičení s AI: prompty, záložní odpovědi, volání modelu, limity |
| `i18n.ts`, `messages.ts` | Texty rozhraní (`aifb.*`), české skloňování počtů |

Soubory bez importů (`theory.ts`, `pupil.ts`, `progress.ts` …) jdou použít na serveru, v prohlížeči i v testech, které je načítají přímo (Node spouští TypeScript bez překladu).

## Komponenty (`src/components/edu/aifb/`)

- **Rámec:** `frame.tsx` (Edu shell + `.aigram .aifb` + téma), `crumbs.tsx` (drobečková navigace).
- **Hub a kategorie:** `hub.tsx`, `category-view.tsx`, `adventure-map.tsx` (pirátská mapa), `trail-map.tsx` (stezka), `clean-overview.tsx` (SŠ), `levels-overview.tsx` (seznam), `level-card.tsx`, `view-toggle.tsx`.
- **Level a lekce:** `level-view.tsx`, `lesson-view.tsx`, `lesson-body.tsx`, `level-print-view.tsx`, `print-button.tsx`, `shared.tsx` (štítky, řádek lekce, ukazatel postupu).
- **Teorie:** `theory-view.tsx` (stránka teorie levelu), `theory-layout.tsx` (obsah + sekce + shrnutí, sdílené s kurzem), `theory-blocks.tsx` (vykreslení bloků), `theory-figures.tsx` (21 SVG ilustrací).
- **Online kurz:** `course-views.tsx` (přehled, modul, teorie modulu, lekce).
- **Průvodce:** `guide-view.tsx`, `section-actions.tsx` (tisk / kopírování oddílu).
- **Průběh:** `use-progress.ts` (úložiště + `useSyncExternalStore`), `lesson-progress.tsx`, `level-progress.tsx`, `progress-transfer.tsx`.
- **Cvičení:** `interactive/pupil-layer.tsx` (rozcestník), `quiz-card.tsx`, `card-sort.tsx`, `traffic-light-cards.tsx`, `ai-sandbox.tsx`.
- **Text:** `rich-text.tsx` (lehký Markdown do Reactu), `blocks.tsx` (odstavce, tabulky, upozornění z plánu).

## Styly

- `src/styles/ai-gramotnost.css` – tokeny scoped pod `.aigram` (barvy, poloměry), světlý i tmavý režim přes `html.light` / `html.dark`.
- `src/styles/aifb.css` – vše specifické pro AIFB: karty, mapy, lekce, teorie (`th-*`), ilustrace (`af-*`), kurz, tisk.
- Barvy jen z existujících tokenů (`--aifb-accent`, `--aifb-gold`, `--aifb-sky`, `--aifb-violet`, `--aifb-slate`, `--text-*`, `--bg-*`), žádná externí písma.
- Animace (ilustrace, mapy) se vypínají při `prefers-reduced-motion: reduce`.
- Tisk: `@media print` skryje navigaci, průběh a tlačítka a tiskne černou na bílé.

## Jazyky

- Obsah je jen česky. Pro ostatní jazyky webu (en, de, es, fr, sk, uk) se zobrazí upozornění a texty rozhraní se berou z češtiny.
- Texty rozhraní jsou v `src/lib/edu/aifb/messages.ts` pod klíči `aifb.*` a slučují se se slovníky Edu (`src/lib/edu/i18n-data.ts`). Na serveru `aifbT(locale)`, v klientu `useEduLang().t`.

## Napojení na zbytek webu

- Karta „AI gramotnost“ v sekci Kurzy na domovské stránce Edu vede na hub; počet lekcí se bere z katalogu (80 lekcí bez teorií).
- `src/components/analytics-gate.tsx` vynechává analytiku na `/edu/ai-gramotnost`.
- Původní kurz AI gramotnosti byl z webu odstraněn; zůstal jen `certificate.php` (stará trasa certifikátu).
