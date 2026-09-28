-- Po odstranění plaintextu nelze původní tokeny rekonstruovat.
alter table public.sessions add column if not exists session_token varchar;
alter table public.sessions alter column token_hash drop not null;
