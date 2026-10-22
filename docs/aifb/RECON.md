# AIFB – průzkum repozitáře (Fáze 0)

Datum: 2026-10-21. Zdroj zadání: `docs/superpowers/plans/AI_gramotnost/aifb-claude-code-plan.json`.
Stav: pouze čtení. Nic nebylo implementováno ani změněno mimo tento soubor.
Pravidlo plánu: při rozporu vyhrává repozitář.

## 1. Souhrn

- Edu je Next.js 16 App Router, trasy s jazykovým prefixem řeší `src/proxy.ts`. Router není hashový.
- `/edu/ai-gramotnost` **už existuje** jako přehled stávajícího kurzu. Plánovaný hub na stejné URL koliduje (Q1).
- Obsah AIFB je platný: všechny 3 soubory projdou schématem, 96 lekcí, 16 levelů, id jsou unikátní, všech 6 odkazů „kapitola/oddíl" se překládá.
- Žádná třída, žádné pseudonymní účty, žádné API pro zápis XP z klienta. Rozhodnutí z Edu for Schools v kódu **neexistuje**.
- Globální `@vercel/analytics` a `@vercel/speed-insights` běží i na `/edu`. To je v rozporu s R3.
- CI nespouští unit testy a Playwright v repozitáři není.

## 2. Framework a nasazení

| Věc | Nález |
|---|---|
| Framework | Next.js 16.3.2, App Router, React 19.2, TypeScript 6, Tailwind 3.4 (statický build `npm run build:tailwind`) |
| Běh | Vercel, Node.js runtime, region `fra1`, `vercel.json` |
| Data/účty | Supabase (PostgREST + přímé DB), vlastní session cookie `__Host-vvsession` |
| Pravidlo repa | `AGENTS.md`: před kódem číst `node_modules/next/dist/docs/` (existuje). Pro F2 nutné přečíst (params jsou Promise, `connection()`, `proxy.ts`). |
| Skripty | `dev`, `build`, `lint` (`eslint src next.config.ts`), `typecheck`, `test` (= pouze `tests/sandbox-runner-test.js`), `test:unit` (`node --test tests/unit/`), `test:browser`, `secret-scan` |
| Git | Aktuální větev `feat/platebni-brana` (platební práce). Lokálně `master`, `feat/edu-v2`. Remote `VEDRY32` má `master` i `main`. Složka `docs/superpowers/plans/AI_gramotnost/` je neverzovaná. |

## 3. Router a trasy

- Veřejné URL: `/<locale>/edu/...`. `src/proxy.ts` přepíše na `/edu/...` a předá locale v hlavičce `x-vv-locale`. Locale: `cs, en, de, es, uk, fr, sk`; bez prefixu 308 na `/cs/...`.
- Stránky jsou serverové (`await connection()` + `readEduLocale()` z `src/lib/edu/locale.ts`) a vykreslují klientský shell `EduRoot`.
- Edu větev v proxy je obecná (`/edu/<suffix>`), takže nové podstránky `aifb/...` nevyžadují změnu proxy.
- `publicFile` regex v proxy obsahuje `pdf`, ale **ne `docx`**. Soubory ke stažení dávat pod `/assets/...` (proxy je vrací dřív) nebo regex rozšířit. `/assets/*` má `Cache-Control: immutable, 1 rok`, proto verzovat názvy souborů.

Stávající trasy AI gramotnosti (`src/app/edu/ai-gramotnost/`):

| Trasa | Obsah |
|---|---|
| `/` | `AiGramDashboard` – přehled kurzu, postup, **obsahuje `useLegacyHashRedirect`** (`#lesson/<slug>` → `/lekce/<slug>`, `#milestone/…`, `#course`, `#profile`) |
| `/kurz` | Úvody kapitol a osnova kurzu |
| `/lekce/[slug]` | Lekce kurzu (34 lekcí, 6 kapitol) |
| `/milnik/[milestone]` | Milníky (final-6) |
| `/profil` | Lokální postup, level, achievementy |
| `/certificate.php` | Reálný certifikát stávajícího kurzu (nesahat) |

