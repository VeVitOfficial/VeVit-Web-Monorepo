-- 017: new XP / rank / tier / organization tables are server-only.
revoke all on table public.tiers, public.ranks, public.user_ranks, public.organizations, public.organization_members, public.organization_invites, public.xp_rules, public.xp_ledger from anon, authenticated;
