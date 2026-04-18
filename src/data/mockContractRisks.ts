import type { ContractClause, ContractRisk } from "@/types";

export const MOCK_CONTRACT_RISKS: ContractRisk[] = [
  {
    id: "cr-001",
    category: "SRV-1 — Service levels",
    description:
      "Failure to meet defined turnaround, accuracy, or reporting SLAs can trigger default remedies and reputational loss with DHS.",
    severity: "High",
  },
  {
    id: "cr-002",
    category: "Flow-down & subcontracting",
    description:
      "Proposal named partners become binding; weak flow-down language in draft volumes creates MSA exposure post-award.",
    severity: "Critical",
  },
  {
    id: "cr-003",
    category: "Data & integration",
    description:
      "Claims on real-time eligibility / claims interfaces must match actual integration scope; overstatement becomes breach risk.",
    severity: "High",
  },
  {
    id: "cr-004",
    category: "FOIA / public records",
    description:
      "Submitted narrative may be disclosed; trade-secret and pricing redaction strategy must be pre-coordinated.",
    severity: "Moderate",
  },
];

export const MOCK_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: "cc-001",
    reference: "SRV-1 (illustrative)",
    title: "Core pharmacy benefit operations",
    obligationSummary:
      "Defines operational responsibilities for PBM functions tied to HDC populations and state reporting cadence.",
    proposalExposure:
      "Any performance metric promised in the technical response should appear in the risk register with a named owner.",
  },
  {
    id: "cc-002",
    reference: "Contract Article — Amendments",
    title: "Changes in law / program",
    obligationSummary:
      "Vendor must implement state and federal changes affecting drug coverage and billing within directed timelines.",
    proposalExposure:
      "Implementation timelines in the proposal must not assume best-case agency turnaround.",
  },
  {
    id: "cc-003",
    reference: "Contract Article — Audit & inspection",
    title: "Audit cooperation",
    obligationSummary:
      "Records access, corrective action, and cooperation with state and federal audit entities.",
    proposalExposure:
      "Evidence vault discipline now prevents unverifiable audit responses later.",
  },
];
