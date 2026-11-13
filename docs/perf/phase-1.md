# Fáze 1: skeletony a streaming

## Co se změnilo

- `src/components/ui/skeleton.tsx` obsahuje primitivy `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonGrid` a `SkeletonRegion`, styly jsou v `globals.css` (`.sk-*`).
  - Barvu berou z `currentColor`, takže samy sedí na světlé i tmavé téma každé sekce (data-theme i systém).
  - Shimmer je jen v CSS a vypíná se při `prefers-reduced-motion`.
- Skeletony podle skutečného layoutu (stejné obalové třídy jako stránky):
  - `components/edu/skeletons.tsx`
  - `components/store/skeletons.tsx`
  - `components/services/skeletons.tsx`
- `loading.tsx` přibyl v těchto segmentech:
  - tools: hub, `[tool]`
  - edu: home, dashboard, programování, `kurzy/[slug]`, `lekce/[id]`, `ai-gramotnost`
  - store: home, catalog, `product/[slug]`
  - services: home, poptávky, poskytovatelé, ostatní stránky
  - account dashboard
- Domovské stránky sekcí jsem přesunul do route groups `(home)` / `(hub)`. Bez toho by jejich `loading.tsx` „protékal“ do všech podstránek sekce (třeba skeleton store home u objednávek). URL se nemění.
- `error.tsx` je v tools, edu, store, services, home a account dashboardu. Sdílená komponenta `components/ui/error-view.tsx` bere jazyk z URL a nabízí tlačítka „Zkusit znovu“ (`retry()`, Next 16) a „Na úvod“.
- Klientské načítání:
  - Edu home už nečeká s celou stránkou na `index.json`. Hero, kategorie a „nově přidané“ se vykreslí hned.
  - Programování má skeleton mřížky a resume panelu.
  - Kurz, lekce a vlastní lekce mají skeleton místo „Načítám…“.
  - Office stránky mají skeleton místo textu.
  - Progress labely nástrojů („Načítám PDF…“ během zpracování) jsem nechal. Nejde o načítání stránky, ale o stav akce uživatele.

## Měření (lokálně, Lighthouse mobile, medián ze 3 běhů)

| URL | Perf před → po | LCP s před → po | CLS před → po |
|---|---|---|---|
| /cs/home | 70 → 69 | 4.2 → 4.1 | 0.003 → 0.003 |
| /cs/tools | 86 → 78 | 3.0 → 3.7 | 0.001 → 0.004 |
| /cs/tools/pdf-merge | 90 → 90 | 3.2 → 3.2 | 0.004 → 0.005 |
| /cs/edu | 74 → 73 | 5.6 → 5.6 | 0.001 → 0.000 |
| /cs/edu/ai-gramotnost/kurz | 90 → 77 | 3.2 → 4.4 | 0 → 0 |
| /cs/store | 93 → 85 | 3.1 → 4.1 | 0 → 0 |
| /cs/services | 91 → 86 | 3.2 → 3.9 | 0 → 0.002 |
| /cs/account/login | 91 → 95 | 3.2 → 2.6 | 0 → 0.024 |

First-load JS se nezměnil (±1 kB, skeleton primitivy). Statických rout je pořád 17.

### Proč jsou některá čísla horší

Tools hub, store home, AIFB a services jsou zatím **dynamické**. Díky `loading.tsx` se u nich nejdřív pošle skeleton a obsah doteče streamem.

- Pro uživatele je to lepší: na pomalém serveru nebo Supabase hned vidí layout místo bílé stránky.
- Lokálně ale server odpovídá okamžitě, takže Lighthouse naměří jen režii streamingu (LCP prvek doteče o něco později).
- Fáze 2 tyto stránky udělá statické / ISR. Pak se HTML pošle celé hned a skeleton se ukáže jen při klientské navigaci na necachovaná data.

Edu LCP je teď maskot (`maskot-v1.webp` 860×1290, na mobilu zobrazený 138×208). Řeší se ve Fázi 4 (`next/image` se `sizes`).

Při prvním měření měl services CLS 0,077: skeleton byl nižší než stránka a patička poskočila. Opraveno `min-height: 100vh` u skeletonů sekcí s patičkou.
