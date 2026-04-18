import type { Handler } from "@netlify/functions";
import { assertInternalApiKey, internalErrorResponse, logServerError } from "../../src/server/netlify/guards";
import { runIngestUrlJob } from "../../src/server/jobs/ingest-url.job";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  url: string;
  projectId: string;
  companyProfileId?: string | null;
  classification?: string | null;
  title?: string | null;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.url || !body.projectId) {
    return jsonResponse(400, { error: "url and projectId required" });
  }
  try {
    const result = await runIngestUrlJob({
      url: body.url,
      projectId: body.projectId,
      companyProfileId: body.companyProfileId,
      classification: body.classification,
      title: body.title,
    });
    return jsonResponse(200, result);
  } catch (e) { logServerError("ingest-url", e); return internalErrorResponse(); }
};
