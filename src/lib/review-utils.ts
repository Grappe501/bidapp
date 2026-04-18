import { linksForRequirement } from "@/lib/evidence-utils";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type { ReadinessScore, ReviewIssue, ReviewSeverity } from "@/types";

const SUBMISSION_OK = new Set(["Ready", "Validated", "Submitted"]);

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function severityPenalty(s: ReviewSeverity): number {
  switch (s) {
    case "Low":
      return 4;
    case "Moderate":
      return 10;
    case "High":
      return 18;
    case "Critical":
      return 28;
    default:
      return 0;
  }
}

/** Issues that still need attention (not resolved/dismissed). */
export function activeIssues(issues: ReviewIssue[]): ReviewIssue[] {
  return issues.filter(
    (i) => i.status === "Open" || i.status === "In Review",
  );
}

export function issueSummary(issues: ReviewIssue[]) {
  const act = activeIssues(issues);
  return {
    total: issues.length,
    active: act.length,
    critical: act.filter((i) => i.severity === "Critical").length,
    open: issues.filter((i) => i.status === "Open").length,
    resolved: issues.filter((i) => i.status === "Resolved").length,
    submissionBlockers: act.filter((i) => i.issueType === "Submission Gap")
      .length,
    scoringRisk: act.filter((i) => i.issueType === "Scoring Weakness").length,
  };
}

export function computeReadinessScore(
  snapshot: BidReviewSnapshot,
  issues: ReviewIssue[],
): ReadinessScore {
  const act = activeIssues(issues);
  const pen = act.reduce((a, i) => a + severityPenalty(i.severity), 0);
  const penFactor = clamp(100 - Math.min(pen, 85));

  const mand = snapshot.requirements.filter((r) => r.mandatory);
  let mandOk = 0;
  for (const r of mand) {
    const links = linksForRequirement(snapshot.evidenceLinks, r.id);
    const ok =
      links.length > 0 &&
      r.status !== "Unresolved" &&
      r.status !== "Blocked";
    if (ok) mandOk++;
  }
  const coverageBase = mand.length
    ? clamp((mandOk / mand.length) * 100)
    : 100;

  const reqSub = snapshot.submissionItems.filter((s) => s.required);
  const subOk = reqSub.filter((s) => SUBMISSION_OK.has(s.status)).length;
  const submissionBase = reqSub.length
    ? clamp((subOk / reqSub.length) * 100)
    : 100;

  const scoredSections = snapshot.draftSections.filter((s) =>
    ["Experience", "Solution", "Risk"].includes(s.sectionType),
  );
  const grounded = scoredSections.filter((s) => {
    const v = snapshot.activeDraftBySection[s.id];
    return v && v.groundingBundleId;
  }).length;
  const groundingBase =
    scoredSections.length > 0
      ? clamp(
          (grounded / scoredSections.length) * 70 +
            (snapshot.evidenceItems.length > 0 ? 30 : 0),
        )
      : clamp(snapshot.evidenceItems.length > 0 ? 55 : 35);

  const disc = snapshot.discussionItems.filter((d) =>
    ["Scope of Work", "Risk Management Plan", "Payment Schedule", "Reporting Templates"].some(
      (n) => d.name.includes(n),
    ),
  );
  const discOk = disc.filter((d) => d.status !== "Not Started").length;
  const discussionBase = disc.length
    ? clamp((discOk / disc.length) * 100)
    : 85;

  const contractIssues = act.filter(
    (i) => i.issueType === "Contract Exposure" || i.issueType === "Architecture Risk",
  );
  const contractBase = clamp(100 - contractIssues.length * 12);

  const scoringIssues = act.filter(
    (i) =>
      i.issueType === "Scoring Weakness" ||
      i.issueType === "Page Limit Risk",
  );
  const scoringBase = clamp(100 - scoringIssues.length * 10);

  const submission = clamp(submissionBase * 0.85 + penFactor * 0.15);
  const coverage = clamp(coverageBase * 0.85 + penFactor * 0.15);
  const grounding = clamp(groundingBase * 0.8 + penFactor * 0.2);
  const scoring_alignment = clamp(scoringBase * 0.8 + penFactor * 0.2);
  const contract_readiness = clamp(contractBase * 0.85 + penFactor * 0.15);
  const discussion_readiness = clamp(discussionBase * 0.85 + penFactor * 0.15);

  const overall = clamp(
    submission * 0.22 +
      coverage * 0.22 +
      grounding * 0.15 +
      scoring_alignment * 0.18 +
      contract_readiness * 0.13 +
      discussion_readiness * 0.1,
  );

  return {
    overall,
    submission,
    coverage,
    grounding,
    scoring_alignment,
    contract_readiness,
    discussion_readiness,
  };
}

export type ReviewFilters = {
  severity: ReviewSeverity | "all";
  issueType: string | "all";
  status: ReviewIssue["status"] | "all";
  entityType: string | "all";
  search: string;
};

export function filterReviewIssues(
  issues: ReviewIssue[],
  f: ReviewFilters,
): ReviewIssue[] {
  const q = f.search.trim().toLowerCase();
  return issues.filter((i) => {
    if (f.severity !== "all" && i.severity !== f.severity) return false;
    if (f.issueType !== "all" && i.issueType !== f.issueType) return false;
    if (f.status !== "all" && i.status !== f.status) return false;
    if (f.entityType !== "all" && i.entityType !== f.entityType) return false;
    if (q) {
      const blob = `${i.title} ${i.description} ${i.suggestedFix}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

export function mergeSupplementalIssues(
  generated: ReviewIssue[],
  supplemental: ReviewIssue[],
): ReviewIssue[] {
  const ids = new Set(generated.map((g) => g.id));
  return [...generated, ...supplemental.filter((s) => !ids.has(s.id))];
}
