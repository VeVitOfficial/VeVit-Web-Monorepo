-- Drops the gateway bookkeeping columns. Take a backup first: attempt counters and
-- the recorded payment method/provider are lost.
BEGIN;

ALTER TABLE store_orders
    DROP CONSTRAINT IF EXISTS store_orders_payment_counters_check,
    DROP CONSTRAINT IF EXISTS store_orders_payment_method_check,
    DROP CONSTRAINT IF EXISTS store_orders_payment_provider_check,
    DROP COLUMN IF EXISTS last_payment_error,
    DROP COLUMN IF EXISTS payment_intent_seq,
    DROP COLUMN IF EXISTS payment_attempts,
    DROP COLUMN IF EXISTS payment_method,
    DROP COLUMN IF EXISTS payment_provider;

COMMIT;
