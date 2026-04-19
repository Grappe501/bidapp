import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  getDraftSectionByIdForProject,
  setActiveDraftVersion,
} from "../../src/server/repositories/draft.repo";
import { wireDraftSection } from "../../src/server/netlify/draft-wire";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { projectId: string; sectionId: string; versionId: string };

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.sectionId || !body.versionId) {
    return jsonResponse(
      400,
      { error: "projectId, sectionId, and versionId required" },
      event,
    );
  }
  try {
    const ok = await setActiveDraftVersion({
      projectId: body.projectId,
      sectionId: body.sectionId,
      versionId: body.versionId,
    });
    if (!ok) {
      return jsonResponse(400, { error: "could not set active version" }, event);
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
    logServerError("set-active-draft-version", e);
    return internalErrorResponse(event);
  }
};
