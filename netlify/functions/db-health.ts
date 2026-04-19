import type { Handler } from "@netlify/functions";
import { query } from "../../src/server/db/client";
import {
  assertInternalApiKey,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { jsonResponse } from "../../src/server/netlify/http";

/**
 * Lightweight DB connectivity check (`GET`).
 * For **Netlify production**, set **`INTERNAL_API_KEY`** so this route is not
 * anonymously callable. Responses never include connection strings or SQL details.
 * See `scripts/netlify-deploy-checklist.md` and `ENVIRONMENT_SETUP.md`.
 */
export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  try {
    await query("SELECT 1 AS ok");
    return jsonResponse(200, { ok: true, database: "reachable" }, event);
  } catch (e) {
    logServerError("db-health", e);
    return jsonResponse(
      503,
      { ok: false, error: "Service unavailable" },
      event,
    );
  }
};
