-- Vendor role fit: ownership vs Malone, handoffs, gaps (per bid / vendor).

CREATE TABLE IF NOT EXISTS vendor_role_fit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  architecture_option_id uuid NULL REFERENCES architecture_options (id) ON DELETE SET NULL,
  role_key text NOT NULL,
  ownership_recommendation text NOT NULL,
  confidence text NOT NULL,
  fit_level text NOT NULL,
  evidence_strength text NOT NULL,
  malone_dependency_level text NOT NULL,
  handoff_complexity text NOT NULL,
  overlap_risk text NOT NULL,
  gap_risk text NOT NULL,
  rationale text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, vendor_id, role_key)
);

CREATE INDEX IF NOT EXISTS idx_vendor_role_fit_vendor ON vendor_role_fit (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_role_fit_project ON vendor_role_fit (project_id);

CREATE TABLE IF NOT EXISTS vendor_role_fit_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  role_fit_id uuid NOT NULL REFERENCES vendor_role_fit (id) ON DELETE CASCADE,
  detail_type text NOT NULL CHECK (
    detail_type IN (
      'strength',
      'weakness',
      'malone_responsibility',
      'unresolved_question'
    )
  ),
  detail_text text NOT NULL DEFAULT '',
  source_id uuid REFERENCES intelligence_sources (id) ON DELETE SET NULL,
  fact_id uuid NULL REFERENCES intelligence_facts (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_role_fit_details_role ON vendor_role_fit_details (role_fit_id);
