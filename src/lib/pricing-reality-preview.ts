/**
 * Client-safe workbook-only pricing signals (no vendor role/failure).
 * For submission package / dashboard — full `VendorPricingReality` is server-computed per vendor.
 */
import { CANONICAL_PRICING_S000000479 } from "../data/canonical-pricing-s000000479";
import { S000000479_BID_NUMBER } from "../data/canonical-rfp-s000000479";
import type { GroundingBundlePricing } from "../types/pricing-model";

export type WorkbookPricingPreview = {
  completeness: "complete" | "partial" | "incomplete";
  consistency: "consistent" | "minor_issues" | "inconsistent";
  pricingLevel: "low" | "market" | "high";
  keyRisks: string[];
};

const BENCH = CANONICAL_PRICING_S000000479.totals.contractTotal;

export function computeWorkbookPricingPreview(
  pricing: GroundingBundlePricing,
  bidNumber: string,
): WorkbookPricingPreview {
  const m = pricing.model;
  const ct = m.totals.contractTotal;
  const lineSum = m.items.reduce((s, i) => s + i.totalCost, 0);
  const ratio =
    bidNumber === S000000479_BID_NUMBER && ct > 0 ? ct / BENCH : 1;

  let pricingLevel: WorkbookPricingPreview["pricingLevel"] = "market";
  if (ratio < 0.72) pricingLevel = "low";
  else if (ratio > 1.35) pricingLevel = "high";

  let completeness: WorkbookPricingPreview["completeness"] = "complete";
  if (!pricing.ready || m.items.length === 0) completeness = "incomplete";
  else if (!pricing.rfpCoverage.every((r) => r.ok) || !pricing.contractCompliant)
    completeness = "partial";

  const pctDiff = ct > 0 && lineSum > 0 ? Math.abs(lineSum - ct) / ct : 0;
  let consistency: WorkbookPricingPreview["consistency"] = "consistent";
  if (pctDiff > 0.08) consistency = "inconsistent";
  else if (pctDiff > 0.02 || !pricing.categorized) consistency = "minor_issues";

  const keyRisks: string[] = [];
  if (!pricing.rfpCoverage.every((r) => r.ok))
    keyRisks.push("RFP service coverage gaps in workbook lines.");
  if (!pricing.contractCompliant) keyRisks.push("Line totals vs contract total need reconciliation.");
  if (pricingLevel === "low" && completeness === "complete")
    keyRisks.push("Contract total is materially below benchmark — validate exclusions and lifecycle scope.");
  if (m.items.length < 4 && ct > 0)
    keyRisks.push("Few line items — hidden costs may sit outside the workbook.");

  return { completeness, consistency, pricingLevel, keyRisks };
}
