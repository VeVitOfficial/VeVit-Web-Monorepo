-- Progressive per-identifier login/reset backoff (independent of source IP).
-- Adds a column used to throttle repeated attempts against one identifier
-- (email/phone/nickname for login, email for forgot-password) even when an
-- attacker rotates IPs. Rows written for this purpose carry identifier_hash
-- and a dedicated action (e.g. 'login_identifier'), never ip_address, so
-- they cannot inflate the existing IP-scoped counters in checkRateLimit().
BEGIN;

ALTER TABLE public.login_attempts
  ADD COLUMN IF NOT EXISTS identifier_hash text;

CREATE INDEX IF NOT EXISTS login_attempts_identifier_idx
  ON public.login_attempts (identifier_hash, action, attempt_time)
  WHERE identifier_hash IS NOT NULL;

COMMIT;
