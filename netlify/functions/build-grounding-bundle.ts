import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { runBuildGroundingBundleJob } from "../../src/server/jobs/build-grounding-bundle.job";
import {
  GROUNDING_BUNDLE_TYPES,
  type GroundingBundleType,
} from "../../src/types";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  projectId: string;
  bundleType: GroundingBundleType;
  targetEntityId?: string | null;
  title?: string;
  topK?: number;
  fileId?: string;
  strictGrounding?: boolean;
};

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.bundleType) {
    return jsonResponse(400, { error: "projectId and bundleType required" }, event);
  }
  if (!GROUNDING_BUNDLE_TYPES.includes(body.bundleType)) {
    return jsonResponse(400, { error: "invalid bundleType" }, event);
  }
  try {
    const result = await runBuildGroundingBundleJob({
      projectId: body.projectId,
      bundleType: body.bundleType,
      targetEntityId: body.targetEntityId ?? null,
      title: body.title,
      topK: body.topK,
      fileId: body.fileId,
      strictGrounding: Boolean(body.strictGrounding),
    });
    return jsonResponse(200, result, event);
  } catch (e) {
    logServerError("build-grounding-bundle", e);
    return internalErrorResponse(event);
  }
};
