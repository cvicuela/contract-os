-- =============================================================================
-- Contract Intelligence SaaS — Supabase PostgreSQL Schema
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- contracts
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT          NOT NULL,
  type            TEXT          NOT NULL,
  party_a         TEXT          NOT NULL,
  party_b         TEXT          NOT NULL,
  start_date      DATE,
  end_date        DATE,
  renewal_type    TEXT,
  notice_days     INTEGER,
  risk_score      NUMERIC(4, 2) CHECK (risk_score >= 0 AND risk_score <= 10),
  status          TEXT          NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'expired', 'pending', 'cancelled')),
  file_url        TEXT,
  raw_text        TEXT,
  ai_summary      TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE contracts IS 'Core contract records for the Contract Intelligence SaaS.';
COMMENT ON COLUMN contracts.risk_score IS 'AI-computed risk score on a 0–10 scale.';
COMMENT ON COLUMN contracts.renewal_type IS 'e.g. automatic, manual, evergreen.';
COMMENT ON COLUMN contracts.notice_days IS 'Days notice required before renewal or termination.';

-- obligations
CREATE TABLE IF NOT EXISTS obligations (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID          NOT NULL
                                REFERENCES contracts (id) ON DELETE CASCADE,
  description     TEXT          NOT NULL,
  frequency       TEXT,
  next_due_date   DATE,
  status          TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'completed', 'overdue')),
  risk_level      TEXT          NOT NULL DEFAULT 'low'
                                CHECK (risk_level IN ('low', 'medium', 'high'))
);

COMMENT ON TABLE obligations IS 'Contractual obligations extracted (manually or via AI) from contracts.';
COMMENT ON COLUMN obligations.frequency IS 'e.g. monthly, quarterly, annually, one-time.';

-- alerts
CREATE TABLE IF NOT EXISTS alerts (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID          NOT NULL
                                REFERENCES contracts (id) ON DELETE CASCADE,
  message         TEXT          NOT NULL,
  severity        TEXT          NOT NULL
                                CHECK (severity IN ('info', 'warning', 'critical')),
  trigger_date    DATE          NOT NULL,
  status          TEXT          NOT NULL DEFAULT 'unread'
                                CHECK (status IN ('unread', 'read', 'dismissed')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE alerts IS 'System-generated and rule-based alerts tied to contract deadlines and risk events.';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- contracts
CREATE INDEX IF NOT EXISTS idx_contracts_status     ON contracts (status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date   ON contracts (end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_risk_score ON contracts (risk_score);

-- obligations
CREATE INDEX IF NOT EXISTS idx_obligations_contract_id   ON obligations (contract_id);
CREATE INDEX IF NOT EXISTS idx_obligations_next_due_date ON obligations (next_due_date);

-- alerts
CREATE INDEX IF NOT EXISTS idx_alerts_contract_id ON alerts (contract_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status      ON alerts (status);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE contracts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts      ENABLE ROW LEVEL SECURITY;

-- TODO: Add multi-tenant RLS policies once auth.users and org_id are introduced.
-- Example patterns to implement:
--
-- -- Allow users to select only their own organisation's contracts:
-- CREATE POLICY "contracts_select_own_org"
--   ON contracts
--   FOR SELECT
--   USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
--
-- -- Allow users to insert contracts into their organisation:
-- CREATE POLICY "contracts_insert_own_org"
--   ON contracts
--   FOR INSERT
--   WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
--
-- -- Allow users to update contracts in their organisation:
-- CREATE POLICY "contracts_update_own_org"
--   ON contracts
--   FOR UPDATE
--   USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
--
-- -- Allow users to delete contracts in their organisation:
-- CREATE POLICY "contracts_delete_own_org"
--   ON contracts
--   FOR DELETE
--   USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
--
-- (Mirror identical policies for `obligations` and `alerts`.)
