import { VENDOR_SCORING_MODEL } from "../../data/vendor-intelligence-system";
import {
  listVendorFitDimensionsByVendor,
} from "../repositories/vendor-intelligence.repo";
import { listArchitectureOptionsByProject } from "../repositories/architecture.repo";
import { getVendorById, updateVendorFitScore } from "../repositories/vendor.repo";
import { mergeInterviewEvidenceIntoFitDimensions } from "./vendor-interview-merge.service";
import { computeClaimValidationDimensionAdjustments } from "./vendor-claim-validation-merge.service";
import { runVendorClaimValidation } from "./vendor-claim-validation.service";
import { computeFailureDimensionAdjustments } from "./vendor-failure-mode-merge.service";
import { runVendorFailureSimulation } from "./vendor-failure-mode.service";
import { computeRoleDimensionAdjustments } from "./vendor-role-fit-merge.service";
import { runVendorRoleFitAnalysis } from "./vendor-role-fit.service";
import { computePricingRealityDimensionAdjustments } from "./pricing-reality-merge.service";
import { computeVendorPricingReality } from "./pricing-reality.service";

function confWeight(c: string): number {
  const x = c.toLowerCase().trim();
  if (x === "high") return 1;
  if (x === "medium") return 0.75;
  if (x === "low") return 0.5;
  return 0.55;
}

function clampDimScore(n: number): number {
  return Math.max(1, Math.min(5, n));
}

/**
 * Aggregates fit dimensions into a single banded score (1–5) using pillar weights and confidence weights.
 */
export async function computeVendorScore(vendorId: string): Promise<{
  band: number;
  pillars: Record<string, { weighted: number; weight: number }>;
}> {
  await mergeInterviewEvidenceIntoFitDimensions(vendorId);
  const vendorRow = await getVendorById(vendorId);
  if (vendorRow) {
    await runVendorClaimValidation({
      projectId: vendorRow.projectId,
      vendorId,
    });
    const archOpts = await listArchitectureOptionsByProject(vendorRow.projectId);
    const archOpt = archOpts.find((o) => o.recommended) ?? archOpts[0];
    await runVendorRoleFitAnalysis({
      projectId: vendorRow.projectId,
      vendorId,
      architectureOptionId: archOpt?.id ?? null,
    });
    await runVendorFailureSimulation({
      projectId: vendorRow.projectId,
      vendorId,
      architectureOptionId: archOpt?.id ?? null,
    });
  }
  const claimAdj = await computeClaimValidationDimensionAdjustments(vendorId);
  const failAdj = vendorRow
    ? await computeFailureDimensionAdjustments({
        projectId: vendorRow.projectId,
        vendorId,
      })
    : {};
  const roleAdj = vendorRow
    ? await computeRoleDimensionAdjustments({
        projectId: vendorRow.projectId,
        vendorId,
      })
    : {};
  const pricingReality = vendorRow
    ? await computeVendorPricingReality({
        projectId: vendorRow.projectId,
        vendorId,
      })
    : null;
  const pricingAdj = pricingReality
    ? computePricingRealityDimensionAdjustments(pricingReality)
    : {};
  const dims = await listVendorFitDimensionsByVendor(vendorId);
  const byKey = Object.fromEntries(dims.map((d) => [d.dimensionKey, d]));

  const pillars: Record<string, { weighted: number; weight: number }> = {};

  for (const p of VENDOR_SCORING_MODEL.pillars) {
    let num = 0;
    let den = 0;
    for (const dk of p.mapsToFitDimensions) {
      const row = byKey[dk];
      if (!row) continue;
      const w = confWeight(row.confidence);
      const adj =
        (claimAdj[dk] ?? 0) +
        (failAdj[dk] ?? 0) +
        (roleAdj[dk] ?? 0) +
        (pricingAdj[dk] ?? 0);
      const effective = clampDimScore(row.score + adj);
      num += effective * w;
      den += w;
    }
    const pillarScore = den > 0 ? num / den : 2.5;
    pillars[p.key] = { weighted: pillarScore, weight: p.weight };
  }

  let total = 0;
  let wsum = 0;
  for (const p of VENDOR_SCORING_MODEL.pillars) {
    const cell = pillars[p.key];
    if (!cell) continue;
    total += cell.weighted * p.weight;
    wsum += p.weight;
  }
  const raw = wsum > 0 ? total / wsum : 2.5;
  const band = Math.max(1, Math.min(5, Math.round(raw)));

  await updateVendorFitScore({ vendorId, fitScore: band });

  return { band, pillars };
}
