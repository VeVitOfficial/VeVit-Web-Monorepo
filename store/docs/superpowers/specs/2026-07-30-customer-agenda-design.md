# VeVit Store Customer Agenda Design

**Date:** 2026-07-30

## Goal

Add customer order delivery, claims, returns, case attachments, favorites, and a temporary audited administration workflow to VeVit Store without creating a second order model or weakening Release 0 checkout, payment, download, guest-grant, or inventory protections.

## Existing baseline

The project uses direct PHP PDO access to PostgreSQL/Supabase. The existing order model is `store_orders`, `store_order_items`, and `store_products`; Release 0 also provides checkout snapshots, guest-grant hashes, `OrderAccessService`, payment event ledger, inventory movements, and download entitlements. New business services must use these existing tables and must not call the unfinished VeVit Account HTTP API.

`store_orders.public_id` is generated as `bin2hex(random_bytes(16))`, so all new public IDs use the same 32 lowercase hexadecimal characters and `CHAR(32)` database type.

## Architecture

Use a modular PHP monolith with focused services and repositories:

```text
lib/auth/          AuthContext, ActorContext, factory, unavailable VeVit adapter
lib/claims/        claim policy, state machine, repository, service
lib/returns/       return policy, state machine, repository, service
lib/delivery/      delivery state machine, repository, service
lib/attachments/   attachment policy, repository, service, local private storage
lib/favorites/     repository and service
lib/audit/         actor normalization, audit service, correlation ID
lib/admin/         legacy admin actor and mutation façade
```

HTTP endpoints only validate transport input, enforce method/CSRF/rate limits, construct an actor, call one service, and render a safe response. Views issue no SQL. Services own their transaction boundaries. Repositories own SQL. No module updates another module's tables directly: cross-domain amount reads go through a narrow read-only availability repository.

`store_audit_events` is a technical ledger, not a generic case engine. Claims, returns, and delivery retain separate relational tables, state machines, and event histories.

## Auth and actors

### AuthContext

`AuthContext` exposes authenticated state, stable user ID, verified email only when provided by a verified provider contract, roles only when verified, auth source, and verification timestamp. `AnonymousAuthContext` is the default. `VeVitAccountAuthContext` is an unavailable/fail-closed adapter until the VeVit Account team supplies a server-to-server verified session contract.

Business services receive `AuthContext` or an immutable `ActorContext`; they never read a client user ID, cookie, query string, or VeVit Account URL themselves.

### Actor types

| Actor type | Required fields | Authorization use |
|---|---|---|
| `customer_account` | stable `actor_user_id`, verified source, verification time | Account ownership only |
| `customer_guest` | no user ID; order is reauthorized through `OrderAccessService` and its server-session grant | One exact order only |
| `legacy_shared_admin` | `actor_user_id = NULL`, session audit hash, `auth_source = legacy_admin_session` | Temporary admin mutation authority |
| `system` | no human identity; named safe source and correlation ID | Scheduled/internal effects only |

`public_id` is never authorization. A guest grant is never stored in claim/return tables and is revalidated for every access. Historical guest orders without a valid grant are fail-closed. Account lists, favorites, profile/address work, and cross-order lookup are unavailable without an authenticated `AuthContext`.

### Temporary admin identity

Successful legacy admin login creates at least 128 bits of random audit material in the server session. Only a SHA-256 hash or opaque audit ID reaches the database. It survives ordinary requests, is replaced after explicit reauthentication/login according to the documented session regeneration rule, and is destroyed at logout. No cookie, password, raw token, submitted email, or client user ID is logged.

Admin mutation routes use POST, CSRF, allowed-origin handling where the existing helper supports it, rate limiting, one central service call, a correlation ID, state-machine validation, optimistic version check, and append-only audit. Bulk operations, identity/permission management, audit deletion, unrestricted exports, and irreversible deletion remain unavailable. Rejection, attachment revocation, and manual delivery correction require recent password verification. A refund cannot be marked confirmed without server-side payment/refund evidence; this release has no automatic Stripe refund workflow.

## Database design

All new timestamps are `TIMESTAMPTZ NOT NULL DEFAULT now()` unless stated otherwise. All state columns are `VARCHAR` with table-specific `CHECK`; no new PostgreSQL enum is introduced. IDs are `BIGSERIAL` except the existing `INT` order/item/product IDs referenced by FKs.

### Existing-order support constraints

