import { MOCK_PROJECT } from "@/data/mockProject";
import type { SubmissionWorkflowStep } from "@/types";

const pid = MOCK_PROJECT.id;

export const MOCK_SUBMISSION_WORKFLOW_STEPS: SubmissionWorkflowStep[] = [
  {
    id: "wf-001",
    projectId: pid,
    stepName: "Final Draft Review",
    description:
      "Volume leads sign off Experience, Solution, and Risk; executive summary aligned.",
    orderIndex: 0,
    status: "In Progress",
    required: true,
    assignedTo: "Volume lead",
    completedAt: null,
    notes: "",
  },
  {
    id: "wf-002",
    projectId: pid,
    stepName: "Submission Package Assembly",
    description:
      "Forms, price sheet, EO policy, and technical PDFs collated per ARBuy naming.",
    orderIndex: 1,
    status: "Not Started",
    required: true,
    assignedTo: "Proposal ops",
    completedAt: null,
    notes: "",
  },
  {
    id: "wf-003",
    projectId: pid,
    stepName: "Redacted Copy Finalization",
    description:
      "Public / FOIA packet mirrors redaction register; legal review complete.",
    orderIndex: 2,
    status: "Not Started",
    required: true,
    assignedTo: "Legal",
    completedAt: null,
    notes: "",
  },
  {
    id: "wf-004",
    projectId: pid,
    stepName: "Final Validation Gate",
    description:
      "System gate: checklist, readiness, critical issues, page limits, redaction.",
    orderIndex: 3,
    status: "Not Started",
    required: true,
    assignedTo: "Proposal lead",
    completedAt: null,
    notes: "",
  },
  {
    id: "wf-005",
    projectId: pid,
    stepName: "Client Approval",
    description: "Client executive authorizes submission and ARBuy execution.",
    orderIndex: 4,
    status: "Not Started",
    required: true,
    assignedTo: "Client executive",
    completedAt: null,
    notes: "",
  },
  {
    id: "wf-006",
    projectId: pid,
    stepName: "ARBuy Upload Execution",
    description:
      "Manual upload to ARBuy for S000000479 — no API automation in this release.",
    orderIndex: 5,
    status: "Not Started",
    required: true,
    assignedTo: "Proposal ops",
    completedAt: null,
    notes: "",
  },
  {
    id: "wf-007",
    projectId: pid,
    stepName: "Submission Confirmation",
    description: "Capture confirmation ID / screenshot; freeze audit trail.",
    orderIndex: 6,
    status: "Not Started",
    required: true,
    assignedTo: "Proposal ops",
    completedAt: null,
    notes: "",
  },
];
