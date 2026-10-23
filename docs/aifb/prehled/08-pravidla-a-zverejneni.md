# 08 · Pravidla a co se zobrazuje na produkci

## Pravidla R1–R9 (z plánu)

| # | Pravidlo | Jak je zajištěno |
|---|---|---|
| R1 | Žáci 1. stupně do AI nepíšou | 1. stupeň nemá v `ai-config.ts` žádnou AI lekci (endpoint vrátí 404); `LessonView` u 1. stupně `AiSandbox` nikdy nezobrazí |
| R2 | Před odesláním do AI kontrola osobních údajů | `pii.ts` v prohlížeči i na serveru (422 s druhem údaje) |
| R3 | Žádná analytika třetích stran ani externí písma a CDN | `AnalyticsGate` vynechává `/edu/ai-gramotnost` i po klientské navigaci; písma a skripty z vlastní domény; E2E test „soukromí“ hlídá, že požadavky nejdou jinam |
| R4 | Žádné sliby certifikace | Štítek vždy „Připravuje se“; validace shodí obsah s jiným stavem certifikace než `planned`; návrh v `F9-CERTIFIKACE-NAVRH.md` |
| R5 | AI pod 13 let jen s učitelem, souhlas zákonných zástupců | 2. stupeň: režim učitele, samostatný režim až po potvrzení souhlasu; online kurz bez AI cvičení |
| R6 | Obsahové soubory z plánu se nemění | Nový obsah ve vlastních souborech (`aifb-theory.json`, `aifb-kurz.json`, `pupil-pilots.json`) |
| R7 | Text pro žáky je návrh, dokud ho vlastník neschválí | Stavy `draft` / `reviewed` / `published`; návrhy se na produkci nezobrazují (viz níž) |
| R8 | Rozhraní neutrální vůči dodavateli AI | Rozhraní ani odpovědi neukazují značku modelu; poskytovatel se mění v jednom místě přes proměnné prostředí |
| R9 | Přístupnost (WCAG 2.2 AA) | Klávesnice, kontrast, stav textem, `prefers-reduced-motion`, seznamové varianty map, Lighthouse 100 (viz `QA.md`) |

Další pravidla vlastníka: barvy jen z existujících tokenů, texty rozhraní jen v `aifb.*` (i18n), bez nových závislostí, nic s přihlašováním, platbami ani produkčními daty bez výslovného pokynu.

## Stavy textu

| Stav | Význam |
|---|---|
| `todo` | text ještě neexistuje (pole `pupil` v plánu) |
| `draft` | návrh, čeká na kontrolu vlastníkem |
| `reviewed` | vlastník schválil |
| `published` | schváleno a zveřejněno |

## Co se kde zobrazuje

„Náhled“ = `draftPreviewEnabled()` je pravda, tedy platí aspoň jedno:

- lokální `next dev` (`NODE_ENV=development`),
- náhledové nasazení na Vercelu (`VERCEL_ENV=preview`),
- proměnná `AIFB_PREVIEW_DRAFTS=1`.

| Obsah | Stav teď | Vývoj a náhled | Produkce |
|---|---|---|---|
| Lekce, levely, průvodci z plánu | originál | ano | ano |
| Teorie (`aifb-theory.json`) | `draft` | ano, s poznámkou „čeká na odbornou kontrolu“ | **ano**, se stejnou poznámkou |
| Pilotní cvičení (`pupil-pilots.json`) | `draft` | ano, s upozorněním „Návrh ke schválení“ | **ne** |
| Cvičení s AI | `draft` | ano (bez klíče jen uložené odpovědi) | **ne**, endpoint vrací 404 |
| Online kurz (`aifb-kurz.json`) | `draft` | ano, s poznámkou | **ne**, trasy vrací 404, karta „Připravuje se“ |
| Knihovna komponent `/aifb/ukazky` | – | ano | ne (404) |

Teorie se na produkci ukazuje, protože je to výklad pro třídu, kterou vede učitel. Online kurz a pilotní cvičení jsou texty přímo pro děti bez učitele, proto zůstávají skryté do schválení.

Pozor: lokální `.env.local` stažený z produkce obsahuje `VERCEL_ENV="production"`; náhled lokálně funguje díky `NODE_ENV=development`. Produkční build (`npm run build && npm start`) návrhy neukáže, pokud není nastavené `AIFB_PREVIEW_DRAFTS=1`.

## Proměnné prostředí

| Proměnná | Účel |
|---|---|
| `AIFB_PREVIEW_DRAFTS=1` | ukáže návrhy i v produkčním běhu (např. pro kontrolu na vlastní doméně) |
| `AIFB_AI_API_KEY` / `EDU_AI_API_KEY` | klíč k modelu pro AI cvičení |
| `AIFB_AI_API_URL` / `EDU_AI_API_URL` | adresa služby (OpenAI-kompatibilní) |
| `AIFB_AI_MODEL` / `EDU_AI_MODEL` | model (výchozí `gpt-4o-mini`) |

Limity AI cvičení používají stejné úložiště jako limity nástrojů VeVit (`toolsRateLimit`).

## Vyhledávače

Tiskové stránky a knihovna komponent mají `noindex`. Ostatní stránky se indexovat mohou.
