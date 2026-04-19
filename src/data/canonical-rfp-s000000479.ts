import type { StructuredRfp } from "../types/rfp-model";

export const S000000479_BID_NUMBER = "S000000479";

/**
 * Authoritative structured RFP for Pharmacy Services for HDCs (ARBuy / DHS).
 * Dates and Table A transcribed from the issued solicitation PDF (S000000479).
 * Proposal due: May 4, 2026 3:00 PM CT — not June.
 */
export const CANONICAL_RFP_S000000479: StructuredRfp = {
  core: {
    solicitationNumber: "S000000479",
    title: "Pharmacy Services for HDCs",
    agency: "DHS",
    department: "Arkansas Department of Human Services",
    dueDate: "2026-05-04",
    submissionMethod: "ARBuy",
    contractType: "Professional Services (Pharmacy)",
    contractTerm: {
      baseYears: 4,
      extensionYears: 3,
    },
  },
  evaluation: {
    experienceWeight: 30,
    solutionWeight: 30,
    riskWeight: 10,
    interviewWeight: 30,
    totalScore: 100,
  },
  requirements: {
    facilities: 5,
    locations: ["Arkansas Human Development Centers (HDCs)"],
    deliveryRequirements: [
      "24/7 service",
      "2-hour emergency delivery",
      "30-day cycle",
    ],
    serviceRequirements: [
      "blister packaging",
      "prior authorization",
      "Medicaid billing",
    ],
    techRequirements: [
      "EHR integration (MatrixCare)",
      "HIPAA-aligned workflows",
    ],
    complianceRequirements: ["HIPAA", "state Medicaid rules"],
  },
  submission: {
    requiredDocuments: [
      "Signed proposal",
      "Technical proposal",
      "Price sheet",
      "Options form",
      "EO policy",
      "Subcontractor form",
    ],
  },
  risks: {
    criticalRisks: [
      "Emergency delivery SLA",
      "24/7 staffing",
      "EHR integration timeline",
      "Billing compliance",
      "Regulatory exposure",
    ],
  },
  official: {
    solicitationIssued: "2026-04-13",
    proposalDueTime: "3:00 pm",
    timeZone: "Central Time",
    procurementContactSummary:
      "SAS Office of State Procurement — see RFP Section 1 for specialist contact (e.g. Kimberly Haywood).",
    sourceAttestation:
      "Schedule and due date match the official Request for Proposal Solicitation Document S000000479 (Department of Shared Administrative Services / Office of State Procurement for DHS). Verify against the current posting in ARBuy if an addendum is issued.",
    scheduleRows: [
      { activity: "Deadline for Prospective Contractor Questions", dateDisplay: "April 17, 2026" },
      { activity: "Answers to Questions Posted to ARBuy", dateDisplay: "April 24, 2026", tentative: true },
      { activity: "Proposal Due Date", dateDisplay: "May 4, 2026" },
      { activity: "Initial Proposal Evaluation", dateDisplay: "May 6, 2026", tentative: true },
      { activity: "Interviews", dateDisplay: "May 11 – 12, 2026", tentative: true },
      { activity: "Final Proposal Evaluation", dateDisplay: "May 12, 2026", tentative: true },
      { activity: "Discussions Kick Off Meeting", dateDisplay: "May 19, 2026", tentative: true },
      { activity: "Finalize Discussions", dateDisplay: "June 9, 2026", tentative: true },
      { activity: "Post Anticipation to Award", dateDisplay: "June 22, 2026", tentative: true },
      { activity: "Award Contract", dateDisplay: "July 1, 2026", tentative: true },
    ],
  },
};
