-- 020: Owner rank, admin audit log and XP adjustments for the owner console.

insert into public.ranks (key, kind, min_level, tier_key, priority, color, permissions)
values ('owner', 'staff', null, null, 60, '#ffb703', '{*}')
on conflict (key) do update set priority = excluded.priority, color = excluded.color, permissions = excluded.permissions;

-- Staff ranks are the only ones that open the console; `*` implies it.
update public.ranks set permissions = array(select distinct unnest(permissions || '{admin.console}'))
where key = 'moderator';

insert into public.user_ranks (user_id, rank_key, source)
select id, 'owner', 'manual' from public.users where lower(email) = 'v.vedral@proton.me'
on conflict (user_id, rank_key) do update set revoked_at = null, expires_at = null;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id text references public.users(id) on delete set null,
  action text not null check (length(action) between 1 and 60),
  target_user_id text references public.users(id) on delete set null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
revoke all on table public.admin_audit_log from anon, authenticated;

-- Manual corrections may also take XP away (source system.adjustment only).
alter table public.xp_ledger drop constraint if exists xp_ledger_base_amount_check;
alter table public.xp_ledger add constraint xp_ledger_base_amount_check
  check (base_amount > 0 or (source = 'system.adjustment' and base_amount <> 0));

create or replace function public.admin_adjust_xp(
  p_user_id text, p_delta integer, p_reason text, p_actor_id text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_xp integer;
  v_delta integer;
  v_level integer;
begin
  if p_delta is null or p_delta = 0 or abs(p_delta) > 1000000 then
    raise exception 'Invalid XP delta';
  end if;
  select xp into v_xp from public.users where id = p_user_id for update;
  if not found then raise exception 'Unknown user'; end if;
  v_delta := greatest(p_delta, -coalesce(v_xp, 0)); -- never below 0 XP
  if v_delta = 0 then
    return jsonb_build_object('xp', v_xp, 'level', public.level_for_xp(v_xp), 'applied', 0);
  end if;
  insert into public.xp_ledger (user_id, source, ref_key, base_amount, bonus_amount, tier)
  values (p_user_id, 'system.adjustment', 'admin:' || gen_random_uuid(), v_delta, 0, null);
  v_xp := coalesce(v_xp, 0) + v_delta;
  v_level := public.level_for_xp(v_xp);
  update public.users set xp = v_xp, level = v_level where id = p_user_id;
  insert into public.admin_audit_log (actor_id, action, target_user_id, detail)
  values (p_actor_id, 'xp_adjust', p_user_id, jsonb_build_object('delta', v_delta, 'reason', left(coalesce(p_reason, ''), 200)));
  return jsonb_build_object('xp', v_xp, 'level', v_level, 'applied', v_delta);
end $$;

revoke all on function public.admin_adjust_xp(text, integer, text, text) from public, anon, authenticated;
grant execute on function public.admin_adjust_xp(text, integer, text, text) to service_role;
