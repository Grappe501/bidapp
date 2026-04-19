import {
  VENDOR_FIT_DIMENSIONS,
  VENDOR_INTELLIGENCE_PRINCIPLES,
} from "../../data/vendor-intelligence-system";
import { listArchitectureComponentsByVendorInProject } from "../repositories/architecture.repo";
import {
  listIntelligenceFactsForVendor,
} from "../repositories/intelligence.repo";
import { listRequirementsByProject } from "../repositories/requirement.repo";
import {
  getVendorById,
  listVendorClaimsByVendorId,
} from "../repositories/vendor.repo";
import {
  deleteVendorFitDimensionsForVendor,
  deleteVendorIntegrationRequirementsForVendor,
  listVendorFitDimensionsByVendor,
  listVendorIntegrationRequirementsByVendor,
  upsertVendorFitDimension,
  upsertVendorIntegrationRequirement,
} from "../repositories/vendor-intelligence.repo";
import { mergeInterviewEvidenceIntoFitDimensions } from "./vendor-interview-merge.service";

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function tokenOverlapScore(reqText: string, corpus: string): number {
  const a = new Set(norm(reqText).split(/\s+/).filter((w) => w.length > 3));
  const b = new Set(norm(corpus).split(/\s+/).filter((w) => w.length > 3));
  let n = 0;
  for (const w of a) {
    if (b.has(w)) n++;
  }
  return n;
}

function bandFromRatio(covered: number, total: number): number {
  if (total <= 0) return 2;
  const r = covered / total;
  if (r >= 0.45) return 5;
  if (r >= 0.3) return 4;
  if (r >= 0.15) return 3;
  if (r > 0) return 2;
  return 1;
}

/**
 * Compares RFP requirements and architecture placement to vendor evidence; persists fit rows.
 */
