-- Produktové obohacení: technické parametry a evidence zdrojů.
-- Aplikováno na Supabase 12. 11. 2026 jako migrace store_product_specs_sources.
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS specs jsonb NULL;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS sources jsonb NULL;
