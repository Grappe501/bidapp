import type { Handler } from "@netlify/functions";
import { runAllCareSiteIngestJob } from "../../src/server/services/allcare-ingest.job";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId: string;
  companyProfileId?: string | null;
  dryRun?: boolean;
  runAiParse?: boolean;
  forceReparse?: boolean;
  /** Default true. Set false to reuse stored pages only (no HTTP) when rows exist. */
  forceRecrawl?: boolean;
  maxPages?: number;
  maxDepth?: number;
  /** Backfill empty credibility/confidence on legacy intelligence_facts for this profile. */
  runBackfill?: boolean;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId?.trim()) {
    return jsonResponse(400, { error: "projectId required" });
  }
  try {
    const result = await runAllCareSiteIngestJob({
      projectId: body.projectId.trim(),
      companyProfileId: body.companyProfileId?.trim() ?? null,
      dryRun: Boolean(body.dryRun),
      runAiParse: body.runAiParse,
      forceReparse: Boolean(body.forceReparse),
      forceRecrawl: body.forceRecrawl,
      maxPages: body.maxPages,
      maxDepth: body.maxDepth,
      runBackfill: Boolean(body.runBackfill),
    });
    return jsonResponse(200, {
      ...result,
      pages_scraped: result.pagesStored,
      sources_upserted: result.pagesStored,
      facts_created: result.factsCreated,
      tags_created: result.tagsCreated,
      claims_promoted: result.claimsPromoted,
      last_scrape_at: result.lastScrapeAt,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
