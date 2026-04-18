import { query } from "../db/client";

export type DbRequirement = {
  id: string;
  projectId: string;
  sourceFileId: string | null;
  title: string;
  sourceFileName: string;
  sourceSection: string;
  verbatimText: string;
  summary: string;
  requirementType: string;
  mandatory: boolean;
  responseCategory: string;
  status: string;
  riskLevel: string;
  owner: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

function mapReq(r: Record<string, unknown>): DbRequirement {
  const tags = r.tags;
  return {
    id: String(r.id),
    projectId: String(r.project_id),
    sourceFileId: r.source_file_id == null ? null : String(r.source_file_id),
    title: String(r.title),
    sourceFileName: String(r.source_file_name),
    sourceSection: String(r.source_section),
    verbatimText: String(r.verbatim_text),
    summary: String(r.summary),
    requirementType: String(r.requirement_type),
    mandatory: Boolean(r.mandatory),
    responseCategory: String(r.response_category),
    status: String(r.status),
    riskLevel: String(r.risk_level),
    owner: String(r.owner),
    notes: String(r.notes),
    tags: Array.isArray(tags) ? (tags as string[]) : JSON.parse(String(tags ?? "[]")),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function createRequirement(input: {
  id?: string;
  projectId: string;
  sourceFileId?: string | null;
  title: string;
  sourceFileName: string;
  sourceSection: string;
  verbatimText: string;
  summary: string;
  requirementType: string;
  mandatory: boolean;
  responseCategory: string;
  status: string;
  riskLevel: string;
  owner: string;
  notes: string;
  tags: string[];
}): Promise<DbRequirement> {
  const r = await query(
    `INSERT INTO requirements (
      id, project_id, source_file_id, title, source_file_name, source_section,
      verbatim_text, summary, requirement_type, mandatory, response_category,
      status, risk_level, owner, notes, tags, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16::jsonb, now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.projectId,
      input.sourceFileId ?? null,
      input.title,
      input.sourceFileName,
      input.sourceSection,
      input.verbatimText,
      input.summary,
      input.requirementType,
      input.mandatory,
      input.responseCategory,
      input.status,
      input.riskLevel,
      input.owner,
      input.notes,
      JSON.stringify(input.tags),
    ],
  );
  return mapReq(r.rows[0] as Record<string, unknown>);
}

export async function listRequirementsByProject(
  projectId: string,
): Promise<DbRequirement[]> {
  const r = await query(
    `SELECT * FROM requirements WHERE project_id = $1 ORDER BY created_at`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapReq(row));
}
