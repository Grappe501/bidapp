import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  isStrictDbModeRuntime,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  getCompanyProfile,
  listFactsByCompanyProfile,
  listIntelligenceSourcesByCompanyProfile,
} from "../../src/server/repositories/intelligence.repo";
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
          { error: "projectId is required for company-scoped operations in strict mode" },
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
    const sources = await listIntelligenceSourcesByCompanyProfile(cid);
    const facts = await listFactsByCompanyProfile(cid);
    return jsonResponse(
      200,
      {
        profile: {
          id: profile.id,
          name: profile.name,
          projectId: profile.projectId,
          profileType: profile.profileType,
          websiteUrl: profile.websiteUrl,
          displayName: profile.displayName,
          summary: profile.summary,
        },
        sources: sources.map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          sourceType: s.sourceType,
          validationStatus: s.validationStatus,
          textLength: s.rawText.length,
          fetchedAt: s.fetchedAt,
        })),
        facts: facts.map((f) => ({
          id: f.id,
          factType: f.factType,
          factText: f.factText,
          validationStatus: f.validationStatus,
          classification: f.classification,
          sourceId: f.sourceId,
        })),
      },
      event,
    );
  } catch (e) {
    logServerError("intelligence-profile-snapshot", e);
    return internalErrorResponse(event);
  }
};
