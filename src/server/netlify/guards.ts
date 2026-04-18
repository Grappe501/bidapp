import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { getCorsHeaders, jsonResponse, optionsResponse } from "./http";

function headerApiKey(event: HandlerEvent): string | undefined {
  const h = event.headers;
  if (!h) return undefined;
  const a = h["x-api-key"] ?? h["X-Api-Key"];
  return typeof a === "string" ? a.trim() : undefined;
}

/**
 * When INTERNAL_API_KEY is set, all function calls must send matching x-api-key.
 * When unset, requests are allowed (local dev without a shared secret).
 */
export function assertInternalApiKey(event: HandlerEvent): HandlerResponse | null {
  const expected = process.env.INTERNAL_API_KEY?.trim();
  if (!expected) return null;
  const got = headerApiKey(event);
  if (got !== expected) {
    return jsonResponse(401, { error: "Unauthorized" });
  }
  return null;
}

export function logServerError(context: string, e: unknown): void {
  console.error(`[${context}]`, e instanceof Error ? e.stack ?? e.message : e);
}

export function internalErrorResponse(): HandlerResponse {
  return jsonResponse(500, { error: "Internal server error" });
}

/**
 * Wrap a Netlify handler with OPTIONS, API key check, and safe500 responses.
 */
export function withStandardHandler(
  name: string,
  inner: (event: HandlerEvent) => Promise<HandlerResponse>,
): Handler {
  return async (event) => {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: getCorsHeaders(), body: "" };
    }
    const denied = assertInternalApiKey(event);
    if (denied) return denied;
    try {
      return await inner(event);
    } catch (e) {
      logServerError(name, e);
      return internalErrorResponse();
    }
  };
}

export { optionsResponse, jsonResponse, getCorsHeaders };
