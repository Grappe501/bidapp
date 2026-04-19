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
import {
  buildVendorIntelligenceProjectExport,
  loadVendorIntelligenceForBundle,
} from "../../src/server/services/vendor-grounding.service";
import { computeVendorFit } from "../../src/server/services/vendor-fit.service";
import { generateVendorInterviewQuestions } from "../../src/server/services/vendor-interview.service";
import { runVendorResearchJob } from "../../src/server/services/vendor-research.service";
import { computeVendorScore } from "../../src/server/services/vendor-scoring.service";

type Body = {
  action?:
    | "runResearch"
    | "computeFit"
    | "computeScore"
    | "generateInterview"
    | "getSnapshot"
    | "exportProject";
  projectId?: string;
  vendorId?: string;
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
  const action = body.action ?? "getSnapshot";
  const vendorId = body.vendorId?.trim() ?? "";

  try {
    if (action === "exportProject") {
      const data = await buildVendorIntelligenceProjectExport(projectId);
      return jsonResponse(200, data, event);
    }

    if (!vendorId) {
      return jsonResponse(400, { error: "vendorId required" }, event);
    }

    if (action === "runResearch") {
      const result = await runVendorResearchJob({ projectId, vendorId });
      return jsonResponse(200, result, event);
    }
    if (action === "computeFit") {
      const result = await computeVendorFit({ projectId, vendorId });
      return jsonResponse(200, result, event);
    }
    if (action === "computeScore") {
      const result = await computeVendorScore(vendorId);
      return jsonResponse(200, result, event);
    }
    if (action === "generateInterview") {
      const result = await generateVendorInterviewQuestions(vendorId);
      return jsonResponse(200, result, event);
    }
    const snapshot = await loadVendorIntelligenceForBundle({
      projectId,
      vendorId,
    });
    return jsonResponse(200, { snapshot }, event);
  } catch (e) {
    logServerError("vendor-intelligence", e);
    return internalErrorResponse(event);
  }
};
