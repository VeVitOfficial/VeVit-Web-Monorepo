# VeVit Store Customer Agenda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver secure customer claims, returns, delivery, case attachments, favorites, and temporary audited administration without duplicating the existing Release 0 order model.

**Architecture:** A modular PHP monolith uses service-owned PDO transactions, repositories for SQL, state machines for transitions, an unavailable-by-default AuthContext, existing OrderAccessService for guest grants, and private local attachment storage. PostgreSQL holds explicit relational constraints, while PHP remains the primary authorization layer.

**Tech Stack:** PHP 8, PDO PostgreSQL/Supabase, existing session/CSRF/rate-limit helpers, local private filesystem storage, PHP integration and unit test scripts.

---

## File structure

Create `migrations/202607300001_customer_agenda_preflight.sql`, `migrations/202607300002_customer_agenda_up.sql`, guarded down/restore documentation, PostgreSQL fixtures/tests, auth/audit/domain modules under `lib/`, JSON endpoints under `api/`, account/guest pages, and admin pages. Existing `store_orders`, `store_order_items`, `store_products`, `OrderAccessService`, `lib/http.php`, `lib/session.php`, and Release 0 tests are extended but not replaced.

### Task 1: Freeze baseline and preflight report

**Files:** Create `migrations/202607300001_customer_agenda_preflight.sql`; modify `migrations/README.md`; test `tests/integration/customer-agenda-preflight-postgres-test.php`.

- [ ] Write a PostgreSQL fixture containing Release 0 schema plus deliberately invalid historical rows permitted by older constraints.
- [ ] Write the read-only report using `pg_class`, `information_schema.columns`, `pg_constraint`, `pg_indexes`, `pg_type/pg_enum`, `to_regclass`, and anomaly queries for public IDs, guest-grant shape, order item quantity, statuses, tracking duplicates, and proposed-name collisions.
- [ ] Run `php tests/integration/customer-agenda-preflight-postgres-test.php`; expect report queries to execute without mutations.
- [ ] Document `psql "$DB_DSN" -v ON_ERROR_STOP=1 -f migrations/202607300001_customer_agenda_preflight.sql` and the backup gate.
- [ ] Rollback: none; this migration is read-only.
- [ ] Acceptance: output shows actual tables, columns/types, enums, FKs, indexes, collisions, and anomalies.

### Task 2: AuthContext and actor primitives

**Files:** Create `lib/auth/AuthContext.php`, `lib/auth/AnonymousAuthContext.php`, `lib/auth/VeVitAccountAuthContext.php`, `lib/auth/AuthContextFactory.php`, `lib/auth/ActorContext.php`; test `tests/unit/auth-context-test.php`.

- [ ] Write failing tests for anonymous state, ignored client user ID, missing configuration, provider timeout/invalid response, and a mock verified context.
- [ ] Implement the contract:

```php
interface AuthContext { public function isAuthenticated(): bool; public function userId(): ?string; public function verifiedEmail(): ?string; public function hasRole(string $role): bool; public function source(): string; public function verifiedAt(): ?DateTimeImmutable; }
```

- [ ] Make `VeVitAccountAuthContext` return unavailable/anonymous until a separately verified server contract exists; it must not read cookies or call a provider from business services.
- [ ] Rollback: remove only new library files before any endpoint depends on them.
- [ ] Acceptance: account-only calls fail closed and services can receive a mock context.

### Task 3: Legacy admin actor and recent reauthentication

**Files:** Create `lib/admin/LegacyAdminActor.php`, `lib/admin/AdminMutationGuard.php`; modify `admin/auth.php`, `admin/middleware.php`; test `tests/unit/legacy-admin-actor-test.php`.

- [ ] On successful password verification create `$_SESSION['_store_admin_audit_raw'] = bin2hex(random_bytes(32))`; persist only its SHA-256 in actors/events.
- [ ] Add `requireRecentAdminAuthentication()` with a configured five-minute window and password recheck; destroy the value on logout.
- [ ] Test different sessions yield different hashes, no cookie/password appears in audit payload, unauthenticated/expired mutation is rejected.
- [ ] Rollback: revert the admin-only files; no customer data exists yet.
- [ ] Acceptance: every legacy mutation actor is exactly `legacy_shared_admin`, has null user ID, and has an opaque session audit ID.

