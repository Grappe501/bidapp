import { buildProjectGroundingBundleContract } from "../../lib/contract-narrative";
import { buildVendorDecisionSynthesis } from "../../lib/decision-synthesis-engine";
import { evaluateNarrativeAlignment } from "../../lib/narrative-alignment-engine";
import { buildPricingLayerForProject } from "../../lib/pricing-structure";
import { buildProjectGroundingBundleRfp } from "../../lib/rfp-narrative";
import { buildStrategicNarrativeSpine } from "../../lib/strategic-narrative-spine";
import type {
  CompetitorAwareSimulationResult,
  NarrativeAlignmentResult,
  NarrativeSectionKey,
  StrategicNarrativeSpine,
  VendorClaimValidationSummary,
  VendorDecisionSynthesis,
  VendorFailureSimulationSummary,
  VendorRoleFitSummary,
} from "../../types";
import { listSubmissionItemsByProject } from "../repositories/control.repo";
import {
  listDraftSectionsByProject,
  listDraftVersionsForProject,
  type DbDraftSection,
  type DbDraftVersion,
} from "../repositories/draft.repo";
import { listFilesByProject } from "../repositories/file.repo";
import {
  listArchitectureComponentsByOptionId,
  listArchitectureOptionsByProject,
} from "../repositories/architecture.repo";
import { getProject } from "../repositories/project.repo";
import { getVendorById, listVendorsByProject } from "../repositories/vendor.repo";
import { listVendorClaimValidations } from "../repositories/vendor-claim-validation.repo";
import {
  getInterviewReadinessSummaryForVendor,
  getProjectInterviewReadinessSummary,
} from "../repositories/vendor-interview.repo";
import { buildClaimValidationSummaryFromRows } from "../services/vendor-claim-validation-merge.service";
import { runVendorClaimValidation } from "../services/vendor-claim-validation.service";
import { runVendorFailureSimulation } from "../services/vendor-failure-mode.service";
import { computeVendorPricingReality } from "../services/pricing-reality.service";
import { runVendorRoleFitAnalysis } from "../services/vendor-role-fit.service";
import {
  defaultComparedVendorIdsForProject,
  runCompetitorAwareSimulation,
} from "../services/competitor-aware-simulation.service";
import type { BidAgentDomain } from "./bid-agent-query-classifier";

function mapDraftTexts(
  sections: DbDraftSection[],
  versions: DbDraftVersion[],
): Partial<Record<NarrativeSectionKey, string>> {
  const bySection = new Map<string, DbDraftSection>();
  for (const s of sections) bySection.set(s.id, s);
  const active = new Map<string, DbDraftVersion>();
  for (const v of versions) {
    const sec = bySection.get(v.sectionId);
    if (sec && sec.activeVersionId === v.id) {
      active.set(sec.id, v);
    }
  }
  const keyMap: Partial<
    Record<
      DbDraftSection["sectionType"],
      NarrativeSectionKey
    >
  > = {
    "Executive Summary": "executive_summary",
    Solution: "solution",
    Risk: "risk",
    Interview: "interview",
    "Architecture Narrative": "architecture_narrative",
  };
  const out: Partial<Record<NarrativeSectionKey, string>> = {};
  for (const sec of sections) {
    const v = active.get(sec.id);
    const c = v?.content?.trim() ?? "";
    if (!c) continue;
    const nk = keyMap[sec.sectionType];
    if (nk) out[nk] = c;
  }
  return out;
}

export type BidAgentGatheredContext = {
  project: {
    id: string;
    title: string;
    bidNumber: string;
    dueDate: string;
    status: string;
    issuingOrganization: string;
  };
  pricing: {
    ready: boolean;
    contractCompliant: boolean;
    annualTotal: number;
    contractTotal: number;
    notes: string[];
  };
  rfpCore: {
    solicitationNumber: string;
    dueDate: string;
    summaryLines: string[];
  };
  contractCore: {
    termYears: string;
    crossCheckWarnings: string[];
  };
  vendors: Array<{ id: string; name: string }>;
  architecture: Array<{ id: string; name: string; recommended: boolean }>;
  submissionItems: Array<{ id: string; name: string; status: string }>;
  drafts: Array<{
    sectionType: string;
    status: string;
    wordCount: number;
    hasGroundingBundle: boolean;
    hasContent: boolean;
  }>;
  competitorSimulation: CompetitorAwareSimulationResult | null;
  decisionSynthesis: VendorDecisionSynthesis | null;
  strategicNarrativeSpine: StrategicNarrativeSpine | null;
  narrativeAlignment: NarrativeAlignmentResult | null;
  vendorFocus: {
    vendorId: string;
    vendorName: string;
    pricingReality: Awaited<ReturnType<typeof computeVendorPricingReality>>;
    claimValidation: VendorClaimValidationSummary;
    failureResilience: VendorFailureSimulationSummary;
    roleFit: VendorRoleFitSummary;
    interview: Awaited<ReturnType<typeof getInterviewReadinessSummaryForVendor>>;
  } | null;
  interviewProject: Awaited<
    ReturnType<typeof getProjectInterviewReadinessSummary>
  > | null;
};

