import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { runEmbedChunksForFileJob } from "../../src/server/jobs/embed-chunks.job";
import { getFileForProject } from "../../src/server/repositories/file.repo";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { fileId: string; projectId: string };

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.fileId || !body?.projectId?.trim()) {
    return jsonResponse(400, { error: "fileId and projectId required" }, event);
  }
  try {
    const file = await getFileForProject(body.fileId, body.projectId.trim());
    if (!file) {
      return jsonResponse(404, { error: "File not found for project" }, event);
    }
    const result = await runEmbedChunksForFileJob(body.fileId);
    return jsonResponse(200, result, event);
  } catch (e) {
    logServerError("embed-file", e);
    return internalErrorResponse(event);
  }
};
