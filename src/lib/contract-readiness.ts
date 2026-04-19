import type { FileRecord, OutputArtifact, Project } from "@/types";
import type { ContractReadiness } from "../types/contract-model";
import { validateStructuredPricing } from "./contract-pricing-validation";
import { buildPricingLayerForProject } from "./pricing-structure";
import {
  computeRfpHealth,
  pickStructuredRfp,
  validateRfpFileCoverage,
} from "./rfp-document-validation";
import { buildProjectGroundingBundleRfp } from "./rfp-narrative";

type SectionLike = {
  id: string;
  sectionType: string;
};

function sectionHasBody(
  sections: SectionLike[],
  type: string,
  contentById: Record<string, string | undefined>,
): boolean {
  const sec = sections.find((s) => s.sectionType === type);
  if (!sec) return false;
  const t = (contentById[sec.id] ?? "").trim();
  return t.length >= 80;
}

/**
 * Contract readiness flags for dashboard — aligns SRV-1 with drafts, pricing, and RFP compliance files.
 */
export function computeContractReadiness(input: {
  project: Project;
  files: FileRecord[];
  artifacts: OutputArtifact[];
  sections: SectionLike[];
  activeDraftContentBySectionId: Record<string, string | undefined>;
}): ContractReadiness {
  const layer = buildProjectGroundingBundleRfp({
    bidNumber: input.project.bidNumber,
    title: input.project.title,
    issuingOrganization: input.project.issuingOrganization,
    dueDate: input.project.dueDate,
  });
  const structured = pickStructuredRfp(layer);
  const coverage = validateRfpFileCoverage(structured, input.files);
  const rfpHealth = computeRfpHealth(structured, coverage, input.files);

  const scopeCompleteness =
    sectionHasBody(
      input.sections,
      "Experience",
      input.activeDraftContentBySectionId,
    ) &&
    sectionHasBody(
      input.sections,
      "Solution",
      input.activeDraftContentBySectionId,
    );

  const performanceDefinition =
    sectionHasBody(
      input.sections,
      "Solution",
      input.activeDraftContentBySectionId,
    ) &&
    sectionHasBody(input.sections, "Risk", input.activeDraftContentBySectionId);

  const pricingLayer = buildPricingLayerForProject(input.project.bidNumber, input.files);
  const pricing = validateStructuredPricing(input.artifacts, pricingLayer);
  const pricingStructured = pricing.ok;

  const complianceCoverage =
    coverage.missingDocuments.length === 0 && rfpHealth.submissionDocsComplete;

  const ready =
    scopeCompleteness &&
    performanceDefinition &&
    pricingStructured &&
    complianceCoverage;

  return {
    scopeCompleteness,
    performanceDefinition,
    pricingStructured,
    complianceCoverage,
    ready,
  };
}
