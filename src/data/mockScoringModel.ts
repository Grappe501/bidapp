import type { ScoringCategory, SectionConstraint } from "@/types";

/** Total evaluation points for S000000479-style model (1000 pts). */
export const SCORING_TOTAL_POINTS = 1000;

export const MOCK_SCORING_CATEGORIES: ScoringCategory[] = [
  {
    id: "score-exp",
    name: "Experience",
    weight: 210 / SCORING_TOTAL_POINTS,
    maxPoints: 210,
    description:
      "Past performance, references, and relevance to Arkansas Medicaid / LTC pharmacy operations.",
  },
  {
    id: "score-sol",
    name: "Solution",
    weight: 210 / SCORING_TOTAL_POINTS,
    maxPoints: 210,
    description:
      "Technical approach, platform fit, and defensibility of the proposed operating model.",
  },
  {
    id: "score-risk",
    name: "Risk",
    weight: 70 / SCORING_TOTAL_POINTS,
    maxPoints: 70,
    description:
      "Risk identification, mitigation, and realism of transition and steady-state controls.",
  },
  {
    id: "score-int",
    name: "Interview",
    weight: 210 / SCORING_TOTAL_POINTS,
    maxPoints: 210,
    description:
      "Oral presentation and Q&A; narrative must match written volumes without over-claiming.",
  },
  {
    id: "score-cost",
    name: "Cost",
    weight: 300 / SCORING_TOTAL_POINTS,
    maxPoints: 300,
    description:
      "Price reasonableness and workbook accuracy; highest weighted factor—errors are disqualifying.",
  },
];

export const MOCK_SECTION_CONSTRAINTS: SectionConstraint[] = [
  {
    section: "Experience",
    maxPages: 2,
    rules:
      "Narrative only within page limit; attachments only where explicitly allowed. Every claim needs traceable evidence or qualified language.",
  },
  {
    section: "Solution",
    maxPages: 2,
    rules:
      "Tie architecture to evaluation criteria; avoid vendor marketing fluff. Surface Malone orchestration and partner boundaries clearly.",
  },
  {
    section: "Risk",
    maxPages: 2,
    rules:
      "Explicit mitigations for cutover, data integration, and LTC continuity. Interview team must own the same story.",
  },
];
