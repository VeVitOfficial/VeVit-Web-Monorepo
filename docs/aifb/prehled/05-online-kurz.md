# 05 · Online kurz pro všechny

Celý text kurzu včetně správných odpovědí je v [generovano/online-kurz.md](generovano/online-kurz.md).

## Záměr

Kurz je **směs všech tří kategorií**: z každé bere to nejdůležitější a podává to tak, aby to zvládl desetiletý žák i dospělý bez učitele. Je pro samostatné studium, nepotřebuje účet ani žádný AI nástroj. Každý modul má nejdřív teorii a pak krátké lekce s cvičeními přímo na stránce.

## Moduly

| # | Modul | Délka | Vychází z | Teorie (sekce) | Lekce |
|---|---|---|---|---|---|
| 1 | Co je umělá inteligence | 45 min | 1. stupeň, SŠ | program z příkladů, historie, kde ji potkáváme, jak se učí, jak píše jazykový model, co umí a neumí, proč jí rozumět | Najdi AI kolem sebe · Jak se program učí poznávat · Hádej další slovo · Kvíz |
| 2 | Jak se AI ptát | 50 min | 1. a 2. stupeň | co je prompt, recept, pro koho a jak dlouhé, ukázka, ladění, chyby, nový rozhovor, učit se s AI | Poznej dobré zadání · Recept na zadání · Vylepši zadání · Pomáhá, nebo dělá za mě? |
| 3 | Pravda, nebo výmysl? | 50 min | všechny tři | halucinace, proč máme sklon věřit, ověřování, zdroje, zkreslení, deepfake, co dělat při chybě | Detektiv halucinací · Tři zdroje · Fotka, nebo podvrh? · Moje pravidla ověřování |
| 4 | Soukromí a bezpečnost | 45 min | všechny tři | kam putují data, co do AI nepatří, fotky druhých, anonymizace, věkové podmínky, phishing, hesla | Můžu to napsat do AI? · Rozřaď údaje · Anonymizuj text · Kvíz: bezpečně online |
| 5 | AI jako pomocník | 50 min | 2. stupeň, SŠ | studijní parťák, formát výstupu, multimodalita, pracovní postup, člověk v okruhu, přiznat pomoc | Plán na opakování · Správný formát · Navrhni pracovní postup · Kdo má rozhodnout? |
| 6 | Jak AI funguje uvnitř | 55 min | SŠ | kontextové okno, tokeny a cena, nástroje, RAG, agenti a prompt injection, měření kvality, cloud vs. počítač, kam dál | Co si model pamatuje · AI s vlastní knihovnou · Agent na výletě · Závěrečný test kurzu |

Celkem asi 5 hodin, 6 teorií, 24 lekcí. Teorie modulů mají 6–8 sekcí a 610–775 slov (čtení 3–4 minuty).

## Lekce kurzu

Každá lekce má:

- **úvod** (o co jde),
- **postup** (číslovaný seznam kroků),
- volitelně **cvičení na stránce** („Vyzkoušej si“): kvíz (`QuizCard`), třídění karet (`CardSort`) nebo semafor s vlastními popisky (`TrafficLightCards`),
- volitelně **tip**,
- **Co si odneseš** (výsledek lekce),
- listování: předchozí lekce / teorie, zpět na modul, další lekce; poslední lekce modulu vede na teorii dalšího modulu, poslední lekce kurzu zpět na přehled.

Lekce bez cvičení na stránce (např. „Hádej další slovo“, „Tři zdroje“, „Anonymizuj text“) jsou praktické úkoly na papír nebo do poznámek. Kde je volitelné vyzkoušet AI nástroj, text připomíná věkové podmínky („mladší s rodičem“) a úkol jde splnit i bez něj.

## Proč bez cvičení s AI

Kurz je pro všechny včetně dětí a nemá přihlášení, takže nelze ověřit věk ani souhlas rodičů. Proto nepoužívá `AiSandbox` (validace by takové cvičení odmítla). Cvičení se vyhodnocují jen v prohlížeči a nic neodesílají.

## Technika

- Obsah: `src/content/aifb/aifb-kurz.json` (vlastní soubor; katalog AIFB se nemění, karta „Online kurz pro všechny“ si počty bere z tohoto souboru).
- Typy a funkce: `src/lib/edu/aifb/course.ts` (`Course`, `CourseModule`, `CourseLesson`, `findModule`, `moduleLessonIds`, `validateCourse`).
- Stránky: `src/app/edu/ai-gramotnost/kurz/**`, komponenty v `src/components/edu/aifb/course-views.tsx`.
- Id: modul `kurz-m1`, teorie `kurz-m1-teorie`, lekce `kurz-m1-cv1`. Stejný tvar jako lekce AIFB, takže funguje místní průběh, export / import a XP (teorie 25, lekce 40, bonus 60 za celý modul).
- Viditelnost: `courseVisible(role)` – kurz ve stavu `draft` vidí admin, vývoj, náhledové nasazení a běh s `AIFB_PREVIEW_DRAFTS=1`. Ostatním přehled kurzu ukáže „Online kurz se připravuje“ a moduly a lekce vrací 404. Kurz je jediné, co vidí veřejnost (bez ranku): rozcestník ji sem rovnou přesměruje (kapitola 12).

## Tvar souboru

```json
{
  "version": "2026-10",
  "status": "draft",
  "title": "Online kurz pro všechny",
  "subtitle": "…", "lead": "…", "audience": "…",
  "howItWorks": ["…"],
  "modules": [
    {
      "id": "kurz-m1", "order": 1, "code": "Modul 1",
      "title": "…", "subtitle": "…", "minutes": 45,
      "sources": ["zs1", "ss"],
      "goals": ["…"],
      "theory": { "lead": "…", "sections": [ … ], "summary": ["…"] },
      "lessons": [
        {
          "id": "kurz-m1-cv1", "order": 1, "title": "…", "minutes": 10,
          "intro": "…", "steps": ["…"], "outcome": "…", "tip": "…",
          "activity": { "component": "CardSort", "config": { … } }
        }
      ]
    }
  ]
}
```

Pravidla, která hlídá `validateCourse`: id a pořadí modulů i lekcí bez děr (`kurz-m1…`, `-cv1…`), nejvýš 5 lekcí v modulu, neprázdné texty, `sources` jen `zs1` / `zs2` / `ss`, platná teorie (stejná kontrola jako u teorie levelů) a platná konfigurace cvičení, žádné `AiSandbox`.
