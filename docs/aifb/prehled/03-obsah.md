# 03 · Obsah

Úplný seznam lekcí s časy, výstupy a cíli je ve vygenerovaném souboru [generovano/lekce-aifb.md](generovano/lekce-aifb.md). Tady je přehled a vysvětlení, jak obsah drží pohromadě.

## Počty

| Co | Počet |
|---|---|
| Kategorie s obsahem | 3 (+ online kurz) |
| Bloky / levely | 24 (4 + 10 + 10): na 2. stupni a SŠ 6 základních + 4 rozšiřující pro zájemce |
| Stránky teorie | 24 (jedna na blok / level), z toho 16 v základní osnově |
| Lekce (cvičení z plánu) | 120 (5 na blok / level), z toho 80 v základní osnově |
| Témata teorie | 14 (2. stupeň a SŠ sdílí téma, SŠ má sekce navíc) |
| Slov teorie | asi 12 400 |
| Ilustrace | 21 SVG, část animovaná |
| Interaktivní cvičení pro žáky | 124: 24 na 1. stupni (20 lekcí a 4 teorie), 50 na 2. stupni a 50 na SŠ (všechny lekce levelů 1–10). 118 schváleno (`reviewed`), 6 návrh (4 s AI, 2 citlivé rozhovory) |
| Online kurz | 6 modulů, 6 teorií, 30 lekcí (5 v modulu), každá s cvičením na stránce |

Katalog (`aifb-catalog.json`) uvádí 144 „lekcí“, protože počítá i teorie (24 + 120). Rozhraní ukazuje „Teorie + 5 lekcí“, protože teorie mezi lekce nepatří.

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
| A | AI kolem nás | 6–7 h | `zs1-a`: počítač, robot a AI; kde ji potkáváme; jak ji poznat; není živá; není kamarád; tajemství; pravidla |
| B | Jak přemýšlí počítač | 7–8 h | `zs1-b`: učení z příkladů; férovost dat; proč si program vymýšlí; výběr pomocníka; kdo za to může |
| C | Host AI ve třídě | 7–8 h | `zs1-c`: konverzační nástroj; jak skládá odpověď; tři části zadání; čteme s otazníkem; vyrobené obrázky; když tě něco trápí |
| D | Přesná zadání a vlastní projekt | 10–11 h | `zs1-d`: čtyři části zadání; pro koho je odpověď; ukázka; poctivost a zdroje; od člověka, nebo od AI; projekt |

V listopadu 2026 se 1. stupeň posunul stejným směrem jako vyšší kategorie. Čtyři lekce nahradily původní: A5 **Kamarád, nebo stroj?** (místo Malý vynálezce), B4 **Kdy počítač nepotřebujeme** (místo Člověk versus počítač), C2 **Co hostovi neříkáme** (místo Vypravěč; osobní údaje a „když mě něco trápí“, Linka bezpečí 116 111), D3 **Člověk, nebo AI?** (místo Kvíz podle pravidel; obrázky, texty, podezřelé zprávy). Id lekcí se nezměnila.

Na 1. stupni AI ovládá jen učitel, žáci do nástroje nepíšou (pravidlo R1).

### 2. stupeň ZŠ (`zs2`), stezka a Střední školy (`ss`), čistý seznam

Od listopadu 2026 má osnova dvě části. **Levely 1–6 jsou praktické jádro pro běžné žáky a studenty** (bez programování): jak AI funguje, jak s ní mluvit, o čem s ní mluvit, jaký nástroj na co, jak poznat její výtvory a jak se v oboru orientovat. **Levely 7–10 jsou rozšíření pro zájemce** (štítek „Pro zájemce“): původní programátorské levely 3–6, přečíslované beze změny obsahu. Kostra šesti levelů je pro oba stupně společná, lekce se liší; SŠ má v teorii sekce navíc.

