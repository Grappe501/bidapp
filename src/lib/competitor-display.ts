import type {
  CompetitorRecommendationConfidence,
  VendorDecisionSynthesis,
} from "@/types";

export function formatRecommendationConfidence(
  c: CompetitorRecommendationConfidence,
): string {
  switch (c) {
    case "high":
      return "Strong";
    case "medium":
      return "Moderate";
    case "low":
      return "Low";
    case "provisional":
      return "Provisional";
    default:
      return c;
  }
}

/** Labels full decision synthesis confidence for tables and badges. */
export function formatDecisionSynthesisConfidence(
  c: VendorDecisionSynthesis["confidence"],
): string {
  return formatRecommendationConfidence(c);
}
