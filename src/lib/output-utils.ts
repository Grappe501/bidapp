import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import { activeIssues, issueSummary } from "@/lib/review-utils";
import type {
  DraftSection,
  DraftStatus,
  DiscussionItem,
  OutputArtifact,
  OutputArtifactType,
  OutputBundle,
  OutputBundleType,
  OutputStatus,
  PackagingCompleteness,
  Project,
  ReadinessScore,
  RedactionFlag,
  RedactionPackagingSummary,
  RedactionPacketSupportState,
  ReviewIssue,
  SubmissionItem,
  SubmissionItemStatus,
} from "@/types";

const SUBMISSION_OK = new Set<OutputStatus>(["Ready", "Validated", "Locked"]);

/** Workspace route for each bundle type (Output Center navigation). */
/** Primary deliverables shown on the Output command center readiness strip. */
export const OUTPUT_READINESS_STRIP_TYPES: OutputBundleType[] = [
  "Submission Package",
  "Client Review Packet",
  "Redacted Packet",
  "Final Readiness Bundle",
];

export const OUTPUT_BUNDLE_WORKSPACE_HREF: Record<OutputBundleType, string> = {
  "Submission Package": "/output/submission",
  "Client Review Packet": "/output/client-review",
  "Redacted Packet": "/output/redaction",
  "Final Readiness Bundle": "/output/final-bundle",
  "Discussion Packet": "/control/discussion",
};

export function isPackagingReadyStatus(status: OutputStatus): boolean {
  return SUBMISSION_OK.has(status);
}

/** Count of must-include artifacts in this bundle that are not Ready/Validated/Locked. */
export function packagingBlockerCount(c: PackagingCompleteness): number {
  return c.notValidatedTitles.length;
}

export type OutputSuitability = "ready" | "partial" | "blocked";

export type BundleSuitabilityRow = {
  clientReview: OutputSuitability;
  submissionAssembly: OutputSuitability;
  finalDecisionReview: OutputSuitability;
};

/**
 * Honest suitability hints from packaging + review gates (heuristic, not legal sign-off).
 */
export function computeBundleSuitability(
  bundleType: OutputBundleType,
  bundleStatus: OutputStatus,
  completeness: PackagingCompleteness | undefined,
  criticalIssueCount: number,
  readinessOverall: number,
): BundleSuitabilityRow {
  const c = completeness;
  const pct = c?.percent ?? 0;
  const complete = c?.complete ?? false;
  const gate = criticalIssueCount === 0;
  const highReadiness = readinessOverall >= 72;

  const blocked: OutputSuitability = "blocked";
  const partial: OutputSuitability = "partial";
  const ready: OutputSuitability = "ready";

  const statusBoost =
    bundleStatus === "Validated" || bundleStatus === "Locked";

  if (bundleType === "Discussion Packet") {
    return {
      clientReview: partial,
      submissionAssembly: blocked,
      finalDecisionReview: blocked,
    };
  }

  if (bundleType === "Submission Package") {
    return {
      clientReview:
        complete && gate && pct >= 85 ? ready : pct >= 55 && gate ? partial : blocked,
      submissionAssembly:
        complete && gate ? ready : pct >= 70 && gate ? partial : blocked,
      finalDecisionReview:
        complete && statusBoost && gate && highReadiness
          ? ready
          : complete && gate
            ? partial
            : blocked,
    };
  }

  if (bundleType === "Client Review Packet") {
    return {
      clientReview:
        complete && gate ? ready : pct >= 70 && gate ? partial : blocked,
      submissionAssembly: partial,
      finalDecisionReview:
        complete && gate && highReadiness ? partial : blocked,
    };
  }

  if (bundleType === "Redacted Packet") {
    return {
      clientReview:
        complete && gate ? ready : pct >= 50 && gate ? partial : blocked,
      submissionAssembly: blocked,
      finalDecisionReview: partial,
    };
  }

  // Final Readiness Bundle
  return {
    clientReview: blocked,
    submissionAssembly: highReadiness && complete && gate ? partial : blocked,
    finalDecisionReview:
      complete && gate && highReadiness
        ? ready
        : pct >= 60 && gate
          ? partial
          : blocked,
  };
}

export type OutputAttentionItem = {
  id: string;
  title: string;
  detail: string;
  to?: string;
};

