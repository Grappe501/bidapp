import { query } from "../db/client";
import { normalizeForMatch } from "../lib/string-similarity";
import {
  resolveFuzzyVendorMatches,
  type VendorMatchCandidate,
} from "../lib/vendor-match-utils";

export type DbVendor = {
  id: string;
  projectId: string;
  name: string;
  category: string;
  status: string;
  summary: string;
  fitScore: number;
  implementationSpeed: string;
  ltcFit: string;
  apiReadiness: string;
  pricingNotes: string;
  likelyStackRole: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  notes: string;
  capabilities: { id: string; statement: string }[];
  sourceFileIds: string[];
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  createdAt: string;
  updatedAt: string;
};

function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "string") return JSON.parse(v) as T;
  return v as T;
}

function mapVendor(r: Record<string, unknown>): DbVendor {
  return {
    id: String(r.id),
    projectId: String(r.project_id),
    name: String(r.name),
    category: String(r.category),
    status: String(r.status),
    summary: String(r.summary),
    fitScore: Number(r.fit_score),
    implementationSpeed: String(r.implementation_speed),
    ltcFit: String(r.ltc_fit),
    apiReadiness: String(r.api_readiness),
    pricingNotes: String(r.pricing_notes),
    likelyStackRole: String(r.likely_stack_role),
    strengths: parseJson(r.strengths, [] as string[]),
    weaknesses: parseJson(r.weaknesses, [] as string[]),
    risks: parseJson(r.risks, [] as string[]),
    notes: String(r.notes),
    capabilities: parseJson(r.capabilities, [] as { id: string; statement: string }[]),
    sourceFileIds: parseJson(r.source_file_ids, [] as string[]),
    primaryContactName: String(r.primary_contact_name),
    primaryContactEmail: String(r.primary_contact_email),
    primaryContactPhone: String(r.primary_contact_phone),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function createVendor(input: {
  id?: string;
  projectId: string;
  name: string;
  category: string;
  status: string;
  summary: string;
  fitScore: number;
  implementationSpeed: string;
  ltcFit: string;
  apiReadiness: string;
  pricingNotes: string;
  likelyStackRole: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  notes: string;
  capabilities: { id: string; statement: string }[];
  sourceFileIds: string[];
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}): Promise<DbVendor> {
  const r = await query(
    `INSERT INTO vendors (
      id, project_id, name, category, status, summary, fit_score, implementation_speed,
      ltc_fit, api_readiness, pricing_notes, likely_stack_role, strengths, weaknesses,
      risks, notes, capabilities, source_file_ids, primary_contact_name,
      primary_contact_email, primary_contact_phone, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13::jsonb, $14::jsonb, $15::jsonb, $16, $17::jsonb, $18::jsonb, $19, $20, $21, now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.projectId,
      input.name,
      input.category,
      input.status,
      input.summary,
      input.fitScore,
      input.implementationSpeed,
      input.ltcFit,
      input.apiReadiness,
      input.pricingNotes,
      input.likelyStackRole,
      JSON.stringify(input.strengths),
      JSON.stringify(input.weaknesses),
      JSON.stringify(input.risks),
      input.notes,
      JSON.stringify(input.capabilities),
      JSON.stringify(input.sourceFileIds),
      input.primaryContactName,
      input.primaryContactEmail,
      input.primaryContactPhone,
    ],
  );
  return mapVendor(r.rows[0] as Record<string, unknown>);
}

export async function createVendorContact(input: {
  vendorId: string;
  name: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}): Promise<void> {
  await query(
    `INSERT INTO vendor_contacts (vendor_id, name, email, phone, is_primary, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())`,
    [
      input.vendorId,
      input.name,
      input.email,
      input.phone,
      input.isPrimary,
    ],
  );
}

export async function listVendorsByProject(projectId: string): Promise<DbVendor[]> {
  const r = await query(`SELECT * FROM vendors WHERE project_id = $1 ORDER BY name`, [
    projectId,
  ]);
  return r.rows.map((row: Record<string, unknown>) => mapVendor(row));
}

export async function getVendorById(id: string): Promise<DbVendor | null> {
  const r = await query(`SELECT * FROM vendors WHERE id = $1`, [id]);
  if (r.rowCount === 0) return null;
  return mapVendor(r.rows[0] as Record<string, unknown>);
}

export async function findVendorIdByProjectAndName(
  projectId: string,
  name: string,
): Promise<string | null> {
  const r = await query(
    `SELECT id FROM vendors WHERE project_id = $1 AND lower(name) = lower($2) LIMIT 1`,
    [projectId, name.trim()],
  );
  if (r.rowCount === 0) return null;
  return String((r.rows[0] as Record<string, unknown>).id);
}

export async function createVendorClaim(input: {
  vendorId: string;
  sourceId: string;
  claimText: string;
  validationStatus?: string;
  credibility?: string;
  confidence?: string;
  claimCategory?: string;
}): Promise<void> {
  await query(
    `INSERT INTO vendor_claims (
       vendor_id, source_id, claim_text, validation_status,
       credibility, confidence, claim_category, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
    [
      input.vendorId,
      input.sourceId,
      input.claimText,
      input.validationStatus ?? "Unverified",
      input.credibility ?? "",
      input.confidence ?? "",
      input.claimCategory ?? "other",
    ],
  );
}

export type DbVendorClaimRow = {
  id: string;
  vendorId: string;
  sourceId: string | null;
  claimText: string;
  validationStatus: string;
  credibility: string;
  confidence: string;
  claimCategory: string;
};

function mapVendorClaimRow(row: Record<string, unknown>): DbVendorClaimRow {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    sourceId: row.source_id == null ? null : String(row.source_id),
    claimText: String(row.claim_text),
    validationStatus: String(row.validation_status),
    credibility: String(row.credibility ?? ""),
    confidence: String(row.confidence ?? ""),
    claimCategory: String(row.claim_category ?? "other"),
  };
}

export async function listVendorClaimsByVendorId(
  vendorId: string,
  limit = 120,
): Promise<DbVendorClaimRow[]> {
  const r = await query(
    `SELECT * FROM vendor_claims WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [vendorId, limit],
  );
  return r.rows.map((row: Record<string, unknown>) => mapVendorClaimRow(row));
}

export async function updateVendorFitScore(input: {
  vendorId: string;
  fitScore: number;
}): Promise<void> {
  await query(
    `UPDATE vendors SET fit_score = $2, updated_at = now() WHERE id = $1`,
    [input.vendorId, input.fitScore],
  );
}

export async function vendorClaimExistsForSourceAndText(input: {
  vendorId: string;
  sourceId: string;
  claimText: string;
}): Promise<boolean> {
  const r = await query(
    `SELECT 1 FROM vendor_claims
     WHERE vendor_id = $1 AND source_id = $2
       AND lower(trim(claim_text)) = lower(trim($3))
     LIMIT 1`,
    [input.vendorId, input.sourceId, input.claimText],
  );
  return (r.rowCount ?? 0) > 0;
}

export type VendorLinkRecommendedAction =
  | "link_existing_vendor"
  | "create_vendor_record"
  | "review_candidates"
  | "none";

export type VendorRecommendedCandidate = {
  vendorId: string;
  vendorName: string;
  score: number;
  scoreBreakdown: VendorMatchCandidate["scoreBreakdown"];
};

export type VendorResolution = {
  vendorId: string | null;
  confidence: "high" | "medium" | "low" | "none";
  matchType: "linked" | "exact" | "fuzzy" | "ambiguous" | "none";
  candidateCount: number;
  candidates?: VendorMatchCandidate[];
  notes?: string;
  /** Actionable guidance when match is not a confident link. */
  operatorGuidance?: string;
  /** Structured next step when vendorId is not confidently resolved. */
  recommendedAction?: VendorLinkRecommendedAction;
  recommendedCandidates?: VendorRecommendedCandidate[];
};

function toRecommendedCandidate(c: VendorMatchCandidate): VendorRecommendedCandidate {
  return {
    vendorId: c.vendorId,
    vendorName: c.vendorName,
    score: c.score,
    scoreBreakdown: c.scoreBreakdown,
  };
}

function withVendorLinkRecommendation(res: VendorResolution): VendorResolution {
  if (res.matchType === "linked" || res.matchType === "exact") {
    return { ...res, recommendedAction: "none" };
  }

  if (res.matchType === "ambiguous") {
    const top = res.candidates?.slice(0, 3).map(toRecommendedCandidate) ?? [];
    return {
      ...res,
      recommendedAction: "review_candidates",
      recommendedCandidates: top,
    };
  }

  if (res.matchType === "fuzzy" && res.vendorId && res.confidence === "medium") {
    const accepted = res.candidates?.filter((c) => c.accepted) ?? [];
    const top =
      accepted.length > 0
        ? accepted.slice(0, 1).map(toRecommendedCandidate)
        : (res.candidates?.slice(0, 1).map(toRecommendedCandidate) ?? []);
    return {
      ...res,
      recommendedAction: "link_existing_vendor",
      recommendedCandidates: top,
    };
  }

  if (res.matchType === "fuzzy") {
    const top = res.candidates?.slice(0, 3).map(toRecommendedCandidate) ?? [];
    return {
      ...res,
      recommendedAction: top.length > 0 ? "review_candidates" : "create_vendor_record",
      recommendedCandidates: top,
    };
  }

  if (res.matchType === "none" || res.confidence === "none") {
    const top = res.candidates?.slice(0, 3).map(toRecommendedCandidate) ?? [];
    if (top.length > 0) {
      return {
        ...res,
        recommendedAction: "review_candidates",
        recommendedCandidates: top,
      };
    }
    return {
      ...res,
      recommendedAction: "create_vendor_record",
      recommendedCandidates: [],
    };
  }

  return { ...res, recommendedAction: "none" };
}

function withVendorOperatorGuidance(res: VendorResolution): VendorResolution {
  if (res.matchType === "linked" || res.matchType === "exact") {
    return withVendorLinkRecommendation({ ...res });
  }
  if (res.matchType === "fuzzy" && res.confidence === "medium") {
    return withVendorLinkRecommendation({
      ...res,
      operatorGuidance:
        "Fuzzy vendor match — confirm the record is correct for stronger bid claim reuse.",
    });
  }
  const parts: string[] = [];
  if (res.matchType === "ambiguous") {
    parts.push(
      "Multiple candidate vendor names were too close to auto-resolve.",
    );
    parts.push(
      "Link the AllCare company profile to the correct vendor record to enable claim promotion.",
    );
  } else if (res.notes?.includes("No vendors in project")) {
    parts.push(
      "Create or confirm a project vendor record for AllCare Pharmacy before expecting vendor_claim promotion.",
    );
  } else if (res.matchType === "none" || res.confidence === "none") {
    parts.push(
      "Link the AllCare company profile to the correct vendor record to enable claim promotion.",
    );
    if (!res.notes?.includes("No vendors in project")) {
      parts.push(
        "Create or confirm a project vendor record for AllCare Pharmacy if one does not exist yet.",
      );
    }
  }
  const operatorGuidance = [...new Set(parts)].filter(Boolean).join(" ");
  return withVendorLinkRecommendation({
    ...res,
    operatorGuidance: operatorGuidance || undefined,
  });
}

export type { VendorMatchCandidate };

/**
 * Resolves vendor conservatively: linked/exact stay high; fuzzy uses scored candidates
 * with tie and pharmacy-signal penalties (see vendor-match-utils).
 */
export async function resolveVendorWithConfidence(input: {
  projectId: string;
  profileName: string;
  displayName: string;
  linkedVendorId: string | null;
  /** Pages in this ingest; when low, fuzzy resolution is stricter. */
  pagesIngested?: number;
}): Promise<VendorResolution> {
  if (input.linkedVendorId?.trim()) {
    return withVendorOperatorGuidance({
      vendorId: input.linkedVendorId.trim(),
      confidence: "high",
      matchType: "linked",
      candidateCount: 1,
    });
  }

  const vendors = await listVendorsByProject(input.projectId);
  if (vendors.length === 0) {
    return withVendorOperatorGuidance({
      vendorId: null,
      confidence: "none",
      matchType: "none",
      candidateCount: 0,
      notes: "No vendors in project.",
    });
  }

  const profileKeys = [
    input.profileName,
    input.displayName,
    "AllCare Pharmacy",
  ]
    .map((s) => normalizeForMatch(s))
    .filter((s, i, a) => s.length > 0 && a.indexOf(s) === i);

  for (const v of vendors) {
    const vn = normalizeForMatch(v.name);
    for (const pk of profileKeys) {
      if (pk.length > 0 && vn === pk) {
        return withVendorOperatorGuidance({
          vendorId: v.id,
          confidence: "high",
          matchType: "exact",
          candidateCount: 1,
        });
      }
    }
  }

  const fuzzy = resolveFuzzyVendorMatches({
    vendors: vendors.map((v) => ({ id: v.id, name: v.name })),
    profileName: input.profileName,
    displayName: input.displayName,
    pagesIngested: input.pagesIngested,
  });

  return withVendorOperatorGuidance({
    vendorId: fuzzy.vendorId,
    confidence: fuzzy.confidence,
    matchType: fuzzy.matchType,
    candidateCount: fuzzy.candidateCount,
    notes: fuzzy.notes,
    candidates: fuzzy.candidates,
  });
}

/** @deprecated Prefer resolveVendorWithConfidence for judgment metadata. */
export async function resolveVendorIdForAllCareClientProfile(input: {
  projectId: string;
  profileName: string;
  linkedVendorId: string | null;
}): Promise<string | null> {
  const r = await resolveVendorWithConfidence({
    projectId: input.projectId,
    profileName: input.profileName,
    displayName: input.profileName,
    linkedVendorId: input.linkedVendorId,
  });
  if (r.matchType === "ambiguous") return null;
  return r.vendorId;
}
