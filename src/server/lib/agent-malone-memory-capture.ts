import {
  deleteAgentMaloneMemoryByKey,
  deleteAllAgentMaloneMemoryForThread,
  upsertAgentMaloneMemory,
} from "../repositories/agent-malone-memory.repo";
import { updateAgentMaloneThread } from "../repositories/agent-malone-thread.repo";

const CLEAR_RE =
  /^(clear|reset)\s+(memory|focus|vendor|architecture|section|decision)\b/i;
const SET_VENDOR_RE =
  /(?:set\s+)?(?:current\s+)?vendor\s+(?:to\s+)?(.+)|focusing\s+on\s+vendor\s+(.+)|focus(?:ing)?\s+on\s+(.+)/i;
const SET_FOCUS_RE =
  /(?:focus|thread)\s+(?:is\s+)?on\s+(.+)|set\s+focus\s+to\s+(.+)/i;

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Explicit chat commands for memory (transparent, bounded).
 */
export async function applyExplicitUserMemoryCommands(input: {
  projectId: string;
  threadId: string;
  message: string;
  vendors: Array<{ id: string; name: string }>;
}): Promise<{ clearedKeys: string[]; wrote: number }> {
  const raw = input.message.trim();
  if (!raw) return { clearedKeys: [], wrote: 0 };

  const clearedKeys: string[] = [];
  let wrote = 0;

  const clearM = CLEAR_RE.exec(raw);
  if (clearM) {
    const what = (clearM[2] ?? "").toLowerCase();
    if (what === "memory") {
      await deleteAllAgentMaloneMemoryForThread(input.threadId);
      clearedKeys.push("all_keys");
      await updateAgentMaloneThread({
        id: input.threadId,
        currentVendorId: null,
        currentArchitectureOptionId: null,
        currentSectionId: null,
        currentFocus: null,
      });
      return { clearedKeys, wrote: 0 };
    }
    const keyMap: Record<string, string> = {
      focus: "current_focus",
      vendor: "current_vendor",
      architecture: "current_architecture",
      section: "current_section",
      decision: "current_decision",
    };
    const mk = keyMap[what];
    if (mk) {
      await deleteAgentMaloneMemoryByKey(input.threadId, mk);
      clearedKeys.push(mk);
      if (what === "vendor") {
        await updateAgentMaloneThread({
          id: input.threadId,
          currentVendorId: null,
        });
      }
      if (what === "architecture") {
        await updateAgentMaloneThread({
          id: input.threadId,
          currentArchitectureOptionId: null,
        });
      }
      if (what === "section") {
        await updateAgentMaloneThread({
          id: input.threadId,
          currentSectionId: null,
        });
      }
      if (what === "focus") {
        await updateAgentMaloneThread({
          id: input.threadId,
          currentFocus: null,
        });
      }
    }
    return { clearedKeys, wrote: 0 };
  }

  const fv = SET_VENDOR_RE.exec(raw);
  if (fv) {
    const nameGuess = (fv[1] ?? fv[2] ?? fv[3] ?? "").trim();
    if (nameGuess.length > 1) {
      const vn = norm(nameGuess);
      const hit = input.vendors.find(
        (v) =>
          norm(v.name) === vn ||
          vn.includes(norm(v.name)) ||
          norm(v.name).includes(vn),
      );
      if (hit) {
        await upsertAgentMaloneMemory({
          threadId: input.threadId,
          projectId: input.projectId,
          memoryKey: "current_vendor",
          memoryValue: hit.id,
          confidence: "high",
          source: "explicit_user",
        });
        await updateAgentMaloneThread({
          id: input.threadId,
          currentVendorId: hit.id,
        });
        wrote++;
      }
    }
  }

  const ff = SET_FOCUS_RE.exec(raw);
  if (ff) {
    const focusText = (ff[1] ?? ff[2] ?? "").trim();
    if (focusText.length > 2) {
      await upsertAgentMaloneMemory({
        threadId: input.threadId,
        projectId: input.projectId,
        memoryKey: "current_focus",
        memoryValue: focusText.slice(0, 500),
        confidence: "high",
        source: "explicit_user",
      });
      await updateAgentMaloneThread({
        id: input.threadId,
        currentFocus: focusText.slice(0, 500),
      });
      wrote++;
    }
  }

  if (
    /\bwe(?:'re| are)\s+focusing\s+on\b/i.test(raw) &&
    !fv &&
    !ff
  ) {
    const tail = raw.replace(/^.*focusing\s+on\s+/i, "").trim();
    if (tail.length > 3) {
      await upsertAgentMaloneMemory({
        threadId: input.threadId,
        projectId: input.projectId,
        memoryKey: "current_focus",
        memoryValue: tail.slice(0, 500),
        confidence: "medium",
        source: "explicit_user",
      });
      await updateAgentMaloneThread({
        id: input.threadId,
        currentFocus: tail.slice(0, 500),
      });
      wrote++;
    }
  }

  return { clearedKeys, wrote };
}
