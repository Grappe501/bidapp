import type {
  ArchitectureOption,
  CompanyProfile,
  DraftMetadata,
  DraftSection,
  DraftSectionType,
  DraftStatus,
  DraftVersion,
  EvidenceItem,
  FileRecord,
  GroundedProseReviewResult,
  GroundingBundlePayload,
  GroundingBundleType,
  GroundingBundleVendorIntelligence,
  CompetitorAwareSimulationResult,
  Project,
  Requirement,
  RequirementEvidenceLink,
  RetrievalQueryType,
  SubmissionItem,
  Vendor,
  VendorInterviewReadinessSummary,
} from "@/types";
import type { VendorLinkRecommendedAction } from "@/lib/allcare-branding-next-actions";

/**
 * Client for `/.netlify/functions/*`. In production, `VITE_FUNCTIONS_BASE_URL` must
 * point at the deployed API origin, CORS must allow the SPA origin via `ALLOWED_ORIGIN`,
 * and `VITE_INTERNAL_API_KEY` must match `INTERNAL_API_KEY` on functions. See
 * `scripts/netlify-deploy-checklist.md`.
 */

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

function apiHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const key = (import.meta.env.VITE_INTERNAL_API_KEY ?? "").trim();
  if (key) h["x-api-key"] = key;
  return h;
}

export type ProjectWorkspaceApiPayload = {
  project: Project;
  files: FileRecord[];
  requirements: Requirement[];
  evidence: EvidenceItem[];
  requirementEvidenceLinks: RequirementEvidenceLink[];
  vendors: Vendor[];
  architectureOptions: ArchitectureOption[];
  companyProfiles: CompanyProfile[];
  submissionItems: SubmissionItem[];
};

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
    headers: apiHeaders(),
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

/** Scoped fetch: returns0 or 1 projects for the given id. */
export async function fetchDbProjects(
  projectId: string,
): Promise<DbProjectRow[] | null> {
  const base = functionsBase();
  if (!base || !projectId.trim()) return null;
  try {
    const res = await fetch(`${base}/.netlify/functions/list-projects`, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ projectId: projectId.trim() }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { projects?: DbProjectRow[] };
    return data.projects ?? [];
  } catch {
    return null;
  }
}

export async function postLoadProjectWorkspace(
  projectId: string,
): Promise<ProjectWorkspaceApiPayload> {
  return postFunctionJson<ProjectWorkspaceApiPayload>("load-project-workspace", {
    projectId,
  });
}

export async function postVendorIntelligence(input: {
  projectId: string;
  vendorId?: string;
  action:
    | "runResearch"
    | "computeFit"
    | "computeScore"
    | "generateInterview"
    | "getSnapshot"
    | "getInterviewWorkspace"
    | "getProjectInterviewReadiness"
    | "saveInterviewAnswer"
    | "normalizeInterviewAnswer"
    | "evaluateInterviewAnswer"
    | "updateInterviewQuestion"
    | "updateVendorWebsite"
    | "runVendorWebsiteResearch"
    | "ingestVendorManualUrl"
    | "getVendorWebsiteStatus"
    | "runClaimValidation"
    | "listClaimValidations"
    | "patchClaimValidation"
    | "runFailureSimulation"
    | "listFailureModes"
    | "runRoleFitAnalysis"
    | "listRoleFit";
  questionId?: string;
  validationId?: string;
  patch?: Record<string, unknown>;
  answer?: Record<string, unknown>;
  websiteUrl?: string;
  manualUrl?: string;
  maxPages?: number;
  maxDepth?: number;
  forceRecrawl?: boolean;
  architectureOptionId?: string | null;
}): Promise<unknown> {
  return postFunctionJson("vendor-intelligence", input);
}

export async function postProjectInterviewReadiness(projectId: string): Promise<{
  vendors: Array<{
    vendorId: string;
    vendorName: string;
    summary: VendorInterviewReadinessSummary;
  }>;
}> {
  return postFunctionJson("vendor-intelligence", {
    projectId,
    action: "getProjectInterviewReadiness",
  });
}

export async function postVendorIntelligenceExport(projectId: string): Promise<{
  vendors: GroundingBundleVendorIntelligence[];
  vendorComparisonNote: string | null;
}> {
  return postFunctionJson("vendor-intelligence", {
    projectId,
    action: "exportProject",
  });
}

