# Fáze 5: Faktury přes Fakturoid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Každá zaplacená objednávka Store a každá zaplacená faktura předplatného Premium dostane daňový doklad z Fakturoidu, odeslaný zákazníkovi e-mailem. Vratka nebo refundace vystaví opravný doklad.

**Architecture:** Čisté buildery převádějí objednávku / Stripe fakturu na payload Fakturoidu (sazby DPH, firma, OSS). Vystavení běží jako úlohy v `payment_jobs` (fáze 2), takže výpadek Fakturoidu nezdrží webhook ani nevytvoří duplicitu. ID dokladu se ukládá před odesláním e-mailu.

**Tech Stack:** Next.js 16, TypeScript, Fakturoid API v3 (OAuth client credentials), Supabase PostgREST, Deno edge funkce (zařazení úloh Premium), Node 26 `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-20-platebni-brana-a-pokladna-design.md` (kap. 5.9, fáze 5). Navazuje na fáze 2 (`payment_jobs`, `vat_rate`), 3 (`markOrderPaid`) a 4 (Premium).

## Global Constraints

- Platí Global Constraints fáze 1.
- Proměnné: `FAKTUROID_CLIENT_ID`, `FAKTUROID_CLIENT_SECRET`, `FAKTUROID_ACCOUNT_SLUG`, `FAKTUROID_NUMBER_FORMAT_ID` (číselná řada pro e-shop a Premium), `FAKTUROID_USER_AGENT` (`VeVit (info@vevit.cz)`). Prázdné v `.env.example`.
- API: token `POST https://app.fakturoid.cz/api/v3/oauth/token` (`grant_type=client_credentials`, HTTP Basic), data `https://app.fakturoid.cz/api/v3/accounts/{slug}/…`, hlavička `User-Agent` povinná. Přesná pole ověř v `https://www.fakturoid.cz/api/v3`.
- Ceny ve VeVit jsou s DPH; faktura musí sedět na haléř s tím, co zákazník zaplatil.
- Sazby DPH Store z `store_products.vat_rate` (0/12/21), doprava sazbou nejvyšší sazby fyzických položek v objednávce. Premium: sazba a země ze Stripe Tax na zaplacené faktuře.
- OSS: Premium spotřebitel s fakturační zemí v EU mimo CZ → `oss: "service"`; jinak `"disabled"`. Firma s platným EU DIČ mimo CZ → reverse charge podle Stripe faktury (sazba 0, text „Daň odvede zákazník“).
- Žádná faktura se nevystaví dvakrát: unikátní úloha `(kind, ref)` + uložené `fakturoid_invoice_id` kontrolované před vytvořením.

## Review Focus

1. Opakované spuštění úlohy po výpadku mezi vytvořením faktury a uložením jejího ID → nevznikne druhá faktura (handler nejdřív hledá fakturu podle `custom_id` = ref, test v Task 1 na `custom_id`).
2. Smíšený košík s položkami 21 % a 12 % + doprava → součty řádků po zaokrouhlení přesně rovny `total_minor` (test v Task 1).
3. Částečná refundace → opravný doklad jen na refundovanou částku (test v Task 1).
4. Firma bez DIČ (neplátce) → na faktuře IČO, bez DIČ (test v Task 1).
5. Fakturoid nedostupný 6× za sebou → úloha `failed`, objednávka zůstane zaplacená a chyba je vidět v `payment_jobs.last_error` (pokrývá backoff z fáze 2, ruční ověření v Task 3).

---

### Task 1: Buildery dokladů (čisté)

**Files:**
- Create: `src/lib/fakturoid/invoice-payload.ts`
- Create: `tests/unit/invoice-payload.test.mjs`

**Interfaces:**
- Produces:
  - `type InvoiceLine = { name: string; quantity: number; unitPriceWithVatMinor: number; vatRate: 0 | 12 | 21 | number }`
  - `type InvoiceSubject = { customId: string; name: string; email: string; street: string | null; city: string | null; zip: string | null; country: string; registrationNo: string | null; vatNo: string | null }` (`customId` = `user:<id>`, `ico:<ico>` nebo `email:<sha256 emailu>`)
  - `orderInvoiceInput(order: { publicId: string; orderNumber: string; customerName: string; customerEmail: string; billingCompany: CompanyInfo | null; billingAddress: PostalAddress | null; shippingMinor: number; totalMinor: number; paidAt: string; paymentMethod: string }, items: Array<{ name: string; quantity: number; unitPriceMinor: number; vatRate: number; type: "physical" | "digital" }>): { subject: InvoiceSubject; lines: InvoiceLine[]; customId: string; oss: "disabled"; paidAt: string }` (`customId` = `store:<publicId>`; řádek „Doprava“ jen když `shippingMinor > 0`)
  - `subscriptionInvoiceInput(inv: { stripeInvoiceId: string; userId: string; email: string; name: string; country: string; company: { name: string; vatId: string | null; registrationNo: string | null; address: PostalAddress } | null; tierLabel: string; cycle: "monthly" | "yearly"; amountPaidMinor: number; taxRate: number; reverseCharge: boolean; paidAt: string }): { subject: InvoiceSubject; lines: InvoiceLine[]; customId: string; oss: "service" | "disabled"; paidAt: string }` (`customId` = `premium:<stripeInvoiceId>`)
  - `correctionInput(original: { fakturoidInvoiceId: number; customId: string }, refund: { refundId: string; amountMinor: number; totalMinor: number }, lines: InvoiceLine[]): { correctionId: number; customId: string; lines: InvoiceLine[] }` (záporné řádky; při částečné refundaci jeden řádek „Částečné vrácení platby“ se sazbou nejvyšší sazby původních řádků; `customId` = `refund:<refundId>`)
  - `linesTotalMinor(lines: InvoiceLine[]): number`

