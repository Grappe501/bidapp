/**
 * Shared Netlify HTTP helpers. Prefer relative imports from functions; `@/…`
 * aliases are not resolved reliably in this runtime.
 *
 * CORS:
 * - Set `ALLOWED_ORIGIN` to a comma-separated list of exact browser origins
 *   (e.g. `https://your-app.netlify.app` or `http://localhost:8888`).
 * - When `STRICT_DB_MODE=true`, `ALLOWED_ORIGIN` must be set (no wildcard) and
 *   `INTERNAL_API_KEY` is required — see `netlifyRequestPreamble` in guards.
 * - When strict mode is off and `ALLOWED_ORIGIN` is unset, local dev is allowed
 *   (`localhost` / `127.0.0.1`) or `*` for requests without an `Origin` header.
 */
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";

const CORS_HEADERS_BASE =
  "Content-Type, Authorization, x-api-key, X-Api-Key" as const;

export function isStrictDbModeRuntime(): boolean {
  return process.env.STRICT_DB_MODE === "true";
}

function getOriginHeader(event: HandlerEvent): string | undefined {
  const h = event.headers;
  if (!h) return undefined;
  const o = h.origin ?? h.Origin;
  return typeof o === "string" ? o.trim() : undefined;
}

/** Comma-separated `ALLOWED_ORIGIN` values; empty if unset. */
export function parseAllowedOriginsFromEnv(): string[] {
  const raw = process.env.ALLOWED_ORIGIN?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function baseCorsFields(allowOrigin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": CORS_HEADERS_BASE,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

/**
 * Returns CORS headers for this request, or `null` if the origin must not be allowed.
 */
export function buildCorsHeadersForEvent(
  event: HandlerEvent,
): Record<string, string> | null {
  const origin = getOriginHeader(event);
  const strict = isStrictDbModeRuntime();
  const allowedList = parseAllowedOriginsFromEnv();

  if (strict) {
    if (allowedList.length === 0) return null;
    if (!origin || !allowedList.includes(origin)) return null;
    return baseCorsFields(origin);
  }

  if (allowedList.length > 0) {
    if (origin && allowedList.includes(origin)) {
      return baseCorsFields(origin);
    }
    if (origin && !allowedList.includes(origin)) {
      return null;
    }
    if (!origin) {
      return baseCorsFields(allowedList[0]!);
    }
    return null;
  }

  if (!origin) {
    return baseCorsFields("*");
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)) {
    return baseCorsFields(origin);
  }
  return baseCorsFields("*");
}

/** Responses without CORS (misconfiguration or forbidden origin on error paths). */
export function jsonResponseBare(
  statusCode: number,
  body: unknown,
): HandlerResponse {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function jsonResponse(
  statusCode: number,
  body: unknown,
  event: HandlerEvent,
): HandlerResponse {
  const cors = buildCorsHeadersForEvent(event);
  if (!cors) {
    return jsonResponseBare(403, { error: "Origin not allowed" });
  }
  return {
    statusCode,
    headers: cors,
    body: JSON.stringify(body),
  };
}

export function optionsResponse(event: HandlerEvent): HandlerResponse {
  const cors = buildCorsHeadersForEvent(event);
  if (!cors) {
    return jsonResponseBare(403, { error: "Origin not allowed" });
  }
  return { statusCode: 204, headers: cors, body: "" };
}

export function readJson<T>(raw: string | null): T | null {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
