import { createContext } from "react";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type { OutputSummary } from "@/lib/output-utils";
import type {
  OutputArtifact,
  OutputBundle,
  PackagingCompleteness,
  Project,
  ReadinessScore,
  RedactionPackagingSummary,
  ReviewIssue,
} from "@/types";

export type OutputContextValue = {
  project: Project;
  artifacts: OutputArtifact[];
  bundles: OutputBundle[];
  packagingByBundle: Record<string, PackagingCompleteness>;
  summary: OutputSummary;
  redactionSummary: RedactionPackagingSummary;
  readiness: ReadinessScore;
  reviewIssues: ReviewIssue[];
  reviewSnapshot: BidReviewSnapshot;
  copySectionPlainText: (sectionId: string) => Promise<boolean>;
  copyChecklistSummary: () => Promise<boolean>;
  copyReadinessSummary: () => Promise<boolean>;
  copyBundleJson: (bundleId: string) => Promise<boolean>;
};

export const OutputContext = createContext<OutputContextValue | null>(null);
