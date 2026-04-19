import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { listGroundingBundlesByProject } from "../../src/server/repositories/grounding.repo";
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
    const rows = await listGroundingBundlesByProject(body.projectId);
    return jsonResponse(
      200,
      {
        bundles: rows.map((r) => ({
          id: r.id,
          bundleType: r.bundleType,
          title: r.title,
          createdAt: r.createdAt,
          payload: r.bundlePayloadJson,
        })),
      },
      event,
    );
  } catch (e) {
    logServerError("list-grounding-bundles", e);
    return internalErrorResponse(event);
  }
};
