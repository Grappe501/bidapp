import { linksForRequirement } from "@/lib/evidence-utils";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type {
  ReadinessScore,
  RequirementProofSupportLevel,
  RequirementSupportSummary,
  ReviewIssue,
  ReviewSeverity,
} from "@/types";

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

const PROOF_RANK: Record<RequirementProofSupportLevel, number> = {
  none: 0,
  weak: 1,
  partial: 2,
  strong: 3,
};

/** Merge proof summaries from multiple section bundles (best level wins per requirement). */
export function mergeRequirementProofMaps(
  maps: Record<string, RequirementSupportSummary>[],
): Record<string, RequirementSupportSummary> {
  const out: Record<string, RequirementSupportSummary> = {};
  for (const m of maps) {
    for (const [id, s] of Object.entries(m)) {
      const prev = out[id];
      if (!prev || PROOF_RANK[s.level] > PROOF_RANK[prev.level]) {
        out[id] = { ...s, evidence_ids: [...s.evidence_ids] };
        continue;
      }
      if (prev && PROOF_RANK[s.level] === PROOF_RANK[prev.level]) {
        const vid = new Set([...prev.evidence_ids, ...s.evidence_ids]);
        out[id] = {
          ...prev,
          evidence_ids: [...vid],
          validation_mix: {
            verified: prev.validation_mix.verified + s.validation_mix.verified,
            vendor_claim:
              prev.validation_mix.vendor_claim + s.validation_mix.vendor_claim,
            unverified:
              prev.validation_mix.unverified + s.validation_mix.unverified,
          },
        };
      }
    }
  }
  return out;
}

/** Issues that still need attention (not resolved/dismissed). */
export function activeIssues(issues: ReviewIssue[]): ReviewIssue[] {
  return issues.filter(
    (i) => i.status === "Open" || i.status === "In Review",
  );
}

export function issueSummary(issues: ReviewIssue[]) {
  const act = activeIssues(issues);
  const groundedTypes = new Set<ReviewIssue["issueType"]>([
    "Weak Requirement Proof",
    "Requirement Not Addressed in Section",
    "Draft Contradiction",
    "Low Confidence Draft",
    "Over-Reliance on Vendor Claims",
    "Missing Mitigation Proof",
    "Technical Density Risk",
    "Weak Metrics Presence",
    "Weak Differentiation Support",
  ]);
  return {
    total: issues.length,
    active: act.length,
    critical: act.filter((i) => i.severity === "Critical").length,
    open: issues.filter((i) => i.status === "Open").length,
    resolved: issues.filter((i) => i.status === "Resolved").length,
    submissionBlockers: act.filter((i) => i.issueType === "Submission Gap")
      .length,
    scoringRisk: act.filter((i) => i.issueType === "Scoring Weakness").length,
    groundedFindingCount: act.filter((i) => groundedTypes.has(i.issueType))
      .length,
    contradictionCount: act.filter((i) => i.issueType === "Draft Contradiction")
      .length,
    proseUnsupportedCount: act.filter(
      (i) =>
        i.issueType === "Unsupported Claim" &&
        Boolean(i.groundedContext?.claimExcerpt),
    ).length,
  };
}

const CONTRACT_SENSITIVE_RE =
  /\b(sla|security|hipaa|phi|pii|breach|compliance|certif|contract|binding|warrant|indemnif|penalt|delivery|deadline|availability|uptime|integration|interface|api)\b/i;

