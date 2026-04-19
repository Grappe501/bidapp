import type { VendorPricingReality } from "../../types/pricing-model";

/**
 * Maps pricing reality scoring deltas to fit dimensions (in-memory; does not persist).
 */
export function computePricingRealityDimensionAdjustments(
  reality: VendorPricingReality,
): Record<string, number> {
  const { solutionImpact, riskImpact, interviewImpact } = reality.scoringImpact;
  const out: Record<string, number> = {};

  const stress =
    (Math.abs(riskImpact) + Math.abs(solutionImpact) * 0.6 + Math.abs(interviewImpact) * 0.4) /
    45;
  const sign = riskImpact + solutionImpact < 0 ? -1 : 1;
  const base = Math.min(0.22, stress) * sign;

  out.risk_posture = base * 1.1 + riskImpact / 90;
  out.integration_fit = base * 0.85 + solutionImpact / 100;
  out.technical_capability = base * 0.7 + solutionImpact / 110;
  out.delivery_operations = base * 0.65;
  out.references_proof = interviewImpact / 90;

  return out;
}
