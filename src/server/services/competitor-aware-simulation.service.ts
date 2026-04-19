import type {
  CompetitorAwareSimulationResult,
  GroundingBundleCompetitorContext,
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

    const [dims, claims, facts, integration, archUse] = await Promise.all([
      listVendorFitDimensionsByVendor(vid),
      listVendorClaimsByVendorId(vid, 100),
      listIntelligenceFactsForVendor({ projectId: input.projectId, vendorId: vid, limit: 80 }),
      listVendorIntegrationRequirementsByVendor(vid),
      listArchitectureComponentsByVendorInProject({
        projectId: input.projectId,
        vendorId: vid,
      }),
    ]);

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
      }),
    );
  }

  if (entries.length === 0) {
    const honestyNote =
      "No comparable vendor rows — confirm vendor ids belong to this project.";
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
    };
  }

  const heatmapMatrix = buildHeatmapMatrix(entries);
  const pointLossComparisons = buildPointLossComparisons(entries);
  const rec = buildRecommendation({
    entries,
    architectureOptionName: archOpt?.name,
  });
  const competitorInterviewQuestions = buildCompetitorInterviewQuestions(entries);

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
  };
}
