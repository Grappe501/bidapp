import { CANONICAL_PRICING_S000000479 } from "../../data/canonical-pricing-s000000479";
import { S000000479_BID_NUMBER } from "../../data/canonical-rfp-s000000479";
import { RFP_REQUIRED_PRICING_SERVICES } from "../../lib/pricing-structure";
import type {
  GroundingBundlePricing,
  VendorPricingReality,
} from "../../types/pricing-model";
import type {
  VendorFailureSimulationSummary,
  VendorRoleFitSummary,
} from "../../types";
import { CRITICAL_ROLE_KEYS } from "./vendor-role-taxonomy";

export type RiskBand = "low" | "medium" | "high";

export type PricingRiskSignals = {
  underpricingRisk: RiskBand;
  hiddenCostRisk: RiskBand;
  maloneUnpricedDependency: RiskBand;
};

const BENCHMARK_CONTRACT = CANONICAL_PRICING_S000000479.totals.contractTotal;
const BENCHMARK_ANNUAL = CANONICAL_PRICING_S000000479.totals.annual;

function sumLineTotals(model: GroundingBundlePricing["model"]): number {
  return model.items.reduce((s, i) => s + (i.totalCost || 0), 0);
}

function categorySpend(
  model: GroundingBundlePricing["model"],
  cat: string,
): number {
  return model.items
    .filter((i) => i.category === cat)
    .reduce((s, i) => s + i.totalCost, 0);
}

/** Role keys → expect non-trivial pricing in these categories */
const ROLE_TO_CATEGORY: Partial<
  Record<string, Array<GroundingBundlePricing["model"]["items"][0]["category"]>>
> = {
  "operations.dispensing": ["dispensing"],
  "logistics.routine_delivery": ["delivery"],
  "logistics.urgent_two_hour_delivery": ["delivery"],
  "billing.medicaid_and_insurance_billing": ["compliance_admin"],
  "integration.matrixcare_interface": ["technology"],
  "integration.bidirectional_data_exchange": ["technology"],
  "implementation.project_management": ["clinical_services", "technology"],
  "compliance.hipaa_hitech_data_handling": ["compliance_admin", "technology"],
};

export function computePricingRiskSignals(input: {
  pricing: GroundingBundlePricing;
  roleFitSummary: VendorRoleFitSummary | null;
  bidNumber: string;
}): PricingRiskSignals {
  const full = evaluatePricingReality({
    vendorId: "",
    projectId: "",
    pricing: input.pricing,
    roleFitSummary: input.roleFitSummary,
    failureSummary: null,
    bidNumber: input.bidNumber,
  });
  return {
    underpricingRisk: full.underpricingRisk,
    hiddenCostRisk: full.hiddenCostRisk,
    maloneUnpricedDependency: full.maloneUnpricedDependency,
  };
}

