-- Extends the order_status enum type (when it exists) with new lifecycle values.
-- MUST run and commit before 202607290003_payments_and_inventory_up.sql because
-- PostgreSQL cannot cast a literal to an enum value in the same transaction that
-- added it; the value must be committed first.
--
-- No BEGIN/COMMIT wrapper: each ALTER TYPE statement auto-commits individually,
-- making the new values immediately visible to the next migration connection.
--
-- On databases that use VARCHAR + CHECK for store_orders.status instead of a
-- real enum (e.g. the test scaffold), the DO block detects no type and exits
-- cleanly as a no-op.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'order_status' AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE 'order_status enum type not found; skipping extension (VARCHAR column assumed).';
        RETURN;
    END IF;

    -- Original values expected in the type already; listed here for documentation.
    -- IF NOT EXISTS guards make all statements idempotent.
    -- pending, paid, processing, shipped, delivered, cancelled, refunded

    -- New lifecycle values required by Task 0.4 payment flow:
    EXECUTE 'ALTER TYPE order_status ADD VALUE IF NOT EXISTS ''pending_checkout''';
    EXECUTE 'ALTER TYPE order_status ADD VALUE IF NOT EXISTS ''awaiting_payment''';
    EXECUTE 'ALTER TYPE order_status ADD VALUE IF NOT EXISTS ''manual_review''';

    RAISE NOTICE 'order_status enum extended: pending_checkout, awaiting_payment, manual_review';
END$$;
