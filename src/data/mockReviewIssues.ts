import type { ReviewIssue } from "@/types";

/** Bid-specific examples merged only when rule engine did not already emit the same id. */
export function getSupplementalReviewIssues(projectId: string): ReviewIssue[] {
  const t = new Date().toISOString();
  return [
    {
      id: "rev:seed-eo-narrative",
      projectId,
      issueType: "Submission Gap",
      severity: "Moderate",
      title: "EO policy narrative not cross-checked to legal entity name",
      description:
        "Policy PDF is Ready in checklist, but confirm the exact legal name matches ARBuy vendor registration and SRV-1 cover sheet.",
      entityType: "submission_item",
      entityId: "sub-004",
      status: "Open",
      suggestedFix:
        "Run a one-line match between PDF header, registration, and proposal cover — log outcome in submission notes.",
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "rev:seed-emergency-delivery",
      projectId,
      issueType: "Weak Evidence Support",
      severity: "High",
      title: "Mandatory delivery / continuity language may need stronger pharmacy ops proof",
      description:
        "S000000479-style operations often probe emergency formulary and delivery continuity — ensure Delivery-tagged requirements have Moderate+ support.",
      entityType: "project",
      entityId: projectId,
      status: "Open",
      suggestedFix:
        "Filter requirements by Delivery tag; attach runbook or reference account evidence where allowed.",
      createdAt: t,
      updatedAt: t,
    },
  ];
}
