import type {
  DraftMetadata,
  DraftSection,
  DraftSectionType,
  DraftStatus,
  DraftVersion,
  GroundedProseReviewResult,
  GroundingBundlePayload,
  GroundingBundleType,
  Project,
  RetrievalQueryType,
} from "@/types";

export type DbProjectRow = {
  id: string;
  title: string;
  bidNumber: string;
  issuingOrganization: string;
  dueDate: string;
  status: string;
  shortDescription: string;
  createdAt: string;
  updatedAt: string;
};

function functionsBase(): string {
  return (import.meta.env.VITE_FUNCTIONS_BASE_URL ?? "").replace(/\/$/, "");
}

async function postFunctionJson<T>(
  name: string,
  body: unknown,
): Promise<T> {
  const base = functionsBase();
  if (!base) {
    throw new Error("VITE_FUNCTIONS_BASE_URL is not configured");
  }
  const res = await fetch(`${base}/.netlify/functions/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } &
    Record<string, unknown>;
  if (!res.ok) {
    throw new Error(data.error ?? res.statusText);
  }
  return data as T;
}

/** Map API row to workspace Project shape for display. */
export function dbProjectToProject(row: DbProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    bidNumber: row.bidNumber,
    issuingOrganization: row.issuingOrganization,
    dueDate: row.dueDate,
    status: row.status as Project["status"],
    shortDescription: row.shortDescription,
  };
}

export async function fetchDbProjects(): Promise<DbProjectRow[] | null> {
  const base = functionsBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/.netlify/functions/list-projects`);
    if (!res.ok) return null;
    const data = (await res.json()) as { projects?: DbProjectRow[] };
    return data.projects ?? [];
  } catch {
    return null;
  }
}

export async function postIngestUrl(input: {
  url: string;
  projectId: string;
  companyProfileId?: string | null;
  classification?: string | null;
  title?: string | null;
}): Promise<{ sourceId: string; textLength: number; factId?: string } | null> {
  const base = functionsBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/.netlify/functions/ingest-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? res.statusText);
    }
    return (await res.json()) as {
      sourceId: string;
      textLength: number;
      factId?: string;
    };
  } catch {
    return null;
  }
}

export async function postEmbedFile(fileId: string): Promise<{
  embedded: number;
}> {
  return postFunctionJson("embed-file", { fileId });
}

export async function postRetrieveContext(input: {
  projectId: string;
  query: string;
  retrievalMode: RetrievalQueryType;
  topK?: number;
  fileId?: string;
}): Promise<{
  queryId: string;
  chunks: {
    chunkId: string;
    fileId: string;
    fileName: string;
    chunkIndex: number;
    text: string;
    score: number;
    embeddingModel: string;
  }[];
}> {
  return postFunctionJson("retrieve-context", input);
}

export async function postParseDocumentAi(input: {
  projectId: string;
  fileId: string;
  mode:
    | "extract_requirements"
    | "extract_evidence"
    | "extract_submission_items";
}): Promise<{ fileDocumentId: string; parsedEntityIds: string[] }> {
  return postFunctionJson("parse-document-ai", input);
}

export async function postEnrichCompany(companyProfileId: string): Promise<{
  runId: string;
  factsCreated: number;
  claimsCreated: number;
}> {
  return postFunctionJson("enrich-company", { companyProfileId });
}

export type BrandingProfileApi = {
  companyProfileId: string;
  projectId: string;
  companyName: string;
  displayName: string;
  websiteUrl: string;
  summary: string;
  notes: string;
  appDisplayName: string;
  logoUrl: string | null;
  brandImageUrl: string | null;
  logoCandidates: {
    url: string;
    score: number;
    reason?: string;
    signals?: string[];
    confidence?: string;
  }[];
  ingestQualityScore: number | null;
  ingestQualityBand: "strong" | "moderate" | "weak" | null;
  ingestQualityConfidence: "high" | "medium" | "low" | null;
  ingestQualityWarnings: string[];
  ingestQualityPenalties: string[];
  ingestQualityBreakdown: {
    coverage: number;
    parsing: number;
    factConfidence: number;
    operationalSignal: number;
    vendorMatch: number;
    brandingConfidence: number;
  } | null;
  intelligenceTrustHint: string | null;
  logoConfidence: string | null;
  vendorMatchConfidence: string | null;
  vendorMatchType: string | null;
  vendorResolutionNotes: string | null;
  vendorResolutionCandidateCount: number | null;
  subtitle: string;
  brandingTags: string[];
  aiTags: string[];
  serviceLines: string[];
  capabilities: string[];
  technologyReferences: string[];
  contactBlocks: {
    label: string;
    address?: string;
    phone?: string;
    email?: string;
  }[];
  lastWebsiteScrapeAt: string | null;
  lastScrapeAt: string | null;
  lastScrapeSummary: Record<string, unknown> | null;
  brandingMeta: Record<string, unknown>;
  stats: {
    websiteScrapePages: number;
    factsTotal: number;
    aiTags: number;
    lastScrapeSummary: Record<string, unknown> | null;
    claimsPromotedLastRun: number | null;
    vendorMappedLastRun: boolean;
  };
};

