import {
  gatherOutputArtifacts,
  type OutputGatherInput,
} from "../../lib/output-utils";
import type { OutputArtifact } from "../../types";

export type { OutputGatherInput };

/**
 * Build the flat artifact list from project state (session, DB snapshot, or mocks).
 */
export function collectOutputArtifacts(input: OutputGatherInput): OutputArtifact[] {
  return gatherOutputArtifacts(input);
}
