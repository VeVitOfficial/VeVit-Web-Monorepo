# VeVit Store Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Safely evolve the existing PHP/PostgreSQL store into a secure, extensible B2C/B2B e-commerce system while preserving existing products, categories, orders and routes.

**Architecture:** Deliver six independently deployable releases. Release 0 closes payment, authorization and download vulnerabilities before all catalog/UI work. Later releases use expand–migrate–switch–contract database changes, modular PHP services and prebuilt static assets so WEDOS needs only Apache/PHP/PostgreSQL.

**Tech Stack:** PHP 8+, PostgreSQL, PDO, Apache, Stripe Checkout/webhooks, vanilla JavaScript, Tailwind CLI build output or equivalent static CSS, PHPUnit-compatible test runner against test PostgreSQL.

---

## Delivery rules

- Never deploy a migration before a verified database backup and a test copy run.
- Never use client price, localStorage type, order number or raw download token as
  authority.
- Every release has a preflight, deployment smoke test, rollback decision point
  and changelog entry.
- The supplied workspace has unusable Git metadata. Do not claim commits until
  Git is restored; use the published repository clone only for read-only diffing.
- The test database is mandatory for Releases 0–4. Current local PHP lacks
  `pdo_pgsql`, so an environment with that extension is required before a test
  can be marked PASS.

## File map

| Path | Responsibility | First release |
|---|---|---|
| `config.example.php` | non-secret configuration contract | 0 |
| `lib/bootstrap.php` | config, error handler, request ID and dependencies | 0 |
| `lib/http.php` | JSON/method/CORS/error helpers | 0 |
| `lib/session.php` | hardened PHP session startup | 0 |
| `lib/orders/CheckoutService.php` | single validated cart snapshot and pending order creation | 0 |
| `lib/orders/OrderAccessService.php` | guest/user order grants and public IDs | 0 |
| `lib/orders/StockService.php` | idempotent stock movements | 0 |
| `lib/payments/StripeClient.php` | bounded cURL/official SDK adapter | 0 |
| `lib/payments/WebhookService.php` | signed idempotent Stripe events | 0 |
| `lib/downloads/DownloadService.php` | hash token lookup and storage boundary | 0 |
| `database/migrations/*.sql` | forward-only database evolution | 0–4 |
| `database/seeds/*.sql` | idempotent taxonomy/brand seed | 1, 3 |
| `bin/migrate.php` | migration runner | 1 |
| `bin/preflight-migration.php` | backup/DB/version/checksum preflight | 1 |
| `bin/verify-migration.php` | counts/FK/data verification | 1 |
| `lib/catalog/*.php` | catalog read model, search and facets | 3 |
| `lib/b2b/*.php` | inquiry validation, attachment metadata, workflow | 4 |
| `lib/admin/*.php` | policy, form validation and audit trail | 4 |
| `assets/src/*.css`, `assets/src/*.js` | source assets | 2, 5 |
| `assets/dist/store.css`, `assets/dist/store.js` | deployable static assets | 2, 5 |
| `tests/unit/*.php`, `tests/integration/*.php` | regression and DB scenarios | 0–5 |
| `docs/deploy/*.md` | WEDOS deployment/runbook | 0, 6 |

## Release 0 — Security stabilization

**Scope:** Fix the known exploitable checkout/download/webhook paths, harden
sessions and endpoint behavior, remove the broken JavaScript parser failure, and
add test harnesses. No catalog redesign and no breaking schema rewrite.

**Depends on:** Test PostgreSQL DSN, Stripe test secret/webhook secret, a writable
non-public storage path for digital files. The implementation can still prepare
code paths without production credentials.

**Database changes:** `202607290001_security_order_foundation.sql` adds nullable
`public_id`, `checkout_grant_hash`, order totals/snapshots, `download_token_hash`,
`store_webhook_events`, `store_stock_movements`, uniqueness/indexes and updated
timestamps. It backfills public IDs and token hashes in batched transactions.

**Security impact:** Removes SEC-001 through SEC-012 from the audit except SSO,
which remains explicitly deferred until a real VeVit contract exists.

**Risks:** Stripe success URLs and legacy raw download links require a short
compatibility window. The migration must not invalidate an already paid digital
purchase; legacy token lookup stays read-only until expiry, then is removed in a
later release.

### Task 0.1: Establish non-secret configuration and secure bootstrap

