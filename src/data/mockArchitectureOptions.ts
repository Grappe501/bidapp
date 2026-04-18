import type { ArchitectureOption } from "@/types";

const t0 = "2026-04-05T10:00:00.000Z";
const t1 = "2026-04-19T11:30:00.000Z";

export const MOCK_ARCHITECTURE_OPTIONS: ArchitectureOption[] = [
  {
    id: "arch-001",
    name: "SuiteRx core + EvolvedRx control + targeted specialists",
    status: "Recommended",
    summary:
      "SuiteRx as system of record for claims and benefits, EvolvedRx orchestrating PA/appeals and exceptions, Pharmesol on outreach, PersonalMed on financial analytics. Balanced for defensibility and Arkansas Medicaid complexity.",
    recommended: true,
    components: [
      {
        id: "ac-001-1",
        vendorId: "vendor-suite-rx",
        vendorName: "SuiteRx",
        role: "Primary Platform",
        responsibilitySummary:
          "Claims, benefits, formulary, core reporting, and MMIS-facing transactions.",
        optional: false,
      },
      {
        id: "ac-001-2",
        vendorId: "vendor-evolved-rx",
        vendorName: "EvolvedRx",
        role: "Intelligence Layer",
        responsibilitySummary:
          "Prior auth, appeals, and cross-functional workflow SLAs with audit trail.",
        optional: false,
      },
      {
        id: "ac-001-3",
        vendorId: "vendor-pharmesol",
        vendorName: "Pharmesol",
        role: "Supporting Layer",
        responsibilitySummary:
          "Member/prescriber communications, refill and adherence campaigns.",
        optional: false,
      },
      {
        id: "ac-001-4",
        vendorId: "vendor-personal-med",
        vendorName: "PersonalMed",
        role: "Supporting Layer",
        responsibilitySummary:
          "Rebate and specialty analytics; executive dashboards for oversight.",
        optional: true,
      },
    ],
    narrativeStrengths: [
      "Clear system-of-record story with specialized layers for workflow and outreach",
      "Malone can own policy translation and cross-vendor governance without replacing core engines",
      "Maps cleanly to evaluation themes: operations, compliance, and member experience",
    ],
    implementationRisks: [
      "Integration sequencing between SuiteRx and EvolvedRx must be locked early",
      "Role boundaries in UM must be written to avoid duplicate configuration",
    ],
    malonePositionSummary:
      "Malone sits above core vendors as the orchestration and advisory layer: owns cross-vendor playbooks, exception policies, executive reporting narrative, and implementation governance. Does not replace adjudication; directs how vendors interoperate to meet Arkansas outcomes.",
    notes: "Default recommendation for full technical response.",
    createdAt: t0,
    updatedAt: t1,
  },
  {
    id: "arch-002",
    name: "Existing PMS + EvolvedRx + Malone overlay",
    status: "Under Review",
    summary:
      "Assumes retention of a legacy PBM module with EvolvedRx providing modern workflow and Malone standardizing governance. Lower change surface but weaker primary-platform story.",
    recommended: false,
    components: [
      {
        id: "ac-002-1",
        vendorId: "vendor-evolved-rx",
        vendorName: "EvolvedRx",
        role: "Primary Platform",
        responsibilitySummary:
          "Workflow and UM leadership while legacy engine handles batch claims (transition path).",
        optional: false,
      },
      {
        id: "ac-002-2",
        vendorId: "vendor-pharmesol",
        vendorName: "Pharmesol",
        role: "Supporting Layer",
        responsibilitySummary: "Communication automation layered on legacy portals.",
        optional: true,
      },
    ],
    narrativeStrengths: [
      "Compressed migration risk if state prioritizes continuity",
      "EvolvedRx can demonstrate rapid PA improvements without full replatform",
    ],
    implementationRisks: [
      "Legacy constraints may cap API quality and real-time eligibility",
      "Harder to defend long-term TCO vs modern primary platform",
    ],
    malonePositionSummary:
      "Malone becomes the explicit modernization layer: documents interim architecture, owns roadmap to target state, and shields the state from vendor finger-pointing during hybrid operations.",
    notes: "Fallback narrative if procurement favors incremental change.",
    createdAt: t0,
    updatedAt: t1,
  },
  {
    id: "arch-003",
    name: "Multi-vendor stack + NexusBridge integration hub",
    status: "Draft",
    summary:
      "Best-of-breed composition with NexusBridge mediating integrations. Higher integration tax; use only if RFP rewards flexibility over single-vendor accountability.",
    recommended: false,
    components: [
      {
        id: "ac-003-1",
        vendorId: "vendor-suite-rx",
        vendorName: "SuiteRx",
        role: "Primary Platform",
        responsibilitySummary: "Core claims and benefits.",
        optional: false,
      },
      {
        id: "ac-003-2",
        vendorId: "vendor-nexus-bridge",
        vendorName: "NexusBridge",
        role: "Integration Layer",
        responsibilitySummary:
          "Normalized APIs and file exchange between MMIS, SuiteRx, and satellite tools.",
        optional: false,
      },
      {
        id: "ac-003-3",
        vendorId: "vendor-personal-med",
        vendorName: "PersonalMed",
        role: "Supporting Layer",
        responsibilitySummary: "Financial optimization analytics.",
        optional: true,
      },
    ],
    narrativeStrengths: [
      "Maximum flexibility to swap satellite vendors",
      "Strong story for complex multi-agency interfaces",
    ],
    implementationRisks: [
      "NexusBridge in critical path increases outage blast radius",
      "Longer SI timeline and more contract seams to defend",
    ],
    malonePositionSummary:
      "Malone chairs integration governance: runbooks, escalation matrix, and single-pane executive view across hub and endpoints.",
    notes: "Only advance if evaluation criteria weight integration agility over vendor consolidation.",
    createdAt: t0,
    updatedAt: t1,
  },
  {
    id: "arch-004",
    name: "Minimal rapid-bid stack (compressed timeline)",
    status: "Draft",
    summary:
      "SuiteRx + EvolvedRx only; defer comms automation and deep analytics to phase 2. For contingency if schedule collapses.",
    recommended: false,
    components: [
      {
        id: "ac-004-1",
        vendorId: "vendor-suite-rx",
        vendorName: "SuiteRx",
        role: "Primary Platform",
        responsibilitySummary: "Core PBM scope must-haves only.",
        optional: false,
      },
      {
        id: "ac-004-2",
        vendorId: "vendor-evolved-rx",
        vendorName: "EvolvedRx",
        role: "Intelligence Layer",
        responsibilitySummary: "PA/appeals minimum viable scope.",
        optional: false,
      },
    ],
    narrativeStrengths: [
      "Fewer moving parts for implementation plan credibility",
      "Easier to resource for a short-fuse red-team cycle",
    ],
    implementationRisks: [
      "Weaker member experience story without Pharmesol",
      "Financial narrative thinner without PersonalMed analytics",
    ],
    malonePositionSummary:
      "Malone carries the phase-2 roadmap: explicit list of deferred capabilities, dates, and risk owners so evaluators see discipline, not omission.",
    notes: "Use as schedule-risk appendix, not primary recommendation.",
    createdAt: t0,
    updatedAt: t1,
  },
];
