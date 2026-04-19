import { query } from "../db/client";
import type { EvaluatedVendorRole } from "../lib/vendor-role-fit-engine";

export type DbVendorRoleFit = {
  id: string;
  projectId: string;
  vendorId: string;
  architectureOptionId: string | null;
  roleKey: string;
  ownershipRecommendation: string;
  confidence: string;
  fitLevel: string;
  evidenceStrength: string;
  maloneDependencyLevel: string;
  handoffComplexity: string;
  overlapRisk: string;
  gapRisk: string;
  rationale: string;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: Record<string, unknown>): DbVendorRoleFit {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    vendorId: String(row.vendor_id),
    architectureOptionId:
      row.architecture_option_id == null ? null : String(row.architecture_option_id),
    roleKey: String(row.role_key),
    ownershipRecommendation: String(row.ownership_recommendation),
    confidence: String(row.confidence),
    fitLevel: String(row.fit_level),
    evidenceStrength: String(row.evidence_strength),
    maloneDependencyLevel: String(row.malone_dependency_level),
    handoffComplexity: String(row.handoff_complexity),
    overlapRisk: String(row.overlap_risk),
    gapRisk: String(row.gap_risk),
    rationale: String(row.rationale ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function deleteVendorRoleFitForVendor(input: {
  projectId: string;
  vendorId: string;
}): Promise<void> {
  await query(
    `DELETE FROM vendor_role_fit WHERE project_id = $1 AND vendor_id = $2`,
    [input.projectId, input.vendorId],
  );
}

export async function insertVendorRoleFit(input: {
  projectId: string;
  vendorId: string;
  architectureOptionId: string | null;
  evaluated: EvaluatedVendorRole;
}): Promise<{ id: string }> {
  const e = input.evaluated;
  const r = await query(
    `INSERT INTO vendor_role_fit (
      project_id, vendor_id, architecture_option_id, role_key,
      ownership_recommendation, confidence, fit_level, evidence_strength,
      malone_dependency_level, handoff_complexity, overlap_risk, gap_risk, rationale, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())
    RETURNING id`,
    [
      input.projectId,
      input.vendorId,
      input.architectureOptionId,
      e.roleKey,
      e.ownershipRecommendation,
      e.confidence,
      e.fitLevel,
      e.evidenceStrength,
      e.maloneDependencyLevel,
      e.handoffComplexity,
      e.overlapRisk,
      e.gapRisk,
      e.rationale,
    ],
  );
  const id = String((r.rows[0] as Record<string, unknown>).id);
  return { id };
}

export async function insertVendorRoleFitDetail(input: {
  roleFitId: string;
  detailType: "strength" | "weakness" | "malone_responsibility" | "unresolved_question";
  detailText: string;
  sourceId: string | null;
  factId: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO vendor_role_fit_details (
      role_fit_id, detail_type, detail_text, source_id, fact_id
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      input.roleFitId,
      input.detailType,
      input.detailText,
      input.sourceId,
      input.factId,
    ],
  );
}

export async function listVendorRoleFitDetailsForVendor(input: {
  projectId: string;
  vendorId: string;
}): Promise<
  Array<{
    roleFitId: string;
    detailType: "strength" | "weakness" | "malone_responsibility" | "unresolved_question";
    detailText: string;
  }>
> {
  const r = await query(
    `SELECT d.role_fit_id, d.detail_type, d.detail_text
     FROM vendor_role_fit_details d
     INNER JOIN vendor_role_fit v ON v.id = d.role_fit_id
     WHERE v.project_id = $1 AND v.vendor_id = $2`,
    [input.projectId, input.vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) => ({
    roleFitId: String(row.role_fit_id),
    detailType: String(row.detail_type) as
      | "strength"
      | "weakness"
      | "malone_responsibility"
      | "unresolved_question",
    detailText: String(row.detail_text ?? ""),
  }));
}

export async function listVendorRoleFit(input: {
  projectId: string;
  vendorId: string;
}): Promise<DbVendorRoleFit[]> {
  const r = await query(
    `SELECT * FROM vendor_role_fit
     WHERE project_id = $1 AND vendor_id = $2
     ORDER BY role_key`,
    [input.projectId, input.vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapRow(row));
}
