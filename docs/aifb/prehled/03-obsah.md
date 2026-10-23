# 03 · Obsah

Úplný seznam lekcí s časy, výstupy a cíli je ve vygenerovaném souboru [generovano/lekce-aifb.md](generovano/lekce-aifb.md). Tady je přehled a vysvětlení, jak obsah drží pohromadě.

## Počty

| Co | Počet |
|---|---|
| Kategorie s obsahem | 3 (+ online kurz) |
| Bloky / levely | 16 (4 + 6 + 6) |
| Stránky teorie | 16 (jedna na blok / level) |
| Lekce (cvičení z plánu) | 80 (5 na blok / level) |
| Témata teorie | 10 (2. stupeň a SŠ sdílí téma, SŠ má sekce navíc) |
| Slov teorie | asi 8 300 |
| Ilustrace | 21 SVG, část animovaná |
| Pilotní interaktivní cvičení | 7 (návrh) |
| Online kurz | 6 modulů, 6 teorií, 24 lekcí, asi 7 900 slov |

Katalog (`aifb-catalog.json`) uvádí 96 „lekcí“, protože počítá i teorie (16 + 80). Rozhraní ukazuje „Teorie + 5 lekcí“ a celkem 80 lekcí, protože teorie mezi lekce nepatří.

## Struktura jednoho bloku / levelu

```
Blok / level  (např. zs1-blok-a)
├── Teorie        zs1-blok-a-teorie   text z aifb-theory.json + metodika z plánu
├── Lekce 1       zs1-blok-a-cv1      cvičení z plánu
├── Lekce 2       zs1-blok-a-cv2
├── Lekce 3       zs1-blok-a-cv3
├── Lekce 4       zs1-blok-a-cv4
└── Lekce 5       zs1-blok-a-cv5
```

Každý level v obsahu má navíc: úvod, cíle, rozsah hodin, časový rozvrh (tabulka), poznámku k rozvrhu, poznámky pro učitele, témata, u 2. stupně a SŠ plánovanou certifikaci (v aplikaci vždy „Připravuje se“), u 1. stupně údaje pro ostrov na mapě.

Každá **lekce (cvičení)** z plánu má: zadání (odstavce), co má vzniknout, formu práce a čas. Pole `pupil` (text pro žáky) je v plánu všude `todo`, protože plán je psaný pro učitele.

**Teorie** z plánu obsahuje jen metodiku: jak teorii vést, opakovací otázky a témata k diskuzi. Proto vznikl samostatný text teorie (kapitola 04), který se zobrazuje nad touto metodikou.

## Kategorie a jejich bloky / levely

### 1. stupeň ZŠ (`zs1`), pirátská mapa

| Blok | Název | Rozsah | Téma teorie |
|---|---|---|---|
| A | AI kolem nás | 6–7 h | `zs1-a`: počítač, robot a AI; kde ji potkáváme; jak ji poznat; není živá; tajemství; pravidla |
| B | Jak přemýšlí počítač | 7–8 h | `zs1-b`: učení z příkladů; férovost dat; proč si program vymýšlí; kdo za to může |
| C | Host AI ve třídě | 7–8 h | `zs1-c`: konverzační nástroj; jak skládá odpověď; tři části zadání; čteme s otazníkem; vyrobené obrázky |
| D | Přesná zadání a vlastní projekt | 10–11 h | `zs1-d`: čtyři části zadání; pro koho je odpověď; ukázka; poctivost a zdroje; projekt |

Na 1. stupni AI ovládá jen učitel, žáci do nástroje nepíšou (pravidlo R1).

### 2. stupeň ZŠ (`zs2`), stezka a Střední školy (`ss`), čistý seznam

Oba mají stejných šest levelů podle AIFB. Liší se textem cvičení a náročností; SŠ má v teorii sekce navíc.

| Level | Název | Rozsah | Téma teorie | Navíc pro SŠ |
|---|---|---|---|---|
| 1 | AIFB Foundation – Základy a bezpečnost | 7–8 h | `foundation` | Jak model vzniká: předtrénování a doladění |
| 2 | AIFB Intermediate – Prompting a datové struktury | 7–8 h | `prompting` | Složité úlohy po krocích |
| 3 | AIFB Advanced – Automatizace a práce s API | 8–10 h | `automation` | – |
| 4 | Advanced API Integration and Scripting | 10–11 h | `scripting` | Stejný princip v TypeScriptu |
| 5 | Custom AI Developer | 9–13 h | `developer` | Jak doladění probíhá |
| 6 | AI Systems Architect | 11–14 h | `architect` | Pravidla pro využití AI v organizaci |

Levely 1–3 mají plánovanou certifikaci s názvem (Certified AI Associate, Certified Prompt Specialist, Certified AI Automation Practitioner), levely 4–6 bez názvu. Vše je ve stavu `planned` a aplikace ukazuje „Připravuje se“.

## Průvodce pro učitele

Každá kategorie má průvodce (`guide` v obsahu): 4 kapitoly pro 1. stupeň, 3 pro 2. stupeň a SŠ. Obsahuje úvod, pravidla bezpečné práce, ochranu údajů, doporučený postup a u 1. stupně dopis rodičům a časté otázky (oddíl 7.3 lze vytisknout nebo zkopírovat). Text lekcí na oddíly odkazuje (např. „oddíl 7.2“) a tyto odkazy jsou v aplikaci klikací.

Lekce, kde se pracuje s AI nástrojem, mají upozornění na ochranu údajů s odkazem do průvodce: 1. stupeň bloky C a D (oddíl 7.2), 2. stupeň a SŠ všechna cvičení (oddíl 1.4).

## Soubory ke stažení

`downloads.json` zatím obsahuje jen `AIFB_plan_cviceni_pro_skoly.docx` (SŠ, 51 kB) v `public/assets/aifb/2026-10/`. Soubory pro 1. a 2. stupeň a PDF chybí; dokud je vlastník nedodá, průvodce ukazuje „Soubory ke stažení se připravují“.

## Pilotní cvičení pro žáky

Sedm lekcí má interaktivní vrstvu (`pupil-pilots.json`), úplný text v [generovano/pilotni-cviceni.md](generovano/pilotni-cviceni.md):

| Lekce | Cvičení |
|---|---|
| `zs1-blok-a-teorie` | Kvíz k teorii |
| `zs1-blok-a-cv1` | Třídění karet: živé bytosti / stroje / chytří pomocníci |
| `zs1-blok-a-cv4` | Semafor: můžu říct / tajemství |
| `zs2-level-2-cv1`, `ss-level-2-cv1` | AI: záchrana vágního zadání |
| `zs2-level-1-cv2`, `ss-level-1-cv2` | AI: ověřování textu o Karlu IV. (s chybami) |

Všechny jsou návrh: zobrazují se jen ve vývoji a v náhledových nasazeních.

## Online kurz

Viz kapitola [05-online-kurz.md](05-online-kurz.md) a celý text v [generovano/online-kurz.md](generovano/online-kurz.md).
