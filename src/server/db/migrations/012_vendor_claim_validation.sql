-- Claim validation engine: evidence-backed support for normalized vendor claims.

CREATE TABLE IF NOT EXISTS vendor_claim_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  normalized_claim_key text NOT NULL,
  machine_claim_text text NOT NULL DEFAULT '',
  claim_text text NOT NULL,
  claim_text_locked boolean NOT NULL DEFAULT false,
  claim_category text NOT NULL DEFAULT 'other',
  claim_source_type text NOT NULL DEFAULT 'derived',
  support_level text NOT NULL DEFAULT 'none',
  contradiction_status text NOT NULL DEFAULT 'none',
  confidence text NOT NULL DEFAULT 'low',
  needs_follow_up boolean NOT NULL DEFAULT false,
  follow_up_reason text,
  scoring_impact text NOT NULL DEFAULT 'neutral',
  rationale text NOT NULL DEFAULT '',
  machine_rationale text NOT NULL DEFAULT '',
  human_note text NOT NULL DEFAULT '',
  is_critical boolean NOT NULL DEFAULT false,
  support_level_override text,
  evidence_source_ids jsonb NOT NULL DEFAULT '[]',
  supporting_fact_ids jsonb NOT NULL DEFAULT '[]',
  contradicting_fact_ids jsonb NOT NULL DEFAULT '[]',
  originating_vendor_claim_id uuid REFERENCES vendor_claims (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, normalized_claim_key)
);

CREATE INDEX IF NOT EXISTS idx_vendor_claim_validations_vendor_id ON vendor_claim_validations (vendor_id);

CREATE TABLE IF NOT EXISTS vendor_claim_validation_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  validation_id uuid NOT NULL REFERENCES vendor_claim_validations (id) ON DELETE CASCADE,
  source_id uuid REFERENCES intelligence_sources (id) ON DELETE SET NULL,
  fact_id uuid NULL REFERENCES intelligence_facts (id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN ('support', 'contradict')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_claim_validation_evidence_validation_id ON vendor_claim_validation_evidence (validation_id);
