import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { countGroundingBundlesByProject } from "../../src/server/repositories/grounding.repo";
import { countEnrichmentRunsByProject } from "../../src/server/repositories/intelligence.repo";
import {
  countEmbeddingsByProject,
  countParsedEntitiesByProject,
} from "../../src/server/repositories/retrieval.repo";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { projectId: string };

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
    const [
      embeddingCount,
      parsedEntityCount,
      groundingBundleCount,
      enrichmentRunCount,
    ] = await Promise.all([
      countEmbeddingsByProject(body.projectId),
      countParsedEntitiesByProject(body.projectId),
      countGroundingBundlesByProject(body.projectId),
      countEnrichmentRunsByProject(body.projectId),
    ]);
    return jsonResponse(
      200,
      {
        projectId: body.projectId,
        embeddingCount,
        parsedEntityCount,
        groundingBundleCount,
        enrichmentRunCount,
      },
      event,
    );
  } catch (e) {
    logServerError("intelligence-job-status", e);
    return internalErrorResponse(event);
  }
};