Rozpory s plánem:
- Plán: odkazy `#lesson/…` „musí fungovat dál". Skutečnost: fungují přes redirect v dashboardu na kořeni. Pokud hub nahradí kořen, redirect musí zůstat na kořeni.
- Katalog uvádí kartu „Online kurz" na `/edu/ai-gramotnost/kurz`. To je dnes jen osnova, ne dashboard s postupem.
- Plán používá trasy bez locale prefixu. Všechny odkazy musí nést `/${locale}`; stávající kód to dělá přes `path()` v `AiGramShell`.
- Plán v `idRules` říká „v URL jsou id jako `zs1-blok-a-cv3`", ale `aifb-catalog.json` má krátké segmenty (`/zs1/blok-a`, `/zs2/level-1`). Nutné rozhodnout (Q6).
- Plánovaná `/aifb/ucitele/:category` se potkává s `/aifb/:category/:level`. Static segment vyhrává, ale čistší je `/aifb/:category/pro-ucitele`.

## 4. Designový systém

Jsou tři vrstvy, žádný jednotný zdroj tokenů:

1. **Edu globální** (`src/styles/edu.css`): proměnné `--color-*` na třídách `.dark` / `.light` na `<html>`. Dark: pozadí `#0a0a0f`, accent `#8b5cf6` (fialová). Light: pozadí `#f8fafc`, accent `#10b981`.
2. **AI gramotnost scoped** (`src/styles/ai-gramotnost.css`, kořen `.aigram`): `--bg-primary #0A0A0F`, `--primary #10B981`, `--radius-*`, `--shadow-glow`, `--font: Geist`. Světlé přepsání `html.light .aigram`. Hotové třídy: `.btn*`, `.card`, `.hero`, `.stat-box`, `.chapter`, `.lesson-row`, `.progress-mini`, `.tag`, `.grid-2`, `.fade-in`.
3. **Tailwind config / Store** (`tailwind.config.js` barvy `primary #4edea3`…, `globals.css` `--vv-*`): jiný systém, používá hlavně Store/Home.

Režim světlý/tmavý:
- `EduThemeProvider`: třída `light|dark` na `<html>`, `localStorage["vevit-theme"]`, bez uložené volby `prefers-color-scheme`, SSR výchozí dark. Přepínač v navbaru. Plán „obě varianty" je tedy splnitelný.

Písma (lokální WOFF2 v `public/assets/fonts`, `vevit-fonts.css`): Geist, Geist Mono, Inter, Sora, Bricolage Grotesque, JetBrains Mono, Material Symbols. Žádné zaoblené písmo mimo Bricolage Grotesque (ten má latin-ext, česky použitelný).

