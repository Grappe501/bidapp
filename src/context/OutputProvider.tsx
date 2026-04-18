import { useCallback, useMemo, type ReactNode } from "react";
import { MOCK_PROJECT } from "@/data/mockProject";
import { useControl } from "@/context/useControl";
import { useDrafting } from "@/context/useDrafting";
import { useReview } from "@/context/useReview";
import {
  artifactsWithRedactionPseudo,
  assembleOutputBundles,
  buildBundlePayload,
  computeOutputSummary,
  computePackagingCompleteness,
  copyTextToClipboard,
  formatChecklistExport,
  formatReadinessExport,
  gatherOutputArtifacts,
  summarizeRedactionPackaging,
  type OutputGatherInput,
} from "@/lib/output-utils";
import type { PackagingCompleteness } from "@/types";
import { OutputContext } from "./output-context";

export function OutputProvider({ children }: { children: ReactNode }) {
  const project = MOCK_PROJECT;
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
