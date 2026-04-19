import {
  computeMaloneDependencyScore,
  evaluateAllFailureScenarios,
  type FailureSimulationContext,
} from "../lib/failure-simulation-engine";
import { effectiveSupportLevelFromRow } from "./vendor-claim-validation-merge.service";
import {
  deleteVendorFailureModesForVendor,
  insertFailureModeDetail,
  insertVendorFailureMode,
  listFailureModeDetailsForVendor,
  listVendorFailureModes,
  type DbVendorFailureMode,
} from "../repositories/vendor-failure-mode.repo";
import { listVendorRoleFit } from "../repositories/vendor-role-fit.repo";
import { computePricingRiskSignalsForFailure } from "./pricing-reality.service";
import { listIntelligenceFactsForVendor } from "../repositories/intelligence.repo";
import {
  listVendorClaimValidations,
} from "../repositories/vendor-claim-validation.repo";
import {
  listVendorFitDimensionsByVendor,
  listVendorIntegrationRequirementsByVendor,
} from "../repositories/vendor-intelligence.repo";
import {
  getInterviewReadinessSummaryForVendor,
} from "../repositories/vendor-interview.repo";
import {
  getVendorById,
  listVendorClaimsByVendorId,
} from "../repositories/vendor.repo";
import type {
  VendorFailureModeRecord,
  VendorFailureSimulationSummary,
} from "../../types";

export function buildFailureSimulationSummary(
  rows: DbVendorFailureMode[],
): VendorFailureSimulationSummary {
  if (rows.length === 0) {
    return {
      vendorId: "",
      scenarioCount: 0,
      criticalScenarioCount: 0,
      highLikelihoodCount: 0,
      lowPreparednessCount: 0,
      overallResilience: "acceptable",
      topFailureModes: [],
      topMitigations: ["Run failure simulation after research or compute score to populate scenarios."],
      decisionWarnings: [],
    };
  }

  let criticalScenarioCount = 0;
  let highLikelihoodCount = 0;
  let lowPreparednessCount = 0;
  for (const r of rows) {
    if (r.impact === "critical") criticalScenarioCount++;
    if (r.likelihood === "high") highLikelihoodCount++;
    if (r.vendorPreparedness === "weak" || r.vendorPreparedness === "unknown")
      lowPreparednessCount++;
  }

  const criticalHigh =
    rows.filter((x) => x.impact === "critical" || x.impact === "high").length;
  const fragileScore =
    criticalScenarioCount * 3 +
    highLikelihoodCount * 2 +
    lowPreparednessCount;

  let overallResilience: VendorFailureSimulationSummary["overallResilience"] =
    "acceptable";
  if (fragileScore >= 18 || criticalScenarioCount >= 4) overallResilience = "high_risk";
  else if (fragileScore >= 10 || criticalScenarioCount >= 2)
    overallResilience = "fragile";
  else if (fragileScore <= 4 && criticalHigh <= 2) overallResilience = "strong";

  const lowLik = rows
    .filter((r) => r.likelihood === "low")
    .slice(0, 5)
    .map((r) => `${r.title} — modeled lower likelihood under current evidence (heuristic).`);
  const topMitigations =
    lowLik.length > 0
      ? lowLik
      : [
          "No scenarios landed in the lowest likelihood band — review high/critical items for mitigations.",
        ];

  const decisionWarnings: string[] = [];
  if (criticalScenarioCount >= 2) {
    decisionWarnings.push(
      `${criticalScenarioCount} failure scenarios modeled at critical impact — strengthen Risk mitigations and ownership clarity.`,
    );
  }
  if (highLikelihoodCount >= 6) {
    decisionWarnings.push(
      "Many high-likelihood stress scenarios under current evidence — treat resilience as a primary evaluation axis.",
    );
  }
  if (lowPreparednessCount >= 8) {
    decisionWarnings.push(
      "Vendor preparedness is weak/unknown across multiple scenarios — interview and proof gaps remain material.",
    );
  }

  const sorted = [...rows].sort((a, b) => {
    const ia =
      a.impact === "critical"
        ? 0
        : a.impact === "high"
          ? 1
          : a.impact === "medium"
            ? 2
            : 3;
    const ib =
      b.impact === "critical"
        ? 0
        : b.impact === "high"
          ? 1
          : b.impact === "medium"
            ? 2
            : 3;
    if (ia !== ib) return ia - ib;
    const la = a.likelihood === "high" ? 0 : a.likelihood === "medium" ? 1 : 2;
    const lb = b.likelihood === "high" ? 0 : b.likelihood === "medium" ? 1 : 2;
    return la - lb;
  });

  const emptyDetailMap = new Map<string, DetailBuckets>();
  const topFailureModes: VendorFailureModeRecord[] = sorted
    .slice(0, 8)
    .map((row) => mapDbToPayload(row, emptyDetailMap));

  return {
    vendorId: rows[0]?.vendorId ?? "",
    scenarioCount: rows.length,
    criticalScenarioCount,
    highLikelihoodCount,
    lowPreparednessCount,
    overallResilience,
    topFailureModes,
    topMitigations: topMitigations.slice(0, 6),
    decisionWarnings: decisionWarnings.slice(0, 6),
  };
}

