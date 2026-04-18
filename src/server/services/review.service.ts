import {
  runReviewRules,
  type BidReviewSnapshot,
} from "@/lib/review-rules-engine";
import type { ReviewIssue } from "@/types";

export type { BidReviewSnapshot };

/**
 * Deterministic review scan. Pass a snapshot built from session state or (later) DB hydration.
 */
export function runBidReview(snapshot: BidReviewSnapshot): ReviewIssue[] {
  return runReviewRules(snapshot);
}
