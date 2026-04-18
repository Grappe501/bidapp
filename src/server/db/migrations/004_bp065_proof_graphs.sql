-- BP-006 Day 6.5 — requirement ↔ evidence proof graph (traceable support)

CREATE TABLE IF NOT EXISTS requirement_evidence_proof (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES requirements (id) ON DELETE CASCADE,
  evidence_id uuid NOT NULL REFERENCES evidence_items (id) ON DELETE CASCADE,
  support_strength text NOT NULL CHECK (support_strength IN ('strong', 'moderate', 'weak')),
  validation_status text NOT NULL CHECK (validation_status IN ('verified', 'vendor_claim', 'unverified')),
  source_type text NOT NULL CHECK (source_type IN ('document', 'vendor', 'inferred')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requirement_id, evidence_id)
);

CREATE INDEX IF NOT EXISTS idx_req_ev_proof_requirement_id ON requirement_evidence_proof (requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_ev_proof_evidence_id ON requirement_evidence_proof (evidence_id);
CREATE INDEX IF NOT EXISTS idx_req_ev_proof_project_id ON requirement_evidence_proof (project_id);
