-- Migration 004: SECURITY DEFINER function for safe user deletion
-- Deletes child rows in FK order, then the user row.
-- Call via: POST /rest/v1/rpc/delete_user_account {"target_id": "..."}
--
-- NOTE: Remove the login_attempts DELETE line if that table has no user_id FK.

CREATE OR REPLACE FUNCTION public.delete_user_account(target_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ai_usage_log            WHERE user_id = target_id;
  DELETE FROM public.daily_bonus_log         WHERE user_id = target_id;
  DELETE FROM public.store_orders            WHERE user_id = target_id;
  DELETE FROM public.games_stats             WHERE user_id = target_id;
  DELETE FROM public.lesson_comments         WHERE user_id = target_id;
  DELETE FROM public.certificates            WHERE user_id = target_id;
  DELETE FROM public.cal_reminders           WHERE user_id = target_id;
  DELETE FROM public.cal_events              WHERE user_id = target_id;
  DELETE FROM public.premium_subscriptions   WHERE user_id = target_id;
  DELETE FROM public.user_notification_prefs WHERE user_id = target_id;
  DELETE FROM public.account_activity        WHERE user_id = target_id;
  DELETE FROM public.sessions                WHERE user_id = target_id;
  DELETE FROM public.users                   WHERE id      = target_id;
END;
$$;

-- Revoke public execute, grant only to service_role
REVOKE EXECUTE ON FUNCTION public.delete_user_account(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_user_account(text) TO service_role;