export function buildOutputAttentionItems(input: {
  artifacts: OutputArtifact[];
  bundles: OutputBundle[];
  packagingByBundle: Record<string, PackagingCompleteness>;
  redactionSummary: RedactionPackagingSummary;
  readiness: ReadinessScore;
  reviewIssues: ReviewIssue[];
}): OutputAttentionItem[] {
  const act = activeIssues(input.reviewIssues);
  const critical = act.filter((i) => i.severity === "Critical");
  const items: OutputAttentionItem[] = [];
  const seen = new Set<string>();

  const push = (it: OutputAttentionItem) => {
    if (seen.has(it.id)) return;
    seen.add(it.id);
    items.push(it);
  };

  for (const a of input.artifacts) {
    if (!a.requiredForSubmission) continue;
    if (isPackagingReadyStatus(a.status)) continue;
    push({
      id: `artifact-req-${a.id}`,
      title: "Required artifact not submission-ready",
      detail: `${a.title} (${a.status})`,
      to: artifactSourcePath(a)?.to,
    });
    if (items.length >= 8) break;
  }

  for (const b of input.bundles) {
    if (b.bundleType === "Discussion Packet") continue;
    const c = input.packagingByBundle[b.id];
    if (!c || c.complete) continue;
    const preview =
      c.notValidatedTitles.slice(0, 3).join("; ") ||
      c.missingRequiredTitles.slice(0, 3).join("; ") ||
      "Packaging thresholds not met";
    push({
      id: `bundle-gap-${b.id}`,
      title: `${b.bundleType} — packaging gaps`,
      detail: preview,
      to: OUTPUT_BUNDLE_WORKSPACE_HREF[b.bundleType],
    });
  }

  if (input.redactionSummary.unresolvedCount > 0) {
    push({
      id: "redaction-open",
      title: "Redaction-sensitive items unresolved",
      detail: `${input.redactionSummary.unresolvedCount} open flag(s) — clear or document before a public packet.`,
      to: "/output/redaction",
    });
  } else {
    for (const line of input.redactionSummary.blockers.slice(0, 2)) {
      push({
        id: `redact-block-${line.slice(0, 24)}`,
        title: "Redacted packet blocker",
        detail: line,
        to: "/output/redaction",
      });
    }
  }

  if (critical.length > 0) {
    push({
      id: "critical-issues",
      title: "Critical review issues open",
      detail: `${critical.length} critical — resolve before treating outputs as final.`,
      to: "/review/issues",
    });
  }

  if (input.readiness.overall < 68) {
    push({
      id: "readiness-low",
      title: "Bid readiness below comfort threshold",
      detail: `Overall readiness ${input.readiness.overall}/100 — see readiness view for drivers.`,
      to: "/review/readiness",
    });
  }

  return items.slice(0, 8);
}

export type OutputGatherInput = {
  project: Project;
  submissionItems: SubmissionItem[];
  draftSections: DraftSection[];
  activeDraftContentBySectionId: Record<string, string | undefined>;
  draftUpdatedAtBySectionId: Record<string, string>;
  redactionFlags: RedactionFlag[];
  discussionItems: DiscussionItem[];
  reviewIssues: ReviewIssue[];
  readiness: ReadinessScore;
};

export function submissionStatusToOutputStatus(
  s: SubmissionItemStatus,
): OutputStatus {
  switch (s) {
    case "Not Started":
      return "Draft";
    case "In Progress":
      return "In Progress";
    case "Ready":
      return "Ready";
    case "Validated":
      return "Validated";
    case "Submitted":
      return "Locked";
    default:
      return "In Progress";
  }
}

export function draftStatusToOutputStatus(d: DraftStatus): OutputStatus {
  switch (d) {
    case "Not Started":
      return "Draft";
    case "Drafting":
    case "Needs Review":
      return "In Progress";
    case "Approved":
      return "Ready";
    case "Locked":
      return "Locked";
    default:
      return "In Progress";
  }
}

function submissionNameToArtifactType(name: string): OutputArtifactType {
  const n = name.toLowerCase();
  if (n.includes("price") || n.includes("pricing"))
    return "Price Sheet Support";
  if (n.includes("redact")) return "Redacted Copy";
  return "Submission Form";
}

function isValidatedOutputStatus(s: OutputStatus): boolean {
  return SUBMISSION_OK.has(s);
}

const nowIso = () => new Date().toISOString();

/**
 * Deterministic artifact list for packaging (client + server).
 */
export function gatherOutputArtifacts(input: OutputGatherInput): OutputArtifact[] {
  const { project, submissionItems, draftSections } = input;
  const out: OutputArtifact[] = [];
  const t = nowIso();

  for (const sec of draftSections) {
    const content = input.activeDraftContentBySectionId[sec.id];
    const hasBody = Boolean(content?.trim());
    let status = draftStatusToOutputStatus(sec.status);
    if (sec.status === "Not Started" && hasBody) {
      status = "In Progress";
    }
    out.push({
      id: `out-draft-${sec.id}`,
      projectId: project.id,
      artifactType: "Draft Section",
      title: sec.title || sec.sectionType,
      status,
      sourceEntityType: "draft_section",
      sourceEntityId: sec.id,
      notes: sec.sectionType,
      createdAt: sec.createdAt,
      updatedAt: input.draftUpdatedAtBySectionId[sec.id] ?? sec.updatedAt,
      isValidated: isValidatedOutputStatus(status),
      requiredForSubmission: ["Experience", "Solution", "Risk"].includes(
        sec.sectionType,
      ),
    });
  }

  for (const sub of submissionItems) {
    const st = submissionStatusToOutputStatus(sub.status);
    out.push({
      id: `out-sub-${sub.id}`,
      projectId: project.id,
      artifactType: submissionNameToArtifactType(sub.name),
      title: sub.name,
      status: st,
      sourceEntityType: "submission_item",
      sourceEntityId: sub.id,
      notes: sub.notes,
      createdAt: t,
      updatedAt: t,
      isValidated: isValidatedOutputStatus(st),
      requiredForSubmission: sub.required && sub.phase === "Proposal",
    });
  }

  out.push({
    id: "out-req-matrix",
    projectId: project.id,
    artifactType: "Requirement Matrix",
    title: "Minimum RFP requirements matrix",
    status: "Ready",
    sourceEntityType: "project",
    sourceEntityId: project.id,
    notes: "Compliance matrix in Requirements workspace",
    createdAt: t,
    updatedAt: t,
    isValidated: true,
    requiredForSubmission: true,
  });

  const act = activeIssues(input.reviewIssues);
  const reviewStatus: OutputStatus =
    act.length === 0
      ? "Ready"
      : act.some((i) => i.severity === "Critical")
        ? "In Progress"
        : "In Progress";

  out.push({
    id: "out-review-report",
    projectId: project.id,
    artifactType: "Review Report",
    title: "Red-team review report",
    status: reviewStatus,
    sourceEntityType: "review",
    sourceEntityId: "review",
    notes: `${act.length} active findings`,
    createdAt: t,
    updatedAt: t,
    isValidated: isValidatedOutputStatus(reviewStatus),
    requiredForSubmission: false,
  });

  for (const d of input.discussionItems) {
    const st = submissionStatusToOutputStatus(d.status);
    out.push({
      id: `out-disc-${d.id}`,
      projectId: project.id,
      artifactType: "Discussion Prep",
      title: d.name,
      status: st,
      sourceEntityType: "discussion_item",
      sourceEntityId: d.id,
      notes: d.notes,
      createdAt: t,
      updatedAt: t,
      isValidated: isValidatedOutputStatus(st),
      requiredForSubmission: false,
    });
  }

  return out;
}

