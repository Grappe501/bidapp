import type {
  CompetitorAwareSimulationResult,
  CompetitorComparisonEntry,
  CompetitorRecommendationConfidence,
  VendorDecisionSynthesis,
} from "@/types";

function uniqStrings(lines: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of lines) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= cap) break;
  }
  return out;
}

function pickLead(sim: CompetitorAwareSimulationResult): CompetitorComparisonEntry | undefined {
  const byRec = sim.recommendedVendorId
    ? sim.entries.find((e) => e.vendorId === sim.recommendedVendorId)
    : undefined;
  if (byRec) return byRec;
  const sorted = [...sim.entries].sort((a, b) => b.overallScore - a.overallScore);
  return sorted[0];
}

function scoreGap(sim: CompetitorAwareSimulationResult): number {
  const sorted = [...sim.entries].sort((a, b) => b.overallScore - a.overallScore);
  const a = sorted[0];
  const b = sorted[1];
  if (!a || !b) return 100;
  return a.overallScore - b.overallScore;
}

function recommendationType(
  sim: CompetitorAwareSimulationResult,
  stackIds: string[] | undefined,
): VendorDecisionSynthesis["recommendationType"] {
  if (sim.entries.length === 0) return "undetermined";
  const stack = [...new Set((stackIds ?? []).filter(Boolean))];
  if (stack.length > 1) return "multi_vendor_stack";
  const gap = scoreGap(sim);
  if (gap < 6 || sim.recommendationConfidence === "provisional") return "provisional";
  return "single_vendor";
}

function refineConfidence(
  sim: CompetitorAwareSimulationResult,
  lead: CompetitorComparisonEntry | undefined,
): VendorDecisionSynthesis["confidence"] {
  if (!lead) return "provisional";
  let c: CompetitorRecommendationConfidence = sim.recommendationConfidence;

  const rf = lead.roleFitSummary;
  const pr = lead.pricingReality;
  const fr = lead.failureResilienceSummary;
  const cv = lead.claimValidationSummary;

  if (rf?.roleStrategyAssessment === "misaligned") c = "provisional";
  else if (rf?.roleStrategyAssessment === "fragile" && c === "high") c = "medium";

  if (fr?.overallResilience === "high_risk") {
    if (c === "high") c = "medium";
    else if (c === "medium") c = "low";
  } else if (fr?.overallResilience === "fragile" && c === "high") {
    c = "medium";
  }

  if (cv) {
    if (cv.criticalWeakCount >= 2) c = c === "high" ? "medium" : c === "medium" ? "low" : c;
    if (cv.contradictedCount >= 3 && c === "high") c = "medium";
  }

  if (pr) {
    if (
      pr.hiddenCostRisk === "high" &&
      pr.maloneUnpricedDependency === "high" &&
      c === "high"
    )
      c = "medium";
    if (pr.completeness === "incomplete" && (c === "high" || c === "medium")) c = "low";
  }

  const ir = sim.projectInterviewReadiness?.vendors?.find((v) => v.vendorId === lead.vendorId);
  if (ir && ir.p1Total > 0) {
    if (ir.unresolvedP1 >= 4) {
      if (c === "high") c = "medium";
      else if (c === "medium") c = "provisional";
    } else if (ir.unresolvedP1 >= 2 && c === "high") c = "medium";
  }

  if (scoreGap(sim) < 4 && c === "high") c = "medium";

  return c;
}

function mapRoleFit(rf: CompetitorComparisonEntry["roleFitSummary"]): VendorDecisionSynthesis["roleFitAssessment"] {
  if (!rf) return "acceptable";
  switch (rf.roleStrategyAssessment) {
    case "clear_fit":
      return "clear";
    case "usable_with_malone_support":
      return "acceptable";
    case "fragile":
      return "fragile";
    case "misaligned":
      return "misaligned";
    default:
      return "acceptable";
  }
}

function mapFailure(fr: CompetitorComparisonEntry["failureResilienceSummary"]): VendorDecisionSynthesis["failureResilience"] {
  if (!fr) return "moderate";
  if (fr.overallResilience === "acceptable") return "moderate";
  return fr.overallResilience;
}

