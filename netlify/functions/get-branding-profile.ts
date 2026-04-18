import type { Handler } from "@netlify/functions";
import { assertInternalApiKey, internalErrorResponse, logServerError } from "../../src/server/netlify/guards";
import {
  loadAllCareBrandingWithStatsForProject,
  loadBrandingProfileWithStats,
  type GetBrandingProfileResponseBody,
} from "../../src/server/services/branding.service";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId?: string;
  companyProfileId?: string;
  /** When true with projectId, creates or updates the AllCare client row (non-destructive). */
  ensureProfile?: boolean;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const req = readJson<Body>(event.body);
  const cid = req?.companyProfileId?.trim();
  const pid = req?.projectId?.trim();
  if (!cid && !pid) {
    return jsonResponse(400, {
      error: "projectId or companyProfileId required",
    });
  }
  try {
    if (cid) {
      const branding = await loadBrandingProfileWithStats(cid);
      if (!branding) {
        return jsonResponse(404, { error: "Company profile not found" });
      }
      const responseBody: GetBrandingProfileResponseBody = { branding };
      return jsonResponse(200, responseBody);
    }
    const branding = await loadAllCareBrandingWithStatsForProject(
      pid!,
      Boolean(req?.ensureProfile),
    );
    if (!branding) {
      return jsonResponse(404, {
        error:
          "AllCare client profile not found for project; pass ensureProfile: true to create it",
      });
    }
    const responseBody: GetBrandingProfileResponseBody = { branding };
    return jsonResponse(200, responseBody);
  } catch (e) { logServerError("get-branding-profile", e); return internalErrorResponse(); }
};