export type OutputSummary = {
  totalArtifacts: number;
  readyArtifacts: number;
  validatedArtifacts: number;
  redactionSensitiveCount: number;
  outputBlockers: number;
};

export function computeOutputSummary(
  artifacts: OutputArtifact[],
  redactionFlags: RedactionFlag[],
  reviewIssues: ReviewIssue[],
): OutputSummary {
  const act = activeIssues(reviewIssues);
  const submissionGapIssues = act.filter(
    (i) => i.issueType === "Submission Gap",
  ).length;
  const requiredIncomplete = artifacts.filter(
    (a) => a.requiredForSubmission && !isValidatedOutputStatus(a.status),
  ).length;

  return {
    totalArtifacts: artifacts.length,
    readyArtifacts: artifacts.filter((a) => a.status === "Ready").length,
    validatedArtifacts: artifacts.filter(
      (a) => a.status === "Validated" || a.status === "Locked",
    ).length,
    redactionSensitiveCount: redactionFlags.filter((f) => f.status !== "Cleared")
      .length,
    outputBlockers: requiredIncomplete + submissionGapIssues,
  };
}

function bundleStatusFromCompleteness(pct: number, missing: number): OutputStatus {
  if (missing === 0 && pct >= 99) return "Validated";
  if (pct >= 85 && missing <= 1) return "Ready";
  if (pct >= 40) return "In Progress";
  return "Draft";
}

export function computePackagingCompleteness(
  bundleType: OutputBundleType,
  artifacts: OutputArtifact[],
): PackagingCompleteness {
  const subsetIds = new Set(bundleArtifactIds(bundleType, artifacts));
  const subset = artifacts.filter((a) => subsetIds.has(a.id));

  const required = subset.filter((a) => a.requiredForSubmission);

  const must: OutputArtifact[] =
    bundleType === "Discussion Packet"
      ? subset.filter((a) => a.artifactType === "Discussion Prep")
      : required.length > 0
        ? required
        : subset.filter((a) =>
            [
              "Draft Section",
              "Submission Form",
              "Price Sheet Support",
              "Redacted Copy",
              "Requirement Matrix",
            ].includes(a.artifactType),
          );

  const denom = Math.max(must.length, 1);
  const ok = must.filter((a) => isValidatedOutputStatus(a.status)).length;
  const percent = Math.round((ok / denom) * 100);

  const missingRequiredTitles = must
    .filter((a) => a.status === "Draft")
    .map((a) => a.title);

  const notValidatedTitles = must
    .filter((a) => !isValidatedOutputStatus(a.status))
    .map((a) => a.title);

  const readyForAssemblyTitles = must
    .filter((a) => a.status === "Ready" || a.status === "In Progress")
    .map((a) => a.title);

  return {
    bundleType,
    complete: missingRequiredTitles.length === 0 && notValidatedTitles.length === 0,
    percent,
    missingRequiredTitles,
    notValidatedTitles,
    readyForAssemblyTitles,
  };
}

/** Which artifacts belong to each bundle. */
export function bundleArtifactIds(
  bundleType: OutputBundleType,
  artifacts: OutputArtifact[],
): string[] {
  const scoredDraft = (a: OutputArtifact) =>
    a.artifactType === "Draft Section" &&
    [
      "Experience",
      "Solution",
      "Risk",
      "Interview",
      "Executive Summary",
      "Architecture Narrative",
    ].includes(a.notes);

  switch (bundleType) {
    case "Submission Package":
      return artifacts
        .filter(
          (a) =>
            a.sourceEntityType === "submission_item" ||
            scoredDraft(a) ||
            a.id === "out-req-matrix",
        )
        .map((a) => a.id);
    case "Client Review Packet":
      return artifacts
        .filter(
          (a) =>
            scoredDraft(a) ||
            a.id === "out-req-matrix" ||
            a.id === "out-review-report",
        )
        .map((a) => a.id);
    case "Redacted Packet":
      return artifacts
        .filter(
          (a) =>
            a.artifactType === "Redacted Copy" ||
            a.sourceEntityType === "redaction_flag" ||
            a.id.startsWith("out-redact-"),
        )
        .map((a) => a.id);
    case "Final Readiness Bundle":
      return artifacts
        .filter(
          (a) =>
            a.id === "out-review-report" ||
            a.sourceEntityType === "submission_item",
        )
        .map((a) => a.id);
    case "Discussion Packet":
      return artifacts
        .filter((a) => a.id.startsWith("out-disc-"))
        .map((a) => a.id);
    default:
      return artifacts.map((a) => a.id);
  }
}

