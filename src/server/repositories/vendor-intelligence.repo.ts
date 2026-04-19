import { query } from "../db/client";

export type DbVendorFitDimension = {
  id: string;
  vendorId: string;
  dimensionKey: string;
  score: number;
  confidence: string;
  rationale: string;
  sourceIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type DbVendorIntegrationRequirement = {
  id: string;
  vendorId: string;
  requirementKey: string;
  status: string;
  evidence: string;
  createdAt: string;
  updatedAt: string;
};

export type DbVendorInterviewQuestion = {
  id: string;
  vendorId: string;
  question: string;
  category: string;
  priority: string;
  linkedGapId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DbVendorDiscoveryCandidate = {
  id: string;
  projectId: string;
  name: string;
  domain: string;
  similarityScore: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DbVendorResearchRun = {
  id: string;
  projectId: string;
  vendorId: string;
  runType: string;
  status: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
};

function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "string") return JSON.parse(v) as T;
  return v as T;
}

function mapFit(row: Record<string, unknown>): DbVendorFitDimension {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    dimensionKey: String(row.dimension_key),
    score: Number(row.score),
    confidence: String(row.confidence ?? ""),
    rationale: String(row.rationale ?? ""),
    sourceIds: parseJson(row.source_ids, [] as string[]),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapIntReq(row: Record<string, unknown>): DbVendorIntegrationRequirement {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    requirementKey: String(row.requirement_key),
    status: String(row.status),
    evidence: String(row.evidence ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapInterview(row: Record<string, unknown>): DbVendorInterviewQuestion {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    question: String(row.question),
    category: String(row.category),
    priority: String(row.priority),
    linkedGapId:
      row.linked_gap_id == null ? null : String(row.linked_gap_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapDiscovery(row: Record<string, unknown>): DbVendorDiscoveryCandidate {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name),
    domain: String(row.domain ?? ""),
    similarityScore: Number(row.similarity_score ?? 0),
    status: String(row.status),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapRun(row: Record<string, unknown>): DbVendorResearchRun {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    vendorId: String(row.vendor_id),
    runType: String(row.run_type),
    status: String(row.status),
    summary: String(row.summary ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function upsertVendorFitDimension(input: {
  vendorId: string;
  dimensionKey: string;
  score: number;
  confidence: string;
  rationale: string;
  sourceIds: string[];
}): Promise<DbVendorFitDimension> {
  const r = await query(
    `INSERT INTO vendor_fit_dimensions (
      vendor_id, dimension_key, score, confidence, rationale, source_ids, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, now())
    ON CONFLICT (vendor_id, dimension_key) DO UPDATE SET
      score = EXCLUDED.score,
      confidence = EXCLUDED.confidence,
      rationale = EXCLUDED.rationale,
      source_ids = EXCLUDED.source_ids,
      updated_at = now()
    RETURNING *`,
    [
      input.vendorId,
      input.dimensionKey,
      input.score,
      input.confidence,
      input.rationale,
      JSON.stringify(input.sourceIds),
    ],
  );
  return mapFit(r.rows[0] as Record<string, unknown>);
}

export async function deleteVendorFitDimensionsForVendor(
  vendorId: string,
): Promise<void> {
  await query(`DELETE FROM vendor_fit_dimensions WHERE vendor_id = $1`, [
    vendorId,
  ]);
}

export async function listVendorFitDimensionsByVendor(
  vendorId: string,
): Promise<DbVendorFitDimension[]> {
  const r = await query(
    `SELECT * FROM vendor_fit_dimensions WHERE vendor_id = $1 ORDER BY dimension_key`,
    [vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapFit(row));
}

export async function upsertVendorIntegrationRequirement(input: {
  vendorId: string;
  requirementKey: string;
  status: string;
  evidence: string;
}): Promise<DbVendorIntegrationRequirement> {
  const r = await query(
    `INSERT INTO vendor_integration_requirements (
      vendor_id, requirement_key, status, evidence, updated_at
    ) VALUES ($1, $2, $3, $4, now())
    ON CONFLICT (vendor_id, requirement_key) DO UPDATE SET
      status = EXCLUDED.status,
      evidence = EXCLUDED.evidence,
      updated_at = now()
    RETURNING *`,
    [
      input.vendorId,
      input.requirementKey,
      input.status,
      input.evidence,
    ],
  );
  return mapIntReq(r.rows[0] as Record<string, unknown>);
}

export async function deleteVendorIntegrationRequirementsForVendor(
  vendorId: string,
): Promise<void> {
  await query(`DELETE FROM vendor_integration_requirements WHERE vendor_id = $1`, [
    vendorId,
  ]);
}

export async function listVendorIntegrationRequirementsByVendor(
  vendorId: string,
): Promise<DbVendorIntegrationRequirement[]> {
  const r = await query(
    `SELECT * FROM vendor_integration_requirements WHERE vendor_id = $1 ORDER BY requirement_key`,
    [vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapIntReq(row));
}

export async function replaceVendorInterviewQuestions(input: {
  vendorId: string;
  rows: Array<{
    question: string;
    category: string;
    priority: string;
    linkedGapId?: string | null;
  }>;
}): Promise<void> {
  await query(`DELETE FROM vendor_interview_questions WHERE vendor_id = $1`, [
    input.vendorId,
  ]);
  for (const row of input.rows) {
    await query(
      `INSERT INTO vendor_interview_questions (
        vendor_id, question, category, priority, linked_gap_id, updated_at
      ) VALUES ($1, $2, $3, $4, $5, now())`,
      [
        input.vendorId,
        row.question,
        row.category,
        row.priority,
        row.linkedGapId ?? null,
      ],
    );
  }
}

export async function listVendorInterviewQuestionsByVendor(
  vendorId: string,
): Promise<DbVendorInterviewQuestion[]> {
  const r = await query(
    `SELECT * FROM vendor_interview_questions WHERE vendor_id = $1 ORDER BY priority, category`,
    [vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapInterview(row));
}

export async function insertVendorDiscoveryCandidate(input: {
  projectId: string;
  name: string;
  domain: string;
  similarityScore: number;
  status: string;
}): Promise<DbVendorDiscoveryCandidate> {
  const r = await query(
    `INSERT INTO vendor_discovery_candidates (
      project_id, name, domain, similarity_score, status, updated_at
    ) VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`,
    [
      input.projectId,
      input.name,
      input.domain,
      input.similarityScore,
      input.status,
    ],
  );
  return mapDiscovery(r.rows[0] as Record<string, unknown>);
}

export async function listVendorDiscoveryCandidatesByProject(
  projectId: string,
): Promise<DbVendorDiscoveryCandidate[]> {
  const r = await query(
    `SELECT * FROM vendor_discovery_candidates WHERE project_id = $1 ORDER BY similarity_score DESC`,
    [projectId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapDiscovery(row));
}

export async function insertVendorResearchRun(input: {
  projectId: string;
  vendorId: string;
  runType: string;
  status: string;
  summary: string;
}): Promise<DbVendorResearchRun> {
  const r = await query(
    `INSERT INTO vendor_research_runs (
      project_id, vendor_id, run_type, status, summary, updated_at
    ) VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`,
    [
      input.projectId,
      input.vendorId,
      input.runType,
      input.status,
      input.summary,
    ],
  );
  return mapRun(r.rows[0] as Record<string, unknown>);
}

export async function updateVendorResearchRun(input: {
  id: string;
  status: string;
  summary: string;
}): Promise<void> {
  await query(
    `UPDATE vendor_research_runs SET status = $2, summary = $3, updated_at = now() WHERE id = $1`,
    [input.id, input.status, input.summary],
  );
}