| Level | Název | Téma teorie | Lekce 2. stupeň | Lekce SŠ | Navíc v teorii pro SŠ |
|---|---|---|---|---|---|
| 1 | Co je AI a jak funguje | `foundation` | První konverzace, Detektiv halucinací, Hra na jazykový model, Co AI umí a co ne, Slovníček AI | První konverzace, Detektiv halucinací, Tokeny a kontextové okno, Odkud model ví, co ví, Pojmy pro laika | Jak model vzniká |
| 2 | Jak s AI mluvit | `prompting` | Záchranář promptů, Ukázkové příklady, Ladění na třikrát, Správná podoba odpovědi, Moje šablona zadání | Záchranář promptů, Few-shot, Iterace, Markdown a JSON, Dlouhá úloha po krocích | Složité úlohy po krocích |
| 3 | O čem s AI mluvit | `komunikace` | Patří to do AI?, Přepiš to bezpečně, AI není kamarád, Když mě něco trápí, Třídní dohoda | Kam putují moje data, Co do AI nepatří, Chatbot jako důvěrník, Těžká témata, Osobní zásady | Podmínky služeb; když rozhovory nahrazují lidi |
| 4 | Jaký nástroj na co | `nastroje` | AI, nebo něco jednoduššího?, Souboj nástrojů, Různé druhy AI, AI na učení, Rozhodovací strom | AI, vyhledávač, tabulka, nebo skript?, Tři nástroje, Výběr modelu a cena, AI při studiu, AI na brigádě | Menší a větší modely; AI v práci |
| 5 | Poznej AI a používej ji poctivě | `poznej-ai` | Fotka, nebo AI?, Kdo to psal?, Podezřelá zpráva, Dá se webu věřit?, Pomáhá, nebo dělá za mě? | Deepfaky, Limity detektorů, Phishing, Web vygenerovaný AI, Seminárka poctivě | Klonování hlasu; citování a autorská práva |
| 6 | Svět AI | `svet-ai` | Kdo AI vyrábí, Chatbot, nebo agent?, Jak se programy domlouvají (API, MCP), Novinka, nebo reklama? (llm-stats.com), Můj průvodce AI | Mapa trhu, API a MCP, Agenti, Žebříčky a benchmarky, AI, pravidla a budoucnost práce | Otevřené modely; AI Act; pracovní trh |
| 7 | AIFB Advanced – Automatizace a práce s API | `automation` | původní level 3 | původní level 3 | – |
| 8 | Advanced API Integration and Scripting | `scripting` | původní level 4 | původní level 4 | Stejný princip v TypeScriptu |
| 9 | Custom AI Developer | `developer` | původní level 5 | původní level 5 | Jak doladění probíhá |
| 10 | AI Systems Architect | `architect` | původní level 6 | původní level 6 | Pravidla pro využití AI v organizaci |

Při přestavbě se jednorázově změnila id: původní `*-level-3` až `*-level-6` jsou teď `*-level-7` až `*-level-10` a id `*-level-3` až `*-level-6` nesou nový obsah. Úpravy adminem uložené v databázi a průběh uložený k původním levelům 3–6 se proto vztahují k novému obsahu a je potřeba je zkontrolovat.

Levely 1, 2 a 7 mají plánovanou certifikaci s názvem (Certified AI Associate, Certified Prompt Specialist, Certified AI Automation Practitioner), levely 8–10 bez názvu, levely 3–6 zatím žádnou. Vše je ve stavu `planned` a aplikace ukazuje „Připravuje se“.

## Průvodce pro učitele

Každá kategorie má průvodce (`guide` v obsahu): 4 kapitoly pro 1. stupeň, 3 pro 2. stupeň a SŠ. Obsahuje úvod, pravidla bezpečné práce, ochranu údajů, doporučený postup a u 1. stupně dopis rodičům a časté otázky (oddíl 7.3 lze vytisknout nebo zkopírovat). Text lekcí na oddíly odkazuje (např. „oddíl 7.2“) a tyto odkazy jsou v aplikaci klikací.

Lekce, kde se pracuje s AI nástrojem, mají upozornění na ochranu údajů s odkazem do průvodce: 1. stupeň bloky C a D (oddíl 7.2), 2. stupeň a SŠ všechna cvičení (oddíl 1.4).

## Soubory ke stažení

`downloads.json` zatím obsahuje jen `AIFB_plan_cviceni_pro_skoly.docx` (SŠ, 51 kB) v `public/assets/aifb/2026-10/`. Soubory pro 1. a 2. stupeň a PDF chybí; dokud je vlastník nedodá, průvodce ukazuje „Soubory ke stažení se připravují“.

