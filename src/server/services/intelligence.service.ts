import {
  createCompanyProfile,
  createIntelligenceFact,
  createIntelligenceSource,
  type DbCompanyProfile,
} from "../repositories/intelligence.repo";

export async function createProfileForProject(input: {
  projectId: string;
  name: string;
  profileType: "Client" | "Vendor";
  summary: string;
}): Promise<DbCompanyProfile> {
  return createCompanyProfile({
    projectId: input.projectId,
    name: input.name,
    profileType: input.profileType,
    summary: input.summary,
  });
}

export async function attachSourceAndFact(input: {
  projectId: string;
  companyProfileId: string | null;
  sourceType: string;
  url?: string | null;
  title?: string | null;
  rawText: string;
  classification?: string | null;
  factType: string;
  factText: string;
  validationStatus?: string;
}): Promise<{ sourceId: string; factId: string }> {
  const source = await createIntelligenceSource({
    projectId: input.projectId,
    companyProfileId: input.companyProfileId,
    sourceType: input.sourceType,
    url: input.url ?? null,
    title: input.title ?? null,
    rawText: input.rawText,
    classification: input.classification ?? null,
    validationStatus: input.validationStatus ?? "Pending Validation",
    fetchedAt: null,
  });
  const fact = await createIntelligenceFact({
    projectId: input.projectId,
    sourceId: source.id,
    companyProfileId: input.companyProfileId,
    factType: input.factType,
    factText: input.factText,
    classification: input.classification ?? null,
    validationStatus: input.validationStatus ?? "Pending Validation",
  });
  return { sourceId: source.id, factId: fact.id };
}
