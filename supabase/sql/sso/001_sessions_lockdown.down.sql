-- Bezpečnostní rollback záměrně neobnovuje sessions_own ani klientské granty.
drop index if exists public.sessions_expires_idx;
drop index if exists public.sessions_user_active_idx;
drop index if exists public.sessions_token_hash_uidx;

alter table public.sessions
  drop column if exists ip_hash,
  drop column if exists ua_hash,
  drop column if exists device_label,
  drop column if exists revoked_reason,
  drop column if exists revoked_at,
  drop column if exists csrf_token_hash,
  drop column if exists token_hash;

alter table public.users drop constraint if exists users_status_check;
alter table public.users
  drop column if exists status_reason,
  drop column if exists status_changed_at,
  drop column if exists status;

-- delete_user_account a store_product_views zůstávají zamčené i po rollbacku.