Komponenty a ikony:
- `src/components/edu/ai-gramotnost/*` (`frame`, `shell`, `overview-pages`, `lesson`, `icons`, `progress`…), `src/components/edu/ui.tsx` (toasty), `blocks/icon.tsx`. Lucide lokálně.
- **Komponentová knihovna ani Storybook neexistuje.** Kritérium F6.1 „ukázky v knihovně komponent" nemá cíl.
- `@media print`: v Edu stylech **není** (jen `tools.css`). Tisk se musí napsat nově.
- `prefers-reduced-motion`: v `ai-gramotnost.css` jen pro kvízové prvky. `.aigram-main.fade-in` animuje vždy.
- Meta `theme-color` v kořenovém layoutu **není** (plán ji „pozoroval" z veřejného HTML).

Rozpory s plánem: paleta z dokumentů (teal `#15857A`, oranžová `#FF6A3B`) se nesmí použít a v repu se nevyskytuje. Mapa „noční mořská" i „stezka" se musí odvodit z `.aigram` tokenů.

## 5. i18n

- Vlastní systém: `src/lib/edu/i18n-data.ts` (slovníky 7 jazyků, ploché klíče `nav.aiLiteracy`), `useEduLang().t(key, vars)`. Fallback: aktuální jazyk → `cs` → klíč.
- Plán chce `edu.aifb.*`. V repu jsou klíče bez prefixu `edu.` (`nav.*`, `home.*`). Navrhuji `aifb.*`.
- Stávající stránky AI gramotnosti mají české texty téměř všude **natvrdo** (metadata, lekce, kvízy; `t()` jen ve 2 místech `overview-pages.tsx`). Nová sekce půjde přes `t()` (cs-only, ostatní přes fallback) a ukáže upozornění „obsah je česky".
- Navbar položka `nav.aiLiteracy` existuje ve všech 7 jazycích.

## 6. XP, přihlášení, třídy

XP:
- Server: `src/lib/xp.ts` → `awardXp(userId, source, refKey, amount?)` volá RPC `award_xp` (migrace `supabase/sql/account/016_xp_ledger.sql`). Zdroje jsou pevná unie typů a tabulka `xp_rules`.
- Existující pravidla `edu.lesson_complete` (40 XP) a `edu.course_complete` (300 XP) **nemají žádného volajícího**. XP dnes dává jen `edu.quiz` (`edu/api/quiz/evaluate.php`).
- `GET /account/api/xp.php` je jen čtení. Klient nemá endpoint pro zápis XP.
- Plánovaných 25 / 40 / 60 XP nesedí na pravidla (40 jen u `edu.lesson_complete`, bonus za level neexistuje). Nové zdroje = migrace produkční DB.
- Lokální postup stávajícího kurzu: `localStorage["aigram_progress_v1"]` (`completedLessons: number[]`, `totalXp`, streak, achievementy). Plán chce nový klíč `vevit.edu.aifb.progress.v1`. Souběh není problém.

Přihlášení: Supabase session cookie `__Host-vvsession`, `loadSessionFromCookies()` (`src/lib/account-session.ts`), `/account/login`. Nedotýkal jsem se.

Třídy / pseudonymní účty: v kódu ani SQL **nejsou**. `/edu/skoly` je stránka „připravuje se" s formulářem (e-mail přes Resend, bez ukládání). Předpoklad plánu o Edu for Schools není v repu doložen (Q9).

Tarify: `permissions.ts` zmiňuje Platinum přes organizaci. Detaily neověřeny, nejsou pro MVP potřeba.

## 7. Načítání obsahu stávajícího kurzu (vzor)

- `src/content/ai-gramotnost/{course.json,chapters/,lessons/,schema/}` + `src/content/quiz-private/`.
- `src/lib/edu-quiz-content.ts` (`server-only`) importuje všechny JSON staticky (důvod v komentáři: serverless bundle na Vercelu nepracuje s volnými soubory).
- `src/lib/edu/ai-gramotnost.ts` z toho skládá katalog a posílá klientovi jen nutná pole (bez odpovědí).

Doporučení pro AIFB: stejný vzor. `src/content/aifb/` + `server-only` loader. Obsah AIFB má 252 kB (+ katalog 8,2 kB, limit hubu 20 kB splněn). Hub čte jen katalog, kategorie se importuje dynamicky `import()` při vstupu.

## 8. Ověření obsahu (provedeno)

Spuštěno mimo repo (ajv 8 + ajv-formats v scratchpadu):

| Kontrola | Výsledek |
|---|---|
| `aifb-content-{zs1,zs2,ss}.json` vs `aifb-content.schema.json` | všechny 3 VALID |
| Počty | zs1 4 levely, zs2 6, ss 6 = 16 levelů; 96 lekcí (6 v každém levelu) |
| Duplicitní id | žádné |
| Katalog | 16 level id, 4 karty (zs1 `pirate-map`, zs2 `trail`, ss `clean`, kurz `clean`/`existing`) |
| Odkazy „kapitola N" / „oddíl N.M" | 6 nalezeno, 0 nepřeložitelných |
| `pupil.status` | `todo` u lekcí (R7 v pořádku) |

Poznámky: katalog má u karty `kurz` `totals.levels = 6` a `levels: []` (nesoulad, kosmetický). Ajv 6 v repu je jen tranzitivní od ESLintu a nezná draft 2020-12. `json-schema-to-typescript` není nainstalováno.

## 9. Testy a CI

- `.github/workflows/security.yml` (push, PR; Node 24): `secret-scan`, `typecheck`, `lint`, `npm test`. **`test:unit` se v CI nespouští.**
- Unit testy: `tests/unit/*.test.mjs` (`node:test`, `node:assert/strict`), 15 souborů, převážně Store.
- Browser testy: bash skripty s Chromiem (`tests/*-browser-test.sh`). V repu je jen `playwright-core`, **ne `@playwright/test`**, žádný `playwright.config`.
- `production-smoke.yml`: cron každých 15 min, kontroluje 200 + `Content-Security-Policy-Report-Only` na pěti sekcích.
- Důsledek: F8.2 (Playwright + validace obsahu v CI) vyžaduje nové závislosti a krok v CI.

## 10. Soukromí (R3) a bezpečnostní hlavičky

- `src/app/layout.tsx` → `AnalyticsGate` načítá `@vercel/analytics` + `@vercel/speed-insights` na všech stránkách kromě platebních. **Platí i pro `/edu/ai-gramotnost/aifb/**`.** R3 zakazuje analytiku třetí strany (Q4).
- Fonty jsou lokální (DECISIONS.md). Komentář v `next.config.ts` zmiňuje Google Fonts, ale CSS je lokální. Ověřit sítí ve F8.3.
- CSP je jen `Report-Only` (`script-src 'self' 'unsafe-inline'`…). Žádný nový externí zdroj nebude potřeba.
- Edu načítá lokální vendor skripty (lucide, KaTeX, DOMPurify), `session.js` a `app-switcher.js` (vlastní). Turnstile jen u formulářů.

## 11. AI endpoint (pro F6, jen informace)

- Existuje `src/app/edu/php/ai-proxy.php/route.ts` (chytré hledání Wikipedie): OpenAI-kompatibilní, env `EDU_AI_API_URL`, `EDU_AI_API_KEY`, `EDU_AI_MODEL`, výchozí `api.openai.com` / `gpt-4o-mini`. Poskytovatel je tedy vyměnitelný přes env (R8 server-side OK), ale prompt je pevný, bez PII kontroly a bez per-lekce konfigurace.
- Rate limit a Turnstile existují (`tools-rate-limit.ts`, `turnstile.ts`).
- Plánovaná cesta `POST /api/edu/ai/complete` neodpovídá konvenci repa. Odpovídala by `src/app/edu/api/aifb/complete/route.ts` (veřejně `/<locale>/edu/api/aifb/complete`).
- Do F6 se nic nezakládá.

## 12. Soubory ke stažení (Pro učitele)

Ve složce plánu je pouze `AIFB_plan_cviceni_pro_skoly.docx`. Plán počítá s DOCX i PDF pro `ZS_1_stupen`, `ZS_2_stupen` a `pro_skoly`. **Chybí** 5 souborů (obě ZŠ DOCX a PDF, PDF pro školy). Mapování `pro_skoly` → kategorie `ss` je domněnka (Q8).

## 13. Návrh umístění

| Co | Kam |
|---|---|
| Obsah (beze změny, bajtově shodný) | `src/content/aifb/` (`aifb-catalog.json`, `aifb-content-*.json`, `aifb-content.schema.json`) |
| Kontrola shody s originálem (R6) | `scripts/validate-aifb-content.mjs` (schéma, počty, id, odkazy, hash originálů) |
| Typy ze schématu | `src/lib/edu/aifb/types.generated.ts` |
| Loader, markdown, odkazy | `src/lib/edu/aifb/{content,markdown,guide-links}.ts` |
| Komponenty | `src/components/edu/aifb/` |
| Styly | `src/styles/aifb.css`, kořen `.aifb`, postavený na `.aigram` tokenech; témata `.aifb--pirate`, `.aifb--trail`, `.aifb--clean` |
| Trasy | `src/app/edu/ai-gramotnost/aifb/…` (+ hub dle Q1) |
| i18n | klíče `aifb.*` v `src/lib/edu/i18n-data.ts` (nejdřív `cs`) |
| Postup | nový klíč `vevit.edu.aifb.progress.v1`, žádný zásah do `aigram_progress_v1` |
| Stahování | `public/assets/aifb/` s verzovanými názvy |
| Testy | `tests/unit/aifb-*.test.mjs` + krok v `security.yml` |
| Dokumentace | `docs/aifb/RECON.md`, později `QA.md` |

Navržené veřejné trasy (vše s `/<locale>` prefixem):

```
/edu/ai-gramotnost                         hub (viz Q1)
/edu/ai-gramotnost/aifb/[category]         mapa levelů
/edu/ai-gramotnost/aifb/[category]/[level] seznam lekcí
/edu/ai-gramotnost/aifb/[category]/[level]/[lesson]
/edu/ai-gramotnost/aifb/[category]/pro-ucitele
```

## 14. Rozpory plán × skutečnost (přehled)

| # | Plán | Skutečnost | Dopad |
|---|---|---|---|
| 1 | Hub na `/edu/ai-gramotnost/` | Tam je dashboard kurzu + hash redirect | blokuje F2 (Q1) |
| 2 | Router může být hashový | Cestový, locale prefix přes proxy | trasy s `/${locale}` |
| 3 | `#lesson/…` musí fungovat | Funguje přes klientský redirect na kořeni | redirect zachovat |
| 4 | Služba XP s API | Jen serverový `awardXp`, bez klientského zápisu, nová pravidla = migrace | F5.2 blokováno (Q5) |
| 5 | XP 25 / 40 / 60 | Rules: 40 lekce, 300 kurz; ostatní neexistují | jen lokálně |
| 6 | Pseudonymní třídní účty z Edu for Schools | V kódu nejsou | mimo MVP (Q9) |
| 7 | Komponentová knihovna | Není, jen `.aigram` třídy a komponenty Edu | F6.1 „ukázky" bez cíle |
| 8 | Barvy z existujících tokenů | Tři nesourodé vrstvy (fialová vs. smaragdová) | rozhodnout (Q3) |
| 9 | Žádné trackery | Vercel Analytics + Speed Insights globálně | rozhodnout (Q4) |
| 10 | i18n `edu.aifb.*` | Klíče bez `edu.` prefixu; stávající AI kurz bez i18n | `aifb.*` |
| 11 | Playwright E2E, CI | Není `@playwright/test`, CI nespouští `test:unit` | nové devDeps (Q7) |
| 12 | DOCX + PDF ke stažení | Přiložen 1 DOCX z 6 souborů | Q8 |
| 13 | `pro-ucitele` jako `/aifb/ucitele/:category` | Kolize s `:category/:level` | změna trasy |
| 14 | URL s id (`zs1-blok-a-cv3`) | Katalog má krátké segmenty | Q6 |
| 15 | AI endpoint `/api/edu/ai/complete` | Konvence repa `/edu/api/...`; existující proxy má pevný prompt | F6 |
| 16 | `theme-color #0d0d0d` | V layoutu není | bez dopadu |
| 17 | Print šablona | V Edu není žádný `@media print` | psát nově ve F4 |

## 15. Otevřené otázky

**Blokují F1 / F2**

- **Q1 (hub).** Kam s hubem?
  - A) Hub nahradí kořen `/edu/ai-gramotnost`; stávající dashboard (přehled + hash redirect) se přesune na `/prehled`, redirect zůstane na kořeni. Odpovídá výchozí odpovědi plánu.
  - B) Kořen zůstane beze změny a hub je na `/edu/ai-gramotnost/aifb`; karta v navbaru se přesměruje na hub. Nulové riziko pro kurz.
  - Doporučení: A. Karta „Online kurz" pak vede na `/kurz` nebo na přesunutý dashboard?
