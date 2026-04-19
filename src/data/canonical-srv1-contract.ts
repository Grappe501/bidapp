import type { ContractStructure } from "../types/contract-model";

/** Arkansas SRV-1–aligned template (authoritative for S000000479 pharmacy workflow). */
export const CANONICAL_SRV1_CONTRACT: ContractStructure = {
  term: {
    baseYears: 4,
    maxYears: 7,
  },
  scopeRequired: true,
  performanceRequired: true,
  paymentModel: {
    requiresDefinedRates: true,
    requiresCalculation: true,
  },
  terminationClauses: [
    "Convenience (60 days notice)",
    "Cause (30 days notice)",
    "Non-appropriation",
  ],
  complianceRequirements: [
    "EO 98-04 disclosure",
    "Israel boycott certification",
    "Illegal immigrant restriction",
    "Scrutinized company restriction",
  ],
};
