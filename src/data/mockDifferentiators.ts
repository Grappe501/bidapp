import { MOCK_PROJECT } from "@/data/mockProject";
import type { Differentiator } from "@/types";

const pid = MOCK_PROJECT.id;
const t = "2026-04-18T11:30:00.000Z";

export const MOCK_DIFFERENTIATORS: Differentiator[] = [
  {
    id: "diff-001",
    projectId: pid,
    title: "24/7 operations & 2-hour urgent delivery",
    category: "Delivery reliability",
    ourPosition:
      "Documented coverage model, pharmacy-of-record handoffs, and after-hours escalation tied to RFP language.",
    competitorGap:
      "Incumbents may rest on history; low-cost bidders may under-specify true surge capacity.",
    proofBasis:
      "Sourced: tie to solicitation requirements + Malone runbooks; validate with past performance artifacts.",
    strength: "Strong",
    evidenceCharacter: "Sourced",
    notes: "Keep claims bounded to what evidence supports.",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "diff-002",
    projectId: pid,
    title: "MatrixCare interface readiness (6-month horizon)",
    category: "MatrixCare / integration readiness",
    ourPosition:
      "Phased plan with named owners, test strategy, and rollback — aligned to state direction without fantasy dates.",
    competitorGap:
      "National templates may promise speed without Arkansas-specific dependencies.",
    proofBasis:
      "Inferred vs competitors: stress-test timelines in interview; use architecture narrative for realism.",
    strength: "Strong",
    evidenceCharacter: "Inferred",
    notes: "Explicitly label assumptions vs verified facts in drafts.",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "diff-003",
    projectId: pid,
    title: "Reporting & auditability",
    category: "Reporting / analytics",
    ourPosition:
      "Report catalog mapped to contract articles; drill-down for oversight without manual heroics.",
    competitorGap:
      "Tech-light bidders may offer static reports; some incumbents may resist transparency.",
    proofBasis:
      "Judgment + evidence vault links: align exemplar reports to requirements matrix.",
    strength: "Moderate",
    evidenceCharacter: "Judgment",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "diff-004",
    projectId: pid,
    title: "Security & privacy posture",
    category: "Security / privacy",
    ourPosition:
      "HIPAA/HITECH controls, logging, and vendor accountability chain suitable for public-sector scrutiny.",
    competitorGap:
      "Consolidators may obscure subprocessors; weak narratives fail Risk scoring.",
    proofBasis:
      "Sourced: policies, past audits, vendor attestations where available.",
    strength: "Moderate",
    evidenceCharacter: "Sourced",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "diff-005",
    projectId: pid,
    title: "Transition readiness & continuity",
    category: "Implementation speed",
    ourPosition:
      "Member-centric cutover, staffing continuity, and measurable readiness gates.",
    competitorGap:
      "Incumbent argues “no transition needed”; you argue “better transition than status quo drift.”",
    proofBasis:
      "Judgment: frame as risk reduction vs unexamined incumbent complacency.",
    strength: "Strong",
    evidenceCharacter: "Judgment",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "diff-006",
    projectId: pid,
    title: "No rip-and-replace: intelligence overlay",
    category: "Innovation / Malone overlay",
    ourPosition:
      "Malone coordinates exceptions, insights, and governance without replacing core adjudication.",
    competitorGap:
      "Innovation-heavy pitches may scare evaluators; yours should read as safety-enhancing.",
    proofBasis:
      "Strategic judgment aligned to BP-006 drafting constraints.",
    strength: "Strong",
    evidenceCharacter: "Judgment",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "diff-007",
    projectId: pid,
    title: "Billing discipline & NADAC alignment",
    category: "Billing discipline",
    ourPosition:
      "Clean billing rules, reconciliation discipline, and transparent exception handling.",
    competitorGap:
      "Price aggressiveness without operational depth creates interview vulnerability.",
    proofBasis:
      "Inferred competitive dynamic; support with finance desk artifacts.",
    strength: "Moderate",
    evidenceCharacter: "Inferred",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "diff-008",
    projectId: pid,
    title: "Staffing model & bench depth",
    category: "Staffing model",
    ourPosition:
      "Named roles, backups, and cross-training — credible under FOIA and interview probes.",
    competitorGap:
      "Thin teams may hide behind vendor names; you show operational substance.",
    proofBasis:
      "Judgment + HR/org charts as allowed.",
    strength: "Moderate",
    evidenceCharacter: "Judgment",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
];
