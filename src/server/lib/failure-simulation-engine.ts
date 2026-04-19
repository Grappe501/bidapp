import type { DbVendorClaimValidation } from "../repositories/vendor-claim-validation.repo";
import { effectiveSupportLevelFromRow } from "../services/vendor-claim-validation-merge.service";
import type {
  EvidenceStrengthBand,
  FailureScenarioDefinition,
  ImpactBand,
  LikelihoodBand,
  PreparednessBand,
  RecoverabilityBand,
} from "./failure-mode-taxonomy";
import { FAILURE_SCENARIO_TAXONOMY_V1 } from "./failure-mode-taxonomy";

export type FailureSimulationContext = {
  corpus: string;
  corpusLower: string;
  fitByKey: Record<string, { score: number; confidence: string }>;
  integrationRows: Array<{ requirementKey: string; status: string; evidence: string }>;
  claimValidations: DbVendorClaimValidation[];
  interviewUnresolvedP1: number;
  interviewAvgScore: number | null;
  interviewLowQuality: number;
  operationalFactCount: number;
  marketingClaimRatio: number;
  inArchitectureOption: boolean;
  /** 0–1 higher = Malone likely carrying integration/delivery burden */
  maloneDependencyScore: number;
  /** When present, reinforces integration/dependency scenarios from role-fit analysis */
  roleFitByRoleKey?: Record<
    string,
    { ownership: string; maloneDependency: string; fitLevel: string }
  >;
  /** From pricing-reality engine — reinforces commercial / dependency scenarios */
  pricingRisk?: {
    underpricingRisk: "low" | "medium" | "high";
    hiddenCostRisk: "low" | "medium" | "high";
    maloneUnpricedDependency: "low" | "medium" | "high";
  };
};

export type EvaluatedFailureMode = {
  scenarioKey: string;
  category: string;
  title: string;
  description: string;
  likelihood: LikelihoodBand;
  impact: ImpactBand;
  recoverability: RecoverabilityBand;
  timeToRecoverEstimate: string | null;
  vendorPreparedness: PreparednessBand;
  evidenceStrength: EvidenceStrengthBand;
  scoringSolutionImpact: number;
  scoringRiskImpact: number;
  scoringInterviewImpact: number;
  rationale: string;
  triggerConditions: string[];
  mitigationSignals: string[];
  unresolvedUnknowns: string[];
};

function unknownIntegrationCount(
  rows: FailureSimulationContext["integrationRows"],
): number {
  return rows.filter((r) => r.status === "unknown" || r.status === "gap").length;
}

function claimSupportForKeys(
  validations: DbVendorClaimValidation[],
  keys: string[] | undefined,
): "none" | "weak" | "moderate" | "strong" {
  if (!keys?.length) return "moderate";
  let best: "none" | "weak" | "moderate" | "strong" = "none";
  for (const k of keys) {
    const row = validations.find((v) => v.normalizedClaimKey === k);
    if (!row) continue;
    const eff = effectiveSupportLevelFromRow(row);
    if (eff === "strong") best = "strong";
    else if (eff === "moderate" && best !== "strong") best = "moderate";
    else if (eff === "weak" && best === "none") best = "weak";
    else if (eff === "none") {
      if (best === "none") best = "none";
    }
  }
  return best;
}

function inferEvidenceStrength(ctx: FailureSimulationContext): EvidenceStrengthBand {
  if (ctx.operationalFactCount >= 8) return "strong";
  if (ctx.operationalFactCount >= 3) return "moderate";
  if (ctx.operationalFactCount >= 1) return "weak";
  return "none";
}

function bumpLikelihood(
  L: LikelihoodBand,
  delta: number,
): LikelihoodBand {
  const order: LikelihoodBand[] = ["low", "medium", "high"];
  let i = order.indexOf(L) + delta;
  i = Math.max(0, Math.min(2, i));
  return order[i]!;
}

function escalateImpact(i: ImpactBand, stressed: boolean): ImpactBand {
  if (!stressed) return i;
  if (i === "low") return "medium";
  if (i === "medium") return "high";
  if (i === "high") return "critical";
  return "critical";
}

