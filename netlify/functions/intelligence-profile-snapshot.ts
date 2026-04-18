import type { Handler } from "@netlify/functions";
import {
  getCompanyProfile,
  listFactsByCompanyProfile,
  listIntelligenceSourcesByCompanyProfile,
} from "../../src/server/repositories/intelligence.repo";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { companyProfileId: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.companyProfileId) {
    return jsonResponse(400, { error: "companyProfileId required" });
  }
  try {
    const profile = await getCompanyProfile(body.companyProfileId);
    if (!profile) {
      return jsonResponse(404, { error: "Company profile not found" });
    }
    const sources = await listIntelligenceSourcesByCompanyProfile(
      body.companyProfileId,
    );
    const facts = await listFactsByCompanyProfile(body.companyProfileId);
    return jsonResponse(200, {
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
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
