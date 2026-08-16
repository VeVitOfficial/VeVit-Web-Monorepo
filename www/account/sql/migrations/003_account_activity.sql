-- Migration 003: account_activity for security feed (may already exist)
CREATE TABLE IF NOT EXISTS public.account_activity (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind       text NOT NULL, -- login | password_change | twofa | session_revoke
  detail     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_activity_user_idx
  ON public.account_activity (user_id, created_at DESC);
