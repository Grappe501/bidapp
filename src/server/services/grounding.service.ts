/**
 * Runtime note: Netlify/server bundles do not resolve Vite-style `@/…` aliases.
 * Use relative imports for anything under `src/server` and `netlify/functions`.
 */
import type {
  CompetitorAwareSimulationResult,
  GroundingBundleCompetitorContext,
  GroundingBundlePayload,
  GroundingBundleProposalAdaptation,
  GroundingBundleType,
  KnowledgeProvenanceKind,
  RetrievalQueryType,
} from "../../types";
import { emptyGroundingPayload, summarizeGaps } from "../../lib/grounding-utils";
import { retrieveChunks } from "./retrieval.service";
import { listRequirementsByProject } from "../repositories/requirement.repo";
import { listEvidenceByProject } from "../repositories/evidence.repo";
import {
  listArchitectureComponentsByOptionId,
  listArchitectureOptionsByProject,
} from "../repositories/architecture.repo";
import { listFactsByProject } from "../repositories/intelligence.repo";
import { insertGroundingBundle } from "../repositories/grounding.repo";
import { getProject } from "../repositories/project.repo";
import { listFilesByProject } from "../repositories/file.repo";
import { buildProjectGroundingBundleContract } from "../../lib/contract-narrative";
import { buildProjectGroundingBundleRfp } from "../../lib/rfp-narrative";
import { buildPricingLayerForProject } from "../../lib/pricing-structure";
import { resolveArbuyModelForBidNumber } from "../../lib/arbuy-solicitation";
import { selectVendorFactsForGroundingBundle } from "../lib/grounding-quality-utils";
import { buildVendorDecisionSynthesis } from "../../lib/decision-synthesis-engine";
import { buildStrategicNarrativeSpine } from "../../lib/strategic-narrative-spine";
import {
  defaultComparedVendorIdsForProject,
  runCompetitorAwareSimulation,
  toGroundingCompetitorContext,
} from "./competitor-aware-simulation.service";
import { loadVendorIntelligenceForBundle } from "./vendor-grounding.service";
import type { DbRequirement } from "../repositories/requirement.repo";
import type { DbEvidenceItem } from "../repositories/evidence.repo";
import { buildRequirementSupportMapForRequirements } from "./proof-graph.service";

const ADAPT_BUNDLE_TYPES: ReadonlySet<GroundingBundleType> = new Set([
  "Solution",
  "Risk",
  "Interview",
  "vendor_recommendation",
  "architecture_narrative",
  "Executive Summary",
]);

