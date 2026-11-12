-- READ-ONLY audit of the live Supabase database. Paste into the Supabase SQL editor (or run with psql).
-- Expected result for every query is stated above it. Nothing here changes data or permissions.

-- 1) Public tables WITHOUT row level security. Expected: 0 rows (or only intentionally public reference data).
select c.relname as table_name, c.relrowsecurity as rls, c.relforcerowsecurity as forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity
order by 1;

-- 2) Table privileges held by the browser roles. Expected: none for sensitive tables (the app talks to
--    the database only through the service role on the server).
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')
group by 1, 2 order by 1, 2;

-- 3) Policies. Expected: none that use USING (true) / WITH CHECK (true) for anon or authenticated on user data.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname in ('public', 'storage') order by 1, 2, 3;

-- 4) Functions callable by browser roles. Expected: 0 rows (everything is service_role only).
select p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_exec,
       p.proconfig as config
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'
  and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
order by 1;

-- 5) SECURITY DEFINER functions without a pinned search_path. Expected: 0 rows.
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%');

-- 6) Views that run with the owner's rights (bypass RLS). Expected: none, or security_invoker = true.
select c.relname, c.reloptions from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v' and not coalesce(c.reloptions::text, '') like '%security_invoker=true%';

-- 7) Storage buckets. Expected: avatars private, size and mime limits set.
select id, name, public, file_size_limit, allowed_mime_types from storage.buckets order by 1;

-- 8) Roles that bypass RLS. Expected: postgres, service_role, supabase_* only.
select rolname, rolbypassrls, rolsuper from pg_roles where rolbypassrls or rolsuper order by 1;

-- 9) Default privileges: new objects must not be granted to browser roles automatically.
select defaclrole::regrole, defaclnamespace::regnamespace, defaclobjtype, defaclacl from pg_default_acl;
