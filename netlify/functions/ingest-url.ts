import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { runIngestUrlJob } from "../../src/server/jobs/ingest-url.job";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  url: string;
  projectId: string;
  companyProfileId?: string | null;
  classification?: string | null;
  title?: string | null;
  metadata?: Record<string, unknown>;
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
  if (!body?.url || !body.projectId) {
    return jsonResponse(400, { error: "url and projectId required" }, event);
  }
  try {
    const result = await runIngestUrlJob({
      url: body.url,
      projectId: body.projectId,
      companyProfileId: body.companyProfileId,
      classification: body.classification,
      title: body.title,
      metadata: body.metadata,
    });
    return jsonResponse(200, result, event);
  } catch (e) {
    logServerError("ingest-url", e);
    return internalErrorResponse(event);
  }
};