function buildStrategicDirective(input: {
  bundleType: GroundingBundleType;
  architectureName: string;
  effectiveVendorName: string;
  source: GroundingBundleProposalAdaptation["source"];
  competitor?: GroundingBundleCompetitorContext;
}): string {
  const { bundleType, architectureName, effectiveVendorName, source, competitor } =
    input;
  const conf = competitor?.recommendationConfidence ?? "provisional";
  const lines: string[] = [
    `Primary implementation posture for this solicitation: architecture "${architectureName}" with vendor "${effectiveVendorName}" (selection source: ${source}).`,
    `Center solution, risk, and interview language on ${effectiveVendorName} within ${architectureName}; do not advocate alternate stacks unless the grounding explicitly compares them.`,
  ];
  if (conf === "provisional" || conf === "low") {
    lines.push(
      `Recommendation confidence is ${conf} — qualify claims, avoid definitive superiority language, and surface unresolved gaps as interview or mitigation items.`,
    );
  }
  if (competitor?.pointLossComparisons?.length) {
    lines.push(
      `Address competitive weaknesses honestly: ${competitor.pointLossComparisons.slice(0, 2).join(" · ")}`,
    );
  }
  switch (bundleType) {
    case "Solution":
      lines.push(
        `Solution: emphasize ${effectiveVendorName}-specific capabilities evidenced in vendor intelligence rows, integration paths, and burden-of-proof for unverified integrations.`,
      );
      break;
    case "Risk":
      lines.push(
        `Risk: tie mitigations to ${effectiveVendorName} integration rows and competitor decision risks; add contingency where proof gaps remain.`,
      );
      break;
    case "Interview":
      lines.push(
        `Interview: prioritize unanswered or must-ask questions from vendor intelligence and competitor context; rehearse defenses when confidence is provisional.`,
      );
      break;
    case "Executive Summary":
      lines.push(
        `Executive summary: state the stack (${architectureName} / ${effectiveVendorName}) with evidence-backed differentiators only.`,
      );
      break;
    case "vendor_recommendation":
      lines.push(
        `Vendor recommendation: frame selection using competitor comparison and evidence rows only.`,
      );
      break;
    case "architecture_narrative":
      lines.push(
        `Architecture: describe components and interfaces for ${architectureName} consistent with ${effectiveVendorName}'s role in the stack.`,
      );
      break;
    default:
      break;
  }
  return lines.join("\n");
}

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

    const arbuy = resolveArbuyModelForBidNumber(project.bidNumber);
    if (arbuy) {
      base.arbuy = arbuy;
      base.validationNotes.push(
        "ARBuy solicitation metadata and official quote line structure (UNSPSC) attached — align portal identity, electronic submission, attachments, and price sheet naming.",
      );
    }
  }

  const ve = input.targetEntityId?.trim();
  const adaptBundle = ADAPT_BUNDLE_TYPES.has(input.bundleType);

  const archOpt = arch.find((o) => o.recommended) ?? arch[0];
  const archOptId = archOpt?.id ?? null;

  let sim: CompetitorAwareSimulationResult | null = null;
  let competitorCtx: GroundingBundleCompetitorContext | undefined;

  const compared = await defaultComparedVendorIdsForProject(input.projectId);
  const wantCompetitor = compared.length > 0 && (adaptBundle || Boolean(ve));

  if (wantCompetitor) {
    try {
      sim = await runCompetitorAwareSimulation({
        projectId: input.projectId,
        comparedVendorIds: compared,
        architectureOptionId: archOptId,
      });
      const selectedForCtx =
        ve ?? sim.recommendedVendorId ?? sim.entries[0]?.vendorId;
      if (selectedForCtx && sim) {
        const simRun = sim;
        let stackIds: string[] = [];
        if (archOptId) {
          const comps = await listArchitectureComponentsByOptionId(archOptId);
          stackIds = [
            ...new Set(
              comps
                .filter((c) => !c.optional && c.vendorId)
                .map((c) => c.vendorId as string),
            ),
          ];
        }
        const decisionSynthesis = buildVendorDecisionSynthesis({
          sim: simRun,
          recommendedVendorStackIds: stackIds,
          architectureOptionName: archOpt?.name,
        });
        const leadName =
          simRun.entries.find(
            (e) =>
              e.vendorId ===
              (simRun.recommendedVendorId ?? simRun.entries[0]?.vendorId),
          )?.vendorName;
        base.strategicNarrativeSpine = buildStrategicNarrativeSpine({
          projectId: input.projectId,
          synthesis: decisionSynthesis,
          sim: simRun,
          recommendedVendorDisplayName: leadName,
          architectureOptionName: archOpt?.name,
        });
        competitorCtx = toGroundingCompetitorContext({
          simulation: simRun,
          selectedVendorId: selectedForCtx,
          bidNumber: project?.bidNumber,
          decisionSynthesis,
        });
      }
    } catch {
      base.validationNotes.push(
        "Competitor comparison could not be computed — run compare from vendor workspace if needed.",
      );
    }
  }

  let effectiveVendorId: string | null = null;
  let source: GroundingBundleProposalAdaptation["source"] = "none";

  if (ve) {
    effectiveVendorId = ve;
    source = "target_override";
  } else if (adaptBundle) {
    if (sim && sim.entries.length > 0) {
      const sorted = [...sim.entries].sort((a, b) => b.overallScore - a.overallScore);
      effectiveVendorId =
        sim.recommendedVendorId ?? sorted[0]?.vendorId ?? null;
      source = "competitor_recommendation";
    }
    if (!effectiveVendorId && archOptId) {
      const comps = await listArchitectureComponentsByOptionId(archOptId);
      const vid = comps.find((c) => c.vendorId)?.vendorId ?? null;
      if (vid) {
        effectiveVendorId = vid;
        source = "architecture_stack";
      }
    }
  }

  if (effectiveVendorId) {
    const vi = await loadVendorIntelligenceForBundle({
      projectId: input.projectId,
      vendorId: effectiveVendorId,
    });
    if (vi) {
      base.vendorIntelligence = vi;
      const fc = vi.fitDimensions.length;
      const cc = vi.vendorClaims.length;
      base.validationNotes.push(
        fc + cc > 0
          ? `Vendor intelligence attached (${vi.vendorName}): ${fc} fit dimension(s), ${cc} claim row(s), ${vi.intelligenceFacts.length} sourced fact(s), ${vi.interviewQuestions.length} interview question(s).`
          : `Vendor intelligence slice is sparse for ${vi.vendorName} — run vendor research and compute fit before scored claims.`,
      );
      if (vi.integrationRequirements.some((r) => r.status === "unknown")) {
        base.gaps.push(
          "One or more integration requirement rows are unknown — confirm with vendor.",
        );
      }
      if (vi.claimValidation?.rows?.length) {
        const s = vi.claimValidation.summary;
        base.validationNotes.push(
          `Claim validation (${vi.vendorName}): ${s.strongCount} strong, ${s.weakOrNoneCount} weak/none, ${s.contradictedCount} with contradiction signals, ${s.followUpRequiredCount} need follow-up.`,
        );
        let cvNote = 0;
        for (const row of vi.claimValidation.rows) {
          if (row.contradictionStatus === "clear" || row.contradictionStatus === "possible") {
            base.gaps.push(
              `Claim "${row.claimText.slice(0, 90)}${row.claimText.length > 90 ? "…" : ""}" — ${row.contradictionStatus} contradiction signal; avoid overstating in Solution/Risk until reconciled.`,
            );
          } else if (
            cvNote < 5 &&
            (row.effectiveSupportLevel === "weak" ||
              row.effectiveSupportLevel === "none")
          ) {
            cvNote++;
            base.validationNotes.push(
              `Soften or qualify language on: ${row.normalizedClaimKey} (${row.effectiveSupportLevel} support).`,
            );
          }
        }
      }
      if (vi.failureSimulation?.summary) {
        const fs = vi.failureSimulation.summary;
        base.validationNotes.push(
          `Failure simulation (${vi.vendorName}): ${fs.overallResilience} resilience; ${fs.criticalScenarioCount} critical-impact scenario(s); ${fs.highLikelihoodCount} high-likelihood stress path(s).`,
        );
        for (const w of fs.decisionWarnings.slice(0, 3)) {
          if (!base.validationNotes.includes(w)) base.validationNotes.push(w);
        }
        for (const m of fs.topFailureModes.slice(0, 3)) {
          base.gaps.push(
            `Stress scenario: ${m.title} (${m.likelihood} likelihood, ${m.impact} impact) — address in Risk and Interview defense.`,
          );
        }
      }
      if (vi.roleFit?.summary) {
        const rs = vi.roleFit.summary;
        base.validationNotes.push(
          `Role fit (${vi.vendorName}): ${rs.roleStrategyAssessment.replace(/_/g, " ")} — own ${rs.strongOwnRoles.length} strong roles; ${rs.highestDependencyRoles.length} high Malone-dependency role(s).`,
        );
        if (rs.avoidRoles.length > 0) {
          base.gaps.push(
            `Roles marked avoid/weak ownership: ${rs.avoidRoles.slice(0, 4).join(", ")} — state Malone vs vendor RACI explicitly.`,
          );
        }
      }
      if (vi.pricingReality) {
        const pr = vi.pricingReality;
        base.validationNotes.push(
          `Pricing reality (${vi.vendorName}): ${pr.completeness} completeness, ${pr.roleAlignment} role alignment — hidden-cost ${pr.hiddenCostRisk}, underpricing ${pr.underpricingRisk}, Malone unpriced ${pr.maloneUnpricedDependency}.`,
        );
        if (pr.missingPricingAreas.length > 0) {
          base.gaps.push(
            `Pricing gaps vs roles/RFP: ${pr.missingPricingAreas.slice(0, 4).join("; ")}.`,
          );
        }
      }
    }
    if (competitorCtx) {
      base.competitorComparisonContext = competitorCtx;
      base.validationNotes.push(
        "Competitor-aware comparison context attached — interpretive only; cite evidence rows, not model scores.",
      );
      if (competitorCtx.decisionSynthesis) {
        const ds = competitorCtx.decisionSynthesis;
        base.validationNotes.push(
          `Decision synthesis (${ds.recommendationType.replace(/_/g, " ")} — ${ds.confidence} confidence): ${ds.mitigationPosture} mitigation; pricing ${ds.pricingAssessment}; Malone dependency ${ds.maloneDependency}.`,
        );
      }
      if (base.strategicNarrativeSpine) {
        base.validationNotes.push(
          "Strategic narrative spine attached — keep Executive Summary, Solution, Risk, and Interview aligned to the same decision story (tone may vary by section).",
        );
      }
    }
    if (adaptBundle && archOpt && base.vendorIntelligence) {
      const vi = base.vendorIntelligence;
      base.proposalAdaptation = {
        generatedAt: new Date().toISOString(),
        architectureOptionId: archOpt.id,
        architectureOptionName: archOpt.name,
        effectiveVendorId,
        effectiveVendorName: vi.vendorName,
        source,
        strategicDirective: buildStrategicDirective({
          bundleType: input.bundleType,
          architectureName: archOpt.name,
          effectiveVendorName: vi.vendorName,
          source,
          competitor: base.competitorComparisonContext,
        }),
      };
      base.validationNotes.push(
        `Proposal adaptation: drafting stack locked to ${archOpt.name} / ${vi.vendorName} (${source}).`,
      );
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
