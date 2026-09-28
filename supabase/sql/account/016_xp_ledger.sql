-- 016: XP ledger, rules and the single award_xp entry point.
-- users.xp / users.level become a cache maintained only by award_xp.

-- Level curve: XP(L) = 50 * (L - 1) * L, levels 1–100.
delete from public.level_thresholds;
insert into public.level_thresholds (level, required_xp)
select l, 50 * (l - 1) * l from generate_series(1, 100) l;

create table if not exists public.xp_rules (
  source text primary key check (source ~ '^[a-z0-9_]+\.[a-z0-9_]+$'),
  amount integer check (amount is null or amount > 0),        -- null = caller supplies it
  max_amount integer check (max_amount is null or max_amount > 0),
  daily_cap integer check (daily_cap is null or daily_cap > 0), -- per source, Europe/Prague day, base XP
  bonus_applies boolean not null default true,
  active boolean not null default true
);
alter table public.xp_rules enable row level security;

insert into public.xp_rules (source, amount, max_amount, daily_cap, bonus_applies) values
  ('edu.quiz',            null, 100, null, true),
  ('edu.lesson_complete',   40, null, null, true),
  ('edu.course_complete',  300, null, null, true),
  ('games.session',          5, null,   50, true),
  ('games.highscore',       15, null, null, true),
  ('tools.use',              2, null,   20, true),
  ('account.daily',         10, null, null, true),
  ('account.streak_7',      50, null, null, true),
  ('account.onboarding',    50, null, null, true),
  ('account.2fa',           50, null, null, true),
  ('system.migration',    null, null, null, false),
  ('system.adjustment',   null, null, null, false)
on conflict (source) do update set
  amount = excluded.amount, max_amount = excluded.max_amount,
  daily_cap = excluded.daily_cap, bonus_applies = excluded.bonus_applies;

create table if not exists public.xp_ledger (
  id bigint generated always as identity primary key,
  user_id text not null references public.users(id) on delete cascade,
  source text not null references public.xp_rules(source),
  ref_key text not null check (length(ref_key) between 1 and 200),
  base_amount integer not null check (base_amount > 0),
  bonus_amount integer not null default 0 check (bonus_amount >= 0),
  tier text,
  created_at timestamptz not null default now(),
  unique (user_id, source, ref_key)
);
create index if not exists xp_ledger_user_created_idx on public.xp_ledger (user_id, created_at desc);
create index if not exists xp_ledger_created_idx on public.xp_ledger (created_at);
alter table public.xp_ledger enable row level security;

create or replace function public.level_for_xp(p_xp integer) returns integer
language sql stable set search_path = public as $$
  select coalesce(max(level), 1) from public.level_thresholds where required_xp <= greatest(p_xp, 0);
$$;

-- The only way XP is granted. Idempotent on (user, source, ref_key); daily caps
-- apply to base XP; the tier bonus is added on top and stored separately.
create or replace function public.award_xp(
  p_user_id text, p_source text, p_ref_key text, p_amount integer default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_rule public.xp_rules;
  v_base integer;
  v_used integer;
  v_tier text;
  v_bonus integer := 0;
  v_xp integer;
  v_old_level integer;
  v_new_level integer;
  v_id bigint;
begin
  select xp, level into v_xp, v_old_level from public.users where id = p_user_id for update;
  if not found then
    return jsonb_build_object('awarded', 0, 'reason', 'unknown_user');
  end if;

  select * into v_rule from public.xp_rules where source = p_source and active;
  if not found then
    return jsonb_build_object('awarded', 0, 'reason', 'unknown_source', 'xp', v_xp, 'level', v_old_level);
  end if;

  v_base := coalesce(v_rule.amount, p_amount);
  if v_rule.max_amount is not null then v_base := least(v_base, v_rule.max_amount); end if;
  if v_base is null or v_base <= 0 then
    return jsonb_build_object('awarded', 0, 'reason', 'no_amount', 'xp', v_xp, 'level', v_old_level);
  end if;

  if v_rule.daily_cap is not null then
    select coalesce(sum(base_amount), 0) into v_used from public.xp_ledger
      where user_id = p_user_id and source = p_source
        and (created_at at time zone 'Europe/Prague')::date = (now() at time zone 'Europe/Prague')::date;
    v_base := least(v_base, v_rule.daily_cap - v_used);
    if v_base <= 0 then
      return jsonb_build_object('awarded', 0, 'reason', 'daily_cap', 'xp', v_xp, 'level', v_old_level);
    end if;
  end if;

  v_tier := public.user_effective_tier(p_user_id);
  if v_rule.bonus_applies then
    select floor(v_base * t.xp_bonus_pct / 100.0)::integer into v_bonus from public.tiers t where t.key = v_tier;
    v_bonus := coalesce(v_bonus, 0);
  end if;

  insert into public.xp_ledger (user_id, source, ref_key, base_amount, bonus_amount, tier)
  values (p_user_id, p_source, p_ref_key, v_base, v_bonus, v_tier)
  on conflict (user_id, source, ref_key) do nothing
  returning id into v_id;
  if v_id is null then
    return jsonb_build_object('awarded', 0, 'reason', 'duplicate', 'xp', v_xp, 'level', v_old_level);
  end if;

  v_xp := coalesce(v_xp, 0) + v_base + v_bonus;
  v_new_level := public.level_for_xp(v_xp);
  update public.users set xp = v_xp, level = v_new_level where id = p_user_id;

  return jsonb_build_object(
    'awarded', v_base + v_bonus, 'base', v_base, 'bonus', v_bonus, 'tier', v_tier,
    'xp', v_xp, 'level', v_new_level, 'level_up', v_new_level > coalesce(v_old_level, 1)
  );
end $$;

-- Existing quiz XP (kept per lesson until now) moves into the ledger once.
insert into public.xp_ledger (user_id, source, ref_key, base_amount, bonus_amount, tier)
select s.user_id, 'system.migration', 'edu_quiz_lesson:' || s.course || ':' || s.lesson_slug, s.xp_total, 0, null
from public.edu_quiz_lesson_state s
join public.users u on u.id = s.user_id
where s.xp_total > 0
on conflict (user_id, source, ref_key) do nothing;

update public.users u set xp = coalesce(l.total, 0), level = public.level_for_xp(coalesce(l.total, 0))
from (select user_id, sum(base_amount + bonus_amount)::integer total from public.xp_ledger group by user_id) l
where l.user_id = u.id;

revoke all on function public.award_xp(text, text, text, integer) from public, anon, authenticated;
revoke all on function public.level_for_xp(integer) from public, anon, authenticated;
grant execute on function public.award_xp(text, text, text, integer) to service_role;
grant execute on function public.level_for_xp(integer) to service_role;
