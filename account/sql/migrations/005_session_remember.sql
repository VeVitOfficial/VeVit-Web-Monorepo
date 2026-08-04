-- Preserve whether this session uses a persistent browser cookie.
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS remember boolean NOT NULL DEFAULT false;
