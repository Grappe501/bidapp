import type { Handler } from "@netlify/functions";
import {
  loadAllCareBrandingWithStatsForProject,
  loadBrandingProfileWithStats,
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
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  const cid = body?.companyProfileId?.trim();
  const pid = body?.projectId?.trim();
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
      return jsonResponse(200, { branding });
    }
    const branding = await loadAllCareBrandingWithStatsForProject(
      pid!,
      Boolean(body?.ensureProfile),
    );
    if (!branding) {
      return jsonResponse(404, {
        error:
          "AllCare client profile not found for project; pass ensureProfile: true to create it",
      });
    }
    return jsonResponse(200, { branding });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
