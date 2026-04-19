import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { jsonResponse, readJson } from "../../src/server/netlify/http";
import { requireProjectId } from "../../src/server/netlify/require-project-id";
import { askAgentMalone } from "../../src/server/services/bid-intelligence-agent.service";
import type { AgentMaloneActionRequest } from "../../src/types";

type Body = {
  projectId?: string;
  question?: string;
  actionRequest?: AgentMaloneActionRequest;
  currentPage?: string;
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
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
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const actionRequest = body.actionRequest as AgentMaloneActionRequest | undefined;
  if (!question && !actionRequest) {
    return jsonResponse(400, { error: "question or actionRequest required" }, event);
  }
  try {
    const result = await askAgentMalone({
      projectId,
      question: question || undefined,
      actionRequest,
      currentPage: body.currentPage,
      selectedVendorId: body.selectedVendorId ?? null,
      architectureOptionId: body.architectureOptionId ?? null,
    });
    return jsonResponse(200, result, event);
  } catch (e) {
    logServerError("ask-bid-agent", e);
    return internalErrorResponse(event);
  }
};
