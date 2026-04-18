import type { Handler } from "@netlify/functions";
import { runParseDocumentWithAiJob } from "../../src/server/jobs/parse-document-with-ai.job";
import type { AiParseMode } from "../../src/server/services/ai-parsing.service";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

const ALLOWED: AiParseMode[] = [
  "extract_requirements",
  "extract_evidence",
  "extract_submission_items",
];

type Body = { projectId: string; fileId: string; mode: AiParseMode };

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.fileId || !body.mode) {
    return jsonResponse(400, { error: "projectId, fileId, and mode required" });
  }
  if (!ALLOWED.includes(body.mode)) {
    return jsonResponse(400, {
      error: `mode must be one of: ${ALLOWED.join(", ")}`,
    });
  }
  try {
    const result = await runParseDocumentWithAiJob({
      projectId: body.projectId,
      fileId: body.fileId,
      mode: body.mode,
    });
    return jsonResponse(200, result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
