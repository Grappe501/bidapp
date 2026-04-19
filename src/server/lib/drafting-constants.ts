import type { DraftSectionType } from "../../types";

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
      "Technical Proposal Packet: repeat Claim of Expertise → Documented Performance blocks; performance metrics and traceable evidence; metrics-driven scoring.",
  },
  Solution: {
    maxPages: 2,
    focus:
      "Non-technical clarity for evaluators; tie to criteria; avoid vendor fluff.",
  },
  Risk: {
    maxPages: 2,
    focus:
      "Technical Proposal Packet: each risk — Risk description → Solution/mitigation → Documented performance or verifiable control; interview team must own the same story.",
  },
  Interview: {
    maxPages: 2,
    focus:
      "Oral defense: align to Solution/Risk volumes; defend pricing and operations; anticipate evaluator Q&A without new unsupported facts.",
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
    Interview: ["Interview", "Cost", "Solution", "Risk"],
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

/** Evaluator-facing support expectations (prompt + UI “what we optimize for”). */
export const SECTION_SUPPORT_EXPECTATIONS: Record<DraftSectionType, string> = {
  Experience:
    "Substantive claims should tie to requirements and evidence; prefer quantified outcomes and named references over generic capability statements.",
  Solution:
    "Approach must be defensible in oral review: plain-language value, criterion mapping, and no uncited technical depth.",
  Risk:
    "Each material risk needs mitigation, owner, and trace to evidence or an explicit gap — no undocumented residual risk.",
  Interview:
    "Oral-defense script: claims must match written volumes, structured pricing, and contract/RFP; rehearse delivery, billing, integration, and cost-stability answers.",
  "Executive Summary":
    "High-level only: mirror scored volumes; no new facts; flag where volumes are still open.",
  "Architecture Narrative":
    "Roles, integrations, and boundaries must be consistent with Solution/Risk volumes; no orphan components.",
};
