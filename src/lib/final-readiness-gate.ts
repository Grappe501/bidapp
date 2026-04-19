import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import { activeIssues } from "@/lib/review-utils";
import { S000000479_BID_NUMBER } from "@/data/canonical-rfp-s000000479";
import type {
  ArbuySolicitationCompliance,
  EvaluatorSimulationResult,
  FinalReadinessGate,
  FinalReadinessOverallState,
  ReadinessScore,
  RedactionPackagingSummary,
  ReviewIssue,
  TechnicalProposalPacketCompliance,
} from "@/types";
import type { VendorDecisionAssessment } from "@/lib/vendor-decision-gate";
import type { GroundingBundlePricing } from "@/types/pricing-model";
import type {
  SubmissionPackageChecklistRow,
  SubmissionPackageSummaryStats,
} from "@/lib/output-utils";

function scoredVolumesGrounded(snapshot: BidReviewSnapshot): boolean {
  for (const t of ["Experience", "Solution", "Risk"] as const) {
    const sec = snapshot.draftSections.find((s) => s.sectionType === t);
    if (!sec) continue;
    const v = snapshot.activeDraftBySection[sec.id];
    if (!v?.content?.trim()) continue;
    if (!v.groundingBundleId) return false;
  }
  return true;
}

function criticalUnsupportedOpen(issues: ReviewIssue[]): boolean {
  const act = activeIssues(issues);
  return act.some(
    (i) =>
      i.issueType === "Unsupported Claim" &&
      (i.severity === "Critical" || i.severity === "High"),
  );
}

function criticalMitigationGaps(issues: ReviewIssue[]): boolean {
  const act = activeIssues(issues);
  return act.some(
    (i) =>
      i.issueType === "Missing Mitigation Proof" && i.severity === "Critical",
  );
}

/**
 * Hard submission gate combining submission package, pricing, proof, review, evaluator posture, and redaction.
 */
