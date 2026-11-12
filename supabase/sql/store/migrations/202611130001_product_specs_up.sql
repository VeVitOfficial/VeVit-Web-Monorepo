-- Parametry produktu (Alza-style tabulka na detailu produktu).
-- Podporované tvary JSON viz normalizeSpecs() v src/lib/store-data.ts:
--   {"Klíč": "Hodnota"}  ·  {"Skupina": {"Klíč": "Hodnota"}}  ·  [{"title": "...", "rows": [{"name": "...", "value": "..."}]}]
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS specs JSONB NULL;
