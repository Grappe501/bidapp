import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  isStrictDbModeRuntime,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  loadAllCareBrandingWithStatsForProject,
  loadBrandingProfileWithStats,
  type GetBrandingProfileResponseBody,
} from "../../src/server/services/branding.service";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId?: string;
  companyProfileId?: string;
  /** When true with projectId, creates or updates the AllCare client row (non-destructive). */
  ensureProfile?: boolean;
};

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const req = readJson<Body>(event.body);
  const cid = req?.companyProfileId?.trim();
  const pid = req?.projectId?.trim();
  if (!cid && !pid) {
    return jsonResponse(
      400,
      { error: "projectId or companyProfileId required" },
      event,
    );
  }
  try {
    if (cid) {
      if (isStrictDbModeRuntime()) {
        const reqProject = req?.projectId?.trim();
        if (!reqProject) {
          return jsonResponse(
            400,
            {
              error:
                "projectId is required when using companyProfileId in strict mode",
            },
            event,
          );
        }
        const branding = await loadBrandingProfileWithStats(cid);
        if (!branding) {
          return jsonResponse(404, { error: "Company profile not found" }, event);
        }
        if (branding.projectId !== reqProject) {
          return jsonResponse(
            400,
            { error: "projectId does not match this company profile" },
            event,
          );
        }
        const responseBody: GetBrandingProfileResponseBody = { branding };
        return jsonResponse(200, responseBody, event);
      }
      const branding = await loadBrandingProfileWithStats(cid);
      if (!branding) {
        return jsonResponse(404, { error: "Company profile not found" }, event);
      }
      const responseBody: GetBrandingProfileResponseBody = { branding };
      return jsonResponse(200, responseBody, event);
    }
    const branding = await loadAllCareBrandingWithStatsForProject(
      pid!,
      Boolean(req?.ensureProfile),
    );
    if (!branding) {
      return jsonResponse(
        404,
        {
          error:
            "AllCare client profile not found for project; pass ensureProfile: true to create it",
        },
        event,
      );
    }
    const responseBody: GetBrandingProfileResponseBody = { branding };
    return jsonResponse(200, responseBody, event);
  } catch (e) {
    logServerError("get-branding-profile", e);
    return internalErrorResponse(event);
  }
};
