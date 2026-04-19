import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  generateDraftFromBundleId,
  generateGroundedDraft,
  type DraftingGenerationInput,
} from "../../src/server/services/drafting.service";
import type { DraftSectionType } from "../../src/types";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type StructuredBody = {
  mode: "structured";
  input: DraftingGenerationInput;
};

type BundleBody = {
  mode: "bundle";
  projectId: string;
  bundleId: string;
  sectionType: DraftSectionType;
  tone?: string;
};

type Body = StructuredBody | BundleBody;

const SECTION_TYPES: DraftSectionType[] = [
  "Experience",
  "Solution",
  "Risk",
  "Executive Summary",
  "Architecture Narrative",
];

/**
 * Draft generation: `structured` mode is **stateless** (OpenAI only; no DB row
 * writes). `bundle` mode is project-scoped and resolves grounding from the DB.
 */
export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (!body?.mode) {
    return jsonResponse(400, { error: "mode required" }, event);
  }

  try {
    if (body.mode === "structured") {
      if (!body.input?.grounding || !body.input?.sectionType) {
        return jsonResponse(
          400,
          { error: "structured mode requires input.grounding and input.sectionType" },
          event,
        );
      }
      if (!SECTION_TYPES.includes(body.input.sectionType)) {
        return jsonResponse(400, { error: "invalid sectionType" }, event);
      }
      const result = await generateGroundedDraft(body.input);
      return jsonResponse(200, result, event);
    }

    if (body.mode === "bundle") {
      if (!body.projectId || !body.bundleId || !body.sectionType) {
        return jsonResponse(
          400,
          { error: "bundle mode requires projectId, bundleId, sectionType" },
          event,
        );
      }
      if (!SECTION_TYPES.includes(body.sectionType)) {
        return jsonResponse(400, { error: "invalid sectionType" }, event);
      }
      const result = await generateDraftFromBundleId({
        projectId: body.projectId,
        bundleId: body.bundleId,
        sectionType: body.sectionType,
        tone: body.tone,
      });
      return jsonResponse(200, result, event);
    }

    return jsonResponse(400, { error: "invalid mode" }, event);
  } catch (e) {
    logServerError("generate-draft", e);
    return internalErrorResponse(event);
  }
};
