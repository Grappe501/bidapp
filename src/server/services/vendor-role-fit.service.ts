import {
  buildVendorRoleFitSummary,
  evaluateAllVendorRoles,
  type EvaluatedVendorRole,
  type RoleFitSimulationContext,
} from "../lib/vendor-role-fit-engine";
import { VENDOR_ROLE_TAXONOMY_V1 } from "../lib/vendor-role-taxonomy";
import { listIntelligenceFactsForVendor } from "../repositories/intelligence.repo";
import {
  deleteVendorRoleFitForVendor,
  insertVendorRoleFit,
  insertVendorRoleFitDetail,
  listVendorRoleFit,
  listVendorRoleFitDetailsForVendor,
} from "../repositories/vendor-role-fit.repo";
import { listVendorClaimValidations } from "../repositories/vendor-claim-validation.repo";
import {
  listVendorFitDimensionsByVendor,
  listVendorIntegrationRequirementsByVendor,
} from "../repositories/vendor-intelligence.repo";
import {
  getInterviewReadinessSummaryForVendor,
} from "../repositories/vendor-interview.repo";
import { getVendorById, listVendorClaimsByVendorId } from "../repositories/vendor.repo";
import type { VendorRoleFitRecord, VendorRoleFitSummary } from "../../types";
import type { DbVendorRoleFit } from "../repositories/vendor-role-fit.repo";

type DetailBuckets = {
  strengths: string[];
  weaknesses: string[];
  malone: string[];
  unknowns: string[];
};

function buildDetailBuckets(
  details: Awaited<ReturnType<typeof listVendorRoleFitDetailsForVendor>>,
): Map<string, DetailBuckets> {
  const m = new Map<string, DetailBuckets>();
  for (const d of details) {
    if (!m.has(d.roleFitId)) {
      m.set(d.roleFitId, {
        strengths: [],
        weaknesses: [],
        malone: [],
        unknowns: [],
      });
    }
    const b = m.get(d.roleFitId)!;
    if (d.detailType === "strength") b.strengths.push(d.detailText);
    else if (d.detailType === "weakness") b.weaknesses.push(d.detailText);
    else if (d.detailType === "malone_responsibility") b.malone.push(d.detailText);
    else if (d.detailType === "unresolved_question") b.unknowns.push(d.detailText);
  }
  return m;
}

