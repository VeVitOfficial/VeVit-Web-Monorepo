BEGIN;

ALTER TABLE store_orders
    ADD COLUMN IF NOT EXISTS public_id CHAR(32) NULL,
    ADD COLUMN IF NOT EXISTS guest_grant_hash CHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS guest_grant_expires_at TIMESTAMP NULL;
ALTER TABLE store_order_items ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_store_orders_public_id
    ON store_orders (public_id) WHERE public_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS store_download_grants (
    id BIGSERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
    order_item_id INT NOT NULL REFERENCES store_order_items(id) ON DELETE CASCADE,
    user_id TEXT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    max_downloads INT NOT NULL DEFAULT 1 CHECK (max_downloads BETWEEN 1 AND 20),
    download_count INT NOT NULL DEFAULT 0 CHECK (download_count >= 0),
    last_downloaded_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    revocation_reason VARCHAR(255) NULL,
    allow_inactive_access BOOLEAN NOT NULL DEFAULT FALSE,
    audit_metadata JSONB NULL
);
CREATE INDEX IF NOT EXISTS idx_download_grants_token_hash ON store_download_grants (token_hash);
CREATE INDEX IF NOT EXISTS idx_download_grants_item_active ON store_download_grants (order_item_id) WHERE revoked_at IS NULL;

-- Legacy raw tokens are compromised by design. They are not migrated or accepted.
UPDATE store_order_items
SET download_token = NULL,
    download_expires_at = NULL
WHERE download_token IS NOT NULL;

COMMIT;
