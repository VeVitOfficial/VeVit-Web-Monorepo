# Fáze 4: Premium přes vlastní bránu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uživatel si koupí Bronze/Silver/Gold (měsíčně/ročně) na vlastní platební stránce VeVit kartou, Apple Pay, Google Pay nebo PayPalem. Předplatné se samo obnovuje a při neúspěšné obnově jde změnit kartu.

**Architecture:** Stripe Billing subscription vzniká jako `default_incomplete` s `automatic_tax` (Stripe Tax, OSS). První fakturu zaplatí stejná brána jako Store (fáze 1, komponenty `CardGateway`, `WalletButton`, `PayPalButton`). Kartu potvrzuje server. Tarif dál aktivuje edge funkce `supabase/functions/stripe-webhook`, rozšířená o tok bez Checkout Session. Managed Payments se ruší.

**Tech Stack:** Next.js 16, React 19, `stripe@22` (Next, API `2026-08-26.dahlia`), Deno edge funkce se `stripe@14.25.0` (API `2024-04-10`, ponechat), Stripe Billing + Tax, account i18n (`src/lib/account-i18n.ts`).

**Spec:** `docs/superpowers/specs/2026-10-20-platebni-brana-a-pokladna-design.md` (kap. 5.8, 5.7 poslední odrážka, fáze 4). Navazuje na fázi 1 (komponenty brány) a fázi 2 (`CompanyFields`, ARES).

## Global Constraints

- Platí Global Constraints fáze 1.
- Účet je vícejazyčný: všechny nové texty přes `t(key, locale)` a klíče v `src/lib/account-i18n.ts` (cs + ostatní jazyky, které soubor obsahuje). Komponenty brány dostanou texty přes props.
- Zápisy v účtu vyžadují CSRF (`csrfValid` z `src/lib/billing.ts`) a `handleAccountRequest`.
- Ceny v `premium_price_catalog` jsou hrubé (včetně DPH), Stripe ceny s `tax_behavior: "inclusive"`; webhook dál porovnává zaplacenou částku s `amount_minor`.
- Hrubá cena stejná pro všechny země; DPH počítá Stripe Tax uvnitř ceny (OSS).
- PayPal u Premia jen když `NEXT_PUBLIC_PREMIUM_PAYPAL === "1"` (Stripe musí schválit opakované platby PayPal).
- `managed_payments` se už nikde neposílá.

## Review Focus

1. 3D Secure u první platby předplatného → po ověření se tarif aktivuje; neúspěch nechá předplatné `incomplete` a nic neaktivuje (ruční ověření v Task 3 kartou `4000 0027 6000 3184`).
2. Dvojklik „Předplatit“ nebo návrat na stránku s rozpracovaným předplatným → znovu se použije existující `incomplete` předplatné, nevznikne druhé (test idempotency klíče v Task 1, reuse v Task 2).
3. Slovenský spotřebitel → stejná hrubá cena, Stripe Tax vypočte 23 % DPH SK; slovenská firma s platným EU DIČ → reverse charge (ověření v Stripe test mode, Task 2).
4. Neúspěšná obnova → uživatel vidí upozornění a změní kartu; po zaplacení dlužné faktury se tarif vrátí (Task 5).
5. Opuštěná platba (zavřené okno) → `incomplete` předplatné do 23 h vyprší a tarif se nikdy neaktivuje (edge funkce ignoruje `incomplete`/`incomplete_expired`, test logiky v Task 4).

---

### Task 1: Čisté moduly Premium

**Files:**
- Create: `src/lib/payments/premium-rules.ts`
- Create: `tests/unit/premium-rules.test.mjs`

**Interfaces:**
- Produces:
  - `EU_COUNTRIES: readonly string[]` (27 kódů ISO-3166 alpha-2, `GR` pro Řecko)
  - `isEuCountry(code: string): boolean`
  - `normalizeEuVatId(input: string): { country: string; value: string } | null` (`"CZ 27082440"` → `{ country: "CZ", value: "CZ27082440" }`, řecké `EL…` → country `GR`, nevalidní tvar → `null`)
  - `subscriptionIdempotencyKey(userId: string, tier: string, cycle: string, attempt: number): string` → `vevit-premium:sub:v1:<userId>:<tier>:<cycle>:<attempt>`