export function evaluateFailureScenario(
  def: FailureScenarioDefinition,
  ctx: FailureSimulationContext,
): EvaluatedFailureMode {
  const triggers: string[] = [];
  const mitigations: string[] = [];
  const unknowns: string[] = [];

  let likelihood: LikelihoodBand = "medium";
  let preparedness: PreparednessBand = "adequate";
  const ev = inferEvidenceStrength(ctx);

  if (ev === "none") {
    unknowns.push("Sparse operational facts — scenario stress is under-specified.");
    likelihood = bumpLikelihood(likelihood, 1);
    preparedness = "unknown";
  } else if (ev === "weak") {
    unknowns.push("Limited operational evidence — treat likelihood bands as uncertain.");
    preparedness = "weak";
  }

  const unkInt = unknownIntegrationCount(ctx.integrationRows);
  if (def.category === "integration" || def.stressFamily === "integration") {
    if (unkInt >= 2) {
      likelihood = bumpLikelihood(likelihood, 1);
      triggers.push(`${unkInt} integration requirement row(s) unknown or gap.`);
    }
  }

  const rel = claimSupportForKeys(ctx.claimValidations, def.relatedClaimKeys);
  if (rel === "none" || rel === "weak") {
    likelihood = bumpLikelihood(likelihood, 1);
    triggers.push(
      `Related claim evidence is ${rel} for keys ${def.relatedClaimKeys?.join(", ") ?? "(n/a)"}.`,
    );
    if (preparedness === "adequate") preparedness = "weak";
  } else if (rel === "strong") {
    likelihood = bumpLikelihood(likelihood, -1);
    mitigations.push("Claim validation shows stronger support on related topics.");
    if (preparedness === "weak") preparedness = "adequate";
  }

  if (corpusHas(ctx.corpusLower, def.mitigationHints)) {
    likelihood = bumpLikelihood(likelihood, -1);
    mitigations.push("Corpus mentions mitigation-style capabilities (heuristic match).");
    if (preparedness === "unknown") preparedness = "adequate";
    else if (preparedness === "weak") preparedness = "adequate";
  }
  if (corpusHas(ctx.corpusLower, def.stressHints)) {
    likelihood = bumpLikelihood(likelihood, 1);
    triggers.push("Stress-pattern language present in corpus (heuristic).");
  }

  if (ctx.interviewUnresolvedP1 >= 2) {
    likelihood = bumpLikelihood(likelihood, 1);
    triggers.push("Unresolved P1 interview items — execution risk elevated.");
  }
  if (ctx.interviewAvgScore != null && ctx.interviewAvgScore < 3) {
    likelihood = bumpLikelihood(likelihood, 1);
    triggers.push("Low average interview answer quality — treat preparedness cautiously.");
    if (preparedness === "adequate") preparedness = "weak";
  }
  if (ctx.interviewLowQuality >= 4) {
    likelihood = bumpLikelihood(likelihood, 1);
  }

  if (def.key.startsWith("dependency.") && ctx.maloneDependencyScore >= 0.45) {
    likelihood = bumpLikelihood(likelihood, 1);
    triggers.push(
      "Architecture / evidence pattern suggests Malone or client-side burden may be elevated.",
    );
  }

  if (ctx.marketingClaimRatio > 0.55) {
    triggers.push("High share of marketing-class claims — do not treat as operational proof.");
    if (preparedness === "adequate") preparedness = "weak";
  }

  const rfMap = ctx.roleFitByRoleKey;
  if (rfMap) {
    if (
      def.key === "integration.matrixcare_interface_delay" &&
      rfMap["integration.matrixcare_interface"] &&
      (rfMap["integration.matrixcare_interface"].ownership === "avoid" ||
        rfMap["integration.matrixcare_interface"].ownership === "unknown")
    ) {
      likelihood = bumpLikelihood(likelihood, 1);
      triggers.push(
        "Role-fit flags MatrixCare interface as avoid/unknown — integration delay stress path elevated.",
      );
    }
    if (
      (def.key === "integration.bidirectional_sync_failure" ||
        def.key === "integration.batch_vs_real_time_mismatch") &&
      rfMap["integration.bidirectional_data_exchange"] &&
      (rfMap["integration.bidirectional_data_exchange"].ownership === "avoid" ||
        rfMap["integration.bidirectional_data_exchange"].maloneDependency === "high")
    ) {
      likelihood = bumpLikelihood(likelihood, 1);
      triggers.push("Role-fit shows weak ownership or high Malone dependency on bidirectional exchange.");
    }
    if (
      def.key.startsWith("dependency.") &&
      Object.values(rfMap).filter((x) => x.maloneDependency === "high").length >= 5
    ) {
      likelihood = bumpLikelihood(likelihood, 1);
      triggers.push(
        "Multiple roles show high Malone dependency in role-fit — dependency/ownership failure paths align.",
      );
    }
  }

  const pr = ctx.pricingRisk;
  if (pr) {
    if (
      def.key === "commercial.low_price_hidden_cost_expansion" &&
      (pr.underpricingRisk === "high" || pr.hiddenCostRisk === "high")
    ) {
      likelihood = bumpLikelihood(likelihood, 1);
      triggers.push(
        "Pricing reality flags underpricing or hidden-cost exposure — commercial / change-order stress elevated.",
      );
    }
    if (
      (def.key === "dependency.malone_carrying_unplanned_load" ||
        def.key === "dependency.vendor_requires_custom_middleware") &&
      pr.maloneUnpricedDependency === "high"
    ) {
      likelihood = bumpLikelihood(likelihood, 1);
      triggers.push(
        "Pricing workbook may not reflect Malone-led integration or program work implied by role-fit.",
      );
    }
  }

  let impact: ImpactBand = def.baseImpact;
  const stressed =
    likelihood === "high" &&
    (preparedness === "weak" || preparedness === "unknown");
  impact = escalateImpact(impact, stressed);

  let recoverability: RecoverabilityBand = "moderate";
  if (mitigations.length >= 2 && likelihood !== "high") recoverability = "easy";
  else if (
    likelihood === "high" &&
    (preparedness === "adequate" ||
      preparedness === "weak" ||
      preparedness === "unknown")
  )
    recoverability = "hard";
  if (ev === "none") recoverability = "uncertain";

  let timeEst: string | null = null;
  if (recoverability === "easy") timeEst = "Hours–days with documented runbooks";
  else if (recoverability === "moderate") timeEst = "Days–few weeks — verify owners";
  else if (recoverability === "hard") timeEst = "Weeks+ — depends on remediation funding";
  else timeEst = "Unknown — evidence too thin to estimate";

  const sol =
    impact === "critical"
      ? -2
      : impact === "high"
        ? -1
        : likelihood === "high"
          ? -1
          : 0;
  const risk =
    impact === "critical" || impact === "high"
      ? -2
      : likelihood === "high"
        ? -1
        : 0;
  const iv =
    likelihood === "high" && ctx.interviewUnresolvedP1 > 0
      ? -1
      : likelihood === "high"
        ? -1
        : 0;

  const rationale = [
    `Scenario ${def.key}: evaluated heuristically from fit, integration rows, claim validation, interview signals, and corpus keywords.`,
    `Likelihood ${likelihood}, impact ${impact}, preparedness ${preparedness}, evidence ${ev}.`,
    "This is not a forecast — it structures operational stress for bid review.",
  ].join(" ");

  return {
    scenarioKey: def.key,
    category: def.category,
    title: def.title,
    description: def.description,
    likelihood,
    impact,
    recoverability,
    timeToRecoverEstimate: timeEst,
    vendorPreparedness: preparedness,
    evidenceStrength: ev,
    scoringSolutionImpact: sol,
    scoringRiskImpact: risk,
    scoringInterviewImpact: iv,
    rationale,
    triggerConditions: triggers.slice(0, 8),
    mitigationSignals: mitigations.slice(0, 8),
    unresolvedUnknowns: unknowns.slice(0, 6),
  };
}

function corpusHas(corpus: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(corpus));
}

export function evaluateAllFailureScenarios(
  ctx: FailureSimulationContext,
): EvaluatedFailureMode[] {
  return FAILURE_SCENARIO_TAXONOMY_V1.map((def) => evaluateFailureScenario(def, ctx));
}

export function computeMaloneDependencyScore(input: {
  corpusLower: string;
  unknownIntegrationCount: number;
  matrixcareSupport: "none" | "weak" | "moderate" | "strong";
}): number {
  let s = 0;
  if (/malone|client[\s-]side|internal\s+build/i.test(input.corpusLower)) s += 0.25;
  if (/middleware|custom\s+gateway|bridge/i.test(input.corpusLower)) s += 0.35;
  if (input.unknownIntegrationCount >= 2) s += 0.25;
  if (input.matrixcareSupport === "none" || input.matrixcareSupport === "weak")
    s += 0.25;
  return Math.min(1, s);
}
