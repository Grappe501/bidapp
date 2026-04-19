-- Vendor interview intelligence: expanded questions, answers, assessments, optional sessions

ALTER TABLE vendor_interview_questions
  ADD COLUMN IF NOT EXISTS why_it_matters text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS risk_if_unanswered text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS linked_requirement_keys jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS linked_fit_dimension_keys jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS linked_gap_keys jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS answer_status text NOT NULL DEFAULT 'unanswered',
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_vendor_interview_questions_sort ON vendor_interview_questions (vendor_id, sort_order);

CREATE TABLE IF NOT EXISTS vendor_interview_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES vendor_interview_questions (id) ON DELETE CASCADE,
  answer_text text NOT NULL DEFAULT '',
  answer_source text NOT NULL DEFAULT 'live_interview',
  answered_by text NOT NULL DEFAULT '',
  answered_at timestamptz,
  interviewer text NOT NULL DEFAULT '',
  normalized_summary text NOT NULL DEFAULT '',
  normalized_json jsonb NOT NULL DEFAULT '{}',
  confidence text NOT NULL DEFAULT 'unknown',
  validation_status text NOT NULL DEFAULT 'unreviewed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_interview_answers_vendor ON vendor_interview_answers (vendor_id);

CREATE TABLE IF NOT EXISTS vendor_interview_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES vendor_interview_questions (id) ON DELETE CASCADE,
  answer_id uuid REFERENCES vendor_interview_answers (id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT '',
  score_0_to_5 smallint NOT NULL DEFAULT 0,
  rationale text NOT NULL DEFAULT '',
  follow_up_required boolean NOT NULL DEFAULT false,
  risk_flag boolean NOT NULL DEFAULT false,
  pricing_flag boolean NOT NULL DEFAULT false,
  integration_flag boolean NOT NULL DEFAULT false,
  execution_flag boolean NOT NULL DEFAULT false,
  source_fact_ids jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_interview_assessments_vendor ON vendor_interview_assessments (vendor_id);

CREATE TABLE IF NOT EXISTS vendor_interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'planned',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_interview_sessions_project ON vendor_interview_sessions (project_id);
