import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_CONTRACT_RISKS } from "@/data/mockContractRisks";
import { getSupplementalReviewIssues } from "@/data/mockReviewIssues";
import { MOCK_PROJECT } from "@/data/mockProject";
import { useArchitecture } from "@/context/useArchitecture";
import { useControl } from "@/context/useControl";
import { useDrafting } from "@/context/useDrafting";
import { useEvidence } from "@/context/useEvidence";
import { useRequirements } from "@/context/useRequirements";
import { useVendors } from "@/context/useVendors";
import {
  runReviewRules,
  type BidReviewSnapshot,
} from "@/lib/review-rules-engine";
import {
  computeReadinessScore,
  filterReviewIssues,
  mergeRequirementProofMaps,
  mergeSupplementalIssues,
  type ReviewFilters,
} from "@/lib/review-utils";
import type {
  GroundedProseReviewResult,
  RequirementSupportSummary,
  ReviewIssue,
  ReviewIssueStatus,
} from "@/types";
import { ReviewContext, type IssueOverride } from "./review-context";

const OVERRIDE_KEY = "bidapp-review-overrides-v1";

function loadOverrides(): Record<string, IssueOverride> {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, IssueOverride>;
  } catch {
    return {};
  }
}

function saveOverrides(o: Record<string, IssueOverride>) {
  try {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

function applyOverrides(
  issues: ReviewIssue[],
  or: Record<string, IssueOverride>,
): ReviewIssue[] {
  return issues.map((issue) => {
    const o = or[issue.id];
    if (!o) return issue;
    return {
      ...issue,
      status: o.status,
      resolutionNotes: o.notes || undefined,
      updatedAt: o.updatedAt,
    };
  });
}

export function ReviewProvider({ children }: { children: ReactNode }) {
  const projectId = MOCK_PROJECT.id;
  const { requirements } = useRequirements();
  const { evidenceItems, links } = useEvidence();
  const { submissionItems, discussionItems, redactionFlags } = useControl();
  const { sections, versions, getActiveVersion, getSelectedBundle } =
    useDrafting();
  const { vendors } = useVendors();
  const { options: architectureOptions } = useArchitecture();

  const [overrides, setOverrides] = useState<Record<string, IssueOverride>>(
    loadOverrides,
  );
  const [baseIssues, setBaseIssues] = useState<ReviewIssue[]>([]);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFiltersState] = useState<ReviewFilters>({
    severity: "all",
    issueType: "all",
    status: "all",
    entityType: "all",
    search: "",
  });

  const snapshot = useMemo((): BidReviewSnapshot => {
    const activeDraftBySection: Record<string, ReturnType<typeof getActiveVersion>> =
      {};
    let combined = "";
    const proofMaps: Record<string, RequirementSupportSummary>[] = [];
    const groundedProseBySectionId: Record<
      string,
      GroundedProseReviewResult | null
    > = {};
    for (const sec of sections) {
      const v = getActiveVersion(sec.id);
      activeDraftBySection[sec.id] = v;
      if (v?.content) combined += `\n\n${v.content}`;
      const bundle = getSelectedBundle(sec.id)?.payload;
      if (bundle?.requirementSupport) {
        proofMaps.push(bundle.requirementSupport);
      }
      groundedProseBySectionId[sec.id] =
        v?.metadata.groundedProseReview ?? null;
    }
    const requirementProofById =
      proofMaps.length > 0 ? mergeRequirementProofMaps(proofMaps) : undefined;
    return {
      projectId,
      requirements,
      evidenceLinks: links,
      evidenceItems,
      submissionItems,
      discussionItems,
      redactionFlags,
      contractRisks: MOCK_CONTRACT_RISKS,
      draftSections: sections,
      draftVersions: versions,
      activeDraftBySection,
      vendors,
      architectureOptions,
      combinedDraftText: combined,
      requirementProofById,
      groundedProseBySectionId,
    };
  }, [
    projectId,
    requirements,
    links,
    evidenceItems,
    submissionItems,
    discussionItems,
    redactionFlags,
    sections,
    versions,
    vendors,
    architectureOptions,
    getActiveVersion,
    getSelectedBundle,
  ]);

  useEffect(() => {
    const generated = runReviewRules(snapshot);
    const merged = mergeSupplementalIssues(
      generated,
      getSupplementalReviewIssues(projectId),
    );
    setBaseIssues(merged);
    setLastRunAt(new Date().toISOString());
  }, [snapshot, projectId, refreshKey]);

  useEffect(() => {
    saveOverrides(overrides);
  }, [overrides]);

  const allIssues = useMemo(
    () => applyOverrides(baseIssues, overrides),
    [baseIssues, overrides],
  );

  const readiness = useMemo(
    () => computeReadinessScore(snapshot, allIssues),
    [snapshot, allIssues],
  );

  const setFilters = useCallback((patch: Partial<ReviewFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const filteredIssues = useMemo(
    () => filterReviewIssues(allIssues, filters),
    [allIssues, filters],
  );

  const runReview = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const updateIssueStatus = useCallback(
    (issueId: string, status: ReviewIssueStatus, notes?: string) => {
      setOverrides((prev) => ({
        ...prev,
        [issueId]: {
          status,
          notes: notes ?? prev[issueId]?.notes ?? "",
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [],
  );

  const getIssue = useCallback(
    (id: string) => allIssues.find((i) => i.id === id),
    [allIssues],
  );

  const value = useMemo(
    () => ({
      projectId,
      issues: filteredIssues,
      allIssues,
      readiness,
      lastRunAt,
      filters,
      setFilters,
      runReview,
      getIssue,
      updateIssueStatus,
      snapshot,
    }),
    [
      projectId,
      filteredIssues,
      allIssues,
      readiness,
      lastRunAt,
      filters,
      setFilters,
      runReview,
      getIssue,
      updateIssueStatus,
      snapshot,
    ],
  );

  return (
    <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
  );
}