Add `UNIQUE (order_id, id)` to `store_order_items`. This is the target of every `(order_id, order_item_id)` FK. No order table is created.

### `store_claims`

| Column | Type / rule |
|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` |
| `public_id` | `CHAR(32) NOT NULL UNIQUE`, lowercase hex generated server-side |
| `order_id` | `INT NOT NULL REFERENCES store_orders(id) ON DELETE RESTRICT` |
| `owner_type` | `VARCHAR(16) NOT NULL CHECK (owner_type IN ('account','guest'))` |
| `owner_user_id` | `TEXT NULL` logical future VeVit ID reference |
| `reason_code` | `VARCHAR(64) NOT NULL` |
| `problem_description` | `TEXT NOT NULL` |
| `requested_resolution` | `VARCHAR(32) NOT NULL CHECK (requested_resolution IN ('repair','replacement','refund','store_credit','other'))` |
| `status` | claim-state CHECK below; default `submitted` |
| `customer_note`, `internal_note` | `TEXT NULL`, never selected together for customer responses |
| `idempotency_scope_hash`, `idempotency_key_hash`, `request_hash` | `CHAR(64) NOT NULL`, SHA-256 hex |
| `version` | `INT NOT NULL DEFAULT 1 CHECK (version > 0)` |
| `created_at`, `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` |
| `closed_at` | `TIMESTAMPTZ NULL` |
| `audit_metadata` | `JSONB NULL`, only safe server-generated metadata |

Constraints: `UNIQUE (id, order_id)`, `UNIQUE (idempotency_scope_hash, idempotency_key_hash)`, owner consistency CHECK `((owner_type = 'account' AND owner_user_id IS NOT NULL) OR (owner_type = 'guest' AND owner_user_id IS NULL))`, and claim state CHECK. Indexes: `(order_id, created_at DESC)`, `(status, updated_at DESC)`, and partial `(owner_user_id, created_at DESC) WHERE owner_type = 'account'`.

### `store_claim_items`

`id BIGSERIAL PRIMARY KEY`; `claim_id INT NOT NULL`; `order_id INT NOT NULL`; `order_item_id INT NOT NULL`; `requested_quantity INT NOT NULL CHECK (requested_quantity > 0)`; `approved_quantity INT NULL CHECK (approved_quantity > 0 AND approved_quantity <= requested_quantity)`; `consumed_quantity INT NOT NULL DEFAULT 0 CHECK (consumed_quantity >= 0 AND consumed_quantity <= COALESCE(approved_quantity, requested_quantity))`; item reason, requested resolution, and nullable resolution outcome.

FK `(claim_id, order_id) REFERENCES store_claims(id, order_id) ON DELETE RESTRICT`; FK `(order_id, order_item_id) REFERENCES store_order_items(order_id, id) ON DELETE RESTRICT`; `UNIQUE(claim_id, order_item_id)`; index `(order_item_id)`.

### `store_claim_events`

`id BIGSERIAL PRIMARY KEY`, `public_id CHAR(32) UNIQUE`, `claim_id INT NOT NULL REFERENCES store_claims(id) ON DELETE RESTRICT`, action, nullable old/new claim state, normalized actor fields, `public_message TEXT NULL`, `internal_note TEXT NULL`, nullable idempotency key hash, non-null correlation ID, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, and safe `audit_metadata JSONB NULL`. Index `(claim_id, created_at DESC)`. Application code inserts but never updates/deletes events.

Every domain event and audit ledger row uses the same actor-consistency CHECK: account actor requires non-null actor user ID and verified account source; guest actor has null actor user ID and a guest-grant/session source; `legacy_shared_admin` has null actor user ID and non-null session audit ID; system actor has null user/session IDs and a non-empty system source. The check rejects any other actor type. Event repository queries for a customer never select `internal_note`.

### `store_returns`

Same identifiers, owner constraint, idempotency columns, `version`, timestamps, `(id, order_id)`, and indexes as claims. It additionally has `reason_code VARCHAR(64)`, `return_shipping_method VARCHAR(64) NULL`, `return_tracking_number VARCHAR(255) NULL`, `return_tracking_url TEXT NULL` (only validated HTTPS/allowlisted use), `decision VARCHAR(32) NULL`, `refund_status VARCHAR(32) NOT NULL DEFAULT 'not_requested'`, `customer_note`, `internal_note`, `received_at`, `inspected_at`, and `completed_at`.

`refund_status` is one of `not_requested`, `not_applicable`, `pending`, `requires_action`, `failed`, `confirmed`. `confirmed` requires server-side evidence recorded by an approved future payment workflow; no browser or admin boolean can produce it.

### `store_return_items` and `store_return_events`

Return items mirror claim-item FKs and uniqueness. They hold `requested_quantity > 0`, `received_quantity >= 0`, `inspected_quantity >= 0`, and `consumed_quantity >= 0`, each bounded by requested quantity; service transitions enforce the stricter relationship between received, inspected, approval, and consumption. Return events mirror claim events and use `ON DELETE RESTRICT` plus `(return_id, created_at DESC)` index.

### `store_deliveries`, `store_delivery_items`, `store_delivery_events`

`store_deliveries` is 1:N from order: `id BIGSERIAL PRIMARY KEY`, `public_id CHAR(32) UNIQUE`, `order_id INT NOT NULL REFERENCES store_orders(id) ON DELETE RESTRICT`, `carrier_code VARCHAR(64) NULL`, `carrier_name VARCHAR(128) NULL`, `shipping_method VARCHAR(64) NULL`, `tracking_number VARCHAR(255) NULL`, `tracking_url TEXT NULL`, `shipped_at`, `estimated_delivery_at`, `delivered_at`, `last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `status`, customer-facing message, internal note, `version INT NOT NULL DEFAULT 1`, timestamps, audit metadata, and `UNIQUE(id, order_id)`. Tracking number receives a non-unique partial index only; carriers may reuse values.

