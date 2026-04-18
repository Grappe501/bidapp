import {
  createCompanyProfile,
  findAllCareClientProfileForProject,
  getCompanyProfile,
  listIntelligenceSourcesByCompanyProfile,
  mergeCompanyProfileBrandingMeta,
  patchCompanyProfileWebsiteDisplay,
  type DbCompanyProfile,
  type DbIntelligenceSource,
} from "../repositories/intelligence.repo";
import {
  resolveVendorWithConfidence,
  type VendorResolution,
} from "../repositories/vendor.repo";
import { createRobotsCache, deriveRobotsReviewSignals } from "../lib/robots-utils";
import { computeAllCareIngestQuality } from "../lib/allcare-ingest-quality";
import {
  crawlAllCarePublicSite,
  dbWebsiteScrapeSourcesToPages,
  maybeEnrichSummaryFromHomepage,
  mergeLogoDiscoveryIntoProfile,
  persistAllCareScrapedPages,
  recordAllCareScrapeBrandingMeta,
  type AllCareCrawlStats,
  type ScrapedAllCarePage,
} from "./allcare-scrape.service";
import { promoteAllCareWebsiteFactsToVendorClaims } from "./allcare-vendor-promotion.service";
import {
  persistAllCareStructuredFacts,
  parseAllCarePublicPageStructured,
} from "./ai-parsing.service";
import { aggregateFactQualityForProfile } from "../repositories/intelligence.repo";
import type { PromotionQualitySummary } from "./allcare-vendor-promotion.service";
import {
  assertAllCareIngestSchemaCapabilities,
  checkAllCareIngestSchemaReady,
} from "../lib/db-capability-checks";
import {
  runLegacyFactMetadataPass,
  trimLegacyFactAuditForBrandingMeta,
  type LegacyFactAuditSummary,
  type LegacyFactBackfillMode,
} from "./fact-confidence-backfill.service";

export async function ensureAllCareCompanyProfile(
  projectId: string,
): Promise<DbCompanyProfile> {
  const existing = await findAllCareClientProfileForProject(projectId);
  if (existing) {
    await patchCompanyProfileWebsiteDisplay({
      id: existing.id,
      websiteUrl:
        existing.websiteUrl?.trim() ? undefined : "https://www.allcarepharmacy.com/",
      displayName: existing.displayName?.trim() ? undefined : "AllCare",
    });
    const refreshed = await getCompanyProfile(existing.id);
    if (refreshed) return refreshed;
  }
  return createCompanyProfile({
    projectId,
    name: "AllCare Pharmacy",
    profileType: "Client",
    summary: "",
    websiteUrl: "https://www.allcarepharmacy.com/",
    displayName: "AllCare",
  });
}

export type AllCareIngestSummary = {
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
  logoConfidence: string | null;
  errors: string[];
  lastScrapeAt: string | null;
  vendorResolution: VendorResolution;
  promotion: {
    vendorMapped: boolean;
    vendorId: string | null;
  };
  promotionQuality: PromotionQualitySummary | null;
  qualityScore: number | null;
  qualityBand: "strong" | "moderate" | "weak" | null;
  qualityPenalties: string[] | null;
  /** How much to trust qualityScore under current crawl/parse conditions. */
  qualityConfidence: "high" | "medium" | "low" | null;
  qualityWarnings: string[] | null;
  qualityExplanation: string | null;
  /** Preflight: DB migrations applied for AllCare ingest. */
  schemaReady: boolean;
  schemaIssues: string[];
  robotsOperatorNote: string | null;
  robotsReviewRecommended: boolean;
  robotsReviewReason: string | null;
  legacyFactAudit: LegacyFactAuditSummary | null;
  qualityBreakdown: {
    coverage: number;
    parsing: number;
    factConfidence: number;
    operationalSignal: number;
    vendorMatch: number;
    brandingConfidence: number;
  } | null;
  legacyFactsBackfilled: number | null;
};

function resolveSourceForPage(
  page: ScrapedAllCarePage,
  sources: DbIntelligenceSource[],
  index: number,
): DbIntelligenceSource | undefined {
  const hit = sources.find(
    (s) =>
      (s.urlNormalized ?? "").trim() === page.urlNormalized.trim() ||
      (s.url ?? "").trim() === page.url.trim(),
  );
  return hit ?? sources[index];
}

