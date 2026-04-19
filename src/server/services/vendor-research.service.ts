import { VENDOR_INTELLIGENCE_PIPELINE } from "../../data/vendor-intelligence-system";
import {
  createIntelligenceFact,
  getIntelligenceSource,
} from "../repositories/intelligence.repo";
import { getProject } from "../repositories/project.repo";
import { getVendorById } from "../repositories/vendor.repo";
import {
  insertVendorDiscoveryCandidate,
  insertVendorResearchRun,
  updateVendorResearchRun,
} from "../repositories/vendor-intelligence.repo";
import {
  extractEntitiesForMode,
  type NormalizedVendorClaim,
} from "./ai-parsing.service";
import { createVendorClaim } from "../repositories/vendor.repo";
import { ingestUrlToSource } from "./ingestion.service";
import { isVendorSearchConfigured, searchWeb } from "./vendor-search.service";

function buildVendorQueries(vendorName: string, bidHint: string): string[] {
  const base = vendorName.trim();
  return [
    `${base} pharmacy software API integration`,
    `${base} long term care EHR`,
    `${base} company overview`,
    `${base} ${bidHint} services`.trim(),
  ].filter((q) => q.length > 2);
}

const FACET_FACT_TYPES: Record<string, string> = {
  performance: "vendor_research_performance",
  integration_surface: "vendor_research_integration",
  risk: "vendor_research_risk",
};

/**
 * Runs vendor web research: queries → optional Serper → ingest URLs → LLM enrichment
 * (claims, company facts, facet rows). Records vendor_research_runs.
 */
export async function runVendorResearchJob(input: {
  projectId: string;
  vendorId: string;
}): Promise<{
  runId: string;
  urlsIngested: number;
  claimsCreated: number;
  factsCreated: number;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const project = await getProject(input.projectId);
  if (!project) throw new Error("Project not found");
  const vendor = await getVendorById(input.vendorId);
  if (!vendor || vendor.projectId !== input.projectId) {
    throw new Error("Vendor not found for project");
  }

  const run = await insertVendorResearchRun({
    projectId: input.projectId,
    vendorId: input.vendorId,
    runType: "full",
    status: "running",
    summary: "started",
  });

  let urlsIngested = 0;
  let claimsCreated = 0;
  let factsCreated = 0;

  try {
    if (!isVendorSearchConfigured()) {
      warnings.push(
        "SERPER_API_KEY not set — search stage skipped; add key for live URL discovery.",
      );
    }

    const queries = buildVendorQueries(vendor.name, project.bidNumber);
    const urlSet = new Set<string>();
    if (isVendorSearchConfigured()) {
      for (const q of queries) {
        const hits = await searchWeb(q);
        for (const h of hits.slice(0, 3)) {
          urlSet.add(h.url);
        }
      }
      const altQ = `${vendor.name} competitors alternatives`;
      const altHits = await searchWeb(altQ);
      for (const h of altHits.slice(0, 5)) {
        try {
          const host = new URL(h.url).hostname.replace(/^www\./, "");
          await insertVendorDiscoveryCandidate({
            projectId: input.projectId,
            name: h.title || host,
            domain: host,
            similarityScore: 0.35,
            status: "new",
          });
        } catch {
          /* ignore bad URLs */
        }
      }
    }

    const maxUrls = 6;
    for (const url of [...urlSet].slice(0, maxUrls)) {
      try {
        const { sourceId } = await ingestUrlToSource({
          url,
          projectId: input.projectId,
          companyProfileId: null,
          classification: "vendor_research",
          title: url,
          metadata: {
            vendorId: input.vendorId,
            ingest: "vendor_research",
            pipeline: VENDOR_INTELLIGENCE_PIPELINE.map((p) => p.stage),
          },
        });
        urlsIngested++;
        const src = await getIntelligenceSource(sourceId);
        const text = src?.rawText?.trim() ?? "";
        if (text.length < 80) continue;

        const claimEntities = await extractEntitiesForMode(
          text,
          "extract_vendor_claims",
        );
        for (const ent of claimEntities) {
          const n = ent as NormalizedVendorClaim;
          const claimText = n.claimText?.trim() ?? "";
          if (!claimText) continue;
          await createVendorClaim({
            vendorId: input.vendorId,
            sourceId,
            claimText,
            validationStatus: n.validationStatus,
            credibility: n.credibility,
            confidence: n.confidence,
            claimCategory: n.claimCategory,
          });
          claimsCreated++;
        }

        const factEntities = await extractEntitiesForMode(
          text,
          "extract_company_facts",
        );
        for (const ent of factEntities) {
          const e = ent as Record<string, unknown>;
          const factText = String(e.factText ?? "").trim();
          if (!factText) continue;
          await createIntelligenceFact({
            projectId: input.projectId,
            sourceId,
            companyProfileId: null,
            factType: String(e.factType ?? "general"),
            factText,
            classification: String(e.provenanceKind ?? "Vendor Claim"),
            validationStatus: "Pending Validation",
            credibility: "operational",
            confidence: "medium",
          });
          factsCreated++;
        }

        const facets = await extractEntitiesForMode(
          text,
          "extract_vendor_research_facets",
        );
        for (const f of facets) {
          const row = f as Record<string, unknown>;
          const bucket = String(row.bucket ?? "").trim();
          const factText = String(row.factText ?? "").trim();
          if (!factText || !FACET_FACT_TYPES[bucket]) continue;
          await createIntelligenceFact({
            projectId: input.projectId,
            sourceId,
            companyProfileId: null,
            factType: FACET_FACT_TYPES[bucket],
            factText,
            classification: "vendor_research_facet",
            validationStatus: "Pending Validation",
            credibility: "operational",
            confidence: String(row.confidence ?? "medium"),
          });
          factsCreated++;
        }
      } catch (e) {
        warnings.push(
          e instanceof Error ? e.message : `ingest failed for ${url}`,
        );
      }
    }

    await updateVendorResearchRun({
      id: run.id,
      status: "completed",
      summary: `urls=${urlsIngested}; claims=${claimsCreated}; facts=${factsCreated}`,
    });

    return {
      runId: run.id,
      urlsIngested,
      claimsCreated,
      factsCreated,
      warnings,
    };
  } catch (err) {
    await updateVendorResearchRun({
      id: run.id,
      status: "failed",
      summary: err instanceof Error ? err.message : "failed",
    });
    throw err;
  }
}
