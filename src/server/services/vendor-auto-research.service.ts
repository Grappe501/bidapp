import {
  assertIntelligenceFactsCredibilityColumns,
  createIntelligenceFact,
  getIntelligenceSource,
  countVendorSiteSourcesForVendor,
  upsertVendorSitePageSource,
} from "../repositories/intelligence.repo";
import { getProject } from "../repositories/project.repo";
import {
  getVendorById,
  updateVendorWebsiteFields,
  createVendorClaim,
} from "../repositories/vendor.repo";
import {
  insertVendorResearchRun,
  updateVendorResearchRun,
  upsertVendorIntegrationRequirement,
} from "../repositories/vendor-intelligence.repo";
import {
  extractEntitiesForMode,
  extractVendorWebSignals,
  type NormalizedVendorClaim,
} from "./ai-parsing.service";
import { computeVendorFit } from "./vendor-fit.service";
import { generateVendorInterviewQuestions } from "./vendor-interview.service";
import { ingestUrlToSource } from "./ingestion.service";
import { computeVendorScore } from "./vendor-scoring.service";
import { crawlVendorSite } from "./vendor-site-crawl.service";
import {
  extractDomainFromUrl,
  normalizeVendorWebsiteUrl,
} from "../lib/vendor-site-url";

const FACET_FACT_TYPES: Record<string, string> = {
  performance: "vendor_research_performance",
  integration_surface: "vendor_research_integration",
  risk: "vendor_research_risk",
};

async function extractAndStorePage(input: {
  projectId: string;
  vendorId: string;
  sourceId: string;
  text: string;
}): Promise<{ claims: number; facts: number }> {
  let claims = 0;
  let facts = 0;

  const claimEntities = await extractEntitiesForMode(
    input.text,
    "extract_vendor_claims",
  );
  for (const ent of claimEntities) {
    const n = ent as NormalizedVendorClaim;
    const claimText = n.claimText?.trim() ?? "";
    if (!claimText) continue;
    await createVendorClaim({
      vendorId: input.vendorId,
      sourceId: input.sourceId,
      claimText,
      validationStatus: n.validationStatus,
      credibility: n.credibility,
      confidence: n.confidence,
      claimCategory: n.claimCategory,
    });
    claims++;
  }

  const factEntities = await extractEntitiesForMode(
    input.text,
    "extract_company_facts",
  );
  for (const ent of factEntities) {
    const e = ent as Record<string, unknown>;
    const factText = String(e.factText ?? "").trim();
    if (!factText) continue;
    await createIntelligenceFact({
      projectId: input.projectId,
      sourceId: input.sourceId,
      companyProfileId: null,
      factType: String(e.factType ?? "vendor_site_fact"),
      factText,
      classification: String(e.provenanceKind ?? "Vendor Claim"),
      validationStatus: "Pending Validation",
      credibility: "operational",
      confidence: "medium",
    });
    facts++;
  }

  const facets = await extractEntitiesForMode(
    input.text,
    "extract_vendor_research_facets",
  );
  for (const f of facets) {
    const row = f as Record<string, unknown>;
    const bucket = String(row.bucket ?? "").trim();
    const factText = String(row.factText ?? "").trim();
    if (!factText || !FACET_FACT_TYPES[bucket]) continue;
    await createIntelligenceFact({
      projectId: input.projectId,
      sourceId: input.sourceId,
      companyProfileId: null,
      factType: FACET_FACT_TYPES[bucket],
      factText,
      classification: "vendor_research_facet",
      validationStatus: "Pending Validation",
      credibility: "operational",
      confidence: String(row.confidence ?? "medium"),
    });
    facts++;
  }

  return { claims, facts };
}

function mapStatusHintToRowStatus(hint: string): string {
  const h = hint.toLowerCase();
  if (h.includes("verif") || h.includes("confirm")) return "preferred";
  if (h.includes("gap") || h.includes("unknown")) return "gap";
  if (h.includes("risk") || h.includes("concern")) return "unknown";
  return "unknown";
}

/**
 * Full pipeline: crawl vendor public site → evidence rows → AI extraction → fit/score/interview refresh.
 */
