import type { ContractStructure } from "../types/contract-model";
import type { StructuredRfp } from "../types/rfp-model";

/**
 * Surfaces tension between solicitation (RFP) and SRV-1 obligations.
 */
export function crossCheckRfpContract(
  rfp: StructuredRfp,
  contract: ContractStructure,
): { contradictions: string[]; missingObligations: string[] } {
  const contradictions: string[] = [];
  const missingObligations: string[] = [];

  const rfpYears =
    rfp.core.contractTerm.baseYears + rfp.core.contractTerm.extensionYears;
  if (
    rfp.core.contractTerm.baseYears > 0 &&
    contract.term.baseYears > 0 &&
    rfp.core.contractTerm.baseYears !== contract.term.baseYears
  ) {
    contradictions.push(
      `RFP cites ${rfp.core.contractTerm.baseYears} base + ${rfp.core.contractTerm.extensionYears} option years; SRV-1 models ${contract.term.baseYears} base / ${contract.term.maxYears} max — reconcile in narrative, options, and pricing.`,
    );
  }

  if (rfpYears > contract.term.maxYears) {
    contradictions.push(
      `Combined RFP term horizon (${rfpYears}y) may exceed SRV-1 max term (${contract.term.maxYears}y) — confirm option language.`,
    );
  }

  const rfpAllText = [
    ...rfp.requirements.complianceRequirements,
    ...rfp.requirements.serviceRequirements,
    ...rfp.submission.requiredDocuments,
  ]
    .join(" ")
    .toLowerCase();

  for (const c of contract.complianceRequirements) {
    const token = c.split(/[\s/(-]/)[0]?.toLowerCase() ?? "";
    if (token && !rfpAllText.includes(token) && !rfpAllText.includes(c.toLowerCase())) {
      missingObligations.push(
        `SRV-1 requires “${c}” — verify solicitation, forms, and submission artifacts explicitly cover it.`,
      );
    }
  }

  return { contradictions, missingObligations };
}
