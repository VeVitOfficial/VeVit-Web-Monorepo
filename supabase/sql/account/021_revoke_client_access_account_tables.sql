-- 021: account tables are server-only (Next.js uses the secret key). RLS already
-- blocked the public key, this removes the grants too so a permissive policy
-- added later cannot expose them.
revoke all on table
  public.users, public.sessions, public.auth_challenges, public.user_totp_methods,
  public.user_recovery_codes, public.oauth_attempts, public.oauth_identities,
  public.login_attempts, public.premium_subscriptions, public.account_activity,
  public.pending_phone_registrations, public.api_refresh_tokens, public.user_preferences,
  public.user_notification_prefs, public.stripe_webhook_events, public.premium_price_catalog,
  public.newsletter_subscribers, public.v_active_subscriptions
from anon, authenticated;

revoke all on function public.consume_oauth_attempt(text) from public, anon, authenticated;
revoke all on function public.create_oauth_user_and_identity(text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.consume_oauth_attempt(text) to service_role;
grant execute on function public.create_oauth_user_and_identity(text, text, text, text, text, text, text) to service_role;
