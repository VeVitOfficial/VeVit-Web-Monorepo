-- Phase 2: extended checkout (phone, delivery, company, consents) and product shipping/VAT data.
BEGIN;

ALTER TABLE store_orders
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(16) NULL,
    ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(16) NULL,
    ADD COLUMN IF NOT EXISTS packeta_point JSONB NULL,
    ADD COLUMN IF NOT EXISTS billing_company JSONB NULL,
    ADD COLUMN IF NOT EXISTS billing_address JSONB NULL,
    ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS digital_waiver_at TIMESTAMPTZ NULL;

ALTER TABLE store_products
    ADD COLUMN IF NOT EXISTS weight_grams INT NOT NULL DEFAULT 500,
    ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(4,2) NOT NULL DEFAULT 21.00;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_orders_delivery_method_check') THEN
    ALTER TABLE store_orders ADD CONSTRAINT store_orders_delivery_method_check
      CHECK (delivery_method IS NULL OR delivery_method IN ('packeta_pickup', 'address'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_products_weight_grams_check') THEN
    ALTER TABLE store_products ADD CONSTRAINT store_products_weight_grams_check CHECK (weight_grams > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_products_vat_rate_check') THEN
    ALTER TABLE store_products ADD CONSTRAINT store_products_vat_rate_check CHECK (vat_rate IN (0, 12, 21));
  END IF;
END $$;

COMMIT;
