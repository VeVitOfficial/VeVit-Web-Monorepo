# Fáze 2: Pokladna Store v krocích Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pokladna Store v pěti krocích (Košík → Doprava a platba → Údaje → Platba → Hotovo) se Zásilkovnou, doručením na adresu, nákupem na firmu s ARES a automatickým založením zásilky po zaplacení.

**Architecture:** Volby z kroků 2–3 drží klient v `sessionStorage` (koncept pokladny). Při přechodu na krok 4 se z nich vytvoří checkout snapshot, který server znovu validuje a přepočítá (doprava z jednoho čistého modulu). Po zaplacení se do nové tabulky `payment_jobs` zařadí úloha založení zásilky. Úlohy zpracovává route spouštěná přes `after()` hned po webhooku a pojistně Vercel Cronem.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase PostgREST, Zásilkovna widget v6 + REST API, ARES REST API, Node 26 `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-20-platebni-brana-a-pokladna-design.md` (kap. 5.5, 5.6, 5.7, 5.10, 5.12, fáze 2). Předlohy: `docs/superpowers/specs/2026-10-20-prototypy/pokladna-flow-v4.html`, `udaje-firma.html`. Navazuje na fázi 1 (`2026-10-20-faze1-platebni-brana.md`).

## Global Constraints

- Platí všechna Global Constraints z plánu fáze 1 (Next docs, žádná data karty, čisté moduly bez aliasů, konvence `.php` rout, české texty, `canTransitionPayment`, zelené `typecheck`/`lint`/`test:unit` + commit po každém tasku).
- Ceny dopravy: Zásilkovna výdejní místo/Z-BOX **69 Kč**, doručení na adresu **99 Kč**, zdarma od **1 000 Kč** mezisoučtu a pro tier s `free_shipping` (Silver+). Země **CZ, SK**.
- Koncept pokladny v `sessionStorage` klíč `vevit_checkout_draft_v1`; nikdy neobsahuje údaje karty.
- Rozložení A (kroky), ukazatel kroků nahoře, souhrn vpravo (na mobilu pod obsahem), ikony metod v pevném sloupci 132 px.
- Souhlas s obchodními podmínkami povinný vždy; souhlas se zahájením plnění digitálního obsahu povinný, když košík obsahuje digitální produkt.

## Review Focus

1. Návrat z kroku 3/4 zpět a změna dopravy → volby zůstanou zachované a vznikne nový snapshot s novou cenou (test v Task 3: změna dopravy mění `requestHashInput`).
2. Košík jen s digitálními produkty → krok Doprava se přeskočí, telefon není povinný, souhlas s digitálním plněním ano (test v Task 3).
3. Slovenský zákazník: telefon `+421`, PSČ `811 01`, výdejní místo v SK → přijato (test v Task 3).
4. ARES nedostupný nebo pomalý → ruční vyplnění firmy povoleno; neplatné IČO blokuje (test v Task 2 + ruční ověření v Task 6).
5. Selhání založení zásilky v Zásilkovně → objednávka zůstane zaplacená, úloha se opakuje s odstupem a po vyčerpání pokusů je vidět chyba (test backoffu v Task 7).

---

### Task 1: Doprava jako jeden čistý modul

**Files:**
- Create: `src/lib/checkout/shipping.ts`
- Create: `tests/unit/shipping.test.mjs`
- Modify: `src/lib/cart.ts` (`cartBaseShipping`/`cartShipping` delegují na nový modul)
- Modify: `src/lib/store-checkout-service.ts:466` (výpočet `shippingMinor` přes nový modul)

**Interfaces:**
- Produces:
  - `type DeliveryMethod = "packeta_pickup" | "address"`
  - `SHIPPING_PRICES_MINOR: Readonly<Record<DeliveryMethod, number>>` = `{ packeta_pickup: 6900, address: 9900 }`
  - `FREE_SHIPPING_THRESHOLD_MINOR = 100000`
  - `shippingMinor(input: { method: DeliveryMethod | null; hasPhysical: boolean; subtotalMinor: number; freePerk: boolean }): number`
  - `missingForFreeShippingMinor(subtotalMinor: number): number` (0 když už je zdarma)

