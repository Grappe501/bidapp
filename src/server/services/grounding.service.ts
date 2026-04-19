/**
 * Runtime note: Netlify/server bundles do not resolve Vite-style `@/…` aliases.
 * Use relative imports for anything under `src/server` and `netlify/functions`.
 */
import type {
  GroundingBundlePayload,
  GroundingBundleType,
  KnowledgeProvenanceKind,
  RetrievalQueryType,
} from "../../types";
import { emptyGroundingPayload, summarizeGaps } from "../../lib/grounding-utils";
import { retrieveChunks } from "./retrieval.service";
import { listRequirementsByProject } from "../repositories/requirement.repo";
import { listEvidenceByProject } from "../repositories/evidence.repo";
import { listArchitectureOptionsByProject } from "../repositories/architecture.repo";
import { listFactsByProject } from "../repositories/intelligence.repo";
import { insertGroundingBundle } from "../repositories/grounding.repo";
import { getProject } from "../repositories/project.repo";
import { listFilesByProject } from "../repositories/file.repo";
import { buildProjectGroundingBundleContract } from "../../lib/contract-narrative";
import { buildProjectGroundingBundleRfp } from "../../lib/rfp-narrative";
import { buildPricingLayerForProject } from "../../lib/pricing-structure";
import { selectVendorFactsForGroundingBundle } from "../lib/grounding-quality-utils";
import type { DbRequirement } from "../repositories/requirement.repo";
import type { DbEvidenceItem } from "../repositories/evidence.repo";
import { buildRequirementSupportMapForRequirements } from "./proof-graph.service";

const RETRIEVAL_BY_BUNDLE: Record<
  GroundingBundleType,
  { queryText: string; queryType: RetrievalQueryType }
> = {
  Experience: {
    queryText:
      "past performance experience qualifications certifications staffing references",
    queryType: "requirement_support",
  },
  Solution: {
    queryText:
      "solution technical approach integration architecture functional requirements",
    queryType: "draft_grounding",
  },
  Risk: {
    queryText:
      "risk mitigation security compliance implementation constraints vulnerabilities",
    queryType: "requirement_support",
  },
  Interview: {
    queryText:
      "oral presentation interview evaluation Q&A pharmacy service delivery pricing compliance MatrixCare Medicaid emergency delivery",
    queryType: "draft_grounding",
  },
  "Executive Summary": {
    queryText:
      "executive summary evaluation criteria compliance value proposition differentiators",
    queryType: "draft_grounding",
  },
  vendor_recommendation: {
    queryText:
      "vendor evaluation capabilities fit strengths weaknesses differentiators",
    queryType: "vendor_intelligence",
  },
  architecture_narrative: {
    queryText:
      "architecture platform design components interfaces deployment topology",
    queryType: "architecture",
  },
  draft_grounding: {
    queryText:
      "proposal instructions evaluation criteria compliance submission evidence",
    queryType: "draft_grounding",
  },
};

function pickRequirements(
  bundleType: GroundingBundleType,
  all: DbRequirement[],
): DbRequirement[] {
  if (bundleType === "Risk") {
    const hi = all.filter(
      (r) => r.riskLevel === "High" || r.riskLevel === "Critical",
    );
    const rest = all.filter((r) => !hi.includes(r));
    return [...hi, ...rest].slice(0, 18);
  }
  if (
    bundleType === "Solution" ||
    bundleType === "architecture_narrative" ||
    bundleType === "Interview" ||
    bundleType === "Executive Summary"
  ) {
    const mand = all.filter((r) => r.mandatory);
    const rest = all.filter((r) => !r.mandatory);
    return [...mand, ...rest].slice(0, 18);
  }
  return all.slice(0, 14);
}

function pickEvidence(bundleType: GroundingBundleType, count: number) {
  return (items: DbEvidenceItem[]) => {
    if (bundleType === "Risk") {
      const weak = items.filter(
        (e) =>
          e.validationStatus === "Unverified" ||
          e.validationStatus === "Pending Validation",
      );
      return [...weak, ...items.filter((e) => !weak.includes(e))].slice(
        0,
        count,
      );
    }
    return items.slice(0, count);
  };
}

/**
 * Assembles a draft-safe grounding bundle (no prose): linked requirements, evidence,
 * retrieved chunks, and intelligence facts with validation labels.
 */
