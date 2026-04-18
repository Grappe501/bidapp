-- AllCare public site ingest + branding fields (BP-ALLCARE)

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS website_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS branding_meta jsonb NOT NULL DEFAULT '{}';

ALTER TABLE intelligence_sources
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS url_normalized text;

-- Replace partial unique index if an older migration variant existed.
DROP INDEX IF EXISTS idx_intel_sources_proj_profile_url_norm;
-- Multiple NULL url_normalized allowed per profile (non-scrape sources).
CREATE UNIQUE INDEX IF NOT EXISTS idx_intel_sources_proj_profile_url_norm
  ON intelligence_sources (project_id, company_profile_id, url_normalized);

CREATE INDEX IF NOT EXISTS idx_intel_sources_url_norm ON intelligence_sources (url_normalized);
