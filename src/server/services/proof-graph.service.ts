/** Proof-graph summaries feed grounding bundles and the BP-007 review / readiness engine. */
import type {
  RequirementProofSupportLevel,
  RequirementSupportSummary,
} from "../../types";
import {
  listEvidenceByProject,
  listRequirementEvidenceLinksByProject,
  upsertRequirementEvidenceLink,
  type DbEvidenceItem,
  type DbRequirementEvidenceLink,
} from "../repositories/evidence.repo";
import {
  listProofByProject,
  listProofByRequirement,
  upsertRequirementEvidenceProof,
  type DbRequirementEvidenceProof,
} from "../repositories/proof-graph.repo";
import { query } from "../db/client";

export type ProofGraphSyncResult = {
  rowsSynced: number;
};

function normalizeStrength(raw: string): "strong" | "moderate" | "weak" {
  const s = raw.trim().toLowerCase();
  if (s === "strong") return "strong";
  if (s === "moderate") return "moderate";
  return "weak";
}

function inferValidationStatus(ev: DbEvidenceItem): "verified" | "vendor_claim" | "unverified" {
  if (ev.validationStatus === "Verified") return "verified";
  if (ev.evidenceType === "Vendor Claim") return "vendor_claim";
  return "unverified";
}

function inferSourceType(ev: DbEvidenceItem): "document" | "vendor" | "inferred" {
  if (ev.evidenceType === "Vendor Claim") return "vendor";
  if (ev.evidenceType === "Inferred Conclusion") return "inferred";
  return "document";
}

function deriveFromLinkAndEvidence(
  link: DbRequirementEvidenceLink,
  ev: DbEvidenceItem,
): {
  supportStrength: "strong" | "moderate" | "weak";
  validationStatus: "verified" | "vendor_claim" | "unverified";
  sourceType: "document" | "vendor" | "inferred";
} {
  return {
    supportStrength: normalizeStrength(link.supportStrength),
    validationStatus: inferValidationStatus(ev),
    sourceType: inferSourceType(ev),
  };
}

export function computeRequirementSupportLevelFromProofRows(
  rows: Pick<
    DbRequirementEvidenceProof,
    "supportStrength" | "validationStatus"
  >[],
): RequirementProofSupportLevel {
  if (rows.length === 0) return "none";
  const hasStrongVerified = rows.some(
    (r) =>
      r.supportStrength === "strong" && r.validationStatus === "verified",
  );
  if (hasStrongVerified) return "strong";
  const anyModerate = rows.some((r) => r.supportStrength === "moderate");
  const anyWeakVerified = rows.some(
    (r) => r.supportStrength === "weak" && r.validationStatus === "verified",
  );
  const strongVendor = rows.some(
    (r) => r.supportStrength === "strong" && r.validationStatus === "vendor_claim",
  );
  if (anyModerate || anyWeakVerified || strongVendor) return "partial";
  return "weak";
}

function validationMixFromRows(
  rows: DbRequirementEvidenceProof[],
): RequirementSupportSummary["validation_mix"] {
  const mix = { verified: 0, vendor_claim: 0, unverified: 0 };
  for (const r of rows) {
    if (r.validationStatus === "verified") mix.verified += 1;
    else if (r.validationStatus === "vendor_claim") mix.vendor_claim += 1;
    else mix.unverified += 1;
  }
  return mix;
}

function summaryForRows(
  rows: DbRequirementEvidenceProof[],
): RequirementSupportSummary {
  return {
    level: computeRequirementSupportLevelFromProofRows(rows),
    evidence_ids: rows.map((r) => r.evidenceId),
    validation_mix: validationMixFromRows(rows),
  };
}

export async function buildProofGraphForProject(
  projectId: string,
): Promise<ProofGraphSyncResult> {
  const links = await listRequirementEvidenceLinksByProject(projectId);
  const evidence = await listEvidenceByProject(projectId);
  const evById = new Map(evidence.map((e) => [e.id, e]));
  let rowsSynced = 0;
  for (const link of links) {
    const ev = evById.get(link.evidenceId);
    if (!ev) continue;
    const d = deriveFromLinkAndEvidence(link, ev);
    await upsertRequirementEvidenceProof({
      projectId,
      requirementId: link.requirementId,
      evidenceId: link.evidenceId,
      supportStrength: d.supportStrength,
      validationStatus: d.validationStatus,
      sourceType: d.sourceType,
      notes: "synced from requirement_evidence_links",
    });
    rowsSynced += 1;
  }
  return { rowsSynced };
}

export async function buildProofGraphForRequirement(
  requirementId: string,
): Promise<ProofGraphSyncResult> {
  const pr = await query(
    `SELECT project_id FROM requirements WHERE id = $1`,
    [requirementId],
  );
  if (pr.rows.length === 0) return { rowsSynced: 0 };
  const projectId = String((pr.rows[0] as Record<string, unknown>).project_id);
  const allLinks = await listRequirementEvidenceLinksByProject(projectId);
  const scoped = allLinks.filter((l) => l.requirementId === requirementId);
  const evidence = await listEvidenceByProject(projectId);
  const evById = new Map(evidence.map((e) => [e.id, e]));
  let rowsSynced = 0;
  for (const link of scoped) {
    const ev = evById.get(link.evidenceId);
    if (!ev) continue;
    const d = deriveFromLinkAndEvidence(link, ev);
    await upsertRequirementEvidenceProof({
      projectId,
      requirementId: link.requirementId,
      evidenceId: link.evidenceId,
      supportStrength: d.supportStrength,
      validationStatus: d.validationStatus,
      sourceType: d.sourceType,
      notes: "synced from requirement_evidence_links",
    });
    rowsSynced += 1;
  }
  return { rowsSynced };
}

export async function attachEvidenceToRequirement(input: {
  projectId: string;
  requirementId: string;
  evidenceId: string;
  supportStrength: "strong" | "moderate" | "weak";
  validationStatus: "verified" | "vendor_claim" | "unverified";
  sourceType?: "document" | "vendor" | "inferred";
  notes?: string;
}): Promise<DbRequirementEvidenceProof> {
  const evidence = await listEvidenceByProject(input.projectId);
  const ev = evidence.find((e) => e.id === input.evidenceId);
  const sourceType =
    input.sourceType ?? (ev ? inferSourceType(ev) : "document");
  const linkStrength =
    input.supportStrength === "strong"
      ? "Strong"
      : input.supportStrength === "moderate"
        ? "Moderate"
        : "Weak";
  await upsertRequirementEvidenceLink({
    requirementId: input.requirementId,
    evidenceId: input.evidenceId,
    supportStrength: linkStrength,
    linkNote: input.notes?.trim() || "",
  });
  return upsertRequirementEvidenceProof({
    projectId: input.projectId,
    requirementId: input.requirementId,
    evidenceId: input.evidenceId,
    supportStrength: input.supportStrength,
    validationStatus: input.validationStatus,
    sourceType,
    notes: input.notes?.trim() || "",
  });
}

export async function computeRequirementSupportLevel(
  requirementId: string,
): Promise<RequirementProofSupportLevel> {
  const rows = await listProofByRequirement(requirementId);
  return computeRequirementSupportLevelFromProofRows(rows);
}

export async function buildRequirementSupportMapForRequirements(
  projectId: string,
  requirementIds: string[],
): Promise<Record<string, RequirementSupportSummary>> {
  const all = await listProofByProject(projectId);
  const out: Record<string, RequirementSupportSummary> = {};
  for (const id of requirementIds) {
    const rows = all.filter((r) => r.requirementId === id);
    out[id] = summaryForRows(rows);
  }
  return out;
}