export type AllCareScrapeRunApi = {
  dryRun: boolean;
  companyProfileId: string;
  pagesDiscovered: number;
  pagesFetched: number;
  pagesStored: number;
  pagesSkippedRobots: number;
  pagesSkippedDuplicate: number;
  pagesErrored: number;
  pagesLoadedFromStore: number;
  factsCreated: number;
  tagsCreated: number;
  claimsPromoted: number;
  logoDiscovered: boolean;
  logoConfidence?: string | null;
  errors: string[];
  lastScrapeAt: string | null;
  promotion: { vendorMapped: boolean; vendorId: string | null };
  vendorResolution?: {
    vendorId: string | null;
    confidence: string;
    matchType: string;
    candidateCount?: number;
    notes?: string;
  };
  promotionQuality?: {
    promoted: number;
    skipped_low_confidence: number;
    skipped_marketing: number;
    skipped_inferred: number;
    skipped_duplicate: number;
    skipped_non_operational: number;
  } | null;
  qualityScore?: number | null;
  qualityBand?: "strong" | "moderate" | "weak" | null;
  qualityPenalties?: string[] | null;
  qualityConfidence?: "high" | "medium" | "low" | null;
  qualityWarnings?: string[] | null;
  qualityBreakdown?: {
    coverage: number;
    parsing: number;
    factConfidence: number;
    operationalSignal: number;
    vendorMatch: number;
    brandingConfidence: number;
  } | null;
  legacyFactsBackfilled?: number | null;
  pages_scraped: number;
  sources_upserted: number;
  facts_created: number;
  tags_created: number;
  claims_promoted: number;
  last_scrape_at: string | null;
};

export async function postScrapeAllCareSite(input: {
  projectId: string;
  companyProfileId?: string | null;
  dryRun?: boolean;
  runAiParse?: boolean;
  forceReparse?: boolean;
  forceRecrawl?: boolean;
  maxPages?: number;
  maxDepth?: number;
  runBackfill?: boolean;
}): Promise<AllCareScrapeRunApi> {
  return postFunctionJson("scrape-allcare-site", input);
}

export async function postGetBrandingProfile(input: {
  projectId?: string;
  companyProfileId?: string;
  ensureProfile?: boolean;
}): Promise<{ branding: BrandingProfileApi }> {
  return postFunctionJson("get-branding-profile", input);
}

export async function postBuildGroundingBundle(input: {
  projectId: string;
  bundleType: GroundingBundleType;
  targetEntityId?: string | null;
  title?: string;
  topK?: number;
  fileId?: string;
  strictGrounding?: boolean;
}): Promise<{ bundleId: string; payload: GroundingBundlePayload }> {
  return postFunctionJson("build-grounding-bundle", input);
}

export async function postIntelligenceProfileSnapshot(
  companyProfileId: string,
): Promise<{
  profile: {
    id: string;
    name: string;
    projectId: string;
    profileType: string;
  };
  sources: {
    id: string;
    title: string | null;
    url: string | null;
    sourceType: string;
    validationStatus: string;
    textLength: number;
    fetchedAt: string | null;
  }[];
  facts: {
    id: string;
    factType: string;
    factText: string;
    validationStatus: string;
    classification: string | null;
    sourceId: string;
  }[];
}> {
  return postFunctionJson("intelligence-profile-snapshot", {
    companyProfileId,
  });
}

export async function postIntelligenceJobStatus(projectId: string): Promise<{
  projectId: string;
  embeddingCount: number;
  parsedEntityCount: number;
  groundingBundleCount: number;
  enrichmentRunCount: number;
}> {
  return postFunctionJson("intelligence-job-status", { projectId });
}

