import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  isStrictDbModeRuntime,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { runEnrichCompanyJob } from "../../src/server/jobs/enrich-company.job";
import { getCompanyProfile } from "../../src/server/repositories/intelligence.repo";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { companyProfileId: string; projectId?: string };

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.companyProfileId?.trim()) {
    return jsonResponse(400, { error: "companyProfileId is required" }, event);
  }
  const cid = body.companyProfileId.trim();
  try {
    const profile = await getCompanyProfile(cid);
    if (!profile) {
      return jsonResponse(404, { error: "Company profile not found" }, event);
    }
    if (isStrictDbModeRuntime()) {
      const reqPid = body.projectId?.trim();
      if (!reqPid) {
        return jsonResponse(
          400,
          {
            error:
              "projectId is required for company-scoped operations in strict mode",
          },
          event,
        );
      }
      if (profile.projectId !== reqPid) {
        return jsonResponse(
          400,
          { error: "projectId does not match this company profile" },
          event,
        );
      }
    }
    const result = await runEnrichCompanyJob({
      companyProfileId: cid,
    });
    return jsonResponse(200, result, event);
  } catch (e) {
    logServerError("enrich-company", e);
    return internalErrorResponse(event);
  }
};
