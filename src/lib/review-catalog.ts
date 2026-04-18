import type { ReviewIssueType } from "@/types";

export const REVIEW_RULE_GROUPS = [
  {
    id: "coverage",
    title: "Requirement coverage",
    description:
      "Mandatory items, evidence links, matrix status, and proof-graph support levels.",
    issueTypes: [
      "Missing Requirement Coverage",
      "Weak Evidence Support",
      "Weak Requirement Proof",
      "Over-Reliance on Vendor Claims",
    ] as ReviewIssueType[],
  },
  {
    id: "grounded_prose",
    title: "Grounded prose review",
    description:
      "Outputs from grounded draft review: coverage findings, unsupported claims, contradictions, and confidence.",
    issueTypes: [
      "Requirement Not Addressed in Section",
      "Unsupported Claim",
      "Draft Contradiction",
      "Low Confidence Draft",
      "Technical Density Risk",
      "Weak Metrics Presence",
      "Missing Mitigation Proof",
      "Weak Differentiation Support",
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
      "Scored volumes, metrics, clarity, mitigation structure, and grounded quality signals.",
    issueTypes: [
      "Scoring Weakness",
      "Page Limit Risk",
      "Technical Density Risk",
      "Weak Metrics Presence",
      "Low Confidence Draft",
    ] as ReviewIssueType[],
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
    description:
      "SRV-1, flow-down posture, and contract-sensitive contradictions or unsupported claims.",
    issueTypes: [
      "Contract Exposure",
      "Architecture Risk",
      "Draft Contradiction",
      "Unsupported Claim",
    ] as ReviewIssueType[],
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