function mapPricingAssessment(
  pr: CompetitorComparisonEntry["pricingReality"],
): VendorDecisionSynthesis["pricingAssessment"] {
  if (!pr) return "uncertain";
  if (
    pr.completeness === "incomplete" ||
    pr.hiddenCostRisk === "high" ||
    pr.underpricingRisk === "high" ||
    pr.maloneUnpricedDependency === "high"
  )
    return "risky";
  if (
    pr.completeness === "partial" ||
    pr.pricingConfidence === "low" ||
    pr.consistency === "inconsistent"
  )
    return "uncertain";
  if (
    pr.hiddenCostRisk === "low" &&
    pr.underpricingRisk === "low" &&
    pr.volatilityRisk !== "high"
  )
    return pr.pricingLevel === "low" || pr.pricingLevel === "market" ? "competitive" : "stable";
  return "competitive";
}

function mapClaimConfidence(
  cv: CompetitorComparisonEntry["claimValidationSummary"],
): VendorDecisionSynthesis["claimConfidence"] {
  if (!cv) return "mixed";
  if (cv.criticalWeakCount >= 2 || cv.contradictedCount >= 3) return "low";
  if (cv.contradictedCount >= 1 || cv.weakOrNoneCount >= 3) return "mixed";
  if (cv.strongCount >= 2 && cv.criticalWeakCount === 0) return "high";
  return "mixed";
}

function mapMalone(
  rf: CompetitorComparisonEntry["roleFitSummary"],
  pr: CompetitorComparisonEntry["pricingReality"],
): VendorDecisionSynthesis["maloneDependency"] {
  let level: VendorDecisionSynthesis["maloneDependency"] = "low";
  const depRoles = rf?.highestDependencyRoles?.length ?? 0;
  if (depRoles >= 6) level = "high";
  else if (depRoles >= 3) level = "medium";

  if (pr?.maloneUnpricedDependency === "high") level = "high";
  else if (pr?.maloneUnpricedDependency === "medium" && level === "low") level = "medium";

  return level;
}

function mapInterviewReadiness(
  sim: CompetitorAwareSimulationResult,
  lead: CompetitorComparisonEntry | undefined,
): VendorDecisionSynthesis["interviewReadiness"] {
  if (!lead) return "weak";
  const row = sim.projectInterviewReadiness?.vendors?.find((v) => v.vendorId === lead.vendorId);
  if (!row || row.p1Total === 0) return "partial";
  if (row.unresolvedP1 === 0 && row.p1Unanswered === 0) return "complete";
  if (row.unresolvedP1 >= 3 || row.p1Unanswered >= 2 || row.lowQualityCount >= 4) return "weak";
  return "partial";
}

function mapMitigation(
  lead: CompetitorComparisonEntry,
): VendorDecisionSynthesis["mitigationPosture"] {
  const fr = lead.failureResilienceSummary;
  const rf = lead.roleFitSummary;
  const pr = lead.pricingReality;

  if (!fr) return "uncertain";

  if (rf?.roleStrategyAssessment === "misaligned") return "weak";
  if (fr.overallResilience === "high_risk") return "weak";
  if (
    pr?.hiddenCostRisk === "high" &&
    pr.maloneUnpricedDependency === "high" &&
    fr.overallResilience !== "strong"
  )
    return "weak";

  if (fr.overallResilience === "strong" && (fr.topMitigations?.length ?? 0) >= 2)
    return "strong";
  if (fr.overallResilience === "strong" || fr.overallResilience === "acceptable")
    return "adequate";
  if (fr.overallResilience === "fragile") return "adequate";
  return "uncertain";
}