- [ ] **Step 1: Write failing tests**: objednávka 2× 69000 (21 %) + 1× 29900 (12 %) + doprava 6900 → `linesTotalMinor === totalMinor`; firma bez DIČ → `vatNo: null`, `registrationNo` IČO; Premium SK spotřebitel → `oss: "service"`, `vatRate: 23`; Premium CZ → `oss: "disabled"`, `vatRate: 21`; SK firma s DIČ a `reverseCharge: true` → `vatRate: 0`, `oss: "disabled"`; částečná refundace 10000 z 144800 → jeden řádek `-10000`; `customId` formáty přesně podle Interfaces.
- [ ] **Step 2: Run `npm run test:unit`** — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(invoices): Fakturoid payload builders`

### Task 2: Klient Fakturoid

**Files:**
- Create: `src/lib/fakturoid/client.ts` (server)
- Modify: `.env.example`

**Interfaces:**
- Consumes: Task 1 typy
- Produces:
  - `fakturoidToken(): Promise<string>` (cache do expirace − 60 s)
  - `findInvoiceByCustomId(customId: string): Promise<{ id: number } | null>`
  - `upsertSubject(subject: InvoiceSubject): Promise<number>` (hledá podle `custom_id`, jinak vytvoří)
  - `createInvoice(input: { subjectId: number; customId: string; lines: InvoiceLine[]; oss: "service" | "disabled"; paidAt: string; correctionOf?: number }): Promise<{ id: number; number: string }>` (ceny řádků jako ceny s DPH podle volby Fakturoidu pro zadávání cen včetně DPH; `number_format_id` z env; opravný doklad `document_type: "correction"` + `correction_id`)
  - `markInvoicePaid(id: number, paidAt: string, amountMinor: number): Promise<void>` (payments endpoint)
  - `sendInvoiceEmail(id: number): Promise<void>` (message endpoint, šablona Fakturoidu)
  - Chyby HTTP ≥ 500 a síť → throw (úloha se zopakuje); 4xx → throw s tělem odpovědi zkráceným na 500 znaků (bez osobních údajů v logu)

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify** typecheck, lint; s testovacím účtem Fakturoid (nebo sandbox účtem provozovatele) skript `node --env-file=.env.local -e '…'` vytvoří kontakt, fakturu, označí ji zaplacenou. Ověř ve Fakturoidu ručně.
- [ ] **Step 3: Commit** `feat(invoices): Fakturoid API client`

### Task 3: Úlohy vystavení dokladů a napojení

**Files:**
- Create: `supabase/sql/store/migrations/202610200006_invoices_up.sql` (+ `_down.sql`), README
- Create: `supabase/sql/account/026_premium_invoices.sql`
- Modify: `src/lib/jobs/payment-jobs.ts` (`JobKind` + `"fakturoid_order_invoice" | "fakturoid_subscription_invoice" | "fakturoid_correction"`, handlery)
- Modify: `src/lib/store-order-payment.ts` (`markOrderPaid` zařadí `fakturoid_order_invoice`, ref `order.public_id`)
- Modify: `supabase/functions/stripe-webhook/index.ts` (po zaplacené faktuře předplatného vloží řádek do `payment_jobs`, kind `fakturoid_subscription_invoice`, ref Stripe invoice id, payload s údaji z Task 1 `subscriptionInvoiceInput`, sazba a země z `invoice.total_tax_amounts`/tax rate)
- Modify: `src/lib/store-webhook-processor.ts` (`charge.refunded` → přechod `paid → refunded` při plné refundaci, zařazení `fakturoid_correction` s ref refund id; částečná refundace jen úloha)
- Modify: `src/app/store/[page]/page.tsx` (sekce „Faktury“: faktura chodí e-mailem automaticky po zaplacení, i s firemními údaji)
- Modify: `docs/DECISIONS.md` (události `charge.refunded` pro destination Store)

**Interfaces:**
- Consumes: Task 1, Task 2, `enqueueJob`, `runDueJobs` (fáze 2)
- Produces:
  - Migrace: `store_orders.fakturoid_invoice_id bigint`, `store_orders.fakturoid_invoice_number varchar(32)`; `public.premium_invoices(stripe_invoice_id text primary key, user_id uuid not null, fakturoid_invoice_id bigint, fakturoid_invoice_number varchar(32), amount_minor int not null, tax_country char(2), tax_rate numeric(5,2), created_at timestamptz default now())` s RLS jen service role a GRANT pro edge funkci podle vzoru `021_revoke_client_access_account_tables.sql`.
  - Handler pořadí (každý): `findInvoiceByCustomId` → když existuje, jen doplň uložené ID a skonči; jinak `upsertSubject` → `createInvoice` → **ulož ID** → `markInvoicePaid` → `sendInvoiceEmail`.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify** typecheck, lint, test:unit, build; test mode end-to-end: zaplacená objednávka Store (firma Alza z ARES) → faktura ve Fakturoidu s IČO/DIČ, zaplacená, e-mail odešel; Premium SK spotřebitel → faktura v režimu OSS 23 %; refundace ve Stripe Dashboardu → opravný doklad; dvojí ruční spuštění `/api/jobs/run` nevytvoří duplicitu; vypnutý Fakturoid (špatný secret) → úloha s chybou a backoffem, objednávka zaplacená.
- [ ] **Step 3: Commit** `feat(invoices): automatic invoices and corrections via Fakturoid`