- [x] **Step 1: Write failing tests**

```js
test("shipping rules", () => {
  assert.equal(shippingMinor({ method: null, hasPhysical: false, subtotalMinor: 50000, freePerk: false }), 0);
  assert.equal(shippingMinor({ method: "packeta_pickup", hasPhysical: true, subtotalMinor: 99900, freePerk: false }), 6900);
  assert.equal(shippingMinor({ method: "address", hasPhysical: true, subtotalMinor: 99900, freePerk: false }), 9900);
  assert.equal(shippingMinor({ method: "address", hasPhysical: true, subtotalMinor: 100000, freePerk: false }), 0);
  assert.equal(shippingMinor({ method: "packeta_pickup", hasPhysical: true, subtotalMinor: 100, freePerk: true }), 0);
  assert.equal(missingForFreeShippingMinor(69000), 31000);
  assert.equal(missingForFreeShippingMinor(150000), 0);
});
```
`shippingMinor` s `hasPhysical: true` a `method: null` vyhodí `Error("delivery_method_required")`.

- [x] **Step 2: Run `npm run test:unit`** — FAIL.
- [x] **Step 3: Implement** a napoj `cart.ts` (koruny = minor/100) i snapshot (metoda zatím `"address"`, dokud Task 3 nepřidá vstup).
- [x] **Step 4: Run** testy, typecheck, lint — PASS.
- [x] **Step 5: Commit** `refactor(store): single shipping price module`

### Task 2: IČO a ARES

**Files:**
- Create: `src/lib/checkout/company.ts` (čisté)
- Create: `src/app/store/api/ares.php/route.ts`
- Create: `tests/unit/company.test.mjs`

**Interfaces:**
- Produces:
  - `icoValid(ico: string): boolean` (8 číslic, váhy 8..2 na prvních 7, `m = sum % 11`, kontrolní `m === 0 ? 1 : m === 1 ? 0 : 11 - m`)
  - `type PostalAddress = { street: string; city: string; zip: string; country: "CZ" | "SK" }`
  - `type CompanyInfo = { ico: string; name: string; dic: string | null; address: PostalAddress }`
  - `mapAresSubject(json: unknown): CompanyInfo | null` (street = `nazevUlice` nebo `nazevCastiObce` + ` cisloDomovni` + `/cisloOrientacni` když existuje; city = `nazevMestskehoObvodu ?? nazevObce`; zip = `String(psc)`; country `"CZ"`)
  - `GET /store/api/ares.php?ico=<8 číslic>` → `200 CompanyInfo` | `404 { error: { code: "ico_not_found" } }` | `422 { error: { code: "ico_invalid" } }` | `503 { error: { code: "ares_unavailable" } }`. Upstream `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}`, timeout 3000 ms, in-memory cache 1 h (Map s expirací), rate limit `storeRateLimitConsume("store_ares", <ip>, 20, 600)`.

- [x] **Step 1: Write failing tests**: `icoValid("27082440") === true`, `icoValid("12345678") === false`, `icoValid("1234567") === false`; `mapAresSubject` nad výřezem skutečné odpovědi pro 27082440 (`obchodniJmeno "Alza.cz a.s."`, `dic "CZ27082440"`, sidlo Jankovcova 1522/53, psc 17000, obvod „Praha 7“) → `{ name: "Alza.cz a.s.", dic: "CZ27082440", address: { street: "Jankovcova 1522/53", city: "Praha 7", zip: "17000", country: "CZ" } }`; firma bez `dic` → `dic: null`; nesmyslný vstup → `null`.
- [x] **Step 2: Run** — FAIL.
- [x] **Step 3: Implement** modul a route.
- [x] **Step 4: Run** testy, typecheck, lint — PASS; `curl 'localhost:3000/store/api/ares.php?ico=27082440' -H 'Origin: http://localhost:3000'` vrátí Alzu.
- [x] **Step 5: Commit** `feat(store): ICO validation and ARES lookup`

### Task 3: Rozšířený vstup pokladny (snapshot, objednávka, migrace)

