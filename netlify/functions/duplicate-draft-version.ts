import type { Handler } from "@netlify/functions";
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
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId: string;
  sectionId: string;
  sourceVersionId: string;
  note?: string | null;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.sectionId || !body.sourceVersionId) {
    return jsonResponse(400, {
      error: "projectId, sectionId, and sourceVersionId required",
    });
  }
  try {
    const v = await duplicateDraftVersion({
      projectId: body.projectId,
      sectionId: body.sectionId,
      sourceVersionId: body.sourceVersionId,
      note: body.note ?? null,
    });
    if (!v) {
      return jsonResponse(400, { error: "could not duplicate version" });
    }
    const sec = await getDraftSectionByIdForProject(
      body.projectId,
      body.sectionId,
    );
    if (!sec) {
      return jsonResponse(500, { error: "section not found" });
    }
    return jsonResponse(200, {
      version: wireDraftVersion(v),
      section: wireDraftSection(sec),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
