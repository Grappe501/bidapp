import type { Handler } from "@netlify/functions";
import {
  getDraftSectionByIdForProject,
  setActiveDraftVersion,
} from "../../src/server/repositories/draft.repo";
import { wireDraftSection } from "../../src/server/netlify/draft-wire";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { projectId: string; sectionId: string; versionId: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.sectionId || !body.versionId) {
    return jsonResponse(400, {
      error: "projectId, sectionId, and versionId required",
    });
  }
  try {
    const ok = await setActiveDraftVersion({
      projectId: body.projectId,
      sectionId: body.sectionId,
      versionId: body.versionId,
    });
    if (!ok) {
      return jsonResponse(400, { error: "could not set active version" });
    }
    const sec = await getDraftSectionByIdForProject(
      body.projectId,
      body.sectionId,
    );
    if (!sec) {
      return jsonResponse(500, { error: "section not found" });
    }
    return jsonResponse(200, { section: wireDraftSection(sec) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