**Files:**
- Create: `src/lib/checkout/checkout-input.ts` (čisté: přesun `normalizeCheckoutInput` + `CheckoutValidationException` ze `store-checkout-service.ts`, který je re-exportuje)
- Create: `tests/unit/checkout-input.test.mjs`
- Modify: `src/lib/store-checkout-service.ts` (request hash, doprava, souhlasy, snapshot pole)
- Modify: `src/lib/store-payment-service.ts` (`insertOrder` zapisuje nové sloupce)
- Create: `supabase/sql/store/migrations/202610200003_checkout_details_up.sql` (+ `_down.sql`), README

**Interfaces:**
- Consumes: `DeliveryMethod`, `shippingMinor` (Task 1), `icoValid`, `PostalAddress`, `CompanyInfo` (Task 2)
- Produces:
  - Nová vstupní pole (whitelist rozšířit): `phone: string` (normalizace na `+420XXXXXXXXX`/`+421XXXXXXXXX`), `delivery: { method: "packeta_pickup"; point: PacketaPoint } | { method: "address" } | null`, `shipping` (adresa jen pro `address`), `billing: { company: CompanyInfo | null; address: PostalAddress | null }`, `payment_method: "card" | "apple_pay" | "google_pay" | "paypal"`, `consents: { terms: boolean; digital_waiver: boolean }`
  - `type PacketaPoint = { id: string; name: string; street: string; city: string; zip: string; country: "CZ" | "SK"; kind: "pickup" | "zbox" }` (`id` `^\d{1,10}$`)
  - `requestHashInput(n: NormalizedInput): Record<string, unknown>` (všechna pole kromě `idempotencyKey`; z něj se počítá `request_hash`)
  - `requireConsents(hasDigital: boolean, consents: { terms: boolean; digital_waiver: boolean }): void` (chyby `terms_required` → „Potvrď souhlas s obchodními podmínkami.“, `digital_waiver_required` → „Potvrď souhlas se zpřístupněním digitálního obsahu před uplynutím lhůty pro odstoupení.“)
  - PSČ: CZ `^\d{3} ?\d{2}$`, SK stejný tvar; uloženo bez mezery.
  - Telefon povinný jen při fyzickém zboží; chyba `invalid_phone` → „Zadej platné telefonní číslo.“
  - Migrace: `store_orders` + `customer_phone varchar(16)`, `delivery_method varchar(16) check in ('packeta_pickup','address')`, `packeta_point jsonb`, `billing_company jsonb`, `billing_address jsonb`, `terms_accepted_at timestamptz`, `digital_waiver_at timestamptz`; `store_products` + `weight_grams int not null default 500 check (weight_grams > 0)`, `vat_rate numeric(4,2) not null default 21.00 check (vat_rate in (0, 12, 21))`.

- [x] **Step 1: Write failing tests**: SK telefon `"+421 905 123 456"` → `"+421905123456"`; Packeta bod s `country: "PL"` → `invalid_delivery`; firma s IČO `12345678` → `invalid_company`; `requestHashInput` se liší pro `delivery.method` `packeta_pickup` vs `address`; fyzický košík bez telefonu → `invalid_phone`; `requireConsents(true, { terms: true, digital_waiver: false })` → `digital_waiver_required`; `requireConsents(false, { terms: false, digital_waiver: false })` → `terms_required`; neznámé top-level pole → `unexpected_field` (zachovat stávající chování).
- [x] **Step 2: Run** — FAIL.
- [x] **Step 3: Implement** přesun + rozšíření, migraci, zápis do snapshotu a `insertOrder`. `shippingMinor` dostane metodu ze vstupu. `requireConsents` volat v `createCheckoutSnapshot` po sestavení položek.
- [x] **Step 4: Run** testy, typecheck, lint — PASS.
- [x] **Step 5: Commit** `feat(store): checkout snapshot with delivery, company and consents`

### Task 4: Výběr výdejního místa Zásilkovny

