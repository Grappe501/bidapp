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
  }[];
  gaps: string[];
  validationNotes: string[];
  assembledAt: string;
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
  "Executive Summary",
  "Architecture Narrative",
];

/* ——— Review & readiness (BP-007) ——— */

export type ReviewIssueType =
  | "Missing Requirement Coverage"
  | "Weak Evidence Support"
  | "Unsupported Claim"
  | "Submission Gap"
  | "Page Limit Risk"
  | "Scoring Weakness"
  | "Contract Exposure"
  | "Discussion Readiness Gap"
  | "Redaction Risk"
  | "Vendor Validation Gap"
  | "Architecture Risk"
  | "Other";

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

export const REVIEW_ISSUE_TYPES: ReviewIssueType[] = [
  "Missing Requirement Coverage",
  "Weak Evidence Support",
  "Unsupported Claim",
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
