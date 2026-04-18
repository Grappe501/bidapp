import type { Handler } from "@netlify/functions";
import { assertInternalApiKey, internalErrorResponse, logServerError } from "../../src/server/netlify/guards";
import { runParseFileJob } from "../../src/server/jobs/parse-file.job";
import { getFileForProject } from "../../src/server/repositories/file.repo";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  fileId: string;
  projectId: string;
  text?: string;
  chunkSize?: number;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.fileId || !body?.projectId?.trim()) {
    return jsonResponse(400, { error: "fileId and projectId required" });
  }
  const file = await getFileForProject(body.fileId, body.projectId.trim());
  if (!file) {
    return jsonResponse(404, { error: "File not found for project" });
  }
  try {
    const result = await runParseFileJob({
      fileId: body.fileId,
      text: body.text,
      chunkSize: body.chunkSize,
    });
    return jsonResponse(200, result);
  } catch (e) {
    logServerError("parse-file", e);
    return internalErrorResponse();
  }
};
