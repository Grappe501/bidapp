import { query } from "../db/client";
import type { EvaluatedFailureMode } from "../lib/failure-simulation-engine";

export type DbVendorFailureMode = {
  id: string;
  projectId: string;
  vendorId: string;
  architectureOptionId: string | null;
  scenarioKey: string;
  category: string;
  title: string;
  description: string;
  likelihood: string;
  impact: string;
  recoverability: string;
  timeToRecoverEstimate: string | null;
  vendorPreparedness: string;
  evidenceStrength: string;
  rationale: string;
  scoringSolutionImpact: number;
  scoringRiskImpact: number;
  scoringInterviewImpact: number;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: Record<string, unknown>): DbVendorFailureMode {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    vendorId: String(row.vendor_id),
    architectureOptionId:
      row.architecture_option_id == null
        ? null
        : String(row.architecture_option_id),
    scenarioKey: String(row.scenario_key),
    category: String(row.category),
    title: String(row.title),
    description: String(row.description ?? ""),
    likelihood: String(row.likelihood),
    impact: String(row.impact),
    recoverability: String(row.recoverability),
    timeToRecoverEstimate:
      row.time_to_recover_estimate == null
        ? null
        : String(row.time_to_recover_estimate),
    vendorPreparedness: String(row.vendor_preparedness),
    evidenceStrength: String(row.evidence_strength),
    rationale: String(row.rationale ?? ""),
    scoringSolutionImpact: Number(row.scoring_solution_impact ?? 0),
    scoringRiskImpact: Number(row.scoring_risk_impact ?? 0),
    scoringInterviewImpact: Number(row.scoring_interview_impact ?? 0),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function deleteVendorFailureModesForVendor(input: {
  projectId: string;
  vendorId: string;
}): Promise<void> {
  await query(
    `DELETE FROM vendor_failure_modes WHERE project_id = $1 AND vendor_id = $2`,
    [input.projectId, input.vendorId],
  );
}

export async function insertVendorFailureMode(input: {
  projectId: string;
  vendorId: string;
  architectureOptionId: string | null;
  evaluated: EvaluatedFailureMode;
}): Promise<{ id: string }> {
  const e = input.evaluated;
  const r = await query(
    `INSERT INTO vendor_failure_modes (
      project_id, vendor_id, architecture_option_id, scenario_key, category, title, description,
      likelihood, impact, recoverability, time_to_recover_estimate,
      vendor_preparedness, evidence_strength, rationale,
      scoring_solution_impact, scoring_risk_impact, scoring_interview_impact,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now())
    RETURNING id`,
    [
      input.projectId,
      input.vendorId,
      input.architectureOptionId,
      e.scenarioKey,
      e.category,
      e.title,
      e.description,
      e.likelihood,
      e.impact,
      e.recoverability,
      e.timeToRecoverEstimate,
      e.vendorPreparedness,
      e.evidenceStrength,
      e.rationale,
      e.scoringSolutionImpact,
      e.scoringRiskImpact,
      e.scoringInterviewImpact,
    ],
  );
  const id = String((r.rows[0] as Record<string, unknown>).id);
  return { id };
}

export async function insertFailureModeDetail(input: {
  failureModeId: string;
  detailType: "trigger" | "mitigation" | "unknown" | "source_link";
  detailText: string;
  sourceId: string | null;
  factId: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO vendor_failure_mode_details (
      failure_mode_id, detail_type, detail_text, source_id, fact_id
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      input.failureModeId,
      input.detailType,
      input.detailText,
      input.sourceId,
      input.factId,
    ],
  );
}

export async function listFailureModeDetailsForVendor(input: {
  projectId: string;
  vendorId: string;
}): Promise<
  Array<{
    failureModeId: string;
    detailType: "trigger" | "mitigation" | "unknown" | "source_link";
    detailText: string;
  }>
> {
  const r = await query(
    `SELECT d.failure_mode_id, d.detail_type, d.detail_text
     FROM vendor_failure_mode_details d
     INNER JOIN vendor_failure_modes m ON m.id = d.failure_mode_id
     WHERE m.project_id = $1 AND m.vendor_id = $2`,
    [input.projectId, input.vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) => ({
    failureModeId: String(row.failure_mode_id),
    detailType: String(row.detail_type) as
      | "trigger"
      | "mitigation"
      | "unknown"
      | "source_link",
    detailText: String(row.detail_text ?? ""),
  }));
}

export async function listVendorFailureModes(input: {
  projectId: string;
  vendorId: string;
}): Promise<DbVendorFailureMode[]> {
  const r = await query(
    `SELECT * FROM vendor_failure_modes
     WHERE project_id = $1 AND vendor_id = $2
     ORDER BY
       CASE impact WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       CASE likelihood WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2,
       scenario_key`,
    [input.projectId, input.vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapRow(row));
}
