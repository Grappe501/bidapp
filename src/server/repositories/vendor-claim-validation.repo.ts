import { query } from "../db/client";
import type { ClaimCategory } from "../lib/claim-normalization";

export type DbVendorClaimValidation = {
  id: string;
  vendorId: string;
  normalizedClaimKey: string;
  machineClaimText: string;
  claimText: string;
  claimTextLocked: boolean;
  claimCategory: ClaimCategory | string;
  claimSourceType: string;
  supportLevel: string;
  contradictionStatus: string;
  confidence: string;
  needsFollowUp: boolean;
  followUpReason: string | null;
  scoringImpact: string;
  rationale: string;
  machineRationale: string;
  humanNote: string;
  isCritical: boolean;
  supportLevelOverride: string | null;
  evidenceSourceIds: string[];
  supportingFactIds: string[];
  contradictingFactIds: string[];
  originatingVendorClaimId: string | null;
  createdAt: string;
  updatedAt: string;
};

function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "string") return JSON.parse(v) as T;
  return v as T;
}

function mapRow(row: Record<string, unknown>): DbVendorClaimValidation {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    normalizedClaimKey: String(row.normalized_claim_key),
    machineClaimText: String(row.machine_claim_text ?? ""),
    claimText: String(row.claim_text),
    claimTextLocked: Boolean(row.claim_text_locked),
    claimCategory: String(row.claim_category ?? "other"),
    claimSourceType: String(row.claim_source_type ?? "derived"),
    supportLevel: String(row.support_level),
    contradictionStatus: String(row.contradiction_status ?? "none"),
    confidence: String(row.confidence ?? "low"),
    needsFollowUp: Boolean(row.needs_follow_up),
    followUpReason:
      row.follow_up_reason == null ? null : String(row.follow_up_reason),
    scoringImpact: String(row.scoring_impact ?? "neutral"),
    rationale: String(row.rationale ?? ""),
    machineRationale: String(row.machine_rationale ?? ""),
    humanNote: String(row.human_note ?? ""),
    isCritical: Boolean(row.is_critical),
    supportLevelOverride:
      row.support_level_override == null
        ? null
        : String(row.support_level_override),
    evidenceSourceIds: parseJson(row.evidence_source_ids, [] as string[]),
    supportingFactIds: parseJson(row.supporting_fact_ids, [] as string[]),
    contradictingFactIds: parseJson(row.contradicting_fact_ids, [] as string[]),
    originatingVendorClaimId:
      row.originating_vendor_claim_id == null
        ? null
        : String(row.originating_vendor_claim_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listVendorClaimValidations(
  vendorId: string,
): Promise<DbVendorClaimValidation[]> {
  const r = await query(
    `SELECT * FROM vendor_claim_validations WHERE vendor_id = $1
     ORDER BY is_critical DESC, claim_category, normalized_claim_key`,
    [vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapRow(row));
}

export async function getVendorClaimValidationById(
  id: string,
  vendorId: string,
): Promise<DbVendorClaimValidation | null> {
  const r = await query(
    `SELECT * FROM vendor_claim_validations WHERE id = $1 AND vendor_id = $2`,
    [id, vendorId],
  );
  if (r.rowCount === 0) return null;
  return mapRow(r.rows[0] as Record<string, unknown>);
}

export async function upsertVendorClaimValidation(input: {
  vendorId: string;
  normalizedClaimKey: string;
  machineClaimText: string;
  claimText: string;
  claimTextLocked: boolean;
  claimCategory: string;
  claimSourceType: string;
  supportLevel: string;
  contradictionStatus: string;
  confidence: string;
  needsFollowUp: boolean;
  followUpReason: string | null;
  scoringImpact: string;
  rationale: string;
  machineRationale: string;
  humanNote: string;
  isCritical: boolean;
  supportLevelOverride: string | null;
  evidenceSourceIds: string[];
  supportingFactIds: string[];
  contradictingFactIds: string[];
  originatingVendorClaimId: string | null;
}): Promise<DbVendorClaimValidation> {
  const r = await query(
    `INSERT INTO vendor_claim_validations (
      vendor_id, normalized_claim_key, machine_claim_text, claim_text, claim_text_locked,
      claim_category, claim_source_type, support_level, contradiction_status, confidence,
      needs_follow_up, follow_up_reason, scoring_impact, rationale, machine_rationale, human_note,
      is_critical, support_level_override, evidence_source_ids, supporting_fact_ids,
      contradicting_fact_ids, originating_vendor_claim_id, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
      $19::jsonb, $20::jsonb, $21::jsonb, $22, now()
    )
    ON CONFLICT (vendor_id, normalized_claim_key) DO UPDATE SET
      machine_claim_text = EXCLUDED.machine_claim_text,
      claim_text = CASE
        WHEN vendor_claim_validations.claim_text_locked THEN vendor_claim_validations.claim_text
        ELSE EXCLUDED.claim_text
      END,
      claim_category = EXCLUDED.claim_category,
      claim_source_type = EXCLUDED.claim_source_type,
      support_level = EXCLUDED.support_level,
      contradiction_status = EXCLUDED.contradiction_status,
      confidence = EXCLUDED.confidence,
      needs_follow_up = EXCLUDED.needs_follow_up,
      follow_up_reason = EXCLUDED.follow_up_reason,
      scoring_impact = EXCLUDED.scoring_impact,
      rationale = EXCLUDED.rationale,
      machine_rationale = EXCLUDED.machine_rationale,
      human_note = CASE
        WHEN length(trim(coalesce(vendor_claim_validations.human_note, ''))) > 0
        THEN vendor_claim_validations.human_note
        ELSE EXCLUDED.human_note
      END,
      is_critical = vendor_claim_validations.is_critical OR EXCLUDED.is_critical,
      support_level_override = COALESCE(
        vendor_claim_validations.support_level_override,
        EXCLUDED.support_level_override
      ),
      evidence_source_ids = EXCLUDED.evidence_source_ids,
      supporting_fact_ids = EXCLUDED.supporting_fact_ids,
      contradicting_fact_ids = EXCLUDED.contradicting_fact_ids,
      originating_vendor_claim_id = COALESCE(
        vendor_claim_validations.originating_vendor_claim_id,
        EXCLUDED.originating_vendor_claim_id
      ),
      updated_at = now()
    RETURNING *`,
    [
      input.vendorId,
      input.normalizedClaimKey,
      input.machineClaimText,
      input.claimText,
      input.claimTextLocked,
      input.claimCategory,
      input.claimSourceType,
      input.supportLevel,
      input.contradictionStatus,
      input.confidence,
      input.needsFollowUp,
      input.followUpReason,
      input.scoringImpact,
      input.rationale,
      input.machineRationale,
      input.humanNote,
      input.isCritical,
      input.supportLevelOverride,
      JSON.stringify(input.evidenceSourceIds),
      JSON.stringify(input.supportingFactIds),
      JSON.stringify(input.contradictingFactIds),
      input.originatingVendorClaimId,
    ],
  );

  const row = r.rows[0] as Record<string, unknown>;
  return mapRow(row);
}

export async function patchVendorClaimValidation(input: {
  id: string;
  vendorId: string;
  claimText?: string;
  claimTextLocked?: boolean;
  humanNote?: string;
  isCritical?: boolean;
  supportLevelOverride?: string | null;
}): Promise<void> {
  const cur = await getVendorClaimValidationById(input.id, input.vendorId);
  if (!cur) throw new Error("Claim validation not found");

  const claimText = input.claimText ?? cur.claimText;
  const claimTextLocked =
    input.claimTextLocked ?? (input.claimText != null ? true : cur.claimTextLocked);
  const humanNote = input.humanNote ?? cur.humanNote;
  const isCritical = input.isCritical ?? cur.isCritical;
  const supportLevelOverride =
    input.supportLevelOverride !== undefined
      ? input.supportLevelOverride
      : cur.supportLevelOverride;

  await query(
    `UPDATE vendor_claim_validations SET
      claim_text = $3,
      claim_text_locked = $4,
      human_note = $5,
      is_critical = $6,
      support_level_override = $7,
      updated_at = now()
    WHERE id = $1 AND vendor_id = $2`,
    [
      input.id,
      input.vendorId,
      claimText,
      claimTextLocked,
      humanNote,
      isCritical,
      supportLevelOverride,
    ],
  );
}

export async function deleteVendorClaimValidationEvidence(
  validationId: string,
): Promise<void> {
  await query(
    `DELETE FROM vendor_claim_validation_evidence WHERE validation_id = $1`,
    [validationId],
  );
}

export async function insertVendorClaimValidationEvidence(input: {
  validationId: string;
  sourceId: string | null;
  factId: string | null;
  relationType: "support" | "contradict";
}): Promise<void> {
  await query(
    `INSERT INTO vendor_claim_validation_evidence (
      validation_id, source_id, fact_id, relation_type
    ) VALUES ($1, $2, $3, $4)`,
    [
      input.validationId,
      input.sourceId,
      input.factId,
      input.relationType,
    ],
  );
}
