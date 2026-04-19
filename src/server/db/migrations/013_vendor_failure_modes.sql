-- Failure mode simulator: stress scenarios and resilience posture per vendor (per bid).

CREATE TABLE IF NOT EXISTS vendor_failure_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  architecture_option_id uuid NULL REFERENCES architecture_options (id) ON DELETE SET NULL,
  scenario_key text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  likelihood text NOT NULL,
  impact text NOT NULL,
  recoverability text NOT NULL,
  time_to_recover_estimate text,
  vendor_preparedness text NOT NULL,
  evidence_strength text NOT NULL,
  rationale text NOT NULL DEFAULT '',
  scoring_solution_impact smallint NOT NULL DEFAULT 0,
  scoring_risk_impact smallint NOT NULL DEFAULT 0,
  scoring_interview_impact smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, vendor_id, scenario_key)
);

CREATE INDEX IF NOT EXISTS idx_vendor_failure_modes_vendor ON vendor_failure_modes (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_failure_modes_project ON vendor_failure_modes (project_id);

CREATE TABLE IF NOT EXISTS vendor_failure_mode_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  failure_mode_id uuid NOT NULL REFERENCES vendor_failure_modes (id) ON DELETE CASCADE,
  detail_type text NOT NULL CHECK (
    detail_type IN ('trigger', 'mitigation', 'unknown', 'source_link')
  ),
  detail_text text NOT NULL DEFAULT '',
  source_id uuid REFERENCES intelligence_sources (id) ON DELETE SET NULL,
  fact_id uuid NULL REFERENCES intelligence_facts (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_failure_mode_details_mode ON vendor_failure_mode_details (failure_mode_id);
