import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import {
  buildCorsHeadersForEvent,
  isStrictDbModeRuntime,
  jsonResponse,
  jsonResponseBare,
  optionsResponse,
  parseAllowedOriginsFromEnv,
} from "./http";

function headerApiKey(event: HandlerEvent): string | undefined {
  const h = event.headers;
  if (!h) return undefined;
  const a = h["x-api-key"] ?? h["X-Api-Key"];
  return typeof a === "string" ? a.trim() : undefined;
}

/**
 * When `INTERNAL_API_KEY` is set, requests must send a matching `x-api-key`.
 * When unset and not in strict DB mode, requests are allowed (local dev).
 * In strict mode, `INTERNAL_API_KEY` must be set (see `assertPrivateDeployConfigured`).
 */
export function assertInternalApiKey(
  event: HandlerEvent,
): HandlerResponse | null {
  const expected = process.env.INTERNAL_API_KEY?.trim();
  if (!expected) {
    return null;
  }
  const got = headerApiKey(event);
  if (got !== expected) {
    const cors = buildCorsHeadersForEvent(event);
    if (!cors) {
      return jsonResponseBare(403, { error: "Origin not allowed" });
    }
    return {
      statusCode: 401,
      headers: cors,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }
  return null;
}

/** True when functions runtime has strict DB / private-deploy posture. */
export { isStrictDbModeRuntime };

/**
 * Validates strict private-deploy configuration before handling a request.
 * Returns 503 when `STRICT_DB_MODE` is on but required secrets or CORS are missing.
 */
export function assertPrivateDeployConfigured(): HandlerResponse | null {
  if (!isStrictDbModeRuntime()) return null;
  if (!process.env.INTERNAL_API_KEY?.trim()) {
    return jsonResponseBare(503, {
      error:
        "Server misconfiguration: INTERNAL_API_KEY is required when STRICT_DB_MODE is enabled",
    });
  }
  if (parseAllowedOriginsFromEnv().length === 0) {
    return jsonResponseBare(503, {
      error:
        "Server misconfiguration: ALLOWED_ORIGIN is required when STRICT_DB_MODE is enabled",
    });
  }
  return null;
}

/**
 * OPTIONS handling, strict posture checks, and CORS gate. Call first in every handler.
 */
export function netlifyRequestPreamble(
  event: HandlerEvent,
): HandlerResponse | null {
  const cfg = assertPrivateDeployConfigured();
  if (cfg) return cfg;

  if (event.httpMethod === "OPTIONS") {
    return optionsResponse(event);
  }

  if (!buildCorsHeadersForEvent(event)) {
    return jsonResponseBare(403, { error: "Origin not allowed" });
  }

  return null;
}

export function logServerError(context: string, e: unknown): void {
  console.error(`[${context}]`, e instanceof Error ? e.stack ?? e.message : e);
}

export function internalErrorResponse(event: HandlerEvent): HandlerResponse {
  return jsonResponse(500, { error: "Internal server error" }, event);
}

/**
 * Wrap a Netlify handler with OPTIONS, deploy checks, CORS, API key check, and safe 500 responses.
 */
export function withStandardHandler(
  name: string,
  inner: (event: HandlerEvent) => Promise<HandlerResponse>,
): Handler {
  return async (event) => {
    const blocked = netlifyRequestPreamble(event);
    if (blocked) return blocked;
    const denied = assertInternalApiKey(event);
    if (denied) return denied;
    try {
      return await inner(event);
    } catch (e) {
      logServerError(name, e);
      return internalErrorResponse(event);
    }
  };
}

export { jsonResponse, optionsResponse, buildCorsHeadersForEvent };
