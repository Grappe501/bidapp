import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useArchitecture } from "@/context/useArchitecture";
import { useControl } from "@/context/useControl";
import { useVendors } from "@/context/useVendors";
import { useWorkspace } from "@/context/useWorkspace";
import { useDrafting } from "@/context/useDrafting";
import { useReview } from "@/context/useReview";
import {
  artifactsWithRedactionPseudo,
  assembleOutputBundles,
  buildBundlePayload,
  buildSubmissionPackageChecklistRows,
  computeOutputSummary,
  computePackagingCompleteness,
  computeSubmissionPackageSummaryStats,
  copyTextToClipboard,
  formatChecklistExport,
  formatReadinessExport,
  gatherOutputArtifacts,
  summarizeRedactionPackaging,
  type OutputGatherInput,
} from "@/lib/output-utils";
import { postCompetitorSimulation, postVendorIntelligenceExport } from "@/lib/functions-api";
import { assessVendorDecisionForReadiness } from "@/lib/vendor-decision-gate";
import { computeEvaluatorSimulation } from "@/lib/evaluator-simulation";
import { computeFinalReadinessGate } from "@/lib/final-readiness-gate";
import { computeArbuySubmissionCompliance } from "@/lib/arbuy-solicitation";
import { buildPricingLayerForProject } from "@/lib/pricing-structure";
import { computeTechnicalProposalPacketCompliance } from "@/lib/technical-proposal-packet";
import { buildVendorDecisionSynthesis } from "@/lib/decision-synthesis-engine";
import {
  evaluateNarrativeAlignment,
  extractNarrativeSectionTextsFromSnapshot,
} from "@/lib/narrative-alignment-engine";
import { buildStrategicNarrativeSpine } from "@/lib/strategic-narrative-spine";
import { formatPricingSummaryExport } from "@/lib/pricing-structure";
import type { CompetitorAwareSimulationResult, PackagingCompleteness } from "@/types";
import { OutputContext } from "./output-context";

