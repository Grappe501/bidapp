import {
  listVendorFailureModes,
} from "../repositories/vendor-failure-mode.repo";

function categoryToFitDimensions(category: string): string[] {
  const c = category.toLowerCase();
  const out = new Set<string>();
  if (c === "delivery") out.add("delivery_operations");
  if (c === "integration" || c === "dependency") {
    out.add("integration_fit");
    out.add("delivery_operations");
  }
  if (c === "implementation" || c === "staffing" || c === "support") {
    out.add("delivery_operations");
    out.add("technical_capability");
  }
  if (c === "compliance" || c === "security" || c === "billing" || c === "data") {
    out.add("risk_posture");
    out.add("technical_capability");
  }
  if (c === "commercial") out.add("risk_posture");
  if (out.size === 0) out.add("technical_capability");
  return [...out];
}

/**
 * Small in-memory nudges from stored failure modes — does not persist to vendor_fit_dimensions.
 */
export async function computeFailureDimensionAdjustments(input: {
  projectId: string;
  vendorId: string;
}): Promise<Record<string, number>> {
  const rows = await listVendorFailureModes(input);
  if (rows.length === 0) return {};

  const deltaByDim: Record<string, number> = {};

  for (const r of rows) {
    const dims = categoryToFitDimensions(r.category);
    let stress = 0;
    if (r.likelihood === "high") stress += 0.12;
    else if (r.likelihood === "medium") stress += 0.06;
    if (r.impact === "critical") stress += 0.14;
    else if (r.impact === "high") stress += 0.1;
    else if (r.impact === "medium") stress += 0.05;
    if (r.vendorPreparedness === "weak" || r.vendorPreparedness === "unknown")
      stress += 0.08;
    if (r.recoverability === "hard" || r.recoverability === "uncertain")
      stress += 0.05;
    stress += (r.scoringSolutionImpact + r.scoringRiskImpact) / 120;
    stress = Math.min(0.35, Math.max(0, stress));
    const w = 1 / Math.max(1, dims.length);
    for (const dk of dims) {
      deltaByDim[dk] = (deltaByDim[dk] ?? 0) - stress * w;
    }
  }

  return deltaByDim;
}
