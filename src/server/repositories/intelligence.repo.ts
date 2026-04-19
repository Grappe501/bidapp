import { query } from "../db/client";

let intelligenceFactsCredibilityColumnsVerified: boolean | null = null;

/**
 * Ensures migration 006 (credibility / confidence columns) is applied.
 * Call before ingest or backfill; throws a clear error if columns are missing.
 */
export async function assertIntelligenceFactsCredibilityColumns(): Promise<void> {
  if (intelligenceFactsCredibilityColumnsVerified === true) return;
  if (intelligenceFactsCredibilityColumnsVerified === false) {
    throw new Error(
      "Database schema: intelligence_facts is missing credibility/confidence columns. Apply migration 006_allcare_fact_credibility.sql (npm run db:migrate).",
    );
  }
  const r = await query(
    `SELECT 1 AS ok FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'intelligence_facts'
       AND column_name = 'credibility'
     LIMIT 1`,
  );
  if ((r.rowCount ?? 0) === 0) {
    intelligenceFactsCredibilityColumnsVerified = false;
    throw new Error(
      "Database schema: intelligence_facts is missing credibility/confidence columns. Apply migration 006_allcare_fact_credibility.sql (npm run db:migrate).",
    );
  }
  intelligenceFactsCredibilityColumnsVerified = true;
}

export type DbCompanyProfile = {
  id: string;
  projectId: string;
  name: string;
  profileType: string;
  summary: string;
  websiteUrl: string;
  displayName: string;
  notes: string;
  brandingMeta: Record<string, unknown>;
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
  urlNormalized: string | null;
  title: string | null;
  rawText: string;
  classification: string | null;
  metadata: Record<string, unknown>;
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
  /** operational | marketing | inferred | "" (legacy) */
  credibility: string;
  /** high | medium | low | "" (legacy) */
  confidence: string;
  createdAt: string;
  updatedAt: string;
};

function mapIntelligenceFactRow(row: Record<string, unknown>): DbIntelligenceFact {
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
    credibility: String(x.credibility ?? ""),
    confidence: String(x.confidence ?? ""),
    createdAt: new Date(String(x.created_at)).toISOString(),
    updatedAt: new Date(String(x.updated_at)).toISOString(),
  };
}

function parseStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v as string[];
  return JSON.parse(String(v)) as string[];
}

