-- Agent Malone — persisted checkpoints for auto-brief / "what changed" deltas

CREATE TABLE IF NOT EXISTS agent_malone_briefing_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES agent_malone_threads (id) ON DELETE CASCADE,
  last_briefed_at timestamptz NOT NULL DEFAULT now(),
  last_decision_summary_hash text NOT NULL DEFAULT '',
  last_readiness_state text NOT NULL DEFAULT '',
  last_narrative_alignment_state text,
  last_recommended_vendor_id uuid REFERENCES vendors (id) ON DELETE SET NULL,
  last_recommendation_confidence text,
  last_open_blocker_count int NOT NULL DEFAULT 0,
  last_open_warning_count int NOT NULL DEFAULT 0,
  last_summary_fingerprint text NOT NULL DEFAULT '',
  thread_focus_snapshot text,
  competitor_sim_generated_at text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_malone_briefing_checkpoints_thread_uniq UNIQUE (thread_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_malone_briefing_checkpoints_project
  ON agent_malone_briefing_checkpoints (project_id);
