import { createContext } from "react";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type { OutputSummary } from "@/lib/output-utils";
import type {
  ArbuySolicitationCompliance,
  EvaluatorSimulationResult,
  FinalReadinessGate,
  OutputArtifact,
  OutputBundle,
  PackagingCompleteness,
  Project,
  ReadinessScore,
  RedactionPackagingSummary,
  ReviewIssue,
  TechnicalProposalPacketCompliance,
} from "@/types";
import type { SubmissionPackageSummaryStats } from "@/lib/output-utils";

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
  evaluatorSimulation: EvaluatorSimulationResult;
  finalReadinessGate: FinalReadinessGate;
  technicalProposalPacketCompliance: TechnicalProposalPacketCompliance;
  arbuySolicitationCompliance: ArbuySolicitationCompliance | null;
  submissionPackageStats: SubmissionPackageSummaryStats;
  copySectionPlainText: (sectionId: string) => Promise<boolean>;
  copyChecklistSummary: () => Promise<boolean>;
  copyReadinessSummary: () => Promise<boolean>;
  copyBundleJson: (bundleId: string) => Promise<boolean>;
};

export const OutputContext = createContext<OutputContextValue | null>(null);