**Files:**

- Create: `config.example.php`
- Create: `lib/bootstrap.php`
- Create: `lib/http.php`
- Create: `lib/session.php`
- Modify: `config.php`
- Modify: `.htaccess`
- Test: `tests/unit/session-test.php`, `tests/unit/http-test.php`

- [x] Define the configuration constants: `APP_ENV`, `APP_URL`,
  `APP_STORAGE_PATH`, `DB_DSN`, `DB_USER`, `DB_PASS`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `STORE_ALLOWED_ORIGINS` and `SESSION_COOKIE_SECURE`.

- [x] Replace public DB errors with a generated request ID and server log entry:

```php
catch (Throwable $exception) {
    error_log(sprintf('[%s] %s', $requestId, $exception->getMessage()));
    http_response_code(500);
    exit('Služba je dočasně nedostupná.');
}
```

- [x] Start sessions only through `store_start_session()` with strict mode,
  HttpOnly, `SameSite=Lax`, a fixed path and `Secure` derived from explicit
  configuration rather than from a hard-coded production-only cookie.

- [x] Implement `store_json_error(int $status, string $code, string $message)`
  and `store_require_method(string ...$methods)` so OPTIONS/405 are handled
  before parsing JSON. Allow CORS only when an endpoint explicitly needs an
  allowlisted origin; same-origin endpoints emit no `Access-Control-Allow-Origin`.

- [x] Add `Referrer-Policy: strict-origin-when-cross-origin` and
  `Permissions-Policy: camera=(), microphone=(), geolocation=()` only after
  confirming Apache accepts `Header always set`. Do not add HSTS in this release.

- [x] Run:

```bash
php -l config.php lib/bootstrap.php lib/http.php lib/session.php
php tests/unit/session-test.php
php tests/unit/http-test.php
```

**Acceptance criteria:** Production errors contain no DSN/database text; a wrong
method returns a documented JSON 405; session tests assert cookie flags for HTTPS
and local development configuration.

### Task 0.2: Create a single validated checkout snapshot

**Files:**

- Create: `lib/orders/CheckoutService.php`
- Modify: `api/create-checkout.php`
- Modify: `checkout.php`
- Test: `tests/integration/checkout-snapshot-test.php`

- [x] Write failing unit coverage for active/inactive physical and digital items,
  server-owned prices, stock, backorder, duplicate lines and rollback; prepare a
  PostgreSQL integration test for persisted snapshots and grant hashes.

- [x] Implement `CheckoutService::createSnapshot(array $input, ?array $user, string $sessionId)`:
  normalize unique `(product_id, variant_id)` quantities, reject non-positive or
  over-limit values, load only active/procurable records once with `FOR UPDATE`,
  calculate prices/shipping from database data, and persist a private checkout
  snapshot in one transaction without creating an order or Stripe line item.

- [x] Validate email with `FILTER_VALIDATE_EMAIL`, cap name/note/address fields,
  validate allowed country codes, and reject a physical line whose stock is lower
  than requested unless `allow_backorder` is true.

- [x] Generate a `public_id` using `bin2hex(random_bytes(16))` and store only a
  SHA-256 hash of a session checkout grant. Put the raw grant only in the current
  PHP session under a namespaced pending-order key.

- [ ] Create the Stripe session only after the DB snapshot exists; set an
  idempotency key derived from the order public ID; if Stripe creation fails,
  roll the pending transaction back or mark it `checkout_failed` without exposing
  Stripe internals.

- [ ] Make `success_url` use configured `APP_URL`, never `HTTP_HOST`, and pass
  only the random public identifier / Stripe placeholder required by Stripe.

- [ ] Run:

```bash
bash tests/run-task-0-2.sh
```

**Acceptance criteria:** Active and inactive product lists cannot diverge; client
price changes have no effect; a bounded product is rejected when its currently
available stock is too low; no pre-payment snapshot is reachable through order
pages; later payment tasks re-lock stock before charging.

### Task 0.3: Authorize success pages and digital downloads

**Files:**

- Create: `lib/orders/OrderAccessService.php`
- Create: `lib/downloads/DownloadService.php`
- Modify: `success.php`
- Modify: `download.php`
- Modify: `api/create-checkout.php`
- Test: `tests/integration/order-access-test.php`, `tests/integration/download-test.php`