### Task 4: Migration core constraints and technical audit schema

**Files:** Create `migrations/202607300002_customer_agenda_up.sql`; test `tests/integration/customer-agenda-migrations-postgres-test.php`.

- [ ] First add `UNIQUE (order_id, id)` to `store_order_items` after preflight proves no collision.
- [ ] Create `store_audit_events` with append-only envelope, actor CHECK, correlation ID, and indexes; use `ON DELETE RESTRICT` on referenced business rows.
- [ ] Include all changes in one `BEGIN; … COMMIT;` migration and execute it twice in the integration test.
- [ ] Rollback: guarded down script refuses non-empty `store_audit_events`; restore is the production rollback.
- [ ] Acceptance: composite FK targets exist and no audit object permits cascade deletion.

### Task 5: Claims schema and PostgreSQL constraints

**Files:** Modify `migrations/202607300002_customer_agenda_up.sql`; create `tests/integration/claims-schema-postgres-test.php`.

- [ ] Add `store_claims`, `store_claim_items`, and `store_claim_events` exactly as designed: owner CHECK, claim-state CHECK, `version`, idempotency hashes, composite FK targets, item uniqueness, positive/bounded quantities, event actor CHECK, and indexes.
- [ ] Test foreign item/order rejection, invalid owner/state/quantity rejection, duplicate item/idempotency rejection, and `RESTRICT` delete behavior.
- [ ] Rollback: guarded down refuses customer claim/event rows.
- [ ] Acceptance: no claim item can reference an item outside its parent order.

### Task 6: Returns schema and refund-evidence safeguards

**Files:** Modify up migration; create `tests/integration/returns-schema-postgres-test.php`.

- [ ] Add `store_returns`, `store_return_items`, `store_return_events` with separate state/refund checks and the same owner/idempotency/composite FK model.
- [ ] Test `requires_action` is a refund status, not a return status; test all received/inspected/consumed bounds.
- [ ] Rollback: guarded down refuses non-empty return tables.
- [ ] Acceptance: schema cannot represent a negative, over-requested, or cross-order return item.

### Task 7: Delivery schema and partial-shipment mapping

**Files:** Modify up migration; create `tests/integration/delivery-schema-postgres-test.php`.

- [ ] Add `store_deliveries`, `store_delivery_items`, `store_delivery_events`; keep order-to-delivery 1:N and tracking index non-unique.
- [ ] Test `shipped_quantity > 0`, composite item FK, duplicate delivery item rejection, and multiple deliveries for one order.
- [ ] Rollback: guarded down refuses delivery rows.
- [ ] Acceptance: the database represents split shipments without a second order model.

### Task 8: Attachment and favorites schema, RLS, grants

**Files:** Modify up migration; create `tests/integration/attachments-favorites-rls-postgres-test.php`; modify `config.example.php`.

- [ ] Add attachments with parent XOR, safe-key CHECK, unique provider/key, checksums, scan/revoke/delete fields and idempotency; add favorites with `PRIMARY KEY(user_id, product_id)`.
- [ ] Add `APP_STORAGE_PATH` with an absolute non-secret example plus concrete non-secret defaults for `CASE_ATTACHMENT_MAX_BYTES`, `CASE_ATTACHMENT_MAX_FILES`, `CASE_ATTACHMENT_ALLOWED_MIME`, `RETURN_REQUEST_DAYS`, and the admin reauthentication window.
- [ ] Enable RLS and conditionally revoke table privileges from existing `anon`/`authenticated` roles; add no public policy.
- [ ] Test API roles cannot select new tables and favorites uniqueness holds.
- [ ] Rollback: guarded down refuses attachment/favorite data; remove only empty tables in test DB.
- [ ] Acceptance: PHP direct-PDO behavior remains documented and Data API is not an authorization route.

### Task 9: Auth/audit repositories and transaction helper

**Files:** Create `lib/audit/AuditService.php`, `lib/audit/AuditActor.php`, `lib/database/Transactional.php`; test `tests/unit/audit-service-test.php`.

