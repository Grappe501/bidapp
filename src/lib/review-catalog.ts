import type { ReviewIssueType } from "@/types";

export const REVIEW_RULE_GROUPS = [
  {
    id: "coverage",
    title: "Requirement coverage",
    description:
      "Mandatory items, evidence links, and support strength vs. matrix status.",
    issueTypes: [
      "Missing Requirement Coverage",
      "Weak Evidence Support",
    ] as ReviewIssueType[],
  },
  {
    id: "draft_grounding",
    title: "Draft grounding & claims",
    description:
      "Grounding bundles, metadata flags, and page discipline on active versions.",
    issueTypes: [
      "Unsupported Claim",
      "Page Limit Risk",
      "Missing Requirement Coverage",
    ] as ReviewIssueType[],
  },
  {
    id: "sections",
    title: "Section constraints",
    description:
      "Scored volumes started, metrics, clarity, and mitigation structure heuristics.",
    issueTypes: ["Scoring Weakness", "Page Limit Risk"] as ReviewIssueType[],
  },
  {
    id: "submission",
    title: "Submission completeness",
    description: "Required ARBuy artifacts and validation states.",
    issueTypes: ["Submission Gap"] as ReviewIssueType[],
  },
  {
    id: "discussion",
    title: "Discussion readiness",
    description: "SOW, risk plan, payment, and reporting drafts.",
    issueTypes: ["Discussion Readiness Gap"] as ReviewIssueType[],
  },
  {
    id: "contract",
    title: "Contract & exposure",
    description: "SRV-1 and flow-down posture from the risk register.",
    issueTypes: ["Contract Exposure", "Architecture Risk"] as ReviewIssueType[],
  },
  {
    id: "vendor",
    title: "Vendor validation",
    description: "Primary partner API / integration defensibility.",
    issueTypes: ["Vendor Validation Gap"] as ReviewIssueType[],
  },
  {
    id: "redaction",
    title: "Redaction",
    description: "FOIA-safe package vs open redaction flags.",
    issueTypes: ["Redaction Risk"] as ReviewIssueType[],
  },
] as const;