export async function runAllCareSiteIngestJob(input: {
  projectId: string;
  companyProfileId?: string | null;
  dryRun?: boolean;
  runAiParse?: boolean;
  forceReparse?: boolean;
  /** Default true. When false, reuse stored website_scrape rows (no HTTP) if any exist. */
  forceRecrawl?: boolean;
  maxPages?: number;
  maxDepth?: number;
  /**
   * When true, runs legacy fact metadata pass (see `backfillMode`).
   * Default false: no extra writes beyond normal ingest.
   */
  runBackfill?: boolean;
  /**
   * Used only when `runBackfill` is true.
   * - fill-missing: empty credibility/confidence only (safest).
   * - audit-only: counts only, no fact row updates.
   * - safe-correct: fill-missing plus narrowly scoped fixes to clearly wrong non-empty values.
   */
  backfillMode?: LegacyFactBackfillMode;
}): Promise<AllCareIngestSummary> {
  const errors: string[] = [];
  let profile: DbCompanyProfile | null = null;

  if (input.companyProfileId?.trim()) {
    profile = await getCompanyProfile(input.companyProfileId.trim());
    if (!profile) {
      throw new Error(`Company profile not found: ${input.companyProfileId}`);
    }
    if (profile.projectId !== input.projectId) {
      throw new Error("companyProfileId does not belong to the given projectId");
    }
  } else {
    profile = await ensureAllCareCompanyProfile(input.projectId);
  }

  const runAi = input.runAiParse !== false;
  const dry = Boolean(input.dryRun);
  const forceRecrawl = input.forceRecrawl !== false;
  const maxPages = input.maxPages ?? 20;
  const maxDepth = input.maxDepth ?? 2;

  const emptyStats = {
    pagesDiscovered: 0,
    pagesFetched: 0,
    pagesSkippedRobots: 0,
    pagesSkippedDuplicate: 0,
    pagesErrored: 0,
    pagesLoadedFromStore: 0,
  };

  let pages: ScrapedAllCarePage[] = [];
  let crawlStats: AllCareCrawlStats = { ...emptyStats };
  let sources: DbIntelligenceSource[] = [];
  let logoDiscovered = false;

  const preflight = await checkAllCareIngestSchemaReady();
  if (!dry && !preflight.schemaReady) {
    throw new Error(preflight.schemaIssues.join("\n"));
  }

  if (dry) {
    const crawl = await crawlAllCarePublicSite({
      maxDepth,
      maxPages,
      robotsCache: createRobotsCache(),
    });
    pages = crawl.pages;
    crawlStats = { ...crawl.stats };
    const dryUsedLiveRobots =
      crawlStats.pagesLoadedFromStore === 0 &&
      Boolean(crawlStats.robotsSelection);
    const dryRobotsReview = deriveRobotsReviewSignals(
      crawlStats.robotsSelection,
      { usedLiveRobotsFetch: dryUsedLiveRobots },
    );
    return {
      dryRun: true,
      schemaReady: preflight.schemaReady,
      schemaIssues: preflight.schemaIssues,
      robotsOperatorNote:
        crawlStats.robotsSelection?.rulesApproximate === true
          ? "Robots matching used practical subset rules (not a full RFC engine)."
          : null,
      robotsReviewRecommended: dryRobotsReview.robotsReviewRecommended,
      robotsReviewReason: dryRobotsReview.robotsReviewReason ?? null,
      companyProfileId: profile.id,
      pagesDiscovered: crawlStats.pagesDiscovered,
      pagesFetched: crawlStats.pagesFetched,
      pagesStored: 0,
      pagesSkippedRobots: crawlStats.pagesSkippedRobots,
      pagesSkippedDuplicate: crawlStats.pagesSkippedDuplicate,
      pagesErrored: crawlStats.pagesErrored,
      pagesLoadedFromStore: 0,
      factsCreated: 0,
      tagsCreated: 0,
      claimsPromoted: 0,
      logoDiscovered: false,
      logoConfidence: null,
      errors,
      lastScrapeAt: null,
      vendorResolution: {
        vendorId: null,
        confidence: "none",
        matchType: "none",
        candidateCount: 0,
        notes: "Dry run — no resolution performed.",
      },
      promotion: { vendorMapped: false, vendorId: null },
      promotionQuality: null,
      qualityScore: null,
      qualityBand: null,
      qualityPenalties: null,
      qualityConfidence: null,
      qualityWarnings: null,
      qualityExplanation: null,
      qualityBreakdown: null,
      legacyFactsBackfilled: null,
      legacyFactAudit: null,
    };
  }

  await assertAllCareIngestSchemaCapabilities();

  if (!forceRecrawl) {
    const stored = await listIntelligenceSourcesByCompanyProfile(profile.id);
    const scraped = stored
      .filter((s) => s.sourceType === "website_scrape")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    if (scraped.length > 0) {
      pages = dbWebsiteScrapeSourcesToPages(scraped);
      sources = scraped;
      crawlStats = {
        pagesDiscovered: pages.length,
        pagesFetched: 0,
        pagesSkippedRobots: 0,
        pagesSkippedDuplicate: 0,
        pagesErrored: 0,
        pagesLoadedFromStore: pages.length,
      };
    }
  }

  if (pages.length === 0) {
    const crawl = await crawlAllCarePublicSite({
      maxDepth,
      maxPages,
      robotsCache: createRobotsCache(),
    });
    pages = crawl.pages;
    crawlStats = { ...crawl.stats };
    const persist = await persistAllCareScrapedPages({
      projectId: input.projectId,
      companyProfileId: profile.id,
      pages,
    });
    sources = persist.sources;
  }

  const homeLogo = pages.find((p) => p.logoDiscovery)?.logoDiscovery;
  const logoR = await mergeLogoDiscoveryIntoProfile({
    profileId: profile.id,
    discovery: homeLogo,
  });
  logoDiscovered = logoR.logoDiscovered;
  const logoConfidence = homeLogo?.logoConfidence ?? null;

  const lastScrapeAt = new Date().toISOString();

  const robotsOperatorNote =
    crawlStats.robotsSelection?.rulesApproximate === true
      ? "Robots matching used practical subset rules (not a full RFC engine)."
      : null;

  const usedLiveRobotsFetch =
    crawlStats.pagesLoadedFromStore === 0 &&
    Boolean(crawlStats.robotsSelection);
  const { robotsReviewRecommended, robotsReviewReason } =
    deriveRobotsReviewSignals(crawlStats.robotsSelection, {
      usedLiveRobotsFetch,
    });

  const scrapeSummaryPayload = {
    pagesDiscovered: crawlStats.pagesDiscovered,
    pagesFetched: crawlStats.pagesFetched,
    pagesSkippedRobots: crawlStats.pagesSkippedRobots,
    pagesSkippedDuplicate: crawlStats.pagesSkippedDuplicate,
    pagesErrored: crawlStats.pagesErrored,
    pagesLoadedFromStore: crawlStats.pagesLoadedFromStore,
    pagesPersisted: pages.length,
    logoDiscovered,
    robots: crawlStats.robotsSelection ?? null,
    robots_operator_note: robotsOperatorNote,
    robots_review_recommended: robotsReviewRecommended,
    robots_review_reason: robotsReviewReason ?? null,
    at: lastScrapeAt,
  };

  await recordAllCareScrapeBrandingMeta({
    profile,
    pagesScraped: pages.length,
    lastFetchedAt: lastScrapeAt,
    scrapeSummary: scrapeSummaryPayload,
  });
  await maybeEnrichSummaryFromHomepage({ profileId: profile.id, pages });

  let factsCreated = 0;
  let tagsCreated = 0;

  if (runAi) {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const src = resolveSourceForPage(page, sources, i);
      if (!page || !src) continue;
      try {
        const structured = await parseAllCarePublicPageStructured({
          pageUrl: page.url,
          pageTitle: page.title,
          pageLabel: page.pageLabel,
          bodyText: page.capturedText,
        });
        const r = await persistAllCareStructuredFacts({
          projectId: input.projectId,
          companyProfileId: profile.id,
          sourceId: src.id,
          structured,
          forceReparse: Boolean(input.forceReparse),
        });
        factsCreated += r.factsCreated;
        tagsCreated += r.tagsCreated;
      } catch (e) {
        errors.push(
          `${src.id}: ${e instanceof Error ? e.message : "AI parse failed"}`,
        );
      }
    }
  }

  const vendorResolution = await resolveVendorWithConfidence({
    projectId: input.projectId,
    profileName: profile.name,
    displayName: profile.displayName || profile.name,
    linkedVendorId: profile.linkedVendorId,
    pagesIngested: pages.length,
  });

  const vendorId = vendorResolution.vendorId;

  let promotionQuality: PromotionQualitySummary | null = null;
  let claimsPromoted = 0;
  if (vendorId && sources.length > 0) {
    const sourceIds = sources.map((s) => s.id);
    promotionQuality = await promoteAllCareWebsiteFactsToVendorClaims({
      companyProfileId: profile.id,
      vendorId,
      sourceIds,
    });
    claimsPromoted = promotionQuality.promoted;
  }

  let legacyFactsBackfilled: number | null = null;
  let legacyFactAudit: LegacyFactAuditSummary | null = null;
  if (input.runBackfill) {
    const mode: LegacyFactBackfillMode = input.backfillMode ?? "fill-missing";
    legacyFactAudit = await runLegacyFactMetadataPass(profile.id, mode);
    legacyFactsBackfilled =
      legacyFactAudit.filledMissing + legacyFactAudit.correctedValues;
  }

  const factAgg = await aggregateFactQualityForProfile(profile.id);
  const parseErrorCount = errors.length;
  const {
    qualityScore,
    qualityBand,
    confidence: qualityConfidence,
    breakdown,
    penalties,
    warnings: qualityWarnings,
    qualityExplanation,
  } = computeAllCareIngestQuality({
    crawlStats,
    pagesStored: pages.length,
    parseErrorCount,
    factAgg,
    vendorResolution,
    logoConfidence,
  });

  const vendorCandidatesMeta =
    vendorResolution.candidates?.slice(0, 8).map((c) => ({
      vendor_id: c.vendorId,
      vendor_name: c.vendorName,
      score: c.score,
      score_breakdown: c.scoreBreakdown,
      accepted: c.accepted,
    })) ?? null;

  const vendorRecommendedMeta =
    vendorResolution.recommendedCandidates?.slice(0, 3).map((c) => ({
      vendor_id: c.vendorId,
      vendor_name: c.vendorName,
      score: c.score,
      score_breakdown: c.scoreBreakdown,
    })) ?? null;

  await mergeCompanyProfileBrandingMeta({
    id: profile.id,
    patch: {
      allcare_last_promotion_at: lastScrapeAt,
      allcare_last_promotion: {
        claims_promoted: claimsPromoted,
        vendor_id: vendorId,
      },
      last_promotion_quality: promotionQuality,
      allcare_last_vendor_resolution: {
        vendor_id: vendorResolution.vendorId,
        confidence: vendorResolution.confidence,
        match_type: vendorResolution.matchType,
        candidate_count: vendorResolution.candidateCount,
        notes: vendorResolution.notes ?? null,
        operator_guidance: vendorResolution.operatorGuidance ?? null,
        recommended_action: vendorResolution.recommendedAction ?? null,
        recommended_candidates: vendorRecommendedMeta,
        candidates: vendorCandidatesMeta,
      },
      allcare_ingest_quality: {
        qualityScore,
        qualityBand,
        confidence: qualityConfidence,
        qualityExplanation,
        breakdown,
        penalties,
        warnings: qualityWarnings,
        at: lastScrapeAt,
      },
      ...(legacyFactAudit
        ? {
            allcare_last_fact_audit:
              trimLegacyFactAuditForBrandingMeta(legacyFactAudit),
          }
        : {}),
    },
  });

  return {
    dryRun: false,
    companyProfileId: profile.id,
    pagesDiscovered: crawlStats.pagesDiscovered,
    pagesFetched: crawlStats.pagesFetched,
    pagesStored: pages.length,
    pagesSkippedRobots: crawlStats.pagesSkippedRobots,
    pagesSkippedDuplicate: crawlStats.pagesSkippedDuplicate,
    pagesErrored: crawlStats.pagesErrored,
    pagesLoadedFromStore: crawlStats.pagesLoadedFromStore,
    factsCreated,
    tagsCreated,
    claimsPromoted,
    logoDiscovered,
    logoConfidence,
    errors,
    lastScrapeAt,
    vendorResolution,
    promotion: {
      vendorMapped: Boolean(vendorId),
      vendorId,
    },
    promotionQuality,
    qualityScore,
    qualityBand,
    qualityPenalties: penalties,
    qualityConfidence,
    qualityWarnings,
    qualityExplanation,
    schemaReady: true,
    schemaIssues: [],
    robotsOperatorNote,
    robotsReviewRecommended,
    robotsReviewReason: robotsReviewReason ?? null,
    qualityBreakdown: breakdown,
    legacyFactsBackfilled,
    legacyFactAudit,
  };
}
