import type { AgentMaloneMemoryKey, AgentMaloneWorkingMemory } from "../../types";
import type { DbAgentMaloneMemory } from "../repositories/agent-malone-memory.repo";

export function dbAgentMaloneMemoryToApi(
  r: DbAgentMaloneMemory,
): AgentMaloneWorkingMemory {
  return {
    id: r.id,
    threadId: r.threadId,
    projectId: r.projectId,
    memoryKey: r.memoryKey as AgentMaloneMemoryKey,
    memoryValue: r.memoryValue,
    confidence: r.confidence ?? undefined,
    source: r.source as AgentMaloneWorkingMemory["source"],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
