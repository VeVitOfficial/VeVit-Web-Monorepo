-- Only before issuing any new grant. After real grants, restore a verified backup.
BEGIN;
DROP INDEX IF EXISTS idx_download_grants_item_active;
DROP INDEX IF EXISTS idx_download_grants_token_hash;
DROP TABLE IF EXISTS store_download_grants;
DROP INDEX IF EXISTS uq_store_orders_public_id;
ALTER TABLE store_orders
    DROP COLUMN IF EXISTS guest_grant_expires_at,
    DROP COLUMN IF EXISTS guest_grant_hash,
    DROP COLUMN IF EXISTS public_id;
ALTER TABLE store_order_items
    DROP COLUMN IF EXISTS cancelled_at;
COMMIT;
