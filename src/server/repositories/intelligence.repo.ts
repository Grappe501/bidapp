import { query } from "../db/client";

export type DbCompanyProfile = {
  id: string;
  projectId: string;
  name: string;
  profileType: string;
  summary: string;
  capabilities: string[];
  risks: string[];
  sources: string[];
  claims: string[];
  integrationDetails: string[];
  linkedVendorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DbIntelligenceSource = {
  id: string;
  projectId: string;
  companyProfileId: string | null;
  sourceType: string;
  url: string | null;
  title: string | null;
  rawText: string;
  classification: string | null;
  validationStatus: string;
  fetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DbIntelligenceFact = {
  id: string;
  projectId: string;
  sourceId: string;
  companyProfileId: string | null;
  factType: string;
  factText: string;
  classification: string | null;
  validationStatus: string;
  createdAt: string;
  updatedAt: string;
};

function parseStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v as string[];
  return JSON.parse(String(v)) as string[];
}

function mapCompanyProfileRow(row: Record<string, unknown>): DbCompanyProfile {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name),
    profileType: String(row.profile_type),
    summary: String(row.summary),
    capabilities: parseStringArray(row.capabilities),
    risks: parseStringArray(row.risks),
    sources: parseStringArray(row.sources),
    claims: parseStringArray(row.claims),
    integrationDetails: parseStringArray(row.integration_details),
    linkedVendorId:
      row.linked_vendor_id == null ? null : String(row.linked_vendor_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function createCompanyProfile(input: {
  id?: string;
  projectId: string;
  name: string;
  profileType: string;
  summary: string;
  capabilities?: string[];
  risks?: string[];
  sources?: string[];
  claims?: string[];
  integrationDetails?: string[];
  linkedVendorId?: string | null;
}): Promise<DbCompanyProfile> {
  const r = await query(
    `INSERT INTO company_profiles (
      id, project_id, name, profile_type, summary, capabilities, risks, sources,
      claims, integration_details, linked_vendor_id, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb,
      $9::jsonb, $10::jsonb, $11, now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.projectId,
      input.name,
      input.profileType,
      input.summary,
      JSON.stringify(input.capabilities ?? []),
      JSON.stringify(input.risks ?? []),
      JSON.stringify(input.sources ?? []),
      JSON.stringify(input.claims ?? []),
      JSON.stringify(input.integrationDetails ?? []),
      input.linkedVendorId ?? null,
    ],
  );
  return mapCompanyProfileRow(r.rows[0] as Record<string, unknown>);
}

export async function createIntelligenceSource(input: {
  projectId: string;
  companyProfileId?: string | null;
  sourceType: string;
  url?: string | null;
  title?: string | null;
  rawText: string;
  classification?: string | null;
  validationStatus?: string;
  fetchedAt?: string | null;
}): Promise<DbIntelligenceSource> {
  const r = await query(
    `INSERT INTO intelligence_sources (
      project_id, company_profile_id, source_type, url, title, raw_text,
      classification, validation_status, fetched_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now()) RETURNING *`,
    [
      input.projectId,
      input.companyProfileId ?? null,
      input.sourceType,
      input.url ?? null,
      input.title ?? null,
      input.rawText,
      input.classification ?? null,
      input.validationStatus ?? "Pending Validation",
      input.fetchedAt ?? null,
    ],
  );
  const row = r.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    companyProfileId:
      row.company_profile_id == null ? null : String(row.company_profile_id),
    sourceType: String(row.source_type),
    url: row.url == null ? null : String(row.url),
    title: row.title == null ? null : String(row.title),
    rawText: String(row.raw_text),
    classification: row.classification == null ? null : String(row.classification),
    validationStatus: String(row.validation_status),
    fetchedAt: row.fetched_at == null ? null : new Date(String(row.fetched_at)).toISOString(),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function createIntelligenceFact(input: {
  projectId: string;
  sourceId: string;
  companyProfileId?: string | null;
  factType: string;
  factText: string;
  classification?: string | null;
  validationStatus?: string;
}): Promise<DbIntelligenceFact> {
  const r = await query(
    `INSERT INTO intelligence_facts (
      project_id, source_id, company_profile_id, fact_type, fact_text,
      classification, validation_status, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, now()) RETURNING *`,
    [
      input.projectId,
      input.sourceId,
      input.companyProfileId ?? null,
      input.factType,
      input.factText,
      input.classification ?? null,
      input.validationStatus ?? "Pending Validation",
    ],
  );
  const row = r.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    sourceId: String(row.source_id),
    companyProfileId:
      row.company_profile_id == null ? null : String(row.company_profile_id),
    factType: String(row.fact_type),
    factText: String(row.fact_text),
    classification: row.classification == null ? null : String(row.classification),
    validationStatus: String(row.validation_status),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listCompanyProfilesByProject(
  projectId: string,
): Promise<DbCompanyProfile[]> {
  const r = await query(
    `SELECT * FROM company_profiles WHERE project_id = $1 ORDER BY name`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) =>
    mapCompanyProfileRow(row),
  );
}

export async function getCompanyProfile(
  id: string,
): Promise<DbCompanyProfile | null> {
  const r = await query(`SELECT * FROM company_profiles WHERE id = $1`, [id]);
  if (r.rowCount === 0) return null;
  return mapCompanyProfileRow(r.rows[0] as Record<string, unknown>);
}

export async function listIntelligenceSourcesByCompanyProfile(
  companyProfileId: string,
): Promise<DbIntelligenceSource[]> {
  const r = await query(
    `SELECT * FROM intelligence_sources WHERE company_profile_id = $1 ORDER BY created_at`,
    [companyProfileId],
  );
  return r.rows.map((row: Record<string, unknown>) => {
    const x = row;
    return {
      id: String(x.id),
      projectId: String(x.project_id),
      companyProfileId:
        x.company_profile_id == null ? null : String(x.company_profile_id),
      sourceType: String(x.source_type),
      url: x.url == null ? null : String(x.url),
      title: x.title == null ? null : String(x.title),
      rawText: String(x.raw_text),
      classification: x.classification == null ? null : String(x.classification),
      validationStatus: String(x.validation_status),
      fetchedAt: x.fetched_at == null ? null : new Date(String(x.fetched_at)).toISOString(),
      createdAt: new Date(String(x.created_at)).toISOString(),
      updatedAt: new Date(String(x.updated_at)).toISOString(),
    };
  });
}

export async function listFactsByProject(
  projectId: string,
  limit = 50,
): Promise<DbIntelligenceFact[]> {
  const r = await query(
    `SELECT * FROM intelligence_facts WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [projectId, limit],
  );
  return r.rows.map((row: Record<string, unknown>) => {
    const x = row;
    return {
      id: String(x.id),
      projectId: String(x.project_id),
      sourceId: String(x.source_id),
      companyProfileId:
        x.company_profile_id == null ? null : String(x.company_profile_id),
      factType: String(x.fact_type),
      factText: String(x.fact_text),
      classification: x.classification == null ? null : String(x.classification),
      validationStatus: String(x.validation_status),
      createdAt: new Date(String(x.created_at)).toISOString(),
      updatedAt: new Date(String(x.updated_at)).toISOString(),
    };
  });
}

export async function listFactsByCompanyProfile(
  companyProfileId: string,
): Promise<DbIntelligenceFact[]> {
  const r = await query(
    `SELECT * FROM intelligence_facts WHERE company_profile_id = $1 ORDER BY created_at DESC`,
    [companyProfileId],
  );
  return r.rows.map((row: Record<string, unknown>) => {
    const x = row;
    return {
      id: String(x.id),
      projectId: String(x.project_id),
      sourceId: String(x.source_id),
      companyProfileId:
        x.company_profile_id == null ? null : String(x.company_profile_id),
      factType: String(x.fact_type),
      factText: String(x.fact_text),
      classification: x.classification == null ? null : String(x.classification),
      validationStatus: String(x.validation_status),
      createdAt: new Date(String(x.created_at)).toISOString(),
      updatedAt: new Date(String(x.updated_at)).toISOString(),
    };
  });
}

export async function createCompanyEnrichmentRun(input: {
  companyProfileId: string;
  sourceCount: number;
}): Promise<string> {
  const r = await query(
    `INSERT INTO company_enrichment_runs (company_profile_id, source_count, status, updated_at)
     VALUES ($1, $2, 'running', now()) RETURNING id`,
    [input.companyProfileId, input.sourceCount],
  );
  return String((r.rows[0] as Record<string, unknown>).id);
}

export async function updateCompanyEnrichmentRun(input: {
  id: string;
  status: string;
  notes: string;
}): Promise<void> {
  await query(
    `UPDATE company_enrichment_runs SET status = $2, notes = $3, updated_at = now() WHERE id = $1`,
    [input.id, input.status, input.notes],
  );
}

export async function countEnrichmentRuns(): Promise<number> {
  const r = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM company_enrichment_runs`,
  );
  return Number(r.rows[0]?.c ?? 0);
}

export async function countEnrichmentRunsByProject(
  projectId: string,
): Promise<number> {
  const r = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM company_enrichment_runs cer
     INNER JOIN company_profiles cp ON cp.id = cer.company_profile_id
     WHERE cp.project_id = $1`,
    [projectId],
  );
  return Number(r.rows[0]?.c ?? 0);
}
