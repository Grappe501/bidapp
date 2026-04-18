import { query } from "../db/client";

export type DbProject = {
  id: string;
  title: string;
  bidNumber: string;
  issuingOrganization: string;
  dueDate: string;
  status: string;
  shortDescription: string;
  createdAt: string;
  updatedAt: string;
};

function mapProject(r: Record<string, unknown>): DbProject {
  return {
    id: String(r.id),
    title: String(r.title),
    bidNumber: String(r.bid_number),
    issuingOrganization: String(r.issuing_organization),
    dueDate: String(r.due_date).slice(0, 10),
    status: String(r.status),
    shortDescription: String(r.short_description ?? ""),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function createProject(input: {
  id?: string;
  title: string;
  bidNumber: string;
  issuingOrganization: string;
  dueDate: string;
  status: string;
  shortDescription: string;
}): Promise<DbProject> {
  const r = await query(
    `INSERT INTO projects (id, title, bid_number, issuing_organization, due_date, status, short_description, updated_at)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5::date, $6, $7, now())
     RETURNING *`,
    [
      input.id ?? null,
      input.title,
      input.bidNumber,
      input.issuingOrganization,
      input.dueDate,
      input.status,
      input.shortDescription,
    ],
  );
  return mapProject(r.rows[0] as Record<string, unknown>);
}

export async function getProject(id: string): Promise<DbProject | null> {
  const r = await query(`SELECT * FROM projects WHERE id = $1`, [id]);
  if (r.rowCount === 0) return null;
  return mapProject(r.rows[0] as Record<string, unknown>);
}

export async function listProjects(): Promise<DbProject[]> {
  const r = await query(
    `SELECT * FROM projects ORDER BY created_at DESC`,
  );
  return r.rows.map((row: Record<string, unknown>) => mapProject(row));
}
