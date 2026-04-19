import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  getDraftSectionByIdForProject,
  updateDraftVersionNoteLocked,
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
  versionId: string;
  note?: string | null;
  locked?: boolean;
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
  if (!body?.projectId || !body.versionId) {
    return jsonResponse(400, { error: "projectId and versionId required" }, event);
  }
  if (body.note === undefined && body.locked === undefined) {
    return jsonResponse(400, { error: "note and/or locked required" }, event);
  }
  try {
    const v = await updateDraftVersionNoteLocked({
      projectId: body.projectId,
      versionId: body.versionId,
      note: body.note,
      locked: body.locked,
    });
    if (!v) {
      return jsonResponse(400, { error: "could not update version" }, event);
    }
    const sec = await getDraftSectionByIdForProject(
      body.projectId,
      v.sectionId,
    );
    return jsonResponse(
      200,
      {
        version: wireDraftVersion(v),
        section: sec ? wireDraftSection(sec) : null,
      },
      event,
    );
  } catch (e) {
    logServerError("update-draft-version", e);
    return internalErrorResponse(event);
  }
};
