import type { Handler } from "@netlify/functions";
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
import { runCompetitorAwareSimulation } from "../../src/server/services/competitor-aware-simulation.service";

type Body = {
  projectId?: string;
  comparedVendorIds?: string[];
  architectureOptionId?: string | null;
};

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body) ?? {};
  const projectId = requireProjectId(body, event);
  if (typeof projectId !== "string") return projectId;
  const ids = Array.isArray(body.comparedVendorIds)
    ? body.comparedVendorIds
    : [];
  if (ids.length === 0) {
    return jsonResponse(400, { error: "comparedVendorIds required" }, event);
  }
  try {
    const result = await runCompetitorAwareSimulation({
      projectId,
      comparedVendorIds: ids,
      architectureOptionId: body.architectureOptionId ?? null,
    });
    return jsonResponse(200, result, event);
  } catch (e) {
    logServerError("competitor-simulation", e);
    return internalErrorResponse(event);
  }
};
