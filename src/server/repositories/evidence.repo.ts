import { query } from "../db/client";

export type DbEvidenceItem = {
  id: string;
  projectId: string;
  sourceFileId: string | null;
  title: string;
  sourceFileName: string;
  sourceSection: string;
  excerpt: string;
  evidenceType: string;
  validationStatus: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

function mapEv(r: Record<string, unknown>): DbEvidenceItem {
  return {
    id: String(r.id),
    projectId: String(r.project_id),
    sourceFileId: r.source_file_id == null ? null : String(r.source_file_id),
    title: String(r.title),
    sourceFileName: String(r.source_file_name),
    sourceSection: String(r.source_section),
    excerpt: String(r.excerpt),
    evidenceType: String(r.evidence_type),
    validationStatus: String(r.validation_status),
    notes: String(r.notes),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function createEvidenceItem(input: {
  id?: string;
  projectId: string;
  sourceFileId?: string | null;
  title: string;
  sourceFileName: string;
  sourceSection: string;
  excerpt: string;
  evidenceType: string;
  validationStatus: string;
  notes: string;
}): Promise<DbEvidenceItem> {
  const r = await query(
    `INSERT INTO evidence_items (
      id, project_id, source_file_id, title, source_file_name, source_section,
      excerpt, evidence_type, validation_status, notes, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.projectId,
      input.sourceFileId ?? null,
      input.title,
      input.sourceFileName,
      input.sourceSection,
      input.excerpt,
      input.evidenceType,
      input.validationStatus,
      input.notes,
    ],
  );
  return mapEv(r.rows[0] as Record<string, unknown>);
}

export async function createRequirementEvidenceLink(input: {
  requirementId: string;
  evidenceId: string;
  supportStrength: string;
  linkNote: string;
}): Promise<void> {
  await query(
    `INSERT INTO requirement_evidence_links (requirement_id, evidence_id, support_strength, link_note, updated_at)
     VALUES ($1, $2, $3, $4, now())`,
    [
      input.requirementId,
      input.evidenceId,
      input.supportStrength,
      input.linkNote,
    ],
  );
}

export async function listEvidenceByProject(
  projectId: string,
): Promise<DbEvidenceItem[]> {
  const r = await query(
    `SELECT * FROM evidence_items WHERE project_id = $1 ORDER BY created_at`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapEv(row));
}
