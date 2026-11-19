# EveryTool.cz — rebrand aplikace tools podle schválených maker

## Kontext
Makety `index.html` (hub) a `legal.html` (Podmínky užití + Ochrana soukromí) z Downloads je třeba přenést do skutečné aplikace tools v monorepu a přejmenovat ji na **EveryTool.cz by VeVit web studio**. Stávající hub (`hub-app.tsx`) je React port starého designu; data 171 nástrojů a 8 kategorií jsou v `registry/data.ts`, vyhledávací logika a URL stav v `search-core.tsx` — obojí zůstává, mění se vzhled a přibývají nové sekce.

Potvrzená rozhodnutí: v hubu zůstávají **Kde jste skončili, pokročilé filtry (skryté), pásmo o soukromí i karty konvertorů**; přihlášení **odkazem na /account/login** (žádný Google button v tools); EN právní texty **přeložit a označit jako neověřené**; výhoda „EveryTool Premium v ceně“ u VeVit Premium **zůstává**.

Před psaním kódu: podle `AGENTS.md` si přečíst relevantní dokumenty v `node_modules/next/dist/docs/` (next/font, metadata) — verze Nextu má breaking changes.

## Postup (nová větev `feat/everytool-rebrand`, commity po krocích)

### 1) Základ: fonty, světý režim, obal `.tools-app`
- Nový `src/components/tools/fonts.ts`: `Bricolage_Grotesque` (`--font-et-display`) a `Plus_Jakarta_Sans` (`--font-et-text`) přes `next/font/google`, subset `latin`+`latin-ext`, variable mód. Žádné nové npm závislosti.
- `src/app/tools/[locale]/layout.tsx`: obalit `children` + `ConsentBanner` do `<div class="tools-app {fonts.className}">`; přidat inline no-flash skript — když `html` nemá `data-theme`, nastavit `light` (výchozí světlý režim jen pro tools; ThemeToggle se pak chová správně, protože čte `data-theme`).
- `tools.css`: nové design tokeny z makety (`--et-*`: bg/surface/lilac/ink/muted/line/accent/yellow/chip…) definované **uvnitř `.tools-app`** (světlé) a v `html[data-theme="dark"] .tools-app` (tmavé) + přemapování legacy proměnných (`--background` apod.) uvnitř scope, aby hlavička/patička/consent banner nástrojových stránek ladily. Dosavadní `.tools-hub` blok nahradit; mockupí selectors prefixovat `et-`, žádné úniky mimo `.tools-app`.

### 2) Hlavička a patička (rebrand)
- `site-header.tsx`: nové logo (barevná 4-dílná „mark“ z CSS, `EveryTool.cz` + podtitul `by VeVit web studio`), sticky hlavička, kategorie, jazyk (`data-vevit-language`), ThemeToggle, slot `data-vevit-session` s fallback tlačítkem „Přihlásit se“ → `/cs/account/login` (session.js ho runtime vymění za účet — přestylovat `.vv-session--anonymous/--authenticated` v rámci `.tools-app`, legacy skripty nechat).
- `site-footer.tsx`: 4 sloupce dle makety (brand, Kategorie, EveryTool — vč. odkazů na **obě** právní stránky + `ConsentSettingsButton`, VeVit web studio), spodní pruh s jazyky.
- Metadata: `HUB_I18N.doc_title/description` → „EveryTool.cz – všechny nástroje na jednom místě“ (cs+en), suffix `| VeVit Tools` → `| EveryTool.cz` na stránkách nástrojů a právních stránek, copyright.

