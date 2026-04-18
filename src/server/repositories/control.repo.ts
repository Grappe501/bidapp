import { query } from "../db/client";

export type DbSubmissionItem = {
  id: string;
  projectId: string;
  name: string;
  required: boolean;
  phase: string;
  status: string;
  owner: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

function mapSub(r: Record<string, unknown>): DbSubmissionItem {
  return {
    id: String(r.id),
    projectId: String(r.project_id),
    name: String(r.name),
    required: Boolean(r.required),
    phase: String(r.phase),
    status: String(r.status),
    owner: String(r.owner),
    notes: String(r.notes),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function createSubmissionItem(input: {
  id?: string;
  projectId: string;
  name: string;
  required: boolean;
  phase: string;
  status: string;
  owner: string;
  notes: string;
}): Promise<DbSubmissionItem> {
  const r = await query(
    `INSERT INTO submission_items (
      id, project_id, name, required, phase, status, owner, notes, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.projectId,
      input.name,
      input.required,
      input.phase,
      input.status,
      input.owner,
      input.notes,
    ],
  );
  return mapSub(r.rows[0] as Record<string, unknown>);
}

export async function listSubmissionItemsByProject(
  projectId: string,
): Promise<DbSubmissionItem[]> {
  const r = await query(
    `SELECT * FROM submission_items WHERE project_id = $1 ORDER BY created_at`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapSub(row));
}
