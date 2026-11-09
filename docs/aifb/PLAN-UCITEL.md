# Plán: nástroje pro učitele v AI gramotnosti

Stav k 2026-11-09. Funkce, které ročníková práce („Vývoj edukační webové platformy pro rozvoj AI gramotnosti“) slibuje v úvodu jako dílčí cíl, ale v aplikaci zatím nejsou. Odevzdání práce: **16. 4. 2027**, do té doby musí fungovat.

## Co už funguje

- Ranky student / učitel / správce školy / admin (migrace 025 a 029, obě na produkci).
- **VeVit Edu pro školy** jako samostatná část `/edu/school` (2026-11-09):
  - VeVit admin zakládá školu (kód školy) a určuje správce školy (podle e-mailu účtu).
  - Správce: kmenové třídy (7.A), učitelé, přidělení učitelů ke kmenovým třídám, přesun žáka do jiné třídy, odebrání ze školy, nový kód.
  - Žák zadá kód **školy**, jméno, příjmení a vybere kmenovou třídu. Tlačítko na hlavní stránce Edu se pak změní na „Vstoupit do třídy“.
  - Učitel vidí jen žáky kmenových tříd, které mu přidělil správce; zakládá si vlastní třídy, žáka odebere jen ze své třídy.
  - Menu učitele: Přehled, Obsah a metodika, Moje třídy, Průběh žáků, Tvorba, Komunita, Ze sešitu přes AI.
  - Žák vidí jen lekce odemčené nebo zadané učitelem.
- Odemykání a zamykání lekcí třídě (po jedné i celý level).
- Úpravy obsahu adminem s historií verzí.

## Co musí vzniknout

| # | Funkce | Co to znamená | Poznámky / rizika |
|---|---|---|---|
| U1 ✅ | **Zadávání lekcí** | Učitel zadá třídě lekci jako úkol (termín, poznámka). Žák vidí seznam zadaných úkolů. | Liší se od odemknutí: odemknutá lekce je jen přístupná, zadaná je povinná s termínem. |
| U2 | **Vlastní cvičení** | Učitel vytvoří cvičení (kvíz, třídění karet, semafor) v editoru a zadá ho třídě. | Využít `validatePupilLayer` a existující komponenty. Na 1. stupni žádné AI cvičení (R1). |
| U3 | **Cvičení z komunity** | Učitelé sdílí svá cvičení do společné knihovny, ostatní je mohou zadat své třídě. | Potřeba moderace / schválení (R7), nahlášení, licence sdíleného obsahu. |
| U4 | **Cvičení z pracovního sešitu přes AI** | Učitel nahraje fotku nebo PDF úlohy, AI z ní vytvoří online cvičení, učitel ho zkontroluje a upraví. | Autorská práva vydavatelů sešitů; nahraný soubor neukládat déle, než je nutné; výstup AI vždy jako návrh ke kontrole; kontrola osobních údajů (R2). |
| U5 | **Vlastní teorie** | Učitel napíše vlastní teorii (bloky textu, ilustrace) a připojí ji ke kurzu nebo lekci. | Stejná validace jako `validateTheory`. |
| U6 | **Vlastní kurzy** | Učitel složí celý kurz: moduly, teorie, lekce, cvičení (vlastní, komunitní i z AIFB). | Tvar jako `aifb-kurz.json` / `validateCourse`. |
| U7 ✅ | **Průběh žáků** | Učitel vidí, kdo které lekce a úkoly splnil, XP, kdy naposledy. | Průběh je teď jen v `localStorage` žáka → musí se ukládat na server u žáků ve třídě. Osobní údaje dětí: GDPR, souhlas zákonných zástupců u žáků pod 15 let, pověřenec školy. Žádná analytika třetích stran (R3). |
| U8 ✅ | **Kontrola splnění úkolu** | U zadaného úkolu přehled: splnil / nesplnil / po termínu, odpovědi ve cvičení. | Navazuje na U1 a U7. |
| U9 ✅ | **Reset průběhu žáka** | Učitel vynuluje žákovi průběh lekce, úkolu nebo celé třídy. | Jen v rámci své třídy; potvrzovací dialog. |

## Obsah, který v lekcích chybí

AI gramotnost = gramotnost **lidí** v používání AI. Úvod práce slibuje tato témata, v obsahu (`src/content/aifb/*.json`) zatím nejsou:

| # | Téma | Stav |
|---|---|---|
| O1 | **MCP** (Model Context Protocol): co to je, k čemu slouží | v obsahu 0× |
| O2 | **Přehled trhu AI**: hlavní firmy (OpenAI, Google, Anthropic, Meta, Mistral, DeepSeek…), jejich modely, který nástroj na jaký úkol | Anthropic 0×, Gemini jen okrajově |
| O3 | **Jak zůstat v obraze**: llm-stats.com, žebříčky a srovnání modelů, oficiální blogy a changelogy | llm-stats 0×, žebříčky 0× |
| O4 | **Formáty .md a .json**: ověřit, že jsou vysvětlené i v online kurzu a pro 2. stupeň srozumitelně | částečně (prompting / datové struktury) |
| O5 | **Autonomní agenti**: co je agent, jak sám plánuje a provádí kroky, kde je jeho hranice a rizika | „agent“ je v kurzu (modul 6) a v levelech 2. st. / SŠ, pojem „autonomní“ 0× – ověřit, že je to vysvětlené jako samostatné téma |
| O6 | **Kdy AI nepoužívat**: na výpočty, převody souborů, hromadné úpravy apod. stačí jednoduchý program nebo skript, je spolehlivější, rychlejší a levnější | samostatné téma chybí (jen náznaky) |

Hotovo 2026-11-09 (portál `/edu/school`, migrace 029): U1 zadání s termínem a poznámkou, U7 průběh žáka ve škole se ukládá na server (`edu_lesson_progress`), U8 přehled splněno / po termínu u každého úkolu a tabulka žák × lekce, U9 reset průběhu žáka v detailu třídy. U2–U6 mají v menu učitele stránku s popisem, funkce zatím chybí.

## Doporučené pořadí

1. ~~Migrace 025 a 029 na produkci.~~
2. ~~U7 serverový průběh.~~
3. ~~U1 zadávání lekcí → U8 kontrola splnění → U9 reset.~~
4. U2 vlastní cvičení → U5 vlastní teorie → U6 vlastní kurzy.
5. U3 komunita (potřebuje U2 a moderaci).
6. U4 AI z pracovních sešitů (potřebuje U2 a klíč k modelu).

## Po dokončení každé funkce

Aktualizovat Word ročníkové práce (viz `CLAUDE.md`, oddíl Ročníková práce) a tuto tabulku.
