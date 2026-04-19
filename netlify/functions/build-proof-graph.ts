import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { runBuildProofGraphJob } from "../../src/server/jobs/build-proof-graph.job";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId: string;
  requirementId?: string | null;
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
  if (!body?.projectId) {
    return jsonResponse(400, { error: "projectId required" }, event);
  }
  try {
    const result = await runBuildProofGraphJob({
      projectId: body.projectId,
      requirementId: body.requirementId ?? null,
    });
    return jsonResponse(200, result, event);
  } catch (e) {
    logServerError("build-proof-graph", e);
    return internalErrorResponse(event);
  }
};
