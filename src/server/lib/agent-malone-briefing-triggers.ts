import type { AgentMaloneBriefingMode } from "../../types";

/** Pick a briefing mode from thread focus text (operational, not ML). */
export function inferBriefingModeFromFocus(
  focus: string | null | undefined,
): AgentMaloneBriefingMode {
  const f = (focus ?? "").toLowerCase();
  if (!f.trim()) return "default";
  if (/readiness|submit|submission|gate|final\s+push/.test(f)) return "readiness";
  if (/vendor|due\s+diligence|diligence|interview\s+prep/.test(f)) return "vendor";
  if (/solution|draft|rewrite|section/.test(f)) return "drafting";
  if (/pric(e|ing)/.test(f)) return "pricing";
  if (/compar|leader|runner|stack/.test(f)) return "comparison";
  if (/strateg/.test(f)) return "strategy";
  return "default";
}