**Files:**
- Create: `src/components/store/checkout/packeta-picker.tsx`
- Create: `src/lib/checkout/packeta-point.ts` (čisté)
- Create: `src/lib/packeta.ts` (server, `server-only`; zatím jen `validatePacketaPoint`)
- Create: `tests/unit/packeta-point.test.mjs`
- Modify: `.env.example` (`NEXT_PUBLIC_PACKETA_API_KEY=`, `PACKETA_API_PASSWORD=`, `PACKETA_SENDER_LABEL=`)
- Modify: `next.config.ts` (CSP `script-src`/`frame-src`/`connect-src` pro `https://widget.packeta.com`)

**Interfaces:**
- Produces:
  - `pointFromWidget(raw: unknown): PacketaPoint | null` (mapování objektu z callbacku `Packeta.Widget.pick`; `kind = "zbox"`, když typ/název místa označuje Z-BOX, jinak `"pickup"`; přesná pole ověř v `https://docs.packeta.com` pro widget v6)
  - `<PacketaPicker value={PacketaPoint | null} onChange={(p: PacketaPoint | null) => void} />` načte `https://widget.packeta.com/v6/www/js/library.js` až při kliknutí, volá `Packeta.Widget.pick(apiKey, cb, { country: "cz,sk", language: "cs" })`
  - `validatePacketaPoint(point: PacketaPoint): Promise<"valid" | "invalid" | "unknown">` přes validační API výdejních míst podle `docs.packeta.com`; `"unknown"` při nedostupnosti (pokladna pak pokračuje, chybu zachytí založení zásilky). Volá se v `createCheckoutSnapshot`; `"invalid"` → `CheckoutValidationException("invalid_delivery", "Vybrané výdejní místo už není dostupné. Vyber jiné.")`.

- [ ] **Step 1: Write failing tests** pro `pointFromWidget`: objekt s `id`, `name`, `street`, `city`, `zip`, `country: "cz"` → `PacketaPoint` s `country: "CZ"`; chybějící `id` → `null`; Z-BOX → `kind: "zbox"`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify** testy, typecheck, lint PASS; v prohlížeči s testovacím API klíčem se otevře mapa a vybrané místo se vrátí.
- [ ] **Step 5: Commit** `feat(store): Packeta pickup point picker`

### Task 5: Kroky 1–2 a koncept pokladny

**Files:**
- Create: `src/components/store/checkout/use-checkout-draft.ts`
- Create: `src/components/store/checkout/checkout-steps.tsx`
- Create: `src/components/store/checkout/checkout-summary.tsx`
- Create: `src/components/store/checkout/method-option.tsx`
- Create: `src/app/store/checkout/doprava/page.tsx`
- Modify: `src/app/store/checkout/page.tsx` (jen přesměrování: fyzické zboží → `/store/checkout/doprava`, jinak `/store/checkout/udaje`)
- Modify: `src/app/store/cart/page.tsx` (ukazatel kroků „1 Košík“, tlačítko „Pokračovat“)
- Modify: `src/app/globals.css` (třídy `store-steps`, `store-method`, `store-method__icon` 132 px atd.)

**Interfaces:**
- Consumes: `shippingMinor`, `missingForFreeShippingMinor`, `SHIPPING_PRICES_MINOR` (Task 1), `PacketaPicker` (Task 4), `BRAND_LOGOS` (fáze 1, Task 2), `getStripe` (fáze 1, Task 7), `useCart`, `useFreeShipping`
- Produces:
  - `type CheckoutDraft = { delivery: { method: "packeta_pickup"; point: PacketaPoint } | { method: "address" } | null; paymentMethod: "card" | "apple_pay" | "google_pay" | "paypal" | null; contact: { name: string; email: string; phone: string }; shippingAddress: PostalAddress | null; company: CompanyInfo | null; billingAddress: PostalAddress | null; notes: string; consents: { terms: boolean; digital_waiver: boolean } }`
  - `useCheckoutDraft(): [CheckoutDraft, (patch: Partial<CheckoutDraft>) => void, () => void]` (čtení/zápis `sessionStorage` v try/catch, poslední argument maže koncept)
  - `<CheckoutSteps current={1 | 2 | 3 | 4 | 5} skipDelivery={boolean} />`
  - `<CheckoutSummary shippingMethod={DeliveryMethod | null} paymentLabel={string | null} />`
  - Apple Pay / Google Pay se v kroku 2 nabízí jen když `stripe.paymentRequest({ country: "CZ", currency: "czk", total: { label: "VeVit Store", amount } }).canMakePayment()` vrátí `applePay`/`googlePay` true.

