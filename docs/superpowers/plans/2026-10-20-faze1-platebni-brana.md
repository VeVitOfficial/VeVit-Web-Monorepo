# Fáze 1: Vlastní platební brána (Stripe) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zákazník Store zaplatí objednávku na vlastní stránce VeVit kartou (vlastní pole + animovaná karta), Apple Pay, Google Pay nebo PayPalem přes Stripe, místo přesměrování na Stripe Checkout.

**Architecture:** Čisté (bezzávislostní) moduly validují kartu a rozpoznávají banku a jsou testované přes `node --test`. Prohlížeč posílá údaje karty přímo na Stripe API (publishable key) a server VeVit dostane jen `pm_…`. Server vytváří a potvrzuje PaymentIntent nad stávající objednávkou ze snapshotu a „zaplaceno“ zapisuje jen webhook `payment_intent.succeeded`. Wallety a PayPal jdou přes Stripe.js (`@stripe/stripe-js`).

**Tech Stack:** Next.js 16 (App Router, route handlers), React 19, TypeScript, `stripe@22` (API `2026-08-26.dahlia`), `@stripe/stripe-js`, Supabase PostgREST (`storeRest`), Node 26 `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-20-platebni-brana-a-pokladna-design.md` (kap. 5.2, 5.3, 5.11, 5.12, fáze 1). Vizuální předloha: `docs/superpowers/specs/2026-10-20-prototypy/brana-karta-v4.html`.

## Global Constraints

- Před psaním kódu přečti relevantní stránky `node_modules/next/dist/docs/` (Next 16 se liší od tréninkových dat; middleware je `src/proxy.ts`).
- Číslo karty ani CVC nesmí nikdy dorazit na server VeVit, do logu, analytiky, DB ani chybových hlášení. BIN endpoint přijímá max. 8 číslic.
- Částky počítá jen server, v haléřích (`*_minor`), měna `czk`.
- Čisté moduly v `src/lib/payments/` nesmí importovat `server-only`, `@/…` aliasy, `react` ani nic z `node_modules`; jen relativní importy s příponou `.ts`. Jen syntaxe podporovaná Node type-strippingem (žádné `enum`, `namespace`, parameter properties).
- Nové API routy Store dodrží konvenci `src/app/store/api/<name>.php/route.ts`, `runtime = "nodejs"`, `dynamic = "force-dynamic"`, `storeRequireMethod` + `storeRequireSameOrigin`, chyby přes `storeJsonError`, hlavička `Cache-Control: no-store`.
- Texty pro zákazníka česky. Komentáře v kódu anglicky, v hustotě okolního kódu.
- Žádné tajemství v repu; `npm run secret-scan` musí projít. Nové proměnné prázdné v `.env.example`.
- Platební stavy jen přes `canTransitionPayment` (`src/lib/store-payment-service.ts`).
- Každý task končí `npm run typecheck`, `npm run lint`, `npm run test:unit` zelené a commitem.

## Review Focus

1. Vložení čísla karty se mezerami/pomlčkami nebo automatické vyplnění všech polí naráz prohlížečem → číslo se naformátuje, validuje a karta se překreslí bez fokusu (test v Task 1, ruční ověření v Task 6).
2. Dvojklik na „Zaplatit“ nebo obnovení stránky během 3D Secure → žádná druhá platba (idempotency klíč objednávka+pokus, test v Task 4).
3. Zamítnutá karta (nedostatek prostředků, chybné CVC, prošlá) → srozumitelná česká hláška a objednávka jde zaplatit znovu (`failed → awaiting_payment`, test v Task 4).
4. Délky karet: Visa 13/16/19, Mastercard 16, Amex 15 (CVC 4), Maestro 12–19 → Luhn se vyhodnotí až po plné délce dané značky (test v Task 1).
5. Platnost v aktuálním měsíci je platná, minulý měsíc ne (test v Task 1 s pevným `now`).

---

### Task 1: Validace karty (čistý modul) + testovací běh

