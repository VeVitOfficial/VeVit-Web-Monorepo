-- Fix a live data leak: public.v_active_subscriptions was created without
-- an explicit security setting, defaulting to SECURITY DEFINER — the view
-- ran with the *creator's* privileges and bypassed RLS on the underlying
-- premium_subscriptions/users tables entirely. Combined with the default
-- anon/authenticated SELECT grants Postgres adds on view creation, any
-- unauthenticated visitor could query it and read every paying customer's
-- user_id, nickname, tier, price paid, and payment reference.
--
-- security_invoker makes the view run with the *querying* role's privileges
-- instead, so it now respects premium_subscriptions_own / users_select_own
-- (both scoped to `user_id = auth.uid()`): anon gets zero rows (auth.uid()
-- is null), authenticated users see only their own active subscription.
--
-- Applied directly to prod via Supabase MCP apply_migration on 2026-09-04;
-- this file exists for history/reproducibility, matching this dir's
-- convention.
BEGIN;

ALTER VIEW public.v_active_subscriptions SET (security_invoker = true);

COMMIT;