- [ ] Implement one `withinTransaction(PDO $pdo, Closure $operation)` wrapper that commits only after domain event and technical audit insert succeed and rolls back otherwise.
- [ ] Implement normalized actor/event insertion without raw secret fields.
- [ ] Test rollback on event/audit failure and actor-field validation.
- [ ] Acceptance: controllers never open multi-step business transactions.

### Task 10: Claims state machine, repository, and amount availability

**Files:** Create `lib/claims/ClaimStateMachine.php`, `lib/claims/ClaimRepository.php`, `lib/claims/ClaimService.php`, `lib/orders/CaseQuantityAvailability.php`; tests `tests/unit/claim-state-machine-test.php`, `tests/integration/claim-service-postgres-test.php`.

- [ ] Write tests for every allowed/forbidden transition, expected-version conflict, owner access, duplicate submit, partial resolution, and no internal-note customer DTO.
- [ ] Query active claims and returns plus final consumed quantities after locking `store_order_items FOR UPDATE`; calculate the documented invariant.
- [ ] Implement create as authorize → lock → availability → insert case/items → domain event → audit → commit.
- [ ] Acceptance: concurrent claim/return final-unit test permits one reservation only.

### Task 11: Returns state machine, repository, and amount integration

**Files:** Create `lib/returns/ReturnStateMachine.php`, `lib/returns/ReturnRepository.php`, `lib/returns/ReturnService.php`; tests `tests/unit/return-state-machine-test.php`, `tests/integration/return-service-postgres-test.php`.

- [ ] Test allowed transitions, delivery/physical-item eligibility, configured return window, partial inspection, refund-pending behavior, and no false refund confirmation.
- [ ] Reuse the read-only quantity availability interface; never update claims or payment ledger tables.
- [ ] Acceptance: resolved claim consumption prevents an overlapping later return and vice versa.

### Task 12: Delivery service and tracking policy

**Files:** Create `lib/delivery/DeliveryStateMachine.php`, `lib/delivery/DeliveryRepository.php`, `lib/delivery/DeliveryService.php`, `lib/delivery/TrackingUrlPolicy.php`; tests `tests/unit/delivery-state-machine-test.php`, `tests/integration/delivery-service-postgres-test.php`.

- [ ] Test required timestamps, expected version, cumulative shipment quantity, no payment mutation, and HTTPS/allowlisted tracking URL rendering.
- [ ] Implement delivery mutations with event/audit/transaction and optional recent-admin guard supplied by controller.
- [ ] Acceptance: customer DTO contains no internal delivery note.

### Task 13: Private attachment storage and service

**Files:** Create `lib/attachments/LocalPrivateStorage.php`, `lib/attachments/AttachmentRepository.php`, `lib/attachments/AttachmentService.php`; tests `tests/unit/local-private-storage-test.php`, `tests/integration/attachment-service-postgres-test.php`.

- [ ] Test valid JPEG/PDF, MIME spoofed PHP, oversized request/file, double extension, traversal, DB failure cleanup, storage failure cleanup, revoked attachment, and foreign case access.
- [ ] Use `finfo`, random names, temporary private files, canonical root verification, SHA-256, bounded count under parent lock, and transactional metadata/event/audit.
- [ ] Acceptance: no executable format is stored or streamed; no absolute path reaches an API response.

### Task 14: Favorites service

**Files:** Create `lib/favorites/FavoriteRepository.php`, `lib/favorites/FavoriteService.php`; tests `tests/unit/favorite-service-test.php`, `tests/integration/favorite-service-postgres-test.php`.

- [ ] Test anonymous failure, mock authenticated success, active-product validation, idempotent add, remove, and listing without inactive products.
- [ ] Use only `AuthContext::userId()`; reject user IDs supplied by client input.
- [ ] Acceptance: repeated add creates one row and unauthenticated access is fail-closed.

### Task 15: Customer and guest HTTP endpoints

**Files:** Create `api/claims/create.php`, `api/claims/detail.php`, `api/returns/create.php`, `api/returns/detail.php`, `api/delivery/detail.php`, `api/attachments/upload.php`, `api/favorites/add.php`, `api/favorites/remove.php`, `api/favorites/list.php`; modify bootstrap; tests `tests/integration/customer-agenda-http-test.php`.