**Files:**
- Create: `src/lib/payments/card-validation.ts`
- Create: `tests/unit/card-validation.test.mjs`
- Modify: `package.json` (script `"test:unit": "node --test tests/unit/"`)
- Modify: `tsconfig.json` (`"allowImportingTsExtensions": true`)

**Interfaces:**
- Produces:
  - `type CardBrand = "visa" | "mastercard" | "amex" | "maestro"`
  - `detectBrand(digits: string): CardBrand | null`
  - `brandLengths(brand: CardBrand): number[]` (visa `[13,16,19]`, mastercard `[16]`, amex `[15]`, maestro `[12..19]`)
  - `cvcLength(brand: CardBrand | null): 3 | 4` (amex 4, jinak 3)
  - `digitsOnly(input: string): string` (max 19 číslic)
  - `formatCardNumber(digits: string, brand: CardBrand | null): string` (amex `4-6-5`, jinak skupiny po 4)
  - `luhnValid(digits: string): boolean`
  - `type FieldResult = { ok: boolean; complete: boolean; error: string | null }`
  - `validateCardNumber(digits: string): FieldResult & { brand: CardBrand | null }`
  - `validateExpiry(input: string, now: Date): FieldResult & { month: number | null; year: number | null }` (vstup „MMRR“ nebo „MM/RR“)
  - `validateCvc(input: string, brand: CardBrand | null): FieldResult`
  - `validateHolderName(input: string): FieldResult` (min. 3 znaky po trim)

Pravidla značek (shodná s prototypem): `^4` visa; `^(5[1-5]|2(2[2-9][1-9]|2[3-9]\d|[3-6]\d\d|7[01]\d|720))` mastercard; `^3[47]` amex; `^(50|5[6-9]|6)` maestro.

Chybové texty (přesně): `"Tento typ karty nepřijímáme."` (≥2 číslice a žádná značka), `"Číslo karty není platné. Zkontroluj překlep."` (plná délka, Luhn neprojde), `"Měsíc musí být 01–12."`, `"Karta už je prošlá."`, `"Neplatný rok."` (víc než +20 let), `"CVC je neúplné."`, `"Vyplň jméno na kartě."`.

- [x] **Step 1: Write the failing tests** (`tests/unit/card-validation.test.mjs`, `import … from "../../src/lib/payments/card-validation.ts"`)

```js
test("brand detection", () => {
  assert.equal(detectBrand("4140920000000002"), "visa");
  assert.equal(detectBrand("5402980000000006"), "mastercard");
  assert.equal(detectBrand("2221000000000009"), "mastercard");
  assert.equal(detectBrand("371449635398431"), "amex");
  assert.equal(detectBrand("6759649826438453"), "maestro");
  assert.equal(detectBrand("9"), null);
});
test("luhn", () => {
  assert.equal(luhnValid("4140920000000002"), true);
  assert.equal(luhnValid("4111111111111112"), false);
});
test("pasted number is normalized and formatted", () => {
  assert.equal(digitsOnly("4111-1111 1111 1111"), "4111111111111111");
  assert.equal(formatCardNumber("371449635398431", "amex"), "3714 496353 98431");
  assert.equal(formatCardNumber("4140920000000002", "visa"), "4140 9200 0000 0002");
});
test("luhn only judged at full brand length", () => {
  assert.deepEqual(validateCardNumber("411111111111111").error, null); // 15 digits visa: incomplete, no error
  assert.equal(validateCardNumber("4111111111111112").error, "Číslo karty není platné. Zkontroluj překlep.");
  assert.equal(validateCardNumber("4140920000000002").ok, true);
  assert.equal(validateCardNumber("371449635398431").ok, true);
  assert.equal(validateCardNumber("99").error, "Tento typ karty nepřijímáme.");
});
test("expiry boundaries", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  assert.equal(validateExpiry("10/26", now).ok, true);
  assert.equal(validateExpiry("0926", now).error, "Karta už je prošlá.");
  assert.equal(validateExpiry("13/27", now).error, "Měsíc musí být 01–12.");
  assert.equal(validateExpiry("01/47", now).error, "Neplatný rok.");
  assert.equal(validateExpiry("1", now).complete, false);
});
test("cvc length by brand", () => {
  assert.equal(validateCvc("123", "visa").ok, true);
  assert.equal(validateCvc("123", "amex").ok, false);
  assert.equal(validateCvc("1234", "amex").ok, true);
});
```