function parseJsonObject(v: unknown): Record<string, unknown> {
  if (v == null) return {};
  if (typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  try {
    const o = JSON.parse(String(v)) as unknown;
    return typeof o === "object" && o !== null && !Array.isArray(o)
      ? (o as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function mapCompanyProfileRow(row: Record<string, unknown>): DbCompanyProfile {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name),
    profileType: String(row.profile_type),
    summary: String(row.summary ?? ""),
    websiteUrl: String(row.website_url ?? ""),
    displayName: String(row.display_name ?? ""),
    notes: String(row.notes ?? ""),
    brandingMeta: parseJsonObject(row.branding_meta),
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

function mapIntelligenceSourceRow(
  row: Record<string, unknown>,
): DbIntelligenceSource {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    companyProfileId:
      row.company_profile_id == null ? null : String(row.company_profile_id),
    sourceType: String(row.source_type),
    url: row.url == null ? null : String(row.url),
    urlNormalized:
      row.url_normalized == null ? null : String(row.url_normalized),
    title: row.title == null ? null : String(row.title),
    rawText: String(row.raw_text ?? ""),
    classification: row.classification == null ? null : String(row.classification),
    metadata: parseJsonObject(row.metadata),
    validationStatus: String(row.validation_status),
    fetchedAt:
      row.fetched_at == null
        ? null
        : new Date(String(row.fetched_at)).toISOString(),
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
  websiteUrl?: string;
  displayName?: string;
  notes?: string;
  brandingMeta?: Record<string, unknown>;
  capabilities?: string[];
  risks?: string[];
  sources?: string[];
  claims?: string[];
  integrationDetails?: string[];
  linkedVendorId?: string | null;
}): Promise<DbCompanyProfile> {
  const r = await query(
    `INSERT INTO company_profiles (
      id, project_id, name, profile_type, summary, website_url, display_name, notes, branding_meta,
      capabilities, risks, sources, claims, integration_details, linked_vendor_id, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9::jsonb,
      $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.projectId,
      input.name,
      input.profileType,
      input.summary,
      input.websiteUrl ?? "",
      input.displayName ?? "",
      input.notes ?? "",
      JSON.stringify(input.brandingMeta ?? {}),
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

/** Sets summary only when the current value is blank (whitespace). */
export async function updateCompanyProfileSummaryIfEmpty(input: {
  id: string;
  summary: string;
}): Promise<DbCompanyProfile | null> {
  const r = await query(
    `UPDATE company_profiles
     SET summary = $2, updated_at = now()
     WHERE id = $1 AND TRIM(summary) = ''
     RETURNING *`,
    [input.id, input.summary],
  );
  if (r.rowCount === 0) {
    const cur = await getCompanyProfile(input.id);
    return cur;
  }
  return mapCompanyProfileRow(r.rows[0] as Record<string, unknown>);
}

export async function mergeCompanyProfileBrandingMeta(input: {
  id: string;
  patch: Record<string, unknown>;
}): Promise<void> {
  await query(
    `UPDATE company_profiles
     SET branding_meta = branding_meta || $2::jsonb, updated_at = now()
     WHERE id = $1`,
    [input.id, JSON.stringify(input.patch)],
  );
}

export async function patchCompanyProfileWebsiteDisplay(input: {
  id: string;
  websiteUrl?: string;
  displayName?: string;
}): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 2;
  if (input.websiteUrl != null) {
    sets.push(`website_url = $${i++}`);
    vals.push(input.websiteUrl);
  }
  if (input.displayName != null) {
    sets.push(`display_name = $${i++}`);
    vals.push(input.displayName);
  }
  if (sets.length === 0) return;
  await query(
    `UPDATE company_profiles SET ${sets.join(", ")}, updated_at = now() WHERE id = $1`,
    [input.id, ...vals],
  );
}

export async function findAllCareClientProfileForProject(
  projectId: string,
): Promise<DbCompanyProfile | null> {
  const r = await query(
    `SELECT * FROM company_profiles
     WHERE project_id = $1
       AND profile_type = 'Client'
       AND (
         LOWER(name) LIKE '%allcare%'
         OR LOWER(display_name) LIKE '%allcare%'
         OR LOWER(COALESCE(website_url, '')) LIKE '%allcarepharmacy.com%'
       )
     ORDER BY updated_at DESC
     LIMIT 1`,
    [projectId],
  );
  if (r.rowCount === 0) return null;
  return mapCompanyProfileRow(r.rows[0] as Record<string, unknown>);
}

export async function createIntelligenceSource(input: {
  projectId: string;
  companyProfileId?: string | null;
  sourceType: string;
  url?: string | null;
  urlNormalized?: string | null;
  title?: string | null;
  rawText: string;
  classification?: string | null;
  metadata?: Record<string, unknown>;
  validationStatus?: string;
  fetchedAt?: string | null;
}): Promise<DbIntelligenceSource> {
  const r = await query(
    `INSERT INTO intelligence_sources (
      project_id, company_profile_id, source_type, url, url_normalized, title, raw_text,
      classification, metadata, validation_status, fetched_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, now()) RETURNING *`,
    [
      input.projectId,
      input.companyProfileId ?? null,
      input.sourceType,
      input.url ?? null,
      input.urlNormalized ?? null,
      input.title ?? null,
      input.rawText,
      input.classification ?? null,
      JSON.stringify(input.metadata ?? {}),
      input.validationStatus ?? "Pending Validation",
      input.fetchedAt ?? null,
    ],
  );
  return mapIntelligenceSourceRow(r.rows[0] as Record<string, unknown>);
}

export type UpsertWebsiteScrapeInput = {
  projectId: string;
  companyProfileId: string;
  url: string;
  urlNormalized: string;
  title: string | null;
  rawText: string;
  classification: string | null;
  metadata: Record<string, unknown>;
  fetchedAt: string;
};

export async function upsertIntelligenceSourceWebsiteScrape(
  input: UpsertWebsiteScrapeInput,
): Promise<DbIntelligenceSource> {
  const r = await query(
    `INSERT INTO intelligence_sources (
      project_id, company_profile_id, source_type, url, url_normalized, title, raw_text,
      classification, metadata, validation_status, fetched_at, updated_at
    ) VALUES ($1, $2, 'website_scrape', $3, $4, $5, $6, $7, $8::jsonb, 'Pending Validation', $9::timestamptz, now())
    ON CONFLICT (project_id, company_profile_id, url_normalized)
    DO UPDATE SET
      url = EXCLUDED.url,
      title = EXCLUDED.title,
      raw_text = EXCLUDED.raw_text,
      classification = EXCLUDED.classification,
      metadata = intelligence_sources.metadata || EXCLUDED.metadata,
      fetched_at = EXCLUDED.fetched_at,
      updated_at = now()
    RETURNING *`,
    [
      input.projectId,
      input.companyProfileId,
      input.url,
      input.urlNormalized,
      input.title,
      input.rawText,
      input.classification,
      JSON.stringify(input.metadata),
      input.fetchedAt,
    ],
  );
  return mapIntelligenceSourceRow(r.rows[0] as Record<string, unknown>);
}

/** Vendor-owned public page crawl — deduped per project + vendor + normalized URL. */
export async function upsertVendorSitePageSource(input: {
  projectId: string;
  vendorId: string;
  crawlRunId: string;
  url: string;
  urlNormalized: string;
  title: string | null;
  rawText: string;
  pageType: string;
  crawlDepth: number;
  keptReason: string;
  priorityScore: number;
}): Promise<DbIntelligenceSource> {
  const r0 = await query(
    `SELECT id FROM intelligence_sources WHERE project_id = $1
     AND source_type = 'vendor_site_page'
     AND url_normalized = $2
     AND COALESCE(metadata->>'vendorId','') = $3`,
    [input.projectId, input.urlNormalized, input.vendorId],
  );
  const meta: Record<string, unknown> = {
    vendorId: input.vendorId,
    crawlRunId: input.crawlRunId,
    pageType: input.pageType,
    crawlDepth: input.crawlDepth,
    keptReason: input.keptReason,
    priorityScore: input.priorityScore,
  };
  if (r0.rows.length > 0) {
    const id = String((r0.rows[0] as Record<string, unknown>).id);
    await query(
      `UPDATE intelligence_sources SET
        url = $2,
        title = $3,
        raw_text = $4,
        classification = $5,
        metadata = metadata || $6::jsonb,
        fetched_at = now(),
        updated_at = now()
      WHERE id = $1`,
      [
        id,
        input.url,
        input.title,
        input.rawText,
        input.pageType,
        JSON.stringify(meta),
      ],
    );
    const r = await query(`SELECT * FROM intelligence_sources WHERE id = $1`, [id]);
    return mapIntelligenceSourceRow(r.rows[0] as Record<string, unknown>);
  }
  return createIntelligenceSource({
    projectId: input.projectId,
    companyProfileId: null,
    sourceType: "vendor_site_page",
    url: input.url,
    urlNormalized: input.urlNormalized,
    title: input.title,
    rawText: input.rawText,
    classification: input.pageType,
    metadata: meta,
    fetchedAt: new Date().toISOString(),
  });
}

export async function countVendorSiteSourcesForVendor(input: {
  projectId: string;
  vendorId: string;
}): Promise<number> {
  const r = await query(
    `SELECT COUNT(*)::int AS c FROM intelligence_sources
     WHERE project_id = $1 AND source_type = 'vendor_site_page'
       AND COALESCE(metadata->>'vendorId','') = $2`,
    [input.projectId, input.vendorId],
  );
  return Number((r.rows[0] as Record<string, unknown>).c ?? 0);
}

export async function deleteIntelligenceFactsBySourceAndFactTypes(input: {
  sourceId: string;
  factTypes: string[];
}): Promise<number> {
  if (input.factTypes.length === 0) return 0;
  const r = await query(
    `DELETE FROM intelligence_facts
     WHERE source_id = $1 AND fact_type = ANY($2::text[])`,
    [input.sourceId, input.factTypes],
  );
  return r.rowCount ?? 0;
}

export async function intelligenceFactExistsForSource(input: {
  sourceId: string;
  factType: string;
  factText: string;
}): Promise<boolean> {
  const r = await query(
    `SELECT 1 FROM intelligence_facts
     WHERE source_id = $1 AND fact_type = $2
       AND lower(trim(fact_text)) = lower(trim($3))
     LIMIT 1`,
    [input.sourceId, input.factType, input.factText],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function listIntelligenceFactsForPromotion(input: {
  companyProfileId: string;
  sourceIds: string[];
  factTypes: string[];
}): Promise<
  {
    id: string;
    sourceId: string;
    factType: string;
    factText: string;
    credibility: string;
    confidence: string;
  }[]
> {
  if (input.sourceIds.length === 0 || input.factTypes.length === 0) return [];
  const r = await query(
    `SELECT id, source_id, fact_type, fact_text, credibility, confidence
     FROM intelligence_facts
     WHERE company_profile_id = $1
       AND source_id = ANY($2::uuid[])
       AND fact_type = ANY($3::text[])`,
    [input.companyProfileId, input.sourceIds, input.factTypes],
  );
  return r.rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    sourceId: String(row.source_id),
    factType: String(row.fact_type),
    factText: String(row.fact_text),
    credibility: String(row.credibility ?? ""),
    confidence: String(row.confidence ?? ""),
  }));
}

export async function aggregateFactQualityForProfile(
  companyProfileId: string,
): Promise<{
  total: number;
  operationalHigh: number;
  operationalMedium: number;
  marketing: number;
  inferred: number;
  missingCredibilityOrConfidence: number;
}> {
  const r = await query(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE credibility = 'operational' AND confidence = 'high')::int AS oh,
      COUNT(*) FILTER (WHERE credibility = 'operational' AND confidence = 'medium')::int AS om,
      COUNT(*) FILTER (WHERE credibility = 'marketing')::int AS mk,
      COUNT(*) FILTER (WHERE credibility = 'inferred')::int AS inf,
      COUNT(*) FILTER (
        WHERE trim(coalesce(credibility, '')) = ''
           OR trim(coalesce(confidence, '')) = ''
      )::int AS missing_meta
     FROM intelligence_facts WHERE company_profile_id = $1`,
    [companyProfileId],
  );
  const row = r.rows[0] as Record<string, unknown>;
  return {
    total: Number(row.total ?? 0),
    operationalHigh: Number(row.oh ?? 0),
    operationalMedium: Number(row.om ?? 0),
    marketing: Number(row.mk ?? 0),
    inferred: Number(row.inf ?? 0),
    missingCredibilityOrConfidence: Number(row.missing_meta ?? 0),
  };
}

export async function listFactsNeedingCredibilityBackfill(
  companyProfileId: string,
): Promise<DbIntelligenceFact[]> {
  const r = await query(
    `SELECT * FROM intelligence_facts
     WHERE company_profile_id = $1
       AND (
         trim(coalesce(credibility, '')) = ''
         OR trim(coalesce(confidence, '')) = ''
       )
     ORDER BY created_at ASC`,
    [companyProfileId],
  );
  return r.rows.map((row: Record<string, unknown>) =>
    mapIntelligenceFactRow(row),
  );
}

export async function patchIntelligenceFactCredibility(input: {
  id: string;
  credibility: string;
  confidence: string;
}): Promise<void> {
  await assertIntelligenceFactsCredibilityColumns();
  await query(
    `UPDATE intelligence_facts
     SET
       credibility = CASE
         WHEN trim(coalesce(credibility, '')) = '' THEN $2 ELSE credibility END,
       confidence = CASE
         WHEN trim(coalesce(confidence, '')) = '' THEN $3 ELSE confidence END,
       updated_at = now()
     WHERE id = $1`,
    [input.id, input.credibility, input.confidence],
  );
}

/** Overwrites credibility/confidence (safe-correct / admin paths only). */
export async function setIntelligenceFactCredibility(input: {
  id: string;
  credibility: string;
  confidence: string;
}): Promise<void> {
  await assertIntelligenceFactsCredibilityColumns();
  await query(
    `UPDATE intelligence_facts
     SET credibility = $2, confidence = $3, updated_at = now()
     WHERE id = $1`,
    [input.id, input.credibility, input.confidence],
  );
}

export async function createIntelligenceFact(input: {
  projectId: string;
  sourceId: string;
  companyProfileId?: string | null;
  factType: string;
  factText: string;
  classification?: string | null;
  validationStatus?: string;
  credibility?: string;
  confidence?: string;
}): Promise<DbIntelligenceFact> {
  const r = await query(
    `INSERT INTO intelligence_facts (
      project_id, source_id, company_profile_id, fact_type, fact_text,
      classification, validation_status, credibility, confidence, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now()) RETURNING *`,
    [
      input.projectId,
      input.sourceId,
      input.companyProfileId ?? null,
      input.factType,
      input.factText,
      input.classification ?? null,
      input.validationStatus ?? "Pending Validation",
      input.credibility ?? "",
      input.confidence ?? "",
    ],
  );
  return mapIntelligenceFactRow(r.rows[0] as Record<string, unknown>);
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

export async function getIntelligenceSource(
  id: string,
): Promise<DbIntelligenceSource | null> {
  const r = await query(`SELECT * FROM intelligence_sources WHERE id = $1`, [
    id,
  ]);
  if (r.rowCount === 0) return null;
  return mapIntelligenceSourceRow(r.rows[0] as Record<string, unknown>);
}

export async function mergeIntelligenceSourceMetadata(input: {
  id: string;
  patch: Record<string, unknown>;
}): Promise<void> {
  await query(
    `UPDATE intelligence_sources
     SET metadata = metadata || $2::jsonb, updated_at = now()
     WHERE id = $1`,
    [input.id, JSON.stringify(input.patch)],
  );
}

export async function listIntelligenceSourcesByCompanyProfile(
  companyProfileId: string,
): Promise<DbIntelligenceSource[]> {
  const r = await query(
    `SELECT * FROM intelligence_sources WHERE company_profile_id = $1 ORDER BY created_at`,
    [companyProfileId],
  );
  return r.rows.map((row: Record<string, unknown>) =>
    mapIntelligenceSourceRow(row),
  );
}

export async function listFactsByProject(
  projectId: string,
  limit = 50,
): Promise<DbIntelligenceFact[]> {
  const r = await query(
    `SELECT * FROM intelligence_facts WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [projectId, limit],
  );
  return r.rows.map((row: Record<string, unknown>) =>
    mapIntelligenceFactRow(row),
  );
}

export async function listFactsByCompanyProfile(
  companyProfileId: string,
): Promise<DbIntelligenceFact[]> {
  const r = await query(
    `SELECT * FROM intelligence_facts WHERE company_profile_id = $1 ORDER BY created_at DESC`,
    [companyProfileId],
  );
  return r.rows.map((row: Record<string, unknown>) =>
    mapIntelligenceFactRow(row),
  );
}

export async function countWebsiteScrapeSourcesForProfile(
  companyProfileId: string,
): Promise<number> {
  const r = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM intelligence_sources
     WHERE company_profile_id = $1 AND source_type = 'website_scrape'`,
    [companyProfileId],
  );
  return Number(r.rows[0]?.c ?? 0);
}

export async function maxFetchedAtWebsiteScrapesForProfile(
  companyProfileId: string,
): Promise<string | null> {
  const r = await query<{ t: string | null }>(
    `SELECT MAX(fetched_at)::text AS t FROM intelligence_sources
     WHERE company_profile_id = $1 AND source_type = 'website_scrape'`,
    [companyProfileId],
  );
  const t = r.rows[0]?.t;
  return t == null || t === "" ? null : new Date(t).toISOString();
}

export async function countFactsForProfileByFactTypes(input: {
  companyProfileId: string;
  factTypes: string[];
}): Promise<number> {
  if (input.factTypes.length === 0) return 0;
  const r = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM intelligence_facts
     WHERE company_profile_id = $1 AND fact_type = ANY($2::text[])`,
    [input.companyProfileId, input.factTypes],
  );
  return Number(r.rows[0]?.c ?? 0);
}

export async function countFactsForProfile(
  companyProfileId: string,
): Promise<number> {
  const r = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM intelligence_facts
     WHERE company_profile_id = $1`,
    [companyProfileId],
  );
  return Number(r.rows[0]?.c ?? 0);
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

/** Intelligence sources tagged with `metadata.vendorId` (vendor research ingest). */
export async function listIntelligenceSourcesByVendorId(input: {
  projectId: string;
  vendorId: string;
}): Promise<DbIntelligenceSource[]> {
  const r = await query(
    `SELECT * FROM intelligence_sources
     WHERE project_id = $1
       AND metadata->>'vendorId' = $2
     ORDER BY updated_at DESC`,
    [input.projectId, input.vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) =>
    mapIntelligenceSourceRow(row),
  );
}

/** Facts tied to vendor-tagged sources (provenance via join). */
export async function listIntelligenceFactsForVendor(input: {
  projectId: string;
  vendorId: string;
  limit?: number;
}): Promise<DbIntelligenceFact[]> {
  const lim = input.limit ?? 80;
  const r = await query(
    `SELECT f.* FROM intelligence_facts f
     INNER JOIN intelligence_sources s ON s.id = f.source_id
     WHERE f.project_id = $1 AND s.metadata->>'vendorId' = $2
     ORDER BY f.created_at DESC
     LIMIT $3`,
    [input.projectId, input.vendorId, lim],
  );
  return r.rows.map((row: Record<string, unknown>) =>
    mapIntelligenceFactRow(row),
  );
}
