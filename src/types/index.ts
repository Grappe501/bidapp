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
};

export type DraftSection = {
  id: string;
  projectId: string;
  sectionType: DraftSectionType;
  title: string;
  status: DraftStatus;
  activeVersionId: string | null;
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
