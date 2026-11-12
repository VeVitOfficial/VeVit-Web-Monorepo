# 06 · Interaktivní cvičení a cvičení s AI

## Přehled komponent

Všechny jsou v `src/components/edu/aifb/interactive/`, rozcestník `PupilLayerView` (`pupil-layer.tsx`) vybere komponentu podle konfigurace. Vyhodnocení je v čistých funkcích `src/lib/edu/aifb/interactive-logic.ts` (testované). Nic se neukládá ani neodesílá, kromě `AiSandbox`.

| Komponenta | Co dělá | Konfigurace |
|---|---|---|
| `QuizCard` | jedna otázka na obrazovce, možnosti jako velké dlaždice; odpověď se hodnotí hned po výběru (správná ukáže vysvětlení a „Další“, chybnou lze zkusit znovu) | `questions: [{ id, prompt, emoji?, options: [{ id, text, emoji? }], correct, explanation }]` |
| `CardSort` | třídění bez tahání myší: aktuální karta je velká uprostřed, hromádky jsou velká tlačítka; s `expected` se špatná hromádka hned ohlásí a karta zůstane, bez `expected` se nehodnotí a kartu lze vrátit | `piles`, `cards` (oboje s volitelným `emoji`), volitelně `expected` (karta → hromádka) a `hint` |
| `TrafficLightCards` | jedna situace na obrazovce se semaforem, dvě velká tlačítka; správná odpověď ukáže vysvětlení a „Další“ | `situations: [{ id, text, emoji?, answer?, feedback? }]`, volitelně `labels: { green, red }` (výchozí „můžu říct“ / „tajemství“) |
| `PromptBuilder` | skládačka zadání: v každé části (role, úkol, podoba…) se vybírá kartička, zadání se průběžně skládá do „zprávy“; po odeslání se u každé části ukáže, jestli pomohla a proč | `goal`, `success`, `slots: [{ id, label, why, options: [{ id, text, good? }] }]` |
| `TextDetective` | detektiv v textu: text je rozdělený na klikací úseky, žák hledá chyby (`errors`), varovné znaky (`signals`) nebo osobní údaje (`redact`: po kliknutí se nahradí bezpečným slovem); text může mít rámec zprávy, e-mailu nebo webu | `mode`, `frame?`, `header?: { from?, subject? }`, `segments: [{ id, text, target?, replacement?, explanation? }]` |
| `NextWord` | hra na jazykový model: žák tipuje další slovo a pak vidí sloupce s tím, jak pravděpodobná slova by volil model; nehodnotí se pravda, jen shoda | `rounds: [{ id, start, options: [{ word, percent }], note }]` (procenta jsou ilustrační) |
| `ScaleLine` | přímka mezi dvěma póly; žák umístí situaci, mimo správné rozmezí dostane nápovědu směru | `left`, `right`, `steps?` (3–7, výchozí 5), `items: [{ id, text, emoji?, min, max, feedback }]` |
| `ChatSim` | předem napsaný rozhovor v bublinách (chatbot, kamarád, agent, podvodník); žák vybírá reakci, rozumná posune rozhovor dál, u nerozumné se ukáže proč | `persona: { name, emoji }`, `steps: [{ id, message, choices: [{ id, text, good?, feedback, reply? }] }]` |
| `PairMatch` (komponenta `PairGames`) | stejné dvojice v pěti šablonách jako ve Wordwallu: spojovačka, kvíz, pexeso, pravda/lež, kartičky; žák si hru přepíná | `pairs: [{ id, left, right, emoji? }]`, volitelně `template` |
| `PromptLab` | krátká kola, ve kterých žák píše zadání pro AI přímo v aplikaci; AI odpoví (živě, jinak uložená ukázka) a aplikace hned odškrtne splněné podmínky | `rounds: [{ id, scenario, goal, promptChecks, answerChecks? }]` + serverová část `server.rounds` |
| `AiSandbox` | cvičení s jazykovým modelem přes server | `mode: "prompt-rescue"` (`vaguePrompts`) nebo `"fact-check"` (`topicLabel`) |

### Herní podoba (listopad 2026)

Cvičení jsou navržená tak, aby bavila děti a šla ovládat na tabletu i na interaktivní tabuli:

