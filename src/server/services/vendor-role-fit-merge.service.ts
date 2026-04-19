import { CRITICAL_ROLE_KEYS } from "../lib/vendor-role-taxonomy";
import { listVendorRoleFit } from "../repositories/vendor-role-fit.repo";
import type { DbVendorRoleFit } from "../repositories/vendor-role-fit.repo";

function roleKeyToFitDimensions(roleKey: string): string[] {
  const prefix = roleKey.split(".")[0] ?? "";
  if (prefix === "operations" || prefix === "logistics" || prefix === "support")
    return ["delivery_operations"];
  if (prefix === "integration") return ["integration_fit"];
  if (prefix === "implementation") return ["technical_capability", "delivery_operations"];
  if (prefix === "billing" || prefix === "compliance") return ["risk_posture", "technical_capability"];
  if (prefix === "clinical") return ["technical_capability", "risk_posture"];
  if (prefix === "analytics" || prefix === "strategy")
    return ["technical_capability", "references_proof"];
  return ["technical_capability"];
}

function rowStress(r: DbVendorRoleFit): number {
  let s = 0;
  if (r.maloneDependencyLevel === "high") s += 0.12;
  else if (r.maloneDependencyLevel === "medium") s += 0.06;
  if (r.gapRisk === "high") s += 0.1;
  else if (r.gapRisk === "medium") s += 0.05;
  if (r.handoffComplexity === "high") s += 0.06;
  if (r.overlapRisk === "high") s += 0.05;
  if (
    CRITICAL_ROLE_KEYS.has(r.roleKey) &&
    (r.ownershipRecommendation === "avoid" || r.ownershipRecommendation === "unknown")
  )
    s += 0.12;
  if (r.ownershipRecommendation === "own" && r.fitLevel === "strong" && r.maloneDependencyLevel === "low")
    s -= 0.08;
  return Math.min(0.4, Math.max(-0.15, s));
}

/**
 * In-memory nudges to fit dimensions — does not persist to vendor_fit_dimensions.
 */
export async function computeRoleDimensionAdjustments(input: {
  projectId: string;
  vendorId: string;
}): Promise<Record<string, number>> {
  const rows = await listVendorRoleFit(input);
  if (rows.length === 0) return {};

  const deltaByDim: Record<string, number> = {};

  for (const r of rows) {
    let stress = rowStress(r);
    if (
      r.ownershipRecommendation === "own" &&
      r.fitLevel === "strong" &&
      r.maloneDependencyLevel === "low"
    ) {
      stress = Math.max(-0.06, stress - 0.1);
    }
    const dims = roleKeyToFitDimensions(r.roleKey);
    const w = 1 / Math.max(1, dims.length);
    for (const dk of dims) {
      deltaByDim[dk] = (deltaByDim[dk] ?? 0) - stress * w;
    }
  }

  return deltaByDim;
}
