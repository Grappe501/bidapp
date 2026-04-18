import type { HandlerResponse } from "@netlify/functions";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

export function jsonResponse(
  statusCode: number,
  body: unknown,
): HandlerResponse {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

export function optionsResponse(): HandlerResponse {
  return { statusCode: 204, headers: corsHeaders, body: "" };
}

export function readJson<T>(raw: string | null): T | null {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