export function computeReadinessScore(
  snapshot: BidReviewSnapshot,
  issues: ReviewIssue[],
): ReadinessScore {
  const act = activeIssues(issues);
  const pen = act.reduce((a, i) => a + severityPenalty(i.severity), 0);
  const penFactor = clamp(100 - Math.min(pen, 88));

  const proofById = snapshot.requirementProofById ?? {};
  const hasProofMap = Object.keys(proofById).length > 0;

  const mand = snapshot.requirements.filter((r) => r.mandatory);
  let mandOk = 0;
  let mandProofScore = 0;
  for (const r of mand) {
    const links = linksForRequirement(snapshot.evidenceLinks, r.id);
    const ok =
      links.length > 0 &&
      r.status !== "Unresolved" &&
      r.status !== "Blocked";
    if (ok) mandOk++;
    const p = proofById[r.id];
    if (hasProofMap && p) {
      if (p.level === "strong") mandProofScore += 1;
      else if (p.level === "partial") mandProofScore += 0.65;
      else if (p.level === "weak") mandProofScore += 0.32;
    } else if (ok) {
      mandProofScore += 0.52;
    }
  }
  const mandN = Math.max(1, mand.length);
  const coverageBase = mand.length
    ? clamp(
        (mandOk / mandN) * 100 * 0.4 + (mandProofScore / mandN) * 100 * 0.6,
      )
    : 100;

  let proseUnsupported = 0;
  let proseContradictions = 0;
  let proseNotAddressed = 0;
  let lowConfSections = 0;
  let proseSections = 0;
  for (const sec of snapshot.draftSections) {
    const pr = snapshot.groundedProseBySectionId?.[sec.id];
    if (!pr) continue;
    proseSections += 1;
    proseUnsupported += pr.unsupported_claims.length;
    proseContradictions += pr.contradictions.length;
    proseNotAddressed += pr.requirement_findings.filter(
      (f) => f.status === "not_addressed",
    ).length;
    if (pr.confidence === "low") lowConfSections += 1;
  }
  const prosePenalty =
    proseSections > 0
      ? Math.min(
          50,
          proseUnsupported * 4 +
            proseContradictions * 6 +
            proseNotAddressed * 3 +
            lowConfSections * 8,
        )
      : 0;

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
  let groundingBase =
    scoredSections.length > 0
      ? clamp(
          (grounded / scoredSections.length) * 68 +
            (snapshot.evidenceItems.length > 0 ? 32 : 5),
        )
      : clamp(snapshot.evidenceItems.length > 0 ? 55 : 35);
  groundingBase = clamp(groundingBase - prosePenalty * 0.45);

  const disc = snapshot.discussionItems.filter((d) =>
    ["Scope of Work", "Risk Management Plan", "Payment Schedule", "Reporting Templates"].some(
      (n) => d.name.includes(n),
    ),
  );
  const discOk = disc.filter((d) => d.status !== "Not Started").length;
  const discussionBase = disc.length
    ? clamp((discOk / disc.length) * 100)
    : 85;

  const contractIssues = act.filter((i) => {
    if (
      i.issueType === "Contract Exposure" ||
      i.issueType === "Architecture Risk"
    ) {
      return true;
    }
    if (i.issueType === "Draft Contradiction") {
      return CONTRACT_SENSITIVE_RE.test(
        `${i.title} ${i.description} ${i.groundedContext?.claimExcerpt ?? ""}`,
      );
    }
    if (i.issueType === "Unsupported Claim") {
      return (
        i.severity === "Critical" ||
        i.severity === "High" ||
        CONTRACT_SENSITIVE_RE.test(
          `${i.description} ${i.groundedContext?.claimExcerpt ?? ""}`,
        )
      );
    }
    return false;
  });
  const contractBase = clamp(100 - contractIssues.length * 12);

  const scoringIssues = act.filter(
    (i) =>
      i.issueType === "Scoring Weakness" ||
      i.issueType === "Page Limit Risk" ||
      i.issueType === "Technical Density Risk" ||
      i.issueType === "Weak Metrics Presence" ||
      i.issueType === "Weak Differentiation Support" ||
      i.issueType === "Missing Mitigation Proof" ||
      i.issueType === "Low Confidence Draft",
  );
  const scoringBase = clamp(100 - scoringIssues.length * 9);

  const structuralCap = clamp(100 - prosePenalty * 0.25);
  const submission = clamp(
    Math.min(submissionBase, structuralCap) * 0.85 + penFactor * 0.15,
  );
  const coverage = clamp(
    Math.min(coverageBase, structuralCap) * 0.82 + penFactor * 0.18,
  );
  const grounding = clamp(
    Math.min(groundingBase, structuralCap) * 0.72 + penFactor * 0.28,
  );
  const scoring_alignment = clamp(scoringBase * 0.78 + penFactor * 0.22);
  const contract_readiness = clamp(contractBase * 0.82 + penFactor * 0.18);
  const discussion_readiness = clamp(discussionBase * 0.85 + penFactor * 0.15);

  const overall = clamp(
    submission * 0.2 +
      coverage * 0.24 +
      grounding * 0.2 +
      scoring_alignment * 0.17 +
      contract_readiness * 0.12 +
      discussion_readiness * 0.07,
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
