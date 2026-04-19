import type {
  CompetitorAwareSimulationResult,
  GroundingBundleCompetitorContext,
  VendorDecisionSynthesis,
} from "../../types";
import {
  buildCompetitorInterviewQuestions,
  buildHeatmapMatrix,
  buildPointLossComparisons,
  buildRecommendation,
  buildVendorComparisonEntry,
} from "../lib/competitor-scoring";
import {
  listArchitectureComponentsByVendorInProject,
  listArchitectureOptionsByProject,
} from "../repositories/architecture.repo";
import { listIntelligenceFactsForVendor } from "../repositories/intelligence.repo";
import { listRequirementsByProject } from "../repositories/requirement.repo";
import {
  getVendorById,
  listVendorClaimsByVendorId,
  listVendorsByProject,
} from "../repositories/vendor.repo";
import {
  listVendorFitDimensionsByVendor,
  listVendorIntegrationRequirementsByVendor,
} from "../repositories/vendor-intelligence.repo";
import {
  getInterviewReadinessSummaryForVendor,
  getProjectInterviewReadinessSummary,
} from "../repositories/vendor-interview.repo";
import { listVendorClaimValidations } from "../repositories/vendor-claim-validation.repo";
import { buildClaimValidationSummaryFromRows } from "./vendor-claim-validation-merge.service";
import { runVendorClaimValidation } from "./vendor-claim-validation.service";
import {
  buildFailureSimulationSummary,
  runVendorFailureSimulation,
} from "./vendor-failure-mode.service";
import { listVendorFailureModes } from "../repositories/vendor-failure-mode.repo";
import { runVendorRoleFitAnalysis } from "./vendor-role-fit.service";
import { computeVendorPricingReality } from "./pricing-reality.service";
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function tokenOverlap(a: string, b: string): number {
  const as = new Set(norm(a).split(/\s+/).filter((w) => w.length > 3));
  const bs = norm(b);
  let n = 0;
  for (const w of as) {
    if (w && bs.includes(w)) n++;
  }
  return n;
}

function mandatoryReqOverlapRatio(
  corpus: string,
  reqs: Awaited<ReturnType<typeof listRequirementsByProject>>,
): number {
  const mand = reqs.filter((r) => r.mandatory);
  if (mand.length === 0) return 0.55;
  let hits = 0;
  const c = corpus.slice(0, 120_000);
  for (const r of mand) {
    const t = `${r.title} ${r.summary}`;
    if (tokenOverlap(t, c) >= 2) hits++;
  }
  return hits / mand.length;
}

/**
 * Compares shortlisted vendors for THIS bid: architecture, RFP overlap, fit rows, claims, facts.
 */