- [ ] Write a failing test proving `success.php?order=VVS-2026-00001` cannot
  reveal another guest order and cannot reveal a raw digital download token.

- [ ] Resolve success orders by `public_id`; authorize only an authenticated
  owner or matching checkout grant in the current session. Return 404 for an
  unknown/unauthorized order and show pending payment honestly until the paid
  state exists.

- [ ] Store `hash('sha256', $rawToken)` in `download_token_hash`; compare hashes
  with `hash_equals`; atomically increment the download count with a predicate:

```sql
UPDATE store_order_items
SET download_count = download_count + 1
WHERE id = :id AND download_count < :max_downloads
RETURNING download_count;
```

- [ ] Resolve files from `APP_STORAGE_PATH/downloads`; use `realpath`, require
  the resolved file to start with that directory plus separator, and deny missing
  or non-regular files. Do not concatenate a database path directly to web root.

- [ ] Preserve active legacy raw links only through their original expiration;
  record a migration report of remaining legacy tokens and remove the fallback in
  a scheduled contract release.

- [ ] Run:

```bash
php tests/integration/order-access-test.php
php tests/integration/download-test.php
```

**Acceptance criteria:** Sequential order numbers never authorize reads; unpaid
orders never download; five concurrent/serial download attempts permit at most
five streams; traversal attempts return 404.

### Task 0.4: Make Stripe webhook and inventory idempotent

**Files:**

- Create: `lib/payments/StripeClient.php`
- Create: `lib/payments/WebhookService.php`
- Create: `lib/orders/StockService.php`
- Modify: `api/webhook.php`
- Modify: `lib/stripe-php/init.php` or replace it after compatibility tests
- Test: `tests/integration/webhook-idempotency-test.php`, `tests/fixtures/stripe/*.json`

- [ ] Add fixtures for valid `checkout.session.completed`, duplicate delivery,
  invalid signature, stale timestamp and refund events.

- [ ] Fail closed when `STRIPE_WEBHOOK_SECRET` is absent. Parse `t=`/`v1=` using
  `hash_equals`, reject timestamps outside the configured tolerance, and never
  return provider diagnostic text to the caller.

- [ ] Insert `(provider, event_id, payload_hash, received_at)` into
  `store_webhook_events` under a unique constraint before state processing. A
  duplicate event returns 200 without mutating orders or stock.

- [ ] In one transaction, lock the order by `stripe_session_id`, verify currency,
  expected amount and paid payment status, then perform the conditional update:

```sql
UPDATE store_orders
SET payment_status = 'paid', status = 'paid', stripe_payment_intent = :intent
WHERE id = :id AND payment_status = 'pending'
RETURNING id;
```

- [ ] For each physical item returned by that update, insert a negative movement
  with unique `(order_item_id, movement_type = 'sale')`; derive current stock
  from the guarded movement/level service. Never subtract again outside this
  service.

- [ ] Configure cURL connect/overall timeouts, capture transport failures safely,
  and include Stripe request IDs only in server logs.

- [ ] Run:

```bash
php tests/integration/webhook-idempotency-test.php
```

**Acceptance criteria:** Invalid/missing signature performs no mutation; two
identical valid webhook deliveries yield one paid transition and one stock
movement; a refund is recorded without an invented restock.

### Task 0.5: Correct existing defects and admin access boundaries

**Files:**

- Modify: `assets/js/store.js`
- Modify: `assets/js/app.js`
- Modify: `admin/auth.php`
- Modify: `admin/middleware.php`
- Modify: `admin/orders.php`
- Modify: `admin/products.php`
- Test: `tests/unit/javascript-syntax-test.sh`, `tests/integration/admin-auth-test.php`

- [ ] Repair the apostrophe entry in the JavaScript HTML escape map and replace
  API-derived `innerHTML` card rendering with DOM construction or retire the
  unused module after confirming no page imports it.

- [ ] Make toast text use `textContent` rather than an HTML sink.

- [ ] Bootstrap admin through the same safe session/config layer; import `h()` or
  replace the error render with escaped text; add a CSRF token to its POST login
  form and persistent login rate limiting.

- [ ] Execute the prepared SELECT before reading order notes, fix malformed
  product type select options, and give destructive product deactivation a
  confirmation dialog plus audit event.

- [ ] Run:

```bash
node --check assets/js/store.js
node --check assets/js/app.js
php tests/integration/admin-auth-test.php
```

**Acceptance criteria:** every shipped JavaScript file parses; invalid admin login
renders a safe error; note append preserves existing notes; no trusted API data
enters an HTML parsing sink.

### Release 0 deployment and rollback

- Preflight: test DB backup restore, Stripe test endpoint configured, new storage
  directory permissions verified, migration dry-run clean.
- Deploy migration and PHP/asset release atomically under maintenance mode.
- Smoke: guest checkout with one physical + one digital test product, duplicate
  webhook fixture, unauthorized success URL, download limit, admin invalid login.
- Rollback: revert code release and restore DB snapshot only if a data-changing
  migration cannot be forward-fixed. Do not restore after real production orders
  are accepted without reconciling them first.

## Release 1 — Data and migration stabilization

**Scope:** Add migration tooling, make seed repeatable, synchronize docs to
PostgreSQL and preserve/report existing data.

**Files:** create `database/migrations/`, `database/seeds/`, `bin/migrate.php`,
`bin/preflight-migration.php`, `bin/verify-migration.php`,
`docs/deploy/database-migrations.md`; modify `schema.sql`, `config.example.php`,
`docs/superpowers/specs/2026-04-07-vevit-store-ecommerce-design.md`.

**Database changes:** `store_schema_migrations`; timestamps/indexes for existing
tables; idempotent taxonomy seed uses `INSERT ... ON CONFLICT (slug) DO UPDATE`
only for curated non-user fields and never changes a product/order.

### Task 1.1: Build forward-only migration runner

- [ ] Add a failing test with two numbered SQL files and assert first run applies
  both, second run applies none, and a changed applied checksum aborts.
- [ ] Implement runner transaction protocol: acquire PostgreSQL advisory lock,
  read SQL sorted by version, verify SHA-256, execute one file in a transaction,
  then insert version/checksum/applied timestamp.
- [ ] Implement `--dry-run` listing and `--target=VERSION` only for applying up
  to a version, never for downgrade.
- [ ] Run `php tests/integration/migration-runner-test.php`.

### Task 1.2: Convert baseline and seed safely

- [ ] Split current schema into immutable historical baseline documentation and
  forward migration files; do not re-run raw `schema.sql` against production.
- [ ] Rewrite all taxonomy seed statements as deterministic upserts keyed by
  slug, preserving manual category names/descriptions when a `seed_locked` flag
  is set.
- [ ] Add verifier queries for count of products, orders, order items, categories
  and orphaned foreign keys before/after migration.
- [ ] Run dry-run/apply/reapply on a restored anonymized copy and archive the
  verifier output with deployment record.

**Acceptance criteria:** the same seed executes twice without error or duplicate;
all pre-existing order/product IDs remain stable; docs consistently say PostgreSQL.

### Release 1 deployment and rollback

- Deploy runner and docs before any complex catalog migration.
- Run on database copy, then production maintenance window with backup hash.
- Rollback is verified snapshot restore; additive migrations remain harmless if
  forward fixes are safer.

## Release 2 — Production technical foundation

**Scope:** Remove runtime Tailwind Play dependency, centralize layout and move
shared inline behavior into maintainable asset modules while retaining current
routes and functional catalog/checkout.

**Files:** create `tailwind.config.js`, `assets/src/store.css`,
`assets/src/modules/*.js`, `assets/dist/store.css`, `assets/dist/store.js`,
`lib/layout.php`; modify `package.json`, `lib/tw_config.php`, `lib/header.php`,
`lib/footer.php`, `index.html`/new `index.php`, public pages, admin pages,
`.htaccess`.

**Dependencies:** Release 0 must be deployed first because the new shared layout
inherits its secure session/error/asset behavior.

### Task 2.1: Produce static CSS

- [ ] Add a build script that scans `*.php`, `*.html` and JS module sources and
  writes a minified `assets/dist/store.css` committed/deployed as static output.
- [ ] Verify every current utility used by public/admin pages is present in the
  output before removing CDN scripts.
- [ ] Replace `https://cdn.tailwindcss.com` with the built stylesheet; pin or
  self-host fonts/icons according to licensing decision.
- [ ] Run build, compare key page screenshots, and serve the output with
  long-lived cache headers plus filename/version query strategy.

### Task 2.2: Consolidate shell and JavaScript

