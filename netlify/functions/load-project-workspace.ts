import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
} from "../../src/server/netlify/guards";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";
import { loadProjectWorkspacePayload } from "../../src/server/services/project-workspace.service";

type Body = { projectId?: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  const projectId = body?.projectId?.trim();
  if (!projectId) {
    return jsonResponse(400, { error: "projectId is required" });
  }
  try {
    const payload = await loadProjectWorkspacePayload(projectId);
    if (!payload) {
      return jsonResponse(404, { error: "Project not found" });
    }
    return jsonResponse(200, payload);
  } catch (e) {
    logServerError("load-project-workspace", e);
    return internalErrorResponse();
  }
};
