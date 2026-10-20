-- Drops the extended checkout columns. Take a backup first: phone, delivery point, company data
-- and consent timestamps of existing orders are lost.
BEGIN;

ALTER TABLE store_products
    DROP CONSTRAINT IF EXISTS store_products_vat_rate_check,
    DROP CONSTRAINT IF EXISTS store_products_weight_grams_check,
    DROP COLUMN IF EXISTS vat_rate,
    DROP COLUMN IF EXISTS weight_grams;

ALTER TABLE store_orders
    DROP CONSTRAINT IF EXISTS store_orders_delivery_method_check,
    DROP COLUMN IF EXISTS digital_waiver_at,
    DROP COLUMN IF EXISTS terms_accepted_at,
    DROP COLUMN IF EXISTS billing_address,
    DROP COLUMN IF EXISTS billing_company,
    DROP COLUMN IF EXISTS packeta_point,
    DROP COLUMN IF EXISTS delivery_method,
    DROP COLUMN IF EXISTS customer_phone;

COMMIT;
