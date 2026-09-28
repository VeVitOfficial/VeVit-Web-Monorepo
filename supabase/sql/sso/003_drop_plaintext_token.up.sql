-- NEPOUŠTĚT před Fází 5 krok 3 a explicitním S-3.
alter table public.sessions drop column if exists session_token;
alter table public.sessions alter column token_hash set not null;
alter table public.sessions alter column expires_at set not null;
