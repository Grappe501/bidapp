import type { Handler } from "@netlify/functions";
import { countGroundingBundlesByProject } from "../../src/server/repositories/grounding.repo";
import { countEnrichmentRunsByProject } from "../../src/server/repositories/intelligence.repo";
import {
  countEmbeddingsByProject,
  countParsedEntitiesByProject,
} from "../../src/server/repositories/retrieval.repo";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { projectId: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId) {
    return jsonResponse(400, { error: "projectId required" });
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
    return jsonResponse(200, {
      projectId: body.projectId,
      embeddingCount,
      parsedEntityCount,
      groundingBundleCount,
      enrichmentRunCount,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
