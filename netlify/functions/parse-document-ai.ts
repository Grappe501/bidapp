import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { runParseDocumentWithAiJob } from "../../src/server/jobs/parse-document-with-ai.job";
import type { AiParseMode } from "../../src/server/services/ai-parsing.service";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

const ALLOWED: AiParseMode[] = [
  "extract_requirements",
  "extract_evidence",
  "extract_submission_items",
];

type Body = { projectId: string; fileId: string; mode: AiParseMode };

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.fileId || !body.mode) {
    return jsonResponse(400, { error: "projectId, fileId, and mode required" }, event);
  }
  if (!ALLOWED.includes(body.mode)) {
    return jsonResponse(
      400,
      { error: `mode must be one of: ${ALLOWED.join(", ")}` },
      event,
    );
  }
  try {
    const result = await runParseDocumentWithAiJob({
      projectId: body.projectId,
      fileId: body.fileId,
      mode: body.mode,
    });
    return jsonResponse(200, result, event);
  } catch (e) {
    logServerError("parse-document-ai", e);
    return internalErrorResponse(event);
  }
};
