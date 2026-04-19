import type { StructuredRfp } from "../types/rfp-model";

export const S000000479_BID_NUMBER = "S000000479";

/** Authoritative structured RFP for Pharmacy Services for HDCs (ARBuy / DHS). */
export const CANONICAL_RFP_S000000479: StructuredRfp = {
  core: {
    solicitationNumber: "S000000479",
    title: "Pharmacy Services for HDCs",
    agency: "DHS",
    department: "Arkansas Department of Human Services",
    dueDate: "2026-06-12",
    submissionMethod: "ARBuy",
    contractType: "Professional Services (Pharmacy)",
    contractTerm: {
      baseYears: 3,
      extensionYears: 2,
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
};
