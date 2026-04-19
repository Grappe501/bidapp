import type {
  CompetitorAwareSimulationResult,
  CompetitorRecommendationConfidence,
} from "@/types";

export type VendorDecisionAssessment = {
  /** False when vendor posture should block or downgrade “ready”. */
  vendorStrategyViable: boolean;
  recommendationConfidence: CompetitorRecommendationConfidence | null;
  blockers: string[];
  warnings: string[];
};

/**
 * Surfaces vendor/architecture decision quality for the final readiness gate.
 * Does not invent proof status — uses competitor simulation outputs only.
 */
export function assessVendorDecisionForReadiness(
  sim: CompetitorAwareSimulationResult | null | undefined,
): VendorDecisionAssessment {
  if (!sim || sim.entries.length === 0) {
    return {
      vendorStrategyViable: true,
      recommendationConfidence: null,
      blockers: [],
      warnings: [
        "Vendor comparison has no entries — add vendors and run competitor analysis before treating stack choice as validated.",
      ],
    };
  }

  const sorted = [...sim.entries].sort((a, b) => b.overallScore - a.overallScore);
  const lead = sorted[0];
  if (!lead) {
    return {
      vendorStrategyViable: true,
      recommendationConfidence: sim.recommendationConfidence,
      blockers: [],
      warnings: [],
    };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  const conf = sim.recommendationConfidence;
  const criticalOnLead = lead.criticalGaps.length;
  const mustAsk =
    lead.mustAskQuestions.length + sim.competitorInterviewQuestions.length;

  if (conf === "provisional" && criticalOnLead >= 2) {
    blockers.push(
      "Vendor recommendation is provisional with multiple unresolved critical gaps — stack choice is not submission-safe.",
    );
  }

  if (conf === "low" && lead.overallScore < 42) {
    blockers.push(
      "Leading vendor scores low with low evidence confidence — bid defensibility may be materially weak.",
    );
  }

  if (lead.confidence === "low" && lead.overallScore < 48) {
    warnings.push(
      "Leading vendor entry has low evidence confidence — strengthen proof before calling the bid ready.",
    );
  }

  if (mustAsk > 0 && (conf === "provisional" || conf === "low")) {
    warnings.push(
      `Must-ask or competitor interview questions remain (${mustAsk}) — confirm answers before proposal lock.`,
    );
  }

  if (conf === "provisional") {
    warnings.push(
      "Vendor recommendation is provisional — resolve near-tie or proof gaps before final readiness.",
    );
  }

  if (sim.decisionRisks.length > 0) {
    for (const r of sim.decisionRisks.slice(0, 3)) {
      if (!warnings.includes(r)) warnings.push(r);
    }
  }

  const vendorStrategyViable = blockers.length === 0;

  return {
    vendorStrategyViable,
    recommendationConfidence: conf,
    blockers,
    warnings,
  };
}