- [ ] **Step 1: Write failing tests** pro všechny čtyři exporty (včetně `isEuCountry("CH") === false`, `normalizeEuVatId("SK2020123456")?.country === "SK"`).
- [ ] **Step 2: Run `npm run test:unit`** — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(premium): EU tax helpers and idempotency keys`

### Task 2: Stripe ceny a serverové endpointy předplatného

**Files:**
- Create: `scripts/stripe-premium-prices.mjs` (vytvoří Stripe Product/Price s `tax_behavior: "inclusive"` a `tax_code` pro digitální službu SaaS podle Stripe Tax, z `tier_prices`, a vypíše SQL pro `premium_price_catalog`; spouští se ručně s `STRIPE_SECRET_KEY`, idempotentně podle `lookup_key` `vevit_<tier>_<cycle>_v2`)
- Create: `src/lib/billing-subscribe.ts` (server)
- Create: `src/app/account/api/billing/subscribe.php/route.ts`
- Create: `src/app/account/api/billing/pay-card.php/route.ts`
- Modify: `src/app/account/api/billing/checkout.php/route.ts` (odpověď `410 { error, code: "USE_PAYMENT_PAGE" }`)
- Modify: `src/lib/turnstile.ts` (`TurnstileAction` + `"premium_payment"`)
- Modify: `docs/DECISIONS.md` (Managed Payments vypnuty, VeVit je prodejce, ceny inclusive, Stripe Tax)

**Interfaces:**
- Consumes: `billingStripe`, `catalogPrice`, `ensureStripeCustomer`, `csrfValid` (`src/lib/billing.ts`), `getUserAccess`, Task 1, `declineMessage` (fáze 1)
- Produces:
  - `startSubscription(session: AccountSession, input: { tier: PaidTier; cycle: BillingCycle; country: string; company: { name: string; vatId: string | null; address: PostalAddress } | null }): Promise<{ subscriptionId: string; clientSecret: string; amountMinor: number; currency: "czk" }>`: aktualizuje zákazníka (`address.country`, u firmy `name`, adresa, `tax_id_data` `eu_vat` když DIČ prošel `normalizeEuVatId`), reuse existující `incomplete` subscription stejné ceny, jinak `subscriptions.create({ customer, items: [{ price }], payment_behavior: "default_incomplete", payment_settings: { save_default_payment_method: "on_subscription" }, automatic_tax: { enabled: true }, metadata: { user_id }, expand: [...] })` s idempotency klíčem z Task 1. Client secret první faktury vezmi podle tvaru API `2026-08-26.dahlia` (ověř v dokumentaci Stripe, v novějších verzích `latest_invoice.confirmation_secret`).
  - `POST /account/api/billing/subscribe.php` `{ tier, billing_cycle, country, company? }` → `200 { subscription, client_secret, amount_minor }` | `409 ALREADY_SUBSCRIBED` | `400` | `503`
  - `POST /account/api/billing/pay-card.php` `{ subscription, payment_method, turnstile_token }` → potvrdí PaymentIntent první faktury s `payment_method` na serveru; `200 { status, client_secret }` | `402 { error: declineMessage(...) }`; rate limit `storeRateLimitConsume("premium_pay_card", <userId>, 10, 600)`

- [ ] **Step 1: Implement** skript, lib a routy (čisté části jsou z Task 1; zbytek je integrace se Stripe).
- [ ] **Step 2: Verify** typecheck, lint, test:unit; v test mode: skript vytvoří ceny, SQL se aplikuje na testovací DB, `subscribe.php` vrátí client secret, opakované volání vrátí stejné `subscription`.
- [ ] **Step 3: Commit** `feat(premium): subscription start and card confirmation endpoints`

### Task 3: Platební stránka Premium

**Files:**
- Create: `src/app/account/(dashboard)/billing/platba/page.tsx`
- Create: `src/components/account/premium-payment.tsx`
- Modify: `src/components/account/sections/billing.tsx` (tlačítko tarifu vede na `/account/billing/platba?tier=…&cycle=…` místo `redirectTo("billing/checkout.php")`)
- Modify: `src/lib/account-i18n.ts`

**Interfaces:**
- Consumes: `CardGateway`, `WalletButton`, `PayPalButton`, `getStripe` (fáze 1), `CompanyFields` (fáze 2), Task 2 endpointy
- Produces: stránka s rekapitulací tarifu (cena s DPH, „obnovuje se měsíčně/ročně, zrušíš kdykoli“), volbou země (výchozí CZ), přepínačem „Kupuji na firmu“ (IČO/ARES pro CZ, jinak ruční název + EU DIČ), volbou metody (karta, Apple Pay, Google Pay, PayPal podle flagu) a bránou. Po úspěchu `/account/billing?checkout=success` (stávající hláška `billing.checkoutSuccess`).

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify** typecheck, lint, build; test mode: `4242…` aktivuje tarif po webhooku (Task 4), `4000 0027 6000 3184` projde přes 3D Secure, `4000 0000 0000 9995` zobrazí českou hlášku a tarif se neaktivuje.
- [ ] **Step 3: Commit** `feat(premium): custom payment page for subscriptions`

### Task 4: Edge funkce stripe-webhook pro nový tok

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts`
- Create: `supabase/functions/stripe-webhook/subscription-state.ts` (čistá funkce, bez Deno API)
- Create: `tests/unit/subscription-state.test.mjs`

