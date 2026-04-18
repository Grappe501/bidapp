import type { GroundingBundlePayload } from "@/types";

export function emptyGroundingPayload(
  bundleType: GroundingBundlePayload["bundleType"],
  title: string,
): GroundingBundlePayload {
  return {
    bundleType,
    title,
    retrievedChunks: [],
    requirements: [],
    evidence: [],
    architectureOptions: [],
    vendorFacts: [],
    gaps: [],
    validationNotes: [],
    assembledAt: new Date().toISOString(),
  };
}

export function summarizeGaps(payload: GroundingBundlePayload): string[] {
  const gaps = [...payload.gaps];
  if (payload.retrievedChunks.length === 0) {
    gaps.push("No embedded chunks retrieved — run embed-file after parsing.");
  }
  if (
    payload.bundleType === "Risk" &&
    payload.requirements.filter((r) => r.riskLevel === "Critical" || r.riskLevel === "High").length === 0
  ) {
    gaps.push("No high/critical requirements included — verify matrix filters.");
  }
  return gaps;
}
