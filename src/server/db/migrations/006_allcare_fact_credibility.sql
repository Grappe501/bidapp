-- Credibility / confidence for intelligence facts (AllCare + future ingest)

ALTER TABLE intelligence_facts
  ADD COLUMN IF NOT EXISTS credibility text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS confidence text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_intel_facts_credibility ON intelligence_facts (credibility);
CREATE INDEX IF NOT EXISTS idx_intel_facts_confidence ON intelligence_facts (confidence);
