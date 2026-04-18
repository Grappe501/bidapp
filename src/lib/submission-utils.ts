import { pageOverflowRisk, SECTION_FOCUS } from "@/lib/drafting-utils";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type {
  OutputArtifact,
  RedactionPackagingSummary,
  ReviewIssue,
  SubmissionItem,
  SubmissionWorkflowStep,
} from "@/types";

const SUBMISSION_ITEM_OK = new Set(["Ready", "Validated", "Submitted"]);

const SCORED_SECTIONS = ["Experience", "Solution", "Risk"] as const;

export type FinalValidationGateResult = {
  status: "PASS" | "FAIL";
  blockers: string[];
};

function criticalIssuesOpen(issues: ReviewIssue[]): ReviewIssue[] {
  return issues.filter(
    (i) =>
      i.severity === "Critical" &&
      (i.status === "Open" || i.status === "In Review"),
  );
}

function requiredSubmissionIncomplete(items: SubmissionItem[]): string[] {
  const req = items.filter((s) => s.required && s.phase === "Proposal");
  const bad = req.filter((s) => !SUBMISSION_ITEM_OK.has(s.status));
  return bad.map((s) => s.name);
}

function scoredDraftBlockers(snapshot: BidReviewSnapshot): string[] {
  const out: string[] = [];
  for (const st of SCORED_SECTIONS) {
    const sec = snapshot.draftSections.find((d) => d.sectionType === st);
    if (!sec) {
      out.push(`Missing draft section: ${st}`);
      continue;
    }
    const v = snapshot.activeDraftBySection[sec.id];
    const words = v?.metadata.wordCount ?? 0;
    if (words < 40 && sec.status !== "Approved" && sec.status !== "Locked") {
      out.push(`${st} section lacks sufficient draft body or approval.`);
    }
    if (v?.metadata) {
      const max = SECTION_FOCUS[st].maxPages;
      if (pageOverflowRisk(v.metadata.estimatedPages, max) === "over") {
        out.push(
          `${st} exceeds page limit (${v.metadata.estimatedPages} est. vs ${max} max).`,
        );
      }
    }
  }
  return out;
}

function discussionBlockers(snapshot: BidReviewSnapshot, issues: ReviewIssue[]) {
  const discGap = issues.some(
    (i) =>
      i.issueType === "Discussion Readiness Gap" &&
      (i.status === "Open" || i.status === "In Review"),
  );
  if (discGap) {
    return ["Discussion readiness gaps remain in the review queue."];
  }
  const stalled = snapshot.discussionItems.filter(
    (d) => d.status === "Not Started",
  ).length;
  if (stalled >= 3) {
    return [
      "Three or more discussion workbook items are still Not Started — finalize or document deferral.",
    ];
  }
  return [];
}

function artifactBlockers(artifacts: OutputArtifact[]): string[] {
  const bad = artifacts.filter(
    (a) => a.requiredForSubmission && !a.isValidated,
  );
  return bad.map((a) => `Artifact not validated: ${a.title}`);
}

/**
 * Deterministic final gate before ARBuy execution (no external calls).
 */
export function evaluateFinalValidationGate(
  snapshot: BidReviewSnapshot,
  reviewIssues: ReviewIssue[],
  artifacts: OutputArtifact[],
  redactionSummary: RedactionPackagingSummary,
): FinalValidationGateResult {
  const blockers: string[] = [];

  blockers.push(...requiredSubmissionIncomplete(snapshot.submissionItems));

  const crit = criticalIssuesOpen(reviewIssues);
  if (crit.length) {
    blockers.push(
      `${crit.length} critical review issue(s) still open — resolve or dismiss.`,
    );
  }

  blockers.push(...scoredDraftBlockers(snapshot));

  blockers.push(...artifactBlockers(artifacts));

  if (redactionSummary.unresolvedCount > 0) {
    blockers.push(
      `${redactionSummary.unresolvedCount} redaction flag(s) unresolved.`,
    );
  }
  if (!redactionSummary.redactedCopyArtifactReady) {
    blockers.push("Redacted copy is not in a validated submission state.");
  }

  blockers.push(...discussionBlockers(snapshot, reviewIssues));

  const unique = [...new Set(blockers)];
  return {
    status: unique.length === 0 ? "PASS" : "FAIL",
    blockers: unique,
  };
}

export function workflowProgressPercent(
  steps: { status: string; required: boolean }[],
): number {
  const req = steps.filter((s) => s.required);
  if (!req.length) return 100;
  const done = req.filter((s) => s.status === "Completed").length;
  return Math.round((done / req.length) * 100);
}

export function canCompleteWorkflowStep(
  stepOrderIndex: number,
  steps: SubmissionWorkflowStep[],
  gate: FinalValidationGateResult,
): { ok: boolean; reason?: string } {
  const ordered = [...steps].sort((a, b) => a.orderIndex - b.orderIndex);
  const step = ordered.find((s) => s.orderIndex === stepOrderIndex);
  if (!step) return { ok: false, reason: "Unknown step." };

  for (const s of ordered) {
    if (s.orderIndex >= stepOrderIndex) break;
    if (s.required && s.status !== "Completed") {
      return {
        ok: false,
        reason: `Complete "${s.stepName}" before this step.`,
      };
    }
  }

  const clientStep = ordered.find((s) => s.stepName === "Client Approval");
  const arbuyStep = ordered.find((s) => s.stepName === "ARBuy Upload Execution");

  if (step.stepName === "ARBuy Upload Execution" && gate.status === "FAIL") {
    return { ok: false, reason: "Final validation gate must PASS before ARBuy." };
  }
  if (step.stepName === "ARBuy Upload Execution" && clientStep) {
    if (clientStep.status !== "Completed") {
      return { ok: false, reason: "Client approval must be completed first." };
    }
  }
  if (step.stepName === "Submission Confirmation" && arbuyStep) {
    if (arbuyStep.status !== "Completed") {
      return { ok: false, reason: "Complete ARBuy upload step first." };
    }
  }
  if (step.stepName === "Final Validation Gate" && gate.status === "FAIL") {
    return {
      ok: false,
      reason: "Gate checklist failing — address blockers before marking complete.",
    };
  }

  return { ok: true };
}
