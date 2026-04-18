import type { Handler } from "@netlify/functions";
import { runBuildGroundingBundleJob } from "../../src/server/jobs/build-grounding-bundle.job";
import {
  GROUNDING_BUNDLE_TYPES,
  type GroundingBundleType,
} from "../../src/types";
import {
  jsonResponse,
  optionsResponse,
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
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.bundleType) {
    return jsonResponse(400, { error: "projectId and bundleType required" });
  }
  if (!GROUNDING_BUNDLE_TYPES.includes(body.bundleType)) {
    return jsonResponse(400, { error: "invalid bundleType" });
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
    return jsonResponse(200, result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
