import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import type { DraftMetadata } from "../../src/types";
import {
  getDraftSectionByIdForProject,
  insertDraftVersion,
  updateDraftVersionContent,
} from "../../src/server/repositories/draft.repo";
import {
  wireDraftSection,
  wireDraftVersion,
} from "../../src/server/netlify/draft-wire";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type InsertBody = {
  projectId: string;
  action: "insert";
  sectionId: string;
  content: string;
  metadata: DraftMetadata;
  groundingBundleId: string | null;
  generationMode?: string | null;
  note?: string | null;
  locked?: boolean;
  setActive?: boolean;
  bumpSectionStatus?: boolean;
};

type PatchContentBody = {
  projectId: string;
  action: "patch_content";
  versionId: string;
  content: string;
};

type Body = InsertBody | PatchContentBody;

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.projectId || !body.action) {
    return jsonResponse(400, { error: "projectId and action required" }, event);
  }
  try {
    if (body.action === "insert") {
      if (!body.sectionId || body.content === undefined || !body.metadata) {
        return jsonResponse(
          400,
          { error: "insert requires sectionId, content, metadata" },
          event,
        );
      }
      const gen =
        body.generationMode ??
        body.metadata.generationMode ??
        null;
      const v = await insertDraftVersion({
        projectId: body.projectId,
        sectionId: body.sectionId,
        content: body.content,
        metadata: body.metadata,
        groundingBundleId: body.groundingBundleId ?? null,
        generationMode: gen,
        note: body.note ?? null,
        locked: body.locked ?? false,
        setActive: body.setActive !== false,
        bumpSectionStatus: body.bumpSectionStatus !== false,
      });
      const sec = await getDraftSectionByIdForProject(
        body.projectId,
        body.sectionId,
      );
      if (!sec) {
        return internalErrorResponse(event);
      }
      return jsonResponse(
        200,
        {
          version: wireDraftVersion(v),
          section: wireDraftSection(sec),
        },
        event,
      );
    }

    if (body.action === "patch_content") {
      if (!body.versionId || body.content === undefined) {
        return jsonResponse(
          400,
          { error: "patch_content requires versionId and content" },
          event,
        );
      }
      const v = await updateDraftVersionContent({
        projectId: body.projectId,
        versionId: body.versionId,
        content: body.content,
      });
      if (!v) {
        return jsonResponse(
          400,
          { error: "could not update version (missing or locked)" },
          event,
        );
      }
      const sec = await getDraftSectionByIdForProject(
        body.projectId,
        v.sectionId,
      );
      return jsonResponse(
        200,
        {
          version: wireDraftVersion(v),
          section: sec ? wireDraftSection(sec) : null,
        },
        event,
      );
    }

    return jsonResponse(400, { error: "invalid action" }, event);
  } catch (e) {
    logServerError("save-draft-version", e);
    return internalErrorResponse(event);
  }
};
