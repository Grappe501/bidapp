/**
 * Operator checklist derived from branding / ingest signals (client + server safe).
 */
export type VendorLinkRecommendedAction =
  | "link_existing_vendor"
  | "create_vendor_record"
  | "review_candidates"
  | "none";

export type AllCareBrandingNextActionsInput = {
  robotsReviewRecommended: boolean;
  vendorRecommendedAction: VendorLinkRecommendedAction | null;
  vendorMatchType: string | null;
  vendorMatchConfidence: string | null;
  lastFactAudit: {
    mode: string;
    skippedAmbiguous?: number;
    skippedAmbiguousExamples?: unknown[];
    wouldFillMissing?: number;
    filledMissing?: number;
  } | null;
  ingestQualityWarnings: string[];
  ingestQualityBand: "strong" | "moderate" | "weak" | null;
};

export function deriveAllCareBrandingNextActions(
  b: AllCareBrandingNextActionsInput,
): string[] {
  const actions: string[] = [];
  if (b.robotsReviewRecommended) {
    actions.push("Review robots interpretation against the live site.");
  }
  if (b.vendorRecommendedAction === "link_existing_vendor") {
    actions.push(
      "Link the AllCare company profile to the suggested vendor record.",
    );
  }
  if (
    b.vendorRecommendedAction === "review_candidates" ||
    b.vendorMatchType === "ambiguous"
  ) {
    actions.push("Review vendor candidates and link the correct record.");
  }
  if (b.vendorRecommendedAction === "create_vendor_record") {
    actions.push(
      "Create or confirm a vendor record for AllCare Pharmacy in this project.",
    );
  }
  if (
    (b.vendorMatchConfidence === "none" || b.vendorMatchType === "none") &&
    !b.vendorRecommendedAction
  ) {
    actions.push(
      "Resolve vendor linkage so website facts can promote to vendor claims.",
    );
  }
  const amb = b.lastFactAudit?.skippedAmbiguous ?? 0;
  const ambEx = b.lastFactAudit?.skippedAmbiguousExamples?.length ?? 0;
  if (amb > 0 || ambEx > 0) {
    actions.push("Review ambiguous legacy fact classifications (see audit).");
  }
  const missing =
    b.lastFactAudit?.wouldFillMissing ?? b.lastFactAudit?.filledMissing;
  if ((missing ?? 0) > 0 && b.lastFactAudit?.mode === "audit-only") {
    actions.push("Run fill-missing backfill if empty credibility fields remain.");
  }
  if (
    b.ingestQualityBand === "weak" ||
    (b.ingestQualityWarnings?.length ?? 0) > 2
  ) {
    actions.push(
      "Consider re-running ingest with live crawl or force re-parse after site changes.",
    );
  }
  return [...new Set(actions)].slice(0, 7);
}
