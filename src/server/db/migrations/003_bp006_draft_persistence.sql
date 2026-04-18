-- BP-006 Day 6: durable draft sections, versions, and grounding lineage

CREATE TABLE IF NOT EXISTS draft_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  section_type text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Not Started',
  active_version_id uuid,
  selected_grounding_bundle_id uuid REFERENCES grounding_bundles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, section_type)
);

CREATE INDEX IF NOT EXISTS idx_draft_sections_project_id ON draft_sections (project_id);

CREATE TABLE IF NOT EXISTS draft_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES draft_sections (id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  grounding_bundle_id uuid REFERENCES grounding_bundles (id) ON DELETE SET NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  generation_mode text,
  note text,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_draft_versions_section_id ON draft_versions (section_id);
CREATE INDEX IF NOT EXISTS idx_draft_versions_grounding_bundle_id ON draft_versions (grounding_bundle_id);
