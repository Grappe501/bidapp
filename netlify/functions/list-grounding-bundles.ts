import type { Handler } from "@netlify/functions";
import { listGroundingBundlesByProject } from "../../src/server/repositories/grounding.repo";
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
    const rows = await listGroundingBundlesByProject(body.projectId);
    return jsonResponse(200, {
      bundles: rows.map((r) => ({
        id: r.id,
        bundleType: r.bundleType,
        title: r.title,
        createdAt: r.createdAt,
        payload: r.bundlePayloadJson,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
