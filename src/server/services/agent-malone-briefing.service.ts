import type { AgentMaloneBriefing, AgentMaloneBriefingMode } from "../../types";
import {
  memoryRowsByKey,
  resolveArchitectureIdFromPolicy,
  resolveSectionIdFromPolicy,
  resolveVendorIdFromPolicy,
  resolveFocusText,
} from "../lib/agent-malone-memory-policy";
import {
  buildAgentMaloneBriefing,
  briefingDomainsForMode,
} from "../lib/agent-malone-briefing-builder";
import { gatherBidAgentContext } from "../lib/bid-agent-toolkit";
import { listAgentMaloneMemoryByThread } from "../repositories/agent-malone-memory.repo";
import { listRecentAgentMaloneMessages } from "../repositories/agent-malone-message.repo";
import {
  getAgentMaloneThreadById,
  updateAgentMaloneThread,
} from "../repositories/agent-malone-thread.repo";
import {
  ensureAgentMaloneThread,
  syncPageContextToMemory,
} from "./agent-malone-thread-workflow.service";

export async function getAgentMaloneBriefing(input: {
  projectId: string;
  threadId?: string | null;
  mode: AgentMaloneBriefingMode;
  currentPage?: string;
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
  sectionId?: string | null;
  /** When true, updates thread summary_line from briefing headline. */
  updateThreadSummary?: boolean;
}): Promise<AgentMaloneBriefing> {
  const { thread } = await ensureAgentMaloneThread(
    input.projectId,
    input.threadId,
  );
  await syncPageContextToMemory({
    projectId: input.projectId,
    threadId: thread.id,
    selectedVendorId: input.selectedVendorId,
    architectureOptionId: input.architectureOptionId,
    sectionId: input.sectionId,
  });

  const t = (await getAgentMaloneThreadById(thread.id)) ?? thread;
  const rows = await listAgentMaloneMemoryByThread(t.id);
  const mem = memoryRowsByKey(rows);

  const ev = resolveVendorIdFromPolicy({
    explicitRequest: input.selectedVendorId,
    pageContext: input.selectedVendorId,
    thread: t,
    memory: mem,
  });
  const ea = resolveArchitectureIdFromPolicy({
    explicitRequest: input.architectureOptionId,
    pageContext: input.architectureOptionId,
    thread: t,
    memory: mem,
  });
  const es = resolveSectionIdFromPolicy({
    explicitRequest: input.sectionId,
    pageContext: input.sectionId,
    thread: t,
    memory: mem,
  });
  const focus = resolveFocusText({ thread: t, memory: mem });

  const domains = briefingDomainsForMode(input.mode);
  const ctx = await gatherBidAgentContext({
    projectId: input.projectId,
    domains,
    selectedVendorId: ev,
    architectureOptionId: ea,
  });

  const recentMessages = await listRecentAgentMaloneMessages(t.id, 12);

  const briefing = buildAgentMaloneBriefing({
    projectId: input.projectId,
    threadId: t.id,
    mode: input.mode,
    ctx,
    memory: mem,
    recentMessages,
    currentFocus: focus,
    currentVendorId: ev ?? undefined,
    currentArchitectureOptionId: ea ?? undefined,
    currentSectionId: es ?? undefined,
  });

  if (input.updateThreadSummary !== false) {
    const line = `${briefing.headline}`.slice(0, 280);
    await updateAgentMaloneThread({ id: t.id, summaryLine: line });
  }

  return briefing;
}
