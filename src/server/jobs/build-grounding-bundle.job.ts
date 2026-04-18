import { buildAndStoreGroundingBundle } from "../services/grounding.service";
import type { GroundingBundlePayload, GroundingBundleType } from "@/types";

export async function runBuildGroundingBundleJob(input: {
  projectId: string;
  bundleType: GroundingBundleType;
  targetEntityId?: string | null;
  title?: string;
  topK?: number;
  fileId?: string;
}): Promise<{ bundleId: string; payload: GroundingBundlePayload }> {
  const { id, payload } = await buildAndStoreGroundingBundle(input);
  return { bundleId: id, payload };
}
