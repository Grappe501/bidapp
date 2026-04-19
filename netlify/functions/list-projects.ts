import type { Handler } from "@netlify/functions";
import { getProject } from "../../src/server/repositories/project.repo";
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

type Body = { projectId?: string };

/**
 * **Internal helper:** returns zero or one project row for a given `projectId`.
 * Does not list all projects — scoped fetch for workspace bootstrap and diagnostics.
 */
export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  const pid = requireProjectId(body, event);
  if (typeof pid !== "string") return pid;
  try {
    const p = await getProject(pid);
    return jsonResponse(200, { projects: p ? [p] : [] }, event);
  } catch (e) {
    logServerError("list-projects", e);
    return internalErrorResponse(event);
  }
};
