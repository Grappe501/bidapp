-- Bid Assembly — baseline schema (BP-005.6)
-- Apply via: npm run db:migrate

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- schema_migrations is created by the migration runner before applying files.

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  bid_number text NOT NULL,
  issuing_organization text NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_bid_number ON projects (bid_number);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  source_type text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Uploaded',
  tags jsonb NOT NULL DEFAULT '[]',
  description text,
  note_count int NOT NULL DEFAULT 0,
  linked_item_count int NOT NULL DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files (project_id);

CREATE TABLE IF NOT EXISTS file_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files (id) ON DELETE CASCADE,
  raw_text text NOT NULL DEFAULT '',
  mime_type text,
  parser_version text NOT NULL DEFAULT 'plain-v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_file_documents_file_id ON file_documents (file_id);

CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_document_id uuid NOT NULL REFERENCES file_documents (id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_chunks_file_document_id ON document_chunks (file_document_id);

CREATE TABLE IF NOT EXISTS requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  source_file_id uuid REFERENCES files (id) ON DELETE SET NULL,
  title text NOT NULL,
  source_file_name text NOT NULL DEFAULT '',
  source_section text NOT NULL DEFAULT '',
  verbatim_text text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  requirement_type text NOT NULL,
  mandatory boolean NOT NULL DEFAULT true,
  response_category text NOT NULL,
  status text NOT NULL,
  risk_level text NOT NULL,
  owner text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON requirements (project_id);
CREATE INDEX IF NOT EXISTS idx_requirements_source_file_id ON requirements (source_file_id);

CREATE TABLE IF NOT EXISTS evidence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  source_file_id uuid REFERENCES files (id) ON DELETE SET NULL,
  title text NOT NULL,
  source_file_name text NOT NULL DEFAULT '',
  source_section text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  evidence_type text NOT NULL,
  validation_status text NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evidence_items_project_id ON evidence_items (project_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_source_file_id ON evidence_items (source_file_id);

CREATE TABLE IF NOT EXISTS requirement_evidence_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES requirements (id) ON DELETE CASCADE,
  evidence_id uuid NOT NULL REFERENCES evidence_items (id) ON DELETE CASCADE,
  support_strength text NOT NULL,
  link_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rel_requirement_id ON requirement_evidence_links (requirement_id);
CREATE INDEX IF NOT EXISTS idx_rel_evidence_id ON requirement_evidence_links (evidence_id);

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

CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  profile_type text NOT NULL,
  summary text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  branding_meta jsonb NOT NULL DEFAULT '{}',
  capabilities jsonb NOT NULL DEFAULT '[]',
  risks jsonb NOT NULL DEFAULT '[]',
  sources jsonb NOT NULL DEFAULT '[]',
  claims jsonb NOT NULL DEFAULT '[]',
  integration_details jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_profiles_project_id ON company_profiles (project_id);

CREATE TABLE IF NOT EXISTS intelligence_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  company_profile_id uuid REFERENCES company_profiles (id) ON DELETE SET NULL,
  source_type text NOT NULL,
  url text,
  url_normalized text,
  title text,
  raw_text text NOT NULL DEFAULT '',
  classification text,
  metadata jsonb NOT NULL DEFAULT '{}',
  validation_status text NOT NULL DEFAULT 'Pending Validation',
  fetched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intel_sources_project_id ON intelligence_sources (project_id);
CREATE INDEX IF NOT EXISTS idx_intel_sources_company_profile_id ON intelligence_sources (company_profile_id);
CREATE INDEX IF NOT EXISTS idx_intel_sources_url_norm ON intelligence_sources (url_normalized);
CREATE UNIQUE INDEX IF NOT EXISTS idx_intel_sources_proj_profile_url_norm
  ON intelligence_sources (project_id, company_profile_id, url_normalized);

CREATE TABLE IF NOT EXISTS intelligence_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES intelligence_sources (id) ON DELETE CASCADE,
  company_profile_id uuid REFERENCES company_profiles (id) ON DELETE SET NULL,
  fact_type text NOT NULL,
  fact_text text NOT NULL,
  classification text,
  validation_status text NOT NULL DEFAULT 'Pending Validation',
  credibility text NOT NULL DEFAULT '',
  confidence text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intel_facts_project_id ON intelligence_facts (project_id);
CREATE INDEX IF NOT EXISTS idx_intel_facts_source_id ON intelligence_facts (source_id);
CREATE INDEX IF NOT EXISTS idx_intel_facts_company_profile_id ON intelligence_facts (company_profile_id);
CREATE INDEX IF NOT EXISTS idx_intel_facts_credibility ON intelligence_facts (credibility);
CREATE INDEX IF NOT EXISTS idx_intel_facts_confidence ON intelligence_facts (confidence);

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL,
  summary text NOT NULL DEFAULT '',
  fit_score smallint NOT NULL DEFAULT 3,
  implementation_speed text NOT NULL DEFAULT 'Moderate',
  ltc_fit text NOT NULL DEFAULT 'Moderate',
  api_readiness text NOT NULL DEFAULT 'Moderate',
  pricing_notes text NOT NULL DEFAULT '',
  likely_stack_role text NOT NULL DEFAULT '',
  strengths jsonb NOT NULL DEFAULT '[]',
  weaknesses jsonb NOT NULL DEFAULT '[]',
  risks jsonb NOT NULL DEFAULT '[]',
  notes text NOT NULL DEFAULT '',
  capabilities jsonb NOT NULL DEFAULT '[]',
  source_file_ids jsonb NOT NULL DEFAULT '[]',
  primary_contact_name text NOT NULL DEFAULT '',
  primary_contact_email text NOT NULL DEFAULT '',
  primary_contact_phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendors_project_id ON vendors (project_id);

CREATE TABLE IF NOT EXISTS vendor_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor_id ON vendor_contacts (vendor_id);

CREATE TABLE IF NOT EXISTS vendor_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  source_id uuid REFERENCES intelligence_sources (id) ON DELETE SET NULL,
  claim_text text NOT NULL,
  validation_status text NOT NULL DEFAULT 'Unverified',
  credibility text NOT NULL DEFAULT '',
  confidence text NOT NULL DEFAULT '',
  claim_category text NOT NULL DEFAULT 'other',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_claims_vendor_id ON vendor_claims (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_claims_source_id ON vendor_claims (source_id);

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

CREATE TABLE IF NOT EXISTS architecture_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL,
  summary text NOT NULL DEFAULT '',
  recommended boolean NOT NULL DEFAULT false,
  narrative_strengths jsonb NOT NULL DEFAULT '[]',
  implementation_risks jsonb NOT NULL DEFAULT '[]',
  malone_position_summary text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_arch_options_project_id ON architecture_options (project_id);

CREATE TABLE IF NOT EXISTS architecture_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  architecture_option_id uuid NOT NULL REFERENCES architecture_options (id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors (id) ON DELETE SET NULL,
  vendor_name text NOT NULL DEFAULT '',
  role text NOT NULL,
  responsibility_summary text NOT NULL DEFAULT '',
  optional_layer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_arch_components_option_id ON architecture_components (architecture_option_id);
CREATE INDEX IF NOT EXISTS idx_arch_components_vendor_id ON architecture_components (vendor_id);

CREATE TABLE IF NOT EXISTS submission_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  phase text NOT NULL,
  status text NOT NULL,
  owner text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_submission_items_project_id ON submission_items (project_id);

-- BP-005.7 (see migrations/002_bp057_retrieval_ai_grounding.sql)

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

-- BP-006 draft persistence (see migrations/003_bp006_draft_persistence.sql)

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

-- Claim validation (see migrations/012_vendor_claim_validation.sql)
CREATE TABLE IF NOT EXISTS vendor_claim_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_id uuid NOT NULL REFERENCES vendor_claim_validations (id) ON DELETE CASCADE,
  source_id uuid REFERENCES intelligence_sources (id) ON DELETE SET NULL,
  fact_id uuid NULL REFERENCES intelligence_facts (id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN ('support', 'contradict')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_claim_validation_evidence_validation_id ON vendor_claim_validation_evidence (validation_id);

-- Failure mode simulator (see migrations/013_vendor_failure_modes.sql)
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

-- Vendor role fit (see migrations/014_vendor_role_fit.sql)
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