- [ ] Create head, header, footer, mobile navigation and accessible modal partials
  from the existing PHP versions; migrate homepage from static `index.html` to
  `index.php` without changing `/`.
- [ ] Replace inline `onclick`/`onsubmit` with module event listeners and scoped
  data attributes; preserve login, cart badge and banner behavior.
- [ ] Add skip link, focus return/modal trap, Escape handling and reduced-motion
  CSS.
- [ ] Run page smoke tests at 320, 375, 430, 768, 1024, 1280, 1440 and 1920 px.

**Acceptance criteria:** no page loads Tailwind Play CDN; `/`, catalog, product,
cart, checkout and admin share the same token system; no console syntax error;
WEDOS serves only PHP and static files.

### Release 2 deployment and rollback

- Upload compiled assets before templates that reference them.
- Smoke test no-CDN page load on a cache-cleared mobile browser.
- Rollback by restoring previous templates plus assets; DB unchanged.

## Release 3 — Catalog domain, categories, brands and filters

**Scope:** Implement the extensible catalog data model, professional filtering,
availability logistics, brand pages and public read model. Do not expose
suppliers or commercial costs.

**Files:** create `lib/catalog/CatalogRepository.php`, `CatalogQuery.php`,
`FacetService.php`, `CategoryTree.php`, `BrandRepository.php`,
`api/search-suggestions.php`, `brands.php`, `brand.php`; modify `catalog.php`,
`api/products.php`, `api/categories.php`, `api/brands.php`, `product.php`,
`lib/helpers.php`; create migrations `202607290003` and `202607290004`; tests in
`tests/integration/catalog-*.php`.

**Database changes:** extend categories/products; add brands, product categories,
suppliers, warehouses, offers, availability fields, indexes and idempotent seeds.

### Task 3.1: Migrate categories and brands

- [ ] Test that a product mapped to a child category appears under each ancestor
  filter and that inactive categories/brands are excluded publicly.
- [ ] Add `store_brands` and `store_product_categories`; backfill one primary
  category from old `category_id` and brand records from non-empty legacy text.
- [ ] Insert required user-specified taxonomy and sample brands with inactive
  state unless a real product references them; do not add partner claims.
- [ ] Add safe category/brand admin service interfaces, but defer their UI to
  Release 4.

### Task 3.2: Add suppliers, warehouses and availability

- [ ] Add internal suppliers, warehouses, supplier offers, availability fields
  and explicit country/lead time validation.
- [ ] Map each public availability state to text derived from actual values, e.g.
  Czech stock + dispatch max 1 yields „Skladem v ČR – odesíláme do 24 hodin“.
- [ ] Assert public API payloads never include supplier names, links, costs,
  notes, MOQ or certifications.

### Task 3.3: Build faceted catalog and search

- [ ] Normalize/allowlist all query parameters and build PDO placeholders only;
  hardcode every SQL identifier/order expression from a server allowlist.
- [ ] Implement recursive category scope, brand, price min/max, availability,
  country, in-stock, sale, free shipping, novelty/recommended, rating and dynamic
  attribute filters.
- [ ] Return counts/chips/pagination with stable URL state; implement a desktop
  collapsible sidebar and mobile dialog with „Zobrazit X produktů“.
- [ ] Add debounced autocomplete with a minimum query length, rate limit and
  separate suggestions for products/categories/brands.
- [ ] Run combined filter, empty state, URL restore, injection and 10k+ price
  regression tests.

**Acceptance criteria:** a 20 000 Kč product appears without a max price filter;
all declared filter combinations are server-backed; a child category query finds
descendants; internal supplier data is absent from public responses.

### Release 3 deployment and rollback

- Apply additive migrations and backfill; leave old reads active behind a feature
  flag until verifier counts match.
- Enable new catalog read path, then clear flag to return to old catalog if UI
  issues appear. Do not drop compatibility columns in this release.

## Release 4 — Variants, wishlist, B2B and administration

**Scope:** Add sellable variants, dynamic attributes, authenticated/local wishlist
merge, B2B inquiries, supplier/inventory/admin management, role policies and
audit records.

