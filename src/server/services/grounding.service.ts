import type {
  GroundingBundlePayload,
  GroundingBundleType,
  KnowledgeProvenanceKind,
  RetrievalQueryType,
} from "@/types";
import { emptyGroundingPayload, summarizeGaps } from "@/lib/grounding-utils";
import { retrieveChunks } from "./retrieval.service";
import { listRequirementsByProject } from "../repositories/requirement.repo";
import { listEvidenceByProject } from "../repositories/evidence.repo";
import { listArchitectureOptionsByProject } from "../repositories/architecture.repo";
import { listFactsByProject } from "../repositories/intelligence.repo";
import { insertGroundingBundle } from "../repositories/grounding.repo";
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

  const row = await insertGroundingBundle({
    projectId: input.projectId,
    bundleType: input.bundleType,
    targetEntityId: input.targetEntityId ?? null,
    title,
    bundlePayloadJson: base,
  });

  return { id: row.id, payload: base };
}