type DetailBuckets = {
  triggers: string[];
  mitigations: string[];
  unknowns: string[];
};

function buildDetailBucketsByModeId(
  details: Awaited<ReturnType<typeof listFailureModeDetailsForVendor>>,
): Map<string, DetailBuckets> {
  const m = new Map<string, DetailBuckets>();
  for (const d of details) {
    if (!m.has(d.failureModeId)) {
      m.set(d.failureModeId, {
        triggers: [],
        mitigations: [],
        unknowns: [],
      });
    }
    const b = m.get(d.failureModeId)!;
    if (d.detailType === "trigger") b.triggers.push(d.detailText);
    else if (d.detailType === "mitigation") b.mitigations.push(d.detailText);
    else if (d.detailType === "unknown") b.unknowns.push(d.detailText);
  }
  return m;
}

function mapDbToPayload(
  r: DbVendorFailureMode,
  detailByModeId: Map<string, DetailBuckets>,
): VendorFailureModeRecord {
  const b = detailByModeId.get(r.id);
  return {
    id: r.id,
    vendorId: r.vendorId,
    projectId: r.projectId,
    category: r.category as VendorFailureModeRecord["category"],
    scenarioKey: r.scenarioKey,
    title: r.title,
    description: r.description,
    triggerConditions: b?.triggers ?? [],
    likelihood: r.likelihood as VendorFailureModeRecord["likelihood"],
    impact: r.impact as VendorFailureModeRecord["impact"],
    recoverability: r.recoverability as VendorFailureModeRecord["recoverability"],
    timeToRecoverEstimate: r.timeToRecoverEstimate,
    vendorPreparedness:
      r.vendorPreparedness as VendorFailureModeRecord["vendorPreparedness"],
    evidenceStrength:
      r.evidenceStrength as VendorFailureModeRecord["evidenceStrength"],
    mitigationSignals: b?.mitigations ?? [],
    unresolvedUnknowns: b?.unknowns ?? [],
    scoringImpact: {
      solutionImpact: r.scoringSolutionImpact,
      riskImpact: r.scoringRiskImpact,
      interviewImpact: r.scoringInterviewImpact,
    },
    rationale: r.rationale,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function runVendorFailureSimulation(input: {
  projectId: string;
  vendorId: string;
  architectureOptionId?: string | null;
}): Promise<VendorFailureSimulationSummary> {
  const vendor = await getVendorById(input.vendorId);
  if (!vendor || vendor.projectId !== input.projectId) {
    throw new Error("Vendor not found for project");
  }

  const [
    dims,
    integration,
    claimVals,
    interviewIr,
    facts,
    claims,
  ] = await Promise.all([
    listVendorFitDimensionsByVendor(input.vendorId),
    listVendorIntegrationRequirementsByVendor(input.vendorId),
    listVendorClaimValidations(input.vendorId),
    getInterviewReadinessSummaryForVendor(input.vendorId),
    listIntelligenceFactsForVendor({
      projectId: input.projectId,
      vendorId: input.vendorId,
      limit: 120,
    }),
    listVendorClaimsByVendorId(input.vendorId, 80),
  ]);

  const fitByKey = Object.fromEntries(
    dims.map((d) => [d.dimensionKey, { score: d.score, confidence: d.confidence }]),
  );

  const operationalFactCount = facts.filter(
    (f) => f.credibility.toLowerCase() === "operational",
  ).length;
  const marketingClaims = claims.filter(
    (c) => c.credibility.toLowerCase() === "marketing",
  ).length;
  const marketingClaimRatio =
    claims.length > 0 ? marketingClaims / claims.length : 0;

  const corpus = [
    vendor.summary,
    vendor.strengths.join(" "),
    vendor.weaknesses.join(" "),
    vendor.notes,
    ...claims.map((c) => c.claimText),
    ...facts.map((f) => f.factText),
  ]
    .join("\n")
    .slice(0, 200_000);
  const corpusLower = corpus.toLowerCase();

  const unkInt = integration.filter(
    (r) => r.status === "unknown" || r.status === "gap",
  ).length;
  const mcVal = claimVals.find((v) => v.normalizedClaimKey === "integration.matrixcare");
  const mcSupport = mcVal
    ? effectiveSupportLevelFromRow(mcVal)
    : "none";

  const maloneDependencyScore = computeMaloneDependencyScore({
    corpusLower,
    unknownIntegrationCount: unkInt,
    matrixcareSupport:
      mcSupport === "strong"
        ? "strong"
        : mcSupport === "moderate"
          ? "moderate"
          : mcSupport === "weak"
            ? "weak"
            : "none",
  });

  const roleRows = await listVendorRoleFit({
    projectId: input.projectId,
    vendorId: input.vendorId,
  });
  const roleFitByRoleKey: NonNullable<
    FailureSimulationContext["roleFitByRoleKey"]
  > = {};
  for (const r of roleRows) {
    roleFitByRoleKey[r.roleKey] = {
      ownership: r.ownershipRecommendation,
      maloneDependency: r.maloneDependencyLevel,
      fitLevel: r.fitLevel,
    };
  }

  const pricingRisk = await computePricingRiskSignalsForFailure({
    projectId: input.projectId,
    vendorId: input.vendorId,
  });

  const simCtx: FailureSimulationContext = {
    corpus,
    corpusLower,
    fitByKey,
    integrationRows: integration.map((r) => ({
      requirementKey: r.requirementKey,
      status: r.status,
      evidence: r.evidence,
    })),
    claimValidations: claimVals,
    interviewUnresolvedP1: interviewIr.unresolvedP1,
    interviewAvgScore: interviewIr.avgScore,
    interviewLowQuality: interviewIr.lowQualityCount,
    operationalFactCount,
    marketingClaimRatio,
    inArchitectureOption: true,
    maloneDependencyScore,
    roleFitByRoleKey:
      Object.keys(roleFitByRoleKey).length > 0 ? roleFitByRoleKey : undefined,
    pricingRisk,
  };

  const evaluated = evaluateAllFailureScenarios(simCtx);

  await deleteVendorFailureModesForVendor({
    projectId: input.projectId,
    vendorId: input.vendorId,
  });

  const archOpt = input.architectureOptionId?.trim() || null;

  for (const e of evaluated) {
    const { id } = await insertVendorFailureMode({
      projectId: input.projectId,
      vendorId: input.vendorId,
      architectureOptionId: archOpt,
      evaluated: e,
    });
    for (const t of e.triggerConditions) {
      await insertFailureModeDetail({
        failureModeId: id,
        detailType: "trigger",
        detailText: t,
        sourceId: null,
        factId: null,
      });
    }
    for (const m of e.mitigationSignals) {
      await insertFailureModeDetail({
        failureModeId: id,
        detailType: "mitigation",
        detailText: m,
        sourceId: null,
        factId: null,
      });
    }
    for (const u of e.unresolvedUnknowns) {
      await insertFailureModeDetail({
        failureModeId: id,
        detailType: "unknown",
        detailText: u,
        sourceId: null,
        factId: null,
      });
    }
  }

  const rows = await listVendorFailureModes({
    projectId: input.projectId,
    vendorId: input.vendorId,
  });
  const summary = buildFailureSimulationSummary(rows);
  summary.vendorId = input.vendorId;
  return summary;
}

export async function listVendorFailureSimulationForApi(input: {
  projectId: string;
  vendorId: string;
}): Promise<{
  summary: VendorFailureSimulationSummary | null;
  modes: VendorFailureModeRecord[];
}> {
  const rows = await listVendorFailureModes(input);
  if (rows.length === 0) {
    return { summary: null, modes: [] };
  }
  const detailRows = await listFailureModeDetailsForVendor(input);
  const detailByModeId = buildDetailBucketsByModeId(detailRows);
  const summary = buildFailureSimulationSummary(rows);
  summary.vendorId = input.vendorId;
  return {
    summary,
    modes: rows.map((r) => mapDbToPayload(r, detailByModeId)),
  };
}