export function computeFinalReadinessGate(input: {
  bidNumber: string;
  readiness: ReadinessScore;
  reviewIssues: ReviewIssue[];
  snapshot: BidReviewSnapshot;
  redactionSummary: RedactionPackagingSummary;
  checklistStats: SubmissionPackageSummaryStats;
  checklistRows: SubmissionPackageChecklistRow[];
  pricingLayer: GroundingBundlePricing;
  evaluator: EvaluatorSimulationResult;
  technicalProposalPacket: TechnicalProposalPacketCompliance | null;
  arbuySolicitation: ArbuySolicitationCompliance | null;
  /** When set, vendor/stack decision quality can block or downgrade readiness. */
  vendorDecision?: VendorDecisionAssessment | null;
}): FinalReadinessGate {
  const {
    bidNumber,
    readiness,
    reviewIssues,
    snapshot,
    redactionSummary,
    checklistStats,
    checklistRows,
    pricingLayer,
    evaluator,
    technicalProposalPacket,
    arbuySolicitation,
    vendorDecision: vd,
  } = input;

  const act = activeIssues(reviewIssues);
  const criticalOpen = act.some((i) => i.severity === "Critical");

  const requiredArtifactsComplete =
    checklistStats.missingItems === 0 && checklistStats.blockedItems === 0;

  const pricingReady =
    bidNumber === S000000479_BID_NUMBER
      ? pricingLayer.ready
      : pricingLayer.model.items.length > 0 && pricingLayer.contractCompliant;

  const contractReady =
    readiness.contract_readiness >= 56 &&
    !act.some(
      (i) =>
        i.issueType === "Contract Exposure" &&
        (i.severity === "Critical" || i.severity === "High"),
    );

  const groundedReviewReady =
    scoredVolumesGrounded(snapshot) && readiness.grounding >= 54;

  const unsupportedClaimsResolved = !criticalUnsupportedOpen(reviewIssues);

  const criticalRisksAddressed = !criticalMitigationGaps(reviewIssues);

  const evaluatorScoreViable =
    evaluator.overallAssessment !== "not_ready" &&
    evaluator.technical.totalTechnicalScore >= 265;

  const redactionReady =
    redactionSummary.unresolvedCount === 0 &&
    (redactionSummary.redactedPacketSupport === "ready" ||
      (!redactionSummary.redactedPacketNeeded &&
        redactionSummary.unresolvedCount === 0));

  const blockers: string[] = [];
  const warnings: string[] = [];
  const actions: string[] = [];

  const vendorStrategyViable = vd ? vd.vendorStrategyViable : true;
  const vendorDecisionBlockers = vd?.blockers ?? [];
  const vendorDecisionWarnings = vd?.warnings ?? [];

  if (vendorDecisionBlockers.length > 0) {
    for (const b of vendorDecisionBlockers) {
      if (!blockers.includes(b)) blockers.push(b);
    }
  }
  if (vendorDecisionWarnings.length > 0) {
    for (const w of vendorDecisionWarnings) {
      if (!warnings.includes(w)) warnings.push(w);
    }
  }

  if (criticalOpen) {
    blockers.push("Critical review findings are still open — disposition before submission.");
  }
  if (checklistStats.missingItems > 0) {
    blockers.push(
      `Required solicitation items are not linked (${checklistStats.missingItems} missing).`,
    );
  }
  if (checklistStats.blockedItems > 0) {
    blockers.push(
      `Required items are linked but not validated (${checklistStats.blockedItems} blocked).`,
    );
  }
  if (!pricingReady) {
    blockers.push(
      bidNumber === S000000479_BID_NUMBER
        ? "Pricing is not structure-ready for this solicitation (RFP coverage and/or contract-valid totals)."
        : "Pricing workbook is incomplete or not contract-compliant.",
    );
  }
  if (!unsupportedClaimsResolved) {
    blockers.push("High-severity unsupported claims remain open.");
  }
  if (!groundedReviewReady) {
    blockers.push(
      "Scored volumes with body text must carry grounding bundles before submission.",
    );
  }
  if (!evaluatorScoreViable) {
    blockers.push(
      "Evaluator simulation shows not-ready posture or technical score below a defensible floor.",
    );
  }
  if (!criticalRisksAddressed) {
    blockers.push("Critical-severity mitigation gaps remain in the risk narrative.");
  }

  if (
    technicalProposalPacket?.applicable &&
    !technicalProposalPacket.readyForPacketAssembly
  ) {
    blockers.push(
      "Technical Proposal Packet requirements not satisfied — core checklist, page limits, and/or no-links rule for scored volumes.",
    );
  }

  if (arbuySolicitation?.applicable && !arbuySolicitation.ready) {
    blockers.push(
      "ARBuy solicitation is incomplete — upload/rename files to match required ARBuy attachments and ensure the official price sheet and structured pricing support are present.",
    );
  }

  if (redactionSummary.unresolvedCount > 0) {
    warnings.push(
      `${redactionSummary.unresolvedCount} redaction item(s) unresolved — disclosure posture may block public packet.`,
    );
    actions.push("Clear or disposition every redaction flag before handoff.");
  }
  if (
    redactionSummary.redactedPacketNeeded &&
    !redactionSummary.redactedCopyArtifactReady
  ) {
    warnings.push("Redacted copy artifact is not validated for solicitation requirements.");
  }
  if (!contractReady) {
    warnings.push("Contract readiness or exposure issues may surface in clarification.");
  }
  if (evaluator.overallAssessment === "fragile") {
    warnings.push(
      "Evaluator posture is fragile — strengthen proof and consistency before expecting a competitive score.",
    );
  }

  if (!pricingLayer.parsed && bidNumber === S000000479_BID_NUMBER && pricingLayer.ready) {
    warnings.push(
      "Canonical pricing scaffold may be in use — confirm live workbook JSON on the price sheet when available.",
    );
  }
  if (
    technicalProposalPacket?.applicable &&
    technicalProposalPacket.issues.length > 0 &&
    technicalProposalPacket.readyForPacketAssembly
  ) {
    for (const line of technicalProposalPacket.issues.slice(0, 3)) {
      if (!warnings.includes(line)) warnings.push(line);
    }
  }

  if (arbuySolicitation?.applicable && arbuySolicitation.ready) {
    for (const line of arbuySolicitation.issues) {
      if (!warnings.includes(line)) warnings.push(line);
    }
  }

  const redactedRow = checklistRows.find((r) => r.specId === "redacted-copy");
  if (
    redactedRow?.required &&
    !redactedRow.fitForAssembly &&
    redactionSummary.redactedPacketNeeded
  ) {
    blockers.push("Redacted copy solicitation row is required but not packaging-ready.");
  }

  let overallState: FinalReadinessOverallState;

  const packetHardStop =
    technicalProposalPacket?.applicable === true &&
    !technicalProposalPacket.readyForPacketAssembly;

  const arbuyHardStop =
    arbuySolicitation?.applicable === true && !arbuySolicitation.ready;

  const vendorHardStop = vendorDecisionBlockers.length > 0;

  const hardStop =
    criticalOpen ||
    checklistStats.missingItems > 0 ||
    !pricingReady ||
    !unsupportedClaimsResolved ||
    (bidNumber === S000000479_BID_NUMBER && !pricingLayer.contractCompliant) ||
    packetHardStop ||
    arbuyHardStop ||
    vendorHardStop;

  if (
    hardStop ||
    !groundedReviewReady ||
    checklistStats.blockedItems > 0 ||
    !evaluatorScoreViable ||
    !criticalRisksAddressed ||
    !vendorStrategyViable
  ) {
    overallState =
      criticalOpen ||
      checklistStats.missingItems > 0 ||
      !pricingReady ||
      packetHardStop ||
      vendorHardStop
        ? "blocked"
        : "not_ready";
  } else if (
    warnings.length > 0 ||
    !redactionReady ||
    !contractReady ||
    evaluator.overallAssessment === "fragile"
  ) {
    overallState = "ready_with_risk";
  } else {
    overallState = "ready_to_submit";
  }

  if (overallState === "ready_to_submit" && warnings.length > 3) {
    overallState = "ready_with_risk";
  }

  const blockerCount = blockers.length;

  if (actions.length < 4) {
    if (!groundedReviewReady) {
      actions.push("Attach grounding bundles to Experience, Solution, and Risk where text exists.");
    }
    if (!evaluatorScoreViable) {
      actions.push("Address top evaluator upgrade actions (Review → Readiness → scorecard).");
    }
    if (checklistStats.blockedItems > 0) {
      actions.push("Move every required submission artifact to Ready / Validated / Locked.");
    }
  }

  let submissionRecommendation = "";
  switch (overallState) {
    case "ready_to_submit":
      submissionRecommendation =
        "Ready to submit — remaining items are minor; run final legal and portal checks.";
      break;
    case "ready_with_risk":
      submissionRecommendation =
        "Ready with risk — tighten pricing narrative, redaction posture, and interview defense before upload.";
      break;
    case "not_ready":
      submissionRecommendation =
        "Not ready — close packaging validation, proof, and evaluator gaps before treating submission as safe.";
      break;
    case "blocked":
      submissionRecommendation =
        "Blocked — resolve critical findings, required artifacts, or pricing compliance before upload.";
      break;
    default:
      submissionRecommendation = "Review gate inputs.";
  }

  return {
    overallState,
    requiredArtifactsComplete,
    pricingReady,
    contractReady,
    groundedReviewReady,
    unsupportedClaimsResolved,
    criticalRisksAddressed,
    evaluatorScoreViable,
    redactionReady,
    blockerCount,
    blockers: blockers.slice(0, 14),
    warnings: warnings.slice(0, 12),
    requiredActionsBeforeSubmit: actions.slice(0, 10),
    submissionRecommendation,
    technicalProposalPacket,
    arbuySolicitation,
    vendorStrategyViable,
    vendorDecisionBlockers,
    vendorDecisionWarnings,
  };
}
