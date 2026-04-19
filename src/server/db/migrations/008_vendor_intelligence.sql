-- Vendor intelligence: fit matrix, integration reqs, interview prep, discovery, research runs

CREATE TABLE IF NOT EXISTS vendor_fit_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  dimension_key text NOT NULL,
  score smallint NOT NULL,
  confidence text NOT NULL DEFAULT '',
  rationale text NOT NULL DEFAULT '',
  source_ids jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, dimension_key)
);
CREATE INDEX IF NOT EXISTS idx_vendor_fit_dimensions_vendor_id ON vendor_fit_dimensions (vendor_id);

CREATE TABLE IF NOT EXISTS vendor_integration_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  requirement_key text NOT NULL,
  status text NOT NULL,
  evidence text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, requirement_key)
);
CREATE INDEX IF NOT EXISTS idx_vendor_integration_requirements_vendor_id ON vendor_integration_requirements (vendor_id);

CREATE TABLE IF NOT EXISTS vendor_interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  question text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL,
  linked_gap_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_interview_questions_vendor_id ON vendor_interview_questions (vendor_id);

CREATE TABLE IF NOT EXISTS vendor_discovery_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text NOT NULL DEFAULT '',
  similarity_score double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_discovery_candidates_project_id ON vendor_discovery_candidates (project_id);

CREATE TABLE IF NOT EXISTS vendor_research_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  run_type text NOT NULL,
  status text NOT NULL,
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_research_runs_project_vendor ON vendor_research_runs (project_id, vendor_id);

CREATE INDEX IF NOT EXISTS idx_intel_sources_vendor_metadata ON intelligence_sources ((metadata ->> 'vendorId'));