function buildCriticalRisks(
  sim: CompetitorAwareSimulationResult,
  lead: CompetitorComparisonEntry,
  second: CompetitorComparisonEntry | undefined,
): string[] {
  const out: string[] = [];
  out.push(...(sim.decisionRisks ?? []));
  out.push(...lead.criticalGaps.slice(0, 4));
  const fr = lead.failureResilienceSummary;
  if (fr) {
    for (const w of fr.decisionWarnings.slice(0, 3)) out.push(w);
    for (const m of fr.topFailureModes.slice(0, 2)) {
      out.push(`${m.title} (${m.likelihood} likelihood, ${m.impact} impact)`);
    }
  }
  if (second && scoreGap(sim) < 8) {
    out.push(
      `Near-tie with ${second.vendorName} — evidence or pricing shifts could change the lead.`,
    );
  }
  return uniqStrings(out, 12);
}

function buildWhatWouldChange(
  sim: CompetitorAwareSimulationResult,
  lead: CompetitorComparisonEntry,
  second: CompetitorComparisonEntry | undefined,
): string[] {
  const lines: string[] = [];
  const cv = lead.claimValidationSummary;
  if (cv && cv.criticalWeakCount > 0) {
    lines.push(
      `Substantiate ${cv.criticalWeakCount} critical claim topic(s) with artifacts or references — weak proof is the fastest path to downgrade.`,
    );
  }
  if (cv && cv.contradictedCount > 0) {
    lines.push(
      "Reconcile contradiction signals across sources before locking vendor assertions in Solution.",
    );
  }
  const ir = sim.projectInterviewReadiness?.vendors?.find((v) => v.vendorId === lead.vendorId);
  if (ir && ir.unresolvedP1 > 0) {
    lines.push(
      `Close ${ir.unresolvedP1} unresolved P1 interview item(s) for ${lead.vendorName} — answers change risk and cost posture.`,
    );
  }
  if (second) {
    lines.push(
      `If ${second.vendorName} produces stronger integration proof or stable lifecycle pricing, revisit the composite — current gap ≈ ${scoreGap(sim)} points.`,
    );
  }
  const pr = lead.pricingReality;
  if (pr && pr.missingPricingAreas.length > 0) {
    lines.push(
      `Align workbook to priced scope: ${pr.missingPricingAreas.slice(0, 2).join("; ")}.`,
    );
  }
  if (lead.integrationBurdens.length) {
    lines.push(
      "Document MatrixCare / EHR touchpoints and escalation paths — integration evidence moves Solution and Risk scores.",
    );
  }
  lines.push(
    "Any material change to Malone RACI, DHS oversight assumptions, or architecture stack membership should trigger a full re-run of comparison and grounding.",
  );
  return uniqStrings(lines, 10);
}

function buildEvaluatorDefense(
  sim: CompetitorAwareSimulationResult,
  lead: CompetitorComparisonEntry,
  second: CompetitorComparisonEntry | undefined,
  conf: VendorDecisionSynthesis["confidence"],
  mitigation: VendorDecisionSynthesis["mitigationPosture"],
): string {
  const parts: string[] = [];
  parts.push(
    `${lead.vendorName} is the evidence-weighted lead for this solicitation (composite ${lead.overallScore}/100; synthesis confidence ${conf}).`,
  );
  parts.push(
    `Selection rests on structured fit, claim support, failure resilience (${lead.failureResilienceSummary?.overallResilience ?? "unknown"}), role ownership (${lead.roleFitSummary?.roleStrategyAssessment?.replace(/_/g, " ") ?? "not assessed"}), and pricing realism — not headline price alone.`,
  );
  if (second) {
    parts.push(
      `${second.vendorName} remains a credible alternative${scoreGap(sim) < 8 ? " in a tight band" : ""}; document why the lead better satisfies mandatory requirements and operational risk tolerance.`,
    );
  } else {
    parts.push(
      "Where alternatives are sparse, emphasize proof depth and Malone orchestration boundaries over comparative rhetoric.",
    );
  }
  parts.push(
    mitigation === "weak"
      ? "Mitigation posture is weak — treat the recommendation as negotiable until recovery, staffing, and commercial assumptions are pinned down."
      : "Risks are explicit and traceable to intelligence rows; manage residual gaps in Interview and Risk volumes.",
  );
  return parts.join(" ");
}

