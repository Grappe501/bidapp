/** State Technical Proposal Packet — structured blueprint for drafting and assembly (S000000479). */
export type TechnicalProposalPacketModel = {
  solicitationNumber: string;
  title: string;
  /** Required components for the technical/proposal upload (core packet). */
  requiredSubmissionItems: string[];
  /** Pre-award / disclosure items tracked separately from core proposal upload. */
  preAwardItems: string[];
  /** If applicable — track but do not block core readiness when absent. */
  ifApplicableItems: string[];
  pageLimits: {
    experience: number;
    solution: number;
    risk: number;
  };
  draftingConstraints: {
    noExternalLinks: boolean;
    /** Experience: repeat Claim of Expertise + Documented Performance blocks. */
    claimDocumentedPerformancePattern: boolean;
    /** Risk: repeat Risk description + Solution + Documented Performance per risk thread. */
    riskSolutionDocumentedPerformancePattern: boolean;
  };
  forms: {
    signaturePage: boolean;
    subcontractorForm: boolean;
    recommendedOptionsForm: boolean;
    /** Minimum RFP / qualification certifications as specified in packet. */
    minimumRequirementsCertification: boolean;
  };
};

/** Runtime compliance vs packet + drafts (client-computed). */
export type TechnicalProposalPacketCompliance = {
  applicable: boolean;
  structuredModelLoaded: boolean;
  draftingConstraintsActive: boolean;
  coreChecklistComplete: boolean;
  pageLimitsCompliant: boolean;
  noExternalLinksInScoredVolumes: boolean;
  readyForPacketAssembly: boolean;
  issues: string[];
};