## Pilotní cvičení pro žáky

Interaktivní vrstvu (`pupil-pilots.json`) má **každá lekce i teorie 1. stupně** (24 cvičení) a **každá lekce levelů 1–6 na 2. stupni a SŠ** (60 cvičení, z toho čtyři s AI). Cvičení používají deset typů: vedle kvízu, třídění a semaforu také skládačku zadání, detektiva v textu, hru na jazykový model, přímku, rozhovor s volbou odpovědí a spojovačku (kapitola 06). Rozšiřující levely 7–10 mají cvičení společná pro oba stupně (20 cvičení, například únik API klíče v kódu, stavové kódy, function calling, RAG po krocích, prompt injection v dokumentu); úplný text je v [generovano/pilotni-cviceni.md](generovano/pilotni-cviceni.md). Každé cvičení 1. stupně má tematickou hlavičku „mise“ podle ostrova na mapě (Zátoka Objevitelů, Ostrov Robotů, Přístav Hostů, Ostrov Pokladu) a obrázky u otázek, karet a situací. Na 1. stupni se nepoužívá žádné cvičení s AI (R1).

| Blok | Teorie | Lekce 1–5 |
|---|---|---|
| A | kvíz | třídění (hledačka AI), skládačka (příkaz pro robota), kvíz (detektiv obrázků), semafor (tajemství), třídění (kamarád / stroj) |
| B | kvíz | semafor (dobrý příklad / splete ho), detektiv (chyby v textu o psech), hra na jazykový model, třídění (vyber pomocníka), semafor (pravidla) |
| C | kvíz | skládačka (zadání o koloběhu vody), detektiv (osobní údaje ve zprávě), semafor (správně / chyba), třídění (kde to ověřím), rozhovor (plán od hosta) |
| D | kvíz | třídění (podoba odpovědi), kvíz (vzorový příklad), detektiv (podezřelá zpráva), skládačka (oprava zadání), přímka (poctivé ↔ nepoctivé) |

2. stupeň a SŠ, levely 1–6 (lekce 1–5):

| Level | 2. stupeň | SŠ |
|---|---|---|
| 1 | rozhovor, AI (ověřování), hra na jazykový model, přímka, spojovačka | rozhovor, AI (ověřování), detektiv (mýty o tokenech), přímka, spojovačka |
| 2 | AI (záchrana zadání), detektiv (chybné ukázky), rozhovor (ladění), spojovačka (Markdown a JSON), skládačka | AI (záchrana zadání), detektiv (chybné ukázky), rozhovor (iterace), detektiv (chyby v JSON), skládačka |
| 3 | přímka, detektiv (anonymizace), rozhovor (chatbot lichotí), rozhovor (kamarádka v nouzi), spojovačka | detektiv (podmínky služby), detektiv (anonymizace), rozhovor („AI přítel“), rozhovor (spolužák v krizi), přímka |
| 4 | spojovačka, přímka, spojovačka, rozhovor (učení), rozhovor (rozhodovací strom) | spojovačka, přímka, spojovačka, rozhovor (studium), detektiv (zápis z porady) |
| 5 | rozhovor (šokující fotka), přímka, detektiv (e-mail), detektiv (web), přímka | rozhovor (deepfake), přímka (síla důkazu), detektiv (cílený e-mail), detektiv (recenzní web), přímka |
| 6 | spojovačka (firmy), rozhovor (agent), spojovačka (API a MCP), detektiv (zpráva o AI), spojovačka | spojovačka (firmy), spojovačka (API a MCP), rozhovor (agent a prompt injection), detektiv (mýty o žebříčcích), přímka (AI Act) |

Cvičení s AI:

| Lekce | Cvičení |
|---|---|
| `zs2-level-2-cv1`, `ss-level-2-cv1` | AI: záchrana vágního zadání |
| `zs2-level-1-cv2`, `ss-level-1-cv2` | AI: ověřování textu o Karlu IV. (s chybami) |

Všechny jsou návrh: zobrazují se jen ve vývoji a v náhledových nasazeních.

## Online kurz

Viz kapitola [05-online-kurz.md](05-online-kurz.md) a celý text v [generovano/online-kurz.md](generovano/online-kurz.md).