export async function postCompetitorSimulation(input: {
  projectId: string;
  comparedVendorIds: string[];
  architectureOptionId?: string | null;
}): Promise<CompetitorAwareSimulationResult> {
  return postFunctionJson<CompetitorAwareSimulationResult>(
    "competitor-simulation",
    input,
  );
}

export async function postIngestUrl(input: {
  url: string;
  projectId: string;
  companyProfileId?: string | null;
  classification?: string | null;
  title?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ sourceId: string; textLength: number; factId?: string } | null> {
  const base = functionsBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/.netlify/functions/ingest-url`, {
      method: "POST",
      headers: apiHeaders(),
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


export async function postEmbedFile(
  fileId: string,
  projectId: string,
): Promise<{
  embedded: number;
}> {
  return postFunctionJson("embed-file", { fileId, projectId });
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

export async function postEnrichCompany(
  companyProfileId: string,
  projectId: string,
): Promise<{
  runId: string;
  factsCreated: number;
  claimsCreated: number;
}> {
  return postFunctionJson("enrich-company", { companyProfileId, projectId });
}

/** Score breakdown for a vendor resolution candidate (matches ingest meta). */
export type VendorRecommendedCandidateApi = {
  vendorId: string;
  vendorName: string;
  score: number;
  scoreBreakdown: {
    similarity: number;
    nameSignalBonus: number;
    shortNamePenalty: number;
    missingPharmacySignalPenalty: number;
    nearDuplicatePenalty: number;
  };
};

/** Example row for operator review when legacy fact correction was skipped as ambiguous. */
export type SkippedAmbiguousFactExampleApi = {
  factId: string;
  factType: string;
  factTextPreview: string;
  currentCredibility: string;
  currentConfidence: string;
  suggestedCredibility: string;
  suggestedConfidence: string;
  reasonSkipped: string;
};

export type BrandingLastFactAuditApi = {
  examined: number;
  filledMissing: number;
  correctedValues: number;
  correctedSafeCount?: number;
  correctedModerateCount?: number;
  skippedAmbiguous: number;
  skippedAmbiguousExamples?: SkippedAmbiguousFactExampleApi[];
  mode: string;
  at: string;
  wouldFillMissing?: number;
  /** @deprecated Prefer wouldCorrectSafe */
  wouldCorrect?: number;
  wouldCorrectSafe?: number;
  wouldCorrectModerate?: number;
};

/**
 * Full branding profile returned by `get-branding-profile` (explicit contract).
 */
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
  ingestQualityExplanation: string | null;
  /** Same as ingestQualityExplanation; stable name for API clients. */
  qualityExplanation: string | null;
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
  vendorOperatorGuidance: string | null;
  vendorResolutionCandidateCount: number | null;
  robotsOperatorNote: string | null;
  robotsReviewRecommended: boolean;
  robotsReviewReason: string | null;
  vendorRecommendedAction: VendorLinkRecommendedAction | null;
  vendorRecommendedCandidates: VendorRecommendedCandidateApi[];
  lastFactAudit: BrandingLastFactAuditApi | null;
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

/** Success body for POST `get-branding-profile`. */
export type GetBrandingProfileResponseBody = {
  branding: BrandingProfileApi;
};

export type AllCareLegacyFactBackfillMode =
  | "fill-missing"
  | "audit-only"
  | "safe-correct"
  | "moderate-correct";

export type AllCareScrapeRunApi = {
  dryRun: boolean;
  schemaReady?: boolean;
  schemaIssues?: string[];
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
    operatorGuidance?: string;
    recommendedAction?: VendorLinkRecommendedAction;
    recommendedCandidates?: VendorRecommendedCandidateApi[];
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
  qualityExplanation?: string | null;
  robotsOperatorNote?: string | null;
  robotsReviewRecommended?: boolean;
  robotsReviewReason?: string | null;
  legacyFactAudit?: BrandingLastFactAuditApi | null;
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
  backfillMode?: AllCareLegacyFactBackfillMode;
}): Promise<AllCareScrapeRunApi> {
  return postFunctionJson("scrape-allcare-site", input);
}

export async function postGetBrandingProfile(input: {
  projectId?: string;
  companyProfileId?: string;
  ensureProfile?: boolean;
}): Promise<GetBrandingProfileResponseBody> {
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
  projectId: string,
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
    projectId,
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
