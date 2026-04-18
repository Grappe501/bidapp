import { query, withTransaction } from "../db/client";
import type { PoolClient } from "pg";
import type { DraftMetadata, DraftSectionType, DraftStatus } from "../../types";

const SECTION_TYPES: DraftSectionType[] = [
  "Experience",
  "Solution",
  "Risk",
  "Executive Summary",
  "Architecture Narrative",
];

export type DbDraftSection = {
  id: string;
  projectId: string;
  sectionType: DraftSectionType;
  title: string;
  status: DraftStatus;
  activeVersionId: string | null;
  selectedGroundingBundleId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DbDraftVersion = {
  id: string;
  sectionId: string;
  content: string;
  groundingBundleId: string | null;
  metadata: DraftMetadata;
  generationMode: string | null;
  note: string | null;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapSection(row: Record<string, unknown>): DbDraftSection {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    sectionType: String(row.section_type) as DraftSectionType,
    title: String(row.title),
    status: String(row.status) as DraftStatus,
    activeVersionId:
      row.active_version_id == null ? null : String(row.active_version_id),
    selectedGroundingBundleId:
      row.selected_grounding_bundle_id == null
        ? null
        : String(row.selected_grounding_bundle_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapVersion(row: Record<string, unknown>): DbDraftVersion {
  const metaRaw = row.metadata_json;
  let metadata: DraftMetadata;
  if (typeof metaRaw === "string") {
    try {
      metadata = JSON.parse(metaRaw) as DraftMetadata;
    } catch {
      metadata = {} as DraftMetadata;
    }
  } else if (typeof metaRaw === "object" && metaRaw !== null) {
    metadata = metaRaw as DraftMetadata;
  } else {
    metadata = {} as DraftMetadata;
  }
  const genMode =
    row.generation_mode == null || String(row.generation_mode) === ""
      ? null
      : String(row.generation_mode);
  const merged: DraftMetadata = {
    ...metadata,
    ...(genMode && !metadata.generationMode
      ? { generationMode: genMode }
      : {}),
  };
  return {
    id: String(row.id),
    sectionId: String(row.section_id),
    content: String(row.content ?? ""),
    groundingBundleId:
      row.grounding_bundle_id == null ? null : String(row.grounding_bundle_id),
    metadata: merged,
    generationMode: genMode,
    note: row.note == null ? null : String(row.note),
    locked: Boolean(row.locked),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

/** Insert default section rows (one per volume) when none exist. */
export async function ensureDraftSectionsForProject(
  projectId: string,
): Promise<void> {
  for (const st of SECTION_TYPES) {
    await query(
      `INSERT INTO draft_sections (project_id, section_type, title, status, updated_at)
       SELECT $1, $2, $2, 'Not Started', now()
       WHERE NOT EXISTS (
         SELECT 1 FROM draft_sections WHERE project_id = $1 AND section_type = $2
       )`,
      [projectId, st],
    );
  }
}

export async function listDraftSectionsByProject(
  projectId: string,
): Promise<DbDraftSection[]> {
  await ensureDraftSectionsForProject(projectId);
  const r = await query(
    `SELECT * FROM draft_sections WHERE project_id = $1`,
    [projectId],
  );
  const list = r.rows.map((row: Record<string, unknown>) => mapSection(row));
  list.sort(
    (a, b) =>
      SECTION_TYPES.indexOf(a.sectionType) - SECTION_TYPES.indexOf(b.sectionType),
  );
  return list;
}

export async function getDraftSectionByIdForProject(
  projectId: string,
  sectionId: string,
): Promise<DbDraftSection | null> {
  const r = await query(
    `SELECT * FROM draft_sections WHERE id = $1 AND project_id = $2`,
    [sectionId, projectId],
  );
  if (r.rowCount === 0) return null;
  return mapSection(r.rows[0] as Record<string, unknown>);
}

export async function listDraftVersionsForProject(
  projectId: string,
): Promise<DbDraftVersion[]> {
  const r = await query(
    `SELECT v.* FROM draft_versions v
     INNER JOIN draft_sections s ON s.id = v.section_id
     WHERE s.project_id = $1
     ORDER BY v.created_at ASC`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapVersion(row));
}

export async function listDraftVersionsForSection(
  projectId: string,
  sectionId: string,
): Promise<DbDraftVersion[]> {
  const r = await query(
    `SELECT v.* FROM draft_versions v
     INNER JOIN draft_sections s ON s.id = v.section_id
     WHERE v.section_id = $1 AND s.project_id = $2
     ORDER BY v.created_at ASC`,
    [sectionId, projectId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapVersion(row));
}

export async function insertDraftVersion(input: {
  projectId: string;
  sectionId: string;
  content: string;
  metadata: DraftMetadata;
  groundingBundleId: string | null;
  generationMode: string | null;
  note?: string | null;
  locked?: boolean;
  setActive: boolean;
  /** Transition section status when appropriate */
  bumpSectionStatus: boolean;
}): Promise<DbDraftVersion> {
  return withTransaction(async (client: PoolClient) => {
    const meta = { ...input.metadata };
    if (input.generationMode) {
      meta.generationMode = input.generationMode;
    }
    const generationCol =
      input.generationMode ?? meta.generationMode ?? null;
    const ins = await client.query(
      `INSERT INTO draft_versions (
        section_id, content, grounding_bundle_id, metadata_json, generation_mode, note, locked, updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, now())
      RETURNING *`,
      [
        input.sectionId,
        input.content,
        input.groundingBundleId,
        JSON.stringify(meta),
        generationCol,
        input.note ?? null,
        input.locked ?? false,
      ],
    );
    const row = ins.rows[0] as Record<string, unknown>;
    const vid = String(row.id);

    if (input.setActive) {
      await client.query(
        `UPDATE draft_sections SET
          active_version_id = $2,
          updated_at = now(),
          status = CASE
            WHEN $3 AND status = 'Not Started' THEN 'Drafting'
            WHEN $3 AND status NOT IN ('Locked', 'Approved') THEN 'Needs Review'
            ELSE status
          END
         WHERE id = $1 AND project_id = $4`,
        [
          input.sectionId,
          vid,
          input.bumpSectionStatus,
          input.projectId,
        ],
      );
    }

    return mapVersion(row);
  });
}

export async function updateDraftVersionContent(input: {
  projectId: string;
  versionId: string;
  content: string;
}): Promise<DbDraftVersion | null> {
  const r = await query(
    `UPDATE draft_versions v SET content = $3, updated_at = now()
     FROM draft_sections s
     WHERE v.id = $2 AND v.section_id = s.id AND s.project_id = $1
     AND v.locked = false
     RETURNING v.*`,
    [input.projectId, input.versionId, input.content],
  );
  if (r.rowCount === 0) return null;
  await query(
    `UPDATE draft_sections s SET updated_at = now()
     FROM draft_versions v
     WHERE v.id = $1 AND v.section_id = s.id AND s.project_id = $2`,
    [input.versionId, input.projectId],
  );
  return mapVersion(r.rows[0] as Record<string, unknown>);
}

export async function updateDraftVersionNoteLocked(input: {
  projectId: string;
  versionId: string;
  note?: string | null;
  locked?: boolean;
}): Promise<DbDraftVersion | null> {
  const sets: string[] = ["updated_at = now()"];
  const params: unknown[] = [input.projectId, input.versionId];
  let i = 3;
  if (input.note !== undefined) {
    sets.push(`note = $${i++}`);
    params.push(input.note);
  }
  if (input.locked !== undefined) {
    sets.push(`locked = $${i++}`);
    params.push(input.locked);
  }
  const r = await query(
    `UPDATE draft_versions v SET ${sets.join(", ")}
     FROM draft_sections s
     WHERE v.id = $2 AND v.section_id = s.id AND s.project_id = $1
     RETURNING v.*`,
    params,
  );
  if (r.rowCount === 0) return null;
  return mapVersion(r.rows[0] as Record<string, unknown>);
}

export async function duplicateDraftVersion(input: {
  projectId: string;
  sectionId: string;
  sourceVersionId: string;
  note: string | null;
}): Promise<DbDraftVersion | null> {
  return withTransaction(async (client: PoolClient) => {
    const ins = await client.query(
      `INSERT INTO draft_versions (
        section_id, content, grounding_bundle_id, metadata_json, generation_mode, note, locked, updated_at
      )
      SELECT section_id, content, grounding_bundle_id, metadata_json, generation_mode, $3, false, now()
      FROM draft_versions v
      INNER JOIN draft_sections s ON s.id = v.section_id
      WHERE v.id = $1 AND v.section_id = $2 AND s.project_id = $4
      RETURNING *`,
      [input.sourceVersionId, input.sectionId, input.note, input.projectId],
    );
    if (ins.rowCount === 0) {
      return null;
    }
    const row = ins.rows[0] as Record<string, unknown>;
    const vid = String(row.id);
    await client.query(
      `UPDATE draft_sections SET
        active_version_id = $2,
        updated_at = now(),
        status = CASE
          WHEN status = 'Not Started' THEN 'Drafting'
          WHEN status NOT IN ('Locked', 'Approved') THEN 'Needs Review'
          ELSE status
        END
       WHERE id = $1 AND project_id = $3`,
      [input.sectionId, vid, input.projectId],
    );
    return mapVersion(row);
  });
}

export async function setActiveDraftVersion(input: {
  projectId: string;
  sectionId: string;
  versionId: string;
}): Promise<boolean> {
  const r = await query(
    `UPDATE draft_sections s SET active_version_id = $3, updated_at = now()
     WHERE s.id = $2 AND s.project_id = $1
     AND EXISTS (
       SELECT 1 FROM draft_versions v WHERE v.id = $3 AND v.section_id = $2
     )`,
    [input.projectId, input.sectionId, input.versionId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function updateDraftSectionStatus(input: {
  projectId: string;
  sectionId: string;
  status: DraftStatus;
}): Promise<boolean> {
  const r = await query(
    `UPDATE draft_sections SET status = $3, updated_at = now()
     WHERE id = $2 AND project_id = $1`,
    [input.projectId, input.sectionId, input.status],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function updateDraftSectionSelectedBundle(input: {
  projectId: string;
  sectionId: string;
  bundleId: string | null;
}): Promise<boolean> {
  const r = await query(
    `UPDATE draft_sections SET selected_grounding_bundle_id = $3, updated_at = now()
     WHERE id = $2 AND project_id = $1`,
    [input.projectId, input.sectionId, input.bundleId],
  );
  return (r.rowCount ?? 0) > 0;
}