**Files:** create `lib/catalog/VariantService.php`, `AttributeService.php`,
`lib/wishlist/WishlistService.php`, `lib/b2b/InquiryService.php`,
`admin/categories.php`, `admin/brands.php`, `admin/suppliers.php`,
`admin/inventory.php`, `admin/inquiries.php`; modify `admin/*`, `product.php`,
`cart.php`, `checkout.php`, `api/*`; create migration `202607290005`; tests in
`tests/integration/variant-*.php`, `wishlist-*.php`, `b2b-*.php`, `admin-*.php`.

**Database changes:** variants, attribute definitions/options/values/category
assignments, stock levels/movements, wishlist, B2B inquiry/items/attachments,
admin role/audit tables.

### Task 4.1: Implement variants and attribute values

- [ ] Test variant-specific SKU, sale price, stock, image and availability
  override behavior.
- [ ] Add exact-one-target inventory constraints and migrate non-variant legacy
  stock into product-level inventory records.
- [ ] Render only selectable valid combinations; cart identity becomes
  `(product_id, variant_id)` and checkout revalidates it.

### Task 4.2: Implement wishlist

- [ ] Store anonymous favorites in localStorage only as product/variant IDs.
- [ ] Add authenticated DB endpoints with CSRF/session checks; merge local IDs
  server-side at login idempotently and report unavailable items without failure.
- [ ] Test duplicate merge, removed product, logout and badge counts.

### Task 4.3: Implement B2B inquiries and secured attachments

- [ ] Validate organization/contact/ICO/phone/email fields with length limits,
  CSRF, honeypot and rate limit; do not query external registries.
- [ ] Store attachments outside web root after MIME/content inspection, UUID file
  name, size limit and admin-only download authorization.
- [ ] Implement statuses `new`, `contacted`, `preparing_offer`, `offer_sent`,
  `accepted`, `rejected`, `closed` with audited transitions.

### Task 4.4: Expand administration securely

- [ ] Replace one boolean admin session with accounts/roles or document a
  constrained single-admin fallback until identities are provided.
- [ ] Add server-side search, filters, paging, bulk action allowlists and
  destructive-action confirmation/CSRF for every module.
- [ ] Make supplier/offer/cost fields impossible to serialize from public
  repositories; add a regression test for response field allowlists.

**Acceptance criteria:** variants are first-class purchasable records; wishlist
survives login safely; B2B uploads cannot execute or traverse; admin actions are
authorized, CSRF-protected and audited.

### Release 4 deployment and rollback

- Migrate schemas and deploy admin pages behind role checks; enable public
  wishlist/B2B only after attachment storage smoke test.
- Disable feature routes/flags for rollback; preserve new records and use forward
  fixes rather than deleting B2B/supplier data.

## Release 5 — Premium VeVit storefront redesign and purchase UX

**Scope:** Apply the approved visual system to homepage, navigation, catalog,
product cards/detail, account shell, cart and checkout. Preserve all server
contracts established in Releases 0–4.

**Files:** modify `assets/src/store.css`, layout/header/footer, `index.php`,
`catalog.php`, `product.php`, `cart.php`, `checkout.php`, `success.php`; create
component partials under `lib/views/`; modify public JS modules; visual/browser
tests in `tests/browser/`.

**Database changes:** optional homepage/banner configuration only after an admin
content model is agreed. No product/order data rewrite is allowed for visual work.

### Task 5.1: Design tokens and shared navigation

- [ ] Encode colors, spacing, radii, shadows, typography, transitions and z-index
  tokens in one CSS source.
- [ ] Build keyboard/touch safe mega menu: Catalog, Schools, Office, IT,
  brands, offers, B2B, search, account, wishlist, cart; Escape closes it and
  no mouse-gap closes it unexpectedly.
- [ ] Make mobile bottom navigation contain Home, Categories, Search,
  Favorites/Account and Cart with safe-area spacing.

### Task 5.2: Homepage and catalog presentation

- [ ] Implement truthful hero, quick categories, availability entries,
  recommendations, discounts, B2B panel, brands and VeVit products using real
  data/fallback empty states.
- [ ] Rebuild product cards with image dimensions, availability badges, brand,
  discount, delivery and semantic non-nested interactive controls.
- [ ] Add catalog chip UX and mobile filter drawer on top of Release 3 query API.

### Task 5.3: Detail, cart and checkout UX

- [ ] Build gallery, variants, genuine delivery text, parameters, documents,
  related/recent products and B2B quantity CTA from real fields only.
