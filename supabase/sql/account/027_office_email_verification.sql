-- 027: Ověření e-mailu ve Vevit účtu (users.email_verified_at z migrace 026 dostane zdroj pravdy).
-- Odkaz z e-mailu nese jednorázový token (256 bitů); v databázi je jen jeho SHA-256, platnost 24 hodin.
-- Tabulka je jen pro server (RLS bez politik, bez grantů pro anon / authenticated), stejně jako v 026.

create table if not exists public.office_email_verifications (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  -- Adresa, která se ověřuje. Po změně e-mailu na účtu se čekající tokeny smažou (trigger níže).
  email text not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists office_email_verifications_user_idx on public.office_email_verifications (user_id);
alter table public.office_email_verifications enable row level security;
revoke all on table public.office_email_verifications from anon, authenticated;

-- Nové ověření při změně e-mailu: kdokoli (i starý PHP kód) změní users.email, ověření se zruší a čekající odkazy zaniknou.
create or replace function public.office_users_email_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) is distinct from lower(old.email) then
    new.email_verified_at := null;
    delete from public.office_email_verifications where user_id = new.id;
  end if;
  return new;
end $$;
revoke all on function public.office_users_email_changed() from public, anon, authenticated;

drop trigger if exists office_users_email_changed on public.users;
create trigger office_users_email_changed before update of email on public.users
  for each row execute function public.office_users_email_changed();

-- Atomické jednorázové potvrzení: token se spotřebuje a e-mail se označí jako ověřený ve stejné transakci.
-- outcome: 'ok' (včetně opakovaného potvrzení téže adresy) nebo 'invalid' (neznámý, použitý, prošlý nebo adresa se mezitím změnila).
create or replace function public.office_verify_email(p_hash text) returns table (o_user_id text, o_email text, o_outcome text)
language plpgsql security definer set search_path = public as $$
declare v public.office_email_verifications%rowtype;
begin
  update public.office_email_verifications t set used_at = now()
    where t.token_hash = p_hash and t.used_at is null and t.expires_at > now()
    returning t.* into v;
  if not found then
    return query select null::text, null::text, 'invalid'::text;
    return;
  end if;
  perform 1 from public.users u where u.id = v.user_id and lower(u.email) = lower(v.email) for update;
  if not found then
    return query select null::text, null::text, 'invalid'::text;
    return;
  end if;
  update public.users u set email_verified_at = coalesce(u.email_verified_at, now()) where u.id = v.user_id;
  return query select v.user_id, v.email, 'ok'::text;
end $$;
revoke all on function public.office_verify_email(text) from public, anon, authenticated;
grant execute on function public.office_verify_email(text) to service_role;

-- Úklid rozšířený o ověřovací tokeny a prošlá počítadla (nahrazuje definici z 026).
create or replace function public.office_purge_expired() returns void language sql security definer set search_path = public as $$
  delete from public.office_link_requests where expires_at < now() - interval '1 day';
  delete from public.office_oidc_codes where expires_at < now() - interval '1 day';
  delete from public.office_oidc_pending where expires_at < now() - interval '1 day';
  delete from public.office_device_codes where expires_at < now() - interval '1 day';
  delete from public.office_email_verifications where expires_at < now() - interval '7 days';
  delete from public.office_rate_limits where window_end < now() - interval '1 day';
$$;
revoke all on function public.office_purge_expired() from public, anon, authenticated;
grant execute on function public.office_purge_expired() to service_role;
