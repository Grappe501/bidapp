import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { runReviewDraftProseJob } from "../../src/server/jobs/review-draft-prose.job";
import type { DraftSectionType, GroundingBundlePayload } from "../../src/types";
import {
  jsonResponse,
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

/**
 * Stateless prose review (OpenAI). **No `projectId`** — not a DB write path.
 * Still requires API key + CORS when `INTERNAL_API_KEY` / strict mode are set.
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
  if (!body?.sectionType || body.draftText == null || !body.grounding) {
    return jsonResponse(
      400,
      { error: "sectionType, draftText, and grounding required" },
      event,
    );
  }
  if (!SECTION_TYPES.includes(body.sectionType)) {
    return jsonResponse(400, { error: "invalid sectionType" }, event);
  }
  try {
    const review = await runReviewDraftProseJob({
      sectionType: body.sectionType,
      draftText: String(body.draftText),
      grounding: body.grounding,
    });
    return jsonResponse(200, { review }, event);
  } catch (e) {
    logServerError("review-draft-prose", e);
    return internalErrorResponse(event);
  }
};
