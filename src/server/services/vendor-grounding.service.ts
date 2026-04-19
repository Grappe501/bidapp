import type {
  GroundingBundleVendorIntelligence,
  GroundingBundleVendorInterviewIntelligence,
  VendorClaimValidationRecord,
  VendorInterviewNormalizedAnswer,
} from "../../types";
import { listVendorsByProject } from "../repositories/vendor.repo";
import {
  listIntelligenceFactsForVendor,
} from "../repositories/intelligence.repo";
import { getVendorById, listVendorClaimsByVendorId } from "../repositories/vendor.repo";
import {
  listVendorFitDimensionsByVendor,
  listVendorIntegrationRequirementsByVendor,
} from "../repositories/vendor-intelligence.repo";
import {
  getInterviewReadinessSummaryForVendor,
  getVendorInterviewAnswerByQuestion,
  getVendorInterviewAssessmentByQuestion,
  listVendorInterviewQuestionsFull,
} from "../repositories/vendor-interview.repo";
import { listVendorClaimValidations } from "../repositories/vendor-claim-validation.repo";
import { buildClaimValidationSummaryFromRows, effectiveSupportLevelFromRow } from "./vendor-claim-validation-merge.service";
import { listVendorFailureSimulationForApi } from "./vendor-failure-mode.service";
import { listVendorRoleFitForApi } from "./vendor-role-fit.service";
import { computeVendorPricingReality } from "./pricing-reality.service";