- [x] **Step 2: Run `npm run test:unit`** — Expected: FAIL (modul neexistuje).
- [x] **Step 3: Implement `src/lib/payments/card-validation.ts`** podle Interfaces; Luhn klasicky zprava, zdvojení každé druhé číslice.
- [x] **Step 4: Run `npm run test:unit && npm run typecheck`** — Expected: PASS.
- [x] **Step 5: Commit** `feat(payments): card validation module with Luhn and brand rules`

### Task 2: Banky podle BIN (čistý modul + loga)

**Files:**
- Create: `src/lib/payments/card-banks.ts`
- Create: `public/payments/banks/{cs,csob,kb,rb,uc,moneta,airbank}.svg`
- Create: `public/payments/brands/{visa,mastercard,amex,maestro,applepay,googlepay,paypal}.svg`
- Create: `tests/unit/card-banks.test.mjs`

**Interfaces:**
- Produces:
  - `type CardBankKey = "cs" | "csob" | "kb" | "rb" | "uc" | "moneta" | "airbank"`
  - `type CardBank = { key: CardBankKey; name: string; background: string; foreground: string; logo: string }` (`logo` = cesta `/payments/banks/<key>.svg`)
  - `CARD_BANKS: Record<CardBankKey, CardBank>`
  - `bankForDigits(digits: string): CardBank | null` (rozhoduje prvních 6 číslic; méně než 6 → `null`)
  - `BRAND_LOGOS: Record<"visa" | "mastercard" | "amex" | "maestro" | "applepay" | "googlepay" | "paypal", string>`

Data: přenes prefixy, názvy a gradienty bank 1:1 z objektu `BANKS` v `brana-karta-v4.html` (včetně UniCredit `542812`, bez `418809` a bez `408475`). Raiffeisen nese i bývalé Equa prefixy. Loga značek: Visa, Mastercard, American Express, Apple Pay, Google Pay a PayPal stáhni z `simple-icons@13.21.0` (`https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/<name>.svg`, licence CC0) a obarvi barvou značky. Maestro nakresli jako v prototypu (dva kruhy `#0099DF`/`#ED0006`, průnik `#6C6BBD`). Loga bank jsou zatím jednoduché monogramové SVG v barvě banky (`ČS`, `ČSOB`, `KB`, `RB`, `UC`, `M`, `air`). Výměnu za oficiální loga provozovatel dělá podle kontrolního seznamu ve spec, kap. 9.

- [x] **Step 1: Write the failing tests**

```js
test("known czech prefixes", () => {
  assert.equal(bankForDigits("4140920000000002")?.key, "cs");
  assert.equal(bankForDigits("5428124210069366")?.key, "uc");
  assert.equal(bankForDigits("5168440000000005")?.key, "airbank");
  assert.equal(bankForDigits("41409"), null);
  assert.equal(bankForDigits("4000000000000002"), null);
});
test("no prefix belongs to two banks", () => {
  const seen = new Map();
  for (const bank of Object.values(CARD_BANKS)) for (const p of prefixesOf(bank.key)) {
    assert.equal(seen.has(p), false, `${p} in ${seen.get(p)} and ${bank.key}`);
    seen.set(p, bank.key);
  }
});
test("every logo file exists", () => {
  const logos = [...Object.values(CARD_BANKS).map((b) => b.logo), ...Object.values(BRAND_LOGOS)];
  for (const logo of logos) assert.ok(fs.existsSync(path.join("public", logo)), logo);
});
```
(Exportuj i `prefixesOf(key: CardBankKey): readonly string[]` pro test.)

- [x] **Step 2: Run `npm run test:unit`** — Expected: FAIL.
- [x] **Step 3: Implement modul a přidej SVG soubory.**
- [x] **Step 4: Run `npm run test:unit && npm run typecheck`** — Expected: PASS.
- [x] **Step 5: Commit** `feat(payments): czech bank BIN table and payment logos`

