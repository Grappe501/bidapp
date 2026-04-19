import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  ensureDraftSectionsForProject,
  getDraftSectionByIdForProject,
  listDraftVersionsForSection,
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

type Body = { projectId: string; sectionId: string };

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.sectionId) {
    return jsonResponse(400, { error: "projectId and sectionId required" }, event);
  }
  try {
    await ensureDraftSectionsForProject(body.projectId);
    const dbSection = await getDraftSectionByIdForProject(
      body.projectId,
      body.sectionId,
    );
    if (!dbSection) {
      return jsonResponse(404, { error: "Not found" }, event);
    }
    const dbVersions = await listDraftVersionsForSection(
      body.projectId,
      body.sectionId,
    );
    const bundleIds = new Set<string>();
    if (dbSection.selectedGroundingBundleId) {
      bundleIds.add(dbSection.selectedGroundingBundleId);
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
        section: wireDraftSection(dbSection),
        versions: dbVersions.map(wireDraftVersion),
        bundles: bundles.map(wireGroundingBundle),
      },
      event,
    );
  } catch (e) {
    logServerError("get-draft-section", e);
    return internalErrorResponse(event);
  }
};