`store_delivery_items` holds `delivery_id`, `order_id`, `order_item_id`, `shipped_quantity INT NOT NULL CHECK (shipped_quantity > 0)`, composite parent/item FKs, and `UNIQUE(delivery_id, order_item_id)`. The Delivery service locks order items and refuses a cumulative shipped quantity above purchased quantity.

Delivery events mirror the append-only envelope. Delivery state: `pending`, `prepared`, `handed_to_carrier`, `in_transit`, `delivered`, `delivery_exception`, `cancelled`.

### `store_case_attachments`

`id BIGSERIAL PRIMARY KEY`; `public_id CHAR(32) NOT NULL UNIQUE`; exactly one of `claim_id INT NULL REFERENCES store_claims(id) ON DELETE RESTRICT` or `return_id INT NULL REFERENCES store_returns(id) ON DELETE RESTRICT`; uploader actor metadata; `storage_provider VARCHAR(32) NOT NULL CHECK (storage_provider = 'local_private')`; `storage_key VARCHAR(512) NOT NULL`; `stored_filename VARCHAR(128) NOT NULL`; `original_filename VARCHAR(255) NOT NULL`; `detected_mime VARCHAR(127) NOT NULL`; `byte_size BIGINT NOT NULL CHECK (byte_size > 0)`; `sha256 CHAR(64) NOT NULL`; `scan_status VARCHAR(32) NOT NULL DEFAULT 'not_configured'`; upload/delete/revoke timestamps and reasons; idempotency scope/key/request hash; timestamps and audit metadata.

Checks enforce claim XOR return, `storage_key ~ '^[a-z0-9][a-z0-9/_-]{0,511}$'`, `storage_key !~ '(^|/)\\.\\.(/|$)'`, known scan status, and coherent soft-deleted/revoked fields. `UNIQUE(storage_provider, storage_key)` and idempotency uniqueness are required. Indexes target `(claim_id, created_at DESC)` and `(return_id, created_at DESC)`. Files are never cascade-deleted by a parent delete.

### `store_product_favorites`

`user_id TEXT NOT NULL`, `product_id INT NOT NULL REFERENCES store_products(id) ON DELETE RESTRICT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `PRIMARY KEY(user_id, product_id)`, plus `(user_id, created_at DESC)`. There is no DB FK to an unverified external user table; creation requires authenticated `AuthContext`. Inactive products remain historical but are hidden from the public favorites list.

### `store_audit_events`

Append-only technical ledger: `id BIGSERIAL PRIMARY KEY`, event public ID, entity type and internal ID, action, outcome, old/new state, normalized actor fields, correlation ID, safe request fingerprint/idempotency hash, sanitized IP/user-agent only if enabled, safe metadata, and `created_at TIMESTAMPTZ`. It stores no customer content uploads, cookies, raw grants, passwords, bearer tokens, or raw request payloads. Retention is documented as a deployment policy; no ordinary endpoint deletes it.

## Quantity invariant

```text
eligible_quantity =
  purchased_quantity
  - final_claim_consumed_quantity
  - final_return_consumed_quantity
  - active_claim_reserved_quantity
  - active_return_reserved_quantity