- **Mise:** volitelné pole `theme: { emoji, title }` u vrstvy vykreslí tematickou hlavičku (na 1. stupni podle ostrova na pirátské mapě).
- **Postup:** tečky nad kartou ukazují hotové, aktuální a zbývající kroky; vždy je vidět jen jeden krok.
- **Obrázky:** volitelné `emoji` u otázek, možností, karet, hromádek a situací. Je jen ozdobné (`aria-hidden`), význam nese text.
- **Odezva hned:** správná odpověď zezelená s ✓ a ukáže vysvětlení, chybná se označí ✗ a karta se zatřese; dítě zkouší dál, dokud neodpoví správně.
- **Hvězdičky:** závěrečná karta ukáže 1–3 hvězdičky podle odpovědí napoprvé (`starsFor` v `interactive-logic.ts`: 3 = vše, 2 = aspoň 60 %, 1 = dokončeno), konfety a „Hrát znovu“.
- Společné prvky jsou v `interactive/game-ui.tsx`, styly v `aifb.css` (třídy `aifb-game*`, `aifb-tile`, `aifb-mission`). Animace běží jen bez `prefers-reduced-motion`.

Přístupnost: ovládání klávesnicí, přepínače v `fieldset` s `legend`, stav vždy i textem (ne jen barvou), tlačítka aspoň 44 px vysoká, výsledky v `role="status"`.

Kontrola konfigurace: `validatePupilLayer` v `src/lib/edu/aifb/pupil.ts` (min. 2 hromádky / karty / situace, unikátní id, správná odpověď mezi možnostmi, vysvětlení, platné popisky). Volá ji `npm run validate:aifb` pro pilotní cvičení i pro online kurz.

## Kde se cvičení zobrazují

- **Pilotní cvičení AIFB** (`pupil-pilots.json`): sekce „Vyzkoušej si“ u lekce nebo teorie. Ve stavu `draft` jen ve vývoji a náhledu, s upozorněním „Návrh ke schválení“.
- **Online kurz** (`aifb-kurz.json`, pole `activity` u lekce): sekce „Vyzkoušej si“ v lekci. Viditelnost se řídí stavem celého kurzu.
- **Knihovna komponent** `/edu/ai-gramotnost/aifb/ukazky`: všechny pilotní komponenty na jedné stránce (jen vývoj a náhled, `noindex`).

## Trénink zadání s AI (`PromptLab`)

Styl Umíme to: série 4 krátkých kol, žádné odevzdávání učiteli. V každém kole žák vidí situaci a cíl („odpověď o nejvýše třech větách“), napíše zadání a klikne na „Zeptej se AI“. Aplikace hned:

- ukáže odpověď (živou, jinak uloženou ukázku),
- odškrtne podmínky na **zadání** (regulární výrazy bez ohledu na diakritiku a velikost písmen: řekl, pro koho to je? omezil délku? dal ukázky?),
- odškrtne podmínky na **odpověď** (počet slov, vět, odrážek, tabulka, JSON); u uložené ukázky se nehodnotí, protože nereaguje na zadání žáka,
- dá 3 hvězdičky napoprvé, 2 na druhý pokus, jinak 1; po druhém neúspěchu lze kolo přeskočit a vrátí se na konec série; série napoprvé správných kol se počítá jako „oheň“.

Podmínky a kola jsou v `pupil-pilots.json` (`config.rounds`), vyhodnocení v `prompt-lab.ts` (testované). Systémový prompt, uložená odpověď a limit slov každého kola jsou v `server.rounds` a **klientovi se neposílají** (`publicLayer`). Endpoint dostane `{ lessonId, roundId, prompt }` a vezme prompt kola ze serveru; 1. stupeň (`zs1-`) odmítá vždy (R1). Platí stejná ochrana jako u `AiSandbox` níže (osobní údaje, limity, uložená odpověď bez klíče). Je 22 vrstev (11 pro 2. stupeň, 11 pro SŠ): první otázky (`*-level-1-cv1`), záchranář zadání, ukázkové příklady a podoba odpovědi (`*-level-2-cv1/2/4`), zadání bez osobních údajů (`*-level-3-cv2`), AI jako doučování (`*-level-4-cv4`), poctivé použití (`*-level-5-cv5`), `zs2-level-6-cv5` a `ss-level-6-cv2`, a společná cvičení pro zájemce: JSON na povel (`*-level-7-cv4`), kód na zakázku (`*-level-8-cv1`) a návrh systémového zadání (`*-level-9-cv1`, kde AI místo plnění zadání hodnotí, co v něm chybí). Všechny jsou ve stavu `draft`, dokud je vlastník nezkusí s reálným modelem.

U lekcí s hrou se žákovi **neukazuje projektové zadání** (výstup, forma) určené učiteli; učitel a admin ho mají sbalené pod „Zadání pro učitele“.

## Cvičení s AI (`AiSandbox`)

Zbývají dvě (kontrola faktů) a jsou návrh; „záchranář zadání“ nahradil `PromptLab`:

| Lekce | Režim | Co žák dělá |
|---|---|---|
| `zs2-level-1-cv2`, `ss-level-1-cv2` | `fact-check` | dostane text o Karlu IV. a hledá v něm chyby (uložená ukázka má dvě záměrné chyby: rok 1857 místo 1357 a vymyšlená kronika) |

