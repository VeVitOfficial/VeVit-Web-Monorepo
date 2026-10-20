-- The cache holds no business data; dropping it only costs re-lookups.
BEGIN;
DROP TABLE IF EXISTS card_bin_cache;
COMMIT;
