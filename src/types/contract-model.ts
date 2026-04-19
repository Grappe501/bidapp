/**
 * SRV-1–style state contract template — drives drafting, pricing, and compliance alignment.
 */

export interface ContractStructure {
  term: {
    baseYears: number;
    maxYears: number;
  };
  scopeRequired: boolean;
  performanceRequired: boolean;
  paymentModel: {
    requiresDefinedRates: boolean;
    requiresCalculation: boolean;
  };
  terminationClauses: string[];
  complianceRequirements: string[];
}

/** Persisted on {@link GroundingBundlePayload.contract} for LLM + validation. */
export type GroundingBundleContract = ContractStructure & {
  /** Instruction lines merged into drafting prompts. */
  draftingDirectives: string[];
  /** Pricing / workbook rules. */
  pricingDirectives: string[];
  /** Risk language hooks for termination scenarios. */
  terminationMitigationHooks: string[];
  /** RFP ↔ contract reconciliation notes (no silent contradictions). */
  crossCheckWarnings: string[];
  stub?: boolean;
};

export type ContractReadiness = {
  scopeCompleteness: boolean;
  performanceDefinition: boolean;
  pricingStructured: boolean;
  complianceCoverage: boolean;
  /** True only when all four flags are true. */
  ready: boolean;
};

export type StructuredPricingValidation = {
  ok: boolean;
  rejectReasons: string[];
};

export type ContractRfpCrossCheck = {
  contradictions: string[];
  missingObligations: string[];
};
