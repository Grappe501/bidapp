-- Agent Malone V3 — project-scoped threads, messages, working memory

CREATE TABLE IF NOT EXISTS agent_malone_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'General',
  status text NOT NULL DEFAULT 'active',
  current_vendor_id uuid REFERENCES vendors (id) ON DELETE SET NULL,
  current_architecture_option_id uuid REFERENCES architecture_options (id) ON DELETE SET NULL,
  current_section_id uuid REFERENCES draft_sections (id) ON DELETE SET NULL,
  current_focus text,
  summary_line text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_malone_threads_status_chk CHECK (status IN ('active', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_agent_malone_threads_project_id ON agent_malone_threads (project_id);
CREATE INDEX IF NOT EXISTS idx_agent_malone_threads_project_status ON agent_malone_threads (project_id, status);

CREATE TABLE IF NOT EXISTS agent_malone_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES agent_malone_threads (id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  structured_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_malone_messages_role_chk CHECK (
    role IN ('user', 'agent', 'system', 'action')
  )
);

CREATE INDEX IF NOT EXISTS idx_agent_malone_messages_thread_id ON agent_malone_messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_agent_malone_messages_thread_created ON agent_malone_messages (thread_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_malone_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES agent_malone_threads (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  memory_key text NOT NULL,
  memory_value text NOT NULL DEFAULT '',
  confidence text,
  source text NOT NULL DEFAULT 'agent_inferred',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_malone_memory_key_chk CHECK (
    memory_key IN (
      'current_vendor',
      'current_architecture',
      'current_section',
      'current_focus',
      'current_readiness_blocker',
      'current_decision',
      'last_action',
      'last_action_result',
      'open_follow_up',
      'open_risk',
      'selected_bundle_type'
    )
  ),
  CONSTRAINT agent_malone_memory_confidence_chk CHECK (
    confidence IS NULL OR confidence IN ('high', 'medium', 'low')
  ),
  CONSTRAINT agent_malone_memory_source_chk CHECK (
    source IN ('explicit_user', 'page_context', 'agent_inferred', 'action_result')
  ),
  CONSTRAINT agent_malone_memory_thread_key_uniq UNIQUE (thread_id, memory_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_malone_memory_thread_id ON agent_malone_memory (thread_id);
CREATE INDEX IF NOT EXISTS idx_agent_malone_memory_project_id ON agent_malone_memory (project_id);
