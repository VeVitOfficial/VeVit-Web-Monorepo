# Fáze 2: rendering a cache

## Co se změnilo

### Locale jako segment cesty (home, tools, edu)

`src/proxy.ts` přepisuje veřejné URL na interní cesty se segmentem jazyka. Veřejné URL se nemění.

| Veřejná URL | Dřív interně | Teď interně |
|---|---|---|
| `/cs/home` | `/home` + hlavička | `/home/cs` |
| `/cs/tools/pdf-merge` | `/tools/pdf-merge` + hlavička | `/tools/cs/pdf-merge` |
| `/cs/edu/...` | `/edu/...` + hlavička | `/edu/cs/...` |

- Stránky čtou locale z `params` místo `headers()`, takže je Next může generovat staticky.
- Hlavička `x-vv-locale` se dál posílá, kvůli account, services a `not-found.tsx` (ten params nedostává).
- Layouty `home/[locale]`, `tools/[locale]` a `edu/[locale]` mají `generateStaticParams` (7 jazyků) a neplatný jazyk vrací 404.
- Interní cesty (`/tools/cs/...`) zvenku dostupné nejsou: proxy je přesměruje na `/cs/tools/cs/...`, což je 404.

### Co je teď statické

| Stránky | Před | Po |
|---|---|---|
| home, support, soon (7 jazyků) | ƒ | ● SSG |
| tools hub, podmínky (7 jazyků) | ƒ | ● SSG |
| 104 nástrojů × 7 jazyků | ƒ | ● SSG |
| edu home, dashboard, programování, chemie, historie, tvorba lekce | ƒ | ● SSG |
| edu kurzy (22 × 7) a lekce (346 × 7) | ƒ | ● SSG, `dynamicParams = false` (neznámé = 404, nezakládá položky v cache) |
| store home | ƒ | ○ ISR 5 min |
| store detail produktu | ƒ | ● ISR 5 min, generuje se při první návštěvě |

`next build` teď generuje 4048 stránek (dřív 78) za cca 34 s.

Podrobnosti úprav:

- **Tools hub:** filtry z URL (`?q=`, `?cat=`…) čte až klient po hydrataci (`hub-app.tsx`), server je nepotřebuje.
- **Edu home:** tlačítko „VeVit Edu pro školy“ zjišťuje členství na klientu přes nový `GET /edu/api/school/entry` (dřív `schoolEntry()` na serveru, a tím dynamická stránka).
- **Store:** `lib/store-data.ts` už měl `fetch` s `revalidate: 300` a tagy `store:<tabulka>`. Stránky to přebíjelo `connection()` z Vercel migrace, kde důvod není zdokumentovaný.
  - `connection()` jsem odstranil a přidal `export const revalidate = 300`.
  - Ceny ani sklad z cache se do objednávky nedostanou. `create-checkout` klientské ceny ignoruje a snapshot počítá na serveru.

### Co zůstává dynamické a proč

| Část | Důvod |
|---|---|
| Account | auth, session, platby |
| AIFB (`edu/ai-gramotnost/*`) | Viz níže. **Čekám na tvoje rozhodnutí.** |
| edu school, skoly, hledat, `lekce/moje/detail` | session nebo `searchParams` |
| Services | Layout čte session (počet nepřečtených zpráv v hlavičce). Home volá při renderu `expireRequests()`, tedy zápis do DB, který by ISR změnil na „jednou za interval“. Seznamy používají `searchParams`. |
| Store catalog (`searchParams`) a uživatelské stránky store (objednávky, reklamace…) | Catalog čte data z fetch cache (5 min). Uživatelské stránky pracují s daty konkrétního uživatele. |

**AIFB:** v plánu jsem psal, že AIFB čte jen progres. To nebyla celá pravda. `prepareAifb()` určuje:

- **roli** (veřejnost / žák / učitel / admin), podle ní se **gatuje přístup** (`gateCategory` → `redirect` / `notFound`),
- **odemčené lekce žáka**,
- **návrhovou verzi kurzu** jen pro admina,
- **živé úpravy obsahu** z DB (`refreshContentEdits`).

