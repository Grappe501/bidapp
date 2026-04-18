import {
  createIntelligenceFact,
  createIntelligenceSource,
} from "../repositories/intelligence.repo";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function ingestUrlToSource(input: {
  url: string;
  projectId: string;
  companyProfileId?: string | null;
  classification?: string | null;
  title?: string | null;
}): Promise<{ sourceId: string; textLength: number; factId?: string }> {
  const res = await fetch(input.url, {
    headers: {
      "User-Agent": "BidAssembly-Ingest/0.5.6 (+manual)",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} for ${input.url}`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  const raw = await res.text();
  const text =
    contentType.includes("html") || raw.trimStart().startsWith("<")
      ? stripHtml(raw)
      : raw;
  const capped = text.slice(0, 500_000);
  const source = await createIntelligenceSource({
    projectId: input.projectId,
    companyProfileId: input.companyProfileId ?? null,
    sourceType: "url",
    url: input.url,
    title: input.title ?? input.url,
    rawText: capped,
    classification: input.classification ?? null,
    validationStatus: "Pending Validation",
    fetchedAt: new Date().toISOString(),
  });

  let factId: string | undefined;
  if (capped.length > 0) {
    const fact = await createIntelligenceFact({
      projectId: input.projectId,
      sourceId: source.id,
      companyProfileId: input.companyProfileId ?? null,
      factType: "raw_excerpt",
      factText: capped.slice(0, 8000),
      classification: input.classification ?? "unspecified",
      validationStatus: "Pending Validation",
    });
    factId = fact.id;
  }

  return { sourceId: source.id, textLength: capped.length, factId };
}

export async function ingestRawTextToSource(input: {
  projectId: string;
  companyProfileId?: string | null;
  rawText: string;
  classification?: string | null;
  sourceType?: string;
  title?: string | null;
}): Promise<{ sourceId: string; factId?: string }> {
  const source = await createIntelligenceSource({
    projectId: input.projectId,
    companyProfileId: input.companyProfileId ?? null,
    sourceType: input.sourceType ?? "manual",
    url: null,
    title: input.title ?? "Manual paste",
    rawText: input.rawText.slice(0, 500_000),
    classification: input.classification ?? null,
    validationStatus: "Pending Validation",
    fetchedAt: null,
  });
  let factId: string | undefined;
  if (input.rawText.trim().length > 0) {
    const fact = await createIntelligenceFact({
      projectId: input.projectId,
      sourceId: source.id,
      companyProfileId: input.companyProfileId ?? null,
      factType: "raw_excerpt",
      factText: input.rawText.slice(0, 8000),
      classification: input.classification ?? "unspecified",
      validationStatus: "Pending Validation",
    });
    factId = fact.id;
  }
  return { sourceId: source.id, factId };
}
