/**
 * Idempotent seed: skips if a project with the mock bid number already exists.
 * Run after: npm run db:migrate
 */
import { closePool, query } from "../src/server/db/client";
import { uuidFromSeed } from "../src/server/lib/deterministic-uuid";
import {
  createArchitectureComponent,
  createArchitectureOption,
} from "../src/server/repositories/architecture.repo";
import { createSubmissionItem } from "../src/server/repositories/control.repo";
import {
  createEvidenceItem,
  createRequirementEvidenceLink,
} from "../src/server/repositories/evidence.repo";
import { createFile } from "../src/server/repositories/file.repo";
import { createCompanyProfile } from "../src/server/repositories/intelligence.repo";
import { createProject } from "../src/server/repositories/project.repo";
import { createRequirement } from "../src/server/repositories/requirement.repo";
import { createVendor, createVendorContact } from "../src/server/repositories/vendor.repo";
import { MOCK_ARCHITECTURE_OPTIONS } from "../src/data/mockArchitectureOptions";
import { MOCK_COMPANY_PROFILES } from "../src/data/mockCompanyProfiles";
import { MOCK_EVIDENCE } from "../src/data/mockEvidence";
import { MOCK_FILES } from "../src/data/mockFiles";
import { MOCK_PROJECT } from "../src/data/mockProject";
import { MOCK_REQUIREMENT_EVIDENCE_LINKS } from "../src/data/mockRequirementEvidenceLinks";
import { MOCK_REQUIREMENTS } from "../src/data/mockRequirements";
import { MOCK_SUBMISSION_ITEMS } from "../src/data/mockSubmissionItems";
import { MOCK_VENDORS } from "../src/data/mockVendors";

function fid(mockFileId: string): string {
  return uuidFromSeed(`file:${mockFileId}`);
}

async function main() {
  const bid = MOCK_PROJECT.bidNumber;
  const check = await query(`SELECT id FROM projects WHERE bid_number = $1 LIMIT 1`, [
    bid,
  ]);
  if ((check.rowCount ?? 0) > 0) {
    console.log(`Seed skipped: project with bid_number ${bid} already exists.`);
    await closePool();
    return;
  }

  const projectId = uuidFromSeed(`project:${MOCK_PROJECT.id}`);

  await createProject({
    id: projectId,
    title: MOCK_PROJECT.title,
    bidNumber: MOCK_PROJECT.bidNumber,
    issuingOrganization: MOCK_PROJECT.issuingOrganization,
    dueDate: MOCK_PROJECT.dueDate,
    status: MOCK_PROJECT.status,
    shortDescription: MOCK_PROJECT.shortDescription,
  });

  for (const f of MOCK_FILES) {
    await createFile({
      id: fid(f.id),
      projectId,
      name: f.name,
      category: f.category,
      sourceType: f.sourceType,
      fileType: f.fileType,
      status: f.status,
      tags: f.tags,
      description: f.description ?? null,
      noteCount: f.noteCount,
      linkedItemCount: f.linkedItemCount,
      uploadedAt: f.uploadedAt,
    });
  }

  for (const r of MOCK_REQUIREMENTS) {
    await createRequirement({
      id: uuidFromSeed(`req:${r.id}`),
      projectId,
      sourceFileId: fid(r.sourceFileId),
      title: r.title,
      sourceFileName: r.sourceFileName,
      sourceSection: r.sourceSection,
      verbatimText: r.verbatimText,
      summary: r.summary,
      requirementType: r.requirementType,
      mandatory: r.mandatory,
      responseCategory: r.responseCategory,
      status: r.status,
      riskLevel: r.riskLevel,
      owner: r.owner,
      notes: r.notes,
      tags: r.tags,
    });
  }

  for (const e of MOCK_EVIDENCE) {
    await createEvidenceItem({
      id: uuidFromSeed(`ev:${e.id}`),
      projectId,
      sourceFileId: e.sourceFileId ? fid(e.sourceFileId) : null,
      title: e.title,
      sourceFileName: e.sourceFileName,
      sourceSection: e.sourceSection,
      excerpt: e.excerpt,
      evidenceType: e.evidenceType,
      validationStatus: e.validationStatus,
      notes: e.notes,
    });
  }

  for (const l of MOCK_REQUIREMENT_EVIDENCE_LINKS) {
    await createRequirementEvidenceLink({
      requirementId: uuidFromSeed(`req:${l.requirementId}`),
      evidenceId: uuidFromSeed(`ev:${l.evidenceId}`),
      supportStrength: l.supportStrength,
      linkNote: l.linkNote,
    });
  }

  for (const v of MOCK_VENDORS) {
    const vid = uuidFromSeed(`vendor:${v.id}`);
    await createVendor({
      id: vid,
      projectId,
      name: v.name,
      category: v.category,
      status: v.status,
      summary: v.summary,
      fitScore: v.fitScore,
      implementationSpeed: v.implementationSpeed,
      ltcFit: v.ltcFit,
      apiReadiness: v.apiReadiness,
      pricingNotes: v.pricingNotes,
      likelyStackRole: v.likelyStackRole,
      strengths: v.strengths,
      weaknesses: v.weaknesses,
      risks: v.risks,
      notes: v.notes,
      capabilities: v.capabilities,
      sourceFileIds: v.sourceFileIds.map((x: string) => fid(x)),
      primaryContactName: v.primaryContactName,
      primaryContactEmail: v.primaryContactEmail,
      primaryContactPhone: v.primaryContactPhone,
    });
    await createVendorContact({
      vendorId: vid,
      name: v.primaryContactName,
      email: v.primaryContactEmail,
      phone: v.primaryContactPhone,
      isPrimary: true,
    });
  }

  for (const o of MOCK_ARCHITECTURE_OPTIONS) {
    const oid = uuidFromSeed(`arch:${o.id}`);
    await createArchitectureOption({
      id: oid,
      projectId,
      name: o.name,
      status: o.status,
      summary: o.summary,
      recommended: o.recommended,
      narrativeStrengths: o.narrativeStrengths,
      implementationRisks: o.implementationRisks,
      malonePositionSummary: o.malonePositionSummary,
      notes: o.notes,
    });
    for (const c of o.components) {
      const vendorUuid = c.vendorId
        ? uuidFromSeed(`vendor:${c.vendorId}`)
        : null;
      await createArchitectureComponent({
        id: uuidFromSeed(`ac:${c.id}`),
        architectureOptionId: oid,
        vendorId: vendorUuid,
        vendorName: c.vendorName,
        role: c.role,
        responsibilitySummary: c.responsibilitySummary,
        optional: c.optional,
      });
    }
  }

  for (const s of MOCK_SUBMISSION_ITEMS) {
    await createSubmissionItem({
      id: uuidFromSeed(`sub:${s.id}`),
      projectId,
      name: s.name,
      required: s.required,
      phase: s.phase,
      status: s.status,
      owner: s.owner,
      notes: s.notes,
    });
  }

  for (const p of MOCK_COMPANY_PROFILES) {
    await createCompanyProfile({
      id: uuidFromSeed(`co:${p.id}`),
      projectId,
      name: p.name,
      profileType: p.type,
      summary: p.summary,
      capabilities: p.capabilities,
      risks: p.risks,
      sources: p.sources,
      claims: p.claims,
      integrationDetails: p.integrationDetails,
    });
  }

  console.log(`Seed complete for project ${projectId} (${bid}).`);
  await closePool();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
