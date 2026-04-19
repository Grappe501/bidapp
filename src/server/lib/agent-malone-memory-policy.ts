import type { DbAgentMaloneMemory } from "../repositories/agent-malone-memory.repo";
import type { DbAgentMaloneThread } from "../repositories/agent-malone-thread.repo";

/** One row per memory_key per thread — value + source on that row. */
export function memoryRowsByKey(
  rows: DbAgentMaloneMemory[],
): Map<string, DbAgentMaloneMemory> {
  const m = new Map<string, DbAgentMaloneMemory>();
  for (const r of rows) {
    m.set(r.memoryKey, r);
  }
  return m;
}

/**
 * Resolution order (packet §6):
 * 1) explicit API parameters
 * 2) current page context (URL)
 * 3) thread row pointers (kept in sync with working memory)
 * 4) working memory keys
 */
export function resolveVendorIdFromPolicy(input: {
  explicitRequest?: string | null;
  pageContext?: string | null;
  thread: DbAgentMaloneThread;
  memory: Map<string, DbAgentMaloneMemory>;
}): string | null {
  if (input.explicitRequest?.trim()) return input.explicitRequest.trim();
  if (input.pageContext?.trim()) return input.pageContext.trim();
  if (input.thread.currentVendorId?.trim())
    return input.thread.currentVendorId.trim();
  const v = input.memory.get("current_vendor")?.memoryValue?.trim();
  return v || null;
}

export function resolveArchitectureIdFromPolicy(input: {
  explicitRequest?: string | null;
  pageContext?: string | null;
  thread: DbAgentMaloneThread;
  memory: Map<string, DbAgentMaloneMemory>;
}): string | null {
  if (input.explicitRequest?.trim()) return input.explicitRequest.trim();
  if (input.pageContext?.trim()) return input.pageContext.trim();
  if (input.thread.currentArchitectureOptionId?.trim()) {
    return input.thread.currentArchitectureOptionId.trim();
  }
  return input.memory.get("current_architecture")?.memoryValue?.trim() || null;
}

export function resolveSectionIdFromPolicy(input: {
  explicitRequest?: string | null;
  pageContext?: string | null;
  thread: DbAgentMaloneThread;
  memory: Map<string, DbAgentMaloneMemory>;
}): string | null {
  if (input.explicitRequest?.trim()) return input.explicitRequest.trim();
  if (input.pageContext?.trim()) return input.pageContext.trim();
  if (input.thread.currentSectionId?.trim()) return input.thread.currentSectionId.trim();
  return input.memory.get("current_section")?.memoryValue?.trim() || null;
}

export function resolveFocusText(input: {
  thread: DbAgentMaloneThread;
  memory: Map<string, DbAgentMaloneMemory>;
}): string | null {
  if (input.thread.currentFocus?.trim()) return input.thread.currentFocus.trim();
  return input.memory.get("current_focus")?.memoryValue?.trim() || null;
}
