import {
  listArchitectureComponentsByOptionId,
  listArchitectureOptionsByProject,
} from "../repositories/architecture.repo";
import { listSubmissionItemsByProject } from "../repositories/control.repo";
import { listEvidenceByProject, listRequirementEvidenceLinksByProject } from "../repositories/evidence.repo";
import { listFilesByProject } from "../repositories/file.repo";
import type { DbArchitectureOption } from "../repositories/architecture.repo";
import type { DbCompanyProfile } from "../repositories/intelligence.repo";
import {
  listCompanyProfilesByProject,
} from "../repositories/intelligence.repo";
import { getProject } from "../repositories/project.repo";
import { listRequirementsByProject } from "../repositories/requirement.repo";
import type { DbVendor } from "../repositories/vendor.repo";
import { listVendorsByProject } from "../repositories/vendor.repo";
import type {
  ArchitectureComponent,
  ArchitectureOption,
  CompanyProfile,
  EvidenceItem,
  EvidenceType,
  EvidenceValidationStatus,
  FileCategory,
  FileRecord,
  FileSourceType,
  Project,
  Requirement,
  RequirementEvidenceLink,
  RequirementResponseCategory,
  RequirementRiskLevel,
  RequirementStatus,
  RequirementTagType,
  RequirementType,
  SubmissionItem,
  SubmissionItemStatus,
  SubmissionPhase,
  Vendor,
} from "../../types";

function mapProjectRow(p: NonNullable<Awaited<ReturnType<typeof getProject>>>): Project {
  return {
    id: p.id,
    title: p.title,
    bidNumber: p.bidNumber,
    issuingOrganization: p.issuingOrganization,
    dueDate: p.dueDate,
    status: p.status as Project["status"],
    shortDescription: p.shortDescription,
  };
}

function mapFiles(rows: Awaited<ReturnType<typeof listFilesByProject>>): FileRecord[] {
  return rows.map((f) => ({
    id: f.id,
    name: f.name,
    category: f.category as FileCategory,
    sourceType: f.sourceType as FileSourceType,
    uploadedAt: f.uploadedAt,
    fileType: f.fileType,
    status: f.status as FileRecord["status"],
    tags: f.tags,
    noteCount: f.noteCount,
    linkedItemCount: f.linkedItemCount,
    description: f.description ?? undefined,
  }));
}

function mapRequirements(
  rows: Awaited<ReturnType<typeof listRequirementsByProject>>,
): Requirement[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    sourceFileId: r.sourceFileId ?? "",
    sourceFileName: r.sourceFileName,
    sourceSection: r.sourceSection,
    verbatimText: r.verbatimText,
    summary: r.summary,
    requirementType: r.requirementType as RequirementType,
    mandatory: r.mandatory,
    responseCategory: r.responseCategory as RequirementResponseCategory,
    status: r.status as RequirementStatus,
    riskLevel: r.riskLevel as RequirementRiskLevel,
    owner: r.owner,
    notes: r.notes,
    tags: r.tags as RequirementTagType[],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

function mapEvidence(rows: Awaited<ReturnType<typeof listEvidenceByProject>>): EvidenceItem[] {
  return rows.map((e) => ({
    id: e.id,
    title: e.title,
    sourceFileId: e.sourceFileId ?? "",
    sourceFileName: e.sourceFileName,
    sourceSection: e.sourceSection,
    excerpt: e.excerpt,
    evidenceType: e.evidenceType as EvidenceType,
    validationStatus: e.validationStatus as EvidenceValidationStatus,
    notes: e.notes,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }));
}

function mapLinks(
  rows: Awaited<ReturnType<typeof listRequirementEvidenceLinksByProject>>,
): RequirementEvidenceLink[] {
  return rows.map((l) => ({
    id: l.id,
    requirementId: l.requirementId,
    evidenceId: l.evidenceId,
    supportStrength: l.supportStrength as RequirementEvidenceLink["supportStrength"],
    linkNote: l.linkNote,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }));
}

function mapVendor(v: DbVendor): Vendor {
  return {
    id: v.id,
    name: v.name,
    category: v.category as Vendor["category"],
    status: v.status as Vendor["status"],
    primaryContactName: v.primaryContactName,
    primaryContactEmail: v.primaryContactEmail,
    primaryContactPhone: v.primaryContactPhone,
    summary: v.summary,
    fitScore: v.fitScore as Vendor["fitScore"],
    implementationSpeed: v.implementationSpeed as Vendor["implementationSpeed"],
    ltcFit: v.ltcFit as Vendor["ltcFit"],
    apiReadiness: v.apiReadiness as Vendor["apiReadiness"],
    pricingNotes: v.pricingNotes,
    likelyStackRole: v.likelyStackRole,
    strengths: v.strengths,
    weaknesses: v.weaknesses,
    risks: v.risks,
    notes: v.notes,
    capabilities: v.capabilities,
    sourceFileIds: v.sourceFileIds,
    websiteUrl: v.websiteUrl,
    vendorDomain: v.vendorDomain,
    websiteLastCrawledAt: v.websiteLastCrawledAt,
    websiteCrawlStatus: v.websiteCrawlStatus,
    websiteCrawlError: v.websiteCrawlError,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

function mapCompanyProfile(cp: DbCompanyProfile): CompanyProfile {
  return {
    id: cp.id,
    name: cp.name,
    type: cp.profileType === "Vendor" ? "Vendor" : "Client",
    summary: cp.summary,
    capabilities: cp.capabilities,
    risks: cp.risks,
    sources: cp.sources,
    claims: cp.claims,
    integrationDetails: cp.integrationDetails,
  };
}

function mapSubmissionItems(
  rows: Awaited<ReturnType<typeof listSubmissionItemsByProject>>,
): SubmissionItem[] {
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    required: s.required,
    phase: s.phase as SubmissionPhase,
    status: s.status as SubmissionItemStatus,
    owner: s.owner,
    notes: s.notes,
  }));
}

