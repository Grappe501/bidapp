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

export type DbRequirementEvidenceLink = {
  id: string;
  requirementId: string;
  evidenceId: string;
  supportStrength: string;
  linkNote: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
};

function mapLink(
  row: Record<string, unknown>,
  projectId: string,
): DbRequirementEvidenceLink {
  return {
    id: String(row.id),
    requirementId: String(row.requirement_id),
    evidenceId: String(row.evidence_id),
    supportStrength: String(row.support_strength),
    linkNote: String(row.link_note ?? ""),
    projectId,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
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

export async function upsertRequirementEvidenceLink(input: {
  requirementId: string;
  evidenceId: string;
  supportStrength: string;
  linkNote: string;
}): Promise<void> {
  const existing = await query(
    `SELECT id FROM requirement_evidence_links
     WHERE requirement_id = $1 AND evidence_id = $2 LIMIT 1`,
    [input.requirementId, input.evidenceId],
  );
  if (existing.rows.length > 0) {
    await query(
      `UPDATE requirement_evidence_links
       SET support_strength = $1, link_note = $2, updated_at = now()
       WHERE requirement_id = $3 AND evidence_id = $4`,
      [
        input.supportStrength,
        input.linkNote,
        input.requirementId,
        input.evidenceId,
      ],
    );
    return;
  }
  await createRequirementEvidenceLink(input);
}

export async function listRequirementEvidenceLinksByProject(
  projectId: string,
): Promise<DbRequirementEvidenceLink[]> {
  const r = await query(
    `SELECT l.*, r.project_id AS req_project_id
     FROM requirement_evidence_links l
     INNER JOIN requirements r ON r.id = l.requirement_id
     WHERE r.project_id = $1
     ORDER BY l.created_at`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) =>
    mapLink(row, String(row.req_project_id)),
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
