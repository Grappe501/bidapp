import type { Handler } from "@netlify/functions";
import {
  generateDraftFromBundleId,
  generateGroundedDraft,
  type DraftingGenerationInput,
} from "../../src/server/services/drafting.service";
import type { DraftSectionType } from "../../src/types";
import {
  jsonResponse,
  optionsResponse,
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

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.mode) {
    return jsonResponse(400, { error: "mode required" });
  }

  try {
    if (body.mode === "structured") {
      if (!body.input?.grounding || !body.input?.sectionType) {
        return jsonResponse(400, {
          error: "structured mode requires input.grounding and input.sectionType",
        });
      }
      if (!SECTION_TYPES.includes(body.input.sectionType)) {
        return jsonResponse(400, { error: "invalid sectionType" });
      }
      const result = await generateGroundedDraft(body.input);
      return jsonResponse(200, result);
    }

    if (body.mode === "bundle") {
      if (!body.projectId || !body.bundleId || !body.sectionType) {
        return jsonResponse(400, {
          error: "bundle mode requires projectId, bundleId, sectionType",
        });
      }
      if (!SECTION_TYPES.includes(body.sectionType)) {
        return jsonResponse(400, { error: "invalid sectionType" });
      }
      const result = await generateDraftFromBundleId({
        projectId: body.projectId,
        bundleId: body.bundleId,
        sectionType: body.sectionType,
        tone: body.tone,
      });
      return jsonResponse(200, result);
    }

    return jsonResponse(400, { error: "invalid mode" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};
