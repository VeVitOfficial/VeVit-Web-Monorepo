# Prompt pro Claude Sonnet 5.5: platební brána a pokladna

Spusť Claude Code v `~/Projects/vevit-web-app`, přepni model (`/model` → Sonnet 5.5) a vlož text níže. Na začátek vlož číslo fáze, kterou má postavit (1–5). Každou fázi pouštěj v nové konverzaci.

---

```
Postav FÁZI <N> projektu „Vlastní platební brána a pokladna VeVit“.

Podklady (přečti celé, než začneš):
1. AGENTS.md a CLAUDE.md v kořeni repa. Next.js 16 se liší od toho, co znáš:
   před psaním kódu čti relevantní stránky v node_modules/next/dist/docs/.
2. Návrh: docs/superpowers/specs/2026-10-20-platebni-brana-a-pokladna-design.md
3. Plán fáze:
   - fáze 1: docs/superpowers/plans/2026-10-20-faze1-platebni-brana.md
   - fáze 2: docs/superpowers/plans/2026-10-20-faze2-pokladna-v-krocich.md
   - fáze 3: docs/superpowers/plans/2026-10-20-faze3-gopay.md
   - fáze 4: docs/superpowers/plans/2026-10-20-faze4-premium.md
   - fáze 5: docs/superpowers/plans/2026-10-20-faze5-fakturoid.md
4. Vizuální předlohy (otevři v prohlížeči, převezmi vzhled a chování, ne kód):
   docs/superpowers/specs/2026-10-20-prototypy/

Postup:
- Použij skill superpowers:executing-plans a plán fáze projdi task po tasku
  v daném pořadí. Kroky odškrtávej v plánu.
- Pracuj na větvi feat/platebni-brana (vytvoř ji z main, pokud neexistuje;
  když už existuje, pokračuj na ní). Pokud návrh, plány a prototypy
  (docs/superpowers/specs/2026-10-20-*, docs/superpowers/plans/2026-10-20-*)
  ještě nejsou v gitu, commitni je jako první. Commit po každém tasku se
  zprávou z plánu. Nepushuj, nenasazuj a nevytvářej PR, dokud o to nepožádám.
- Každý task musí skončit zeleným `npm run typecheck`, `npm run lint`,
  `npm run test:unit` (a `npm run build` tam, kde to plán říká). Když něco
  neprojde, oprav to, nepřeskakuj. Nikdy netvrď, že je hotovo, bez výstupu
  příkazů.
- Rozhodnutí z kapitoly 6 návrhu („Na staviteli“) dělej sám a zapiš je
  stručně do docs/DECISIONS.md. Cokoli, co mění návrh nebo plán jinak,
  se mě nejdřív zeptej.

Pravidla, která nesmíš porušit:
- Číslo karty ani CVC nikdy nesmí dorazit na server VeVit, do logů,
  analytiky, databáze, URL ani storage prohlížeče.
- Ceny a částky počítá jen server. Stav „zaplaceno“ zapisuje jen ověřený
  webhook nebo ověřený dotaz u poskytovatele, nikdy návrat z přesměrování.
- Jen testovací režimy (Stripe test mode, GoPay sandbox, testovací účty).
  Na nic ostrého nesahej.
- Tajemství: nikdy mě nežádej, abych je vložil do chatu. Nové proměnné
  přidej prázdné do .env.example a řekni mi jejich názvy. Hodnoty si vložím
  sám do .env.local, do Vercelu přes `vercel env add` v terminálu.
  `npm run secret-scan` musí projít.
- Databázové migrace jen jako soubory podle konvence v repu. Nespouštěj je
  proti produkční databázi. Napiš mi, co a v jakém pořadí mám spustit.

Předpoklady, které zajišťuji já (když chybí, dokonči vše, co na nich
nezávisí, task označ jako blokovaný a napiš mi, co potřebuješ):
- fáze 1: Stripe support zapnul raw card data API pro test mode,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (test), Stripe CLI pro `stripe listen`
- fáze 2: testovací API klíč a API heslo Zásilkovny, CRON_SECRET
- fáze 3: GoPay sandbox (GoID, client ID, secret)
- fáze 4: Stripe Tax zapnutý v test mode
- fáze 5: Fakturoid client ID/secret (nově vygenerované), slug účtu,
  ID číselné řady

Na konci fáze mi česky a stručně napiš:
1. co je hotové (commity) a výsledky testů,
2. co je blokované a proč,
3. co musím udělat já (migrace, proměnné, nastavení ve Stripe, GoPay,
   Zásilkovně nebo Fakturoidu),
4. jak to ověřím v prohlížeči (konkrétní kroky a testovací karty).
```
