# 04 · Teorie a ilustrace

Celý text teorie je ve vygenerovaném souboru [generovano/teorie.md](generovano/teorie.md), včetně tabulky, která ilustrace se kde používá.

## Proč vznikla samostatná teorie

Plány pro učitele obsahují u „teorie“ jen metodiku (jak ji vést, opakovací otázky, diskuzní témata), ne samotný výklad. Vlastník chtěl, aby teorie byla normální, přehledný a obsáhlý text s obrázky, který stojí **před lekcemi** a nepočítá se mezi ně. Text proto vznikl nově podle témat, cílů a teoretické části plánů. Je ve stavu **návrh** a čeká na odbornou kontrolu.

## Soubor `src/content/aifb/aifb-theory.json`

```json
{
  "version": "2026-10",
  "status": "draft",
  "note": "…",
  "topics": {
    "foundation": { "lead": "…", "sections": [ … ], "summary": [ "…" ] },
    …
  },
  "levels": {
    "zs2-level-1": { "topic": "foundation" },
    "ss-level-1":  { "topic": "foundation", "extra": [ { "id": "vznik-modelu", … } ] },
    …
  }
}
```

- **topics** – 10 textů: `zs1-a`, `zs1-b`, `zs1-c`, `zs1-d`, `foundation`, `prompting`, `automation`, `scripting`, `developer`, `architect`.
- **levels** – ke každému ze 16 bloků / levelů přiřadí téma. 2. stupeň a SŠ sdílí téma stejného levelu; SŠ může mít `extra` sekce, které se připojí na konec.
- `resolveTheory(file, levelId)` vrátí úvod, sekce (téma + extra), shrnutí a stav.

### Sekce a bloky

Sekce má `id` (kotva v adrese, např. `#halucinace`), `heading` a seznam bloků:

| Typ bloku | Tvar | Vzhled |
|---|---|---|
| `p` | `{ text }` | odstavec |
| `list` | `{ ordered, title?, items[] }` | odrážky nebo číslovaný seznam s nadpisem |
| `terms` | `{ items: [{ term, text }] }` | pojmy v rámečcích |
| `callout` | `{ tone: tip/warning/info, title, text }` | upozornění s barevným okrajem a ikonou 💡 ⚠️ ℹ️ |
| `figure` | `{ figure, caption }` | ilustrace s popiskem |
| `example` | `{ title, text }` | ukázka v neproporcionálním písmu (zadání, kód, JSON) |

Text podporuje jen **tučně** a *kurzívu*. Za jednopísmennými předložkami a spojkami (v, k, s, z, o, u, a, i) je neoddělitelná mezera (U+00A0), aby nezůstávaly na konci řádku.

### Délka

| Téma | Slov | Sekcí |
|---|---|---|
| `zs1-a` / `zs1-b` / `zs1-c` / `zs1-d` | 650 / 588 / 571 / 551 | 9 každé |
| `foundation` | 1 088 | 11 |
| `prompting` | 927 | 11 |
| `automation` | 979 | 11 |
| `scripting` | 937 | 10 |
| `developer` | 756 | 9 |
| `architect` | 901 | 10 |

Čísla jsou bez sekcí navíc pro SŠ. Každé téma má aspoň jednu ilustraci a shrnutí. Doba čtení se počítá z počtu slov (200 slov za minutu) a ukazuje se na kartě i stránce.

## Stránka teorie

`TheoryView` (levely) a `CourseTheoryView` (kurz) používají společné rozvržení `TheoryLayout`:

1. hlavička: „Blok A · Teorie“, název, úvod, doba čtení, tlačítko tisku,
2. vlevo (na širokém displeji) sticky **obsah** s odkazy na sekce, na mobilu nad textem,
3. sekce s bloky, písmo 17 px, řádek max. asi 46 rem,
4. **shrnutí** v barevném rámečku,
5. u levelů s pilotním cvičením „Vyzkoušej si“ (jen návrh v náhledu),
6. stav a tlačítko „Označit jako hotové“ (otevření teorie ji označí jako rozpracovanou),
7. tlačítko „Pokračovat: Lekce 1: …“,
8. u levelů sbalená „Pro učitele: jak s teorií pracovat“ (metodika z plánu),
9. poznámka, že text je návrh.

## Ilustrace

Všechny jsou ručně kreslené SVG v `src/components/edu/aifb/theory-figures.tsx`. Žádné obrázky se nestahují, barvy jsou z tokenů přes třídy `af-*` v `aifb.css`, takže fungují ve světlém i tmavém režimu. SVG je pro čtečky skryté; význam nese viditelný popisek pod obrázkem.

| Id | Co ukazuje | Animace |
|---|---|---|
| `ai-around-us` | asistentka, videa, fotoaparát, navigace | vlnky hlasu, blikání rámečku obličeje, poskakující špendlík |
| `secret-box` | tajemství vs. co můžu říct | – |
| `learn-from-examples` | označené kočky a psi → program → nový obrázek | posun příkladů, objevení odpovědi |
| `fair-data` | jen červená jablka vs. pestrá jablka | objevení odpovědi |
| `ask-check` | zeptat se → přečíst → ověřit | postupné zvýraznění kroků, lupa |
| `prompt-recipe` | recept: role, úkol, tón, podoba | postupné odškrtávání |
| `prompt-blocks` | kostky role, kontext, úkol, formát → model → výstup | padající kostky |
| `next-word` | „Hlavní město Česka je…“ a pravděpodobnosti | rostoucí pruhy |
| `hallucination` | sebejistá chybná odpověď vs. ověření | razítko „zní jistě!“ |
| `ai-made` | fotka, nebo vyrobený obrázek + tři otázky | lupa, postupné otázky |
| `privacy-sort` | do AI ano / ne | – |
| `markdown-json` | stejný obsah v Markdownu a JSON | – |
| `workflow` | spouštěč → akce → podmínka → výstup | běžící tečka |
| `human-loop` | model → člověk zkontroluje → odesláno | běžící tečka, razítko |
| `api-request` | program ↔ služba (požadavek, 200 OK + JSON) | balíčky tam a zpět |
| `context-window` | zprávy v kontextovém okně | postupné přibývání zpráv |
| `function-calling` | model → požadavek → skript → odpověď | zvýraznění kroků |
| `eval-loop` | testovací sada → model → porovnání → skóre | objevování ✓ / ✗ |
| `rag` | dokumenty → úseky → vektorová databáze → prompt | pulzující nalezené body |
| `agents` | orchestrátor, tři agenti, kontrolor | tekoucí čáry |
| `prompt-injection` | skrytý pokyn v dokumentu, agent, štít „data ≠ pokyny“ | pulzující varování |

Všechny animace se vypnou při nastavení „omezit pohyb“ (`prefers-reduced-motion`).

## Jak se přidává nová ilustrace

Viz [10-jak-upravit-obsah.md](10-jak-upravit-obsah.md#nová-ilustrace).
