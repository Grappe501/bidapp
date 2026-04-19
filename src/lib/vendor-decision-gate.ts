import type {
  CompetitorAwareSimulationResult,
  CompetitorRecommendationConfidence,
  ProjectInterviewReadiness,
  VendorDecisionSynthesis,
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
  synthesis?: VendorDecisionSynthesis | null,
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

  const cv = lead.claimValidationSummary;
  const failRes = lead.failureResilienceSummary;
  const roleFit = lead.roleFitSummary;
  const pricingReality = lead.pricingReality;

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

  if (cv && cv.criticalWeakCount >= 2) {
    blockers.push(
      "Multiple critical vendor claims show weak or no evidence in claim validation — do not treat proposal language as submission-safe until substantiated.",
    );
  } else if (cv && cv.criticalWeakCount === 1) {
    warnings.push(
      "At least one critical normalized claim is weakly supported — tighten proof before locking vendor assertions.",
    );
  }
  if (cv && cv.contradictedCount >= 2) {
    warnings.push(
      "Multiple claim topics show contradiction signals between sources — reconcile before final readiness.",
    );
  }

  if (
    failRes &&
    failRes.overallResilience === "high_risk" &&
    failRes.criticalScenarioCount >= 4
  ) {
    blockers.push(
      "Failure mode simulation shows high operational risk with multiple critical scenarios — strengthen resilience posture before submission-safe vendor lock.",
    );
  } else if (failRes && failRes.overallResilience === "high_risk") {
    warnings.push(
      "Failure mode simulation shows high-risk resilience posture — document mitigations and Malone dependency boundaries in Risk.",
    );
  } else if (failRes && failRes.overallResilience === "fragile") {
    warnings.push(
      "Failure mode simulation shows fragile resilience — treat Solution/Risk language as provisional until recovery and ownership gaps close.",
    );
  }

  if (roleFit?.roleStrategyAssessment === "misaligned") {
    blockers.push(
      "Vendor role-fit analysis is misaligned — critical operating roles are avoid/unknown; operating model is not submission-safe until RACI is clarified.",
    );
  } else if (roleFit?.roleStrategyAssessment === "fragile") {
    warnings.push(
      "Vendor role-fit shows fragile division of labor — excessive Malone dependency or handoff risk across multiple roles; strengthen Solution/Risk ownership narrative.",
    );
  }

  if (
    pricingReality?.completeness === "incomplete" ||
    (pricingReality?.roleAlignment === "misaligned" &&
      pricingReality.hiddenCostRisk === "high")
  ) {
    blockers.push(
      "Pricing reality check: workbook incomplete or misaligned with scope/Malone workload — cost narrative is not submission-safe until reconciled.",
    );
  } else if (
    pricingReality &&
    (pricingReality.maloneUnpricedDependency === "high" ||
      pricingReality.hiddenCostRisk === "high")
  ) {
    warnings.push(
      "Pricing reality: high hidden-cost or unpriced Malone dependency — qualify cost leadership claims and document exclusions.",
    );
  } else if (pricingReality?.underpricingRisk === "high") {
    warnings.push(
      "Pricing reality flags underpricing vs scope — change-order and lifecycle cost risk may surface in evaluation or performance.",
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

  if (synthesis) {
    if (
      synthesis.mitigationPosture === "weak" &&
      (synthesis.confidence === "provisional" || synthesis.confidence === "low") &&
      synthesis.criticalRisks.length >= 3
    ) {
      blockers.push(
        "Decision synthesis: weak mitigation posture with low/provisional confidence and multiple critical risks — vendor lock is not submission-safe until mitigations and proof improve.",
      );
    } else if (synthesis.mitigationPosture === "weak") {
      warnings.push(
        "Decision synthesis flags weak mitigation posture — strengthen recovery, RACI, and commercial assumptions before executive sign-off.",
      );
    }
    if (synthesis.confidence === "low" && synthesis.recommendationType !== "undetermined") {
      warnings.push(
        "Full decision synthesis confidence is low — treat vendor narrative and stack claims as negotiable.",
      );
    }
    if (
      synthesis.confidence === "provisional" &&
      synthesis.interviewReadiness === "weak" &&
      synthesis.criticalRisks.length >= 2
    ) {
      warnings.push(
        "Provisional recommendation with weak interview readiness — align P1 answers before locking Solution/Risk language.",
      );
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
