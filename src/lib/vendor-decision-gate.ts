import type {
  CompetitorAwareSimulationResult,
  CompetitorRecommendationConfidence,
  ProjectInterviewReadiness,
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
  projectInterviewReadiness?: ProjectInterviewReadiness | null,
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

  const leadId = sim.recommendedVendorId;
  if (leadId && projectInterviewReadiness?.vendors?.length) {
    const row = projectInterviewReadiness.vendors.find((v) => v.vendorId === leadId);
    if (row && row.p1Total > 0 && row.unresolvedP1 > 0) {
      warnings.push(
        `Recommended vendor has ${row.unresolvedP1} unresolved P1 interview item(s) — close must-know questions before locking stack language.`,
      );
    }
    if (row && row.p1Total > 0 && row.p1Unanswered > 0) {
      warnings.push(
        `${row.p1Unanswered} P1 interview question(s) still unanswered for the leading vendor.`,
      );
    }
    if (row && row.lowQualityCount >= 4) {
      warnings.push(
        "Multiple low-quality interview answers on the leading vendor — treat recommendation as provisional.",
      );
    }
    if (
      row &&
      row.p1Total > 0 &&
      (row.unresolvedP1 >= 4 || row.p1Unanswered >= 3)
    ) {
      blockers.push(
        "Structured interview phase is materially incomplete for the recommended vendor — unresolved P1 items block submission-safe vendor lock.",
      );
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
