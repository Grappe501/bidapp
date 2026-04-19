import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { jsonResponse, readJson } from "../../src/server/netlify/http";
import { requireProjectId } from "../../src/server/netlify/require-project-id";
import { parseBriefingModeParam } from "../../src/server/lib/agent-malone-briefing-intent";
import { getAgentMaloneBriefing } from "../../src/server/services/agent-malone-briefing.service";
import type { AgentMaloneBriefingMode } from "../../src/types";

type Body = {
  projectId?: string;
  threadId?: string | null;
  mode?: string | null;
  currentPage?: string;
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
  sectionId?: string | null;
  updateThreadSummary?: boolean;
};

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body) ?? {};
  const projectId = requireProjectId(body, event);
  if (typeof projectId !== "string") return projectId;

  const mode: AgentMaloneBriefingMode =
    parseBriefingModeParam(body.mode) ?? "default";

  try {
    const briefing = await getAgentMaloneBriefing({
      projectId,
      threadId: body.threadId ?? null,
      mode,
      currentPage: body.currentPage,
      selectedVendorId: body.selectedVendorId ?? null,
      architectureOptionId: body.architectureOptionId ?? null,
      sectionId: body.sectionId ?? null,
      updateThreadSummary: body.updateThreadSummary !== false,
    });
    return jsonResponse(200, { briefing }, event);
  } catch (e) {
    logServerError("agent-malone-briefing", e);
    return internalErrorResponse(event);
  }
};