export function assembleOutputBundles(
  projectId: string,
  artifacts: OutputArtifact[],
  redactionFlags: RedactionFlag[],
): OutputBundle[] {
  const merged = artifactsWithRedactionPseudo(artifacts, redactionFlags);
  const t = nowIso();

  const types: OutputBundleType[] = [
    "Submission Package",
    "Client Review Packet",
    "Redacted Packet",
    "Final Readiness Bundle",
    "Discussion Packet",
  ];

  return types.map((bundleType) => {
    const artifactIds = bundleArtifactIds(bundleType, merged);
    const c = computePackagingCompleteness(bundleType, merged);
    const status = bundleStatusFromCompleteness(
      c.percent,
      c.missingRequiredTitles.length,
    );

    const titles: Record<OutputBundleType, string> = {
      "Submission Package": "Proposal submission assembly",
      "Client Review Packet": "Client review packet",
      "Redacted Packet": "FOIA / public records packet",
      "Final Readiness Bundle": "Final readiness & go / no-go",
      "Discussion Packet": "Discussion-phase workbook",
    };

    return {
      id: `bundle-${bundleType.toLowerCase().replace(/\s+/g, "-")}`,
      projectId,
      bundleType,
      title: titles[bundleType],
      status,
      artifactIds: [...new Set(artifactIds)],
      notes: c.complete
        ? "All tracked artifacts meet packaging thresholds."
        : `Gaps: ${c.missingRequiredTitles.slice(0, 4).join("; ") || c.notValidatedTitles.slice(0, 4).join("; ")}`,
      createdAt: t,
      updatedAt: t,
    };
  });
}

export function artifactsWithRedactionPseudo(
  artifacts: OutputArtifact[],
  flags: RedactionFlag[],
): OutputArtifact[] {
  const t = nowIso();
  const pseudo: OutputArtifact[] = flags.map((f) => ({
    id: `out-redact-${f.id}`,
    projectId: artifacts[0]?.projectId ?? "",
    artifactType: "Other" as const,
    title: `Redaction: ${f.entityLabel}`,
    status:
      f.status === "Cleared"
        ? ("Validated" as const)
        : f.status === "Under Review"
          ? ("In Progress" as const)
          : ("Draft" as const),
    sourceEntityType: "redaction_flag" as const,
    sourceEntityId: f.id,
    notes: f.reason,
    createdAt: t,
    updatedAt: t,
    isValidated: f.status === "Cleared",
    requiredForSubmission: false,
  }));
  return [...artifacts, ...pseudo];
}

export function summarizeRedactionPackaging(
  flags: RedactionFlag[],
  submissionItems: SubmissionItem[],
  artifacts: OutputArtifact[],
): RedactionPackagingSummary {
  const unresolved = flags.filter((f) => f.status !== "Cleared").length;
  const redactedItem = submissionItems.find((s) =>
    s.name.toLowerCase().includes("redact"),
  );
  const redactedArtifact = artifacts.find(
    (a) => a.artifactType === "Redacted Copy",
  );
  const redactedCopyReady =
    redactedArtifact != null &&
    isValidatedOutputStatus(redactedArtifact.status);

  const blockers: string[] = [];
  if (unresolved > 0) {
    blockers.push(
      `${unresolved} redaction item(s) still open or under review — resolve before redacted packet.`,
    );
  }
  if (!redactedCopyReady) {
    blockers.push("Redacted copy artifact is not validated for submission.");
  }

  const awaitingDecision = flags.filter((f) => f.status === "Open").length;
  const inReview = flags.filter((f) => f.status === "Under Review").length;
  const packetNeeded = flags.length > 0 || Boolean(redactedItem?.required);

  let redactedPacketSupport: RedactionPacketSupportState;
  if (unresolved > 0) {
    redactedPacketSupport = "blocked";
  } else if (packetNeeded && !redactedCopyReady) {
    redactedPacketSupport = "attention_needed";
  } else {
    redactedPacketSupport = "ready";
  }

  return {
    totalFlagged: flags.length,
    unresolvedCount: unresolved,
    clearedCount: flags.filter((f) => f.status === "Cleared").length,
    awaitingDecisionCount: awaitingDecision,
    inReviewCount: inReview,
    redactedPacketNeeded: packetNeeded,
    redactedCopyArtifactReady: redactedCopyReady,
    redactedPacketSupport,
    blockers,
  };
}

/** Link from a redaction item to the underlying workspace record. */
export function redactionEntitySourcePath(
  flag: RedactionFlag,
): { label: string; to: string } | null {
  switch (flag.entityType) {
    case "File":
      return { label: "Open file record", to: `/files/${flag.entityId}` };
    case "Evidence":
      return { label: "Open evidence", to: `/evidence/${flag.entityId}` };
    case "Requirement":
      return { label: "Open requirement", to: `/requirements/${flag.entityId}` };
    case "Vendor":
      return { label: "Open vendor", to: `/vendors/${flag.entityId}` };
    default:
      return { label: "Bid control center", to: "/control/submission" };
  }
}

export function redactionJustificationLabel(flag: RedactionFlag): string {
  switch (flag.status) {
    case "Open":
      return "Awaiting disposition — record legal / business judgment.";
    case "Under Review":
      return "Justification in progress — complete review before clearing.";
    case "Cleared":
      return "Disposition recorded — eligible for redacted packet inclusion.";
    default:
      return "—";
  }
}