- **Q2 (větev).** Pracovat na nové větvi z `master` (nebo `main`)? Aktuální `feat/platebni-brana` patří platbám. Mám `docs/superpowers/plans/AI_gramotnost/` a `docs/aifb/RECON.md` commitnout?
- **Q3 (tokeny).** Použít scoped tokeny `.aigram` (smaragdová `#10B981`, stejné jako stávající kurz) jako základ všech tří témat? Alternativa: Edu globální `--color-*` (fialová v dark režimu). Doporučení: `.aigram`.
- **Q4 (R3).** Vynechat `/edu/ai-gramotnost/aifb/**` z `AnalyticsGate` (malá změna sdílené komponenty), nebo to považuješ za přijatelné (Vercel jako hosting)? Doporučení: vynechat.
- **Q5 (nové závislosti).** Mohu přidat devDependencies `ajv`, `ajv-formats` a `json-schema-to-typescript` (validace a typy ze schématu)? Alternativa: vlastní skript bez závislostí a ručně udržované typy (plán to nechce).
- **Q6 (URL lekcí).** Segmenty podle katalogu (`/zs1/blok-a/cv3`) nebo plná id (`/zs1/zs1-blok-a/zs1-blok-a-cv3`)? Doporučení: krátké segmenty odvozené z id; mapování na id je jednoznačné a stabilní.

