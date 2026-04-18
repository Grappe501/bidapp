import type { Handler } from "@netlify/functions";
import { query } from "../../src/server/db/client";
import {
  corsHeaders,
  jsonResponse,
  optionsResponse,
} from "../../src/server/netlify/http";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  try {
    await query("SELECT 1 AS ok");
    return jsonResponse(200, { ok: true, database: "reachable" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: message }),
    };
  }
};
