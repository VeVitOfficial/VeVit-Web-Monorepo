-- Execute only before any Task 0.2 snapshot has been created, or restore a verified backup.
-- Removing these columns after real orders would destroy security/audit data.
BEGIN;

DROP INDEX IF EXISTS idx_security_rate_limits_expires_at;
DROP TABLE IF EXISTS store_security_rate_limits;
DROP INDEX IF EXISTS idx_checkout_snapshots_expires_at;
DROP INDEX IF EXISTS uq_checkout_snapshots_active_idempotency;
DROP TABLE IF EXISTS store_checkout_snapshots;

ALTER TABLE store_products
    DROP CONSTRAINT IF EXISTS store_products_currency_check;
ALTER TABLE store_products
    DROP COLUMN IF EXISTS sku,
    DROP COLUMN IF EXISTS currency,
    DROP COLUMN IF EXISTS allow_backorder,
    DROP COLUMN IF EXISTS is_sellable;

COMMIT;
