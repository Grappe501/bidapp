import type { AgentMaloneBriefingMode } from "../../types";

/**
 * Detect user intent to receive a structured operational briefing (not generic Q&A).
 */
export function parseBriefingIntentFromQuestion(
  question: string,
): AgentMaloneBriefingMode | null {
  const s = question.trim();
  if (s.length === 0) return null;
  const lower = s.toLowerCase();

  const briefingCue =
    /\b(brief\s+me|briefing|give\s+me\s+a\s+brief|operational\s+brief|status\s+brief)\b/i.test(
      s,
    ) ||
    /^(what'?s\s+going\s+on|where\s+do\s+we\s+stand|where\s+we\s+stand)\??$/i.test(
      s.trim(),
    ) ||
    /\b(project\s+)?status\s+report\b/i.test(s) ||
    /\bwhat\s+changed\b/i.test(lower) ||
    (/\bexecutive\s+summary\b/i.test(s) &&
      /\b(where|stand|brief|status|bid)\b/i.test(lower));

  if (!briefingCue) return null;

  if (/\bexecutive\b/i.test(s) && !/\bsection\b/i.test(lower)) return "executive";
  if (/\bstrateg(y|ist|ic)\b/i.test(lower)) return "strategy";
  if (/\bvendor\b/i.test(lower) && /\b(brief|status|due\s+diligence)\b/i.test(lower))
    return "vendor";
  if (/\breadiness\b/i.test(lower) || /\bsubmission\s+gate\b/i.test(lower))
    return "readiness";
  if (/\bdraft(ing)?\b/i.test(lower) || /\bsection(s)?\b/i.test(lower))
    return "drafting";
  if (/\bpric(e|ing)\b/i.test(lower)) return "pricing";
  if (
    /\bcomparison\b/i.test(lower) ||
    /\bcompare\b/i.test(lower) ||
    /\bleader\b/i.test(lower) ||
    /\brunner[\s-]?up\b/i.test(lower)
  ) {
    return "comparison";
  }

  return "default";
}

export function parseBriefingModeParam(
  raw: string | null | undefined,
): AgentMaloneBriefingMode | null {
  if (!raw?.trim()) return null;
  const m = raw.trim().toLowerCase();
  const allowed: AgentMaloneBriefingMode[] = [
    "default",
    "executive",
    "strategy",
    "vendor",
    "readiness",
    "drafting",
    "pricing",
    "comparison",
  ];
  return allowed.includes(m as AgentMaloneBriefingMode)
    ? (m as AgentMaloneBriefingMode)
    : null;
}