export function redactionLikelyNeedsRedactedCopy(flag: RedactionFlag): boolean {
  return flag.status !== "Cleared";
}

/** 0–100 score for final readiness strip (derived from packaging summary). */
export function computeRedactionReadinessScore(
  summary: RedactionPackagingSummary,
): number {
  if (summary.redactedPacketSupport === "ready") return 100;
  if (summary.redactedPacketSupport === "attention_needed") return 72;
  return Math.max(25, 100 - summary.unresolvedCount * 18);
}

export type FinalDecisionGateState =
  | "blocked"
  | "not_ready"
  | "ready_client_signoff"
  | "ready_submission_assembly";

export type FinalDecisionGate = {
  state: FinalDecisionGateState;
  headline: string;
  subline: string;
};

export function computeFinalDecisionGate(input: {
  criticalIssueCount: number;
  clientSignOffReady: boolean;
  submissionAssemblyReady: boolean;
  readinessOverall: number;
}): FinalDecisionGate {
  if (input.criticalIssueCount > 0) {
    return {
      state: "blocked",
      headline: "Blocked — critical review findings are open",
      subline:
        "Resolve or formally disposition critical red-team items before treating this bid as ready for any sign-off or assembly gate.",
    };
  }
  if (input.submissionAssemblyReady) {
    return {
      state: "ready_submission_assembly",
      headline: "Ready for submission assembly",
      subline:
        "Output blockers are clear, redaction posture supports packaging, and the redacted copy artifact is validated — proceed to final manual assembly and legal check.",
    };
  }
  if (input.clientSignOffReady) {
    return {
      state: "ready_client_signoff",
      headline: "Ready for client sign-off",
      subline:
        "No critical findings at this snapshot and composite readiness supports executive / client approval — close remaining packaging items before final assembly.",
    };
  }
  if (input.readinessOverall < 55) {
    return {
      state: "not_ready",
      headline: "Not ready — readiness is still forming",
      subline:
        "Overall readiness is below a confident decision threshold. Focus on coverage, submission artifacts, and review findings before revisiting this gate.",
    };
  }
  return {
    state: "not_ready",
    headline: "Not ready — packaging and validation still in motion",
    subline:
      "Work through blockers below: submission artifacts, review issues, contract exposure, redaction items, and grounded volumes.",
  };
}

export type FinalReadinessBlockerLine = {
  id: string;
  title: string;
  detail: string;
  to?: string;
};

export function buildFinalReadinessBlockers(input: {
  artifacts: OutputArtifact[];
  reviewIssues: ReviewIssue[];
  redactionSummary: RedactionPackagingSummary;
  snapshot: BidReviewSnapshot;
}): FinalReadinessBlockerLine[] {
  const out: FinalReadinessBlockerLine[] = [];
  const act = activeIssues(input.reviewIssues);

  for (const i of act) {
    if (out.length >= 12) break;
    if (i.severity === "Critical") {
      out.push({
        id: `crit-${i.id}`,
        title: i.title,
        detail: i.suggestedFix || i.description,
        to: `/review/issues/${encodeURIComponent(i.id)}`,
      });
    }
  }

  for (const i of act) {
    if (out.length >= 12) break;
    if (i.issueType === "Contract Exposure" && i.severity === "High") {
      if (out.some((x) => x.id === `ce-${i.id}`)) continue;
      out.push({
        id: `ce-${i.id}`,
        title: `Contract exposure: ${i.title}`,
        detail: i.description,
        to: `/review/issues/${encodeURIComponent(i.id)}`,
      });
    }
  }

  if (input.redactionSummary.unresolvedCount > 0) {
    out.push({
      id: "redaction-unresolved",
      title: `${input.redactionSummary.unresolvedCount} unresolved redaction item(s)`,
      detail:
        "FOIA / public disclosure posture is not clear — clear or disposition each redaction item before final handoff.",
      to: "/output/redaction",
    });
  }

  if (
    input.redactionSummary.redactedPacketNeeded &&
    !input.redactionSummary.redactedCopyArtifactReady
  ) {
    out.push({
      id: "redacted-copy",
      title: "Redacted copy artifact not validated",
      detail:
        "The redacted submission artifact must reach Ready / Validated in Bid control for redacted packet support.",
      to: "/control/submission",
    });
  }

  const weakGround = input.snapshot.draftSections.filter((s) =>
    ["Experience", "Solution", "Risk"].includes(s.sectionType),
  );
  for (const s of weakGround) {
    if (out.length >= 12) break;
    const v = input.snapshot.activeDraftBySection[s.id];
    const hasBody = Boolean(v?.content?.trim());
    const grounded = Boolean(v?.groundingBundleId);
    if (hasBody && !grounded) {
      out.push({
        id: `ground-${s.id}`,
        title: `Weak grounding: ${s.sectionType} volume`,
        detail:
          "Scored volume has narrative but no active grounding bundle — evaluators may challenge evidence support.",
        to: `/drafts/${s.id}`,
      });
    }
  }

  const missingReq = input.artifacts.filter(
    (a) => a.requiredForSubmission && !isValidatedOutputStatus(a.status),
  );
  for (const a of missingReq) {
    if (out.length >= 12) break;
    const ref = artifactSourcePath(a);
    out.push({
      id: `art-${a.id}`,
      title: `Required artifact not validated: ${a.title}`,
      detail: `Current status: ${a.status}. Required items must reach Ready, Validated, or Locked.`,
      to: ref?.to,
    });
  }

  return out.slice(0, 12);
}

