-- VeVit Store — Product translations table (i18n)
-- Aditivní migrace: přidává tabulku pro překlady produktů bez zásahu do store_products.
-- Aplikováno též přes Supabase MCP (project oo​xlxveagkxejlposfsi).

CREATE TABLE IF NOT EXISTS store_product_translations (
    product_id INT NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
    lang VARCHAR(5) NOT NULL,
    name VARCHAR(255),
    short_desc VARCHAR(255),
    description TEXT,
    PRIMARY KEY (product_id, lang)
);

-- Index for efficient lookup by lang
CREATE INDEX IF NOT EXISTS idx_store_product_translations_lang ON store_product_translations(lang);

-- Enable RLS to match other store tables
ALTER TABLE store_product_translations ENABLE ROW LEVEL SECURITY;

-- RLS policy: public can read translations (same as store_products)
CREATE POLICY "store_product_translations_read" ON store_product_translations
  FOR SELECT USING (true);