-- Alza-style varianty: produkty stejného modelu (značka + model) sdílí variant_group.
-- Aplikováno na Supabase 12. 11. 2026 jako migrace store_product_variants.
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS variant_group VARCHAR(100) NULL;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS variant_label VARCHAR(255) NULL;
CREATE INDEX IF NOT EXISTS idx_store_products_variant_group ON store_products (variant_group);
