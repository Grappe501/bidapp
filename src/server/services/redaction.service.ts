import { summarizeRedactionPackaging } from "@/lib/output-utils";
import type {
  OutputArtifact,
  RedactionFlag,
  RedactionPackagingSummary,
  SubmissionItem,
} from "@/types";

export function buildRedactionPackagingSummary(
  flags: RedactionFlag[],
  submissionItems: SubmissionItem[],
  artifacts: OutputArtifact[],
): RedactionPackagingSummary {
  return summarizeRedactionPackaging(flags, submissionItems, artifacts);
}
