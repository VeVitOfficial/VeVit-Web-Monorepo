# 10 · Jak upravit obsah

Texty jde upravit dvěma způsoby:

- **V aplikaci (admin):** odkaz **Upravit** u stránky nebo **Úpravy obsahu** v rozcestníku. Úprava se uloží do databáze, projeví se hned a jde vrátit. Popis v kapitole 12.
- **V repozitáři:** změna JSON souborů níže. Trvalé, verzované v gitu, projeví se po nasazení.

Po každé změně obsahu v repozitáři spusť:

```bash
npm run validate:aifb   # musí projít, jinak neprojde ani build
npm run test:unit
npm run docs:aifb       # aktualizuje přehledy v docs/aifb/prehled/generovano/
```

a stránku si prohlédni v `npm run dev`.

Obecná pravidla pro text:

- Jen **tučně** (`**text**`) a *kurzíva* (`*text*`), žádné HTML ani odkazy (kromě „oddíl 7.2“ v průvodci, který se propojí sám).
- Za jednopísmennými předložkami a spojkami (v, k, s, z, o, u, a, i, i velkými) dej neoddělitelnou mezeru U+00A0 místo obyčejné. V JSON je vidět jako normální mezera, v editoru ji jde vložit jako ` `.
- Nepoužívej názvy konkrétních AI služeb v textu, který generuje aplikace (R8). V originálních průvodcích z plánu zůstávají.
- Nikdy neměň id (`zs1-blok-a-cv3`, `kurz-m2-cv1`, `#halucinace`): rozbily by se odkazy a uložený průběh.

## Schválit návrh (zveřejnit na produkci)

Nejrychleji v aplikaci: Úpravy obsahu → Online kurz / Teorie → „Stav a poznámka“ (nebo pilotní cvičení) → pole Stav → `reviewed` → Uložit. Natrvalo v repozitáři:

| Co | Kde | Změna |
|---|---|---|
| Online kurz | `src/content/aifb/aifb-kurz.json` | `"status": "draft"` → `"reviewed"` |
| Teorie | `src/content/aifb/aifb-theory.json` | `"status": "draft"` → `"reviewed"` (zmizí poznámka o návrhu) |
| Pilotní cvičení | `src/content/aifb/pupil-pilots.json` | u konkrétní lekce `"status": "draft"` → `"reviewed"` |

U pilotních cvičení validace stav `draft` vyžaduje (aby ho nikdo nezměnil omylem). Při schválení je potřeba upravit i tuto kontrolu v `validatePupilLayer` (`src/lib/edu/aifb/pupil.ts`) a test v `tests/unit/aifb-pupil.test.mjs`. Test kurzu (`aifb-course.test.mjs`) také čeká `draft` a po schválení se upraví.

Celý text k přečtení je v `generovano/teorie.md`, `generovano/online-kurz.md` a `generovano/pilotni-cviceni.md` (u cvičení jsou vyznačené správné odpovědi).

## Upravit text teorie

1. Najdi téma v `aifb-theory.json` → `topics.<téma>.sections[]` (které téma patří ke kterému levelu: `generovano/teorie.md`, tabulka nahoře).
2. Uprav bloky (`p`, `list`, `terms`, `callout`, `figure`, `example`, viz kapitola 04).
3. Sekci jen pro SŠ přidej do `levels.<ss-level-x>.extra[]`.
4. Nová sekce potřebuje unikátní `id` (malá písmena bez diakritiky, slouží jako kotva v adrese).

## Upravit online kurz

- Text modulu nebo lekce: přímo v `aifb-kurz.json`.
- **Nová lekce:** přidej na konec `modules[i].lessons` objekt s `id` = `kurz-m<modul>-cv<n>` a `order` = n (bez děr). Nejvýš 5 lekcí v modulu. Povinné: `title`, `minutes`, `intro`, `steps`, `outcome`; volitelné `tip`, `activity`.
- **Nový modul:** přidej na konec `modules` s `id` `kurz-m7`, `order` 7, `code` „Modul 7“, `sources`, `goals`, `theory`, `lessons`. Trasy, karta na hubu, průběh i smoke test se doplní samy.
- **Cvičení (`activity`):**

```json
{ "component": "QuizCard", "config": { "questions": [
  { "id": "q1", "prompt": "Otázka?", "options": [{ "id": "a", "text": "…" }, { "id": "b", "text": "…" }],
    "correct": "b", "explanation": "Proč je to tak." } ] } }

{ "component": "CardSort", "config": {
  "piles": [{ "id": "ano", "label": "…" }, { "id": "ne", "label": "…" }],
  "cards": [{ "id": "c1", "label": "…" }, { "id": "c2", "label": "…" }],
  "expected": { "c1": "ano", "c2": "ne" }, "hint": "volitelná nápověda" } }

{ "component": "TrafficLightCards", "config": {
  "labels": { "green": "Můžu napsat", "red": "Nepatří do AI" },
  "situations": [{ "id": "s1", "text": "…", "answer": "green", "feedback": "…" }] } }
```

`AiSandbox` v kurzu použít nejde (validace ho odmítne).

## Pilotní cvičení u lekce AIFB

Přidej záznam do `pupil-pilots.json` → `lessons["<id lekce>"]` se `status: "draft"`, `component`, `config`, volitelně `text` (úvod pro žáky) a `reviewNotes` (co má vlastník potvrdit; žákům se neukazuje). AI cvičení navíc potřebuje konfiguraci v `src/lib/edu/aifb/ai-config.ts` (systémový prompt, uložená odpověď, limit slov); validace kontroluje, že jsou obě strany.

## Nová ilustrace

1. V `src/components/edu/aifb/theory-figures.tsx` napiš komponentu se SVG (šířka 560, výška podle potřeby) a použij pomocné `Svg`, `Box`, `Txt`, `Arrow`. Barvy jen přes třídy `af-*` (např. `af-fill-accent`, `af-card--warn`), nikdy pevné hex hodnoty.
2. Přidej ji do mapy `FIGURES` a její id do `FIGURE_IDS` v `src/lib/edu/aifb/theory.ts`.
3. Animace: třídy `af-pulse`, `af-reveal`, `af-step--1…4`, `af-check--1…4`, `af-stamp`, `af-runner`, `af-magnifier` … (definované v `aifb.css` uvnitř `@media (prefers-reduced-motion: no-preference)`).
4. Použij ji v textu blokem `{ "type": "figure", "figure": "<id>", "caption": "…" }`. Test hlídá, že každá ilustrace z `FIGURE_IDS` je v teorii použitá.

## Soubor ke stažení

1. Ulož soubor do `public/assets/aifb/2026-10/` a přidej ho do gitu přes `git add -f` (`public/` je v `.gitignore`).
2. Zapiš ho do `src/content/aifb/downloads.json` (`category`, `path`, `file`, `format`, `bytes`). Validace ověří, že existuje a sedí velikost.

## Nový text rozhraní

Přidej klíč do `src/lib/edu/aifb/messages.ts` (`aifb.<oblast>.<název>`) a používej ho přes `t("…")`. Pevné texty v komponentách nejsou povolené.

## Generátory teorie a kurzu

Text teorie a kurzu původně vznikl Python skripty mimo repozitář (pomohly s neoddělitelnými mezerami). Zdrojem pravdy jsou teď JSON soubory a upravují se přímo.
