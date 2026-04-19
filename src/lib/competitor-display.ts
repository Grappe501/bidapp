import type { CompetitorRecommendationConfidence } from "@/types";

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