**Interfaces:**
- Produces:
  - `subscriptionAction(input: { status: string; storedUserId: string | null; metadataUserId: string | null }): { kind: "activate" | "cancel" | "past_due" | "ignore"; userId: string | null }` (`active`/`trialing` → activate; `past_due`/`unpaid` → past_due; `canceled`/`incomplete_expired` → cancel; `incomplete` → ignore; `userId` = stored ?? metadata)
  - Funkce zpracuje i `customer.subscription.created` a `invoice.payment_failed`. U předplatného bez řádku v `premium_subscriptions` použije `subscription.metadata.user_id` (ověří aktivního uživatele a cenu proti katalogu stejně jako dnes). `invoice.payment_succeeded` / `invoice.paid` dál ověřuje částku proti katalogu. Ponech `stripe@14.25.0` a `apiVersion: "2024-04-10"`.
  - Pokud `premium_subscriptions.status` nepovoluje `past_due`, přidej migraci `supabase/sql/account/025_premium_past_due.sql`.

- [ ] **Step 1: Write failing tests** pro `subscriptionAction` (každý stav + případ bez stored i metadata → `ignore`).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement**; aktualizuj seznam událostí destination v `docs/DECISIONS.md` (`customer.subscription.created`, `invoice.payment_failed`, `invoice.paid`) jako úkol pro provozovatele.
- [ ] **Step 4: Verify** testy PASS; `supabase functions serve stripe-webhook` + `stripe listen --forward-to` a průchod z Task 3 aktivuje tarif.
- [ ] **Step 5: Commit** `feat(premium): webhook handles subscriptions without Checkout`

### Task 5: Změna karty a neúspěšná obnova

**Files:**
- Create: `src/app/account/api/billing/setup-card.php/route.ts` (SetupIntent pro zákazníka, `usage: "off_session"`)
- Create: `src/app/account/api/billing/confirm-setup.php/route.ts` (server potvrdí SetupIntent s `pm_…`, nastaví výchozí metodu zákazníka i předplatného, zaplatí otevřenou fakturu, pokud existuje)
- Create: `src/app/account/(dashboard)/billing/karta/page.tsx`
- Modify: `src/components/account/sections/billing.tsx` (banner při `past_due` s odkazem „Změnit kartu“)
- Modify: `src/app/account/api/subscription.php/route.ts` (vrací i `past_due`)
- Modify: `src/lib/account-i18n.ts`

**Interfaces:**
- Consumes: `CardGateway` (fáze 1), `declineMessage`
- Produces: `POST setup-card.php` → `{ client_secret }`; `POST confirm-setup.php` `{ setup_intent, payment_method, turnstile_token }` → `{ status }` (`requires_action` → klient `stripe.handleNextAction`).

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify** test mode: předplatné s kartou `4000 0000 0000 0341` (karta se uloží, ale každé další strhnutí selže), Stripe test clock posune čas → `past_due` banner → změna karty na `4242…` → tarif aktivní.
- [ ] **Step 3: Commit** `feat(premium): update card and recover past due subscriptions`
