BEGIN;

-- Additive only. Historical orders are deliberately marked as legacy/unknown;
-- this migration never infers that an old order was paid.
ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check;
ALTER TABLE store_orders
    ADD CONSTRAINT store_orders_status_check CHECK (status IN (
        'pending', 'pending_checkout', 'awaiting_payment', 'paid', 'processing',
        'shipped', 'delivered', 'cancelled', 'refunded', 'manual_review'
    ));

ALTER TABLE store_orders
    ADD COLUMN IF NOT EXISTS checkout_snapshot_id BIGINT NULL
        REFERENCES store_checkout_snapshots(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS checkout_request_hash CHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(24) NOT NULL DEFAULT 'legacy_unknown',
    ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(24) NOT NULL DEFAULT 'legacy_unknown',
    ADD COLUMN IF NOT EXISTS subtotal_minor BIGINT NULL,
    ADD COLUMN IF NOT EXISTS shipping_minor BIGINT NULL,
    ADD COLUMN IF NOT EXISTS total_minor BIGINT NULL,
    ADD COLUMN IF NOT EXISTS stripe_checkout_url TEXT NULL,
    ADD COLUMN IF NOT EXISTS stripe_session_status VARCHAR(24) NULL,
    ADD COLUMN IF NOT EXISTS stripe_session_attempt INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stripe_session_expires_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS payment_evidence_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS payment_effects_applied_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS manual_review_reason VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS audit_metadata JSONB NULL;

ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_payment_status_check;
ALTER TABLE store_orders ADD CONSTRAINT store_orders_payment_status_check CHECK (
    payment_status IN ('legacy_unknown', 'pending_checkout', 'awaiting_payment', 'paid', 'failed', 'cancelled', 'refunded', 'manual_review')
);
ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_fulfillment_status_check;
ALTER TABLE store_orders ADD CONSTRAINT store_orders_fulfillment_status_check CHECK (
    fulfillment_status IN ('legacy_unknown', 'pending', 'ready', 'processing', 'fulfilled', 'cancelled', 'manual_review')
);
ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_minor_totals_check;
ALTER TABLE store_orders ADD CONSTRAINT store_orders_minor_totals_check CHECK (
    (subtotal_minor IS NULL OR subtotal_minor >= 0)
    AND (shipping_minor IS NULL OR shipping_minor >= 0)
    AND (total_minor IS NULL OR total_minor >= 0)
);

ALTER TABLE store_order_items
    ADD COLUMN IF NOT EXISTS variant_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS unit_price_minor BIGINT NULL,
    ADD COLUMN IF NOT EXISTS line_total_minor BIGINT NULL,
    ADD COLUMN IF NOT EXISTS stock_context JSONB NULL,
    ADD COLUMN IF NOT EXISTS digital_content_path VARCHAR(500) NULL;
ALTER TABLE store_order_items DROP CONSTRAINT IF EXISTS store_order_items_minor_values_check;
ALTER TABLE store_order_items ADD CONSTRAINT store_order_items_minor_values_check CHECK (
    quantity > 0
    AND (unit_price_minor IS NULL OR unit_price_minor > 0)
    AND (line_total_minor IS NULL OR line_total_minor > 0)
) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_store_orders_checkout_snapshot
    ON store_orders(checkout_snapshot_id) WHERE checkout_snapshot_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_store_orders_stripe_session
    ON store_orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_store_orders_payment_intent
    ON store_orders(stripe_payment_intent) WHERE stripe_payment_intent IS NOT NULL;

CREATE TABLE IF NOT EXISTS store_payment_events (
    id BIGSERIAL PRIMARY KEY,
    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    stripe_object_id VARCHAR(255) NULL,
    order_id INT NULL REFERENCES store_orders(id) ON DELETE SET NULL,
    payload_hash CHAR(64) NOT NULL,
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    processing_status VARCHAR(24) NOT NULL DEFAULT 'received'
        CHECK (processing_status IN ('received', 'processed', 'ignored', 'manual_review')),
    attempts INT NOT NULL DEFAULT 1 CHECK (attempts > 0),
    last_error VARCHAR(255) NULL,
    result VARCHAR(100) NULL,
    audit_metadata JSONB NULL
);
CREATE INDEX IF NOT EXISTS idx_store_payment_events_order
    ON store_payment_events(order_id, received_at DESC);

CREATE TABLE IF NOT EXISTS store_inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES store_products(id) ON DELETE RESTRICT,
    order_id INT NOT NULL REFERENCES store_orders(id) ON DELETE RESTRICT,
    order_item_id INT NOT NULL REFERENCES store_order_items(id) ON DELETE RESTRICT,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('sale', 'refund', 'adjustment')),
    quantity INT NOT NULL CHECK (quantity <> 0),
    source_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255) NULL,
    audit_metadata JSONB NULL,
    UNIQUE (order_item_id, movement_type)
);
CREATE INDEX IF NOT EXISTS idx_store_inventory_movements_order
    ON store_inventory_movements(order_id, created_at);

-- A durable paid entitlement is separate from a short-lived bearer download
-- grant. One purchased digital order item can acquire at most one entitlement.
CREATE TABLE IF NOT EXISTS store_download_entitlements (
    id BIGSERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
    order_item_id INT NOT NULL UNIQUE REFERENCES store_order_items(id) ON DELETE CASCADE,
    user_id TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL,
    revocation_reason VARCHAR(255) NULL,
    audit_metadata JSONB NULL,
    UNIQUE (order_id, order_item_id)
);
CREATE INDEX IF NOT EXISTS idx_store_download_entitlements_order
    ON store_download_entitlements(order_id) WHERE revoked_at IS NULL;

COMMIT;
