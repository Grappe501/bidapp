import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import {
  evaluateFinalValidationGate,
  type FinalValidationGateResult,
} from "@/lib/submission-utils";
import type { OutputArtifact, RedactionPackagingSummary, ReviewIssue } from "@/types";

export function runFinalValidationGate(
  snapshot: BidReviewSnapshot,
  reviewIssues: ReviewIssue[],
  artifacts: OutputArtifact[],
  redactionSummary: RedactionPackagingSummary,
): FinalValidationGateResult {
  return evaluateFinalValidationGate(
    snapshot,
    reviewIssues,
    artifacts,
    redactionSummary,
  );
}