Je to tedy řízení přístupu, ne progres, a proto jsem AIFB nechal dynamické.

### Paralelizace

Prošel jsem všechny serverové stránky a layouty. Řetězce `await` jsou jen tam, kde na sobě dotazy závisí (claim/return: objednávka → identita → detail). Výsledky store home a produktu už jely přes `Promise.all`.

### Oprava regrese z Fáze 1

`loading.tsx` nad stránkou, která volá `notFound()` / `redirect()`, posílá stavový kód 200 dřív, než se o 404/redirectu rozhodne. Server-side redirect se tak změní na klientský a 404 na soft-404 se statusem 200.

- Ověřeno: `/cs/services/poptavka/<neexistující>` vracel 200 místo 404, AIFB redirect 200 místo 307.
- Odstranil jsem `services/loading.tsx` a `edu/ai-gramotnost/loading.tsx`.
- Skeleton účtu jsem přesunul do jednotlivých sekcí. Admin, který volá `notFound()`, ho nemá.
- Statusy jsou teď stejné jako v baseline.

## Ověření

- `typecheck` ✓, `lint` ✓ (0 errors, varování jen v kódu, kterého jsem se nedotkl), `build` ✓, `test:unit` 281/281 ✓
- `test:e2e:aifb`: výsledek **identický s baseline** (commit `067bbbe` jsem buildnul ve worktree a pustil proti němu stejný test). Baseline sama v tomto testu 19 z 26 testů neprojde, s touto prací to nesouvisí.
- Statusy a redirecty (curl): `/` 308 → `/cs/home`, `/tools/pdf-merge` 308 → `/cs/tools/pdf-merge`, neznámý nástroj, kurz i lekce 404, AIFB 307 → kurz, `/cs/edu/school` 307 → login, `/cs/account/admin` 307 → login.

## Měření

TTFB lokálně (`next start`, medián z 5, teplý server):

| URL | Před | Po |
|---|---:|---:|
| /cs/home | 29 ms | 5 ms |
| /cs/tools | 27 ms | 4 ms |
| /cs/tools/pdf-merge | 9 ms | 3 ms |
| /cs/edu | 7 ms | 3 ms |
| /cs/store | **119 ms** | 3 ms |
| /cs/store/product/… | 23 ms | 3 ms |

Na Vercelu bude rozdíl větší: statické stránky jdou z CDN edge, místo aby se spouštěla funkce ve fra1 a dotazovala Supabase.

Lighthouse (lokálně, medián ze 3):

| URL | Baseline | Fáze 1 | Fáze 2 |
|---|---:|---:|---:|
| /cs/home | 70 | 69 | 73 |
| /cs/tools | 86 | 78 | 86 |
| /cs/tools/pdf-merge | 90 | 90 | 90 |
| /cs/edu | 74 | 73 | 76 |
| /cs/edu/ai-gramotnost/kurz | 90 | 77 | 83 |
| /cs/store | 93 | 85 | 89 |
| /cs/services | 91 | 86 | 86 |
| /cs/account/login | 91 | 95 | 91 |

Lokální Lighthouse přínos statiky skoro neukáže, protože TTFB je na localhostu mizivé u všeho. LCP teď určuje JS (hydratace) a obrázky, a to řeší Fáze 3 a 4. Rozptyl mezi běhy je ±3–5 bodů.

Rozdělení rout: 18 ○ statických, 57 ● SSG/ISR rodin (4048 stránek), 101 ƒ dynamických (z toho většina API).

First-load JS se nezměnil (Fáze 3).

## Známé limity

- `getProducts()` stahuje celý katalog (cca 935 kB JSON / 962 řádků) a Next data cache ukládá jen položky do 2 MB. Zhruba nad 2000 produkty se katalog přestane cachovat a ISR se tiše změní na čtení při každé revalidaci. Pak je potřeba stránkovat nebo zúžit `select`.
- Úpravy katalogu se na webu projeví nejpozději do 5 min. Okamžitě to jde přes `revalidateTag("store:store_products")` v admin API, které zatím neexistuje.
