/**
 * Normalized solicitation model — authoritative structure for grounding and validation.
 */

export interface RfpCore {
  solicitationNumber: string;
  title: string;
  agency: string;
  department: string;
  dueDate: string;
  submissionMethod: string;
  contractType: string;
  contractTerm: {
    baseYears: number;
    extensionYears: number;
  };
}

export interface RfpEvaluation {
  experienceWeight: number;
  solutionWeight: number;
  riskWeight: number;
  interviewWeight: number;
  totalScore: number;
}

export interface RfpRequirements {
  facilities: number;
  locations: string[];
  deliveryRequirements: string[];
  serviceRequirements: string[];
  techRequirements: string[];
  complianceRequirements: string[];
}

export interface RfpSubmissionRequirements {
  requiredDocuments: string[];
}

export interface RfpRiskAreas {
  criticalRisks: string[];
}

/** One row from Table A (tentative schedule) in the official solicitation PDF. */
export type RfpSolicitationScheduleRow = {
  activity: string;
  /** As stated in the RFP (may be a range). */
  dateDisplay: string;
  /** True when the RFP marks the date as anticipated / subject to change (*). */
  tentative?: boolean;
};

/** Dates and schedule transcribed from the issued RFP — not inferred. */
export type RfpOfficialMetadata = {
  solicitationIssued?: string;
  proposalDueTime?: string;
  timeZone?: string;
  /** Procurement contact line (non-sensitive). */
  procurementContactSummary?: string;
  scheduleRows: RfpSolicitationScheduleRow[];
  /** Provenance for auditors and grounding. */
  sourceAttestation: string;
};

/** Full structured RFP (solicitation-specific). */
export type StructuredRfp = {
  core: RfpCore;
  evaluation: RfpEvaluation;
  requirements: RfpRequirements;
  submission: RfpSubmissionRequirements;
  risks: RfpRiskAreas;
  /** When present, official solicitation dates / Table A (PDF-sourced). */
  official?: RfpOfficialMetadata;
};

/**
 * Stored on {@link GroundingBundlePayload.rfp} — narrative + structured fields for LLM + UI.
 */
export type GroundingBundleRfp = StructuredRfp & {
  requirementsSummary: string;
  serviceExpectations: string[];
  technicalExpectations: string[];
  riskAreas: string[];
  evaluationPriorities: string[];
  /** True when built from project metadata only (no registered canonical RFP). */
  stub?: boolean;
};

export type RfpDocumentSlug =
  | "signed_proposal"
  | "technical_proposal"
  | "price_sheet"
  | "options_form"
  | "eo_policy"
  | "subcontractor_form";

export type RfpDocumentCoverageResult = {
  missingDocuments: string[];
  parsedDocuments: string[];
  unstructuredDocuments: string[];
  /** Slug → matched file name (if any). */
  mapped: Partial<Record<RfpDocumentSlug, string>>;
};

export type RfpHealthStatus = {
  parsed: boolean;
  structured: boolean;
  requirementsExtracted: boolean;
  submissionDocsComplete: boolean;
  readyForDrafting: boolean;
};
