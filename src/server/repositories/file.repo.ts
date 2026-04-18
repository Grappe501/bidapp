import { query } from "../db/client";

export type DbFile = {
  id: string;
  projectId: string;
  name: string;
  category: string;
  sourceType: string;
  fileType: string;
  status: string;
  tags: string[];
  description: string | null;
  noteCount: number;
  linkedItemCount: number;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

function mapFile(r: Record<string, unknown>): DbFile {
  const tags = r.tags;
  return {
    id: String(r.id),
    projectId: String(r.project_id),
    name: String(r.name),
    category: String(r.category),
    sourceType: String(r.source_type),
    fileType: String(r.file_type),
    status: String(r.status),
    tags: Array.isArray(tags) ? (tags as string[]) : JSON.parse(String(tags ?? "[]")),
    description: r.description == null ? null : String(r.description),
    noteCount: Number(r.note_count),
    linkedItemCount: Number(r.linked_item_count),
    uploadedAt: new Date(String(r.uploaded_at)).toISOString(),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function createFile(input: {
  id?: string;
  projectId: string;
  name: string;
  category: string;
  sourceType: string;
  fileType: string;
  status?: string;
  tags?: string[];
  description?: string | null;
  noteCount?: number;
  linkedItemCount?: number;
  uploadedAt?: string;
}): Promise<DbFile> {
  const r = await query(
    `INSERT INTO files (
      id, project_id, name, category, source_type, file_type, status, tags,
      description, note_count, linked_item_count, uploaded_at, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8::jsonb,
      $9, $10, $11, COALESCE($12::timestamptz, now()), now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.projectId,
      input.name,
      input.category,
      input.sourceType,
      input.fileType,
      input.status ?? "Uploaded",
      JSON.stringify(input.tags ?? []),
      input.description ?? null,
      input.noteCount ?? 0,
      input.linkedItemCount ?? 0,
      input.uploadedAt ?? null,
    ],
  );
  return mapFile(r.rows[0] as Record<string, unknown>);
}

export async function listFilesByProject(projectId: string): Promise<DbFile[]> {
  const r = await query(
    `SELECT * FROM files WHERE project_id = $1 ORDER BY uploaded_at DESC`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapFile(row));
}

export async function updateFile(
  id: string,
  patch: Partial<{
    status: string;
    tags: string[];
    description: string | null;
    noteCount: number;
    linkedItemCount: number;
  }>,
): Promise<DbFile | null> {
  const sets: string[] = ["updated_at = now()"];
  const vals: unknown[] = [];
  let i = 1;
  if (patch.status !== undefined) {
    sets.push(`status = $${i++}`);
    vals.push(patch.status);
  }
  if (patch.tags !== undefined) {
    sets.push(`tags = $${i++}::jsonb`);
    vals.push(JSON.stringify(patch.tags));
  }
  if (patch.description !== undefined) {
    sets.push(`description = $${i++}`);
    vals.push(patch.description);
  }
  if (patch.noteCount !== undefined) {
    sets.push(`note_count = $${i++}`);
    vals.push(patch.noteCount);
  }
  if (patch.linkedItemCount !== undefined) {
    sets.push(`linked_item_count = $${i++}`);
    vals.push(patch.linkedItemCount);
  }
  vals.push(id);
  const r = await query(
    `UPDATE files SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    vals,
  );
  if (r.rowCount === 0) return null;
  return mapFile(r.rows[0] as Record<string, unknown>);
}

export async function getFile(id: string): Promise<DbFile | null> {
  const r = await query(`SELECT * FROM files WHERE id = $1`, [id]);
  if (r.rowCount === 0) return null;
  return mapFile(r.rows[0] as Record<string, unknown>);
}