function buildRationale(
  sim: CompetitorAwareSimulationResult,
  lead: CompetitorComparisonEntry,
  second: CompetitorComparisonEntry | undefined,
  conf: VendorDecisionSynthesis["confidence"],
  recType: VendorDecisionSynthesis["recommendationType"],
): string {
  const bits: string[] = [];
  bits.push(
    `${lead.vendorName} leads on the composite bid competitiveness score with ${lead.confidence} evidence confidence.`,
  );
  if (recType === "multi_vendor_stack") {
    bits.push(
      "Architecture uses multiple vendors — evaluate handoffs, Malone governance, and combined pricing exposure, not only the lead vendor row.",
    );
  }
  if (second && scoreGap(sim) < 6) {
    bits.push(
      `${second.vendorName} is within a tight score band — the decision should be provisional until interview and proof gaps close.`,
    );
  }
  if (lead.claimValidationSummary && lead.claimValidationSummary.criticalWeakCount > 0) {
    bits.push(
      `Claim validation flags ${lead.claimValidationSummary.criticalWeakCount} critical weak topic(s) — do not overstate certainty in drafting.`,
    );
  }
  if (lead.pricingReality) {
    const pr = lead.pricingReality;
    bits.push(
      `Pricing reality: ${pr.completeness} completeness, ${pr.roleAlignment} role alignment; hidden-cost risk ${pr.hiddenCostRisk}, Malone unpriced ${pr.maloneUnpricedDependency}.`,
    );
  }
  bits.push(`Synthesis confidence: ${conf} — ${sim.honestyNote}`);
  return bits.join(" ");
}

/**
 * Builds a unified vendor decision from an existing competitor-aware simulation (all per-vendor layers attached).
 */
export function buildVendorDecisionSynthesis(input: {
  sim: CompetitorAwareSimulationResult;
  recommendedVendorStackIds?: string[];
  architectureOptionName?: string;
}): VendorDecisionSynthesis {
  const { sim } = input;
  const now = new Date().toISOString();
  const stackIds = input.recommendedVendorStackIds?.length
    ? [...new Set(input.recommendedVendorStackIds.filter(Boolean))]
    : undefined;

  if (sim.entries.length === 0) {
    return {
      projectId: sim.projectId,
      recommendationType: "undetermined",
      confidence: "provisional",
      keyStrengths: [],
      keyWeaknesses: ["No vendor comparison entries — add vendors and re-run analysis."],
      criticalRisks: ["Cannot defend a vendor choice without comparable rows."],
      mitigationPosture: "uncertain",
      pricingAssessment: "uncertain",
      roleFitAssessment: "acceptable",
      failureResilience: "moderate",
      maloneDependency: "medium",
      claimConfidence: "low",
      interviewReadiness: "weak",
      decisionRationale: sim.recommendedRationale[0] ?? "Undetermined — no entries.",
      whatWouldChangeDecision: [
        "Populate vendor intelligence, run claim validation, and re-run competitor comparison.",
      ],
      decisionWarnings: [sim.honestyNote],
      evaluatorDefenseSummary:
        "No comparative synthesis is possible until at least one vendor entry exists for this solicitation.",
      createdAt: now,
      updatedAt: now,
    };
  }

  const lead = pickLead(sim)!;
  const sorted = [...sim.entries].sort((a, b) => b.overallScore - a.overallScore);
  const second = sorted[1];
  const conf = refineConfidence(sim, lead);
  const recType = recommendationType(sim, stackIds);

  const strengths = uniqStrings(
    [
      ...sim.recommendedRationale.slice(0, 2),
      ...lead.topAdvantages.slice(0, 4),
      ...(input.architectureOptionName
        ? [`Architecture context: ${input.architectureOptionName}`]
        : []),
    ],
    8,
  );

  const weaknesses = uniqStrings(
    [...lead.topDisadvantages, ...lead.criticalGaps.slice(0, 2)],
    8,
  );

  const warnings = uniqStrings(
    [
      ...(conf === "provisional" || conf === "low"
        ? ["Cross-layer confidence is not high — avoid definitive executive language."]
        : []),
      ...(lead.roleFitSummary?.roleStrategyAssessment === "fragile"
        ? ["Role ownership is fragile — handoff and Malone dependency need explicit RACI."]
        : []),
      ...sim.decisionRisks.slice(0, 4),
    ],
    10,
  );

  const mitigation = mapMitigation(lead);

  return {
    projectId: sim.projectId,
    recommendedVendorId: sim.recommendedVendorId ?? lead.vendorId,
    recommendedVendorStackIds: stackIds && stackIds.length > 1 ? stackIds : undefined,
    recommendationType: recType,
    confidence: conf,
    overallScore: lead.overallScore,
    keyStrengths: strengths,
    keyWeaknesses: weaknesses,
    criticalRisks: buildCriticalRisks(sim, lead, second),
    mitigationPosture: mitigation,
    pricingAssessment: mapPricingAssessment(lead.pricingReality),
    roleFitAssessment: mapRoleFit(lead.roleFitSummary),
    failureResilience: mapFailure(lead.failureResilienceSummary),
    maloneDependency: mapMalone(lead.roleFitSummary, lead.pricingReality),
    claimConfidence: mapClaimConfidence(lead.claimValidationSummary),
    interviewReadiness: mapInterviewReadiness(sim, lead),
    decisionRationale: buildRationale(sim, lead, second, conf, recType),
    whatWouldChangeDecision: buildWhatWouldChange(sim, lead, second),
    decisionWarnings: warnings,
    evaluatorDefenseSummary: buildEvaluatorDefense(sim, lead, second, conf, mitigation),
    createdAt: now,
    updatedAt: now,
  };
}

