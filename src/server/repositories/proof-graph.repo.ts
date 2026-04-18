import { query } from "../db/client";

export type DbRequirementEvidenceProof = {
  id: string;
  projectId: string;
  requirementId: string;
  evidenceId: string;
  supportStrength: string;
  validationStatus: string;
  sourceType: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

function mapProof(row: Record<string, unknown>): DbRequirementEvidenceProof {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    requirementId: String(row.requirement_id),
    evidenceId: String(row.evidence_id),
    supportStrength: String(row.support_strength),
    validationStatus: String(row.validation_status),
    sourceType: String(row.source_type),
    notes: String(row.notes ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listProofByProject(
  projectId: string,
): Promise<DbRequirementEvidenceProof[]> {
  const r = await query(
    `SELECT * FROM requirement_evidence_proof WHERE project_id = $1 ORDER BY updated_at`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapProof(row));
}

export async function listProofByRequirement(
  requirementId: string,
): Promise<DbRequirementEvidenceProof[]> {
  const r = await query(
    `SELECT * FROM requirement_evidence_proof WHERE requirement_id = $1 ORDER BY updated_at`,
    [requirementId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapProof(row));
}

export async function upsertRequirementEvidenceProof(input: {
  projectId: string;
  requirementId: string;
  evidenceId: string;
  supportStrength: string;
  validationStatus: string;
  sourceType: string;
  notes?: string;
}): Promise<DbRequirementEvidenceProof> {
  const r = await query(
    `INSERT INTO requirement_evidence_proof (
      project_id, requirement_id, evidence_id,
      support_strength, validation_status, source_type, notes, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
    ON CONFLICT (requirement_id, evidence_id) DO UPDATE SET
      project_id = EXCLUDED.project_id,
      support_strength = EXCLUDED.support_strength,
      validation_status = EXCLUDED.validation_status,
      source_type = EXCLUDED.source_type,
      notes = EXCLUDED.notes,
      updated_at = now()
    RETURNING *`,
    [
      input.projectId,
      input.requirementId,
      input.evidenceId,
      input.supportStrength,
      input.validationStatus,
      input.sourceType,
      input.notes ?? "",
    ],
  );
  return mapProof(r.rows[0] as Record<string, unknown>);
}
