# 06 · Interaktivní cvičení a cvičení s AI

## Přehled komponent

Všechny jsou v `src/components/edu/aifb/interactive/`, rozcestník `PupilLayerView` (`pupil-layer.tsx`) vybere komponentu podle konfigurace. Vyhodnocení je v čistých funkcích `src/lib/edu/aifb/interactive-logic.ts` (testované). Nic se neukládá ani neodesílá, kromě `AiSandbox`.

| Komponenta | Co dělá | Konfigurace |
|---|---|---|
| `QuizCard` | otázky s jednou správnou odpovědí; po „Zkontrolovat“ ukáže „Správně“ / „Zatím ne“ a vysvětlení; na konci skóre a „Začít znovu“ | `questions: [{ id, prompt, options: [{ id, text }], correct, explanation }]` |
| `CardSort` | třídění karet do hromádek bez tahání myší (každá karta má tlačítka „Dát do hromádky: …“); upozorní na špatně zařazené | `piles`, `cards`, volitelně `expected` (karta → hromádka) a `hint` |
| `TrafficLightCards` | u každé situace zelená / červená, hned zpětná vazba, na konci skóre | `situations: [{ id, text, answer?, feedback? }]`, volitelně `labels: { green, red }` (výchozí „můžu říct“ / „tajemství“) |
| `AiSandbox` | cvičení s jazykovým modelem přes server | `mode: "prompt-rescue"` (`vaguePrompts`) nebo `"fact-check"` (`topicLabel`) |

Přístupnost: ovládání klávesnicí, přepínače v `fieldset` s `legend`, stav vždy i textem (ne jen barvou), tlačítka aspoň 44 px vysoká, výsledky v `role="status"`.

Kontrola konfigurace: `validatePupilLayer` v `src/lib/edu/aifb/pupil.ts` (min. 2 hromádky / karty / situace, unikátní id, správná odpověď mezi možnostmi, vysvětlení, platné popisky). Volá ji `npm run validate:aifb` pro pilotní cvičení i pro online kurz.

## Kde se cvičení zobrazují

- **Pilotní cvičení AIFB** (`pupil-pilots.json`): sekce „Vyzkoušej si“ u lekce nebo teorie. Ve stavu `draft` jen ve vývoji a náhledu, s upozorněním „Návrh ke schválení“.
- **Online kurz** (`aifb-kurz.json`, pole `activity` u lekce): sekce „Vyzkoušej si“ v lekci. Viditelnost se řídí stavem celého kurzu.
- **Knihovna komponent** `/edu/ai-gramotnost/aifb/ukazky`: všechny pilotní komponenty na jedné stránce (jen vývoj a náhled, `noindex`).

## Cvičení s AI (`AiSandbox`)

Jsou jen čtyři a všechna jsou návrh:

| Lekce | Režim | Co žák dělá |
|---|---|---|
| `zs2-level-2-cv1`, `ss-level-2-cv1` | `prompt-rescue` | dostane vágní zadání („napiš něco o ekologii“), přepíše ho podle receptu a porovná odpovědi |
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

Poskytovatel se mění jen na jednom místě (`callProvider` v `ai-service.ts`). Rozhraní nikde neukazuje značku modelu (R8).

### Režim učitele a souhlas zákonných zástupců

Na **2. stupni** je výchozí **režim učitele**: zadání zapisuje učitel na sdílené obrazovce a žáci do AI nepíšou. Na SŠ je samostatný režim zapnutý hned. Na 2. stupni ho zapne učitel až po potvrzení, že škola získala souhlas zákonných zástupců a postup ověřila s pověřencem pro ochranu údajů (R5). Je to jen ovládací prvek v rozhraní: bez účtů učitelů ho server ověřit neumí. Skutečné vynucení by vyžadovalo účty, což je rozhodnutí vlastníka.
