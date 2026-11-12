-- Down: odstranění variantních sloupců (hodnoty se zahodí, produkty zůstávají)
DROP INDEX IF EXISTS idx_store_products_variant_group;
ALTER TABLE store_products DROP COLUMN IF EXISTS variant_label;
ALTER TABLE store_products DROP COLUMN IF EXISTS variant_group;
