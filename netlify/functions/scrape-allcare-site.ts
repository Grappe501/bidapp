import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { runAllCareSiteIngestJob } from "../../src/server/services/allcare-ingest.job";
import {
  jsonResponse,
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
  /**
   * When true, runs legacy fact metadata pass (see backfillMode).
   * Default false — no extra fact-row writes beyond normal ingest.
   */
  runBackfill?: boolean;
  backfillMode?:
    | "fill-missing"
    | "audit-only"
    | "safe-correct"
    | "moderate-correct";
};

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId?.trim()) {
    return jsonResponse(400, { error: "projectId required" }, event);
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
      backfillMode: body.backfillMode,
    });
    return jsonResponse(
      200,
      {
        ...result,
        pages_scraped: result.pagesStored,
        sources_upserted: result.pagesStored,
        facts_created: result.factsCreated,
        tags_created: result.tagsCreated,
        claims_promoted: result.claimsPromoted,
        last_scrape_at: result.lastScrapeAt,
      },
      event,
    );
  } catch (e) {
    logServerError("scrape-allcare-site", e);
    return internalErrorResponse(event);
  }
};
