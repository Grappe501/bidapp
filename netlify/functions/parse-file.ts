import type { Handler } from "@netlify/functions";
import { runParseFileJob } from "../../src/server/jobs/parse-file.job";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  fileId: string;
  text?: string;
  chunkSize?: number;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.fileId) {
    return jsonResponse(400, { error: "fileId required" });
  }
  try {
    const result = await runParseFileJob({
      fileId: body.fileId,
      text: body.text,
      chunkSize: body.chunkSize,
    });
    return jsonResponse(200, result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