function needsVendorDeep(domains: BidAgentDomain[]): boolean {
  return domains.some((d) =>
    [
      "vendor_intelligence",
      "claim_validation",
      "failure_modes",
      "role_fit",
      "vendor_interview",
      "competitor_comparison",
    ].includes(d),
  );
}

function needsCompetitor(domains: BidAgentDomain[]): boolean {
  return domains.some((d) =>
    [
      "competitor_comparison",
      "decision_synthesis",
      "vendor_intelligence",
      "failure_modes",
      "pricing_health",
    ].includes(d),
  );
}

/**
 * Read-only aggregation of bid state for the agent (tool-first; no duplicate business rules).
 */
export async function gatherBidAgentContext(input: {
  projectId: string;
  domains: BidAgentDomain[];
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
}): Promise<BidAgentGatheredContext> {
  const projectRow = await getProject(input.projectId);
  if (!projectRow) {
    throw new Error("Project not found");
  }

  const project = {
    id: projectRow.id,
    title: projectRow.title,
    bidNumber: projectRow.bidNumber,
    dueDate: projectRow.dueDate,
    status: projectRow.status,
    issuingOrganization: projectRow.issuingOrganization,
  };

  const files = await listFilesByProject(input.projectId);
  const pricingLayer = buildPricingLayerForProject(projectRow.bidNumber, files);

  const rfpBundle = buildProjectGroundingBundleRfp({
    bidNumber: projectRow.bidNumber,
    title: projectRow.title,
    issuingOrganization: projectRow.issuingOrganization,
    dueDate: projectRow.dueDate,
  });
  const contractBundle = buildProjectGroundingBundleContract({
    bidNumber: projectRow.bidNumber,
    title: projectRow.title,
    issuingOrganization: projectRow.issuingOrganization,
    dueDate: projectRow.dueDate,
  });

  const vendors = await listVendorsByProject(input.projectId);
  const vendorList = vendors.map((v) => ({ id: v.id, name: v.name }));

  const archOpts = await listArchitectureOptionsByProject(input.projectId);
  const architecture = archOpts.map((o) => ({
    id: o.id,
    name: o.name,
    recommended: o.recommended,
  }));

  const archOpt =
    (input.architectureOptionId
      ? archOpts.find((o) => o.id === input.architectureOptionId)
      : null) ??
    archOpts.find((o) => o.recommended) ??
    archOpts[0];

  let stackIds: string[] = [];
  if (archOpt) {
    const comps = await listArchitectureComponentsByOptionId(archOpt.id);
    stackIds = [
      ...new Set(
        comps
          .filter((c) => !c.optional && c.vendorId)
          .map((c) => c.vendorId as string),
      ),
    ];
  }

  const submissionItems = await listSubmissionItemsByProject(input.projectId);
  const subRows = submissionItems.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
  }));

  const draftSections = await listDraftSectionsByProject(input.projectId);
  const draftVersions = await listDraftVersionsForProject(input.projectId);
  const drafts = draftSections.map((s) => {
    const v = draftVersions.find((x) => x.id === s.activeVersionId);
    const wc = v?.content?.trim()
      ? v.content.trim().split(/\s+/).filter(Boolean).length
      : 0;
    return {
      sectionType: s.sectionType,
      status: s.status,
      wordCount: wc,
      hasGroundingBundle: Boolean(s.selectedGroundingBundleId),
      hasContent: wc > 0,
    };
  });

  let competitorSimulation: CompetitorAwareSimulationResult | null = null;
  if (needsCompetitor(input.domains) || needsVendorDeep(input.domains)) {
    try {
      const ids = await defaultComparedVendorIdsForProject(input.projectId);
      if (ids.length > 0) {
        competitorSimulation = await runCompetitorAwareSimulation({
          projectId: input.projectId,
          comparedVendorIds: ids,
          architectureOptionId: archOpt?.id ?? null,
        });
      }
    } catch {
      competitorSimulation = null;
    }
  }

  let decisionSynthesis: VendorDecisionSynthesis | null = null;
  let strategicNarrativeSpine: StrategicNarrativeSpine | null = null;
  let narrativeAlignment: NarrativeAlignmentResult | null = null;

  if (competitorSimulation && competitorSimulation.entries.length > 0) {
    decisionSynthesis = buildVendorDecisionSynthesis({
      sim: competitorSimulation,
      recommendedVendorStackIds: stackIds,
      architectureOptionName: archOpt?.name,
    });
    const leadName = competitorSimulation.entries.find(
      (e) => e.vendorId === competitorSimulation!.recommendedVendorId,
    )?.vendorName;
    strategicNarrativeSpine = buildStrategicNarrativeSpine({
      projectId: input.projectId,
      synthesis: decisionSynthesis,
      sim: competitorSimulation,
      recommendedVendorDisplayName: leadName,
      architectureOptionName: archOpt?.name,
    });
  } else {
    strategicNarrativeSpine = buildStrategicNarrativeSpine({
      projectId: input.projectId,
      synthesis: null,
      sim: null,
      architectureOptionName: archOpt?.name,
    });
  }

  if (
    strategicNarrativeSpine &&
    input.domains.some((d) => ["narrative_alignment", "final_readiness"].includes(d))
  ) {
    const texts = mapDraftTexts(draftSections, draftVersions);
    const fb = [texts.executive_summary, texts.solution, texts.risk]
      .filter(Boolean)
      .join("\n\n");
    if (fb.length > 0) texts.final_bundle = fb.slice(0, 12000);
    texts.pricing_summary = [
      `Annual $${pricingLayer.model.totals.annual}`,
      `Contract $${pricingLayer.model.totals.contractTotal}`,
      pricingLayer.ready ? "structured model ready" : "not ready",
    ].join(" · ");
    if (archOpt) {
      texts.client_review = `Architecture: ${archOpt.name}`;
    }
    narrativeAlignment = evaluateNarrativeAlignment({
      spine: strategicNarrativeSpine,
      sectionTexts: texts,
    });
  }

  let vendorFocus: BidAgentGatheredContext["vendorFocus"] = null;
  const wantDeep = needsVendorDeep(input.domains);
  const vid =
    input.selectedVendorId?.trim() ||
    competitorSimulation?.recommendedVendorId ||
    vendorList[0]?.id ||
    null;

  if (wantDeep && vid) {
    const vrow = await getVendorById(vid);
    if (vrow && vrow.projectId === input.projectId) {
      await runVendorClaimValidation({ projectId: input.projectId, vendorId: vid });
      const valRows = await listVendorClaimValidations(vid);
      const claimValidation = buildClaimValidationSummaryFromRows(valRows);
      const failureResilience = await runVendorFailureSimulation({
        projectId: input.projectId,
        vendorId: vid,
        architectureOptionId: archOpt?.id ?? null,
      });
      const roleFit = await runVendorRoleFitAnalysis({
        projectId: input.projectId,
        vendorId: vid,
        architectureOptionId: archOpt?.id ?? null,
      });
      const pricingReality = await computeVendorPricingReality({
        projectId: input.projectId,
        vendorId: vid,
      });
      const interview = await getInterviewReadinessSummaryForVendor(vid);
      vendorFocus = {
        vendorId: vid,
        vendorName: vrow.name,
        pricingReality,
        claimValidation,
        failureResilience,
        roleFit: roleFit.summary,
        interview,
      };
    }
  }

  let interviewProject: BidAgentGatheredContext["interviewProject"] = null;
  if (input.domains.includes("vendor_interview")) {
    interviewProject = await getProjectInterviewReadinessSummary(input.projectId);
  }

  const rfpCore = {
    solicitationNumber: rfpBundle.core?.solicitationNumber ?? project.bidNumber,
    dueDate: rfpBundle.core?.dueDate ?? project.dueDate,
    summaryLines: [
      rfpBundle.requirementsSummary?.slice(0, 600) ?? "",
      `Delivery (sample): ${rfpBundle.requirements.deliveryRequirements.slice(0, 4).join(" · ")}`,
      `Tech (sample): ${rfpBundle.requirements.techRequirements.slice(0, 3).join(" · ")}`,
      `Scoring weights — Experience ${rfpBundle.evaluation.experienceWeight} / Solution ${rfpBundle.evaluation.solutionWeight} / Risk ${rfpBundle.evaluation.riskWeight} / Interview ${rfpBundle.evaluation.interviewWeight}`,
    ].filter(Boolean),
  };

  const contractCore = {
    termYears: `${contractBundle.term.baseYears}–${contractBundle.term.maxYears} years`,
    crossCheckWarnings: contractBundle.crossCheckWarnings ?? [],
  };

  return {
    project,
    pricing: {
      ready: pricingLayer.ready,
      contractCompliant: pricingLayer.contractCompliant,
      annualTotal: pricingLayer.model.totals.annual,
      contractTotal: pricingLayer.model.totals.contractTotal,
      notes: pricingLayer.notes.slice(0, 8),
    },
    rfpCore,
    contractCore,
    vendors: vendorList,
    architecture,
    submissionItems: subRows,
    drafts,
    competitorSimulation,
    decisionSynthesis,
    strategicNarrativeSpine,
    narrativeAlignment,
    vendorFocus,
    interviewProject,
  };
}