type GroundingBundleRow = {
  id: string;
  bundleType: string;
  title: string;
  createdAt: string;
  payload: GroundingBundlePayload;
};

export async function fetchGroundingBundles(
  projectId: string,
): Promise<GroundingBundleRow[]> {
  const data = await postFunctionJson<{ bundles: GroundingBundleRow[] }>(
    "list-grounding-bundles",
    { projectId },
  );
  return data.bundles;
}

export type DraftingWorkspacePayload = {
  sections: DraftSection[];
  versions: DraftVersion[];
  bundles: {
    id: string;
    bundleType: string;
    title: string;
    createdAt: string;
    payload: GroundingBundlePayload;
  }[];
};

/** True when Netlify functions base URL is configured (draft APIs may be used). */
export function isFunctionsApiConfigured(): boolean {
  return Boolean(functionsBase());
}

export async function fetchDraftingWorkspace(
  projectId: string,
): Promise<DraftingWorkspacePayload | null> {
  if (!functionsBase() || !projectId) return null;
  try {
    return await postFunctionJson<DraftingWorkspacePayload>(
      "list-draft-sections",
      { projectId },
    );
  } catch {
    return null;
  }
}

export async function postSaveDraftVersionInsert(input: {
  projectId: string;
  sectionId: string;
  content: string;
  metadata: DraftMetadata;
  groundingBundleId: string | null;
  generationMode?: string | null;
}): Promise<{ version: DraftVersion; section: DraftSection }> {
  return postFunctionJson("save-draft-version", {
    projectId: input.projectId,
    action: "insert",
    sectionId: input.sectionId,
    content: input.content,
    metadata: input.metadata,
    groundingBundleId: input.groundingBundleId,
    generationMode: input.generationMode ?? null,
  });
}

export async function postPatchDraftVersionContent(input: {
  projectId: string;
  versionId: string;
  content: string;
}): Promise<{ version: DraftVersion; section: DraftSection | null }> {
  return postFunctionJson("save-draft-version", {
    projectId: input.projectId,
    action: "patch_content",
    versionId: input.versionId,
    content: input.content,
  });
}

export async function postSetActiveDraftVersion(input: {
  projectId: string;
  sectionId: string;
  versionId: string;
}): Promise<{ section: DraftSection }> {
  return postFunctionJson("set-active-draft-version", input);
}

export async function postUpdateDraftSectionStatus(input: {
  projectId: string;
  sectionId: string;
  status: DraftStatus;
}): Promise<{ section: DraftSection }> {
  return postFunctionJson("update-draft-section-status", input);
}

export async function postSetDraftSectionBundle(input: {
  projectId: string;
  sectionId: string;
  bundleId: string | null;
}): Promise<{ section: DraftSection }> {
  return postFunctionJson("set-draft-section-bundle", input);
}

export async function postDuplicateDraftVersion(input: {
  projectId: string;
  sectionId: string;
  sourceVersionId: string;
  note: string | null;
}): Promise<{ version: DraftVersion; section: DraftSection }> {
  return postFunctionJson("duplicate-draft-version", input);
}

export async function postUpdateDraftVersionMeta(input: {
  projectId: string;
  versionId: string;
  note?: string | null;
  locked?: boolean;
}): Promise<{ version: DraftVersion; section: DraftSection | null }> {
  return postFunctionJson("update-draft-version", input);
}

export async function postGenerateDraft(body: {
  mode: "structured";
  input: {
    sectionType: DraftSectionType;
    pageLimit: number;
    constraintRules: string;
    grounding: GroundingBundlePayload;
    tone?: string;
    regeneration?: {
      scope: "full" | "paragraph";
      instruction?: string;
      existingContent?: string;
      paragraphIndex?: number;
    };
    strategicDirective?: string;
    generationModeLabel?: string;
  };
}): Promise<{ content: string; metadata: DraftMetadata }> {
  return postFunctionJson("generate-draft", body);
}

export async function postBuildProofGraph(body: {
  projectId: string;
  requirementId?: string | null;
}): Promise<{ rowsSynced: number }> {
  return postFunctionJson("build-proof-graph", body);
}

export async function postReviewDraftProse(body: {
  sectionType: DraftSectionType;
  draftText: string;
  grounding: GroundingBundlePayload;
}): Promise<{ review: GroundedProseReviewResult }> {
  return postFunctionJson("review-draft-prose", body);
}