- [ ] **Step 1: Implement** podle `pokladna-flow-v4.html` (loga Zásilkovny, karet, Apple Pay, Google Pay, PayPal; přeškrtnutá cena při dopravě zdarma; ukazatel do dopravy zdarma). Tlačítko „Pokračovat k údajům“ aktivní až po volbě dopravy (a výdejního místa) i platby.
- [ ] **Step 2: Verify** typecheck, lint; ruční průchod v prohlížeči: volby přežijí reload i krok zpět; digitální košík jde rovnou na údaje.
- [ ] **Step 3: Commit** `feat(store): checkout steps 1-2 with delivery and payment choice`

### Task 6: Krok 3 Údaje a přechod na platbu

**Files:**
- Create: `src/app/store/checkout/udaje/page.tsx`
- Create: `src/components/store/checkout/company-fields.tsx`
- Modify: `src/app/store/checkout/platba/page.tsx` (z fáze 1: předvybraná metoda z konceptu; `apple_pay`/`google_pay` → `method: "wallet"`, `card` → `"card"`, `paypal` → `"paypal"` pro `payment-intent.php`; odkaz „Změnit způsob platby“ na krok 2, ukazatel kroků 4)
- Modify: `src/app/store/success/page.tsx` (krok 5, doprava + platba v rekapitulaci, smazání konceptu a košíku)

**Interfaces:**
- Consumes: `useCheckoutDraft` (Task 5), `GET /store/api/ares.php` (Task 2), `POST /store/api/create-checkout.php` (rozšířený vstup z Task 3)
- Produces: `<CompanyFields value={CompanyInfo | null} onChange={…} />` (IČO s okamžitou kontrolou `icoValid`, červené pole + text „IČO není platné. Zkontroluj, jestli v něm není překlep.“, po platném IČO dotaz do ARES, štítek „Načteno z ARES“, upozornění „Firma není plátce DPH, DIČ nevyplňuj.“, při 503 ruční vyplnění).

Obsah kroku podle `udaje-firma.html`: kontakt (jméno, e-mail, telefon s předvolbou +420/+421), rekapitulace dopravy s „Změnit“, adresa jen u `address`, přepínač „Nakupuji na firmu“, přepínač „Fakturační adresa je jiná“, poznámka, souhlas s OP (odkaz na `/store/terms`, ochrana údajů `/store/privacy`, vrácení `/store/returns`), souhlas s digitálním plněním jen s digitálním produktem, souhrn s „z toho DPH“ (jen informativně, sazba 21 %). Přihlášenému předvyplnit jméno a e-mail z `/store/api/me.php`. „Pokračovat k platbě“ vytvoří snapshot a přejde na `/store/checkout/platba?snapshot=<id>`. Validační chyby serveru (`error.code`) zobrazit u odpovídajícího pole.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify** typecheck, lint, test:unit; ruční: IČO 27082440 doplní Alzu, 12345678 zčervená, vypnutý ARES (blokovat doménu v DevTools) → ruční vyplnění projde; mixovaný košík vyžaduje oba souhlasy; celý průchod až po zaplacení testovací kartou.
- [ ] **Step 3: Commit** `feat(store): checkout step 3 with company purchase and consents`

### Task 7: Úlohy po zaplacení a automatická zásilka

**Files:**
- Create: `supabase/sql/store/migrations/202610200004_payment_jobs_up.sql` (+ `_down.sql`), README
- Create: `src/lib/jobs/backoff.ts` (čisté)
- Create: `src/lib/jobs/payment-jobs.ts` (server)
- Create: `src/app/api/jobs/run/route.ts`
- Modify: `src/lib/packeta.ts` (+ `createPacket`)
- Create: `src/lib/checkout/packeta-xml.ts` (čisté)
- Modify: `src/lib/store-webhook-processor.ts` (po úspěšném zaplacení objednávky s `packeta_pickup` zařadit úlohu)
- Modify: `src/app/store/api/webhook.php/route.ts` (`after(() => runDueJobs(5))`)
- Modify: `vercel.json` (`"crons": [{ "path": "/api/jobs/run", "schedule": "*/15 * * * *" }]`)
- Modify: `.env.example` (`CRON_SECRET=`), `TRACKING_CARRIER_ORIGINS_JSON` příklad s `"packeta":"https://tracking.packeta.com"`
- Create: `tests/unit/backoff.test.mjs`, `tests/unit/packeta-xml.test.mjs`

