import type { Handler } from "@netlify/functions";
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
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { projectId: string; sectionId: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.sectionId) {
    return jsonResponse(400, { error: "projectId and sectionId required" });
  }
  try {
    await ensureDraftSectionsForProject(body.projectId);
    const dbSection = await getDraftSectionByIdForProject(
      body.projectId,
      body.sectionId,
    );
    if (!dbSection) {
      return jsonResponse(404, { error: "section not found" });
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
    return jsonResponse(200, {
      section: wireDraftSection(dbSection),
      versions: dbVersions.map(wireDraftVersion),
      bundles: bundles.map(wireGroundingBundle),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
