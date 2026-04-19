import { query } from "../db/client";

export type DbAgentMaloneBriefingCheckpoint = {
  id: string;
  projectId: string;
  threadId: string;
  lastBriefedAt: string;
  lastDecisionSummaryHash: string;
  lastReadinessState: string;
  lastNarrativeAlignmentState: string | null;
  lastRecommendedVendorId: string | null;
  lastRecommendationConfidence: string | null;
  lastOpenBlockerCount: number;
  lastOpenWarningCount: number;
  lastSummaryFingerprint: string;
  threadFocusSnapshot: string | null;
  competitorSimGeneratedAt: string | null;
  updatedAt: string;
};

function mapRow(r: Record<string, unknown>): DbAgentMaloneBriefingCheckpoint {
  return {
    id: String(r.id),
    projectId: String(r.project_id),
    threadId: String(r.thread_id),
    lastBriefedAt: new Date(String(r.last_briefed_at)).toISOString(),
    lastDecisionSummaryHash: String(r.last_decision_summary_hash ?? ""),
    lastReadinessState: String(r.last_readiness_state ?? ""),
    lastNarrativeAlignmentState:
      r.last_narrative_alignment_state == null
        ? null
        : String(r.last_narrative_alignment_state),
    lastRecommendedVendorId:
      r.last_recommended_vendor_id == null
        ? null
        : String(r.last_recommended_vendor_id),
    lastRecommendationConfidence:
      r.last_recommendation_confidence == null
        ? null
        : String(r.last_recommendation_confidence),
    lastOpenBlockerCount: Number(r.last_open_blocker_count ?? 0),
    lastOpenWarningCount: Number(r.last_open_warning_count ?? 0),
    lastSummaryFingerprint: String(r.last_summary_fingerprint ?? ""),
    threadFocusSnapshot:
      r.thread_focus_snapshot == null ? null : String(r.thread_focus_snapshot),
    competitorSimGeneratedAt:
      r.competitor_sim_generated_at == null
        ? null
        : String(r.competitor_sim_generated_at),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function getBriefingCheckpointByThreadId(
  threadId: string,
): Promise<DbAgentMaloneBriefingCheckpoint | null> {
  const r = await query(
    `SELECT * FROM agent_malone_briefing_checkpoints WHERE thread_id = $1`,
    [threadId],
  );
  if (r.rowCount === 0) return null;
  return mapRow(r.rows[0] as Record<string, unknown>);
}

export async function upsertBriefingCheckpoint(input: {
  projectId: string;
  threadId: string;
  lastDecisionSummaryHash: string;
  lastReadinessState: string;
  lastNarrativeAlignmentState: string | null;
  lastRecommendedVendorId: string | null;
  lastRecommendationConfidence: string | null;
  lastOpenBlockerCount: number;
  lastOpenWarningCount: number;
  lastSummaryFingerprint: string;
  threadFocusSnapshot: string | null;
  competitorSimGeneratedAt: string | null;
}): Promise<DbAgentMaloneBriefingCheckpoint> {
  const r = await query(
    `INSERT INTO agent_malone_briefing_checkpoints (
      project_id, thread_id,
      last_briefed_at, last_decision_summary_hash,
      last_readiness_state, last_narrative_alignment_state,
      last_recommended_vendor_id, last_recommendation_confidence,
      last_open_blocker_count, last_open_warning_count,
      last_summary_fingerprint, thread_focus_snapshot,
      competitor_sim_generated_at, updated_at
    ) VALUES ($1, $2, now(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
    ON CONFLICT (thread_id) DO UPDATE SET
      last_briefed_at = now(),
      last_decision_summary_hash = EXCLUDED.last_decision_summary_hash,
      last_readiness_state = EXCLUDED.last_readiness_state,
      last_narrative_alignment_state = EXCLUDED.last_narrative_alignment_state,
      last_recommended_vendor_id = EXCLUDED.last_recommended_vendor_id,
      last_recommendation_confidence = EXCLUDED.last_recommendation_confidence,
      last_open_blocker_count = EXCLUDED.last_open_blocker_count,
      last_open_warning_count = EXCLUDED.last_open_warning_count,
      last_summary_fingerprint = EXCLUDED.last_summary_fingerprint,
      thread_focus_snapshot = EXCLUDED.thread_focus_snapshot,
      competitor_sim_generated_at = EXCLUDED.competitor_sim_generated_at,
      updated_at = now()
    RETURNING *`,
    [
      input.projectId,
      input.threadId,
      input.lastDecisionSummaryHash,
      input.lastReadinessState,
      input.lastNarrativeAlignmentState,
      input.lastRecommendedVendorId,
      input.lastRecommendationConfidence,
      input.lastOpenBlockerCount,
      input.lastOpenWarningCount,
      input.lastSummaryFingerprint,
      input.threadFocusSnapshot,
      input.competitorSimGeneratedAt,
    ],
  );
  return mapRow(r.rows[0] as Record<string, unknown>);
}
