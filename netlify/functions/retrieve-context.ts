import type { Handler } from "@netlify/functions";
import { assertInternalApiKey, internalErrorResponse, logServerError } from "../../src/server/netlify/guards";
import { retrieveChunks } from "../../src/server/services/retrieval.service";
import { RETRIEVAL_QUERY_TYPES, type RetrievalQueryType } from "../../src/types";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId: string;
  query: string;
  retrievalMode: RetrievalQueryType;
  topK?: number;
  fileId?: string;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.query?.trim() || !body.retrievalMode) {
    return jsonResponse(400, {
      error: "projectId, query, and retrievalMode required",
    });
  }
  if (!RETRIEVAL_QUERY_TYPES.includes(body.retrievalMode)) {
    return jsonResponse(400, { error: "invalid retrievalMode" });
  }
  try {
    const { queryId, chunks } = await retrieveChunks({
      projectId: body.projectId,
      queryText: body.query.trim(),
      queryType: body.retrievalMode,
      topK: body.topK,
      fileId: body.fileId,
    });
    return jsonResponse(200, {
      queryId,
      chunks: chunks.map((c) => ({
        chunkId: c.chunkId,
        fileId: c.fileId,
        fileName: c.fileName,
        chunkIndex: c.chunkIndex,
        text: c.text,
        score: c.score,
        embeddingModel: c.embeddingModel,
      })),
    });
  } catch (e) { logServerError("retrieve-context", e); return internalErrorResponse(); }
};