```

Claim reservation states are `submitted`, `under_review`, `waiting_for_customer`, `accepted`. Return reservation states are `requested`, `approved`, `waiting_for_goods`, `received`, `inspected`, `refund_pending`.

`consumed_quantity` only becomes non-zero through an authorized final resolution: a resolved claim with an actual approved remedy, or a completed return whose received/inspected quantity is accepted. A partial approval sets approved/received/inspected values and consumes only the final accepted part; the unapproved remainder is released. Rejected/cancelled cases must retain zero consumed quantity and release their active reservation. A resolved/completed consumed quantity stays deducted, so a later claim cannot reuse the same unit. A return following a claim, or vice versa, sees the same locked aggregate and is rejected if insufficient quantity remains.

The customer may submit a request; only a permitted admin transition confirms consumption. Both create and relevant state transitions lock the affected order items with `SELECT ... FOR UPDATE`, calculate both active and final aggregates across claims and returns, insert the event/audit record, and commit as one transaction. Two concurrent requests for the final unit cannot both commit.

## State machines

Claims: `submitted → under_review|waiting_for_customer|cancelled`; `under_review → waiting_for_customer|accepted|rejected|cancelled`; `waiting_for_customer → under_review|accepted|rejected|cancelled`; `accepted → resolved|cancelled`; terminal `rejected`, `resolved`, `cancelled`. `resolved` requires resolution outcome and coherent approved/consumed quantities. Same-state requests are documented no-ops and do not create duplicate business effects; a distinct event may record an idempotent replay only in the technical audit.

Returns: `requested → approved|rejected|cancelled`; `approved → waiting_for_goods|cancelled`; `waiting_for_goods → received|cancelled`; `received → inspected`; `inspected → refund_pending|completed|rejected`; `refund_pending → completed`; terminal `rejected`, `completed`, `cancelled`. A refund failure or action requirement keeps the return in `refund_pending` and changes only `refund_status` to `failed` or `requires_action`; it cannot claim completion. `received` requires `received_at`; `inspected` requires `inspected_at`; `completed` requires `completed_at` and either non-refund decision, `not_applicable`, or confirmed server-side refund evidence.

Delivery: `pending → prepared|cancelled`; `prepared → handed_to_carrier|cancelled`; `handed_to_carrier → in_transit|delivery_exception`; `in_transit → delivered|delivery_exception`; `delivery_exception → prepared|handed_to_carrier|cancelled`; terminal `delivered`, `cancelled`. `handed_to_carrier` requires carrier/tracking or explicit carrier-free method and `shipped_at`; `delivered` requires `delivered_at`. All non-no-op changes use expected version and add domain event plus audit.

## Attachments and local private storage

Use the existing local `APP_STORAGE_PATH`, outside the web root, with a dedicated `case-attachments/` subtree. `LocalPrivateStorage` accepts only JPEG, PNG, WebP, and PDF after `finfo` detection; default limits come from `CASE_ATTACHMENT_MAX_BYTES`, `CASE_ATTACHMENT_MAX_FILES`, and `CASE_ATTACHMENT_ALLOWED_MIME`. The original extension and path are never trusted. It generates an independent random stored filename and a relative internal key; no absolute path is persisted.

Upload requires POST, session/guest-grant or account authorization of the concrete parent case, CSRF, bounded request/file count/file size, server-side MIME detection, checksum, locked parent count check, and an idempotency key. The service writes to a private temporary file, atomically places it, inserts metadata/event/audit in a transaction, and removes the placed file on database failure. Storage failure occurs before metadata insertion. File content is never logged.

Download uses a POST CSRF-protected endpoint with the attachment public ID only, then reauthorizes the parent case/order. It canonicalizes the derived path and verifies it remains inside the configured storage root; it sends safe disposition, escaped normalized filename, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-store`, and refuses deleted/revoked/disallowed scan state attachments. Knowing a filename or public ID alone is insufficient.

No Supabase Storage implementation is added in this release. A later alternative must use a private bucket and short-lived PHP-issued signed URLs or PHP streaming, never a public bucket or browser service-role key.

## Customer and admin surfaces

Account pages: My Orders, order detail, claims list/detail/create, returns list/detail/create, and favorites. Until verified VeVit Account server authentication exists, account lists and favorites render a safe unavailable state; no local session is fabricated.

