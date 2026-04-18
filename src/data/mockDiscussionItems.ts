import type { DiscussionItem } from "@/types";

export const MOCK_DISCUSSION_ITEMS: DiscussionItem[] = [
  {
    id: "disc-001",
    name: "Scope of Work",
    status: "In Progress",
    notes: "Align final SOW language with technical volumes before award negotiation.",
  },
  {
    id: "disc-002",
    name: "Risk Management Plan",
    status: "Not Started",
    notes: "Must mirror Risk volume commitments; include escalation and DHS touchpoints.",
  },
  {
    id: "disc-003",
    name: "Payment Schedule",
    status: "Not Started",
    notes: "Reconcile with pricing workbook and cash-flow assumptions.",
  },
  {
    id: "disc-004",
    name: "Reporting Templates",
    status: "Not Started",
    notes: "Map to contract reporting articles; confirm file formats and SLAs.",
  },
];
