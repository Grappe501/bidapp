import type { Handler } from "@netlify/functions";
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
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId: string;
  versionId: string;
  note?: string | null;
  locked?: boolean;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.versionId) {
    return jsonResponse(400, { error: "projectId and versionId required" });
  }
  if (body.note === undefined && body.locked === undefined) {
    return jsonResponse(400, { error: "note and/or locked required" });
  }
  try {
    const v = await updateDraftVersionNoteLocked({
      projectId: body.projectId,
      versionId: body.versionId,
      note: body.note,
      locked: body.locked,
    });
    if (!v) {
      return jsonResponse(400, { error: "could not update version" });
    }
    const sec = await getDraftSectionByIdForProject(
      body.projectId,
      v.sectionId,
    );
    return jsonResponse(200, {
      version: wireDraftVersion(v),
      section: sec ? wireDraftSection(sec) : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
