import type { Handler } from "@netlify/functions";
import { assertInternalApiKey, internalErrorResponse, logServerError } from "../../src/server/netlify/guards";
import { runReviewDraftProseJob } from "../../src/server/jobs/review-draft-prose.job";
import type { DraftSectionType, GroundingBundlePayload } from "../../src/types";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

const SECTION_TYPES: DraftSectionType[] = [
  "Experience",
  "Solution",
  "Risk",
  "Executive Summary",
  "Architecture Narrative",
];

type Body = {
  sectionType: DraftSectionType;
  draftText: string;
  grounding: GroundingBundlePayload;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (!body?.sectionType || body.draftText == null || !body.grounding) {
    return jsonResponse(400, {
      error: "sectionType, draftText, and grounding required",
    });
  }
  if (!SECTION_TYPES.includes(body.sectionType)) {
    return jsonResponse(400, { error: "invalid sectionType" });
  }
  try {
    const review = await runReviewDraftProseJob({
      sectionType: body.sectionType,
      draftText: String(body.draftText),
      grounding: body.grounding,
    });
    return jsonResponse(200, { review });
  } catch (e) { logServerError("review-draft-prose", e); return internalErrorResponse(); }
};
