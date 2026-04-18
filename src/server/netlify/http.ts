/**
 * Shared Netlify helpers. Prefer relative imports from functions and server code;
 * `@/…` aliases are not resolved reliably in this runtime.
 *
 * Set ALLOWED_ORIGIN in production (e.g. https://your-app.netlify.app). Defaults to * if unset.
 */
import type { HandlerResponse } from "@netlify/functions";

export function getCorsHeaders(): Record<string, string> {
  const origin = process.env.ALLOWED_ORIGIN?.trim() || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-api-key, X-Api-Key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

export function jsonResponse(
  statusCode: number,
  body: unknown,
): HandlerResponse {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify(body),
  };
}

export function optionsResponse(): HandlerResponse {
  return { statusCode: 204, headers: getCorsHeaders(), body: "" };
}

export function readJson<T>(raw: string | null): T | null {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
