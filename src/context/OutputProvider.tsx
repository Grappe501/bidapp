import { useCallback, useMemo, type ReactNode } from "react";
import { useControl } from "@/context/useControl";
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
import { computeEvaluatorSimulation } from "@/lib/evaluator-simulation";
import { computeFinalReadinessGate } from "@/lib/final-readiness-gate";
import { computeArbuySubmissionCompliance } from "@/lib/arbuy-solicitation";
import { buildPricingLayerForProject } from "@/lib/pricing-structure";
import { computeTechnicalProposalPacketCompliance } from "@/lib/technical-proposal-packet";
import type { PackagingCompleteness } from "@/types";
import { OutputContext } from "./output-context";

export function OutputProvider({ children }: { children: ReactNode }) {
  const { project, files } = useWorkspace();
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
      const payload = buildBundlePayload(bundle, mergedArtifacts);
      return copyTextToClipboard(JSON.stringify(payload, null, 2));
    },
    [bundles, mergedArtifacts],
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