export async function runCompetitorAwareSimulation(input: {
  projectId: string;
  comparedVendorIds: string[];
  architectureOptionId?: string | null;
}): Promise<CompetitorAwareSimulationResult> {
  const ids = [...new Set(input.comparedVendorIds.map((x) => x.trim()).filter(Boolean))];
  if (ids.length === 0) {
    throw new Error("At least one vendor id required");
  }

  const reqs = await listRequirementsByProject(input.projectId);
  const archOpts = await listArchitectureOptionsByProject(input.projectId);
  const archOpt = input.architectureOptionId
    ? archOpts.find((o) => o.id === input.architectureOptionId)
    : archOpts.find((o) => o.recommended) ?? archOpts[0];

  const entries = [];
  for (const vid of ids) {
    const v = await getVendorById(vid);
    if (!v || v.projectId !== input.projectId) continue;

    const [dims, claims, facts, integration, archUse, interviewIr] = await Promise.all([
      listVendorFitDimensionsByVendor(vid),
      listVendorClaimsByVendorId(vid, 100),
      listIntelligenceFactsForVendor({ projectId: input.projectId, vendorId: vid, limit: 80 }),
      listVendorIntegrationRequirementsByVendor(vid),
      listArchitectureComponentsByVendorInProject({
        projectId: input.projectId,
        vendorId: vid,
      }),
      getInterviewReadinessSummaryForVendor(vid),
    ]);

    await runVendorClaimValidation({ projectId: input.projectId, vendorId: vid });
    const valRows = await listVendorClaimValidations(vid);
    const claimValidationSummary = buildClaimValidationSummaryFromRows(valRows);

    const roleFitResult = await runVendorRoleFitAnalysis({
      projectId: input.projectId,
      vendorId: vid,
      architectureOptionId: archOpt?.id ?? input.architectureOptionId ?? null,
    });

    await runVendorFailureSimulation({
      projectId: input.projectId,
      vendorId: vid,
      architectureOptionId: archOpt?.id ?? input.architectureOptionId ?? null,
    });
    const failureRows = await listVendorFailureModes({
      projectId: input.projectId,
      vendorId: vid,
    });
    const failureResilienceSummary = buildFailureSimulationSummary(failureRows);

    const pricingReality = await computeVendorPricingReality({
      projectId: input.projectId,
      vendorId: vid,
    });

    const fitByKey: Record<
      string,
      { score: number; confidence: string; rationale: string }
    > = {};
    for (const d of dims) {
      fitByKey[d.dimensionKey] = {
        score: d.score,
        confidence: d.confidence,
        rationale: d.rationale,
      };
    }

    const corpus = [
      v.summary,
      v.strengths.join(" "),
      v.weaknesses.join(" "),
      ...claims.map((c) => c.claimText),
      ...facts.map((f) => f.factText),
    ]
      .join("\n")
      .slice(0, 200_000);

    const ratio = mandatoryReqOverlapRatio(corpus, reqs);

    let inArchitectureOption = archUse.length > 0;
    if (input.architectureOptionId) {
      inArchitectureOption = archUse.some(
        (a) => a.architectureOptionId === input.architectureOptionId,
      );
    }

    entries.push(
      buildVendorComparisonEntry({
        vendorId: v.id,
        vendorName: v.name,
        fitByKey,
        corpus,
        claims: claims.map((c) => ({
          credibility: c.credibility,
          confidence: c.confidence,
          claimText: c.claimText,
        })),
        facts: facts.map((f) => ({
          credibility: f.credibility,
          confidence: f.confidence,
          factText: f.factText,
          factType: f.factType,
        })),
        integrationRows: integration.map((r) => ({
          requirementKey: r.requirementKey,
          status: r.status,
          evidence: r.evidence,
        })),
        inArchitectureOption,
        mandatoryReqOverlapRatio: ratio,
        interviewReadiness: {
          unresolvedP1: interviewIr.unresolvedP1,
          avgAnswerQuality: interviewIr.avgScore,
          lowQualityCount: interviewIr.lowQualityCount,
        },
        claimValidationSummary,
        failureResilienceSummary,
        roleFitSummary: roleFitResult.summary,
        pricingReality,
      }),
    );
  }

  if (entries.length === 0) {
    const honestyNote =
      "No comparable vendor rows — confirm vendor ids belong to this project.";
    const projectInterviewReadiness = await getProjectInterviewReadinessSummary(
      input.projectId,
    );
    return {
      projectId: input.projectId,
      architectureOptionId: input.architectureOptionId ?? undefined,
      comparedVendorIds: [],
      entries: [],
      heatmapMatrix: { rows: [] },
      recommendedRationale: [honestyNote],
      recommendationConfidence: "provisional",
      decisionRisks: [],
      pointLossComparisons: [],
      scenarioNotes: [],
      competitorInterviewQuestions: [],
      generatedAt: new Date().toISOString(),
      honestyNote,
      projectInterviewReadiness: {
        vendors: projectInterviewReadiness.vendors.map((x) => ({
          vendorId: x.vendorId,
          vendorName: x.vendorName,
          p1Total: x.summary.p1Total,
          p1Unanswered: x.summary.p1Unanswered,
          p1NeedsFollowUp: x.summary.p1NeedsFollowUp,
          unresolvedP1: x.summary.unresolvedP1,
          avgScore: x.summary.avgScore,
          lowQualityCount: x.summary.lowQualityCount,
        })),
      },
    };
  }

  const heatmapMatrix = buildHeatmapMatrix(entries);
  const pointLossComparisons = buildPointLossComparisons(entries);
  const rec = buildRecommendation({
    entries,
    architectureOptionName: archOpt?.name,
  });
  const competitorInterviewQuestions = buildCompetitorInterviewQuestions(entries);

  const projectInterviewReadiness = await getProjectInterviewReadinessSummary(
    input.projectId,
  );

  const honestyNote =
    "Comparative scores are heuristic and solicitation-scoped — they do not predict the evaluation outcome. Unknown proof and vendor-claim-only evidence lower confidence.";

  return {
    projectId: input.projectId,
    architectureOptionId: input.architectureOptionId ?? undefined,
    comparedVendorIds: entries.map((e) => e.vendorId),
    entries,
    heatmapMatrix,
    recommendedVendorId: rec.recommendedVendorId,
    recommendedRationale: rec.recommendedRationale,
    recommendationConfidence: rec.recommendationConfidence,
    decisionRisks: rec.decisionRisks,
    pointLossComparisons,
    scenarioNotes: rec.scenarioNotes,
    competitorInterviewQuestions,
    generatedAt: new Date().toISOString(),
    honestyNote,
    projectInterviewReadiness: {
      vendors: projectInterviewReadiness.vendors.map((x) => ({
        vendorId: x.vendorId,
        vendorName: x.vendorName,
        p1Total: x.summary.p1Total,
        p1Unanswered: x.summary.p1Unanswered,
        p1NeedsFollowUp: x.summary.p1NeedsFollowUp,
        unresolvedP1: x.summary.unresolvedP1,
        avgScore: x.summary.avgScore,
        lowQualityCount: x.summary.lowQualityCount,
      })),
    },
  };
}

/**
 * Default comparison set: all vendors in project (capped).
 */
export async function defaultComparedVendorIdsForProject(
  projectId: string,
  max = 10,
): Promise<string[]> {
  const vendors = await listVendorsByProject(projectId);
  return vendors.slice(0, max).map((v) => v.id);
}

export function toGroundingCompetitorContext(input: {
  simulation: CompetitorAwareSimulationResult;
  selectedVendorId?: string | null;
  bidNumber?: string;
  decisionSynthesis?: VendorDecisionSynthesis;
}): GroundingBundleCompetitorContext {
  const { simulation } = input;
  return {
    generatedAt: simulation.generatedAt,
    bidNumber: input.bidNumber,
    selectedVendorId: input.selectedVendorId ?? undefined,
    recommendationConfidence: simulation.recommendationConfidence,
    recommendedVendorId: simulation.recommendedVendorId,
    recommendedRationale: simulation.recommendedRationale,
    decisionRisks: simulation.decisionRisks,
    pointLossComparisons: simulation.pointLossComparisons,
    scenarioNotes: simulation.scenarioNotes,
    competitorInterviewQuestions: simulation.competitorInterviewQuestions,
    entriesSummary: simulation.entries.map((e) => ({
      vendorId: e.vendorId,
      vendorName: e.vendorName,
      overallScore: e.overallScore,
      confidence: e.confidence,
      evaluatorBidScoreImpact: e.evaluatorBidScoreImpact,
    })),
    honestyNote: simulation.honestyNote,
    decisionSynthesis: input.decisionSynthesis,
  };
}