export async function computeVendorFit(input: {
  projectId: string;
  vendorId: string;
}): Promise<{
  dimensions: Awaited<ReturnType<typeof listVendorFitDimensionsByVendor>>;
  advantages: string[];
  disadvantages: string[];
  integrationGaps: string[];
}> {
  const vendor = await getVendorById(input.vendorId);
  if (!vendor || vendor.projectId !== input.projectId) {
    throw new Error("Vendor not found for project");
  }

  const reqs = await listRequirementsByProject(input.projectId);
  const mand = reqs.filter((r) => r.mandatory);
  const reqCorpus = mand.map((r) => `${r.title} ${r.summary}`).join("\n");
  const claims = await listVendorClaimsByVendorId(input.vendorId, 80);
  const facts = await listIntelligenceFactsForVendor({
    projectId: input.projectId,
    vendorId: input.vendorId,
    limit: 80,
  });
  const claimCorpus = claims.map((c) => c.claimText).join("\n");
  const factCorpus = facts.map((f) => f.factText).join("\n");
  const corpus = `${claimCorpus}\n${factCorpus}`;

  const arch = await listArchitectureComponentsByVendorInProject({
    projectId: input.projectId,
    vendorId: input.vendorId,
  });

  let coveredReqs = 0;
  for (const r of mand) {
    const t = `${r.title} ${r.summary}`;
    if (tokenOverlapScore(t, corpus) >= 2) coveredReqs++;
  }
  const reqScore = bandFromRatio(coveredReqs, mand.length || 1);

  const integHints = /api|hl7|fhir|integrat|interface|webhook|rest|xml|batch|edi/i;
  const integScore = Math.min(
    5,
    (arch.length > 0 ? 3 : 1) + (integHints.test(corpus) ? 2 : 0),
  );

  const deliveryHints =
    /delivery|implementation|24|sla|support|staff|on-?site|rollout|train/i;
  const deliveryScore = Math.min(5, 2 + (deliveryHints.test(corpus) ? 2 : 0) + (reqScore >= 4 ? 1 : 0));

  const riskCorpus = facts
    .filter((f) => f.factType.includes("risk"))
    .map((f) => f.factText)
    .join("\n");
  const riskHints =
    /risk|breach|outage|depend|single|vendor lock|penalt|fine|audit/i;
  const riskScore = Math.min(
    5,
    4 -
      (riskHints.test(`${corpus} ${riskCorpus}`) ? 1 : 0) -
      (vendor.risks.length > 2 ? 1 : 0),
  );
  const riskScoreClamped = Math.max(1, riskScore);

  const refHints =
    /reference|pilot|case study|state|agency|contract|award|year/i;
  const refScore = Math.min(5, 2 + (refHints.test(corpus) ? 2 : 0));

  const scores: Record<string, { score: number; confidence: string; rationale: string; sourceIds: string[] }> = {
    technical_capability: {
      score: reqScore,
      confidence: mand.length ? "medium" : "low",
      rationale: `Mandatory requirements with token overlap to vendor evidence: ${coveredReqs}/${mand.length}. ${VENDOR_INTELLIGENCE_PRINCIPLES[0].rule}`,
      sourceIds: claims.slice(0, 5).map((c) => c.id),
    },
    integration_fit: {
      score: integScore,
      confidence: arch.length ? "medium" : "low",
      rationale: `Architecture assignments: ${arch.length}; integration keywords in sources: ${integHints.test(corpus) ? "yes" : "no"}.`,
      sourceIds: claims.filter((c) => integHints.test(c.claimText)).slice(0, 5).map((c) => c.id),
    },
    delivery_operations: {
      score: deliveryScore,
      confidence: "medium",
      rationale: `Delivery/ops language in corpus: ${deliveryHints.test(corpus) ? "present" : "sparse"}.`,
      sourceIds: [],
    },
    risk_posture: {
      score: riskScoreClamped,
      confidence: vendor.risks.length ? "medium" : "low",
      rationale: `Risk facets and stored vendor risks considered — score is defensive band, not precision.`,
      sourceIds: facts.filter((f) => f.factType.includes("risk")).slice(0, 5).map((f) => f.id),
    },
    references_proof: {
      score: refScore,
      confidence: "low",
      rationale: `Reference/past-performance signals in ingested text (heuristic).`,
      sourceIds: [],
    },
  };

  await deleteVendorFitDimensionsForVendor(input.vendorId);
  for (const d of VENDOR_FIT_DIMENSIONS) {
    const row = scores[d.key];
    if (!row) continue;
    await upsertVendorFitDimension({
      vendorId: input.vendorId,
      dimensionKey: d.key,
      score: row.score,
      confidence: row.confidence,
      rationale: row.rationale,
      sourceIds: row.sourceIds,
    });
  }

  await deleteVendorIntegrationRequirementsForVendor(input.vendorId);
  const integKeys = [
    "ehr_integration",
    "data_exchange",
    "identity_access",
    "reporting_billing",
  ];
  for (const key of integKeys) {
    const hit = /integrat|hl7|fhir|api|sso|billing|report/i.test(reqCorpus) &&
      /integrat|hl7|fhir|api|sso|billing|report/i.test(corpus);
    await upsertVendorIntegrationRequirement({
      vendorId: input.vendorId,
      requirementKey: key,
      status: hit ? "preferred" : "unknown",
      evidence: hit
        ? "Requirement and vendor corpus both mention integration-class terms (keyword overlap)."
        : "Insufficient evidence in vendor corpus for this integration class.",
    });
  }

  const dimensions = await listVendorFitDimensionsByVendor(input.vendorId);

  const advantages: string[] = [];
  const disadvantages: string[] = [];
  for (const dim of dimensions) {
    if (dim.score >= 4) {
      advantages.push(`${dim.dimensionKey}: ${dim.rationale.slice(0, 160)}`);
    } else if (dim.score <= 2) {
      disadvantages.push(`${dim.dimensionKey}: ${dim.rationale.slice(0, 160)}`);
    }
  }

  const integrationGaps = (
    await listVendorIntegrationRequirementsByVendor(input.vendorId)
  )
    .filter((r) => r.status === "gap" || r.status === "unknown")
    .map((r) => r.requirementKey);

  await mergeInterviewEvidenceIntoFitDimensions(input.vendorId);

  const dimensionsAfterInterview = await listVendorFitDimensionsByVendor(
    input.vendorId,
  );

  return {
    dimensions: dimensionsAfterInterview,
    advantages,
    disadvantages,
    integrationGaps,
  };
}
