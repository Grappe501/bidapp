import type { AgentMaloneActionResult } from "../../types";
import {
  insertAgentMaloneThread,
  getAgentMaloneThreadById,
  listActiveAgentMaloneThreads,
  updateAgentMaloneThread,
  type DbAgentMaloneThread,
} from "../repositories/agent-malone-thread.repo";
import {
  listAgentMaloneMemoryByThread,
  upsertAgentMaloneMemory,
} from "../repositories/agent-malone-memory.repo";
import { memoryRowsByKey } from "../lib/agent-malone-memory-policy";

export async function ensureAgentMaloneThread(
  projectId: string,
  threadId?: string | null,
): Promise<{ thread: DbAgentMaloneThread; created: boolean }> {
  if (threadId?.trim()) {
    const t = await getAgentMaloneThreadById(threadId.trim());
    if (t && t.projectId === projectId) {
      return { thread: t, created: false };
    }
  }
  const active = await listActiveAgentMaloneThreads(projectId);
  if (active.length > 0) {
    return { thread: active[0], created: false };
  }
  const t = await insertAgentMaloneThread({ projectId, title: "General" });
  return { thread: t, created: true };
}

/**
 * Refresh thread pointers + working memory from URL / page (non-destructive overwrite of page_context).
 */
export async function syncPageContextToMemory(input: {
  projectId: string;
  threadId: string;
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
  sectionId?: string | null;
}): Promise<void> {
  const patch: Parameters<typeof updateAgentMaloneThread>[0] = {
    id: input.threadId,
  };
  if (input.selectedVendorId?.trim()) {
    const vid = input.selectedVendorId.trim();
    patch.currentVendorId = vid;
    await upsertAgentMaloneMemory({
      threadId: input.threadId,
      projectId: input.projectId,
      memoryKey: "current_vendor",
      memoryValue: vid,
      confidence: "high",
      source: "page_context",
    });
  }
  if (input.architectureOptionId?.trim()) {
    const aid = input.architectureOptionId.trim();
    patch.currentArchitectureOptionId = aid;
    await upsertAgentMaloneMemory({
      threadId: input.threadId,
      projectId: input.projectId,
      memoryKey: "current_architecture",
      memoryValue: aid,
      confidence: "high",
      source: "page_context",
    });
  }
  if (input.sectionId?.trim()) {
    const sid = input.sectionId.trim();
    patch.currentSectionId = sid;
    await upsertAgentMaloneMemory({
      threadId: input.threadId,
      projectId: input.projectId,
      memoryKey: "current_section",
      memoryValue: sid,
      confidence: "high",
      source: "page_context",
    });
  }
  if (
    patch.currentVendorId !== undefined ||
    patch.currentArchitectureOptionId !== undefined ||
    patch.currentSectionId !== undefined
  ) {
    await updateAgentMaloneThread(patch);
  }
}

export async function persistActionResultToWorkingMemory(input: {
  projectId: string;
  threadId: string;
  actionType: string;
  result: AgentMaloneActionResult;
}): Promise<void> {
  await upsertAgentMaloneMemory({
    threadId: input.threadId,
    projectId: input.projectId,
    memoryKey: "last_action",
    memoryValue: input.actionType,
    confidence: "high",
    source: "action_result",
  });
  await upsertAgentMaloneMemory({
    threadId: input.threadId,
    projectId: input.projectId,
    memoryKey: "last_action_result",
    memoryValue: `${input.result.headline}: ${input.result.summary}`.slice(0, 900),
    confidence: input.result.status === "success" ? "high" : "medium",
    source: "action_result",
  });

  const vid = input.result.affectedEntityIds?.[0];
  if (
    vid &&
    /^(run_vendor_research|compute_vendor_fit|compute_vendor_score|generate_vendor_interview|run_claim_validation|run_failure_simulation|run_role_fit|run_pricing_reality|run_vendor_interview_prep_recipe)$/.test(
      input.actionType,
    )
  ) {
    await upsertAgentMaloneMemory({
      threadId: input.threadId,
      projectId: input.projectId,
      memoryKey: "current_vendor",
      memoryValue: vid,
      confidence: "high",
      source: "action_result",
    });
    await updateAgentMaloneThread({
      id: input.threadId,
      currentVendorId: vid,
    });
  }

  if (input.actionType === "build_grounding_bundle") {
    const m = input.result.summary.match(
      /\b(Solution|Risk|Interview|Experience|Executive Summary)\b/i,
    );
    if (m) {
      await upsertAgentMaloneMemory({
        threadId: input.threadId,
        projectId: input.projectId,
        memoryKey: "selected_bundle_type",
        memoryValue: m[1],
        confidence: "high",
        source: "action_result",
      });
    }
  }

  if (
    input.actionType === "run_competitor_simulation" ||
    input.actionType === "run_decision_synthesis" ||
    input.actionType === "run_strategy_refresh_recipe"
  ) {
    await upsertAgentMaloneMemory({
      threadId: input.threadId,
      projectId: input.projectId,
      memoryKey: "current_decision",
      memoryValue: input.result.summary.slice(0, 400),
      confidence: "medium",
      source: "action_result",
    });
  }

  if (
    input.actionType === "refresh_final_readiness" &&
    /\bnot ready|block|missing|risk\b/i.test(input.result.summary)
  ) {
    await upsertAgentMaloneMemory({
      threadId: input.threadId,
      projectId: input.projectId,
      memoryKey: "current_readiness_blocker",
      memoryValue: input.result.summary.slice(0, 400),
      confidence: "medium",
      source: "action_result",
    });
  }
}

export async function buildThreadSummaryLine(
  thread: DbAgentMaloneThread,
): Promise<string> {
  const rows = await listAgentMaloneMemoryByThread(thread.id);
  const mem = memoryRowsByKey(rows);
  const bits: string[] = [];
  bits.push(thread.title);
  const focus =
    thread.currentFocus?.trim() || mem.get("current_focus")?.memoryValue;
  if (focus) bits.push(`Focus: ${focus.slice(0, 80)}`);
  const dec = mem.get("current_decision")?.memoryValue;
  if (dec) bits.push(dec.slice(0, 100));
  const last = mem.get("last_action")?.memoryValue;
  if (last) bits.push(`Last: ${last}`);
  return bits.join(" · ").slice(0, 280);
}
