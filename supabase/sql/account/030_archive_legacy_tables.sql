-- 030: úklid pozůstatků starých plánů (2026-11-17).
-- Tabulky se NEmažou, ale přesouvají do schématu `archive` (mimo API, bez přístupu klientů).
-- Data tak zůstávají jako záloha; definitivní smazání viz konec souboru.
-- Kód webu tyto tabulky nepoužívá (ověřeno grepem src/, supabase/functions, scripts/ a RPC volání).

begin;

create schema if not exists archive;
revoke all on schema archive from public, anon, authenticated;

-- Nepoužívané nikde v kódu ani ve volaných RPC
alter table if exists public.activity_events            set schema archive;
alter table if exists public.changelog_entries          set schema archive;
alter table if exists public.comment_likes              set schema archive;
alter table if exists public.newsletter_subscribers     set schema archive;
alter table if exists public.cal_calendars              set schema archive;
alter table if exists public.cal_reminder_folders       set schema archive;
alter table if exists public.store_product_views        set schema archive;
alter table if exists public.store_product_translations set schema archive;
alter table if exists public.store_download_grants      set schema archive;
alter table if exists public.store_security_rate_limits set schema archive;
alter table if exists public.stripe_webhook_events      set schema archive;
alter table if exists public.pending_phone_registrations set schema archive;
alter table if exists public.api_refresh_tokens         set schema archive;

-- Funkce, které už neexistují (tabulky byly jen v exportu osobních dat)
alter table if exists public.cal_events                 set schema archive;
alter table if exists public.cal_reminders              set schema archive;
alter table if exists public.certificates               set schema archive;
alter table if exists public.daily_bonus_log            set schema archive;
alter table if exists public.games_stats                set schema archive;
alter table if exists public.lesson_comments            set schema archive;
alter table if exists public.ai_usage_log               set schema archive;

-- Nepoužívané sloupce users: nejdřív kopie do archivu, pak drop.
-- two_factor_secret nahradila tabulka user_totp_methods (a export dat ho jinak vydával).
-- Kopíruje jen sloupce, které v živé DB opravdu existují (schéma v dashboardu se může lišit).
do $$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ')
    into cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'users'
     and column_name in ('clerk_user_id', 'available_roles', 'two_factor_secret');
  if cols is not null then
    execute format('create table if not exists archive.users_legacy_columns as select id, %s from public.users', cols);
  end if;
end $$;
alter table public.users
  drop column if exists clerk_user_id,
  drop column if exists available_roles,
  drop column if exists two_factor_secret;

revoke all on all tables in schema archive from public, anon, authenticated;

-- Noční úklid session mazal i api_refresh_tokens, která je teď v archivu.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'vevit-session-cleanup'),
  command := $cleanup$
    delete from public.sessions
    where expires_at < now() - interval '30 days'
       or (revoked_at is not null and revoked_at < now() - interval '30 days');
  $cleanup$
);

commit;

-- Definitivní smazání (až po ověření, že nic nechybí — např. za 2–4 týdny):
--   drop schema archive cascade;
-- Vrácení jedné tabulky zpět:
--   alter table archive.<tabulka> set schema public;