async function buildInterviewIntelligenceBundle(
  vendorId: string,
): Promise<GroundingBundleVendorInterviewIntelligence | undefined> {
  const summary = await getInterviewReadinessSummaryForVendor(vendorId);
  const questions = await listVendorInterviewQuestionsFull(vendorId);
  if (questions.length === 0) return undefined;

  const topAnswered: GroundingBundleVendorInterviewIntelligence["topAnsweredQuestions"] =
    [];
  const unresolvedP1: string[] = [];
  const commitments: string[] = [];
  const strengths: string[] = [];
  const risks: string[] = [];
  const maloneDeps: string[] = [];
  const integCommit: string[] = [];
  const timelineCommit: string[] = [];

  for (const q of questions) {
    if (q.priority === "P1" && (q.answerStatus === "unanswered" || q.answerStatus === "needs_follow_up")) {
      unresolvedP1.push(q.question.slice(0, 240));
    }
    const ans = await getVendorInterviewAnswerByQuestion(q.id);
    const asmt = await getVendorInterviewAssessmentByQuestion(q.id);
    if (!ans?.answerText.trim() || !asmt) continue;
    const nj = ans.normalizedJson as unknown as VendorInterviewNormalizedAnswer | undefined;
    const norm =
      nj && typeof nj === "object" && "summary" in (nj as object)
        ? nj
        : undefined;
    if (asmt.score0To5 >= 3 && norm?.summary) {
      topAnswered.push({
        question: q.question.slice(0, 400),
        category: q.category,
        priority: q.priority,
        summary: norm.summary.slice(0, 800),
        answerQuality0To5: asmt.score0To5,
      });
    }
    if (norm?.commitments?.length) commitments.push(...norm.commitments.slice(0, 8));
    if (asmt.score0To5 >= 4) strengths.push(norm?.summary?.slice(0, 200) ?? "");
    if (asmt.riskFlag || asmt.score0To5 <= 2) {
      risks.push(asmt.rationale.slice(0, 220));
    }
    if (norm?.dependenciesOnMalone?.length) {
      maloneDeps.push(...norm.dependenciesOnMalone.slice(0, 6));
    }
    if (norm?.integrationSignals?.length) {
      integCommit.push(...norm.integrationSignals.slice(0, 6));
    }
    if (norm?.timelineSignals?.length) {
      timelineCommit.push(...norm.timelineSignals.slice(0, 6));
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    readinessSummary: summary,
    topAnsweredQuestions: topAnswered.slice(0, 12),
    unresolvedP1Questions: unresolvedP1.slice(0, 12),
    commitments: [...new Set(commitments)].slice(0, 24),
    strengths: strengths.filter(Boolean).slice(0, 10),
    risks: [...new Set(risks)].slice(0, 12),
    maloneDependencies: [...new Set(maloneDeps)].slice(0, 14),
    integrationCommitments: [...new Set(integCommit)].slice(0, 14),
    timelineCommitments: [...new Set(timelineCommit)].slice(0, 14),
  };
}

export async function loadVendorIntelligenceForBundle(input: {
  projectId: string;
  vendorId: string;
}): Promise<GroundingBundleVendorIntelligence | null> {
  const v = await getVendorById(input.vendorId);
  if (!v || v.projectId !== input.projectId) return null;

  const [
    fitDimensions,
    claims,
    facts,
    interview,
    integration,
    interviewIntelligence,
    claimDb,
    failureSim,
    roleFit,
    pricingReality,
  ] = await Promise.all([
    listVendorFitDimensionsByVendor(input.vendorId),
    listVendorClaimsByVendorId(input.vendorId, 48),
    listIntelligenceFactsForVendor({
      projectId: input.projectId,
      vendorId: input.vendorId,
      limit: 48,
    }),
    listVendorInterviewQuestionsFull(input.vendorId),
    listVendorIntegrationRequirementsByVendor(input.vendorId),
    buildInterviewIntelligenceBundle(input.vendorId),
    listVendorClaimValidations(input.vendorId),
    listVendorFailureSimulationForApi({
      projectId: input.projectId,
      vendorId: input.vendorId,
    }),
    listVendorRoleFitForApi({
      projectId: input.projectId,
      vendorId: input.vendorId,
    }),
    computeVendorPricingReality({
      projectId: input.projectId,
      vendorId: input.vendorId,
    }),
  ]);

  const claimValidation =
    claimDb.length > 0
      ? {
          summary: buildClaimValidationSummaryFromRows(claimDb),
          rows: claimDb.map(
            (r): VendorClaimValidationRecord => ({
              id: r.id,
              normalizedClaimKey: r.normalizedClaimKey,
              claimText: r.claimText,
              machineClaimText: r.machineClaimText,
              claimTextLocked: r.claimTextLocked,
              claimCategory: String(r.claimCategory),
              claimSourceType: r.claimSourceType,
              supportLevel: r.supportLevel as VendorClaimValidationRecord["supportLevel"],
              effectiveSupportLevel: effectiveSupportLevelFromRow(
                r,
              ) as VendorClaimValidationRecord["effectiveSupportLevel"],
              supportLevelOverride: r.supportLevelOverride,
              contradictionStatus:
                r.contradictionStatus as VendorClaimValidationRecord["contradictionStatus"],
              confidence: r.confidence as VendorClaimValidationRecord["confidence"],
              needsFollowUp: r.needsFollowUp,
              followUpReason: r.followUpReason,
              scoringImpact: r.scoringImpact as VendorClaimValidationRecord["scoringImpact"],
              rationale: r.rationale,
              machineRationale: r.machineRationale,
              humanNote: r.humanNote,
              isCritical: r.isCritical,
              evidenceSourceIds: r.evidenceSourceIds,
              supportingFactIds: r.supportingFactIds,
              contradictingFactIds: r.contradictingFactIds,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            }),
          ),
        }
      : undefined;

  const failureSimulation =
    failureSim.summary && failureSim.modes.length > 0
      ? { summary: failureSim.summary, modes: failureSim.modes }
      : undefined;

  const roleFitBundle =
    roleFit.summary && roleFit.roles.length > 0
      ? { summary: roleFit.summary, roles: roleFit.roles }
      : undefined;

  return {
    vendorId: v.id,
    vendorName: v.name,
    fitDimensions: fitDimensions.map((d) => ({
      dimensionKey: d.dimensionKey,
      score: d.score,
      confidence: d.confidence,
      rationale: d.rationale,
      sourceIds: d.sourceIds,
    })),
    vendorClaims: claims.map((c) => ({
      id: c.id,
      claimText: c.claimText,
      validationStatus: c.validationStatus,
      credibility: c.credibility,
      confidence: c.confidence,
      claimCategory: c.claimCategory,
      sourceId: c.sourceId,
    })),
    intelligenceFacts: facts.map((f) => ({
      id: f.id,
      factType: f.factType,
      factText: f.factText,
      credibility: f.credibility,
      confidence: f.confidence,
      sourceId: f.sourceId,
    })),
    interviewQuestions: interview.map((q) => ({
      id: q.id,
      question: q.question,
      category: q.category,
      priority: q.priority,
      whyItMatters: q.whyItMatters,
      riskIfUnanswered: q.riskIfUnanswered,
      answerStatus: q.answerStatus,
    })),
    integrationRequirements: integration.map((r) => ({
      requirementKey: r.requirementKey,
      status: r.status,
      evidence: r.evidence,
    })),
    interviewIntelligence,
    claimValidation,
    failureSimulation,
    roleFit: roleFitBundle,
    pricingReality,
  };
}

/** Client review / final bundle export: all vendors with computed intelligence slices. */
export async function buildVendorIntelligenceProjectExport(projectId: string): Promise<{
  vendors: GroundingBundleVendorIntelligence[];
  vendorComparisonNote: string | null;
}> {
  const list = await listVendorsByProject(projectId);
  const vendors: GroundingBundleVendorIntelligence[] = [];
  for (const v of list) {
    const vi = await loadVendorIntelligenceForBundle({
      projectId,
      vendorId: v.id,
    });
    if (vi) vendors.push(vi);
  }
  return {
    vendors,
    vendorComparisonNote:
      vendors.length > 1
        ? "Multiple vendors: compare fit dimension scores and integration requirement rows; justify selection with cited claims only."
        : null,
  };
}