function mapDbToPayload(
  r: DbVendorRoleFit,
  detailById: Map<string, DetailBuckets>,
  roleLabels: Map<string, string>,
): VendorRoleFitRecord {
  const b = detailById.get(r.id);
  return {
    id: r.id,
    vendorId: r.vendorId,
    projectId: r.projectId,
    roleKey: r.roleKey,
    roleLabel: roleLabels.get(r.roleKey) ?? r.roleKey,
    ownershipRecommendation:
      r.ownershipRecommendation as VendorRoleFitRecord["ownershipRecommendation"],
    confidence: r.confidence as VendorRoleFitRecord["confidence"],
    fitLevel: r.fitLevel as VendorRoleFitRecord["fitLevel"],
    evidenceStrength: r.evidenceStrength as VendorRoleFitRecord["evidenceStrength"],
    maloneDependencyLevel:
      r.maloneDependencyLevel as VendorRoleFitRecord["maloneDependencyLevel"],
    handoffComplexity: r.handoffComplexity as VendorRoleFitRecord["handoffComplexity"],
    overlapRisk: r.overlapRisk as VendorRoleFitRecord["overlapRisk"],
    gapRisk: r.gapRisk as VendorRoleFitRecord["gapRisk"],
    rationale: r.rationale,
    requiredMaloneResponsibilities: b?.malone ?? [],
    vendorStrengthSignals: b?.strengths ?? [],
    vendorWeaknessSignals: b?.weaknesses ?? [],
    unresolvedQuestions: b?.unknowns ?? [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function runVendorRoleFitAnalysis(input: {
  projectId: string;
  vendorId: string;
  architectureOptionId?: string | null;
}): Promise<{ summary: VendorRoleFitSummary; roles: VendorRoleFitRecord[] }> {
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

  const simCtx: RoleFitSimulationContext = {
    corpusLower: corpus.toLowerCase(),
    fitByKey,
    integrationRows: integration.map((r) => ({
      requirementKey: r.requirementKey,
      status: r.status,
    })),
    claimValidations: claimVals,
    interviewUnresolvedP1: interviewIr.unresolvedP1,
    operationalFactCount,
    marketingClaimRatio,
    vendorStrengths: vendor.strengths,
    vendorWeaknesses: vendor.weaknesses,
  };

  const evaluated = evaluateAllVendorRoles(simCtx);
  const { summary: s } = buildVendorRoleFitSummary(input.vendorId, evaluated);

  const summary: VendorRoleFitSummary = {
    vendorId: input.vendorId,
    strongOwnRoles: s.strongOwnRoles,
    shareRoles: s.shareRoles,
    supportRoles: s.supportRoles,
    avoidRoles: s.avoidRoles,
    highestDependencyRoles: s.highestDependencyRoles,
    highestHandoffRiskRoles: s.highestHandoffRiskRoles,
    roleStrategyAssessment: s.roleStrategyAssessment,
  };

  await deleteVendorRoleFitForVendor({
    projectId: input.projectId,
    vendorId: input.vendorId,
  });

  const archOpt = input.architectureOptionId?.trim() || null;
  const roleLabels = new Map(VENDOR_ROLE_TAXONOMY_V1.map((d) => [d.key, d.label]));

  for (const e of evaluated) {
    const { id } = await insertVendorRoleFit({
      projectId: input.projectId,
      vendorId: input.vendorId,
      architectureOptionId: archOpt,
      evaluated: e,
    });
    for (const t of e.vendorStrengthSignals) {
      await insertVendorRoleFitDetail({
        roleFitId: id,
        detailType: "strength",
        detailText: t,
        sourceId: null,
        factId: null,
      });
    }
    for (const t of e.vendorWeaknessSignals) {
      await insertVendorRoleFitDetail({
        roleFitId: id,
        detailType: "weakness",
        detailText: t,
        sourceId: null,
        factId: null,
      });
    }
    for (const t of e.requiredMaloneResponsibilities) {
      await insertVendorRoleFitDetail({
        roleFitId: id,
        detailType: "malone_responsibility",
        detailText: t,
        sourceId: null,
        factId: null,
      });
    }
    for (const t of e.unresolvedQuestions) {
      await insertVendorRoleFitDetail({
        roleFitId: id,
        detailType: "unresolved_question",
        detailText: t,
        sourceId: null,
        factId: null,
      });
    }
  }

  const rows = await listVendorRoleFit({
    projectId: input.projectId,
    vendorId: input.vendorId,
  });
  const detailRows = await listVendorRoleFitDetailsForVendor({
    projectId: input.projectId,
    vendorId: input.vendorId,
  });
  const detailById = new Map<string, DetailBuckets>();
  for (const d of detailRows) {
    if (!detailById.has(d.roleFitId)) {
      detailById.set(d.roleFitId, {
        strengths: [],
        weaknesses: [],
        malone: [],
        unknowns: [],
      });
    }
    const b = detailById.get(d.roleFitId)!;
    if (d.detailType === "strength") b.strengths.push(d.detailText);
    else if (d.detailType === "weakness") b.weaknesses.push(d.detailText);
    else if (d.detailType === "malone_responsibility") b.malone.push(d.detailText);
    else if (d.detailType === "unresolved_question") b.unknowns.push(d.detailText);
  }

  const roles: VendorRoleFitRecord[] = rows.map((r) =>
    mapDbToPayload(r, detailById, roleLabels),
  );

  return { summary, roles };
}

export async function listVendorRoleFitForApi(input: {
  projectId: string;
  vendorId: string;
}): Promise<{
  summary: VendorRoleFitSummary | null;
  roles: VendorRoleFitRecord[];
}> {
  const rows = await listVendorRoleFit(input);
  if (rows.length === 0) {
    return { summary: null, roles: [] };
  }
  const detailRows = await listVendorRoleFitDetailsForVendor(input);
  const detailById = buildDetailBuckets(detailRows);
  const roleLabels = new Map(VENDOR_ROLE_TAXONOMY_V1.map((d) => [d.key, d.label]));

  const evaluatedFromDb: EvaluatedVendorRole[] = rows.map((r) => ({
    roleKey: r.roleKey,
    roleLabel: roleLabels.get(r.roleKey) ?? r.roleKey,
    ownershipRecommendation:
      r.ownershipRecommendation as EvaluatedVendorRole["ownershipRecommendation"],
    confidence: r.confidence as EvaluatedVendorRole["confidence"],
    fitLevel: r.fitLevel as EvaluatedVendorRole["fitLevel"],
    evidenceStrength: r.evidenceStrength as EvaluatedVendorRole["evidenceStrength"],
    maloneDependencyLevel:
      r.maloneDependencyLevel as EvaluatedVendorRole["maloneDependencyLevel"],
    handoffComplexity: r.handoffComplexity as EvaluatedVendorRole["handoffComplexity"],
    overlapRisk: r.overlapRisk as EvaluatedVendorRole["overlapRisk"],
    gapRisk: r.gapRisk as EvaluatedVendorRole["gapRisk"],
    rationale: r.rationale,
    requiredMaloneResponsibilities: [],
    vendorStrengthSignals: [],
    vendorWeaknessSignals: [],
    unresolvedQuestions: [],
  }));

  const { summary: s } = buildVendorRoleFitSummary(input.vendorId, evaluatedFromDb);

  const summary: VendorRoleFitSummary = {
    vendorId: input.vendorId,
    strongOwnRoles: s.strongOwnRoles,
    shareRoles: s.shareRoles,
    supportRoles: s.supportRoles,
    avoidRoles: s.avoidRoles,
    highestDependencyRoles: s.highestDependencyRoles,
    highestHandoffRiskRoles: s.highestHandoffRiskRoles,
    roleStrategyAssessment: s.roleStrategyAssessment,
  };

  return {
    summary,
    roles: rows.map((r) => mapDbToPayload(r, detailById, roleLabels)),
  };
}