async function mapArchitectureOptions(
  options: DbArchitectureOption[],
): Promise<ArchitectureOption[]> {
  const out: ArchitectureOption[] = [];
  for (const o of options) {
    const comps = await listArchitectureComponentsByOptionId(o.id);
    const components: ArchitectureComponent[] = comps.map((c) => ({
      id: c.id,
      vendorId: c.vendorId ?? "",
      vendorName: c.vendorName,
      role: c.role as ArchitectureComponent["role"],
      responsibilitySummary: c.responsibilitySummary,
      optional: c.optional,
    }));
    out.push({
      id: o.id,
      name: o.name,
      status: o.status as ArchitectureOption["status"],
      summary: o.summary,
      recommended: o.recommended,
      components,
      narrativeStrengths: o.narrativeStrengths,
      implementationRisks: o.implementationRisks,
      malonePositionSummary: o.malonePositionSummary,
      notes: o.notes,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    });
  }
  return out;
}

export type ProjectWorkspacePayload = {
  project: Project;
  files: FileRecord[];
  requirements: Requirement[];
  evidence: EvidenceItem[];
  requirementEvidenceLinks: RequirementEvidenceLink[];
  vendors: Vendor[];
  architectureOptions: ArchitectureOption[];
  companyProfiles: CompanyProfile[];
  submissionItems: SubmissionItem[];
};

export async function loadProjectWorkspacePayload(
  projectId: string,
): Promise<ProjectWorkspacePayload | null> {
  const proj = await getProject(projectId);
  if (!proj) return null;
  const [
    files,
    requirements,
    evidence,
    links,
    vendors,
    archOpts,
    profiles,
    submissionItems,
  ] = await Promise.all([
    listFilesByProject(projectId),
    listRequirementsByProject(projectId),
    listEvidenceByProject(projectId),
    listRequirementEvidenceLinksByProject(projectId),
    listVendorsByProject(projectId),
    listArchitectureOptionsByProject(projectId),
    listCompanyProfilesByProject(projectId),
    listSubmissionItemsByProject(projectId),
  ]);
  const architectureOptions = await mapArchitectureOptions(archOpts);
  return {
    project: mapProjectRow(proj),
    files: mapFiles(files),
    requirements: mapRequirements(requirements),
    evidence: mapEvidence(evidence),
    requirementEvidenceLinks: mapLinks(links),
    vendors: vendors.map(mapVendor),
    architectureOptions,
    companyProfiles: profiles.map(mapCompanyProfile),
    submissionItems: mapSubmissionItems(submissionItems),
  };
}
