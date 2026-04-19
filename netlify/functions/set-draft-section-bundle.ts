import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  getDraftSectionByIdForProject,
  updateDraftSectionSelectedBundle,
} from "../../src/server/repositories/draft.repo";
import { wireDraftSection } from "../../src/server/netlify/draft-wire";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId: string;
  sectionId: string;
  bundleId: string | null;
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
  if (!body?.projectId || !body.sectionId) {
    return jsonResponse(400, { error: "projectId and sectionId required" }, event);
  }
  if (body.bundleId === undefined) {
    return jsonResponse(400, { error: "bundleId required (or null)" }, event);
  }
  try {
    const ok = await updateDraftSectionSelectedBundle({
      projectId: body.projectId,
      sectionId: body.sectionId,
      bundleId: body.bundleId,
    });
    if (!ok) {
      return jsonResponse(400, { error: "could not update bundle selection" }, event);
    }
    const sec = await getDraftSectionByIdForProject(
      body.projectId,
      body.sectionId,
    );
    if (!sec) {
      return jsonResponse(404, { error: "Not found" }, event);
    }
    return jsonResponse(200, { section: wireDraftSection(sec) }, event);
  } catch (e) {
    logServerError("set-draft-section-bundle", e);
    return internalErrorResponse(event);
  }
};
