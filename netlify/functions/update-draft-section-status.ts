import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import type { DraftStatus } from "../../src/types";
import { DRAFT_STATUSES } from "../../src/types";
import {
  getDraftSectionByIdForProject,
  updateDraftSectionStatus,
} from "../../src/server/repositories/draft.repo";
import { wireDraftSection } from "../../src/server/netlify/draft-wire";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { projectId: string; sectionId: string; status: DraftStatus };

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.sectionId || !body.status) {
    return jsonResponse(
      400,
      { error: "projectId, sectionId, and status required" },
      event,
    );
  }
  if (!DRAFT_STATUSES.includes(body.status)) {
    return jsonResponse(400, { error: "invalid status" }, event);
  }
  try {
    const ok = await updateDraftSectionStatus({
      projectId: body.projectId,
      sectionId: body.sectionId,
      status: body.status,
    });
    if (!ok) {
      return jsonResponse(400, { error: "could not update status" }, event);
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
    logServerError("update-draft-section-status", e);
    return internalErrorResponse(event);
  }
};
