import { CANONICAL_SRV1_CONTRACT } from "../data/canonical-srv1-contract";
import { S000000479_BID_NUMBER } from "../data/canonical-rfp-s000000479";
import type { ContractStructure, GroundingBundleContract } from "../types/contract-model";
import { crossCheckRfpContract } from "./contract-rfp-crosscheck";
import { buildProjectGroundingBundleRfp } from "./rfp-narrative";
import { pickStructuredRfp } from "./rfp-document-validation";

type ProjectLike = {
  bidNumber: string;
  title: string;
  issuingOrganization: string;
  dueDate: string;
};

function directivesFromSrv1(base: ContractStructure): {
  draftingDirectives: string[];
  pricingDirectives: string[];
  terminationMitigationHooks: string[];
} {
  const draftingDirectives = [
    "State a clear scope of work for each major commitment.",
    "Define measurable performance standards (SLAs, turnaround, accuracy targets) wherever operations are described.",
    "Use deliverable-based language (what, when, how measured) rather than aspirational claims.",
    "Explicitly tie risk mitigation to termination scenarios: convenience, cause, and non-appropriation.",
  ];

  const pricingDirectives = [
    "Provide a service breakdown with cost per service line or unit where the template allows.",
    "Show total contract value and annualized value across the base term (and options if priced).",
    "Reject flat lump-sum-only pricing without line-level rates — SRV-1 requires defined rates and calculations.",
  ];

  const terminationMitigationHooks = base.terminationClauses.map(
    (t) => `Address continuity and transition risk under: ${t}.`,
  );

  return { draftingDirectives, pricingDirectives, terminationMitigationHooks };
}

function stubContract(): ContractStructure {
  return {
    term: { baseYears: 0, maxYears: 0 },
    scopeRequired: false,
    performanceRequired: false,
    paymentModel: {
      requiresDefinedRates: false,
      requiresCalculation: false,
    },
    terminationClauses: [],
    complianceRequirements: [],
  };
}

/**
 * Builds `groundingBundle.contract` — SRV-1 canonical for S000000479.
 */
export function buildProjectGroundingBundleContract(
  project: ProjectLike,
): GroundingBundleContract {
  if (project.bidNumber === S000000479_BID_NUMBER) {
    const base = { ...CANONICAL_SRV1_CONTRACT };
    const { draftingDirectives, pricingDirectives, terminationMitigationHooks } =
      directivesFromSrv1(base);
    const rfpLayer = buildProjectGroundingBundleRfp(project);
    const structuredRfp = pickStructuredRfp(rfpLayer);
    const { contradictions, missingObligations } = crossCheckRfpContract(
      structuredRfp,
      base,
    );
    const crossCheckWarnings = [...contradictions, ...missingObligations];
    return {
      ...base,
      draftingDirectives,
      pricingDirectives,
      terminationMitigationHooks,
      crossCheckWarnings,
      stub: false,
    };
  }

  const s = stubContract();
  return {
    ...s,
    draftingDirectives: [
      "Register canonical SRV-1 data for this solicitation — keep scope and performance language conservative until contract structure is loaded.",
    ],
    pricingDirectives: [
      "Use structured state workbook formats when available; avoid unstructured lump-sum-only pricing.",
    ],
    terminationMitigationHooks: [],
    crossCheckWarnings: ["SRV-1 contract structure not registered for this bid number."],
    stub: true,
  };
}
