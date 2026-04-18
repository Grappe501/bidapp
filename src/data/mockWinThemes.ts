import { MOCK_PROJECT } from "@/data/mockProject";
import type { WinTheme } from "@/types";

const pid = MOCK_PROJECT.id;
const t = "2026-04-18T11:00:00.000Z";

export const MOCK_WIN_THEMES: WinTheme[] = [
  {
    id: "wt-001",
    projectId: pid,
    title: "Safer, more accountable pharmacy operations",
    summary:
      "Oversight, staffing continuity, and measurable service outcomes — not just claims processing.",
    supportingPoints: [
      "Malone as accountable orchestration layer",
      "Explicit escalation and audit trail for exceptions",
      "Interview-consistent operations story",
    ],
    targetSections: ["Experience", "Solution", "Risk", "Interview Prep"],
    priority: 1,
    status: "Active",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "wt-002",
    projectId: pid,
    title: "Technology-enabled oversight without rip-and-replace risk",
    summary:
      "Modernize interfaces and analytics while preserving stable claims and benefits cores.",
    supportingPoints: [
      "SuiteRx / partner roles bounded and defensible",
      "Phased MatrixCare readiness with honest timelines",
      "No disruption for disruption’s sake",
    ],
    targetSections: ["Solution", "Architecture Narrative", "Discussion documents"],
    priority: 2,
    status: "Active",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "wt-003",
    projectId: pid,
    title: "Faster implementation with stronger continuity",
    summary:
      "Transition plan that protects members and staff while accelerating time-to-value on critical interfaces.",
    supportingPoints: [
      "Cutover sequencing tied to evidence",
      "Parallel running where required by risk",
      "Training and hypercare tied to scoring language",
    ],
    targetSections: ["Experience", "Risk", "Interview Prep"],
    priority: 3,
    status: "Active",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "wt-004",
    projectId: pid,
    title: "Financially disciplined service model",
    summary:
      "NADAC-aligned discipline, transparent pricing posture, and waste avoidance the state can defend.",
    supportingPoints: [
      "Billing accuracy controls",
      "Reporting that supports fiscal oversight",
      "No surprise fee structures",
    ],
    targetSections: ["Solution", "Risk", "Discussion documents"],
    priority: 4,
    status: "Draft",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "wt-005",
    projectId: pid,
    title: "Stronger integration and reporting readiness",
    summary:
      "MatrixCare-facing workstreams, analytics, and operational transparency evaluators can test in interview.",
    supportingPoints: [
      "Interface milestones with owners",
      "Audit-ready reporting package",
      "Security and privacy posture aligned to RFP",
    ],
    targetSections: ["Solution", "Architecture Narrative", "Risk"],
    priority: 5,
    status: "Active",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "wt-006",
    projectId: pid,
    title: "Malone as intelligence overlay, not a disruption layer",
    summary:
      "Position Malone as governance + insight that makes the stack safer — not another system to fight.",
    supportingPoints: [
      "Clear decision rights and SLAs",
      "Exception workflows with evidence",
      "Partner coordination without diluting accountability",
    ],
    targetSections: [
      "Executive Summary",
      "Solution",
      "Architecture Narrative",
      "Interview Prep",
    ],
    priority: 2,
    status: "Approved",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "wt-007",
    projectId: pid,
    title: "Emergency response and 24/7 operational credibility",
    summary:
      "Credible coverage model for urgent and after-hours needs tied to solicitation expectations.",
    supportingPoints: [
      "2-hour urgent delivery where required",
      "Staffing model that survives scrutiny",
      "Risk mitigations for single points of failure",
    ],
    targetSections: ["Experience", "Risk", "Interview Prep"],
    priority: 3,
    status: "Active",
    createdAt: t,
    updatedAt: t,
  },
];
