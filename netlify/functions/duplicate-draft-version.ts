import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  duplicateDraftVersion,
  getDraftSectionByIdForProject,
} from "../../src/server/repositories/draft.repo";
import {
  wireDraftSection,
  wireDraftVersion,
} from "../../src/server/netlify/draft-wire";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId: string;
  sectionId: string;
  sourceVersionId: string;
  note?: string | null;
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
  if (!body?.projectId || !body.sectionId || !body.sourceVersionId) {
    return jsonResponse(
      400,
      { error: "projectId, sectionId, and sourceVersionId required" },
      event,
    );
  }
  try {
    const v = await duplicateDraftVersion({
      projectId: body.projectId,
      sectionId: body.sectionId,
      sourceVersionId: body.sourceVersionId,
      note: body.note ?? null,
    });
    if (!v) {
      return jsonResponse(400, { error: "could not duplicate version" }, event);
    }
    const sec = await getDraftSectionByIdForProject(
      body.projectId,
      body.sectionId,
    );
    if (!sec) {
      return jsonResponse(404, { error: "Not found" }, event);
    }
    return jsonResponse(
      200,
      {
        version: wireDraftVersion(v),
        section: wireDraftSection(sec),
      },
      event,
    );
  } catch (e) {
    logServerError("duplicate-draft-version", e);
    return internalErrorResponse(event);
  }
};
