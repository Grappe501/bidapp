import type { DraftMetadata, DraftSectionType, ScoringCategory } from "@/types";
import { MOCK_SCORING_CATEGORIES, SCORING_TOTAL_POINTS } from "@/data/mockScoringModel";

export const DRAFT_WORDS_PER_PAGE = 450;

/** Section caps and evaluator focus (aligned with BP-005.5 constraints + BP-006). */
export const SECTION_FOCUS: Record<
  DraftSectionType,
  { maxPages: number; focus: string }
> = {
  Experience: {
    maxPages: 2,
    focus: "Performance metrics, proven results, traceable evidence.",
  },
  Solution: {
    maxPages: 2,
    focus: "Non-technical clarity; evaluation alignment; no vendor fluff.",
  },
  Risk: {
    maxPages: 2,
    focus: "Risk + mitigation + proof; interview-consistent.",
  },
  "Executive Summary": {
    maxPages: 1,
    focus: "Disciplined overview; no new unsupported claims.",
  },
  "Architecture Narrative": {
    maxPages: 2,
    focus: "Stack roles, integration, Malone orchestration, partner boundaries.",
  },
};

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function estimatePagesFromWords(words: number): number {
  return Math.round((words / DRAFT_WORDS_PER_PAGE) * 10) / 10;
}

export type PageOverflowRisk = "ok" | "near" | "over";

export function pageOverflowRisk(
  estimatedPages: number,
  maxPages: number,
): PageOverflowRisk {
  if (estimatedPages > maxPages) return "over";
  if (estimatedPages > maxPages * 0.92) return "near";
  return "ok";
}

export type CoverageHealth = "complete" | "partial" | "weak";

export function coverageHealth(
  meta: DraftMetadata | null,
  bundleRequirementCount: number,
): CoverageHealth {
  if (!meta) return "weak";
  const miss = meta.missingRequirementIds.length;
  if (
    miss === 0 &&
    meta.unsupportedClaimFlags.length === 0 &&
    bundleRequirementCount > 0
  ) {
    return "complete";
  }
  if (bundleRequirementCount === 0) {
    return meta.unsupportedClaimFlags.length === 0 ? "partial" : "weak";
  }
  if (miss <= Math.max(1, Math.ceil(bundleRequirementCount * 0.35))) {
    return "partial";
  }
  return "weak";
}

export type ScoreStrength = "Strong" | "Moderate" | "Weak";

export function scoringStrength(
  sectionType: DraftSectionType,
  meta: DraftMetadata | null,
): ScoreStrength {
  if (!meta) return "Weak";
  if (meta.riskFlags.length > 2 || meta.unsupportedClaimFlags.length > 1) {
    return "Weak";
  }
  if (meta.missingRequirementIds.length > 2) return "Weak";
  if (meta.missingRequirementIds.length > 0 || meta.riskFlags.length > 0) {
    return "Moderate";
  }
  void sectionType;
  return "Strong";
}

export function scoringCategoriesForSection(
  sectionType: DraftSectionType,
): ScoringCategory[] {
  const primary: Record<DraftSectionType, string[]> = {
    Experience: ["Experience"],
    Solution: ["Solution"],
    Risk: ["Risk"],
    "Executive Summary": [
      "Experience",
      "Solution",
      "Risk",
      "Interview",
      "Cost",
    ],
    "Architecture Narrative": ["Solution", "Risk"],
  };
  const names = new Set(primary[sectionType]);
  return MOCK_SCORING_CATEGORIES.filter((c) => names.has(c.name));
}

export function pointsLabel(weight: number): string {
  const pts = Math.round(weight * SCORING_TOTAL_POINTS);
  return `${pts} / ${SCORING_TOTAL_POINTS}`;
}

export function buildConstraintMessages(input: {
  sectionType: DraftSectionType;
  meta: DraftMetadata | null;
  maxPages: number;
}): string[] {
  const { sectionType, meta, maxPages } = input;
  const msgs: string[] = [];
  if (!meta) return msgs;

  const risk = pageOverflowRisk(meta.estimatedPages, maxPages);
  if (risk === "over") {
    msgs.push(
      `Page budget exceeded: ~${meta.estimatedPages} pages vs ${maxPages} max.`,
    );
  } else if (risk === "near") {
    msgs.push(
      `Near page cap: ~${meta.estimatedPages} / ${maxPages} pages — tighten wording.`,
    );
  }

  if (meta.unsupportedClaimFlags.length > 0) {
    msgs.push(
      `${meta.unsupportedClaimFlags.length} unsupported-claim flag(s) — verify or qualify.`,
    );
  }

  if (sectionType === "Experience" && meta.missingRequirementIds.length > 0) {
    msgs.push("Experience: missing requirement hooks — add metrics or evidence ties.");
  }
  if (sectionType === "Solution") {
    msgs.push(
      "Solution: evaluators reward non-technical clarity — avoid deep stack jargon without context.",
    );
  }
  if (sectionType === "Risk" && meta.riskFlags.length > 0) {
    msgs.push("Risk: ensure each risk names mitigation and evidence path.");
  }

  return msgs;
}
