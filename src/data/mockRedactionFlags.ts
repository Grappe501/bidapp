import type { RedactionFlag } from "@/types";

export const MOCK_REDACTION_FLAGS: RedactionFlag[] = [
  {
    id: "red-001",
    entityType: "File",
    entityId: "file-003",
    entityLabel: "Pricing_Workbook_LineItems_v1.xlsx",
    reason: "Pricing detail — withhold line-item methodology from public copy pending legal review.",
    status: "Open",
  },
  {
    id: "red-002",
    entityType: "Evidence",
    entityId: "ev-001",
    entityLabel: "Evidence — internal transition timeline",
    reason: "Competitive sensitivity — verify before any FOIA release.",
    status: "Under Review",
  },
  {
    id: "red-003",
    entityType: "Vendor",
    entityId: "vendor-suite-rx",
    entityLabel: "SuiteRx",
    reason: "Commercial terms reference — redact in public appendix.",
    status: "Open",
  },
];