**Interfaces:**
- Produces:
  - Tabulka `payment_jobs(id bigserial pk, kind varchar(48) not null, ref varchar(128) not null, payload jsonb not null default '{}', status varchar(12) not null default 'pending' check in ('pending','running','done','failed'), attempts int not null default 0, next_run_at timestamptz not null default now(), last_error text, created_at, updated_at, unique(kind, ref))`, RLS jen service role.
  - `nextRunDelaySeconds(attempts: number): number | null` → `[60, 300, 900, 3600, 21600]`, od 6. pokusu `null` (= `failed`)
  - `type JobKind = "packeta_create_packet"` (fáze 5 přidá další)
  - `enqueueJob(kind: JobKind, ref: string, payload?: Record<string, unknown>): Promise<void>` (duplicitní `(kind, ref)` ignorovat)
  - `runDueJobs(limit: number): Promise<{ done: number; failed: number }>` (claim přes CAS `pending → running` podle `id` a `status`, handler podle `kind`, chyba → `attempts + 1`, `next_run_at` podle backoffu)
  - `GET /api/jobs/run` vyžaduje `Authorization: Bearer ${CRON_SECRET}`, jinak 401
  - `buildCreatePacketXml(input: { apiPassword: string; number: string; name: string; surname: string; email: string; phone: string; addressId: string; valueCzk: string; weightKg: string; eshop: string }): string` a `parseCreatePacketResponse(xml: string): { ok: true; id: string; barcode: string } | { ok: false; fault: string }` (Zásilkovna REST `https://www.zasilkovna.cz/api/rest`, `createPacket`; ověř tvar v `docs.packeta.com`). Text v XML escapovat.
  - Handler `packeta_create_packet` (ref = `order.public_id`): `createPacket` → insert do `store_deliveries` (`carrier_code: "packeta"`, `carrier_name: "Zásilkovna"`, `tracking_number` = barcode, `tracking_url = "https://tracking.packeta.com/cs/?id=" + id`, ostatní sloupce podle migrace `202607300002_customer_agenda_up.sql`) a `fulfillment_status` dle stávajícího automatu.

- [ ] **Step 1: Write failing tests**: `nextRunDelaySeconds(0) === 60`, `(4) === 21600`, `(5) === null`; `buildCreatePacketXml` escapuje `&` a `<` ve jméně; `parseCreatePacketResponse` nad ukázkovou úspěšnou a chybovou odpovědí z dokumentace.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.** Hmotnost = součet `weight_grams × quantity` fyzických položek / 1000, hodnota = `total_minor` v Kč.
- [ ] **Step 4: Verify** testy, typecheck, lint PASS; s testovacím API heslem Zásilkovny zaplacená testovací objednávka založí zásilku (vidět v klientské sekci Zásilkovny) a v `/store/order` je sledovací odkaz. Volání `/api/jobs/run` bez tokenu → 401.
- [ ] **Step 5: Commit** `feat(store): payment jobs and automatic Packeta packets`

### Task 8: Texty a úklid

**Files:**
- Modify: `src/app/store/[page]/page.tsx` („Doprava a platba“: Zásilkovna výdejní místo nebo Z-BOX 69 Kč, doručení na adresu 99 Kč, od 1 000 Kč a pro Silver+ zdarma; nákup na firmu; platební metody fáze 1)
- Modify: kód staré jednostránkové pokladny (odstranit nepoužívané části, které Task 5 nahradil)

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify** `npm run typecheck && npm run lint && npm run test:unit && npm run build` PASS.
- [ ] **Step 3: Commit** `docs(store): shipping and payment information for the new checkout`
