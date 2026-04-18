import type { RequirementCandidate } from "@/types";

/** Mock extraction output keyed by library `FileRecord.id`. */
export const MOCK_EXTRACTION_BY_FILE: Record<string, RequirementCandidate[]> = {
  "file-001": [
    {
      id: "cand-001-a",
      sourceFileId: "file-001",
      proposedTitle: "Electronic submission via ARBuy portal only",
      proposedSummary:
        "All volumes must upload through the designated portal; email submissions rejected.",
      proposedSourceSection: "Section 2.3 — Submission Method",
      proposedVerbatimText:
        "Proposals received outside the ARBuy procurement portal shall be deemed non-responsive.",
      proposedRequirementType: "Administrative",
      proposedMandatory: true,
      proposedResponseCategory: "Attachment",
    },
    {
      id: "cand-001-b",
      sourceFileId: "file-001",
      proposedTitle: "PBM core claims platform description",
      proposedSummary:
        "Describe claims engine, edits, and reversal handling for Medicaid pharmacy claims.",
      proposedSourceSection: "Section 4.1 — Core Platform",
      proposedVerbatimText:
        "Offerors shall provide a detailed description of the proposed claims adjudication platform, including edit and reversal workflows.",
      proposedRequirementType: "Technical",
      proposedMandatory: true,
      proposedResponseCategory: "Narrative",
    },
    {
      id: "cand-001-c",
      sourceFileId: "file-001",
      proposedTitle: "Fraud, waste, and abuse program",
      proposedSummary:
        "Mandatory FWA surveillance narrative with SIU interface expectations.",
      proposedSourceSection: "Section 4.6 — Program Integrity",
      proposedVerbatimText:
        "The Offeror shall maintain a comprehensive fraud, waste, and abuse program aligned with State oversight requirements.",
      proposedRequirementType: "Compliance",
      proposedMandatory: true,
      proposedResponseCategory: "Narrative",
    },
    {
      id: "cand-001-d",
      sourceFileId: "file-001",
      proposedTitle: "Data retention and audit log access",
      proposedSummary:
        "Retention periods and on-demand audit extracts for DHS staff.",
      proposedSourceSection: "Section 4.9 — Data Management",
      proposedVerbatimText:
        "Offeror shall retain transaction-level data for not less than seven (7) years and provide audit extracts within five (5) business days of request.",
      proposedRequirementType: "Legal",
      proposedMandatory: true,
      proposedResponseCategory: "Narrative",
    },
    {
      id: "cand-001-e",
      sourceFileId: "file-001",
      proposedTitle: "Disaster recovery and business continuity",
      proposedSummary: "RTO/RPO targets and annual test evidence.",
      proposedSourceSection: "Section 6.5 — Continuity",
      proposedVerbatimText:
        "Describe disaster recovery capabilities including recovery time and recovery point objectives, and summarize most recent test outcomes.",
      proposedRequirementType: "Technical",
      proposedMandatory: true,
      proposedResponseCategory: "Narrative",
    },
    {
      id: "cand-001-f",
      sourceFileId: "file-001",
      proposedTitle: "Optional: member mobile application",
      proposedSummary:
        "If proposed, describe mobile app scope; not scored unless offered.",
      proposedSourceSection: "Section 7.2 — Optional Services",
      proposedVerbatimText:
        "Member-facing mobile capabilities may be proposed as an optional module; failure to propose shall not render the proposal non-responsive.",
      proposedRequirementType: "Other",
      proposedMandatory: false,
      proposedResponseCategory: "Narrative",
    },
  ],
  "file-002": [
    {
      id: "cand-002-a",
      sourceFileId: "file-002",
      proposedTitle: "Clarified question deadline",
      proposedSummary:
        "Final written questions due 5:00 p.m. CT on the date stated in Amendment 02.",
      proposedSourceSection: "Amendment 02 — Schedule",
      proposedVerbatimText:
        "All written clarification questions must be submitted no later than the date and time specified on the Amendment 02 cover sheet.",
      proposedRequirementType: "Administrative",
      proposedMandatory: true,
      proposedResponseCategory: "Internal Decision",
    },
    {
      id: "cand-002-b",
      sourceFileId: "file-002",
      proposedTitle: "Attachment naming convention",
      proposedSummary:
        "File names must follow DHS-PBM-[Volume]-[Offeror] pattern.",
      proposedSourceSection: "Amendment 02 — Portal Uploads",
      proposedVerbatimText:
        "Each uploaded file shall follow the naming convention published in Amendment 02 Exhibit A.",
      proposedRequirementType: "Administrative",
      proposedMandatory: true,
      proposedResponseCategory: "Attachment",
    },
    {
      id: "cand-002-c",
      sourceFileId: "file-002",
      proposedTitle: "Oral presentation eligibility",
      proposedSummary:
        "Top-ranked offerors may be invited to orals; participation non-negotiable if invited.",
      proposedSourceSection: "Amendment 02 — Evaluation",
      proposedVerbatimText:
        "The State reserves the right to require oral presentations; invited offerors must participate as scheduled.",
      proposedRequirementType: "Operational",
      proposedMandatory: false,
      proposedResponseCategory: "Internal Decision",
    },
  ],
  "file-011": [
    {
      id: "cand-011-a",
      sourceFileId: "file-011",
      proposedTitle: "Notarized officer certificates",
      proposedSummary:
        "Corporate officer certificates must be notarized per Arkansas rules.",
      proposedSourceSection: "Form D-1 Instructions",
      proposedVerbatimText:
        "Signatures on Form D-1 must be notarized in accordance with Arkansas notarial standards.",
      proposedRequirementType: "Attachment",
      proposedMandatory: true,
      proposedResponseCategory: "Form",
    },
    {
      id: "cand-011-b",
      sourceFileId: "file-011",
      proposedTitle: "Bonding or financial assurance",
      proposedSummary:
        "If instructed in Form D-2, provide surety or LOC at stated amount.",
      proposedSourceSection: "Form D-2 — Financial Assurance",
      proposedVerbatimText:
        "Where indicated, offeror shall provide a surety bond or irrevocable letter of credit in the amount specified.",
      proposedRequirementType: "Legal",
      proposedMandatory: true,
      proposedResponseCategory: "Certification",
    },
    {
      id: "cand-011-c",
      sourceFileId: "file-011",
      proposedTitle: "Vendor debarring certification",
      proposedSummary: "Certify non-debarment and disclose exclusions.",
      proposedSourceSection: "Form D-3",
      proposedVerbatimText:
        "Offeror certifies that it is not debarred, suspended, or proposed for debarment by any federal or state agency.",
      proposedRequirementType: "Compliance",
      proposedMandatory: true,
      proposedResponseCategory: "Certification",
    },
    {
      id: "cand-011-d",
      sourceFileId: "file-011",
      proposedTitle: "Hard copy exception process",
      proposedSummary:
        "Hard copy only if portal outage authorized by procurement officer.",
      proposedSourceSection: "Submission Exceptions",
      proposedVerbatimText:
        "Hard copy submissions will be accepted only when expressly authorized by the Chief Procurement Officer due to system outage.",
      proposedRequirementType: "Administrative",
      proposedMandatory: false,
      proposedResponseCategory: "Internal Decision",
    },
  ],
};

export function getMockCandidatesForFile(
  fileId: string,
): RequirementCandidate[] {
  const raw = MOCK_EXTRACTION_BY_FILE[fileId];
  if (!raw) return [];
  return raw.map((c) => ({ ...c }));
}
