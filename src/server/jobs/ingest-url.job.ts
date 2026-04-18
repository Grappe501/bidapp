import { ingestUrlToSource } from "../services/ingestion.service";

export async function runIngestUrlJob(input: {
  url: string;
  projectId: string;
  companyProfileId?: string | null;
  classification?: string | null;
  title?: string | null;
}): Promise<{ sourceId: string; textLength: number; factId?: string }> {
  return ingestUrlToSource(input);
}
