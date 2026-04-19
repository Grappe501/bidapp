import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { jsonResponse } from "./http";

/**
 * Returns a trimmed project id from the body, or a 400 JSON response.
 */
export function requireProjectId(
  body: { projectId?: string } | null | undefined,
  event: HandlerEvent,
): string | HandlerResponse {
  const id = body?.projectId?.trim();
  if (!id) {
    return jsonResponse(400, { error: "projectId is required" }, event);
  }
  return id;
}