export async function buildAndStoreGroundingBundle(input: {
  projectId: string;
  bundleType: GroundingBundleType;
  targetEntityId?: string | null;
  title?: string;
  topK?: number;
  fileId?: string;
  /** When true, drop more marketing/inferred facts when operational coverage exists. */
  strictGrounding?: boolean;
}): Promise<{ id: string; payload: GroundingBundlePayload }> {
  const cfg = RETRIEVAL_BY_BUNDLE[input.bundleType];
  const title =
    input.title?.trim() ||
    `${input.bundleType} grounding — ${new Date().toISOString().slice(0, 10)}`;

  const base = emptyGroundingPayload(input.bundleType, title);

  const { chunks } = await retrieveChunks({
    projectId: input.projectId,
    queryText: cfg.queryText,
    queryType: cfg.queryType,
    topK: input.topK ?? 10,
    fileId: input.fileId,
  });

  base.retrievedChunks = chunks.map((c) => ({
    chunkId: c.chunkId,
    fileId: c.fileId,
    fileName: c.fileName,
    chunkIndex: c.chunkIndex,
    text: c.text,
    score: c.score,
    sourceRef: `${c.fileName} · chunk ${c.chunkIndex} · model ${c.embeddingModel}`,
  }));

  const reqs = await listRequirementsByProject(input.projectId);
  const pickedReqs = pickRequirements(input.bundleType, reqs);
  base.requirements = pickedReqs.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    riskLevel: r.riskLevel,
    status: r.status,
  }));

  const evAll = await listEvidenceByProject(input.projectId);
  const evPick = pickEvidence(input.bundleType, 12)(evAll);
  base.evidence = evPick.map((e) => ({
    id: e.id,
    title: e.title,
    excerpt: e.excerpt,
    validationStatus: e.validationStatus,
    evidenceType: e.evidenceType,
  }));

  const arch = await listArchitectureOptionsByProject(input.projectId);
  base.architectureOptions = arch.slice(0, 6).map((a) => ({
    id: a.id,
    name: a.name,
    summary: a.summary,
  }));

  const factsRaw = await listFactsByProject(input.projectId, 72);
  const strict = input.strictGrounding ?? false;
  const selection = selectVendorFactsForGroundingBundle(factsRaw, 24, strict);
  base.vendorFacts = selection.selected.map((f) => ({
    factText: f.factText,
    validationStatus: f.validationStatus,
    provenanceKind: (f.classification as KnowledgeProvenanceKind) ?? "Vendor Claim",
    sourceId: f.sourceId,
    credibility: f.credibility?.trim() || undefined,
    confidence: f.confidence?.trim() || undefined,
  }));
  base.factSelectionSummary = selection.factSelectionSummaryText;
  base.factSelectionDetail = selection.factSelectionDetail;
  base.bundleQualityNote = selection.factSelectionDetail.bundleQualityNote;
  base.droppedFactCounts = selection.droppedFactCounts;
  base.weakFactIncludedCount = selection.weakFactIncludedCount;

  base.requirementSupport = await buildRequirementSupportMapForRequirements(
    input.projectId,
    pickedReqs.map((r) => r.id),
  );

  base.gaps = summarizeGaps(base);
  base.validationNotes = [
    ...base.validationNotes,
    "Bundle is retrieval-assisted; verify citations before external submission.",
  ];
  if (selection.factSelectionDetail.includedUnknownCount > 0) {
    base.validationNotes.push(
      `Unknown-quality vendor facts (${selection.factSelectionDetail.includedUnknownCount}) are included — treat as provisional.`,
    );
  } else if (selection.weakFactIncludedCount > 0) {
    base.validationNotes.push(
      `This bundle includes ${selection.weakFactIncludedCount} lower-trust vendor fact(s); qualify them in prose.`,
    );
  }
  if (selection.factSelectionDetail.bundleQuality === "weak") {
    base.validationNotes.push(
      "Grounding bundle quality is weak — sparse operational facts; review before scored claims.",
    );
  }

  const project = await getProject(input.projectId);
  if (project) {
    base.rfp = buildProjectGroundingBundleRfp({
      bidNumber: project.bidNumber,
      title: project.title,
      issuingOrganization: project.issuingOrganization,
      dueDate: project.dueDate,
    });
    base.validationNotes.push(
      base.rfp.stub
        ? "Structured RFP layer is a project stub — register canonical solicitation data for scored alignment."
        : "Structured RFP (official weights & requirements) attached — drafts must align to evaluation priorities.",
    );
    base.contract = buildProjectGroundingBundleContract({
      bidNumber: project.bidNumber,
      title: project.title,
      issuingOrganization: project.issuingOrganization,
      dueDate: project.dueDate,
    });
    base.validationNotes.push(
      base.contract.stub
        ? "SRV-1 contract structure stub — register canonical contract data for enforceable obligations."
        : "SRV-1 contract structure attached — scope, performance, pricing discipline, and compliance forms must align.",
    );
    if (base.contract.crossCheckWarnings.length > 0) {
      base.validationNotes.push(
        `RFP ↔ contract cross-check: ${base.contract.crossCheckWarnings.slice(0, 3).join(" · ")}`,
      );
    }

    const dbFiles = await listFilesByProject(input.projectId);
    base.pricing = buildPricingLayerForProject(project.bidNumber, dbFiles);
    if (!base.pricing.ready) {
      base.validationNotes.push(
        "Pricing layer is not submission-ready — confirm line items, RFP service coverage (dispensing, emergency delivery, packaging, billing, EHR integration), and annual/contract totals.",
      );
    } else {
      base.validationNotes.push(
        "Structured pricing attached — line items, totals, and required RFP service coverage validated for this solicitation.",
      );
    }
    if (base.pricing.notes.length > 0) {
      base.validationNotes.push(...base.pricing.notes.slice(0, 4));
    }
  }

  const row = await insertGroundingBundle({
    projectId: input.projectId,
    bundleType: input.bundleType,
    targetEntityId: input.targetEntityId ?? null,
    title,
    bundlePayloadJson: base,
  });

  return { id: row.id, payload: base };
}