export function evaluatePricingReality(input: {
  vendorId: string;
  projectId: string;
  pricing: GroundingBundlePricing;
  roleFitSummary: VendorRoleFitSummary | null;
  failureSummary: VendorFailureSimulationSummary | null | undefined;
  bidNumber: string;
}): VendorPricingReality {
  const { pricing, roleFitSummary, failureSummary, vendorId, projectId, bidNumber } =
    input;
  const m = pricing.model;
  const keyFindings: string[] = [];
  const riskDrivers: string[] = [];
  const missingPricingAreas: string[] = [];
  const likelyFutureCostZones: string[] = [];

  const lineSum = sumLineTotals(m);
  const ct = m.totals.contractTotal;
  const ann = m.totals.annual;
  const ratioVsBench =
    bidNumber === S000000479_BID_NUMBER && ct > 0
      ? ct / BENCHMARK_CONTRACT
      : ann > 0
        ? ann / BENCHMARK_ANNUAL
        : 1;

  let pricingLevel: VendorPricingReality["pricingLevel"] = "market";
  if (ratioVsBench < 0.72) pricingLevel = "low";
  else if (ratioVsBench > 1.35) pricingLevel = "high";

  let completeness: VendorPricingReality["completeness"] = "complete";
  if (!pricing.ready || m.items.length === 0) completeness = "incomplete";
  else if (!pricing.rfpCoverage.every((r) => r.ok) || !pricing.contractCompliant)
    completeness = "partial";

  const pctDiff =
    ct > 0 && lineSum > 0 ? Math.abs(lineSum - ct) / ct : 0;
  let consistency: VendorPricingReality["consistency"] = "consistent";
  if (pctDiff > 0.08) consistency = "inconsistent";
  else if (pctDiff > 0.02 || !pricing.categorized) consistency = "minor_issues";

  const techSpend = categorySpend(m, "technology");
  const delSpend = categorySpend(m, "delivery");
  const compSpend = categorySpend(m, "compliance_admin");

  if (techSpend < ct * 0.02 && ct > 0) {
    likelyFutureCostZones.push("pricing.integration_not_included");
    keyFindings.push("Technology/integration lines are a small share of contract total — middleware and interface work may sit outside the workbook.");
  }
  if (delSpend < ct * 0.01 && ct > 0) {
    likelyFutureCostZones.push("pricing.hidden_delivery_costs");
  }

  const rf = roleFitSummary;
  const strongOwn = rf?.strongOwnRoles.length ?? 0;
  const highDep = rf?.highestDependencyRoles.length ?? 0;
  const avoidRoles = rf?.avoidRoles ?? [];

  if (rf) {
    for (const roleKey of rf.strongOwnRoles) {
      const cats = ROLE_TO_CATEGORY[roleKey];
      if (!cats) continue;
      const covered = cats.some((c) => categorySpend(m, c) > 0);
      if (!covered) {
        missingPricingAreas.push(roleKey);
        likelyFutureCostZones.push("pricing.missing_service_lines");
      }
    }
    for (const key of CRITICAL_ROLE_KEYS) {
      if (avoidRoles.includes(key)) continue;
      const own = rf.strongOwnRoles.includes(key);
      const share = rf.shareRoles.includes(key);
      if (!own && !share) continue;
      const cats = ROLE_TO_CATEGORY[key];
      if (!cats) continue;
      const spend = cats.reduce((s, c) => s + categorySpend(m, c), 0);
      if (ct > 0 && spend < ct * 0.003) {
        missingPricingAreas.push(`${key} (weak line match)`);
      }
    }
  }

  for (const row of pricing.rfpCoverage) {
    if (!row.ok) {
      missingPricingAreas.push(`rfp:${row.key}`);
      likelyFutureCostZones.push("pricing.missing_service_lines");
    }
  }

  let maloneUnpricedDependency: RiskBand = "low";
  if (highDep >= 7 && techSpend + compSpend < ct * 0.06 && ct > 0) {
    maloneUnpricedDependency = "high";
    riskDrivers.push("pricing.malone_dependency_unpriced");
    keyFindings.push(
      "Role-fit shows many high Malone-dependency roles but compliance/technology pricing is thin — internal delivery may be under-reflected.",
    );
  } else if (highDep >= 4 && techSpend < ct * 0.04 && ct > 0) {
    maloneUnpricedDependency = "medium";
  }

  const failFragile =
    failureSummary &&
    (failureSummary.overallResilience === "fragile" ||
      failureSummary.overallResilience === "high_risk");

  let underpricingRisk: RiskBand = "low";
  if (pricingLevel === "low" && (strongOwn >= 3 || failFragile || highDep >= 6)) {
    underpricingRisk = "high";
    riskDrivers.push("pricing.discount_unsustainable");
    likelyFutureCostZones.push("pricing.change_order_likelihood");
  } else if (
    pricingLevel === "low" ||
    (failFragile && pricingLevel === "market")
  ) {
    underpricingRisk = "medium";
  }

  let overpricingRisk: RiskBand = "low";
  if (pricingLevel === "high" && strongOwn <= 1) overpricingRisk = "medium";
  if (pricingLevel === "high" && rf?.roleStrategyAssessment === "misaligned")
    overpricingRisk = "high";

  let hiddenCostRisk: RiskBand = "low";
  if (
    missingPricingAreas.length >= 3 ||
    likelyFutureCostZones.length >= 4 ||
    maloneUnpricedDependency === "high"
  ) {
    hiddenCostRisk = "high";
  } else if (missingPricingAreas.length >= 1 || !pricing.rfpCoverage.every((x) => x.ok)) {
    hiddenCostRisk = "medium";
  }

  let volatilityRisk: RiskBand = "low";
  if (m.items.length < 4 && ct > 0) volatilityRisk = "medium";
  if (m.items.length <= 2) volatilityRisk = "high";
  if (pricing.notes.some((n) => /variable|volume|census|pass[\s-]*through/i.test(n)))
    volatilityRisk =
      volatilityRisk === "low" ? "medium" : "high";

  if (volatilityRisk !== "low")
    likelyFutureCostZones.push("pricing.variable_volume_risk");

  let roleAlignment: VendorPricingReality["roleAlignment"] = "aligned";
  if (missingPricingAreas.length >= 3 || maloneUnpricedDependency === "high")
    roleAlignment = "misaligned";
  else if (missingPricingAreas.length >= 1 || consistency !== "consistent")
    roleAlignment = "partial";

  if (failureSummary?.criticalScenarioCount && failureSummary.criticalScenarioCount >= 3) {
    riskDrivers.push("pricing.staffing_underestimated");
  }

  let pricingConfidence: VendorPricingReality["pricingConfidence"] = "medium";
  if (completeness === "complete" && consistency === "consistent" && hiddenCostRisk === "low")
    pricingConfidence = "high";
  if (completeness === "incomplete" || consistency === "inconsistent")
    pricingConfidence = "low";

  let solutionImpact = 0;
  let riskImpact = 0;
  let interviewImpact = 0;
  if (hiddenCostRisk === "high") {
    riskImpact -= 2;
    solutionImpact -= 1;
    interviewImpact -= 1;
  } else if (hiddenCostRisk === "medium") {
    riskImpact -= 1;
  }
  if (underpricingRisk === "high") {
    riskImpact -= 2;
    interviewImpact -= 1;
  } else if (underpricingRisk === "medium") {
    riskImpact -= 1;
  }
  if (maloneUnpricedDependency === "high") {
    riskImpact -= 2;
    solutionImpact -= 1;
  } else if (maloneUnpricedDependency === "medium") {
    riskImpact -= 1;
  }
  if (completeness === "complete" && roleAlignment === "aligned" && underpricingRisk === "low") {
    solutionImpact += 1;
  }

  const rationale = [
    `Pricing reality (heuristic): completeness ${completeness}, consistency ${consistency}, level ${pricingLevel} vs benchmark (${bidNumber}).`,
    `Underpricing risk ${underpricingRisk}, hidden cost ${hiddenCostRisk}, Malone unpriced ${maloneUnpricedDependency}, volatility ${volatilityRisk}.`,
    "Does not replace finance review — structures bid defensibility vs scope.",
  ].join(" ");

  return {
    vendorId,
    projectId,
    completeness,
    consistency,
    pricingLevel,
    pricingConfidence,
    underpricingRisk,
    overpricingRisk,
    hiddenCostRisk,
    volatilityRisk,
    maloneUnpricedDependency,
    roleAlignment,
    keyFindings: keyFindings.slice(0, 10),
    riskDrivers: [...new Set(riskDrivers)].slice(0, 12),
    missingPricingAreas: [...new Set(missingPricingAreas)].slice(0, 14),
    likelyFutureCostZones: [...new Set(likelyFutureCostZones)].slice(0, 12),
    scoringImpact: { solutionImpact, riskImpact, interviewImpact },
    rationale,
  };
}

/** RFP coverage keys not met → human-readable */
export function listUnpricedRfpGaps(pricing: GroundingBundlePricing): string[] {
  return RFP_REQUIRED_PRICING_SERVICES.filter(({ test }) => !test(pricing.model.items)).map(
    (x) => x.key,
  );
}