**Blokují později**

- **Q7 (F8).** Povolit `@playwright/test` + konfiguraci a přidat do `security.yml` kroky `test:unit` a validaci obsahu?
- **Q8 (F7).** Dodat chybějící soubory (ZS 1. st. DOCX+PDF, ZS 2. st. DOCX+PDF, PDF pro školy). Potvrdit, že `AIFB_plan_cviceni_pro_skoly` patří kategorii SŠ a jaké názvy souborů zobrazit.
- **Q9 (třídy).** Potvrdit odpověď plánu: pseudonymní účty až po MVP, nejdřív lokální průběh. Zdroj rozhodnutí z Edu for Schools v repu není.
- **Q10 (XP).** Potvrdit, že F5.2 se zatím nedělá (potřebuje nové `xp_rules` + migraci + endpoint, tedy zásah do produkčních dat).
- **Q11 (písmo).** Pro pirátské téma: zůstat u Geist, nebo použít Bricolage Grotesque (již lokální, latin-ext) pro nadpisy? Zaoblené písmo repo nemá.
- **Q12 (výchozí odpovědi plánu).** Potvrdit: Q2 stezka pro 2. stupeň, Q3 názvy ostrovů, Q6 texty pro žáky schvaluje vlastník.
- **Q13 (F6).** Poskytovatel modelu a endpoint: navrhuji reuse env `EDU_AI_*` vzoru v nové route `src/app/edu/api/aifb/complete/route.ts`. Rozhodnutí před F6, do té doby jen uložené odpovědi.
- **Q14 (stávající certifikát).** `certificate.php` stávajícího kurzu zůstává beze změny. AIFB štítky budou vždy „Připravuje se". Potvrdit.

