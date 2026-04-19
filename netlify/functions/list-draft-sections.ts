import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  listDraftSectionsByProject,
  listDraftVersionsForProject,
} from "../../src/server/repositories/draft.repo";
import { listGroundingBundlesByIds } from "../../src/server/repositories/grounding.repo";
import {
  wireDraftSection,
  wireDraftVersion,
  wireGroundingBundle,
} from "../../src/server/netlify/draft-wire";
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
    const dbSections = await listDraftSectionsByProject(body.projectId);
    const dbVersions = await listDraftVersionsForProject(body.projectId);
    const bundleIds = new Set<string>();
    for (const s of dbSections) {
      if (s.selectedGroundingBundleId) {
        bundleIds.add(s.selectedGroundingBundleId);
      }
    }
    for (const v of dbVersions) {
      if (v.groundingBundleId) bundleIds.add(v.groundingBundleId);
    }
    const bundles = await listGroundingBundlesByIds(body.projectId, [
      ...bundleIds,
    ]);
    return jsonResponse(
      200,
      {
        sections: dbSections.map(wireDraftSection),
        versions: dbVersions.map(wireDraftVersion),
        bundles: bundles.map(wireGroundingBundle),
      },
      event,
    );
  } catch (e) {
    logServerError("list-draft-sections", e);
    return internalErrorResponse(event);
  }
};
