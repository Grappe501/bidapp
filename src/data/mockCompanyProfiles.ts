import type { CompanyProfile } from "@/types";

export const MOCK_COMPANY_PROFILES: CompanyProfile[] = [
  {
    id: "co-malone",
    name: "Malone",
    type: "Client",
    summary:
      "Prime offeror and orchestration layer for S000000479 — Pharmacy Services for DHS HDCs; owns evaluation narrative and integration accountability.",
    capabilities: [
      "Medicaid PBM program governance and state-facing accountability",
      "Cross-vendor orchestration and cutover command",
      "Proposal integrity, redaction, and compliance workflow",
    ],
    risks: [
      "Partner performance attributed to prime in oral defense",
      "Cost scoring sensitivity—workbook discipline is existential",
    ],
    sources: [
      "Internal capture plan",
      "Arkansas DHS solicitation package (S000000479)",
    ],
    claims: [],
    integrationDetails: [],
  },
  {
    id: "co-suiterx",
    name: "SuiteRx",
    type: "Vendor",
    summary:
      "Candidate primary platform for claims, formulary, and core PBM operations in layered architecture options.",
    capabilities: [
      "Core PBM platform features and configurability",
      "Integration patterns with state MMIS and pharmacy networks",
    ],
    risks: [
      "Role overlap with workflow vendors if boundaries unclear",
      "Interview defense must match written architecture",
    ],
    sources: ["Vendor deck (internal)", "Architecture workspace option seeds"],
    claims: [],
    integrationDetails: [],
  },
  {
    id: "co-evolved",
    name: "EvolvedRx",
    type: "Vendor",
    summary:
      "Workflow and control-plane candidate; often positioned between platform and clinical communication layers.",
    capabilities: [
      "Utilization management workflows",
      "Operational dashboards for pharmacy operations",
    ],
    risks: [
      "Scope creep if UM narrative over-promises vs platform",
    ],
    sources: ["Vendor summary — vendor intelligence workspace"],
    claims: [],
    integrationDetails: [],
  },
  {
    id: "co-personalmed",
    name: "PersonalMed",
    type: "Vendor",
    summary:
      "Financial optimization and benefit-design support candidate; pairs with primary platform narratives.",
    capabilities: [
      "Unit cost and trend analytics framing",
      "Rebate and program integrity storytelling (non-pricing volume)",
    ],
    risks: [
      "Must not contradict state pricing workbook mechanics",
    ],
    sources: ["Vendor intelligence workspace"],
    claims: [],
    integrationDetails: [],
  },
];
