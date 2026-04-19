import type { TechnicalProposalPacketCompliance } from "./technical-proposal-packet";
import type { VendorPricingReality } from "./pricing-model";

export type {
  ArbuyAttachmentCategory,
  ArbuySolicitationAttachment,
  ArbuySolicitationCompliance,
  ArbuySolicitationHeader,
  ArbuySolicitationItem,
  ArbuySolicitationModel,
} from "./arbuy-solicitation";

export type ProjectStatus = "Active" | "In Review" | "Drafting" | "Finalizing";

export type FileCategory =
  | "Solicitation"
  | "Pricing"
  | "Vendor"
  | "Internal Strategy"
  | "Compliance"
  | "Draft Support"
  | "Architecture"
  | "Other";

export type FileProcessingStatus =
  | "Uploaded"
  | "Queued"
  | "Processed"
  | "Needs Review"
  | "Error";

export type FileSourceType =
  | "Client"
  | "Vendor"
  | "Internal"
  | "Public Agency"
  | "Generated";

export type Project = {
  id: string;
  title: string;
  bidNumber: string;
  issuingOrganization: string;
  dueDate: string;
  status: ProjectStatus;
  shortDescription: string;
};

export type FileRecord = {
  id: string;
  name: string;
  category: FileCategory;
  sourceType: FileSourceType;
  uploadedAt: string;
  fileType: string;
  status: FileProcessingStatus;
  tags: string[];
  noteCount: number;
  linkedItemCount: number;
  description?: string;
};

export const FILE_CATEGORIES: FileCategory[] = [
  "Solicitation",
  "Pricing",
  "Vendor",
  "Internal Strategy",
  "Compliance",
  "Draft Support",
  "Architecture",
  "Other",
];

export const FILE_PROCESSING_STATUSES: FileProcessingStatus[] = [
  "Uploaded",
  "Queued",
  "Processed",
  "Needs Review",
  "Error",
];

export const FILE_SOURCE_TYPES: FileSourceType[] = [
  "Client",
  "Vendor",
  "Internal",
  "Public Agency",
  "Generated",
];

/* ——— Requirements / compliance matrix ——— */

export type RequirementType =
  | "Administrative"
  | "Technical"
  | "Pricing"
  | "Compliance"
  | "Implementation"
  | "Attachment"
  | "Legal"
  | "Operational"
  | "Other";

export type RequirementStatus =
  | "Not Reviewed"
  | "Extracted"
  | "Approved"
  | "In Progress"
  | "Covered"
  | "Partial"
  | "Blocked"
  | "Unresolved";

export type RequirementRiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type RequirementResponseCategory =
  | "Narrative"
  | "Form"
  | "Pricing Sheet"
  | "Attachment"
  | "Certification"
  | "Internal Decision"
  | "Vendor Confirmation";

/** RFP operational tagging for matrix filtering and control-room views. */
export type RequirementTagType =
  | "Delivery"
  | "Billing"
  | "Integration"
  | "Security"
  | "Staffing"
  | "Compliance";

export type Requirement = {
  id: string;
  title: string;
  sourceFileId: string;
  sourceFileName: string;
  sourceSection: string;
  verbatimText: string;
  summary: string;
  requirementType: RequirementType;
  mandatory: boolean;
  responseCategory: RequirementResponseCategory;
  status: RequirementStatus;
  riskLevel: RequirementRiskLevel;
  owner: string;
  notes: string;
  /** Operational tags derived from solicitation (BP-005.5). */
  tags: RequirementTagType[];
  createdAt: string;
  updatedAt: string;
};

export type RequirementCandidate = {
  id: string;
  sourceFileId: string;
  proposedTitle: string;
  proposedSummary: string;
  proposedSourceSection: string;
  proposedVerbatimText: string;
  proposedRequirementType: RequirementType;
  proposedMandatory: boolean;
  proposedResponseCategory: RequirementResponseCategory;
};

export const REQUIREMENT_TYPES: RequirementType[] = [
  "Administrative",
  "Technical",
  "Pricing",
  "Compliance",
  "Implementation",
  "Attachment",
  "Legal",
  "Operational",
  "Other",
];

export const REQUIREMENT_STATUSES: RequirementStatus[] = [
  "Not Reviewed",
  "Extracted",
  "Approved",
  "In Progress",
  "Covered",
  "Partial",
  "Blocked",
  "Unresolved",
];

export const REQUIREMENT_RISK_LEVELS: RequirementRiskLevel[] = [
  "Low",
  "Moderate",
  "High",
  "Critical",
];

export const REQUIREMENT_RESPONSE_CATEGORIES: RequirementResponseCategory[] = [
  "Narrative",
  "Form",
  "Pricing Sheet",
  "Attachment",
  "Certification",
  "Internal Decision",
  "Vendor Confirmation",
];

export const REQUIREMENT_TAG_TYPES: RequirementTagType[] = [
  "Delivery",
  "Billing",
  "Integration",
  "Security",
  "Staffing",
  "Compliance",
];

/* ——— Evidence vault ——— */

export type EvidenceType =
  | "Verified Fact"
  | "Vendor Claim"
  | "Internal Assumption"
  | "Proposal Intent"
  | "Inferred Conclusion"
  | "Compliance Reference"
  | "Pricing Reference"
  | "Operational Reference"
  | "Other";

export type EvidenceSupportStrength = "Weak" | "Moderate" | "Strong";

export type EvidenceValidationStatus =
  | "Verified"
  | "Pending Validation"
  | "Unverified";

/** Aggregate support for matrix + requirement header (matrix uses None). */
export type RequirementSupportSummaryLevel =
  | "None"
  | "Weak"
  | "Moderate"
  | "Strong";

