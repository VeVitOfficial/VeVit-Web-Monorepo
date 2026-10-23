# 01 · Co to je

## Účel

**AI gramotnost (AIFB, AI Fluency Benchmark)** je výuková sekce VeVit Edu o tom, jak rozumět umělé inteligenci a bezpečně ji používat. Vychází z metodických plánů pro školy (dokument `AIFB_plan_cviceni_pro_skoly.docx` a jeho varianty pro 1. a 2. stupeň), které byly převedeny do strukturovaných JSON souborů.

Sekce má dvě části:

1. **Výuka pro školy** – tři kategorie podle věku. Obsah je primárně pro učitele (zadání cvičení, rozvrh, metodika), doplněný o teorii, kterou si žáci mohou číst.
2. **Online kurz pro všechny** – samostatný kurz pro jednotlivce od 10 let i dospělé, bez učitele a bez účtu.

## Pro koho

| Část | Věk | Kdo ovládá | Jednotka |
|---|---|---|---|
| 1. stupeň ZŠ (`zs1`) | 1.–5. třída (6–11 let) | učitel, děti se zapojují hrou | 4 bloky (A–D) |
| 2. stupeň ZŠ (`zs2`) | 6.–9. třída | nejdřív učitel, později samostatně | 6 levelů |
| Střední školy a gymnázia (`ss`) | 1.–4. ročník | samostatná práce | 6 levelů |
| Online kurz (`kurz`) | od 10 let a dospělí | samostatné studium | 6 modulů |

## Co uvidí návštěvník

1. **Hub** (`/cs/edu/ai-gramotnost`) – úvod s animovaným robotem, čtyři karty kategorií (1. stupeň, 2. stupeň, SŠ, online kurz), sekce „Můj průběh“ (XP, export a import) a odkazy na průvodce pro učitele. Co z toho kdo vidí, závisí na ranku (student, učitel, admin; bez ranku jen online kurz), viz kapitola 12.
2. **Kategorie** (`/aifb/zs1`) – přehled bloků nebo levelů. Každá kategorie má vlastní vzhled:
   - 1. stupeň: **pirátská mapa** s ostrovy (`pirate-map`),
   - 2. stupeň: **stezka** (`trail`),
   - SŠ: **čistý seznam** karet a tabulka (`clean`).
   U map lze přepnout na seznamové zobrazení (přístupnost).
3. **Blok / level** (`/aifb/zs1/blok-a`) – nahoře hlavička a postup, potom **1 Teorie** (karta s úvodem a dobou čtení), potom **2 Lekce** (lekce 1–5 se stavem). Níž sbalené sekce „O bloku a jeho cíle“ a „Pro učitele“ (rozvrh, poznámky, odkaz na průvodce a tisk).
4. **Teorie** (`/aifb/zs1/blok-a/teorie`) – souvislý text v běžné velikosti písma s obsahem, ilustracemi, shrnutím, případně kvízem „Vyzkoušej si“, tlačítkem „Označit jako hotové“ a „Pokračovat: Lekce 1“. Dole sbalená metodika pro učitele.
5. **Lekce** (`/aifb/zs1/blok-a/cv1`) – zadání, co má vzniknout, forma práce, čas; u lekcí s AI upozornění na ochranu údajů; u pilotních lekcí interaktivní cvičení; listování na předchozí / další lekci.
6. **Tisk** (`/aifb/zs1/blok-a/tisk`) – celý blok na jedné stránce k vytištění (teorie, lekce, příloha pro učitele).
7. **Průvodce pro učitele** (`/aifb/zs1/pro-ucitele`) – kapitoly metodiky, pravidla ochrany údajů, dopis rodičům, soubory ke stažení.
8. **Online kurz** (`/kurz`) – přehled modulů, stránka modulu (teorie, potom lekce), teorie modulu a lekce s cvičením.

## Co sekce záměrně nedělá

- Nemá přihlášení, třídy ani účty žáků.
- Nezapisuje XP do účtu VeVit (XP je jen v prohlížeči).
- Nevydává certifikáty; u levelů je vždy štítek „Připravuje se“.
- Nesbírá analytiku (Vercel Analytics i Speed Insights jsou pro tuto sekci vypnuté).
- Nenačítá nic z cizích serverů (písma, skripty i ikony jsou z vlastní domény).
