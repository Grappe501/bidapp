import { runCompanyEnrichment } from "../services/enrichment.service";

export async function runEnrichCompanyJob(input: {
  companyProfileId: string;
}): Promise<{
  runId: string;
  factsCreated: number;
  claimsCreated: number;
}> {
  return runCompanyEnrichment(input);
}
