-- Down: odstranění obohacených sloupců
ALTER TABLE store_products DROP COLUMN IF EXISTS sources;
ALTER TABLE store_products DROP COLUMN IF EXISTS specs;
