import { createContext } from "react";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type {
  ReadinessScore,
  ReviewIssue,
  ReviewIssueStatus,
} from "@/types";
import type { ReviewFilters } from "@/lib/review-utils";

export type IssueOverride = {
  status: ReviewIssueStatus;
  notes: string;
  updatedAt: string;
};

export type ReviewContextValue = {
  projectId: string;
  /** Filtered by current filter bar */
  issues: ReviewIssue[];
  /** Full list after overrides */
  allIssues: ReviewIssue[];
  readiness: ReadinessScore;
  lastRunAt: string | null;
  filters: ReviewFilters;
  setFilters: (f: Partial<ReviewFilters>) => void;
  runReview: () => void;
  getIssue: (id: string) => ReviewIssue | undefined;
  updateIssueStatus: (
    issueId: string,
    status: ReviewIssueStatus,
    notes?: string,
  ) => void;
  snapshot: BidReviewSnapshot;
};

export const ReviewContext = createContext<ReviewContextValue | null>(null);
