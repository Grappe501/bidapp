import type { Handler } from "@netlify/functions";
import { query } from "../../src/server/db/client";
import {
  assertInternalApiKey,
  logServerError,
} from "../../src/server/netlify/guards";
import {
  getCorsHeaders,
  jsonResponse,
  optionsResponse,
} from "../../src/server/netlify/http";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (process.env.STRICT_DB_MODE === "true") {
    return jsonResponse(404, { error: "Not found" });
  }
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  try {
    await query("SELECT 1 AS ok");
    return jsonResponse(200, { ok: true, database: "reachable" });
  } catch (e) {
    logServerError("db-health", e);
    return {
      statusCode: 503,
      headers: getCorsHeaders(),
      body: JSON.stringify({ ok: false, error: "Service unavailable" }),
    };
  }
};