export type FinalReadinessNextAction = { id: string; label: string };

export function buildFinalReadinessNextActions(input: {
  gate: FinalDecisionGate;
  blockers: FinalReadinessBlockerLine[];
  redactionSummary: RedactionPackagingSummary;
}): FinalReadinessNextAction[] {
  const actions: FinalReadinessNextAction[] = [];
  let n = 0;
  const push = (label: string) => {
    if (actions.length >= 6) return;
    actions.push({ id: `fa-${++n}`, label });
  };

  if (input.gate.state === "blocked") {
    push("Disposition every critical review finding with owner, date, and resolution notes.");
  }
  if (input.redactionSummary.unresolvedCount > 0) {
    push("Work the redaction control table — clear items or move them through Under Review to Cleared.");
  }
  if (
    input.redactionSummary.redactedPacketNeeded &&
    !input.redactionSummary.redactedCopyArtifactReady
  ) {
    push("Validate the redacted copy submission artifact after legal review.");
  }

  const hasSub = input.blockers.some((b) => b.id.startsWith("art-"));
  if (hasSub) {
    push("Bring required submission artifacts to Ready or Validated in Bid control.");
  }
  const hasGround = input.blockers.some((b) => b.id.startsWith("ground-"));
  if (hasGround) {
    push("Attach grounding bundles to scored volumes or trim unsupported claims.");
  }

  if (input.gate.state === "ready_submission_assembly") {
    push("Run final legal review on collated PDFs and the submission upload checklist.");
  } else if (input.gate.state === "ready_client_signoff") {
    push("Schedule client sign-off readout, then close remaining packaging gaps.");
  } else if (input.gate.state === "not_ready") {
    push("Triage the critical blocker list top-to-bottom before re-checking this page.");
  }

  if (actions.length < 3) {
    push("Re-run readiness scoring after substantive edits (Review → Readiness).");
  }
  return actions.slice(0, 6);
}

export function formatChecklistExport(
  project: Project,
  artifacts: OutputArtifact[],
): string {
  const lines = [
    `# Submission package — artifact checklist`,
    `Bid: ${project.bidNumber}`,
    `${project.title}`,
    "",
    "Statuses use the output workflow: Draft | In Progress | Ready | Validated | Locked.",
    "",
    "| Artifact | Type | Status | Required for submission |",
    "|----------|------|--------|-------------------------|",
  ];
  for (const a of artifacts.filter(
    (x) =>
      x.requiredForSubmission ||
      x.artifactType === "Draft Section" ||
      x.artifactType === "Requirement Matrix",
  )) {
    lines.push(
      `| ${a.title} | ${a.artifactType} | ${a.status} | ${a.requiredForSubmission ? "yes" : "no"} |`,
    );
  }
  return lines.join("\n");
}

export function formatReadinessExport(
  project: Project,
  readiness: ReadinessScore,
  issues: ReviewIssue[],
): string {
  const s = issueSummary(issues);
  return [
    `# Bid readiness summary (BP-007)`,
    `Bid: ${project.bidNumber}`,
    `${project.title}`,
    "",
    "## Readiness scores (0–100)",
    `- Overall: ${readiness.overall}`,
    `- Submission: ${readiness.submission}`,
    `- Coverage: ${readiness.coverage}`,
    `- Grounding: ${readiness.grounding}`,
    `- Scoring alignment: ${readiness.scoring_alignment}`,
    `- Contract: ${readiness.contract_readiness}`,
    `- Discussion: ${readiness.discussion_readiness}`,
    "",
    "## Review queue (snapshot)",
    `- Active issues: ${s.active} (critical: ${s.critical})`,
    `- Submission-gap signals in review: ${s.submissionBlockers}`,
  ].join("\n");
}