export function OutputProvider({ children }: { children: ReactNode }) {
  const { project, files } = useWorkspace();
  const { vendors } = useVendors();
  const { options: architectureOptions } = useArchitecture();
  const { submissionItems, redactionFlags, discussionItems } = useControl();
  const { sections, getActiveVersion } = useDrafting();
  const { allIssues, readiness, snapshot } = useReview();

  const gatherInput = useMemo((): OutputGatherInput => {
    const activeDraftContentBySectionId: Record<string, string | undefined> =
      {};
    const draftUpdatedAtBySectionId: Record<string, string> = {};
    for (const sec of sections) {
      const v = getActiveVersion(sec.id);
      activeDraftContentBySectionId[sec.id] = v?.content;
      draftUpdatedAtBySectionId[sec.id] = v?.createdAt ?? sec.updatedAt;
    }
    return {
      project,
      submissionItems,
      draftSections: sections,
      activeDraftContentBySectionId,
      draftUpdatedAtBySectionId,
      redactionFlags,
      discussionItems,
      reviewIssues: allIssues,
      readiness,
    };
  }, [
    project,
    submissionItems,
    sections,
    getActiveVersion,
    redactionFlags,
    discussionItems,
    allIssues,
    readiness,
  ]);

  const artifacts = useMemo(
    () => gatherOutputArtifacts(gatherInput),
    [gatherInput],
  );

  const mergedArtifacts = useMemo(
    () => artifactsWithRedactionPseudo(artifacts, redactionFlags),
    [artifacts, redactionFlags],
  );

  const bundles = useMemo(
    () => assembleOutputBundles(project.id, artifacts, redactionFlags),
    [project.id, artifacts, redactionFlags],
  );

  const packagingByBundle = useMemo(() => {
    const o: Record<string, PackagingCompleteness> = {};
    for (const b of bundles) {
      o[b.id] = computePackagingCompleteness(b.bundleType, mergedArtifacts);
    }
    return o;
  }, [bundles, mergedArtifacts]);

  const summary = useMemo(
    () => computeOutputSummary(artifacts, redactionFlags, allIssues),
    [artifacts, redactionFlags, allIssues],
  );

  const redactionSummary = useMemo(
    () => summarizeRedactionPackaging(redactionFlags, submissionItems, artifacts),
    [redactionFlags, submissionItems, artifacts],
  );

  const checklistRows = useMemo(
    () => buildSubmissionPackageChecklistRows(artifacts, submissionItems),
    [artifacts, submissionItems],
  );

  const submissionPackageStats = useMemo(
    () => computeSubmissionPackageSummaryStats(checklistRows),
    [checklistRows],
  );

  const pricingLayer = useMemo(
    () => buildPricingLayerForProject(project.bidNumber, files),
    [project.bidNumber, files],
  );

  const evaluatorSimulation = useMemo(
    () =>
      computeEvaluatorSimulation({
        snapshot,
        issues: allIssues,
        readiness,
        pricingLayer,
        bidNumber: project.bidNumber,
      }),
    [snapshot, allIssues, readiness, pricingLayer, project.bidNumber],
  );

  const technicalProposalPacketCompliance = useMemo(
    () =>
      computeTechnicalProposalPacketCompliance({
        bidNumber: project.bidNumber,
        checklistStats: submissionPackageStats,
        checklistRows,
        snapshot,
        activeDraftContentBySectionId: gatherInput.activeDraftContentBySectionId,
      }),
    [
      project.bidNumber,
      submissionPackageStats,
      checklistRows,
      snapshot,
      gatherInput.activeDraftContentBySectionId,
    ],
  );

  const arbuySolicitationCompliance = useMemo(
    () =>
      computeArbuySubmissionCompliance({
        bidNumber: project.bidNumber,
        files,
        pricingLayer,
      }),
    [project.bidNumber, files, pricingLayer],
  );

  const [competitorAwareSimulation, setCompetitorAwareSimulation] =
    useState<CompetitorAwareSimulationResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pid = project.id?.trim();
    if (!pid || vendors.length < 1) {
      setCompetitorAwareSimulation(null);
      return;
    }
    const rec =
      architectureOptions.find((o) => o.recommended) ?? architectureOptions[0];
    const ids = vendors.slice(0, 10).map((v) => v.id);
    void postCompetitorSimulation({
      projectId: pid,
      comparedVendorIds: ids,
      architectureOptionId: rec?.id ?? null,
    })
      .then((r) => {
        if (!cancelled) setCompetitorAwareSimulation(r);
      })
      .catch(() => {
        if (!cancelled) setCompetitorAwareSimulation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id, vendors, architectureOptions]);

  const recommendedArch =
    architectureOptions.find((o) => o.recommended) ?? architectureOptions[0];
  const vendorStackIds = useMemo(
    () =>
      recommendedArch
        ? [
            ...new Set(
              recommendedArch.components
                .filter((c) => !c.optional && c.vendorId)
                .map((c) => c.vendorId),
            ),
          ]
        : [],
    [recommendedArch],
  );

  const vendorDecisionSynthesis = useMemo(() => {
    if (!competitorAwareSimulation) return null;
    return buildVendorDecisionSynthesis({
      sim: competitorAwareSimulation,
      recommendedVendorStackIds: vendorStackIds,
      architectureOptionName: recommendedArch?.name,
    });
  }, [competitorAwareSimulation, vendorStackIds, recommendedArch?.name]);

  const strategicNarrativeSpine = useMemo(
    () =>
      buildStrategicNarrativeSpine({
        projectId: project.id,
        synthesis: vendorDecisionSynthesis,
        sim: competitorAwareSimulation,
        recommendedVendorDisplayName: vendorDecisionSynthesis?.recommendedVendorId
          ? competitorAwareSimulation?.entries.find(
              (e) => e.vendorId === vendorDecisionSynthesis.recommendedVendorId,
            )?.vendorName
          : competitorAwareSimulation?.entries[0]?.vendorName,
        architectureOptionName: recommendedArch?.name,
      }),
    [project.id, vendorDecisionSynthesis, competitorAwareSimulation, recommendedArch?.name],
  );

  const narrativeAlignmentResult = useMemo(() => {
    const texts = extractNarrativeSectionTextsFromSnapshot(snapshot);
    const fb = [texts.executive_summary, texts.solution, texts.risk]
      .filter(Boolean)
      .join("\n\n");
    if (fb.length > 0) texts.final_bundle = fb.slice(0, 12000);
    texts.pricing_summary = formatPricingSummaryExport(pricingLayer).slice(0, 8000);
    if (recommendedArch) {
      const names = recommendedArch.components
        .filter((c) => !c.optional)
        .map((c) => c.vendorName)
        .join(", ");
      texts.client_review = `Client review snapshot: ${recommendedArch.name}; core vendors ${names}.`;
    }
    return evaluateNarrativeAlignment({
      spine: strategicNarrativeSpine,
      sectionTexts: texts,
    });
  }, [strategicNarrativeSpine, snapshot, pricingLayer, recommendedArch]);

  const vendorDecision = useMemo(
    () =>
      assessVendorDecisionForReadiness(
        competitorAwareSimulation,
        competitorAwareSimulation?.projectInterviewReadiness ?? null,
        vendorDecisionSynthesis,
      ),
    [competitorAwareSimulation, vendorDecisionSynthesis],
  );

  const finalReadinessGate = useMemo(
    () =>
      computeFinalReadinessGate({
        bidNumber: project.bidNumber,
        readiness,
        reviewIssues: allIssues,
        snapshot,
        redactionSummary,
        checklistStats: submissionPackageStats,
        checklistRows,
        pricingLayer,
        evaluator: evaluatorSimulation,
        technicalProposalPacket: technicalProposalPacketCompliance,
        arbuySolicitation: arbuySolicitationCompliance,
        vendorDecision,
        narrativeAlignment: narrativeAlignmentResult,
      }),
    [
      project.bidNumber,
      readiness,
      allIssues,
      snapshot,
      redactionSummary,
      submissionPackageStats,
      checklistRows,
      pricingLayer,
      evaluatorSimulation,
      technicalProposalPacketCompliance,
      arbuySolicitationCompliance,
      vendorDecision,
      narrativeAlignmentResult,
    ],
  );

  const copySectionPlainText = useCallback(
    async (sectionId: string) => {
      const v = getActiveVersion(sectionId);
      const text = v?.content?.trim() ?? "";
      if (!text) return false;
      return copyTextToClipboard(text);
    },
    [getActiveVersion],
  );

  const copyChecklistSummary = useCallback(async () => {
    return copyTextToClipboard(formatChecklistExport(project, artifacts));
  }, [project, artifacts]);

  const copyReadinessSummary = useCallback(async () => {
    return copyTextToClipboard(
      formatReadinessExport(project, readiness, allIssues),
    );
  }, [project, readiness, allIssues]);

  const copyBundleJson = useCallback(
    async (bundleId: string) => {
      const bundle = bundles.find((b) => b.id === bundleId);
      if (!bundle) return false;
      let vendorAppendix: Record<string, unknown> | null = null;
      if (bundle.bundleType === "Final Readiness Bundle") {
        try {
          const exp = await postVendorIntelligenceExport(project.id);
          vendorAppendix = {
            vendors: exp.vendors,
            vendorComparisonNote: exp.vendorComparisonNote,
            vendorJustification:
              "Selection and trade-offs must cite vendor_claims and intelligence_facts rows — do not treat this export as new evidence.",
          };
        } catch {
          vendorAppendix = null;
        }
      }
      const payload = buildBundlePayload(
        bundle,
        mergedArtifacts,
        vendorAppendix,
      );
      return copyTextToClipboard(JSON.stringify(payload, null, 2));
    },
    [bundles, mergedArtifacts, project.id],
  );

  const value = useMemo(
    () => ({
      project,
      artifacts,
      bundles,
      packagingByBundle,
      summary,
      redactionSummary,
      readiness,
      reviewIssues: allIssues,
      reviewSnapshot: snapshot,
      evaluatorSimulation,
      competitorAwareSimulation,
      vendorDecisionSynthesis,
      strategicNarrativeSpine,
      narrativeAlignmentResult,
      finalReadinessGate,
      technicalProposalPacketCompliance,
      arbuySolicitationCompliance,
      submissionPackageStats,
      copySectionPlainText,
      copyChecklistSummary,
      copyReadinessSummary,
      copyBundleJson,
    }),
    [
      project,
      artifacts,
      bundles,
      packagingByBundle,
      summary,
      redactionSummary,
      readiness,
      allIssues,
      snapshot,
      evaluatorSimulation,
      competitorAwareSimulation,
      vendorDecisionSynthesis,
      strategicNarrativeSpine,
      narrativeAlignmentResult,
      finalReadinessGate,
      technicalProposalPacketCompliance,
      arbuySolicitationCompliance,
      submissionPackageStats,
      copySectionPlainText,
      copyChecklistSummary,
      copyReadinessSummary,
      copyBundleJson,
    ],
  );

  return (
    <OutputContext.Provider value={value}>{children}</OutputContext.Provider>
  );
}
