import { query } from "../db/client";

export type DbArchitectureOption = {
  id: string;
  projectId: string;
  name: string;
  status: string;
  summary: string;
  recommended: boolean;
  narrativeStrengths: string[];
  implementationRisks: string[];
  malonePositionSummary: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type DbArchitectureComponent = {
  id: string;
  architectureOptionId: string;
  vendorId: string | null;
  vendorName: string;
  role: string;
  responsibilitySummary: string;
  optional: boolean;
  createdAt: string;
  updatedAt: string;
};

function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "string") return JSON.parse(v) as T;
  return v as T;
}

export async function createArchitectureOption(input: {
  id?: string;
  projectId: string;
  name: string;
  status: string;
  summary: string;
  recommended: boolean;
  narrativeStrengths: string[];
  implementationRisks: string[];
  malonePositionSummary: string;
  notes: string;
}): Promise<DbArchitectureOption> {
  const r = await query(
    `INSERT INTO architecture_options (
      id, project_id, name, status, summary, recommended, narrative_strengths,
      implementation_risks, malone_position_summary, notes, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.projectId,
      input.name,
      input.status,
      input.summary,
      input.recommended,
      JSON.stringify(input.narrativeStrengths),
      JSON.stringify(input.implementationRisks),
      input.malonePositionSummary,
      input.notes,
    ],
  );
  const row = r.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name),
    status: String(row.status),
    summary: String(row.summary),
    recommended: Boolean(row.recommended),
    narrativeStrengths: parseJson(row.narrative_strengths, [] as string[]),
    implementationRisks: parseJson(row.implementation_risks, [] as string[]),
    malonePositionSummary: String(row.malone_position_summary),
    notes: String(row.notes),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function createArchitectureComponent(input: {
  id?: string;
  architectureOptionId: string;
  vendorId?: string | null;
  vendorName: string;
  role: string;
  responsibilitySummary: string;
  optional: boolean;
}): Promise<DbArchitectureComponent> {
  const r = await query(
    `INSERT INTO architecture_components (
      id, architecture_option_id, vendor_id, vendor_name, role, responsibility_summary,
      optional_layer, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.architectureOptionId,
      input.vendorId ?? null,
      input.vendorName,
      input.role,
      input.responsibilitySummary,
      input.optional,
    ],
  );
  const row = r.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    architectureOptionId: String(row.architecture_option_id),
    vendorId: row.vendor_id == null ? null : String(row.vendor_id),
    vendorName: String(row.vendor_name),
    role: String(row.role),
    responsibilitySummary: String(row.responsibility_summary),
    optional: Boolean(row.optional_layer),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listArchitectureComponentsByOptionId(
  architectureOptionId: string,
): Promise<DbArchitectureComponent[]> {
  const r = await query(
    `SELECT * FROM architecture_components WHERE architecture_option_id = $1 ORDER BY created_at`,
    [architectureOptionId],
  );
  return r.rows.map((row: Record<string, unknown>) => {
    const x = row as Record<string, unknown>;
    return {
      id: String(x.id),
      architectureOptionId: String(x.architecture_option_id),
      vendorId: x.vendor_id == null ? null : String(x.vendor_id),
      vendorName: String(x.vendor_name),
      role: String(x.role),
      responsibilitySummary: String(x.responsibility_summary),
      optional: Boolean(x.optional_layer),
      createdAt: new Date(String(x.created_at)).toISOString(),
      updatedAt: new Date(String(x.updated_at)).toISOString(),
    };
  });
}

export async function listArchitectureOptionsByProject(
  projectId: string,
): Promise<DbArchitectureOption[]> {
  const r = await query(
    `SELECT * FROM architecture_options WHERE project_id = $1 ORDER BY created_at`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) => {
    const x = row as Record<string, unknown>;
    return {
      id: String(x.id),
      projectId: String(x.project_id),
      name: String(x.name),
      status: String(x.status),
      summary: String(x.summary),
      recommended: Boolean(x.recommended),
      narrativeStrengths: parseJson(x.narrative_strengths, [] as string[]),
      implementationRisks: parseJson(x.implementation_risks, [] as string[]),
      malonePositionSummary: String(x.malone_position_summary),
      notes: String(x.notes),
      createdAt: new Date(String(x.created_at)).toISOString(),
      updatedAt: new Date(String(x.updated_at)).toISOString(),
    };
  });
}