- [ ] For every mutation call `store_require_method`, CORS policy, `store_require_csrf`, rate limiter, strict bounded request parsing, actor factory, and exactly one service method.
- [ ] Use existing `OrderAccessService` for guest routes and no guest list endpoint.
- [ ] Acceptance: GET mutations, missing CSRF, foreign order/grant, and account-only calls without identity fail safely.

### Task 16: Authorized attachment download

**Files:** Create `case-attachment.php`; test `tests/integration/case-attachment-download-test.php`.

- [ ] Require POST plus CSRF; look up only attachment public ID; authorize parent claim/return through its order; canonicalize server-derived local path; stream with `nosniff`, private no-store, and safe disposition.
- [ ] Acceptance: public ID/path traversal/revoked attachment cannot retrieve a file.

### Task 17: Central admin mutation routes and pages

**Files:** Create `lib/admin/AdminMutationService.php`, `api/admin/claims/update.php`, `api/admin/returns/update.php`, `api/admin/deliveries/update.php`, `admin/claims.php`, `admin/returns.php`, `admin/deliveries.php`; tests `tests/integration/admin-mutation-test.php`.

- [ ] Controllers build `legacy_shared_admin` actor only after admin session, CSRF, rate limit, and sensitive-action reauth checks; then invoke domain service.
- [ ] Add clear legacy shared-account notice and no bulk/destructive/refund-confirm endpoints.
- [ ] Test no admin session, no CSRF, invalid transition, duplicate submit, concurrent transition, audit actor/session, rate limit, logout invalidation, and sensitive action fail-closed.
- [ ] Acceptance: admin endpoints contain no direct business-state SQL.

### Task 18: Customer graphical pages and accessible controls

**Files:** Create `orders.php`, `order.php`, `claims.php`, `claim.php`, `my-returns.php`, `return.php`, `favorites.php`; modify `product.php`, shared header/footer/CSS/JS; tests `tests/integration/customer-pages-smoke-test.php`.

- [ ] Render shared layout, mobile/desktop order/delivery/case timelines, safe empty/unavailable states, CSRF-bearing forms, attachment forms, and accessible favorite button state.
- [ ] Keep SQL out of templates by using page controllers/repositories; account pages show unavailable rather than creating a local identity; guest pages require exact existing session grant.
- [ ] Acceptance: internal notes and storage keys do not occur in customer HTML.

### Task 19: Architecture/security/regression gates

**Files:** Create `tests/unit/customer-agenda-architecture-test.php`, `tests/run-customer-agenda.sh`; modify `tests/run-task-0-4.sh` only to include non-destructive new tests after review.

- [ ] Static checks reject SQL in customer views, VeVit Account URL in business modules, direct filesystem operations outside attachments storage, and direct domain status SQL in endpoints.
- [ ] Run unit tests, PostgreSQL integration tests against a test-only DSN, attachment security tests, and all Release 0 tests.
- [ ] Acceptance: test runner refuses non-test database DSN and reports every required security scenario.

### Task 20: Operations documentation and commit-ready review

**Files:** Modify `migrations/README.md`, `docs/deploy/configuration.md`; create `docs/vevit-account-server-contract.md`, `docs/audits/2026-07-30-customer-agenda-security-review.md`.

- [ ] Document preflight, backup, apply order, verification, guarded-down/restore, all manual configuration values, local storage permissions/retention, Data API/RLS expectations, legacy admin limitation, and future VeVit Account server contract requirements.
- [ ] Run `git diff --check`, secret scan, full test suite, migration rerun, and a focused security review before staging only task-owned files.
- [ ] Acceptance: documentation contains no production credentials, deployment is explicitly excluded, and the final commit is ready only after all gates pass.

## Plan self-review

Coverage maps one-to-one to preflight, existing-core constraints, claims, returns, delivery, attachments, favorites, audit, RLS/grants, PostgreSQL tests, repositories, services, state machines, quantity invariant, HTTP, admin, UI, security, Release 0 regression, and documentation. The plan uses no new order table, has guarded rollback for each data-bearing module, and keeps up migration execution blocked until this plan is approved.
