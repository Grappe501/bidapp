import { MOCK_PROJECT } from "@/data/mockProject";
import type { SubmissionTask } from "@/types";

const pid = MOCK_PROJECT.id;
const t0 = "2026-04-10T09:00:00.000Z";
const t1 = "2026-04-18T14:00:00.000Z";

export const MOCK_SUBMISSION_TASKS: SubmissionTask[] = [
  {
    id: "task-001",
    projectId: pid,
    taskName: "Finalize Experience section",
    relatedEntityType: "draft_section",
    relatedEntityId: "draft-sec-proj-ark-1",
    assignedTo: "Volume lead",
    status: "In Progress",
    dueAt: "2026-05-01",
    notes: "Lock after metrics pass and page check.",
    createdAt: t0,
    updatedAt: t1,
  },
  {
    id: "task-002",
    projectId: pid,
    taskName: "Validate official price sheet",
    relatedEntityType: "submission_item",
    relatedEntityId: "sub-003",
    assignedTo: "Finance desk",
    status: "Not Started",
    dueAt: "2026-05-02",
    notes: "State Excel template only.",
    createdAt: t0,
    updatedAt: t0,
  },
  {
    id: "task-003",
    projectId: pid,
    taskName: "Confirm EO policy PDF",
    relatedEntityType: "submission_item",
    relatedEntityId: "sub-004",
    assignedTo: "Compliance",
    status: "In Progress",
    dueAt: "2026-05-03",
    notes: "Match legal entity on record.",
    createdAt: t0,
    updatedAt: t1,
  },
  {
    id: "task-004",
    projectId: pid,
    taskName: "Review open redaction flags",
    relatedEntityType: "redaction_flag",
    relatedEntityId: "red-001",
    assignedTo: "Legal",
    status: "Not Started",
    dueAt: "2026-05-02",
    notes: "Pricing workbook line-item posture.",
    createdAt: t0,
    updatedAt: t0,
  },
  {
    id: "task-005",
    projectId: pid,
    taskName: "Upload documents to ARBuy (dry run)",
    relatedEntityType: "workflow_step",
    relatedEntityId: "wf-006",
    assignedTo: "Proposal ops",
    status: "Blocked",
    dueAt: "2026-05-03",
    notes: "Blocked until final gate PASS.",
    createdAt: t0,
    updatedAt: t1,
  },
];
