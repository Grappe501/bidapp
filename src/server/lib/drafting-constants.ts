import type { DraftSectionType } from "@/types";

/** Mirrors BP-005.5 mock model for server-side drafting prompts (1000 pts). */
export const DRAFTING_SCORING_BLOCKS = [
  {
    name: "Experience",
    maxPoints: 210,
    weight: 0.21,
    description:
      "Past performance, references, and relevance to Arkansas Medicaid / LTC pharmacy operations.",
  },
  {
    name: "Solution",
    maxPoints: 210,
    weight: 0.21,
    description:
      "Technical approach, platform fit, and defensibility of the proposed operating model.",
  },
  {
    name: "Risk",
    maxPoints: 70,
    weight: 0.07,
    description:
      "Risk identification, mitigation, and realism of transition and steady-state controls.",
  },
  {
    name: "Interview",
    maxPoints: 210,
    weight: 0.21,
    description:
      "Oral presentation and Q&A; narrative must match written volumes without over-claiming.",
  },
  {
    name: "Cost",
    maxPoints: 300,
    weight: 0.3,
    description:
      "Price reasonableness and workbook accuracy; errors can be disqualifying.",
  },
] as const;

export const SECTION_STRATEGY: Record<
  DraftSectionType,
  { maxPages: number; focus: string }
> = {
  Experience: {
    maxPages: 2,
    focus:
      "Performance metrics, proven results, traceable evidence; metrics-driven scoring.",
  },
  Solution: {
    maxPages: 2,
    focus:
      "Non-technical clarity for evaluators; tie to criteria; avoid vendor fluff.",
  },
  Risk: {
    maxPages: 2,
    focus:
      "Explicit risks with mitigation and proof; interview team must own the same story.",
  },
  "Executive Summary": {
    maxPages: 1,
    focus:
      "Disciplined overview; no new unsupported claims; mirror scored volumes.",
  },
  "Architecture Narrative": {
    maxPages: 2,
    focus:
      "Architecture options, integration boundaries, Malone orchestration and partner roles.",
  },
};

export function scoringForSectionType(sectionType: DraftSectionType): typeof DRAFTING_SCORING_BLOCKS[number][] {
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
  return DRAFTING_SCORING_BLOCKS.filter((b) => names.has(b.name));
}