## 16. Změny po F0 (aktualizace 2026-10-22)

Původní kurz AI gramotnosti byl na pokyn vlastníka z webu odstraněn (stránky `kurz`, `lekce`, `milnik`, `profil`, dashboard a komponenty). Zůstal obsah v `src/content/ai-gramotnost`, kvízová API a `certificate.php`. Důsledky:

- Hub AIFB zabírá kořen `/edu/ai-gramotnost` (výchozí odpověď plánu Q1/A). Dřívější stránka „Již brzy" pro AI gramotnost je nahrazena hubem; komponenta `EduSoonPage` zůstává pro Chemii a Historii.
- `#lesson/…` odkazy starého kurzu nemají kam vést. Redirect z dashboardu zanikl spolu s dashboardem.
- Čtvrtá karta katalogu („Online kurz pro všechny", `status: existing`) se v hubu zobrazí jako neaktivní „Připravuje se", ne jako odkaz na neexistující stránku.

## 17. Rozhodnutí a výchozí odpovědi (platí, dokud vlastník neřekne jinak)

| Téma | Rozhodnutí |
|---|---|
| Hub (Q1) | Na `/edu/ai-gramotnost`, kategorie pod `/aifb/<kategorie>` |
| Větve | Jedna větev na fázi, navazují po sobě (`feat/aifb-f1-obsah` → `feat/aifb-f2-…`); základ je `feat/platebni-brana` (tam je aktuální stav Edu). Push a PR jen po schválení |
| Tokeny (Q3) | Scoped tokeny `.aigram` (smaragdová), světlý/tmavý režim přes `html.light` |
| Analytika (Q4) | `AnalyticsGate` se pro `/edu/ai-gramotnost` nespouští (R3) |
| Závislosti (Q5) | Bez nových závislostí: validace schématu a generátor typů jsou vlastní skripty (`scripts/aifb-validate.mjs`, `scripts/aifb-gen-types.mjs`) |
| URL lekcí (Q6) | Krátké segmenty odvozené z id (`/zs1/blok-a/cv3`); mapování je jednoznačné a pokryté testy |
| Průvodce | `/aifb/<kategorie>/pro-ucitele` (ne `/aifb/ucitele/<kategorie>`, kvůli kolizi s `:level`) |
| Plán Q2, Q3, Q6 | Výchozí odpovědi: stezka pro 2. stupeň, názvy ostrovů z `visual`, texty pro žáky schvaluje vlastník |
| XP | Pouze lokálně (`vevit.edu.aifb.progress.v1`); žádný zápis do účtu |
| Soubory ke stažení | Jen existující `AIFB_plan_cviceni_pro_skoly.docx`; chybějící DOCX/PDF se nezobrazují, dokud je vlastník nedodá |
| `public/` v `.gitignore` | Nové soubory pod `public/` je třeba přidávat `git add -f` (jinak se nedostanou na Vercel) |

Pozn.: obsah průvodců zmiňuje názvy konkrétních AI služeb (např. ChatGPT, Gemini). Je to obsah plánu a nemění se; pravidlo R8 (bez značky modelu) platí pro rozhraní, které aplikace generuje.

## 18. Stav po F7 (2026-10-22)

| Fáze | Stav |
|---|---|
| F1 obsahový základ | hotovo (validace v buildu a CI, typy ze schématu, renderer, loader) |
| F2 navigační kostra | hotovo (hub, kategorie, level, lekce, Pro učitele, 404, chyba s „Zkusit znovu") |
| F3 témata a mapy | hotovo (pirate-map, trail, clean; seznamové varianty) |
| F4 přehrávač lekce | hotovo (Pro učitele, Projekce, Tisk lekce i levelu, Žák = zpráva) |
| F5.1 místní průběh a XP | hotovo (klíč `vevit.edu.aifb.progress.v1`, export/import, drahokamy) |
| F7 Pro učitele | hotovo (obsah průvodce, odkazy mezi oddíly, soubory ke stažení, dopis rodičům k tisku a kopírování, upozornění na ochranu údajů u lekcí s AI) |
| F5.2, F6, F9, třídy a účty | záměrně nezačato (vyžaduje výslovný pokyn) |

Rozhodnutí z F4 a F7:

- Projekce promítá jen to, co patří žákům: u teorie opakovací otázky a diskuzní témata, u cvičení zadání, očekávaný výstup, formu a čas. Úvod a poznámky pro učitele zůstávají skryté.
- Upozornění na ochranu údajů se ukazuje u cvičení, kde se pracuje s nástrojem AI: 1. stupeň bloky C a D, 2. stupeň a SŠ všechna cvičení. Odkaz vede na oddíl 7.2 (1. stupeň) nebo 1.4 (2. stupeň, SŠ). Pravidlo je v `src/lib/edu/aifb/guide.ts`, ne uhodnuté z textu.
- Soubory ke stažení řídí `src/content/aifb/downloads.json`; validace kontroluje existenci i velikost. V `public/assets/aifb/2026-10/` je zatím jen `AIFB_plan_cviceni_pro_skoly.docx` (kategorie SŠ, podle `category.source.document`). Chybí DOCX pro 1. a 2. stupeň a všechna PDF.
- Žákovská vrstva: všude `pupil.status = todo`, text pro žáky nevznikl (F6).

## 19. AI cvičení: bezpečnostní poznámky (F6)

- Endpoint `/edu/api/aifb/complete` obslouží jen lekci se schválenou žákovskou vrstvou typu AiSandbox; návrh (draft) jen ve vývoji a náhledových nasazeních (`aiLessonAvailable`). Na produkci tedy nikdo nevolá model, dokud vlastník vrstvu neschválí.
- Náklady: limit na IP (20 / 10 min) a globální strop (300 živých dotazů / hod); po jeho vyčerpání nebo při nedostupném úložišti limitů se vrací uložená odpověď. Bez nastaveného klíče se model nevolá vůbec.
- **Souhlas zákonných zástupců na 2. stupni (R5) server ověřit neumí.** AIFB nemá přihlášení ani účty učitelů (mimo rozsah plánu), takže potvrzení je ovládací prvek v rozhraní. Skutečné vynucení by vyžadovalo účty učitelů, což je rozhodnutí vlastníka. Podepsaný token bez účtu by byl jen zdánlivá ochrana, proto není.