export function buildBundlePayload(
  bundle: OutputBundle,
  artifacts: OutputArtifact[],
): Record<string, unknown> {
  const map = Object.fromEntries(artifacts.map((a) => [a.id, a]));
  return {
    bundle,
    artifacts: bundle.artifactIds
      .map((id) => map[id])
      .filter(Boolean),
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const clip = (
    globalThis as unknown as {
      navigator?: { clipboard?: { writeText: (t: string) => Promise<void> } };
    }
  ).navigator?.clipboard;
  if (!clip) return false;
  try {
    await clip.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function artifactSourcePath(
  artifact: OutputArtifact,
): { label: string; to: string } | null {
  if (artifact.sourceEntityType === "draft_section") {
    return { label: "Open in drafting", to: `/drafts/${artifact.sourceEntityId}` };
  }
  if (artifact.sourceEntityType === "submission_item") {
    return { label: "Bid control — submission", to: "/control/submission" };
  }
  if (artifact.sourceEntityType === "discussion_item") {
    return { label: "Bid control — discussion", to: "/control/discussion" };
  }
  if (artifact.artifactType === "Requirement Matrix") {
    return { label: "Requirements matrix", to: "/requirements" };
  }
  if (artifact.sourceEntityType === "review") {
    return { label: "Review issues", to: "/review/issues" };
  }
  return null;
}

export function snapshotFromReviewSnapshot(
  snap: BidReviewSnapshot,
): Pick<
  OutputGatherInput,
  | "submissionItems"
  | "draftSections"
  | "redactionFlags"
  | "discussionItems"
> {
  return {
    submissionItems: snap.submissionItems,
    draftSections: snap.draftSections,
    redactionFlags: snap.redactionFlags,
    discussionItems: snap.discussionItems,
  };
}

/* ——— Submission package production checklist (BP-008 Day 2) ——— */

/** Canonical S000000479 proposal assembly rows (order = solicitation-style flow). */
export type SubmissionPackageItemSpec = {
  id: string;
  packageItemLabel: string;
  category: string;
  required: boolean;
  match: (a: OutputArtifact) => boolean;
};

export const SUBMISSION_PACKAGE_ITEM_SPECS: SubmissionPackageItemSpec[] = [
  {
    id: "proposal-signature",
    packageItemLabel: "Proposal Signature Page",
    category: "Forms",
    required: true,
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      /signature/i.test(a.title),
  },
  {
    id: "subcontractors",
    packageItemLabel: "Proposed Subcontractors Form",
    category: "Forms",
    required: true,
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      /subcontractor/i.test(a.title),
  },
  {
    id: "recommended-options",
    packageItemLabel: "Recommended Options Form",
    category: "Forms",
    required: true,
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      /recommended/i.test(a.title),
  },
  {
    id: "rfp-requirements",
    packageItemLabel: "S000000479 Minimum RFP Requirements",
    category: "Compliance",
    required: true,
    match: (a) => a.id === "out-req-matrix",
  },
  {
    id: "experience",
    packageItemLabel: "Experience (scored volume)",
    category: "Technical volumes",
    required: true,
    match: (a) =>
      a.artifactType === "Draft Section" && a.notes === "Experience",
  },
  {
    id: "solution",
    packageItemLabel: "Solution (scored volume)",
    category: "Technical volumes",
    required: true,
    match: (a) =>
      a.artifactType === "Draft Section" && a.notes === "Solution",
  },
  {
    id: "risk",
    packageItemLabel: "Risk (scored volume)",
    category: "Technical volumes",
    required: true,
    match: (a) =>
      a.artifactType === "Draft Section" && a.notes === "Risk",
  },
  {
    id: "eo-policy",
    packageItemLabel: "Equal Opportunity Policy",
    category: "Compliance",
    required: true,
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      /equal|opportunity|eo\b/i.test(a.title),
  },
  {
    id: "price-sheet",
    packageItemLabel: "Official Solicitation Price Sheet",
    category: "Pricing",
    required: true,
    match: (a) =>
      a.artifactType === "Price Sheet Support" ||
      (a.sourceEntityType === "submission_item" &&
        /price|pricing/i.test(a.title)),
  },
  {
    id: "redacted-copy",
    packageItemLabel: "Redacted copy (if applicable)",
    category: "Disclosure",
    required: false,
    match: (a) =>
      a.artifactType === "Redacted Copy" ||
      (a.sourceEntityType === "submission_item" &&
        /redact/i.test(a.title)),
  },
  {
    id: "eo-98-04",
    packageItemLabel: "EO 98-04 Contract and Grant Disclosure Form",
    category: "Pre-award",
    required: false,
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      /eo\s*98|98-04|grant.*disclos/i.test(a.title),
  },
  {
    id: "vpat",
    packageItemLabel: "VPAT (if applicable)",
    category: "If applicable",
    required: false,
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      /vpat|voluntary.*product|accessibility/i.test(a.title),
  },
];

export type SubmissionPackageChecklistRow = {
  specId: string;
  packageItemLabel: string;
  category: string;
  required: boolean;
  sourceArtifact: OutputArtifact | null;
  owner: string | null;
  blocker: boolean;
  fitForAssembly: boolean;
  explanation: string;
};

function submissionOwnerForArtifact(
  artifact: OutputArtifact | null,
  submissionItems: SubmissionItem[],
): string | null {
  if (!artifact || artifact.sourceEntityType !== "submission_item") {
    return null;
  }
  const sub = submissionItems.find((s) => s.id === artifact.sourceEntityId);
  return sub?.owner ?? null;
}

export function buildSubmissionPackageChecklistRows(
  artifacts: OutputArtifact[],
  submissionItems: SubmissionItem[],
): SubmissionPackageChecklistRow[] {
  return SUBMISSION_PACKAGE_ITEM_SPECS.map((spec) => {
    const sourceArtifact = artifacts.find(spec.match) ?? null;
    const owner = submissionOwnerForArtifact(sourceArtifact, submissionItems);
    const fitForAssembly = Boolean(
      sourceArtifact && sourceArtifact.isValidated,
    );
    const blocker = spec.required && !fitForAssembly;
    let explanation = "No source artifact linked for this solicitation item yet.";
    if (sourceArtifact) {
      explanation = sourceArtifact.notes?.trim()
        ? sourceArtifact.notes
        : `${sourceArtifact.artifactType} · ${sourceArtifact.title}`;
    }
    return {
      specId: spec.id,
      packageItemLabel: spec.packageItemLabel,
      category: spec.category,
      required: spec.required,
      sourceArtifact,
      owner,
      blocker,
      fitForAssembly,
      explanation,
    };
  });
}

export type SubmissionPackageSummaryStats = {
  totalRequiredItems: number;
  completeItems: number;
  missingItems: number;
  blockedItems: number;
  validatedItems: number;
  readyForFinalAssembly: boolean;
};

export function computeSubmissionPackageSummaryStats(
  rows: SubmissionPackageChecklistRow[],
): SubmissionPackageSummaryStats {
  const required = rows.filter((r) => r.required);
  const completeItems = required.filter((r) => r.fitForAssembly).length;
  const missingItems = required.filter((r) => !r.sourceArtifact).length;
  const blockedItems = required.filter(
    (r) => r.sourceArtifact && !r.sourceArtifact.isValidated,
  ).length;
  const validatedItems = rows.filter(
    (r) => r.sourceArtifact?.isValidated,
  ).length;

  return {
    totalRequiredItems: required.length,
    completeItems,
    missingItems,
    blockedItems,
    validatedItems,
    readyForFinalAssembly: missingItems === 0 && blockedItems === 0,
  };
}

export type SubmissionAssemblyState =
  | "not_ready"
  | "needs_review"
  | "ready_for_final_assembly"
  | "ready_for_submission_handoff";

export type SubmissionAssemblyAssessment = {
  state: SubmissionAssemblyState;
  headline: string;
  subline: string;
};

export function computeSubmissionAssemblyAssessment(input: {
  stats: SubmissionPackageSummaryStats;
  redactionUnresolved: number;
  redactedChecklistRow: SubmissionPackageChecklistRow | undefined;
}): SubmissionAssemblyAssessment {
  const { stats, redactionUnresolved, redactedChecklistRow } = input;
  const redactedOk =
    redactedChecklistRow?.fitForAssembly === true &&
    redactionUnresolved === 0;

  if (stats.missingItems > 0) {
    return {
      state: "not_ready",
      headline: "Not ready — required solicitation items are missing",
      subline:
        "Link or complete every required row below before treating the submission package as production-ready.",
    };
  }

  if (stats.blockedItems > 0) {
    return {
      state: "needs_review",
      headline: "Needs review — required items are not validated",
      subline:
        "Artifacts are linked but at least one required item is still Draft or In Progress. Move each to Ready, Validated, or Locked in Bid control and drafting.",
    };
  }

  if (!redactedOk) {
    return {
      state: "ready_for_final_assembly",
      headline: "Ready for final assembly — clear redaction posture",
      subline:
        redactionUnresolved > 0
          ? `${redactionUnresolved} redaction item(s) still open — align the redacted packet before handoff.`
          : "Redacted copy or related submission item is not yet validated — finish disclosure review.",
    };
  }

  return {
    state: "ready_for_submission_handoff",
    headline: "Ready for submission handoff",
    subline:
      "Required items are validated and redaction posture is clear — proceed with manual submission assembly and legal sign-off.",
  };
}

export type SubmissionPackageBlockerLine = {
  id: string;
  title: string;
  detail: string;
  to?: string;
};

export function buildSubmissionPackageBlockers(input: {
  rows: SubmissionPackageChecklistRow[];
  redactionUnresolved: number;
}): SubmissionPackageBlockerLine[] {
  const out: SubmissionPackageBlockerLine[] = [];
  for (const r of input.rows) {
    if (!r.required) continue;
    if (!r.sourceArtifact) {
      out.push({
        id: `miss-${r.specId}`,
        title: `Missing required item: ${r.packageItemLabel}`,
        detail:
          "No tracked source artifact matches this solicitation row — create or link work in Bid control or drafting.",
        to:
          r.specId === "rfp-requirements"
            ? "/requirements"
            : r.category === "Technical volumes"
              ? "/drafts"
              : "/control/submission",
      });
      continue;
    }
    if (!r.sourceArtifact.isValidated) {
      out.push({
        id: `block-${r.specId}`,
        title: `Not validated: ${r.packageItemLabel}`,
        detail: `Current status: ${r.sourceArtifact.status}. Required items must reach Ready, Validated, or Locked.`,
        to: artifactSourcePath(r.sourceArtifact)?.to,
      });
    }
  }
  if (input.redactionUnresolved > 0) {
    out.push({
      id: "redaction-flags",
      title: "Redaction items unresolved for submission package",
      detail: `${input.redactionUnresolved} open redaction item(s) — clear in the redacted packet workspace before final disclosure.`,
      to: "/output/redaction",
    });
  }
  return out.slice(0, 12);
}

export function formatSubmissionPackageReadinessExport(
  project: Project,
  stats: SubmissionPackageSummaryStats,
  assessment: SubmissionAssemblyAssessment,
  rows: SubmissionPackageChecklistRow[],
): string {
  const lines = [
    `# Submission package — readiness report`,
    `Bid: ${project.bidNumber}`,
    project.title,
    "",
    "## Assembly assessment",
    assessment.headline,
    assessment.subline,
    "",
    "## Counts",
    `- Required solicitation items: ${stats.totalRequiredItems}`,
    `- Required items meeting packaging threshold: ${stats.completeItems}`,
    `- Missing source link: ${stats.missingItems}`,
    `- Required items below threshold (blockers): ${stats.blockedItems}`,
    `- All rows meeting threshold: ${stats.validatedItems}`,
    "",
    "| Solicitation item | Required | Linked | Artifact status | Packaging threshold met |",
    "|---------------------|----------|--------|-----------------|---------------------------|",
  ];
  for (const r of rows) {
    const linked = r.sourceArtifact ? "yes" : "no";
    const st = r.sourceArtifact?.status ?? "—";
    const fit = r.fitForAssembly ? "yes" : "no";
    lines.push(
      `| ${r.packageItemLabel} | ${r.required ? "yes" : "no"} | ${linked} | ${st} | ${fit} |`,
    );
  }
  return lines.join("\n");
}
