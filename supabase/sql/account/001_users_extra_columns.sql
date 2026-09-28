-- Migration 001: Add missing columns to users table
-- Run in: Supabase SQL editor → New query → Run

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS two_factor_secret  text,
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_name       text,
  ADD COLUMN IF NOT EXISTS ico                varchar,
  ADD COLUMN IF NOT EXISTS dic                varchar,
  ADD COLUMN IF NOT EXISTS billing_address    text,
  ADD COLUMN IF NOT EXISTS language           varchar DEFAULT 'cs';