### Tok požadavku

1. Prohlížeč pošle `POST /edu/api/aifb/complete` s `{ lessonId, prompt }`. Nic jiného (žádné prompty, klíč ani identita).
2. Server (`route.ts`) odmítne požadavek z cizí domény (403), tělo větší než 4 kB (413) a neplatný JSON (400).
3. `completeLesson` (`ai-service.ts`) pustí jen lekci, která je v `AI_LESSONS` a jejíž vrstva je `AiSandbox` a schválená (`aiLessonAvailable`); návrh jen ve vývoji / náhledu. Jinak 404. Na produkci tak endpoint vrací 404, dokud vlastník vrstvu neschválí. 1. stupeň v `AI_LESSONS` žádnou lekci nemá (R1).
4. U `prompt-rescue` píše zadání žák: musí mít 3–800 znaků (jinak 400) a nesmí obsahovat osobní údaje (`pii.ts`: e-mail, rodné číslo, telefon, webová adresa → 422 s druhem údaje). Kontroluje klient (okamžitě) i server (vždy). U `fact-check` je zadání pevné na serveru.
5. Bez nastaveného klíče se model nevolá a vrátí se **uložená odpověď** (`fallback`, u fact-checku i seznam záměrných chyb pro učitele).
6. S klíčem: limit na IP 20 dotazů za 10 minut (při překročení 429), potom globální strop 300 živých dotazů za hodinu. Po vyčerpání stropu nebo při nedostupném úložišti limitů se vrátí uložená odpověď.
7. Model dostane systémový prompt z `ai-config.ts` (omezení délky 200 / 120 slov, text žáka je jen data, žádné osobní údaje). Odpověď se ořízne na limit slov. Při chybě služby se vrátí uložená odpověď.
8. Obsah zadání ani odpovědi se neukládá. Odpověď má `Cache-Control: no-store`. Odpověď říká, jestli je živá (`live`), nebo uložená (`stored`).

### Nastavení modelu (proměnné prostředí, jen server)

| Proměnná | Výchozí | Význam |
|---|---|---|
| `AIFB_AI_API_KEY` (nebo `EDU_AI_API_KEY`) | – | klíč; bez něj se model nevolá |
| `AIFB_AI_API_URL` (nebo `EDU_AI_API_URL`) | OpenAI-kompatibilní endpoint chat completions | adresa služby |
| `AIFB_AI_MODEL` (nebo `EDU_AI_MODEL`) | `gpt-4o-mini` | model |

### Vlastní model na AWS

Server volá libovolný endpoint ve formátu OpenAI chat completions, takže model může běžet na vlastním serveru v AWS a žákovská zadání pak neodcházejí třetí straně. Dvě běžné cesty:

- **EC2 s GPU a otevřeným modelem** (vLLM, Ollama nebo llama.cpp server; všechny nabízejí cestu `/v1/chat/completions`): `AIFB_AI_API_URL=https://<adresa>/v1/chat/completions`, `AIFB_AI_MODEL=<název modelu na serveru>`, `AIFB_AI_API_KEY=<klíč, který server vyžaduje>`.
- **Amazon Bedrock**, pokud pro zvolený model nabízí OpenAI-kompatibilní endpoint (ověřit v aktuální dokumentaci AWS); nastavení jsou stejné tři proměnné.

Server musí být dostupný jen přes HTTPS a chráněný klíčem (bez klíče se model nevolá vůbec a vrací se uložená odpověď). Limity dotazů, kontrola osobních údajů a ořez délky zůstávají na straně aplikace a platí pro jakýkoli model. Před nasazením je potřeba ověřit, že zvolený model umí dobře česky a drží se systémového promptu; uložené odpovědi slouží jako záloha při výpadku. Pravidlo R1 platí dál: 1. stupeň cvičení s AI nemá.

Poskytovatel se mění jen na jednom místě (`callProvider` v `ai-service.ts`). Rozhraní nikde neukazuje značku modelu (R8).

### Režim učitele a souhlas zákonných zástupců

Na **2. stupni** je výchozí **režim učitele**: zadání zapisuje učitel na sdílené obrazovce a žáci do AI nepíšou. Na SŠ je samostatný režim zapnutý hned. Na 2. stupni ho zapne učitel až po potvrzení, že škola získala souhlas zákonných zástupců a postup ověřila s pověřencem pro ochranu údajů (R5). Je to jen ovládací prvek v rozhraní: bez účtů učitelů ho server ověřit neumí. Skutečné vynucení by vyžadovalo účty, což je rozhodnutí vlastníka.
