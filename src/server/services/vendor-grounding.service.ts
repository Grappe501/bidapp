import type { GroundingBundleVendorIntelligence } from "../../types";
import { listVendorsByProject } from "../repositories/vendor.repo";
import {
  listIntelligenceFactsForVendor,
} from "../repositories/intelligence.repo";
import { getVendorById, listVendorClaimsByVendorId } from "../repositories/vendor.repo";
import {
  listVendorFitDimensionsByVendor,
  listVendorIntegrationRequirementsByVendor,
  listVendorInterviewQuestionsByVendor,
} from "../repositories/vendor-intelligence.repo";

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
  ] = await Promise.all([
    listVendorFitDimensionsByVendor(input.vendorId),
    listVendorClaimsByVendorId(input.vendorId, 48),
    listIntelligenceFactsForVendor({
      projectId: input.projectId,
      vendorId: input.vendorId,
      limit: 48,
    }),
    listVendorInterviewQuestionsByVendor(input.vendorId),
    listVendorIntegrationRequirementsByVendor(input.vendorId),
  ]);

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
      question: q.question,
      category: q.category,
      priority: q.priority,
    })),
    integrationRequirements: integration.map((r) => ({
      requirementKey: r.requirementKey,
      status: r.status,
      evidence: r.evidence,
    })),
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