export async function runVendorAutoResearchFromWebsite(input: {
  projectId: string;
  vendorId: string;
  baseUrl?: string;
  maxPages?: number;
  maxDepth?: number;
  forceRecrawl?: boolean;
  /** Skip HTTP crawl; re-parse existing vendor_site_page sources only (not implemented in v1 — reserved). */
  reparseOnly?: boolean;
}): Promise<{
  runId: string;
  pagesStored: number;
  claimsCreated: number;
  factsCreated: number;
  warnings: string[];
  crawlStats: Record<string, unknown>;
}> {
  const project = await getProject(input.projectId);
  if (!project) throw new Error("Project not found");
  const vendor = await getVendorById(input.vendorId);
  if (!vendor || vendor.projectId !== input.projectId) {
    throw new Error("Vendor not found for project");
  }

  const urlRaw = (input.baseUrl ?? vendor.websiteUrl ?? "").trim();
  const normalized = normalizeVendorWebsiteUrl(urlRaw);
  if (!normalized) {
    throw new Error("Valid vendor website URL is required before running site research");
  }
  const domain = extractDomainFromUrl(normalized);
  await updateVendorWebsiteFields({
    vendorId: vendor.id,
    websiteUrl: normalized,
    vendorDomain: domain,
    websiteCrawlStatus: "running",
    websiteCrawlError: "",
  });

  const run = await insertVendorResearchRun({
    projectId: input.projectId,
    vendorId: input.vendorId,
    runType: "vendor_website_crawl",
    status: "running",
    summary: "started",
    stats: { phase: "crawl" },
  });

  const warnings: string[] = [];
  let pagesStored = 0;
  let claimsCreated = 0;
  let factsCreated = 0;

  try {
    await assertIntelligenceFactsCredibilityColumns();

    if (input.reparseOnly) {
      warnings.push("reparseOnly is not implemented for v1 — running full crawl.");
    }

    const crawl = await crawlVendorSite({
      baseUrl: normalized,
      maxPages: input.maxPages ?? 18,
      maxDepth: input.maxDepth ?? 2,
      forceRecrawl: input.forceRecrawl ?? false,
    });
    warnings.push(...crawl.warnings);

    for (const page of crawl.pages) {
      const src = await upsertVendorSitePageSource({
        projectId: input.projectId,
        vendorId: input.vendorId,
        crawlRunId: run.id,
        url: page.url,
        urlNormalized: page.urlNormalized,
        title: page.title,
        rawText: page.rawText,
        pageType: page.pageType,
        crawlDepth: page.crawlDepth,
        keptReason: page.keptReason,
        priorityScore: page.priorityScore,
      });
      pagesStored++;

      const sig = await extractVendorWebSignals({
        text: page.rawText,
        pageType: page.pageType,
      });
      for (const h of sig.integrationRequirementHints) {
        const key = (h.requirementKey || "integration_surface").trim().slice(0, 80);
        if (!key) continue;
        await upsertVendorIntegrationRequirement({
          vendorId: input.vendorId,
          requirementKey: key,
          status: mapStatusHintToRowStatus(h.statusHint || ""),
          evidence: (h.evidenceSnippet || "").slice(0, 2000),
        });
      }
      for (const r of sig.riskHints) {
        const t = r.trim();
        if (!t) continue;
        await createIntelligenceFact({
          projectId: input.projectId,
          sourceId: src.id,
          companyProfileId: null,
          factType: "vendor_site_risk_hint",
          factText: t.slice(0, 4000),
          classification: "vendor_web_extraction",
          validationStatus: "Pending Validation",
          credibility: "inferred",
          confidence: "low",
        });
        factsCreated++;
      }

      const srcRow = await getIntelligenceSource(src.id);
      const text = srcRow?.rawText?.trim() ?? "";
      if (text.length >= 80) {
        const ex = await extractAndStorePage({
          projectId: input.projectId,
          vendorId: input.vendorId,
          sourceId: src.id,
          text,
        });
        claimsCreated += ex.claims;
        factsCreated += ex.facts;
      }
    }

    await computeVendorFit({ projectId: input.projectId, vendorId: input.vendorId });
    await computeVendorScore(input.vendorId);
    await generateVendorInterviewQuestions(input.vendorId, input.projectId);

    const evidenceCount = await countVendorSiteSourcesForVendor({
      projectId: input.projectId,
      vendorId: input.vendorId,
    });

    const finishedStats: Record<string, unknown> = {
      crawl: crawl.stats,
      pagesStored,
      claimsCreated,
      factsCreated,
      evidenceSourcesTotal: evidenceCount,
      fitUpdated: true,
      scoreUpdated: true,
      interviewRegenerated: true,
    };

    await updateVendorWebsiteFields({
      vendorId: vendor.id,
      websiteUrl: normalized,
      vendorDomain: domain,
      websiteLastCrawledAt: new Date().toISOString(),
      websiteCrawlStatus: "completed",
      websiteCrawlError: "",
    });

    await updateVendorResearchRun({
      id: run.id,
      status: "completed",
      summary: `pages=${pagesStored}; claims=${claimsCreated}; facts=${factsCreated}`,
      stats: finishedStats,
    });

    return {
      runId: run.id,
      pagesStored,
      claimsCreated,
      factsCreated,
      warnings,
      crawlStats: crawl.stats as unknown as Record<string, unknown>,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    await updateVendorWebsiteFields({
      vendorId: vendor.id,
      websiteUrl: normalized,
      vendorDomain: domain,
      websiteCrawlStatus: "failed",
      websiteCrawlError: msg.slice(0, 2000),
    });
    await updateVendorResearchRun({
      id: run.id,
      status: "failed",
      summary: msg.slice(0, 2000),
      stats: { error: msg },
    });
    throw e;
  }
}

/**
 * Ingest a single public URL into vendor evidence (manual / off-domain docs).
 */
export async function ingestVendorManualUrl(input: {
  projectId: string;
  vendorId: string;
  url: string;
  title?: string;
}): Promise<{ sourceId: string; claimsCreated: number; factsCreated: number }> {
  await assertIntelligenceFactsCredibilityColumns();
  const vendor = await getVendorById(input.vendorId);
  if (!vendor || vendor.projectId !== input.projectId) {
    throw new Error("Vendor not found for project");
  }
  const { sourceId } = await ingestUrlToSource({
    url: input.url.trim(),
    projectId: input.projectId,
    companyProfileId: null,
    classification: "vendor_manual_url",
    title: input.title ?? input.url,
    metadata: {
      vendorId: input.vendorId,
      ingest: "vendor_manual_url",
    },
  });

  const src = await getIntelligenceSource(sourceId);
  const text = src?.rawText?.trim() ?? "";
  let claimsCreated = 0;
  let factsCreated = 0;
  if (text.length >= 80) {
    const ex = await extractAndStorePage({
      projectId: input.projectId,
      vendorId: input.vendorId,
      sourceId,
      text,
    });
    claimsCreated = ex.claims;
    factsCreated = ex.facts;
  }
  await computeVendorFit({ projectId: input.projectId, vendorId: input.vendorId });
  await computeVendorScore(input.vendorId);
  return { sourceId, claimsCreated, factsCreated };
}
