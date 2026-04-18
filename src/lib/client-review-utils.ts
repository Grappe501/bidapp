import { activeIssues } from "@/lib/review-utils";
import type {
  ArchitectureOption,
  DraftSection,
  DraftVersion,
  ReadinessScore,
  ReviewIssue,
  SubmissionItem,
} from "@/types";

export function readinessHeadline(overall: number): string {
  if (overall >= 86) return "Strong readiness — suitable for structured client readout";
  if (overall >= 72) return "Solid trajectory — close gaps before formal approval";
  if (overall >= 58) return "Progressing — prioritize decisions and validation";
  return "Forming — align strategy and evidence before external review";
}

export function issueEntityPath(issue: ReviewIssue): string | undefined {
  switch (issue.entityType) {
    case "draft_section":
      return `/drafts/${issue.entityId}`;
    case "submission_item":
      return "/control/submission";
    case "vendor":
      return `/vendors/${issue.entityId}`;
    case "architecture_option":
      return "/architecture";
    case "redaction_flag":
      return "/output/redaction";
    default:
      return `/review/issues/${issue.id}`;
  }
}

const severityRank: Record<string, number> = {
  Critical: 0,
  High: 1,
  Moderate: 2,
  Low: 3,
};

function sortBySeverity(a: ReviewIssue, b: ReviewIssue): number {
  return (
    (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9) ||
    a.title.localeCompare(b.title)
  );
}

/** Top client-facing watchouts: open issues + architecture dependencies. */
export function buildClientWatchouts(
  issues: ReviewIssue[],
  recommended?: ArchitectureOption,
  limit = 3,
): string[] {
  const act = activeIssues(issues);
  const out: string[] = [];
  for (const i of [...act].sort(sortBySeverity)) {
    if (out.length >= limit) break;
    if (
      i.severity === "Critical" ||
      i.severity === "High" ||
      i.issueType === "Submission Gap" ||
      i.issueType === "Unsupported Claim" ||
      i.issueType === "Vendor Validation Gap" ||
      i.issueType === "Architecture Risk"
    ) {
      out.push(i.title);
    }
  }
  if (recommended?.implementationRisks?.length && out.length < limit) {
    for (const r of recommended.implementationRisks) {
      if (out.length >= limit) break;
      if (!out.some((x) => x.includes(r.slice(0, 24)))) out.push(r);
    }
  }
  if (out.length === 0) {
    return [
      "Confirm pricing workbook assumptions against state template before client sign-off.",
      "Lock vendor confirmation language with named subcontractors in architecture.",
      "Re-read scored volumes for page discipline and interview consistency.",
    ].slice(0, limit);
  }
  return out.slice(0, limit);
}

export type ClientNextAction = { id: string; label: string };

export function buildClientNextActions(input: {
  issues: ReviewIssue[];
  submissionItems: SubmissionItem[];
  readiness: ReadinessScore;
  recommended?: ArchitectureOption;
}): ClientNextAction[] {
  const { issues, submissionItems, readiness, recommended } = input;
  const act = activeIssues(issues);
  const actions: ClientNextAction[] = [];
  let n = 0;

  const push = (label: string) => {
    if (actions.length >= 5) return;
    actions.push({ id: `na-${++n}`, label });
  };

  if (recommended && recommended.status !== "Recommended") {
    push("Confirm and mark the architecture option as Recommended in the architecture workspace.");
  } else if (recommended) {
    push(`Approve strategic recommendation: ${recommended.name}.`);
  }

  const subGaps = submissionItems.filter(
    (s) =>
      s.required &&
      s.phase === "Proposal" &&
      (s.status === "Not Started" || s.status === "In Progress"),
  );
  if (subGaps.length) {
    push(
      `Resolve ${subGaps.length} proposal-phase submission item(s) still open in Bid control.`,
    );
  }

  const crit = act.filter((i) => i.severity === "Critical" || i.severity === "High");
  if (crit.length) {
    push(`Close ${crit.length} high-priority review finding(s) before external sharing.`);
  }

  if (readiness.submission < 72) {
    push("Raise submission readiness: validate required artifacts to Ready or Validated.");
  }

  if (readiness.grounding < 70) {
    push("Strengthen evidence grounding on scored volumes for evaluator defensibility.");
  }

  if (actions.length < 3) {
    push("Schedule client readout: walk strategic recommendation, then scored volumes.");
  }
  if (actions.length < 3) {
    push("Finalize Executive Summary after architecture approval.");
  }

  return actions.slice(0, 5);
}

export type UnresolvedDecision = {
  id: string;
  title: string;
  detail: string;
  to?: string;
};

export function buildUnresolvedDecisions(
  issues: ReviewIssue[],
  submissionItems: SubmissionItem[],
): UnresolvedDecision[] {
  const act = activeIssues(issues);
  const out: UnresolvedDecision[] = [];

  for (const i of [...act].sort(sortBySeverity)) {
    if (out.length >= 8) break;
    if (
      i.issueType === "Vendor Validation Gap" ||
      i.issueType === "Submission Gap" ||
      i.issueType === "Redaction Risk" ||
      i.severity === "Critical" ||
      i.severity === "High"
    ) {
      out.push({
        id: `ud-${i.id}`,
        title: i.title,
        detail: i.suggestedFix || i.description,
        to: issueEntityPath(i),
      });
    }
  }

  for (const s of submissionItems) {
    if (out.length >= 8) break;
    if (
      !s.required ||
      s.phase !== "Proposal" ||
      s.status === "Ready" ||
      s.status === "Validated" ||
      s.status === "Submitted"
    ) {
      continue;
    }
    out.push({
      id: `sub-${s.id}`,
      title: `Submission decision: ${s.name}`,
      detail:
        s.notes ||
        "Confirm ownership, content, and validation before the client review packet is shared externally.",
      to: "/control/submission",
    });
  }

  return out.slice(0, 8);
}