### Task 3: BIN lookup endpoint s mezipamětí

**Files:**
- Create: `supabase/sql/store/migrations/202610200001_card_bin_cache_up.sql` (+ `_down.sql`)
- Create: `src/lib/payments/bin-response.ts` (čisté mapování)
- Create: `src/lib/payment-bin-lookup.ts` (server, `server-only`)
- Create: `src/app/api/payments/bin/route.ts`
- Create: `tests/unit/bin-response.test.mjs`
- Modify: `.env.example` (`BIN_LOOKUP_URL=`, `BIN_LOOKUP_API_KEY=`), `supabase/sql/store/migrations/README.md`

**Interfaces:**
- Consumes: `CARD_BANKS`, `CardBankKey` (Task 2), `storeRest` (`src/lib/store-config.ts`), `storeRateLimitConsume` (`src/lib/store-ratelimit.ts`)
- Produces:
  - Tabulka `card_bin_cache(prefix varchar(8) primary key, bank_key text null, bank_name text null, scheme text null, funding text null, country char(2) null, source text not null, fetched_at timestamptz not null default now())`, RLS zapnuté, přístup jen service role (vzor: `supabase/sql/account/021_*.sql`).
  - `mapBinResponse(json: unknown): { bankName: string | null; scheme: string | null; funding: string | null; country: string | null }` (formát binlist: `{scheme, type, country:{alpha2}, bank:{name}}`)
  - `matchKnownBank(bankName: string | null): CardBankKey | null` (normalizace bez diakritiky, `"Unicredit Bank Czech Republic And Slovakia, A.S."` → `"uc"`, `"Ceska Sporitelna"` → `"cs"`, `"Ceskoslovenska Obchodni Banka"` → `"csob"`, `"Komercni Banka"` → `"kb"`, `"Raiffeisenbank"` → `"rb"`, `"Moneta Money Bank"`/`"GE Money Bank"` → `"moneta"`, `"Air Bank"` → `"airbank"`)
  - `GET /api/payments/bin?prefix=<6–8 číslic>` → `200 { bank_key, bank_name, scheme, funding, country }` | `204` (neznámé / služba nenastavená) | `400` (jiný vstup) | `429`
  - `lookupBin(prefix: string): Promise<BinInfo | null>` kde `BinInfo = { bankKey: CardBankKey | null; bankName: string | null; scheme: string | null; funding: string | null; country: string | null }`

Pravidla: dotaz do cache podle prvních 8, pak 6 číslic. Externí volání jen když je `BIN_LOOKUP_URL` nastavené (šablona s `{bin}`, např. `https://lookup.binlist.net/{bin}`). Volitelná hlavička `Authorization: Bearer ${BIN_LOOKUP_API_KEY}`. Timeout 1500 ms. Do cache se ukládá i negativní výsledek (`source = "miss"`, platí 7 dní). Rate limit `storeRateLimitConsume("card_bin", <ip>, 30, 600)`. Nic se neloguje (ani prefix).

- [x] **Step 1: Write failing tests** pro `mapBinResponse` (binlist JSON z `https://lookup.binlist.net/542812` → `bankName` UniCredit, `country "SK"`, `funding "credit"`, nevalidní vstup → všechna pole `null`) a `matchKnownBank` (všechny příklady z Interfaces + `"Some Bank"` → `null`).
- [x] **Step 2: Run `npm run test:unit`** — Expected: FAIL.
- [x] **Step 3: Implement** migraci, `bin-response.ts`, `payment-bin-lookup.ts`, route (validace `^\d{6,8}$`, jinak 400).
- [x] **Step 4: Run** `npm run test:unit && npm run typecheck && npm run lint` — Expected: PASS. Ruční: `curl -i 'localhost:3000/api/payments/bin?prefix=4140920000000002'` → 400.
- [x] **Step 5: Commit** `feat(payments): BIN lookup endpoint with cache`

