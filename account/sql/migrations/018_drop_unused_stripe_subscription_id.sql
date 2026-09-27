-- 018: the stripe-webhook edge function keeps the Stripe subscription id in
-- premium_subscriptions.payment_id; the columns added in 015 were unused.
drop index if exists public.premium_subscriptions_stripe_sub_key;
alter table public.premium_subscriptions drop column if exists stripe_subscription_id, drop column if exists stripe_customer_id;
