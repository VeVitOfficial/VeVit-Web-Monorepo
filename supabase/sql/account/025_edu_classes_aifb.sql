-- 025: VeVit Edu pro školy – ranky student / teacher, třídy s kódem, odemykání lekcí AIFB
-- učitelem a úpravy obsahu AIFB adminem (překryv nad JSON v repozitáři, soubory se nemění).
-- Tabulky jsou jen pro server (Next.js se secret klíčem): RLS zapnuté bez politik a bez grantů
-- pro anon / authenticated, stejně jako migrace 017 a 021.

-- ── Ranky ──────────────────────────────────────────────────────────────────
-- Barvy jsou převzaté z existujících ranků (učeň, tvůrce), nové se nevymýšlejí.
insert into public.ranks (key, kind, min_level, tier_key, priority, color, permissions) values
  ('student', 'program', null, null, 32, '#7cc4a4', '{edu.aifb.student}'),
  ('teacher', 'program', null, null, 33, '#7a8cf0', '{edu.aifb.teacher}')
on conflict (key) do update set
  kind = excluded.kind, priority = excluded.priority, color = excluded.color, permissions = excluded.permissions;

-- Rank student přidělený připojením ke třídě má zdroj 'class' (odebere se, když žák není v žádné třídě).
alter table public.user_ranks drop constraint if exists user_ranks_source_check;
alter table public.user_ranks add constraint user_ranks_source_check
  check (source in ('manual', 'migration', 'class'));

-- ── Třídy ──────────────────────────────────────────────────────────────────
create table if not exists public.edu_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id text not null references public.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  category text not null check (category in ('zs1', 'zs2', 'ss')),
  -- 8 znaků bez snadno zaměnitelných (0/O, 1/I).
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists edu_classes_teacher_idx on public.edu_classes (teacher_id) where archived_at is null;
alter table public.edu_classes enable row level security;

create table if not exists public.edu_class_members (
  class_id uuid not null references public.edu_classes(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (class_id, user_id)
);
create index if not exists edu_class_members_user_idx on public.edu_class_members (user_id) where removed_at is null;
alter table public.edu_class_members enable row level security;

-- Odemčené lekce (teorie i cvičení) pro celou třídu.
create table if not exists public.edu_class_unlocks (
  class_id uuid not null references public.edu_classes(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^(zs1|zs2|ss)-[a-z0-9-]+-(teorie|cv[1-5])$'),
  unlocked_by text references public.users(id) on delete set null,
  unlocked_at timestamptz not null default now(),
  primary key (class_id, lesson_id)
);
alter table public.edu_class_unlocks enable row level security;

-- Žák bez aktivní třídy přijde o rank student, pokud ho dostal připojením (ruční zůstává).
create or replace function public.edu_sync_student_rank(p_user_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.edu_class_members m join public.edu_classes c on c.id = m.class_id
    where m.user_id = p_user_id and m.removed_at is null and c.archived_at is null
  ) then
    update public.user_ranks set revoked_at = now()
    where user_id = p_user_id and rank_key = 'student' and source = 'class' and revoked_at is null;
  end if;
end $$;

create or replace function public.edu_join_class(p_user_id text, p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_class public.edu_classes%rowtype;
begin
  select * into v_class from public.edu_classes
  where code = upper(trim(p_code)) and archived_at is null;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown_code'); end if;
  if v_class.teacher_id = p_user_id then return jsonb_build_object('ok', false, 'error', 'own_class'); end if;

  insert into public.edu_class_members (class_id, user_id) values (v_class.id, p_user_id)
  on conflict (class_id, user_id) do update
    set removed_at = null,
        joined_at = case when public.edu_class_members.removed_at is null then public.edu_class_members.joined_at else now() end;

  -- Platný rank (třeba ruční) se nemění; odebraný nebo prošlý se obnoví se zdrojem 'class'.
  insert into public.user_ranks (user_id, rank_key, source) values (p_user_id, 'student', 'class')
  on conflict (user_id, rank_key) do update
    set revoked_at = null, expires_at = null, granted_at = now(), granted_by = null, source = 'class'
    where public.user_ranks.revoked_at is not null
       or (public.user_ranks.expires_at is not null and public.user_ranks.expires_at <= now());

  return jsonb_build_object('ok', true, 'class_id', v_class.id, 'name', v_class.name, 'category', v_class.category);
end $$;

create or replace function public.edu_leave_class(p_class_id uuid, p_user_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.edu_class_members set removed_at = now()
  where class_id = p_class_id and user_id = p_user_id and removed_at is null;
  perform public.edu_sync_student_rank(p_user_id);
end $$;

create or replace function public.edu_archive_class(p_class_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user text;
begin
  update public.edu_classes set archived_at = now() where id = p_class_id and archived_at is null;
  for v_user in
    update public.edu_class_members set removed_at = now()
    where class_id = p_class_id and removed_at is null
    returning user_id
  loop
    perform public.edu_sync_student_rank(v_user);
  end loop;
end $$;

-- ── Úpravy obsahu AIFB ─────────────────────────────────────────────────────
-- Každé uložení je nový řádek (historie). Platí poslední řádek pro (doc, path);
-- value null = vráceno na původní text z repozitáře.
create table if not exists public.aifb_content_edits (
  id bigint generated always as identity primary key,
  doc text not null check (doc in ('zs1', 'zs2', 'ss', 'theory', 'kurz', 'pilots')),
  path text not null check (length(path) between 1 and 300),
  value jsonb,
  note text check (note is null or length(note) <= 300),
  author_id text references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists aifb_content_edits_doc_path_idx on public.aifb_content_edits (doc, path, id desc);
alter table public.aifb_content_edits enable row level security;

create or replace view public.aifb_content_current with (security_invoker = true) as
  select distinct on (doc, path) id, doc, path, value, author_id, created_at
  from public.aifb_content_edits
  order by doc, path, id desc;

-- ── Přístup jen pro server ─────────────────────────────────────────────────
revoke all on table
  public.edu_classes, public.edu_class_members, public.edu_class_unlocks,
  public.aifb_content_edits, public.aifb_content_current
from anon, authenticated;

revoke all on function public.edu_sync_student_rank(text) from public, anon, authenticated;
revoke all on function public.edu_join_class(text, text) from public, anon, authenticated;
revoke all on function public.edu_leave_class(uuid, text) from public, anon, authenticated;
revoke all on function public.edu_archive_class(uuid) from public, anon, authenticated;
grant execute on function public.edu_sync_student_rank(text) to service_role;
grant execute on function public.edu_join_class(text, text) to service_role;
grant execute on function public.edu_leave_class(uuid, text) to service_role;
grant execute on function public.edu_archive_class(uuid) to service_role;
