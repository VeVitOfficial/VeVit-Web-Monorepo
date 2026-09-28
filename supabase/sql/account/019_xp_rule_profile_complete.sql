-- 019: 100 XP for claiming a fully completed profile (account overview button).
insert into public.xp_rules (source, amount, max_amount, daily_cap, bonus_applies)
values ('account.profile_complete', 100, null, null, true)
on conflict (source) do update set amount = excluded.amount;
