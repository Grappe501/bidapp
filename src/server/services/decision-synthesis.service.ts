import { buildVendorDecisionSynthesis } from "../../lib/decision-synthesis-engine";
import type { VendorDecisionSynthesis } from "../../types";
import { listArchitectureComponentsByOptionId } from "../repositories/architecture.repo";
import {
  defaultComparedVendorIdsForProject,
  runCompetitorAwareSimulation,
} from "./competitor-aware-simulation.service";

/**
 * Runs competitor-aware simulation and builds unified decision synthesis (server-side).
 */
export async function runDecisionSynthesis(input: {
  projectId: string;
  architectureOptionId?: string | null;
}): Promise<VendorDecisionSynthesis> {
  const ids = await defaultComparedVendorIdsForProject(input.projectId);
  const sim = await runCompetitorAwareSimulation({
    projectId: input.projectId,
    comparedVendorIds: ids,
    architectureOptionId: input.architectureOptionId,
  });

  let stackIds: string[] = [];
  if (input.architectureOptionId) {
    const comps = await listArchitectureComponentsByOptionId(input.architectureOptionId);
    stackIds = [
      ...new Set(
        comps
          .filter((c) => !c.optional && c.vendorId)
          .map((c) => c.vendorId as string),
      ),
    ];
  }

  return buildVendorDecisionSynthesis({
    sim,
    recommendedVendorStackIds: stackIds,
  });
}
