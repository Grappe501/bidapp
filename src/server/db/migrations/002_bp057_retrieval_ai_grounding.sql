-- BP-005.7: semantic retrieval, AI parsing, enrichment, grounding
-- Embeddings stored as jsonb arrays (cosine similarity in application layer).

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS linked_vendor_id uuid REFERENCES vendors (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_linked_vendor_id ON company_profiles (linked_vendor_id);

CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_chunk_id uuid NOT NULL REFERENCES document_chunks (id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES files (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  embedding_model text NOT NULL,
  embedding_vector jsonb NOT NULL,
  chunk_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_chunk_id)
);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_project_id ON document_embeddings (project_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_file_id ON document_embeddings (file_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_chunk_id ON document_embeddings (document_chunk_id);

CREATE TABLE IF NOT EXISTS retrieval_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  query_text text NOT NULL,
  query_type text NOT NULL,
  top_k int NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_retrieval_queries_project_id ON retrieval_queries (project_id);

CREATE TABLE IF NOT EXISTS retrieval_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retrieval_query_id uuid NOT NULL REFERENCES retrieval_queries (id) ON DELETE CASCADE,
  document_chunk_id uuid NOT NULL REFERENCES document_chunks (id) ON DELETE CASCADE,
  score double precision NOT NULL,
  rank int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_retrieval_results_query_id ON retrieval_results (retrieval_query_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_results_chunk_id ON retrieval_results (document_chunk_id);

CREATE TABLE IF NOT EXISTS parsed_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_payload_json jsonb NOT NULL,
  confidence double precision NOT NULL DEFAULT 0,
  validation_status text NOT NULL DEFAULT 'Pending Validation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_parsed_entities_project_id ON parsed_entities (project_id);
CREATE INDEX IF NOT EXISTS idx_parsed_entities_source ON parsed_entities (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_parsed_entities_entity_type ON parsed_entities (entity_type);

CREATE TABLE IF NOT EXISTS grounding_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  bundle_type text NOT NULL,
  target_entity_id uuid,
  title text NOT NULL DEFAULT '',
  bundle_payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grounding_bundles_project_id ON grounding_bundles (project_id);
CREATE INDEX IF NOT EXISTS idx_grounding_bundles_type ON grounding_bundles (bundle_type);

CREATE TABLE IF NOT EXISTS company_enrichment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_profile_id uuid NOT NULL REFERENCES company_profiles (id) ON DELETE CASCADE,
  source_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_enrichment_runs_profile_id ON company_enrichment_runs (company_profile_id);
