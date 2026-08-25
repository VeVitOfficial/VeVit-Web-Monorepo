-- Down migration for 2026072900025_order_status_enum_up.sql
--
-- WARNING: PostgreSQL does not support removing enum values via ALTER TYPE.
-- There is no safe single-statement rollback for this migration.
--
-- Rollback options (in order of preference):
--
-- 1. Restore from the PostgreSQL backup taken before applying the enum migration.
--    This is the only fully safe option if any row already uses the new values.
--
-- 2. Reconstruct the type (only viable when no rows use the new values):
--      a. Ensure no row has status IN ('pending_checkout','awaiting_payment','manual_review').
--      b. ALTER TABLE store_orders ALTER COLUMN status TYPE VARCHAR(20) USING status::TEXT;
--      c. DROP TYPE order_status;
--      d. CREATE TYPE order_status AS ENUM ('pending','paid','processing','shipped','delivered','cancelled','refunded');
--      e. ALTER TABLE store_orders ALTER COLUMN status TYPE order_status USING status::order_status;
--    This sequence is multi-step, requires a maintenance window, and is NOT
--    idempotent. Do not run it on a live database with active orders.
--
-- This file is intentionally empty of executable SQL to prevent accidental
-- data loss from an automated rollback runner.
--
-- Verify backup integrity before attempting any rollback procedure.

DO $$
BEGIN
    RAISE NOTICE 'Enum value removal is not supported by PostgreSQL. Restore from backup. See migration comments for details.';
END$$;
