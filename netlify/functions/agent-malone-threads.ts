import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { jsonResponse, readJson } from "../../src/server/netlify/http";
import { requireProjectId } from "../../src/server/netlify/require-project-id";
import { dbAgentMaloneMemoryToApi } from "../../src/server/lib/agent-malone-memory-map";
import {
  deleteAllAgentMaloneMemoryForThread,
  listAgentMaloneMemoryByThread,
} from "../../src/server/repositories/agent-malone-memory.repo";
import {
  getAgentMaloneThreadById,
  insertAgentMaloneThread,
  listActiveAgentMaloneThreads,
  updateAgentMaloneThread,
} from "../../src/server/repositories/agent-malone-thread.repo";

type Body = {
  projectId?: string;
  action?:
    | "list"
    | "create"
    | "get"
    | "update"
    | "archive"
    | "clear_memory";
  threadId?: string;
  title?: string;
  currentVendorId?: string | null;
  currentArchitectureOptionId?: string | null;
  currentSectionId?: string | null;
  currentFocus?: string | null;
};

function mapThread(t: Awaited<ReturnType<typeof getAgentMaloneThreadById>>) {
  if (!t) return null;
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    status: t.status,
    currentVendorId: t.currentVendorId ?? undefined,
    currentArchitectureOptionId: t.currentArchitectureOptionId ?? undefined,
    currentSectionId: t.currentSectionId ?? undefined,
    currentFocus: t.currentFocus ?? undefined,
    summaryLine: t.summaryLine ?? undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

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
  const action = body.action ?? "list";

  try {
    if (action === "list") {
      const rows = await listActiveAgentMaloneThreads(projectId);
      return jsonResponse(200, { threads: rows.map((t) => mapThread(t)) }, event);
    }

    if (action === "create") {
      const t = await insertAgentMaloneThread({
        projectId,
        title: body.title?.trim() || "New thread",
      });
      return jsonResponse(200, { thread: mapThread(t) }, event);
    }

    const tid = body.threadId?.trim() ?? "";
    if (!tid) {
      return jsonResponse(400, { error: "threadId required" }, event);
    }

    if (action === "get") {
      const t = await getAgentMaloneThreadById(tid);
      if (!t || t.projectId !== projectId) {
        return jsonResponse(404, { error: "Thread not found" }, event);
      }
      const memRows = await listAgentMaloneMemoryByThread(tid);
      return jsonResponse(
        200,
        {
          thread: mapThread(t),
          workingMemory: memRows.map(dbAgentMaloneMemoryToApi),
        },
        event,
      );
    }

    if (action === "update") {
      const t = await updateAgentMaloneThread({
        id: tid,
        title: body.title,
        currentVendorId: body.currentVendorId,
        currentArchitectureOptionId: body.currentArchitectureOptionId,
        currentSectionId: body.currentSectionId,
        currentFocus: body.currentFocus,
      });
      if (!t || t.projectId !== projectId) {
        return jsonResponse(404, { error: "Thread not found" }, event);
      }
      return jsonResponse(200, { thread: mapThread(t) }, event);
    }

    if (action === "archive") {
      const t = await updateAgentMaloneThread({
        id: tid,
        status: "archived",
      });
      if (!t || t.projectId !== projectId) {
        return jsonResponse(404, { error: "Thread not found" }, event);
      }
      return jsonResponse(200, { thread: mapThread(t) }, event);
    }

    if (action === "clear_memory") {
      const t = await getAgentMaloneThreadById(tid);
      if (!t || t.projectId !== projectId) {
        return jsonResponse(404, { error: "Thread not found" }, event);
      }
      await deleteAllAgentMaloneMemoryForThread(tid);
      return jsonResponse(200, { ok: true }, event);
    }

    return jsonResponse(400, { error: "invalid action" }, event);
  } catch (e) {
    logServerError("agent-malone-threads", e);
    return internalErrorResponse(event);
  }
};
