-- 029: VeVit Edu pro školy – školy s kódem, správce školy, kmenové třídy, přidělení učitelů,
-- zadané lekce s termínem a průběh žáků na serveru. Navazuje na 025 (ranky student / teacher,
-- edu_classes = třída učitele, odemykání lekcí).
--
-- Kdo co dělá:
--   VeVit admin      založí školu (kód školy) a určí správce,
--   správce školy    kmenové třídy (7.A), učitelé školy, přidělení učitelů ke kmenovým třídám,
--                    jako jediný přesouvá žáky mezi kmenovými třídami a odebírá je ze školy,
--   učitel           vidí jen žáky kmenových tříd, které mu správce přidělil; zakládá si vlastní
--                    třídy (edu_classes) z těchto žáků, odemyká a zadává lekce, žáka smí odebrat
--                    jen ze své třídy, ne ze školy,
--   žák              zadá kód školy, jméno, příjmení a vybere kmenovou třídu.
-- Tabulky jsou jen pro server (Next.js se secret klíčem): RLS zapnuté bez politik a bez grantů
-- pro anon / authenticated, stejně jako migrace 017, 021 a 025.

-- ── Ranky ──────────────────────────────────────────────────────────────────
-- Barva převzatá z existujícího ranku (průzkumník), nová se nevymýšlí.
insert into public.ranks (key, kind, min_level, tier_key, priority, color, permissions) values
  ('school_admin', 'program', null, null, 34, '#4fb3d9', '{edu.school.admin}')
on conflict (key) do update set
  kind = excluded.kind, priority = excluded.priority, color = excluded.color, permissions = excluded.permissions;

-- Ranky přidělené školou (žák, učitel, správce) mají zdroj 'school' a odeberou se s posledním členstvím.
alter table public.user_ranks drop constraint if exists user_ranks_source_check;
alter table public.user_ranks add constraint user_ranks_source_check
  check (source in ('manual', 'migration', 'class', 'school'));

-- ── Školy ──────────────────────────────────────────────────────────────────
create table if not exists public.edu_schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  -- Stejná abeceda jako kód třídy v 025 (bez 0/O, 1/I).
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
alter table public.edu_schools enable row level security;