export type EvidenceItem = {
  id: string;
  title: string;
  sourceFileId: string;
  sourceFileName: string;
  sourceSection: string;
  excerpt: string;
  evidenceType: EvidenceType;
  validationStatus: EvidenceValidationStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type RequirementEvidenceLink = {
  id: string;
  requirementId: string;
  evidenceId: string;
  supportStrength: EvidenceSupportStrength;
  linkNote: string;
  createdAt: string;
  updatedAt: string;
};

export const EVIDENCE_TYPES: EvidenceType[] = [
  "Verified Fact",
  "Vendor Claim",
  "Internal Assumption",
  "Proposal Intent",
  "Inferred Conclusion",
  "Compliance Reference",
  "Pricing Reference",
  "Operational Reference",
  "Other",
];

export const EVIDENCE_SUPPORT_STRENGTHS: EvidenceSupportStrength[] = [
  "Weak",
  "Moderate",
  "Strong",
];

export const EVIDENCE_VALIDATION_STATUSES: EvidenceValidationStatus[] = [
  "Verified",
  "Pending Validation",
  "Unverified",
];

/* ——— Vendor intelligence ——— */

export type VendorCategory =
  | "Primary Platform"
  | "Workflow Automation"
  | "Communication Automation"
  | "Financial Optimization"
  | "Clinical Layer"
  | "Analytics Layer"
  | "Integration Layer"
  | "Other";

export type VendorStatus =
  | "Active Review"
  | "Shortlisted"
  | "Recommended"
  | "Hold"
  | "Rejected";

export type VendorFitScore = 1 | 2 | 3 | 4 | 5;

export type VendorRiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type VendorCapability = {
  id: string;
  statement: string;
};

export type VendorComparisonCriterion =
  | "category"
  | "fitScore"
  | "implementationSpeed"
  | "apiReadiness"
  | "ltcFit"
  | "pricingNotes"
  | "strengths"
  | "weaknesses"
  | "risks"
  | "likelyStackRole";

export type VendorDimensionRating = "High" | "Moderate" | "Low";

export type Vendor = {
  id: string;
  name: string;
  category: VendorCategory;
  status: VendorStatus;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  summary: string;
  fitScore: VendorFitScore;
  implementationSpeed: VendorDimensionRating;
  ltcFit: VendorDimensionRating;
  apiReadiness: VendorDimensionRating;
  pricingNotes: string;
  likelyStackRole: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  notes: string;
  capabilities: VendorCapability[];
  sourceFileIds: string[];
  /** Canonical public website for crawl / evidence (normalized https). */
  websiteUrl?: string;
  /** Registrable domain for display (no scheme). */
  vendorDomain?: string;
  websiteLastCrawledAt?: string | null;
  websiteCrawlStatus?: string;
  websiteCrawlError?: string;
  createdAt: string;
  updatedAt: string;
};

export const VENDOR_CATEGORIES: VendorCategory[] = [
  "Primary Platform",
  "Workflow Automation",
  "Communication Automation",
  "Financial Optimization",
  "Clinical Layer",
  "Analytics Layer",
  "Integration Layer",
  "Other",
];

export const VENDOR_STATUSES: VendorStatus[] = [
  "Active Review",
  "Shortlisted",
  "Recommended",
  "Hold",
  "Rejected",
];

export const VENDOR_FIT_SCORES: VendorFitScore[] = [1, 2, 3, 4, 5];

export const VENDOR_RISK_LEVELS: VendorRiskLevel[] = [
  "Low",
  "Moderate",
  "High",
  "Critical",
];

export const VENDOR_DIMENSION_RATINGS: VendorDimensionRating[] = [
  "High",
  "Moderate",
  "Low",
];

/* ——— Architecture workspace ——— */

export type ArchitectureOptionStatus =
  | "Draft"
  | "Under Review"
  | "Recommended"
  | "Archived";

export type ArchitectureComponentRole =
  | "Primary Platform"
  | "Supporting Layer"
  | "Intelligence Layer"
  | "Integration Layer"
  | "Optional Layer";

export type ArchitectureComponent = {
  id: string;
  vendorId: string;
  vendorName: string;
  role: ArchitectureComponentRole;
  responsibilitySummary: string;
  optional: boolean;
};

export type ArchitectureOption = {
  id: string;
  name: string;
  status: ArchitectureOptionStatus;
  summary: string;
  recommended: boolean;
  components: ArchitectureComponent[];
  narrativeStrengths: string[];
  implementationRisks: string[];
  malonePositionSummary: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export const ARCHITECTURE_OPTION_STATUSES: ArchitectureOptionStatus[] = [
  "Draft",
  "Under Review",
  "Recommended",
  "Archived",
];

export const ARCHITECTURE_COMPONENT_ROLES: ArchitectureComponentRole[] = [
  "Primary Platform",
  "Supporting Layer",
  "Intelligence Layer",
  "Integration Layer",
  "Optional Layer",
];

/* ——— Bid control & intelligence (BP-005.5) ——— */

export type SubmissionPhase = "Proposal" | "Discussion";

export type SubmissionItemStatus =
  | "Not Started"
  | "In Progress"
  | "Ready"
  | "Validated"
  | "Submitted";

export type SubmissionItem = {
  id: string;
  name: string;
  required: boolean;
  phase: SubmissionPhase;
  status: SubmissionItemStatus;
  owner: string;
  notes: string;
};

export type ScoringCategory = {
  id: string;
  name: string;
  /** Weight as share of total points (e.g. 0.21 for 210/1000). */
  weight: number;
  maxPoints: number;
  description: string;
};

export type SectionConstraint = {
  section: string;
  maxPages: number;
  rules: string;
};

export type DiscussionItem = {
  id: string;
  name: string;
  status: SubmissionItemStatus;
  notes: string;
};

export type ContractRiskSeverity = "Low" | "Moderate" | "High" | "Critical";

export type ContractRisk = {
  id: string;
  category: string;
  description: string;
  severity: ContractRiskSeverity;
};

export type ContractClause = {
  id: string;
  reference: string;
  title: string;
  obligationSummary: string;
  proposalExposure: string;
};

export type RedactionEntityType =
  | "File"
  | "Evidence"
  | "Requirement"
  | "Vendor"
  | "Other";

export type RedactionFlagStatus = "Open" | "Under Review" | "Cleared";

export type RedactionFlag = {
  id: string;
  entityType: RedactionEntityType;
  entityId: string;
  entityLabel: string;
  reason: string;
  status: RedactionFlagStatus;
};

export type CompanyProfileType = "Client" | "Vendor";

export type CompanyProfile = {
  id: string;
  name: string;
  type: CompanyProfileType;
  summary: string;
  capabilities: string[];
  risks: string[];
  sources: string[];
  /** Ingested proposal claims (session). */
  claims: string[];
  /** Ingested integration notes (session). */
  integrationDetails: string[];
};

export type IntelligenceClassification =
  | "capability"
  | "risk"
  | "claim"
  | "integration detail";

export type IntelligenceIngestEntry = {
  id: string;
  companyProfileId: string;
  classification: IntelligenceClassification;
  body: string;
  sourceUrl: string;
  createdAt: string;
};

export const SUBMISSION_ITEM_STATUSES: SubmissionItemStatus[] = [
  "Not Started",
  "In Progress",
  "Ready",
  "Validated",
  "Submitted",
];

export const SUBMISSION_PHASES: SubmissionPhase[] = ["Proposal", "Discussion"];

export const REDACTION_ENTITY_TYPES: RedactionEntityType[] = [
  "File",
  "Evidence",
  "Requirement",
  "Vendor",
  "Other",
];

export const REDACTION_FLAG_STATUSES: RedactionFlagStatus[] = [
  "Open",
  "Under Review",
  "Cleared",
];

export const INTELLIGENCE_CLASSIFICATIONS: IntelligenceClassification[] = [
  "capability",
  "risk",
  "claim",
  "integration detail",
];

/* ——— Retrieval & grounding (BP-005.7) ——— */

export type RetrievalQueryType =
  | "requirement_support"
  | "vendor_intelligence"
  | "architecture"
  | "draft_grounding";

export type GroundingBundleType =
  | "Experience"
  | "Solution"
  | "Risk"
  | "Interview"
  | "Executive Summary"
  | "vendor_recommendation"
  | "architecture_narrative"
  | "draft_grounding";

export type KnowledgeProvenanceKind =
  | "Verified Fact"
  | "Vendor Claim"
  | "Inferred Conclusion"
  | "Internal Assumption";

export type AiValidationStatus =
  | "Verified"
  | "Pending Validation"
  | "Unverified"
  | "Inferred";

export type GroundingRetrievedChunkRef = {
  chunkId: string;
  fileId: string;
  fileName: string;
  chunkIndex: number;
  text: string;
  score: number;
  sourceRef: string;
};

/** Proof-graph aggregate support for a requirement (BP-006 Day 6.5). */
export type RequirementProofSupportLevel =
  | "strong"
  | "partial"
  | "weak"
  | "none";

export type RequirementSupportValidationMix = {
  verified: number;
  vendor_claim: number;
  unverified: number;
};

export type RequirementSupportSummary = {
  level: RequirementProofSupportLevel;
  evidence_ids: string[];
  validation_mix: RequirementSupportValidationMix;
};

/** Parsed vendor answer — vendor-supplied assertions, not verified third-party proof. */
export type VendorInterviewNormalizedAnswer = {
  summary: string;
  commitments: string[];
  claims: string[];
  limitations: string[];
  dependenciesOnMalone: string[];
  integrationSignals: string[];
  pricingSignals: string[];
  riskSignals: string[];
  timelineSignals: string[];
  followUpQuestions: string[];
  confidence: "high" | "medium" | "low" | "unknown";
};

/** Structured interview evidence for grounding / OpenAI — derived from answers + assessments. */
export type GroundingBundleVendorInterviewIntelligence = {
  generatedAt: string;
  readinessSummary: {
    p1Total: number;
    p1Unanswered: number;
    p1NeedsFollowUp: number;
    unresolvedP1: number;
    avgScore: number | null;
    lowQualityCount: number;
  };
  topAnsweredQuestions: Array<{
    question: string;
    category: string;
    priority: string;
    summary: string;
    answerQuality0To5: number;
  }>;
  unresolvedP1Questions: string[];
  commitments: string[];
  strengths: string[];
  risks: string[];
  maloneDependencies: string[];
  integrationCommitments: string[];
  timelineCommitments: string[];
};

/** Evidence-backed support for a normalized vendor claim (trust layer). */
export type VendorClaimValidationRecord = {
  id: string;
  normalizedClaimKey: string;
  claimText: string;
  machineClaimText: string;
  claimTextLocked: boolean;
  claimCategory: string;
  claimSourceType: string;
  supportLevel: "none" | "weak" | "moderate" | "strong";
  effectiveSupportLevel: "none" | "weak" | "moderate" | "strong";
  /** Human override when set — machine support remains in supportLevel after refresh semantics. */
  supportLevelOverride?: string | null;
  contradictionStatus: "none" | "possible" | "clear";
  confidence: "high" | "medium" | "low";
  needsFollowUp: boolean;
  followUpReason: string | null;
  scoringImpact: "positive" | "neutral" | "negative" | "watch";
  rationale: string;
  machineRationale: string;
  humanNote: string;
  isCritical: boolean;
  evidenceSourceIds: string[];
  supportingFactIds: string[];
  contradictingFactIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type VendorClaimValidationSummary = {
  strongCount: number;
  weakOrNoneCount: number;
  contradictedCount: number;
  followUpRequiredCount: number;
  criticalWeakCount: number;
};

/** Failure mode simulator — operational stress scenarios for this bid (heuristic, not forecast). */
export type VendorFailureModeCategory =
  | "delivery"
  | "integration"
  | "implementation"
  | "staffing"
  | "compliance"
  | "security"
  | "billing"
  | "support"
  | "data"
  | "commercial"
  | "dependency"
  | "other";

export type VendorFailureModeRecord = {
  id: string;
  vendorId: string;
  projectId: string;
  category: VendorFailureModeCategory;
  scenarioKey: string;
  title: string;
  description: string;
  triggerConditions: string[];
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high" | "critical";
  recoverability: "easy" | "moderate" | "hard" | "uncertain";
  timeToRecoverEstimate?: string | null;
  vendorPreparedness: "strong" | "adequate" | "weak" | "unknown";
  evidenceStrength: "strong" | "moderate" | "weak" | "none";
  mitigationSignals: string[];
  unresolvedUnknowns: string[];
  scoringImpact: {
    solutionImpact: number;
    riskImpact: number;
    interviewImpact: number;
  };
  rationale: string;
  createdAt: string;
  updatedAt: string;
};

export type VendorFailureSimulationSummary = {
  vendorId: string;
  scenarioCount: number;
  criticalScenarioCount: number;
  highLikelihoodCount: number;
  lowPreparednessCount: number;
  overallResilience: "strong" | "acceptable" | "fragile" | "high_risk";
  topFailureModes: VendorFailureModeRecord[];
  topMitigations: string[];
  decisionWarnings: string[];
};

/** Role-level ownership vs Malone — stack design, not generic fit. */
export type VendorRoleOwnershipRecommendation =
  | "own"
  | "share"
  | "support"
  | "avoid"
  | "unknown";

export type VendorRoleFitRecord = {
  id: string;
  vendorId: string;
  projectId: string;
  roleKey: string;
  roleLabel: string;
  ownershipRecommendation: VendorRoleOwnershipRecommendation;
  confidence: "high" | "medium" | "low";
  fitLevel: "strong" | "adequate" | "weak" | "unknown";
  evidenceStrength: "strong" | "moderate" | "weak" | "none";
  maloneDependencyLevel: "low" | "medium" | "high";
  handoffComplexity: "low" | "medium" | "high";
  overlapRisk: "low" | "medium" | "high";
  gapRisk: "low" | "medium" | "high";
  rationale: string;
  requiredMaloneResponsibilities: string[];
  vendorStrengthSignals: string[];
  vendorWeaknessSignals: string[];
  unresolvedQuestions: string[];
  createdAt: string;
  updatedAt: string;
};

export type VendorRoleFitSummary = {
  vendorId: string;
  strongOwnRoles: string[];
  shareRoles: string[];
  supportRoles: string[];
  avoidRoles: string[];
  highestDependencyRoles: string[];
  highestHandoffRiskRoles: string[];
  roleStrategyAssessment:
    | "clear_fit"
    | "usable_with_malone_support"
    | "fragile"
    | "misaligned";
};

/** Vendor-scoped grounding slice (fit matrix, claims, facts, interview, integration). */
export type GroundingBundleVendorIntelligence = {
  vendorId: string;
  vendorName: string;
  fitDimensions: Array<{
    dimensionKey: string;
    score: number;
    confidence: string;
    rationale: string;
    sourceIds: string[];
  }>;
  vendorClaims: Array<{
    id: string;
    claimText: string;
    validationStatus: string;
    credibility: string;
    confidence: string;
    claimCategory: string;
    sourceId: string | null;
  }>;
  intelligenceFacts: Array<{
    id: string;
    factType: string;
    factText: string;
    credibility: string;
    confidence: string;
    sourceId: string;
  }>;
  interviewQuestions: Array<{
    id: string;
    question: string;
    category: string;
    priority: string;
    whyItMatters?: string;
    riskIfUnanswered?: string;
    answerStatus?: string;
  }>;
  integrationRequirements: Array<{
    requirementKey: string;
    status: string;
    evidence: string;
  }>;
  /** Normalized answers + assessment-derived signals for drafting (optional). */
  interviewIntelligence?: GroundingBundleVendorInterviewIntelligence;
  /** Claim validation engine: comparable keys, support/contradiction, evidence ids. */
  claimValidation?: {
    summary: VendorClaimValidationSummary;
    rows: VendorClaimValidationRecord[];
  };
  /** Failure mode simulation — stress scenarios and resilience summary. */
  failureSimulation?: {
    summary: VendorFailureSimulationSummary;
    modes: VendorFailureModeRecord[];
  };
  /** Role ownership vs Malone — operating model clarity. */
  roleFit?: {
    summary: VendorRoleFitSummary;
    roles: VendorRoleFitRecord[];
  };
  /** Pricing believability vs scope and Malone workload (project workbook + vendor signals). */
  pricingReality?: VendorPricingReality;
};

export type VendorInterviewReadinessSummary = {
  p1Total: number;
  p1Unanswered: number;
  p1NeedsFollowUp: number;
  unresolvedP1: number;
  avgScore: number | null;
  lowQualityCount: number;
};

/** Mirrors DB interview question row for API/UI payloads. */
export type VendorInterviewQuestionPayload = {
  id: string;
  vendorId: string;
  question: string;
  category: string;
  priority: string;
  linkedGapId: string | null;
  whyItMatters: string;
  riskIfUnanswered: string;
  linkedRequirementKeys: string[];
  linkedFitDimensionKeys: string[];
  linkedGapKeys: string[];
  answerStatus: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type VendorInterviewAnswerPayload = {
  id: string;
  vendorId: string;
  questionId: string;
  answerText: string;
  answerSource: string;
  answeredBy: string;
  answeredAt: string | null;
  interviewer: string;
  normalizedSummary: string;
  normalizedJson: Record<string, unknown>;
  confidence: string;
  validationStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type VendorInterviewAssessmentPayload = {
  id: string;
  vendorId: string;
  questionId: string;
  answerId: string | null;
  category: string;
  score0To5: number;
  rationale: string;
  followUpRequired: boolean;
  riskFlag: boolean;
  pricingFlag: boolean;
  integrationFlag: boolean;
  executionFlag: boolean;
  sourceFactIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type VendorInterviewWorkspaceRow = {
  question: VendorInterviewQuestionPayload;
  answer: VendorInterviewAnswerPayload | null;
  assessment: VendorInterviewAssessmentPayload | null;
};

export type VendorInterviewWorkspacePayload = {
  vendorId: string;
  vendorName: string;
  summary: VendorInterviewReadinessSummary;
  rows: VendorInterviewWorkspaceRow[];
};

/** Keys for narrative alignment checks across outward-facing surfaces. */
export type NarrativeSectionKey =
  | "executive_summary"
  | "solution"
  | "risk"
  | "interview"
  | "client_review"
  | "final_bundle"
  | "architecture_narrative"
  | "pricing_summary";

/** Canonical strategic story for the current bid decision — keeps volumes aligned without flattening tone. */
export type StrategicNarrativeSpine = {
  projectId: string;
  recommendedVendorId?: string;
  recommendedVendorStackIds?: string[];

  corePosition: string;
  whyThisWins: string[];
  strongestSupportedClaims: string[];
  claimsToAvoidOrQualify: string[];

  roleOwnershipStory: string[];
  pricingStory: string[];
  riskStory: string[];
  mitigationStory: string[];
  interviewStory: string[];

  mustAppearThemes: string[];
  mustNotContradictThemes: string[];
  sensitiveThemes: string[];

  evidenceConfidence: "high" | "medium" | "low";
  generatedFromDecisionSynthesisAt: string;
};

export type NarrativeMisalignment = {
  sectionKey: NarrativeSectionKey;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "contradiction"
    | "omission"
    | "overstatement"
    | "understatement"
    | "role_conflict"
    | "pricing_conflict"
    | "risk_conflict"
    | "vendor_conflict";
  message: string;
  expectedTheme: string;
  observedTheme?: string;
  correctionGuidance: string;
};

export type NarrativeAlignmentResult = {
  overallAlignment: "strong" | "acceptable" | "drifting" | "misaligned";
  sectionScores: Record<string, number>;
  criticalMisalignments: NarrativeMisalignment[];
  warnings: NarrativeMisalignment[];
  correctiveActions: string[];
};

/** Bid Intelligence Agent — structured, evidence-backed answers (server + UI). */
export type BidAgentAnswerType =
  | "requirements"
  | "readiness"
  | "vendor_analysis"
  | "pricing"
  | "risk"
  | "strategy"
  | "drafting"
  | "submission"
  | "comparison"
  | "decision"
  | "mixed";

export type BidAgentEvidenceSourceType =
  | "rfp"
  | "technical_packet"
  | "contract"
  | "pricing"
  | "vendor"
  | "interview"
  | "simulation"
  | "decision"
  | "draft"
  | "workspace";

export type BidAgentSuggestedActionType =
  | "navigate"
  | "rebuild_bundle"
  | "run_vendor_research"
  | "review_section"
  | "open_submission"
  | "open_vendor"
  | "open_compare"
  | "none";

export type BidAgentAnswer = {
  answerType: BidAgentAnswerType;
  headline: string;
  shortAnswer: string;
  sections: Array<{ title: string; content: string }>;
  confidence: "high" | "medium" | "low";
  evidence: Array<{
    label: string;
    sourceType: BidAgentEvidenceSourceType;
    ref?: string;
    pageRoute?: string;
  }>;
  suggestedActions: Array<{
    label: string;
    actionType: BidAgentSuggestedActionType;
    target?: string;
  }>;
  caveats: string[];
};

/** Bounded workflows Agent Malone may trigger (server-enforced). */
export type AgentMaloneActionType =
  | "open_page"
  | "build_grounding_bundle"
  | "generate_draft"
  | "run_vendor_research"
  | "compute_vendor_fit"
  | "compute_vendor_score"
  | "generate_vendor_interview"
  | "run_claim_validation"
  | "run_failure_simulation"
  | "run_role_fit"
  | "run_pricing_reality"
  | "run_competitor_simulation"
  | "run_decision_synthesis"
  | "run_narrative_alignment"
  | "refresh_final_readiness"
  | "copy_export"
  | "run_strategy_refresh_recipe"
  | "run_vendor_interview_prep_recipe";

export type AgentMaloneActionRequest = {
  actionType: AgentMaloneActionType;
  projectId: string;
  vendorId?: string;
  architectureOptionId?: string | null;
  sectionId?: string;
  bundleType?: string;
  targetEntityId?: string | null;
  additionalParams?: Record<string, unknown>;
};

export type AgentMaloneActionResult = {
  actionType: string;
  status: "success" | "failed" | "partial" | "blocked";
  headline: string;
  summary: string;
  details?: string[];
  affectedEntityIds?: string[];
  nextActions?: Array<{
    label: string;
    actionType: string;
    target?: string;
  }>;
  errorMessage?: string;
};

export type AgentMaloneSuggestedAction = {
  label: string;
  actionType: string;
  target?: string;
  payload?: AgentMaloneActionRequest;
};

/** Agent Malone — structured answer plus optional executed workflow result. */
export type AgentMaloneAnswer = Omit<BidAgentAnswer, "suggestedActions"> & {
  suggestedActions: AgentMaloneSuggestedAction[];
  executedAction?: AgentMaloneActionResult;
};

export type GroundingBundlePayload = {
  bundleType: GroundingBundleType;
  title: string;
  retrievedChunks: GroundingRetrievedChunkRef[];
  requirements: {
    id: string;
    title: string;
    summary: string;
    riskLevel?: string;
    status?: string;
  }[];
  evidence: {
    id: string;
    title: string;
    excerpt: string;
    validationStatus: string;
    evidenceType?: string;
  }[];
  architectureOptions: { id: string; name: string; summary: string }[];
  vendorFacts: {
    vendorName?: string;
    factText: string;
    validationStatus: string;
    provenanceKind: KnowledgeProvenanceKind;
    sourceId?: string;
    /** operational | marketing | inferred — from ingest intelligence (optional for legacy bundles). */
    credibility?: string;
    /** high | medium | low — optional for legacy bundles. */
    confidence?: string;
  }[];
  /** Human-readable summary of how vendor facts were filtered for this bundle. */
  factSelectionSummary?: string;
  /** Structured selection stats (tier 1 / fallback / unknown). */
  factSelectionDetail?: {
    includedStrongCount: number;
    includedFallbackCount: number;
    includedUnknownCount: number;
    droppedWeakCount: number;
    droppedUnknownCount?: number;
    bundleQuality: "strong" | "moderate" | "weak";
    bundleQualityNote?: string;
  };
  /** Duplicated from factSelectionDetail for older readers / quick display. */
  bundleQualityNote?: string;
  /** Counts of facts withheld by grounding quality rules (if computed). */
  droppedFactCounts?: {
    excludedMarketingLow: number;
    excludedInferredLow: number;
    excludedUnknown: number;
    excludedMarketingMedium: number;
    excludedOperationalLow: number;
    excludedInferredMedium: number;
    excludedOther: number;
  };
  /** Number of lower-trust facts still included (sparse evidence). */
  weakFactIncludedCount?: number;
  gaps: string[];
  validationNotes: string[];
  assembledAt: string;
  /** Per-requirement proof support (from requirement_evidence_proof / sync). */
  requirementSupport?: Record<string, RequirementSupportSummary>;
  /**
   * Structured RFP grounding for this solicitation — required for drafting alignment.
   * Populated when the grounding bundle is built server-side.
   */
  rfp?: import("./rfp-model").GroundingBundleRfp;
  /** SRV-1 / state contract structure — required with RFP for full drafting alignment. */
  contract?: import("./contract-model").GroundingBundleContract;
  /** Structured price sheet model + RFP service coverage + contract checks (when built server-side). */
  pricing?: import("./pricing-model").GroundingBundlePricing;
  /** Official ARBuy solicitation header, required attachments, and quote lines (when registered for bid). */
  arbuy?: import("./arbuy-solicitation").ArbuySolicitationModel;
  /** When target_entity_id is a vendor, populated from DB for Solution/Risk/Interview/vendor_recommendation bundles. */
  vendorIntelligence?: GroundingBundleVendorIntelligence;
  /** Comparative recommendation / point-loss narrative for selected vendor posture (optional). */
  competitorComparisonContext?: GroundingBundleCompetitorContext;
  /** Automatic adaptation to recommended architecture + resolved vendor (Solution/Risk/Interview, etc.). */
  proposalAdaptation?: GroundingBundleProposalAdaptation;
  /** Canonical strategic spine — align all volumes to this story (tone may differ by section). */
  strategicNarrativeSpine?: StrategicNarrativeSpine;
};

export type GroundedProseReviewClarity = "strong" | "moderate" | "weak";

export type GroundedProseReviewResult = {
  clarity: GroundedProseReviewClarity;
  technical_density: "high" | "moderate" | "low";
  metrics_presence: GroundedProseReviewClarity;
  requirement_findings: Array<{
    requirement_id: string;
    status: "fully_addressed" | "partially_addressed" | "not_addressed";
    support_level: RequirementProofSupportLevel;
    notes: string;
  }>;
  unsupported_claims: Array<{
    text: string;
    reason: string;
    suggested_fix: string;
  }>;
  contradictions: Array<{
    text: string;
    conflicts_with: string;
    source_type: string;
    explanation: string;
  }>;
  improvement_actions: string[];
  confidence: "high" | "medium" | "low";
};

export const RETRIEVAL_QUERY_TYPES: RetrievalQueryType[] = [
  "requirement_support",
  "vendor_intelligence",
  "architecture",
  "draft_grounding",
];

export const GROUNDING_BUNDLE_TYPES: GroundingBundleType[] = [
  "Experience",
  "Solution",
  "Risk",
  "Interview",
  "Executive Summary",
  "vendor_recommendation",
  "architecture_narrative",
  "draft_grounding",
];

/* ——— Drafting studio (BP-006) ——— */

export type DraftSectionType =
  | "Experience"
  | "Solution"
  | "Risk"
  | "Interview"
  | "Executive Summary"
  | "Architecture Narrative";

export type DraftStatus =
  | "Not Started"
  | "Drafting"
  | "Needs Review"
  | "Approved"
  | "Locked";

export type DraftMetadata = {
  wordCount: number;
  estimatedPages: number;
  requirementCoverageIds: string[];
  missingRequirementIds: string[];
  riskFlags: string[];
  unsupportedClaimFlags: string[];
  /** Last structured generation mode label for this version (client-set). */
  generationMode?: string;
  /** Latest grounded prose review (optional; from review-draft-prose). */
  groundedProseReview?: GroundedProseReviewResult | null;
};

export type DraftSection = {
  id: string;
  projectId: string;
  sectionType: DraftSectionType;
  title: string;
  status: DraftStatus;
  activeVersionId: string | null;
  /** When loaded from DB: last selected grounding bundle for this section. */
  selectedGroundingBundleId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DraftVersion = {
  id: string;
  sectionId: string;
  content: string;
  groundingBundleId: string | null;
  metadata: DraftMetadata;
  createdAt: string;
  /** Server updated time when persisted (local-only versions omit this). */
  updatedAt?: string;
  /** Optional short label for revision history (user-editable). */
  note?: string;
  /**
   * Protected revision: in-place overwrite is blocked; duplicate or switch active to edit elsewhere.
   */
  locked?: boolean;
};

export const DRAFT_STATUSES: DraftStatus[] = [
  "Not Started",
  "Drafting",
  "Needs Review",
  "Approved",
  "Locked",
];

export const DRAFT_SECTION_TYPES: DraftSectionType[] = [
  "Experience",
  "Solution",
  "Risk",
  "Interview",
  "Executive Summary",
  "Architecture Narrative",
];

/* ——— Review & readiness (BP-007) ——— */

export type ReviewIssueType =
  | "Missing Requirement Coverage"
  | "Weak Evidence Support"
  | "Weak Requirement Proof"
  | "Requirement Not Addressed in Section"
  | "Unsupported Claim"
  | "Draft Contradiction"
  | "Low Confidence Draft"
  | "Over-Reliance on Vendor Claims"
  | "Missing Mitigation Proof"
  | "Technical Density Risk"
  | "Weak Metrics Presence"
  | "Weak Differentiation Support"
  | "Submission Gap"
  | "Page Limit Risk"
  | "Scoring Weakness"
  | "Contract Exposure"
  | "Discussion Readiness Gap"
  | "Redaction Risk"
  | "Vendor Validation Gap"
  | "Architecture Risk"
  | "Other";

/** Optional traceability for grounded rule output (BP-007 upgrade). */
export type ReviewIssueGroundedContext = {
  requirementId?: string;
  requirementTitle?: string;
  proofLevel?: RequirementProofSupportLevel;
  evidenceSummary?: string;
  proseReviewNote?: string;
  claimExcerpt?: string;
  conflictsWith?: string;
  sourceType?: string;
};

export type ReviewSeverity = "Low" | "Moderate" | "High" | "Critical";

export type ReviewIssueStatus =
  | "Open"
  | "In Review"
  | "Resolved"
  | "Dismissed";

export type ReviewEntityType =
  | "requirement"
  | "evidence"
  | "submission_item"
  | "draft_section"
  | "vendor"
  | "architecture_option"
  | "discussion_item"
  | "contract_risk"
  | "redaction_flag"
  | "project";

export type ReviewIssue = {
  id: string;
  projectId: string;
  issueType: ReviewIssueType;
  severity: ReviewSeverity;
  title: string;
  description: string;
  entityType: ReviewEntityType;
  entityId: string;
  status: ReviewIssueStatus;
  suggestedFix: string;
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
  groundedContext?: ReviewIssueGroundedContext;
};

export type ReadinessScore = {
  overall: number;
  submission: number;
  coverage: number;
  grounding: number;
  scoring_alignment: number;
  contract_readiness: number;
  discussion_readiness: number;
};

/** Arkansas-style technical + cost scoring mirror (700 technical + 300 cost = 1,000). */
export type EvaluatorSectionKey =
  | "Experience"
  | "Solution"
  | "Risk"
  | "Interview"
  | "Cost";

export type EvaluatorConfidence = "high" | "medium" | "low";

export type EvaluatorSectionScore = {
  section: EvaluatorSectionKey;
  /** 0–10 interpretive scale (maps to RFP-style reliability bands, not a prediction). */
  rawScore: number;
  weightedScore: number;
  confidence: EvaluatorConfidence;
  rationale: string[];
  pointLossDrivers: string[];
  upgradeActions: string[];
};

export type EvaluatorSimulationResult = {
  technical: {
    experience: EvaluatorSectionScore;
    solution: EvaluatorSectionScore;
    risk: EvaluatorSectionScore;
    interview: EvaluatorSectionScore;
    totalTechnicalScore: number;
  };
  cost: EvaluatorSectionScore;
  grandTotalScore: number;
  overallAssessment: "strong" | "competitive" | "fragile" | "not_ready";
  topPointLossDrivers: string[];
  topUpgradeActions: string[];
};

/** Comparative bid decision support — interpretive scores for THIS solicitation. */
export type HeatmapCellStatus = "met" | "partial" | "gap" | "unknown";

export type CompetitorHeatmapMatrix = {
  rows: Array<{
    id: string;
    label: string;
    cells: Record<string, HeatmapCellStatus>;
  }>;
};

export type CompetitorComparisonEntry = {
  vendorId: string;
  vendorName: string;
  /** Interview capture summary for this vendor (structured evidence phase). */
  interviewReadiness?: {
    unresolvedP1: number;
    avgAnswerQuality: number | null;
    lowQualityCount: number;
  };
  /** 0–100 composite; not a guarantee of evaluation outcome. */
  overallScore: number;
  confidence: EvaluatorConfidence;
  technicalFitScore: number;
  integrationScore: number;
  deliveryScore: number;
  riskScore: number;
  complianceScore: number;
  commercialScore?: number;
  /**
   * Approximate directional impact on technical volumes (± rough points on 0–100 interpretive scale).
   * Not precise prediction — use for comparison only.
   */
  evaluatorBidScoreImpact: {
    experienceImpact: number;
    solutionImpact: number;
    riskImpact: number;
    interviewImpact: number;
  };
  topAdvantages: string[];
  topDisadvantages: string[];
  criticalGaps: string[];
  integrationBurdens: string[];
  mustAskQuestions: string[];
  heatmap: Record<string, HeatmapCellStatus>;
  /** From vendor_claim_validations — sharpens comparative narrative. */
  claimValidationSummary?: VendorClaimValidationSummary;
  /** From failure mode simulation — resilience vs operational stress (heuristic). */
  failureResilienceSummary?: VendorFailureSimulationSummary;
  /** From vendor role-fit engine — ownership, Malone dependency, handoff risks. */
  roleFitSummary?: VendorRoleFitSummary;
  /** From pricing reality engine — workbook vs role / risk alignment. */
  pricingReality?: VendorPricingReality;
};

export type CompetitorRecommendationConfidence =
  | "high"
  | "medium"
  | "low"
  | "provisional";

export type ProjectInterviewReadiness = {
  vendors: Array<{
    vendorId: string;
    vendorName: string;
    p1Total: number;
    p1Unanswered: number;
    p1NeedsFollowUp: number;
    unresolvedP1: number;
    avgScore: number | null;
    lowQualityCount: number;
  }>;
};

export type CompetitorAwareSimulationResult = {
  projectId: string;
  architectureOptionId?: string;
  comparedVendorIds: string[];
  entries: CompetitorComparisonEntry[];
  heatmapMatrix: CompetitorHeatmapMatrix;
  recommendedVendorId?: string;
  recommendedRationale: string[];
  recommendationConfidence: CompetitorRecommendationConfidence;
  decisionRisks: string[];
  pointLossComparisons: string[];
  scenarioNotes: string[];
  competitorInterviewQuestions: string[];
  generatedAt: string;
  honestyNote: string;
  /** Per-vendor P1 / quality rollup for readiness and comparative narrative. */
  projectInterviewReadiness?: ProjectInterviewReadiness;
};

/** Full decision synthesis — consolidates competitor sim, claims, failure, role-fit, pricing, interview. */
export type VendorDecisionSynthesis = {
  projectId: string;

  recommendedVendorId?: string;
  recommendedVendorStackIds?: string[];

  recommendationType:
    | "single_vendor"
    | "multi_vendor_stack"
    | "provisional"
    | "undetermined";

  confidence: "high" | "medium" | "low" | "provisional";

  overallScore?: number;

  keyStrengths: string[];
  keyWeaknesses: string[];

  criticalRisks: string[];
  mitigationPosture: "strong" | "adequate" | "weak" | "uncertain";

  pricingAssessment: "stable" | "competitive" | "risky" | "uncertain";

  roleFitAssessment: "clear" | "acceptable" | "fragile" | "misaligned";

  failureResilience: "strong" | "moderate" | "fragile" | "high_risk";

  maloneDependency: "low" | "medium" | "high";

  claimConfidence: "high" | "mixed" | "low";

  interviewReadiness: "complete" | "partial" | "weak";

  decisionRationale: string;

  whatWouldChangeDecision: string[];
  decisionWarnings: string[];

  evaluatorDefenseSummary: string;

  createdAt: string;
  updatedAt: string;
};

/** Auto-selected proposal posture: architecture + effective vendor + drafting directive. */
export type GroundingBundleProposalAdaptation = {
  generatedAt: string;
  architectureOptionId?: string;
  architectureOptionName: string;
  effectiveVendorId: string;
  effectiveVendorName: string;
  source:
    | "target_override"
    | "competitor_recommendation"
    | "architecture_stack"
    | "none";
  /** Section-specific guidance for Solution / Risk / Interview / etc. */
  strategicDirective: string;
};

/** Trimmed slice for OpenAI grounding — never replaces vendorIntelligence rows. */
export type GroundingBundleCompetitorContext = {
  generatedAt: string;
  bidNumber?: string;
  selectedVendorId?: string;
  recommendationConfidence: CompetitorRecommendationConfidence;
  recommendedVendorId?: string;
  recommendedRationale: string[];
  decisionRisks: string[];
  pointLossComparisons: string[];
  scenarioNotes: string[];
  competitorInterviewQuestions: string[];
  entriesSummary: Array<{
    vendorId: string;
    vendorName: string;
    overallScore: number;
    confidence: string;
    evaluatorBidScoreImpact: CompetitorComparisonEntry["evaluatorBidScoreImpact"];
  }>;
  honestyNote: string;
  /** Unified recommendation narrative when competitor sim is available. */
  decisionSynthesis?: VendorDecisionSynthesis;
};

export type FinalReadinessOverallState =
  | "ready_to_submit"
  | "ready_with_risk"
  | "not_ready"
  | "blocked";

/** Hard submission gate — distinct from composite readiness scores. */
export type FinalReadinessGate = {
  overallState: FinalReadinessOverallState;
  requiredArtifactsComplete: boolean;
  pricingReady: boolean;
  contractReady: boolean;
  groundedReviewReady: boolean;
  unsupportedClaimsResolved: boolean;
  criticalRisksAddressed: boolean;
  evaluatorScoreViable: boolean;
  redactionReady: boolean;
  blockerCount: number;
  blockers: string[];
  warnings: string[];
  requiredActionsBeforeSubmit: string[];
  submissionRecommendation: string;
  /** S000000479 Technical Proposal Packet compliance (null for other bids). */
  technicalProposalPacket: TechnicalProposalPacketCompliance | null;
  /** ARBuy solicitation completeness (null when no canonical ARBuy profile for bid). */
  arbuySolicitation: import("./arbuy-solicitation").ArbuySolicitationCompliance | null;
  /** Vendor/stack decision quality (from competitor simulation). */
  vendorStrategyViable: boolean;
  vendorDecisionBlockers: string[];
  vendorDecisionWarnings: string[];
  /** Cross-section narrative coherence vs strategic spine (null when not computed). */
  narrativeAlignment?: NarrativeAlignmentResult | null;
};

export const REVIEW_ISSUE_TYPES: ReviewIssueType[] = [
  "Missing Requirement Coverage",
  "Weak Evidence Support",
  "Weak Requirement Proof",
  "Requirement Not Addressed in Section",
  "Unsupported Claim",
  "Draft Contradiction",
  "Low Confidence Draft",
  "Over-Reliance on Vendor Claims",
  "Missing Mitigation Proof",
  "Technical Density Risk",
  "Weak Metrics Presence",
  "Weak Differentiation Support",
  "Submission Gap",
  "Page Limit Risk",
  "Scoring Weakness",
  "Contract Exposure",
  "Discussion Readiness Gap",
  "Redaction Risk",
  "Vendor Validation Gap",
  "Architecture Risk",
  "Other",
];

export const REVIEW_SEVERITIES: ReviewSeverity[] = [
  "Low",
  "Moderate",
  "High",
  "Critical",
];

export const REVIEW_ISSUE_STATUSES: ReviewIssueStatus[] = [
  "Open",
  "In Review",
  "Resolved",
  "Dismissed",
];

/* ——— Output & packaging (BP-008) ——— */

export type OutputArtifactType =
  | "Draft Section"
  | "Submission Form"
  | "Price Sheet Support"
  | "Requirement Matrix"
  | "Review Report"
  | "Client Review Memo"
  | "Redacted Copy"
  | "Final Bundle"
  | "Discussion Prep"
  | "Other";

export type OutputStatus =
  | "Draft"
  | "In Progress"
  | "Ready"
  | "Validated"
  | "Locked";

export type OutputArtifactSourceEntityType =
  | "draft_section"
  | "submission_item"
  | "project"
  | "requirement"
  | "redaction_flag"
  | "discussion_item"
  | "review"
  | "other";

export type OutputArtifact = {
  id: string;
  projectId: string;
  artifactType: OutputArtifactType;
  title: string;
  status: OutputStatus;
  sourceEntityType: OutputArtifactSourceEntityType;
  sourceEntityId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  /** True when status is Ready, Validated, or Locked */
  isValidated: boolean;
  requiredForSubmission: boolean;
};

export type OutputBundleType =
  | "Submission Package"
  | "Client Review Packet"
  | "Redacted Packet"
  | "Final Readiness Bundle"
  | "Discussion Packet";

export type OutputBundle = {
  id: string;
  projectId: string;
  bundleType: OutputBundleType;
  title: string;
  status: OutputStatus;
  artifactIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PackagingCompleteness = {
  bundleType: OutputBundleType;
  complete: boolean;
  percent: number;
  missingRequiredTitles: string[];
  notValidatedTitles: string[];
  readyForAssemblyTitles: string[];
};

export type RedactionPacketSupportState = "ready" | "attention_needed" | "blocked";

export type RedactionPackagingSummary = {
  totalFlagged: number;
  unresolvedCount: number;
  clearedCount: number;
  /** Redaction items with no disposition yet (status Open). */
  awaitingDecisionCount: number;
  /** Items in legal / business review (status Under Review). */
  inReviewCount: number;
  redactedPacketNeeded: boolean;
  redactedCopyArtifactReady: boolean;
  /** Whether redacted packet support can proceed: flags cleared and copy posture OK. */
  redactedPacketSupport: RedactionPacketSupportState;
  blockers: string[];
};

export const OUTPUT_ARTIFACT_TYPES: OutputArtifactType[] = [
  "Draft Section",
  "Submission Form",
  "Price Sheet Support",
  "Requirement Matrix",
  "Review Report",
  "Client Review Memo",
  "Redacted Copy",
  "Final Bundle",
  "Discussion Prep",
  "Other",
];

export const OUTPUT_STATUSES: OutputStatus[] = [
  "Draft",
  "In Progress",
  "Ready",
  "Validated",
  "Locked",
];

export const OUTPUT_BUNDLE_TYPES: OutputBundleType[] = [
  "Submission Package",
  "Client Review Packet",
  "Redacted Packet",
  "Final Readiness Bundle",
  "Discussion Packet",
];

/* ——— Submission workflow & execution (BP-009) ——— */

export type SubmissionWorkflowStatus =
  | "Not Started"
  | "In Progress"
  | "Ready"
  | "Blocked"
  | "Completed";

export type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "Blocked";

export type SubmissionTaskRelatedEntityType =
  | "submission_item"
  | "draft_section"
  | "review_issue"
  | "redaction_flag"
  | "workflow_step"
  | "other";

export type SubmissionAuditActionType =
  | "Workflow step updated"
  | "Task updated"
  | "Final gate evaluated"
  | "Draft approved"
  | "Submission item validated"
  | "Redaction flag resolved"
  | "Submission marked complete"
  | "Other";

export type SubmissionWorkflowStep = {
  id: string;
  projectId: string;
  stepName: string;
  description: string;
  orderIndex: number;
  status: SubmissionWorkflowStatus;
  required: boolean;
  assignedTo: string;
  completedAt: string | null;
  notes: string;
};

export type SubmissionTask = {
  id: string;
  projectId: string;
  taskName: string;
  relatedEntityType: SubmissionTaskRelatedEntityType;
  relatedEntityId: string;
  assignedTo: string;
  status: TaskStatus;
  dueAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionAuditLog = {
  id: string;
  projectId: string;
  actionType: SubmissionAuditActionType;
  actor: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
};

export type SubmissionExecutionLog = {
  projectId: string;
  finalStatus: "Not submitted" | "Submitted";
  submittedAt: string | null;
  executedBy: string;
  confirmationNotes: string;
};

export const SUBMISSION_WORKFLOW_STATUSES: SubmissionWorkflowStatus[] = [
  "Not Started",
  "In Progress",
  "Ready",
  "Blocked",
  "Completed",
];

export const SUBMISSION_TASK_STATUSES: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "Completed",
  "Blocked",
];

/* ——— Competitive strategy & win themes (BP-010) ——— */

export type CompetitorType =
  | "Incumbent Pharmacy"
  | "Regional LTC Pharmacy"
  | "National LTC Pharmacy"
  | "Technology-Forward Pharmacy"
  | "PBM / Managed Services"
  | "Unknown / Emerging"
  | "Other";

export type CompetitorLikelyStatus =
  | "Monitoring"
  | "Likely Bidder"
  | "Strong Threat"
  | "Secondary Threat"
  | "Unclear";

export type ThreatLevel = "Low" | "Moderate" | "High" | "Critical";

export type EvidenceCharacter = "Sourced" | "Inferred" | "Judgment";

export type CompetitorProfile = {
  id: string;
  projectId: string;
  name: string;
  competitorType: CompetitorType;
  likelyStatus: CompetitorLikelyStatus;
  incumbent: boolean;
  summary: string;
  likelyStrengths: string[];
  likelyWeaknesses: string[];
  likelyPositioning: string;
  threatLevel: ThreatLevel;
  evidenceCharacter: EvidenceCharacter;
  evidenceBasis: string;
  threatInterpretation: string;
  counterPositioningNotes: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type WinThemeStatus = "Draft" | "Active" | "Approved" | "Retired";

export type WinTheme = {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  supportingPoints: string[];
  targetSections: string[];
  priority: number;
  status: WinThemeStatus;
  createdAt: string;
  updatedAt: string;
};

export type DifferentiatorStrength = "Strong" | "Moderate" | "Emerging";

export type Differentiator = {
  id: string;
  projectId: string;
  title: string;
  category: string;
  ourPosition: string;
  competitorGap: string;
  proofBasis: string;
  strength: DifferentiatorStrength;
  evidenceCharacter: EvidenceCharacter;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type EvaluatorLens = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  likelyConcerns: string[];
  likelyValueSignals: string[];
  strategicResponse: string;
  createdAt: string;
  updatedAt: string;
};

export type StrategyCompetitorFilters = {
  threatLevel: ThreatLevel | "all";
  likelyStatus: CompetitorLikelyStatus | "all";
  incumbent: "all" | "yes" | "no";
  search: string;
};

export const COMPETITOR_TYPES: CompetitorType[] = [
  "Incumbent Pharmacy",
  "Regional LTC Pharmacy",
  "National LTC Pharmacy",
  "Technology-Forward Pharmacy",
  "PBM / Managed Services",
  "Unknown / Emerging",
  "Other",
];

export const COMPETITOR_LIKELY_STATUSES: CompetitorLikelyStatus[] = [
  "Monitoring",
  "Likely Bidder",
  "Strong Threat",
  "Secondary Threat",
  "Unclear",
];

export const THREAT_LEVELS: ThreatLevel[] = [
  "Low",
  "Moderate",
  "High",
  "Critical",
];

export const WIN_THEME_STATUSES: WinThemeStatus[] = [
  "Draft",
  "Active",
  "Approved",
  "Retired",
];

export const DIFFERENTIATOR_STRENGTHS: DifferentiatorStrength[] = [
  "Strong",
  "Moderate",
  "Emerging",
];

export const EVIDENCE_CHARACTERS: EvidenceCharacter[] = [
  "Sourced",
  "Inferred",
  "Judgment",
];

export type {
  ContractReadiness,
  ContractStructure,
  GroundingBundleContract,
  StructuredPricingValidation,
} from "./contract-model";

export type {
  GroundingBundleRfp,
  RfpCore,
  RfpDocumentCoverageResult,
  RfpDocumentSlug,
  RfpEvaluation,
  RfpHealthStatus,
  RfpRequirements,
  RfpRiskAreas,
  RfpSubmissionRequirements,
  StructuredRfp,
} from "./rfp-model";

export type {
  GroundingBundlePricing,
  PricingCategory,
  PricingHealthStatus,
  PricingItem,
  PricingModel,
  VendorPricingReality,
} from "./pricing-model";

export type {
  TechnicalProposalPacketCompliance,
  TechnicalProposalPacketModel,
} from "./technical-proposal-packet";
