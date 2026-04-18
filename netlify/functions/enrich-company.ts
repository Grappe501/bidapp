import type { Handler } from "@netlify/functions";
import { assertInternalApiKey, internalErrorResponse, logServerError } from "../../src/server/netlify/guards";
import { runEnrichCompanyJob } from "../../src/server/jobs/enrich-company.job";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { companyProfileId: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.companyProfileId) {
    return jsonResponse(400, { error: "companyProfileId required" });
  }
  try {
    const result = await runEnrichCompanyJob({
      companyProfileId: body.companyProfileId,
    });
    return jsonResponse(200, result);
  } catch (e) { logServerError("enrich-company", e); return internalErrorResponse(); }
};
