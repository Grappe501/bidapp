import type { Handler } from "@netlify/functions";
import { query } from "../../src/server/db/client";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { getProject } from "../../src/server/repositories/project.repo";
import {
  isStrictDbModeRuntime,
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = { projectId?: string };

/**
 * Operator-only readiness probe: DB reachability, optional project row check,
 * whether OpenAI is configured (boolean only — never exposes keys).
 * Requires the same **`x-api-key`** as other functions when `INTERNAL_API_KEY` is set.
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
  const projectId = body?.projectId?.trim();

  let database: "reachable" | "unreachable" = "unreachable";
  try {
    await query("SELECT 1 AS ok");
    database = "reachable";
  } catch (e) {
    logServerError("prod-readiness-db", e);
  }

  let projectCheck: "skipped" | "found" | "not_found" = "skipped";
  if (projectId) {
    if (database !== "reachable") {
      projectCheck = "skipped";
    } else {
      try {
        const row = await getProject(projectId);
        projectCheck = row ? "found" : "not_found";
      } catch (e) {
        logServerError("prod-readiness-project", e);
        return internalErrorResponse(event);
      }
    }
  }

  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  return jsonResponse(
    200,
    {
      database,
      projectCheck,
      openaiConfigured,
      strictDbMode: isStrictDbModeRuntime(),
    },
    event,
  );
};
