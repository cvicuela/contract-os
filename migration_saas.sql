-- ============================================================
-- ContractOS SaaS Migration
-- Run in: https://supabase.com/dashboard/project/ijuvqzcobvfxkwbdeard/sql/new
-- ============================================================

-- 1. improvement_tips column (from previous feature)
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS improvement_tips jsonb DEFAULT '[]'::jsonb;

-- 2. Users table (plan + trial tracking)
CREATE TABLE IF NOT EXISTS users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        UNIQUE NOT NULL,
  google_id     text,
  plan          text        NOT NULL DEFAULT 'trial', -- trial | starter | pro | enterprise
  trial_started_at timestamptz DEFAULT now(),
  trial_ends_at    timestamptz DEFAULT (now() + interval '30 days'),
  contracts_count  integer  NOT NULL DEFAULT 0,
  paypal_subscription_id text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 3. user_id on contracts
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- 4. Demo user (shared demo session — all existing contracts belong to this user)
INSERT INTO users (id, email, google_id, plan, trial_ends_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@contractos.ai',
  'demo',
  'pro',
  '2099-12-31'::timestamptz
)
ON CONFLICT (email) DO NOTHING;

-- 5. Tag all existing contracts as demo data
UPDATE contracts
SET user_id = '00000000-0000-0000-0000-000000000001'
WHERE user_id IS NULL;

-- 6. Snooze support on alerts and obligations
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS snoozed_until date;

ALTER TABLE obligations
  ADD COLUMN IF NOT EXISTS snoozed_until date;