export function formatVendorDecisionSynthesisExport(s: VendorDecisionSynthesis): string {
  const lines: string[] = [];
  lines.push(`# Vendor decision synthesis`);
  lines.push("");
  lines.push(`- Recommendation type: **${s.recommendationType.replace(/_/g, " ")}**`);
  if (s.recommendedVendorId) lines.push(`- Recommended vendor id: \`${s.recommendedVendorId}\``);
  if (s.recommendedVendorStackIds?.length) {
    lines.push(`- Vendor stack: ${s.recommendedVendorStackIds.map((id) => `\`${id}\``).join(", ")}`);
  }
  lines.push(`- Confidence: **${s.confidence}**`);
  if (s.overallScore != null) lines.push(`- Lead composite score: ${s.overallScore}`);
  lines.push(`- Pricing posture: ${s.pricingAssessment}`);
  lines.push(`- Role fit: ${s.roleFitAssessment}`);
  lines.push(`- Failure resilience: ${s.failureResilience}`);
  lines.push(`- Malone dependency: ${s.maloneDependency}`);
  lines.push(`- Claim confidence: ${s.claimConfidence}`);
  lines.push(`- Interview readiness: ${s.interviewReadiness}`);
  lines.push(`- Mitigation posture: ${s.mitigationPosture}`);
  lines.push("");
  lines.push("## Rationale");
  lines.push(s.decisionRationale);
  lines.push("");
  lines.push("## Strengths");
  for (const x of s.keyStrengths) lines.push(`- ${x}`);
  lines.push("");
  lines.push("## Weaknesses");
  for (const x of s.keyWeaknesses) lines.push(`- ${x}`);
  lines.push("");
  lines.push("## Critical risks");
  for (const x of s.criticalRisks) lines.push(`- ${x}`);
  lines.push("");
  lines.push("## What would change the decision");
  for (const x of s.whatWouldChangeDecision) lines.push(`- ${x}`);
  lines.push("");
  lines.push("## Evaluator defense");
  lines.push(s.evaluatorDefenseSummary);
  lines.push("");
  if (s.decisionWarnings.length) {
    lines.push("## Warnings");
    for (const x of s.decisionWarnings) lines.push(`- ${x}`);
  }
  return lines.join("\n");
}