create table if not exists public.edu_school_admins (
  school_id uuid not null references public.edu_schools(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  added_by text references public.users(id) on delete set null,
  added_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (school_id, user_id)
);
create index if not exists edu_school_admins_user_idx on public.edu_school_admins (user_id) where removed_at is null;
alter table public.edu_school_admins enable row level security;

create table if not exists public.edu_school_teachers (
  school_id uuid not null references public.edu_schools(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  added_by text references public.users(id) on delete set null,
  added_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (school_id, user_id)
);
create index if not exists edu_school_teachers_user_idx on public.edu_school_teachers (user_id) where removed_at is null;
alter table public.edu_school_teachers enable row level security;

-- Kmenové třídy školy (7.A). Kategorie určuje obsah AIFB (1. stupeň ZŠ, 2. stupeň ZŠ, SŠ).
create table if not exists public.edu_school_classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.edu_schools(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 20),
  category text not null check (category in ('zs1', 'zs2', 'ss')),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create unique index if not exists edu_school_classes_name_key
  on public.edu_school_classes (school_id, lower(trim(name))) where archived_at is null;
alter table public.edu_school_classes enable row level security;

-- Které kmenové třídy učí který učitel (přiděluje správce).
create table if not exists public.edu_school_class_teachers (
  school_class_id uuid not null references public.edu_school_classes(id) on delete cascade,
  teacher_id text not null references public.users(id) on delete cascade,
  assigned_by text references public.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (school_class_id, teacher_id)
);
create index if not exists edu_school_class_teachers_teacher_idx on public.edu_school_class_teachers (teacher_id);
alter table public.edu_school_class_teachers enable row level security;

-- Žák ve škole: jméno a příjmení vidí jen učitelé jeho kmenové třídy a správce školy.
-- Žák je nejvýš v jedné škole najednou.
create table if not exists public.edu_school_students (
  school_id uuid not null references public.edu_schools(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  first_name text not null check (length(trim(first_name)) between 1 and 60),
  last_name text not null check (length(trim(last_name)) between 1 and 60),
  school_class_id uuid not null references public.edu_school_classes(id),
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (school_id, user_id)
);
create unique index if not exists edu_school_students_one_school
  on public.edu_school_students (user_id) where removed_at is null;
create index if not exists edu_school_students_class_idx
  on public.edu_school_students (school_class_id) where removed_at is null;
alter table public.edu_school_students enable row level security;

-- ── Třídy učitele (edu_classes z 025) ──────────────────────────────────────
-- Třída patří škole; kód třídy se už nepoužívá (žák vstupuje kódem školy).
-- source_class_id: třída založená z kmenové třídy, noví žáci té kmenové třídy se do ní přidají sami.
alter table public.edu_classes add column if not exists school_id uuid references public.edu_schools(id) on delete cascade;
alter table public.edu_classes add column if not exists source_class_id uuid references public.edu_school_classes(id) on delete set null;
alter table public.edu_classes alter column code drop not null;
create index if not exists edu_classes_school_idx on public.edu_classes (school_id) where archived_at is null;

-- ── Zadané lekce ───────────────────────────────────────────────────────────
-- Zadaná lekce je pro žáka povinná (s termínem) a zároveň odemčená.
create table if not exists public.edu_class_assignments (
  class_id uuid not null references public.edu_classes(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^(zs1|zs2|ss)-[a-z0-9-]+-(teorie|cv[1-5])$'),
  due_at timestamptz,
  note text check (note is null or length(note) <= 500),
  assigned_by text references public.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (class_id, lesson_id)
);
alter table public.edu_class_assignments enable row level security;

-- ── Průběh žáků ve škole ───────────────────────────────────────────────────
-- Jen žáci ve škole (ostatní mají průběh dál jen v prohlížeči). Stejné stavy jako místní průběh.
create table if not exists public.edu_lesson_progress (
  user_id text not null references public.users(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^(zs1|zs2|ss|kurz)-[a-z0-9-]+-(teorie|cv[1-5])$'),
  status text not null check (status in ('started', 'done')),
  started_at timestamptz not null default now(),
  done_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table public.edu_lesson_progress enable row level security;

-- ── Ranky podle členství ───────────────────────────────────────────────────
-- Žák bez aktivní školy i třídy přijde o rank student, pokud ho dostal připojením (ruční zůstává).
create or replace function public.edu_sync_student_rank(p_user_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.edu_school_students s join public.edu_schools sc on sc.id = s.school_id
    where s.user_id = p_user_id and s.removed_at is null and sc.archived_at is null
  ) and not exists (
    select 1 from public.edu_class_members m join public.edu_classes c on c.id = m.class_id
    where m.user_id = p_user_id and m.removed_at is null and c.archived_at is null and c.school_id is null
  ) then
    update public.user_ranks set revoked_at = now()
    where user_id = p_user_id and rank_key = 'student' and source in ('class', 'school') and revoked_at is null;
  end if;
end $$;

-- Udělí rank se zdrojem 'school'; platný rank (třeba ruční) se nemění.
create or replace function public.edu_grant_school_rank(p_user_id text, p_rank text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_ranks (user_id, rank_key, source) values (p_user_id, p_rank, 'school')
  on conflict (user_id, rank_key) do update
    set revoked_at = null, expires_at = null, granted_at = now(), granted_by = null, source = 'school'
    where public.user_ranks.revoked_at is not null
       or (public.user_ranks.expires_at is not null and public.user_ranks.expires_at <= now());
end $$;

-- Učitel / správce bez aktivní školy přijde o rank teacher / school_admin se zdrojem 'school'.
create or replace function public.edu_sync_staff_ranks(p_user_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.edu_school_teachers t join public.edu_schools sc on sc.id = t.school_id
    where t.user_id = p_user_id and t.removed_at is null and sc.archived_at is null
  ) then
    update public.user_ranks set revoked_at = now()
    where user_id = p_user_id and rank_key = 'teacher' and source = 'school' and revoked_at is null;
  end if;
  if not exists (
    select 1 from public.edu_school_admins a join public.edu_schools sc on sc.id = a.school_id
    where a.user_id = p_user_id and a.removed_at is null and sc.archived_at is null
  ) then
    update public.user_ranks set revoked_at = now()
    where user_id = p_user_id and rank_key = 'school_admin' and source = 'school' and revoked_at is null;
  end if;
end $$;

-- ── Vstup žáka do školy ────────────────────────────────────────────────────
create or replace function public.edu_join_school(
  p_user_id text, p_code text, p_first_name text, p_last_name text, p_school_class_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_school public.edu_schools%rowtype;
  v_current uuid;
begin
  select * into v_school from public.edu_schools where code = upper(trim(p_code)) and archived_at is null;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown_code'); end if;
  if not exists (
    select 1 from public.edu_school_classes
    where id = p_school_class_id and school_id = v_school.id and archived_at is null
  ) then return jsonb_build_object('ok', false, 'error', 'unknown_class'); end if;

  select school_id into v_current from public.edu_school_students where user_id = p_user_id and removed_at is null;
  if v_current is not null and v_current <> v_school.id then
    return jsonb_build_object('ok', false, 'error', 'other_school');
  end if;
  if v_current = v_school.id then
    -- Už zapsaný: kmenovou třídu mění jen správce, jméno se nepřepisuje.
    return jsonb_build_object('ok', true, 'school_id', v_school.id, 'name', v_school.name, 'already', true);
  end if;

  insert into public.edu_school_students (school_id, user_id, first_name, last_name, school_class_id)
  values (v_school.id, p_user_id, trim(p_first_name), trim(p_last_name), p_school_class_id)
  on conflict (school_id, user_id) do update
    set first_name = excluded.first_name, last_name = excluded.last_name,
        school_class_id = excluded.school_class_id, joined_at = now(), removed_at = null;

  -- Do tříd učitelů založených z této kmenové třídy (kdo byl učitelem odebrán, zůstane odebraný).
  insert into public.edu_class_members (class_id, user_id)
  select c.id, p_user_id from public.edu_classes c
  where c.source_class_id = p_school_class_id and c.archived_at is null
  on conflict (class_id, user_id) do nothing;

  perform public.edu_grant_school_rank(p_user_id, 'student');
  return jsonb_build_object('ok', true, 'school_id', v_school.id, 'name', v_school.name, 'already', false);
end $$;

-- Správce přesune žáka do jiné kmenové třídy: odejde ze tříd založených ze staré, přidá se do tříd nové.
create or replace function public.edu_move_student(p_school_id uuid, p_user_id text, p_school_class_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_old uuid;
begin
  if not exists (
    select 1 from public.edu_school_classes
    where id = p_school_class_id and school_id = p_school_id and archived_at is null
  ) then return false; end if;
  select school_class_id into v_old from public.edu_school_students
  where school_id = p_school_id and user_id = p_user_id and removed_at is null;
  if not found then return false; end if;
  if v_old = p_school_class_id then return true; end if;

  update public.edu_school_students set school_class_id = p_school_class_id
  where school_id = p_school_id and user_id = p_user_id;
  update public.edu_class_members m set removed_at = now()
  from public.edu_classes c
  where m.class_id = c.id and c.source_class_id = v_old and m.user_id = p_user_id and m.removed_at is null;
  insert into public.edu_class_members (class_id, user_id)
  select c.id, p_user_id from public.edu_classes c
  where c.source_class_id = p_school_class_id and c.archived_at is null
  on conflict (class_id, user_id) do update set removed_at = null, joined_at = now();
  return true;
end $$;

-- Správce odebere žáka ze školy (a ze všech tříd školy). Členství ve třídách se maže, ne označí:
-- po novém zápisu se žák zase přidá do tříd své kmenové třídy (odebrání učitelem se tím neplete).
create or replace function public.edu_remove_school_student(p_school_id uuid, p_user_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.edu_school_students set removed_at = now()
  where school_id = p_school_id and user_id = p_user_id and removed_at is null;
  delete from public.edu_class_members m
  using public.edu_classes c
  where m.class_id = c.id and c.school_id = p_school_id and m.user_id = p_user_id;
  perform public.edu_sync_student_rank(p_user_id);
end $$;

-- ── Přístup jen pro server ─────────────────────────────────────────────────
revoke all on table
  public.edu_schools, public.edu_school_admins, public.edu_school_teachers, public.edu_school_classes,
  public.edu_school_class_teachers, public.edu_school_students, public.edu_class_assignments,
  public.edu_lesson_progress
from anon, authenticated;

revoke all on function public.edu_sync_student_rank(text) from public, anon, authenticated;
revoke all on function public.edu_grant_school_rank(text, text) from public, anon, authenticated;
revoke all on function public.edu_sync_staff_ranks(text) from public, anon, authenticated;
revoke all on function public.edu_join_school(text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.edu_move_student(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.edu_remove_school_student(uuid, text) from public, anon, authenticated;
grant execute on function public.edu_sync_student_rank(text) to service_role;
grant execute on function public.edu_grant_school_rank(text, text) to service_role;
grant execute on function public.edu_sync_staff_ranks(text) to service_role;
grant execute on function public.edu_join_school(text, text, text, text, uuid) to service_role;
grant execute on function public.edu_move_student(uuid, text, uuid) to service_role;
grant execute on function public.edu_remove_school_student(uuid, text) to service_role;