Guest pages accept only a concrete order public ID held with the existing server-session grant: order detail, delivery view, claim/return detail/create, related attachments, and digital download keep using `OrderAccessService`. Guests cannot list all orders/cases.

Admin adds claim, return, and delivery lists/details; filter by status; customer response; internal note; attachment list; delivery tracking edit; and temporary shared-account warning. Every mutation delegates to the domain service. Internal notes are excluded from customer repository DTOs and templates.

## Supabase and migration policy

PHP uses direct PDO, never `anon` or `authenticated` database roles. RLS is defense in depth, not application authorization. The migration enables RLS on every new public table and conditionally revokes table privileges from `anon` and `authenticated`; it creates no public policy and no fake `auth.uid()` mapping. It does not assume Data API defaults and documents optional dashboard-level Data API disablement for this server-only model.

Migration order:

1. `202607300001_customer_agenda_preflight.sql`: read-only catalog/data report.
2. Verified PostgreSQL backup gate.
3. `202607300002_customer_agenda_up.sql`: one PostgreSQL transaction for additive constraints, tables, indexes, RLS, and grants.
4. PostgreSQL fixture and integration tests, including idempotent rerun.
5. Application code, security tests, and Release 0 regression suite.

The preflight reports real table/column/type data, enum values, FKs, indexes, proposed-name collisions, public-ID shape, invalid quantities, status inconsistencies, guest-grant anomalies, and tracking duplicates. The down script refuses to remove non-empty customer tables; production rollback is backup restore plus application rollback in a service window. No down migration silently destroys customer/audit data.

## Future VeVit Account contract

Before account functionality can be activated, the identity provider must specify a server-to-server session mechanism, authenticated request/response and signature model, stable user ID, verified-email semantics, roles, expiry, timeout, logout/session revocation, CSRF and CORS responsibilities, allowed return URLs, error/outage behavior, and a test environment. This is a blocking follow-up task; the adapter remains unavailable until it is independently reviewed and tested.

## Verification strategy

Unit tests cover contexts, actors, state machines, policies, idempotency comparison, safe storage paths, MIME handling, and amount calculations. PostgreSQL integration tests cover all FKs/CHECKs/indexes/RLS/grants, races, rollback, and migration rerun. HTTP tests cover method/CSRF/authorization/rate limit behavior. Architecture tests prevent SQL in customer views, direct VeVit Account calls in business modules, direct state updates outside services, and filesystem writes outside storage. The existing Release 0 suite remains mandatory.

## Design self-review — 2026-07-30

| Review risk | Result |
|---|---|
| Order item from another order | Addressed by `UNIQUE(order_id, id)` and composite parent/item FKs. |
| Duplicate claim/return of amount | Addressed by locked cross-domain aggregate, active reservation, final consumption, and idempotency. |
| Claim plus return for final unit | Addressed by one item lock and combined aggregate; exactly one transaction may reserve it. |
| Releasing consumed quantity twice | Addressed by explicit non-negative `consumed_quantity`, final-state-only mutation, and versioned state machine. |
| Invalid owner combination | Addressed by exact account/guest owner CHECK. |
| Attachment with zero/two parents | Addressed by XOR CHECK and parent `RESTRICT` FKs. |
| Download by public ID alone | Addressed by parent case/order reauthorization, CSRF POST, and canonical private storage path. |
| Direct Supabase Data API access | Addressed by RLS plus conditional revoke from `anon`/`authenticated`, with no policy. |
| Lost update | Addressed by expected-version atomic update; row lock is limited to amount computation. |
| Idempotency replay with different body | Addressed by request hash comparison and conflict response. |
| Partial business commit without event | Addressed by a single service-owned transaction for row mutation, event, and technical audit. |
| Internal note in customer response | Addressed by separate repository DTOs; customer queries exclude internal columns. |
| Unintended cascade | Addressed by `ON DELETE RESTRICT` for cases, events, attachments, and delivery relationships. |
| Audit-history deletion | Addressed by no delete endpoint and append-only repository contract. |
| False refund confirmation | Addressed by server-evidence-only `refund_status = confirmed`; refund workflow is out of scope. |
| Delivery without required time | Addressed by state-machine preconditions for handoff and delivered transitions. |

The review found one Important issue: the first draft incorrectly named `requires_action` as a return state. It was corrected before planning: it is now only a `refund_status`, and the return remains `refund_pending` until valid completion evidence exists. No Critical issues remain.
