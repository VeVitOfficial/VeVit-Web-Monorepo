-- Cache of external BIN lookups (first 6-8 card digits only, never a full number).
-- Server-only: accessed with the service role from /api/payments/bin.
BEGIN;

CREATE TABLE IF NOT EXISTS card_bin_cache (
  prefix VARCHAR(8) PRIMARY KEY CHECK (prefix ~ '^[0-9]{6,8}$'),
  bank_key TEXT NULL,
  bank_name TEXT NULL,
  scheme TEXT NULL,
  funding TEXT NULL,
  country CHAR(2) NULL,
  source TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.card_bin_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.card_bin_cache FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.card_bin_cache FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.card_bin_cache FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.card_bin_cache TO service_role;
  END IF;
END $$;

COMMIT;