### 3) Hub (`hub-app.tsx`)
Vše dle `index.html`, data VŽDY z `registry/data.ts` (mockupí pole RAW ignorovat), URL stav a vyhledávání přes stávající `search-core.tsx` (beze změny):
- Hero: badge „NOVÉ: PDF → Word…“ (klik nastaví dotaz), H1 s rotujícími slovy **Zdarma/Rychle/Lokálně/Bezpečně** — každé s vlastní animací z makety; `sr-only` celá věta pro čtečky, `aria-hidden` rotace, ovládání teček, `prefers-reduced-motion` → statické první slovo bez cyklení; bloby s parallaxem (pointer, reduced-motion off).
- Vyhledávání: velké pole + **našeptávač** (top 6 výsledků s ikonou, zvýrazněním `highlight()`, kategorií, „Zobrazit všech N“), klávesnice šipky/Enter/Esc, aria-combobox; suggestion pills; statistiky s count-up (171/8/7 z registru).
- Dlaždice kategorií (tint, počty), **Začněte tady** (POPULAR slugs z makety — před použitím ověřit proti `getTool()`, chybějící nahradit/dropnout), katalog s category pills + per-kategorie rozbalováním (8 karet + „Zobrazit všech N“).
- Zachované funkce v novém stylu: karty konvertorů, **Kde jste skončili** (RecentRail), pokročilé filtry (processing/status/sort) sbalené v `<details>`, pásmo o soukromí.
- Sekce **Proč** (3 karty), **Premium** (viz krok 4), CTA pruh **VeVit web studio** (odkaz na vevit.cz).
- Karty vedou na `/{locale}/tools/{slug}`; ukázkový toast a `#slug` kotvy vyhozeny. Nové řetězce do `HUB_I18N` (cs+en, ostatní locale padají do cs jako dnes).
- Aktualizovat `(hub)/loading.tsx` skeleton.

### 4) Premium sekce — jediný zdroj dat
- Nový `src/lib/premium-tiers.ts`: extrahovat tarify Bronze/Silver/Gold (ceny měsíc/rok, výhody) + Platinum (mailto) z `src/app/home/[locale]/page.tsx` (#premium, řádky ~1003–1219) a home page na něj přejít (markup beze změny).
- Hub: 3 karty Zdarma / EveryTool Premium / VeVit Premium; tiers přepínač + měsíc/rok čte ze `premium-tiers.ts`; CTA → `/{locale}/account/billing`. **EveryTool Premium: cena `[CENA]` a sleva `[X] %` zůstávají viditelné placeholdery.**

### 5) Právní stránky dle `legal.html`
- `terms-content.ts`: nová struktura `{ title, effective, intro, short[], sections: { id, h, p: [boldLead, text][] } }`; CS texty z makety (placeholdery **ponechat**), `privacyFor()` pro Ochrana soukromí; EN překlad nových textů s komentářem „neověřený překlad“.
- Přepsat `podminky-uziti/page.tsx` a nová `src/app/tools/[locale]/ochrana-soukromi/page.tsx`: legal hero s blobs, přepínač dokumentů (odkazy mezi stránkami), „Ve zkratce“, sticky TOC s barevnými čísly + scrollspy (IntersectionObserver), sekce s číslovanými badge, kontaktní karta.
- `src/lib/consent.ts`: zvýšit `TERMS_VERSION` (→ 2026-11-18). Odkazy: cookie lišta (terms + nově privacy, cs/en texty), patička, a v registraci (`register-form.tsx` dnes žádný odkaz nemá → přidat řádek se souhlasem s odkazy na obě stránky, klíče do account i18n dict cs/en).

### 6) Stránky nástrojů
Bez zásahu logiky (`tools/*` netouch) — nová hlavička/patička/barvy přijít automaticky přes `.tools-app` scope + fonty v layoutu.

## Ověření
1. `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit` (existující testy ve `tests/` tools netestují UI hubu, musí projít).
2. `npm run dev` + screenshoty (browser-use): **hub, podmínky, ochrana soukromí × 1440 px a 390 px × světlá/tmavá** = 12 PNG, pošlu jako soubory. Přitom zkontrolovat: žádný horizontální scroll na 390 px, Esc zavírá našeptávač/dropdown, focus-visible, kontrast ≥ 4,5:1.
3. Commity po logických krocích na `feat/everytool-rebrand`; **na master nepushovat**.

## Placeholdery, které zůstávají (vypíšu na konci práce)
`[CENA]` a `[X] %` u EveryTool Premium; `[OBCHODNÍ FIRMA / JMÉNO]`, `[IČO]`, `[SÍDLO]`, `[DATUM]`, `[X] dnů/dní` (2× v soukromí), `[POSKYTOVATEL E-MAILŮ]`. Před uzavřením se zeptám na: cenu EveryTool Premium + roční slevu, údaje provozovatele, konkrétní limity Zdarma/Premium (AI dotazy, velikost souborů, reklamy) a potvrzení „EveryTool Premium v ceně“ u VeVit Premium.