- [ ] Separate digital/physical fulfillment groups in cart; show server-confirmed
  price/delivery at checkout and company fields without inventing registry data.
- [ ] Test keyboard/modal/mobile overflow and reduced motion on every purchase
  step.

**Acceptance criteria:** no hard shadows remain in redesigned public components;
all primary controls meet contrast/focus/touch requirements; design never makes a
delivery/stock claim absent from data.

### Release 5 deployment and rollback

- Deploy CSS/assets before template changes and visual-regression compare all
  target widths.
- Rollback by serving previous template/asset release; domain data and order flow
  are unchanged.

## Release 6 — SEO, operational QA and WEDOS handoff

**Scope:** Finish SEO, performance, accessibility, QA automation, deployment
documentation and production verification.

**Files:** create `robots.txt`, `sitemap.php` or static generator,
`lib/seo.php`, `docs/deploy/wedos.md`, `docs/deploy/rollback.md`,
`docs/testing/qa-matrix.md`; modify `.htaccess`, layouts and CI/build scripts.

### Task 6.1: SEO and performance

- [ ] Generate canonical/title/description/Open Graph/Twitter and JSON-LD from
  actual product/category/brand data.
- [ ] Add Product/BreadcrumbList/Organization/WebSite SearchAction only when
  required fields exist; filtered pages use canonical/noindex policy.
- [ ] Add sitemap entries only for active canonical pages and robots policy;
  verify no staging/test URLs appear.
- [ ] Measure CSS/JS/image payload, LCP/CLS and API query counts on mobile.

### Task 6.2: Execute QA matrix and deployment rehearsal

- [ ] Run PHP lint, JS syntax, migration tests, checkout/webhook/download
  regressions, catalog integration tests and admin authorization tests.
- [ ] Browser-test all public flows at 320, 375, 430, 768, 1024, 1280, 1440,
  1920 px; record console errors, broken assets, keyboard traversal and 404s.
- [ ] Rehearse WEDOS upload with static assets, secret configuration outside web
  root, writable storage permissions, cron/backup assumptions and rollback.
- [ ] Perform a Stripe test-mode payment and signed webhook against staging;
  document results rather than claiming unrun checks.

**Acceptance criteria:** QA matrix contains test, method, result and issue status;
WEDOS runbook is executable by another maintainer; production release checklist
has a named backup/rollback point.

## Cross-release test strategy

| Layer | Tooling | Mandatory scenarios |
|---|---|---|
| Unit | PHP CLI assertions | configuration, session, token hashing, price formatting, URL/query normalizers |
| DB integration | disposable PostgreSQL schema | migrations, FK/indexes, checkout snapshot, stock movement, webhook idempotence, facets |
| HTTP integration | PHP server + test DB | methods, CORS, CSRF, auth, IDOR, download, rate limits |
| Browser | Playwright or equivalent static-browser runner | responsive navigation, filters, modal, cart/checkout, keyboard, console/404s |
| Payment | Stripe test mode fixtures | signed event, duplicate event, wrong amount, payment failure, refund |
| Manual QA | documented matrix | accessibility, Czech copy, truthfulness of availability and WEDOS smoke |

## Decisions requiring user input

These are the only decisions that cannot be safely inferred:

1. VeVit central authentication contract and test access.
2. WEDOS plan capabilities: `pdo_pgsql`, external PostgreSQL connectivity,
   writable storage path, PHP version and cron availability.
3. Stripe test/production configuration and business rules for shipping, refunds,
   countries and VAT.
4. Approved file-storage and e-mail provider for downloads/B2B attachments.
5. Legal/company content: operator identity, privacy, terms, returns and contact.
6. Approved real product, supplier, brand, image, certificate and availability
   data. Brand seeds remain inactive until this exists.

## Plan self-review

- Scope coverage: Releases 0–6 map to the approved required ordering: security,
  migrations, technical foundation, domain, catalog, visual redesign, then QA.
- Data preservation: every migration is additive/backfilled/verified before a
  read switch; orders and existing product IDs are retained.
- Security: checkout, IDOR, download, webhook and stock tests occur before
  catalog/UI changes.
- Unsupported integrations: VeVit SSO, email, registries and supplier feeds are
  explicitly gated by missing contracts rather than fabricated.
- Placeholder scan: this document contains no unassigned implementation task;
  external inputs are listed as blockers rather than implied work.
