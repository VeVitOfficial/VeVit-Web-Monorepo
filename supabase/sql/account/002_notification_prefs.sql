-- Migration 002: user_notification_prefs table
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  user_id         text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  security_alerts boolean NOT NULL DEFAULT true,
  product_updates boolean NOT NULL DEFAULT true,
  marketing       boolean NOT NULL DEFAULT false,
  billing_summary boolean NOT NULL DEFAULT true
);
