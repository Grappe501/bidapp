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
  ReviewIssue,
  SubmissionItem,
  SubmissionItemStatus,
} from "@/types";

const SUBMISSION_OK = new Set<OutputStatus>(["Ready", "Validated", "Locked"]);

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
    ["Experience", "Solution", "Risk", "Executive Summary", "Architecture Narrative"].includes(
      a.notes,
    );

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
      `${unresolved} redaction flag(s) still open or under review — resolve before public packet.`,
    );
  }
  if (!redactedCopyReady) {
    blockers.push("Redacted copy submission item is not validated.");
  }

  return {
    totalFlagged: flags.length,
    unresolvedCount: unresolved,
    clearedCount: flags.filter((f) => f.status === "Cleared").length,
    redactedPacketNeeded: flags.length > 0 || Boolean(redactedItem?.required),
    redactedCopyArtifactReady: redactedCopyReady,
    blockers,
  };
}

export function formatChecklistExport(
  project: Project,
  artifacts: OutputArtifact[],
): string {
  const lines = [
    `# Submission package checklist — ${project.bidNumber}`,
    `${project.title}`,
    "",
    "| Artifact | Type | Status | Required |",
    "|----------|------|--------|----------|",
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
    `Readiness summary — ${project.bidNumber}`,
    `Project: ${project.title}`,
    "",
    `Overall: ${readiness.overall}`,
    `Submission: ${readiness.submission}`,
    `Coverage: ${readiness.coverage}`,
    `Grounding: ${readiness.grounding}`,
    `Scoring alignment: ${readiness.scoring_alignment}`,
    `Contract: ${readiness.contract_readiness}`,
    `Discussion: ${readiness.discussion_readiness}`,
    "",
    `Active issues: ${s.active} (critical: ${s.critical})`,
    `Submission blockers (review): ${s.submissionBlockers}`,
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
