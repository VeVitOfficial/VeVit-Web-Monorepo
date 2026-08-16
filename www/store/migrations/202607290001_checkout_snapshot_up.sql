BEGIN;

-- Additive migration: existing products and completed orders remain untouched.
ALTER TABLE store_products
    ADD COLUMN IF NOT EXISTS is_sellable BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'czk',
    ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NULL;

ALTER TABLE store_products
    DROP CONSTRAINT IF EXISTS store_products_currency_check;
ALTER TABLE store_products
    ADD CONSTRAINT store_products_currency_check CHECK (currency ~ '^[a-z]{3}$');

CREATE TABLE IF NOT EXISTS store_checkout_snapshots (
    id BIGSERIAL PRIMARY KEY,
    public_id CHAR(32) NOT NULL UNIQUE,
    user_id TEXT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    shipping_address TEXT NULL,
    notes TEXT NOT NULL DEFAULT '',
    currency VARCHAR(3) NOT NULL CHECK (currency = 'czk'),
    subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
    shipping_minor BIGINT NOT NULL CHECK (shipping_minor >= 0),
    total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
    snapshot_data JSONB NOT NULL,
    snapshot_hash CHAR(64) NOT NULL,
    checkout_grant_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    idempotency_scope_hash CHAR(64) NOT NULL,
    idempotency_key_hash CHAR(64) NOT NULL,
    request_hash CHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'expired', 'consumed', 'cancelled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP INDEX IF EXISTS uq_checkout_snapshots_active_idempotency;
CREATE UNIQUE INDEX uq_checkout_snapshots_active_idempotency
    ON store_checkout_snapshots (idempotency_scope_hash, idempotency_key_hash)
    WHERE status IN ('pending', 'consumed');
CREATE INDEX IF NOT EXISTS idx_checkout_snapshots_expires_at
    ON store_checkout_snapshots (expires_at) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS store_security_rate_limits (
    key_hash CHAR(64) PRIMARY KEY,
    scope VARCHAR(64) NOT NULL,
    request_count INT NOT NULL CHECK (request_count > 0),
    window_started_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_rate_limits_expires_at
    ON store_security_rate_limits (expires_at);

COMMIT;
