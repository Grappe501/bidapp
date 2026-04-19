import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";
import { requireProjectId } from "../../src/server/netlify/require-project-id";
import { loadProjectWorkspacePayload } from "../../src/server/services/project-workspace.service";

type Body = { projectId?: string };

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  const projectId = requireProjectId(body, event);
  if (typeof projectId !== "string") return projectId;
  try {
    const payload = await loadProjectWorkspacePayload(projectId);
    if (!payload) {
      return jsonResponse(404, { error: "Project not found" }, event);
    }
    return jsonResponse(200, payload, event);
  } catch (e) {
    logServerError("load-project-workspace", e);
    return internalErrorResponse(event);
  }
};
