import type { Handler } from "@netlify/functions";
import { assertInternalApiKey, internalErrorResponse, logServerError } from "../../src/server/netlify/guards";
import type { DraftStatus } from "../../src/types";
import { DRAFT_STATUSES } from "../../src/types";
import {
  getDraftSectionByIdForProject,
  updateDraftSectionStatus,
} from "../../src/server/repositories/draft.repo";
import { wireDraftSection } from "../../src/server/netlify/draft-wire";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { projectId: string; sectionId: string; status: DraftStatus };

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.sectionId || !body.status) {
    return jsonResponse(400, {
      error: "projectId, sectionId, and status required",
    });
  }
  if (!DRAFT_STATUSES.includes(body.status)) {
    return jsonResponse(400, { error: "invalid status" });
  }
  try {
    const ok = await updateDraftSectionStatus({
      projectId: body.projectId,
      sectionId: body.sectionId,
      status: body.status,
    });
    if (!ok) {
      return jsonResponse(400, { error: "could not update status" });
    }
    const sec = await getDraftSectionByIdForProject(
      body.projectId,
      body.sectionId,
    );
    if (!sec) {
      return jsonResponse(500, { error: "section not found" });
    }
    return jsonResponse(200, { section: wireDraftSection(sec) });
  } catch (e) { logServerError("update-draft-section-status", e); return internalErrorResponse(); }
};
