import { query } from "../db/client";

export type DbGroundingBundle = {
  id: string;
  projectId: string;
  bundleType: string;
  targetEntityId: string | null;
  title: string;
  bundlePayloadJson: unknown;
  createdAt: string;
  updatedAt: string;
};

function mapBundle(row: Record<string, unknown>): DbGroundingBundle {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    bundleType: String(row.bundle_type),
    targetEntityId:
      row.target_entity_id == null ? null : String(row.target_entity_id),
    title: String(row.title),
    bundlePayloadJson: row.bundle_payload_json,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertGroundingBundle(input: {
  projectId: string;
  bundleType: string;
  targetEntityId?: string | null;
  title: string;
  bundlePayloadJson: unknown;
}): Promise<DbGroundingBundle> {
  const r = await query(
    `INSERT INTO grounding_bundles (
      project_id, bundle_type, target_entity_id, title, bundle_payload_json, updated_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, now()) RETURNING *`,
    [
      input.projectId,
      input.bundleType,
      input.targetEntityId ?? null,
      input.title,
      JSON.stringify(input.bundlePayloadJson),
    ],
  );
  return mapBundle(r.rows[0] as Record<string, unknown>);
}

export async function getGroundingBundle(
  id: string,
): Promise<DbGroundingBundle | null> {
  const r = await query(`SELECT * FROM grounding_bundles WHERE id = $1`, [id]);
  if (r.rowCount === 0) return null;
  return mapBundle(r.rows[0] as Record<string, unknown>);
}

export async function listGroundingBundlesByProject(
  projectId: string,
  bundleType?: string,
): Promise<DbGroundingBundle[]> {
  const r = bundleType
    ? await query(
        `SELECT * FROM grounding_bundles WHERE project_id = $1 AND bundle_type = $2 ORDER BY created_at DESC`,
        [projectId, bundleType],
      )
    : await query(
        `SELECT * FROM grounding_bundles WHERE project_id = $1 ORDER BY created_at DESC`,
        [projectId],
      );
  return r.rows.map((row: Record<string, unknown>) => mapBundle(row));
}

export async function countGroundingBundlesByProject(
  projectId: string,
): Promise<number> {
  const r = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM grounding_bundles WHERE project_id = $1`,
    [projectId],
  );
  return Number(r.rows[0]?.c ?? 0);
}

export async function listGroundingBundlesByIds(
  projectId: string,
  ids: string[],
): Promise<DbGroundingBundle[]> {
  if (ids.length === 0) return [];
  const r = await query(
    `SELECT * FROM grounding_bundles WHERE project_id = $1 AND id = ANY($2::uuid[])`,
    [projectId, ids],
  );
  return r.rows.map((row: Record<string, unknown>) => mapBundle(row));
}
