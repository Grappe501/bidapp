import { listIntelligenceFactsForPromotion } from "../repositories/intelligence.repo";
import {
  createVendorClaim,
  vendorClaimExistsForSourceAndText,
} from "../repositories/vendor.repo";

const PROMOTABLE_FACT_TYPES = [
  "capability",
  "technology_reference",
  "allcare_fact",
] as const;

export type PromotionQualitySummary = {
  promoted: number;
  skipped_low_confidence: number;
  skipped_marketing: number;
  skipped_inferred: number;
  skipped_duplicate: number;
  skipped_non_operational: number;
};

/**
 * Promotes only operational, non–low-confidence facts into vendor_claims.
 */
export async function promoteAllCareWebsiteFactsToVendorClaims(input: {
  companyProfileId: string;
  vendorId: string;
  sourceIds: string[];
}): Promise<PromotionQualitySummary> {
  const summary: PromotionQualitySummary = {
    promoted: 0,
    skipped_low_confidence: 0,
    skipped_marketing: 0,
    skipped_inferred: 0,
    skipped_duplicate: 0,
    skipped_non_operational: 0,
  };

  if (!input.vendorId || input.sourceIds.length === 0) return summary;

  const rows = await listIntelligenceFactsForPromotion({
    companyProfileId: input.companyProfileId,
    sourceIds: input.sourceIds,
    factTypes: [...PROMOTABLE_FACT_TYPES],
  });

  for (const row of rows) {
    const text = row.factText.trim();
    if (text.length < 3) continue;

    const cred = (row.credibility ?? "").toLowerCase().trim();
    const conf = (row.confidence ?? "").toLowerCase().trim();

    if (cred === "marketing") {
      summary.skipped_marketing++;
      continue;
    }
    if (cred === "inferred") {
      summary.skipped_inferred++;
      continue;
    }
    if (cred !== "operational") {
      summary.skipped_non_operational++;
      continue;
    }
    if (conf === "low") {
      summary.skipped_low_confidence++;
      continue;
    }

    const exists = await vendorClaimExistsForSourceAndText({
      vendorId: input.vendorId,
      sourceId: row.sourceId,
      claimText: text,
    });
    if (exists) {
      summary.skipped_duplicate++;
      continue;
    }

    await createVendorClaim({
      vendorId: input.vendorId,
      sourceId: row.sourceId,
      claimText: text,
      validationStatus: "Unverified",
    });
    summary.promoted++;
  }

  return summary;
}