### Task 4: PaymentIntent pro objednávku Store (server)

**Files:**
- Create: `supabase/sql/store/migrations/202610200002_payment_intents_up.sql` (+ `_down.sql`)
- Create: `src/lib/payments/decline-messages.ts` (čisté)
- Create: `src/lib/payments/intent-keys.ts` (čisté)
- Create: `src/lib/store-payment-intents.ts` (server)
- Create: `src/app/store/api/payment-intent.php/route.ts`
- Create: `src/app/store/api/pay-card.php/route.ts`
- Create: `src/app/store/api/payment-status.php/route.ts`
- Modify: `src/lib/turnstile.ts` (`TurnstileAction` + `"store_payment"`)
- Create: `tests/unit/decline-messages.test.mjs`, `tests/unit/intent-keys.test.mjs`
- Modify: `.env.example` (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=`)

**Interfaces:**
- Consumes: `createOrderFromSnapshot`, `canTransitionPayment`, `OrderRow` (`src/lib/store-payment-service.ts`), `readCheckoutGrant`, `saveOrderGrant`, `readOrderGrant` (`src/lib/store-guest-grants.ts`), `orderCanAccess` (`src/lib/store-order-access.ts`), `verifyTurnstile`, `storeRateLimitConsume`, `storeStripeConfig`
- Produces:
  - Migrace `store_orders`: `payment_provider varchar(16) not null default 'stripe' check in ('stripe','gopay')`, `payment_method varchar(24) null check in ('card','apple_pay','google_pay','paypal','bank_button','paysafecard')`, `payment_attempts int not null default 0`, `last_payment_error varchar(64) null`; unikátní index na `stripe_payment_intent` where not null.
  - `type StorePaymentMethod = "card" | "wallet" | "paypal"`
  - `paymentIntentIdempotencyKey(orderPublicId: string, attempt: number): string` → `vevit-store:pi:v1:<public>:<attempt>`
  - `declineMessage(code: string | null | undefined): string` (mapování Stripe `decline_code`/`code`: `insufficient_funds` → `"Na kartě není dostatek prostředků."`, `incorrect_cvc` → `"CVC nesouhlasí."`, `expired_card` → `"Karta je prošlá."`, `card_declined`/`generic_decline`/neznámé → `"Banka platbu zamítla. Zkus jinou kartu nebo jiný způsob platby."`, `authentication_required` / `payment_intent_authentication_failure` → `"Ověření 3D Secure se nepodařilo."`)
  - `createOrReuseOrderPaymentIntent(orderId: number, method: StorePaymentMethod): Promise<{ clientSecret: string; intentId: string; amountMinor: number }>`: `payment_method_types` card→`["card"]`, wallet→`["card"]`, paypal→`["paypal"]`; `metadata: { order_public_id, schema_version: "2" }`; `amount = order.total_minor`, `currency = "czk"`; reuse existujícího PI, když je v stavu `requires_payment_method|requires_confirmation|requires_action` a stejné metody, jinak nový pokus (`payment_attempts + 1`). Přechod `pending_checkout|failed → awaiting_payment`.
  - `POST /store/api/payment-intent.php` `{ snapshot: string(32 hex), method: StorePaymentMethod }` → `200 { client_secret, order: { public_id }, amount_minor }`. Vytváří objednávku stejně jako `create-payment.php` (guest grant uložit).
  - `POST /store/api/pay-card.php` `{ order: string, payment_method: "pm_…", turnstile_token: string }` → server potvrdí PI (`confirm`, `return_url = <STORE_APP_URL>/checkout/platba?order=<public>`), odpověď `200 { status: "succeeded" | "processing" | "requires_action", client_secret }` nebo `402 { error: { code, message: declineMessage(...) } }`. Max. 5 neúspěšných pokusů na objednávku (`payment_attempts`), rate limit `storeRateLimitConsume("store_pay_card", <ip>, 10, 600)`, Turnstile akce `store_payment` (povinné od 2. pokusu a pro hosty vždy).
  - `GET /store/api/payment-status.php?order=<public>` → `200 { payment_status, last_payment_error }` (přístup přes `orderCanAccess`).

- [x] **Step 1: Write failing tests** pro `declineMessage` (všechny kódy z Interfaces + `undefined`) a `paymentIntentIdempotencyKey("ab"*16, 2)` === `"vevit-store:pi:v1:abab…:2"` a různé pokusy → různé klíče.
- [x] **Step 2: Run `npm run test:unit`** — Expected: FAIL.
- [x] **Step 3: Implement** čisté moduly, migraci, `store-payment-intents.ts` a tři routy. Před kódem přečti Stripe dokumentaci PaymentIntents pro API `2026-08-26.dahlia`. Stav objednávky „paid“ tady nikdy nezapisuj, to dělá webhook (Task 5).
- [x] **Step 4: Run** `npm run test:unit && npm run typecheck && npm run lint` — Expected: PASS.
- [x] **Step 5: Commit** `feat(store): PaymentIntent-based payment endpoints`

### Task 5: Webhook `payment_intent.*`

**Files:**
- Modify: `src/lib/store-webhook-processor.ts`
- Create: `src/lib/payments/intent-checks.ts` (čisté)
- Create: `tests/unit/intent-checks.test.mjs`
- Modify: `docs/DECISIONS.md` (odstavec: Stripe destination pro Store nově přijímá i `payment_intent.succeeded` a `payment_intent.payment_failed`; provozovatel je musí přidat ve Stripe Dashboardu)

**Interfaces:**
- Consumes: `processStripeEvent` stávající ledger (`upsertAndLockEvent`, `markEvent`, `payOrder`), `canTransitionPayment`
- Produces:
  - `intentMismatch(order: { total_minor: number; currency: string; stripe_payment_intent: string | null; public_id: string }, intent: { id: string; amount_received: number; currency: string; metadata: Record<string, string> | null; livemode: boolean }, expectedLiveMode: boolean): string | null` → kódy `"metadata_mismatch" | "amount_mismatch" | "currency_mismatch" | "intent_mismatch" | "livemode_mismatch"`
  - `processStripeEvent` větve: `payment_intent.succeeded` → stávající `payOrder` (zásoby, entitlements, `paid`); `payment_intent.payment_failed` → `awaiting_payment → failed`, `last_payment_error = decline code`. Při `succeeded` doplň `payment_method` z `latest_charge.payment_method_details`: `card.wallet.type` `apple_pay`/`google_pay` → stejná hodnota, jinak `card`; typ `paypal` → `paypal`. Korelace podle `metadata.order_public_id` a `stripe_payment_intent`. `checkout.session.completed` větev zůstává beze změny.

- [x] **Step 1: Write failing tests** pro `intentMismatch`: shoda → `null`; jiná částka → `"amount_mismatch"`; `metadata.order_public_id` jiné → `"metadata_mismatch"`; objednávka už má jiný PI → `"intent_mismatch"`; livemode nesedí → `"livemode_mismatch"`.
- [x] **Step 2: Run** — Expected: FAIL.
- [x] **Step 3: Implement** čistý modul a obě větve v procesoru (stejné záruky jako `checkout.session.completed`: ledger, idempotence, manual_review při nesouladu).
- [ ] **Step 4: Run** testy, typecheck, lint — PASS. Ruční: `stripe trigger payment_intent.succeeded` (Stripe CLI, test mode) proti lokálnímu `/store/api/webhook.php` přes `stripe listen` → odpověď 200, ledger řádek `ignored` (neznámá objednávka). _(částečně hotovo: testy, typecheck, lint, build zelené; živé ověření se Stripe čeká na klíče a zapnuté raw card data API)_
- [x] **Step 5: Commit** `feat(store): handle payment_intent webhooks`

### Task 6: Komponenta karty (UI)

**Files:**
- Create: `src/components/payments/card-gateway/card-gateway.tsx` (client)
- Create: `src/components/payments/card-gateway/card-preview.tsx`
- Create: `src/components/payments/card-gateway/use-card-form.ts`
- Create: `src/components/payments/card-gateway/card-gateway.module.css`
- Create: `src/lib/payments/stripe-raw-card.ts` (čisté, jen `fetch`)
- Create: `tests/unit/stripe-raw-card.test.mjs`

**Interfaces:**
- Consumes: Task 1 (validace), Task 2 (`bankForDigits`, `CARD_BANKS`, `BRAND_LOGOS`), Task 3 (`GET /api/payments/bin`)
- Produces:
  - `buildPaymentMethodBody(card: { number: string; expMonth: number; expYear: number; cvc: string; name: string }): URLSearchParams` (pole `type=card`, `card[number]`, `card[exp_month]`, `card[exp_year]` čtyřmístně, `card[cvc]`, `billing_details[name]`)
  - `createCardPaymentMethod(publishableKey: string, card: …): Promise<{ id: string } | { error: string }>` → `POST https://api.stripe.com/v1/payment_methods`, `Authorization: Bearer <pk>`, form-encoded
  - `<CardGateway amountMinor={number} submitLabel={string} onPaymentMethod={(pmId: string) => Promise<void>} disabled?={boolean} />`: zobrazí kartu + formulář, po odeslání vytvoří `pm_…` a předá ho; chyby z `onPaymentMethod` (throw `Error(message)`) zobrazí pod tlačítkem.

Chování (podle prototypu v4, styl A): aktivní zóna karty podle fokusu, otočení na CVC, animace nových číslic, pop loga značky, chybná pole i zóny červeně s třesením, karta v barvách banky (neznámá: grafit `linear-gradient(135deg,#3a3f47,#15181c)`), logo banky v bílém rámečku + název, „banka nerozpoznána“ při ≥6 číslicích bez shody, řada přijímaných značek nad formulářem, logo banky a značky uvnitř pole čísla. BIN endpoint volat jen když lokální tabulka nic nenašla, debounce 300 ms, jen jednou na prefix. `prefers-reduced-motion: reduce` vypne otáčení, třesení i animace číslic. `autocomplete` atributy `cc-number`, `cc-name`, `cc-exp`, `cc-csc`. Hodnoty karty nikdy neukládat do `localStorage`/`sessionStorage` ani do URL.

- [x] **Step 1: Write failing test** `buildPaymentMethodBody({number:"4242424242424242",expMonth:9,expYear:28,cvc:"123",name:"Jan Novák"})` → `card[exp_year]` `"2028"`, `card[exp_month]` `"9"`, `type` `"card"`, `billing_details[name]` `"Jan Novák"`.
- [x] **Step 2: Run** — FAIL.
- [x] **Step 3: Implement** modul a komponenty.
- [x] **Step 4: Verify** testy, typecheck, lint PASS; dočasně komponentu vlož do stránky z Task 8 a v prohlížeči (`npm run dev`) projdi: vložení „4111-1111 1111 1111“, automatické vyplnění prohlížečem, Amex 15 číslic + CVC 4, chybný Luhn, prošlá platnost, `prefers-reduced-motion` v DevTools.
- [x] **Step 5: Commit** `feat(payments): animated card gateway component`

### Task 7: Apple Pay, Google Pay, PayPal (UI)

**Files:**
- Modify: `package.json` (`@stripe/stripe-js` přesná verze, aktuální stabilní)
- Create: `src/components/payments/stripe-client.ts` (`getStripe(): Promise<Stripe | null>` singleton přes `loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`, `locale: "cs"`)
- Create: `src/components/payments/wallet-button.tsx`
- Create: `src/components/payments/paypal-button.tsx`

**Interfaces:**
- Consumes: `POST /store/api/payment-intent.php` (Task 4)
- Produces:
  - `<WalletButton amountMinor={number} createIntent={() => Promise<{ clientSecret: string }>} returnUrl={string} onAvailability={(available: { applePay: boolean; googlePay: boolean }) => void} />`: Express Checkout Element (`mode: "payment"`, `currency: "czk"`, `amount`), jen Apple Pay a Google Pay (ostatní `never`), potvrzení `stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url }, redirect: "if_required" })`.
  - `<PayPalButton createIntent={…} returnUrl={string} />` → `stripe.confirmPayPalPayment(clientSecret, { return_url })`.

- [x] **Step 1: Implement** (UI bez čisté logiky; žádný unit test).
- [ ] **Step 2: Verify** typecheck, lint; v test mode Chrome s Google Pay testovací kartou projde platba až po `payment_intent.succeeded` (webhook přes `stripe listen`). PayPal v test mode přesměruje na sandbox a zpět. _(částečně hotovo: testy, typecheck, lint, build zelené; živé ověření se Stripe čeká na klíče a zapnuté raw card data API)_
- [x] **Step 3: Commit** `feat(payments): Apple Pay, Google Pay and PayPal buttons`

### Task 8: Platební stránka Store + napojení stávající pokladny, CSP, texty

**Files:**
- Create: `src/app/store/checkout/platba/page.tsx`
- Modify: `src/app/store/checkout/page.tsx` (po vytvoření snapshotu přejít na `/store/checkout/platba?snapshot=<id>` místo `create-payment.php`)
- Modify: `src/app/store/success/page.tsx` (zobrazit stav přes `payment-status.php`, polling po 2 s max. 30 s, dokud není `paid`/`failed`)
- Modify: `next.config.ts` (CSP)
- Modify: `src/app/store/[page]/page.tsx` (texty plateb)

**Interfaces:**
- Consumes: Task 4 routy, Task 6 `CardGateway`, Task 7 tlačítka
- Produces: stránka `/store/checkout/platba?snapshot=<32 hex>` (nová objednávka) nebo `?order=<public>` (návrat z 3DS/PayPal, opakování po zamítnutí). Výběr metody (karta / Apple Pay / Google Pay / PayPal) s logy v pevném sloupci ikon (šířka 132 px, jako `pokladna-flow-v4.html`). Po `succeeded` → `/store/success?order=<public>`. U `requires_action` zavolat `stripe.handleNextAction({ clientSecret })` a pak `payment-status.php`.

Analytika: v komponentě, která v root layoutu vykresluje `@vercel/analytics` a `@vercel/speed-insights`, vynech platební stránky (`/store/checkout/platba`, `/account/billing/platba`, `/account/billing/karta`) přes `beforeSend` vracející `null`, případně podmíněným nevykreslením podle cesty.

CSP doplnit (`script-src`, `frame-src`, `connect-src`): `https://js.stripe.com`, `https://*.js.stripe.com`, `https://hooks.stripe.com`, `https://api.stripe.com`, Apple Pay/Google Pay podle `docs.stripe.com/security/guide`. Texty v `[page]/page.tsx`: věty „Platby probíhají výhradně přes Stripe. Žádné platební údaje neprocházejí naším serverem.“ a „Platby bezpečně zpracovává Stripe. Platební údaje se neukládají v systémech VeVit.“ nahradit: „Platby kartou zpracovává Stripe. Údaje karty se odesílají přímo do Stripe a VeVit je neukládá.“

- [x] **Step 1: Implement** stránku a úpravy.
- [ ] **Step 2: Verify** v test mode end-to-end: košík → pokladna → platba kartou `4242 4242 4242 4242` (úspěch), `4000 0027 6000 3184` (3D Secure), `4000 0000 0000 9995` (nedostatek prostředků → česká hláška, nový pokus funguje) → `/store/success` ukáže „zaplaceno“ až po webhooku. Ověř v síťovém panelu, že na `localhost` nikdy neodejde číslo karty ani CVC. `npm run typecheck && npm run lint && npm run test:unit && npm run build` PASS. _(částečně hotovo: testy, typecheck, lint, build zelené; živé ověření se Stripe čeká na klíče a zapnuté raw card data API)_
- [x] **Step 3: Commit** `feat(store): custom payment page replaces Stripe Checkout redirect`

**Předpoklad Task 8:** Stripe support zapnul raw card data API pro test mode (spec kap. 9). Bez toho Stripe vrátí chybu při vytvoření `pm_…`; v tom případě se zastav a nahlas to.