export type DraftPacketRow = {
  sectionId: string;
  sectionType: string;
  status: DraftSection["status"];
  strengthLabel: string;
  clientReviewLabel: string;
  grounded: boolean;
};

function draftStrength(
  sec: DraftSection,
  contentLen: number,
  grounded: boolean,
): string {
  if (sec.status === "Approved" || sec.status === "Locked") {
    return grounded ? "Strong — approved / locked" : "Approved — consider added grounding";
  }
  if (contentLen > 400 && grounded) return "Solid draft — evidence-backed";
  if (contentLen > 200) return "Developing — continue tightening";
  if (contentLen > 0) return "Early draft";
  return "Not yet drafted";
}

function clientReviewReady(
  sec: DraftSection,
  contentLen: number,
  issueCount: number,
): string {
  if (sec.status === "Locked") return "Ready — locked";
  if (sec.status === "Approved" && contentLen > 0) return "Ready for client review";
  if (sec.status === "Needs Review" && contentLen > 200)
    return "Circulate for review — pending approval";
  if (sec.status === "Drafting" && contentLen > 200) return "Internal review first";
  if (contentLen === 0) return "Not ready — no body";
  if (issueCount > 0) return "Resolve open review flags first";
  return "In Progress";
}

export function buildDraftPacketRows(
  sections: DraftSection[],
  activeBySection: Record<string, DraftVersion | undefined>,
  issues: ReviewIssue[],
): DraftPacketRow[] {
  const act = activeIssues(issues);
  const priority: DraftSection["sectionType"][] = [
    "Experience",
    "Solution",
    "Risk",
    "Executive Summary",
    "Architecture Narrative",
  ];
  const sorted = [...sections].sort(
    (a, b) => priority.indexOf(a.sectionType) - priority.indexOf(b.sectionType),
  );

  return sorted.map((sec) => {
    const v = activeBySection[sec.id];
    const contentLen = v?.content?.trim().length ?? 0;
    const grounded = Boolean(v?.groundingBundleId);
    const issueCount = act.filter(
      (i) => i.entityType === "draft_section" && i.entityId === sec.id,
    ).length;
    return {
      sectionId: sec.id,
      sectionType: sec.sectionType,
      status: sec.status,
      strengthLabel: draftStrength(sec, contentLen, grounded),
      clientReviewLabel: clientReviewReady(sec, contentLen, issueCount),
      grounded,
    };
  });
}

export function formatExecutiveSummaryCopy(input: {
  bidNumber: string;
  projectTitle: string;
  readiness: ReadinessScore;
  readinessNarrative: string;
  recommendedName?: string;
  vendorStrategyLine: string;
  watchouts: string[];
  nextActions: ClientNextAction[];
}): string {
  const lines = [
    `Client review packet — executive summary`,
    `Bid: ${input.bidNumber}`,
    `${input.projectTitle}`,
    "",
    `Readiness: ${input.readiness.overall}/100 — ${input.readinessNarrative}`,
    `Submission ${input.readiness.submission} · Coverage ${input.readiness.coverage} · Contract ${input.readiness.contract_readiness}`,
    "",
    input.recommendedName
      ? `Strategic recommendation: ${input.recommendedName}`
      : "Strategic recommendation: not finalized",
    `Vendor posture: ${input.vendorStrategyLine}`,
    "",
    "Top watchouts:",
    ...input.watchouts.map((w) => `• ${w}`),
    "",
    "Next actions:",
    ...input.nextActions.map((a) => `• ${a.label}`),
  ];
  return lines.join("\n");
}

export function formatNextActionsCopy(actions: ClientNextAction[]): string {
  return ["Next actions — client review packet", "", ...actions.map((a) => `• ${a.label}`)].join(
    "\n",
  );
}

export function formatClientReviewPacketSummary(input: {
  bidNumber: string;
  projectTitle: string;
  readiness: ReadinessScore;
  recommended?: ArchitectureOption;
  watchouts: string[];
  decisions: UnresolvedDecision[];
  nextActions: ClientNextAction[];
  draftRows: DraftPacketRow[];
}): string {
  const lines = [
    `# Client review packet — summary`,
    `Bid: ${input.bidNumber}`,
    `${input.projectTitle}`,
    "",
    "## Readiness",
    `- Overall: ${input.readiness.overall}`,
    `- Submission / coverage / contract: ${input.readiness.submission} · ${input.readiness.coverage} · ${input.readiness.contract_readiness}`,
    "",
    "## Strategic recommendation",
    input.recommended
      ? `- ${input.recommended.name}\n- ${input.recommended.summary}`
      : "- Not selected",
    "",
    "## Draft sections (packet posture)",
    ...input.draftRows.map(
      (r) =>
        `- **${r.sectionType}** (${r.status}): ${r.strengthLabel}; client: ${r.clientReviewLabel}`,
    ),
    "",
    "## Watchouts",
    ...input.watchouts.map((w) => `- ${w}`),
    "",
    "## Unresolved decisions",
    ...input.decisions.map((d) => `- ${d.title}: ${d.detail}`),
    "",
    "## Next actions",
    ...input.nextActions.map((a) => `- ${a.label}`),
  ];
  return lines.join("\n");
}
