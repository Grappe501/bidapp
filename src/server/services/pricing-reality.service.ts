import { buildPricingLayerForProject } from "../../lib/pricing-structure";
import {
  computePricingRiskSignals,
  evaluatePricingReality,
} from "../lib/pricing-reality-engine";
import type { PricingRiskSignals } from "../lib/pricing-reality-engine";
import { listFilesByProject } from "../repositories/file.repo";
import { getProject } from "../repositories/project.repo";
import { listVendorFailureSimulationForApi } from "./vendor-failure-mode.service";
import { listVendorRoleFitForApi } from "./vendor-role-fit.service";
import type { VendorPricingReality } from "../../types/pricing-model";

function filesToMinimal(
  files: Awaited<ReturnType<typeof listFilesByProject>>,
): { name: string; category: string; description?: string | null; tags: string[] }[] {
  return files.map((f) => ({
    name: f.name,
    category: f.category,
    description: f.description,
    tags: f.tags,
  }));
}

/**
 * Full pricing reality for vendor — uses project workbook + vendor role-fit + failure summary.
 */
export async function computeVendorPricingReality(input: {
  projectId: string;
  vendorId: string;
}): Promise<VendorPricingReality> {
  const project = await getProject(input.projectId);
  const bidNumber = project?.bidNumber?.trim() ?? "";
  const files = await listFilesByProject(input.projectId);
  const pricing = buildPricingLayerForProject(bidNumber, filesToMinimal(files));

  const [role, fail] = await Promise.all([
    listVendorRoleFitForApi({
      projectId: input.projectId,
      vendorId: input.vendorId,
    }),
    listVendorFailureSimulationForApi({
      projectId: input.projectId,
      vendorId: input.vendorId,
    }),
  ]);

  return evaluatePricingReality({
    vendorId: input.vendorId,
    projectId: input.projectId,
    pricing,
    roleFitSummary: role.summary,
    failureSummary: fail.summary,
    bidNumber,
  });
}

/**
 * Signals for failure-mode commercial scenarios — pricing + role-fit only (no failure summary).
 */
export async function computePricingRiskSignalsForFailure(input: {
  projectId: string;
  vendorId: string;
}): Promise<PricingRiskSignals> {
  const project = await getProject(input.projectId);
  const bidNumber = project?.bidNumber?.trim() ?? "";
  const files = await listFilesByProject(input.projectId);
  const pricing = buildPricingLayerForProject(bidNumber, filesToMinimal(files));
  const role = await listVendorRoleFitForApi({
    projectId: input.projectId,
    vendorId: input.vendorId,
  });

  return computePricingRiskSignals({
    pricing,
    roleFitSummary: role.summary,
    bidNumber,
  });
}
