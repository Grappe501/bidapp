import type { Handler } from "@netlify/functions";
import { assertInternalApiKey, internalErrorResponse, logServerError } from "../../src/server/netlify/guards";
import {
  getDraftSectionByIdForProject,
  updateDraftSectionSelectedBundle,
} from "../../src/server/repositories/draft.repo";
import { wireDraftSection } from "../../src/server/netlify/draft-wire";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId: string;
  sectionId: string;
  bundleId: string | null;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.sectionId) {
    return jsonResponse(400, { error: "projectId and sectionId required" });
  }
  if (body.bundleId === undefined) {
    return jsonResponse(400, { error: "bundleId required (or null)" });
  }
  try {
    const ok = await updateDraftSectionSelectedBundle({
      projectId: body.projectId,
      sectionId: body.sectionId,
      bundleId: body.bundleId,
    });
    if (!ok) {
      return jsonResponse(400, { error: "could not update bundle selection" });
    }
    const sec = await getDraftSectionByIdForProject(
      body.projectId,
      body.sectionId,
    );
    if (!sec) {
      return jsonResponse(500, { error: "section not found" });
    }
    return jsonResponse(200, { section: wireDraftSection(sec) });
  } catch (e) { logServerError("set-draft-section-bundle", e); return internalErrorResponse(); }
};
