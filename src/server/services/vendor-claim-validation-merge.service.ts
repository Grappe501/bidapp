import { claimKeyToFitDimensions } from "../lib/claim-validation-engine";
import type { ClaimCategory } from "../lib/claim-normalization";
import type { VendorClaimValidationSummary } from "../../types";
import {
  listVendorClaimValidations,
  type DbVendorClaimValidation,
} from "../repositories/vendor-claim-validation.repo";

export function buildClaimValidationSummaryFromRows(
  rows: DbVendorClaimValidation[],
): VendorClaimValidationSummary {
  let strongCount = 0;
  let weakOrNoneCount = 0;
  let contradictedCount = 0;
  let followUpRequiredCount = 0;
  let criticalWeakCount = 0;
  for (const v of rows) {
    const eff = effectiveSupportLevelFromRow(v);
    if (eff === "strong") strongCount++;
    if (eff === "weak" || eff === "none") weakOrNoneCount++;
    if (v.contradictionStatus !== "none") contradictedCount++;
    if (v.needsFollowUp) followUpRequiredCount++;
    if (v.isCritical && (eff === "weak" || eff === "none")) criticalWeakCount++;
  }
  return {
    strongCount,
    weakOrNoneCount,
    contradictedCount,
    followUpRequiredCount,
    criticalWeakCount,
  };
}

export function effectiveSupportLevelFromRow(row: DbVendorClaimValidation): string {
  const o = row.supportLevelOverride?.trim();
  if (o === "none" || o === "weak" || o === "moderate" || o === "strong") return o;
  return row.supportLevel;
}

/**
 * In-memory nudges for fit dimensions from stored claim validations — does not persist to vendor_fit_dimensions
 * (avoids double-counting when computeVendorScore runs repeatedly).
 */
export async function computeClaimValidationDimensionAdjustments(
  vendorId: string,
): Promise<Record<string, number>> {
  const vals = await listVendorClaimValidations(vendorId);
  if (vals.length === 0) return {};

  const deltaByDim: Record<string, number> = {};

  for (const v of vals) {
    const eff = effectiveSupportLevelFromRow(v);
    const cat = v.claimCategory as ClaimCategory;
    const dimsT = claimKeyToFitDimensions(v.normalizedClaimKey, cat);
    let delta = 0;
    if (eff === "strong" && v.contradictionStatus === "none") delta += 0.12;
    if (eff === "moderate") delta -= 0.05;
    if (eff === "weak") delta -= 0.28;
    if (eff === "none") delta -= 0.45;
    if (v.contradictionStatus === "possible") delta -= 0.2;
    if (v.contradictionStatus === "clear") delta -= 0.55;
    if (v.isCritical && (eff === "weak" || eff === "none")) delta -= 0.25;

    const w = 1 / Math.max(1, dimsT.length);
    for (const dk of dimsT) {
      deltaByDim[dk] = (deltaByDim[dk] ?? 0) + delta * w;
    }
  }

  return deltaByDim;
}
