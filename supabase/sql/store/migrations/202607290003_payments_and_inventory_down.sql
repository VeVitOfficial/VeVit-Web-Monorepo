BEGIN;

-- Rollback removes only Release 0.4 ledgers/columns. Take a database backup
-- first: dropping the ledgers discards payment and stock audit evidence.
DROP TABLE IF EXISTS store_download_entitlements;
DROP TABLE IF EXISTS store_inventory_movements;
DROP TABLE IF EXISTS store_payment_events;

DROP INDEX IF EXISTS uq_store_orders_payment_intent;
DROP INDEX IF EXISTS uq_store_orders_stripe_session;
DROP INDEX IF EXISTS uq_store_orders_checkout_snapshot;

ALTER TABLE store_order_items
    DROP CONSTRAINT IF EXISTS store_order_items_minor_values_check,
    DROP COLUMN IF EXISTS digital_content_path,
    DROP COLUMN IF EXISTS stock_context,
    DROP COLUMN IF EXISTS line_total_minor,
    DROP COLUMN IF EXISTS unit_price_minor,
    DROP COLUMN IF EXISTS product_sku,
    DROP COLUMN IF EXISTS variant_id;

ALTER TABLE store_orders
    DROP CONSTRAINT IF EXISTS store_orders_minor_totals_check,
    DROP CONSTRAINT IF EXISTS store_orders_fulfillment_status_check,
    DROP CONSTRAINT IF EXISTS store_orders_payment_status_check,
    DROP COLUMN IF EXISTS audit_metadata,
    DROP COLUMN IF EXISTS manual_review_reason,
    DROP COLUMN IF EXISTS payment_effects_applied_at,
    DROP COLUMN IF EXISTS payment_evidence_at,
    DROP COLUMN IF EXISTS cancelled_at,
    DROP COLUMN IF EXISTS paid_at,
    DROP COLUMN IF EXISTS stripe_session_expires_at,
    DROP COLUMN IF EXISTS stripe_session_attempt,
    DROP COLUMN IF EXISTS stripe_session_status,
    DROP COLUMN IF EXISTS stripe_checkout_url,
    DROP COLUMN IF EXISTS total_minor,
    DROP COLUMN IF EXISTS shipping_minor,
    DROP COLUMN IF EXISTS subtotal_minor,
    DROP COLUMN IF EXISTS fulfillment_status,
    DROP COLUMN IF EXISTS payment_status,
    DROP COLUMN IF EXISTS checkout_request_hash,
    DROP COLUMN IF EXISTS checkout_snapshot_id;

ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check;
ALTER TABLE store_orders ADD CONSTRAINT store_orders_status_check
    CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded'));

COMMIT;
