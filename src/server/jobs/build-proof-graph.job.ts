import {
  buildProofGraphForProject,
  buildProofGraphForRequirement,
} from "../services/proof-graph.service";

export async function runBuildProofGraphJob(input: {
  projectId: string;
  requirementId?: string | null;
}): Promise<{ rowsSynced: number }> {
  if (input.requirementId?.trim()) {
    return buildProofGraphForRequirement(input.requirementId.trim());
  }
  return buildProofGraphForProject(input.projectId);
}
