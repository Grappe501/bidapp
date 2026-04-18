import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMockCandidatesForFile } from "@/data/mockRequirementCandidates";
import { MOCK_REQUIREMENTS } from "@/data/mockRequirements";
import { useWorkspace } from "@/context/useWorkspace";
import type { Requirement, RequirementCandidate } from "@/types";
import { RequirementContext } from "./requirement-context";

function mergeCandidate(
  base: RequirementCandidate,
  draft?: Partial<RequirementCandidate>,
): RequirementCandidate {
  if (!draft) return base;
  return { ...base, ...draft };
}

function candidateToRequirement(
  fileId: string,
  sourceFileName: string,
  c: RequirementCandidate,
): Requirement {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: c.proposedTitle,
    sourceFileId: fileId,
    sourceFileName,
    sourceSection: c.proposedSourceSection,
    verbatimText: c.proposedVerbatimText,
    summary: c.proposedSummary,
    requirementType: c.proposedRequirementType,
    mandatory: c.proposedMandatory,
    responseCategory: c.proposedResponseCategory,
    status: "Approved",
    riskLevel: "Moderate",
    owner: "Unassigned",
    notes: "",
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function RequirementProvider({ children }: { children: ReactNode }) {
  const { files } = useWorkspace();
  const [requirements, setRequirements] = useState<Requirement[]>(() => [
    ...MOCK_REQUIREMENTS,
  ]);
  const [pendingCandidatesByFile, setPendingCandidatesByFile] = useState<
    Record<string, RequirementCandidate[]>
  >({});
  const [extractionRunFileIds, setExtractionRunFileIds] = useState<Set<string>>(
    () => new Set(),
  );

  const fileName = useCallback(
    (fileId: string) =>
      files.find((f) => f.id === fileId)?.name ?? "Unknown file",
    [files],
  );

  const runExtraction = useCallback((fileId: string) => {
    const next = getMockCandidatesForFile(fileId);
    setPendingCandidatesByFile((prev) => ({ ...prev, [fileId]: next }));
    setExtractionRunFileIds((prev) => new Set(prev).add(fileId));
  }, []);

  const approveCandidate = useCallback(
    (fileId: string, candidateId: string, draft?: Partial<RequirementCandidate>) => {
      const nm = fileName(fileId);
      setPendingCandidatesByFile((prev) => {
        const list = prev[fileId];
        if (!list) return prev;
        const found = list.find((c) => c.id === candidateId);
        if (!found) return prev;
        const merged = mergeCandidate(found, draft);
        const req = candidateToRequirement(fileId, nm, merged);
        setRequirements((r) => [...r, req]);
        return {
          ...prev,
          [fileId]: list.filter((c) => c.id !== candidateId),
        };
      });
    },
    [fileName],
  );

  const rejectCandidate = useCallback(
    (fileId: string, candidateId: string) => {
      setPendingCandidatesByFile((prev) => ({
        ...prev,
        [fileId]: (prev[fileId] ?? []).filter((c) => c.id !== candidateId),
      }));
    },
    [],
  );

  const bulkApproveCandidates = useCallback(
    (
      fileId: string,
      candidateIds: string[],
      getDraft?: (candidateId: string) => Partial<RequirementCandidate> | undefined,
    ) => {
      const name = fileName(fileId);
      const rejectSet = new Set(candidateIds);

      setPendingCandidatesByFile((prev) => {
        const list = prev[fileId] ?? [];
        const now = new Date().toISOString();
        const newReqs: Requirement[] = [];

        for (const id of candidateIds) {
          const found = list.find((c) => c.id === id);
          if (!found) continue;
          const merged = mergeCandidate(found, getDraft?.(id));
          newReqs.push({
            id: crypto.randomUUID(),
            title: merged.proposedTitle,
            sourceFileId: fileId,
            sourceFileName: name,
            sourceSection: merged.proposedSourceSection,
            verbatimText: merged.proposedVerbatimText,
            summary: merged.proposedSummary,
            requirementType: merged.proposedRequirementType,
            mandatory: merged.proposedMandatory,
            responseCategory: merged.proposedResponseCategory,
            status: "Approved",
            riskLevel: "Moderate",
            owner: "Unassigned",
            notes: "",
            tags: [],
            createdAt: now,
            updatedAt: now,
          });
        }

        if (newReqs.length === 0) return prev;

        setRequirements((p) => [...p, ...newReqs]);
        return {
          ...prev,
          [fileId]: list.filter((c) => !rejectSet.has(c.id)),
        };
      });
    },
    [fileName],
  );

  const updateRequirement = useCallback((id: string, patch: Partial<Requirement>) => {
    const touchedAt = new Date().toISOString();
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: touchedAt } : r,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      requirements,
      pendingCandidatesByFile,
      extractionRunFileIds,
      runExtraction,
      approveCandidate,
      rejectCandidate,
      bulkApproveCandidates,
      updateRequirement,
    }),
    [
      requirements,
      pendingCandidatesByFile,
      extractionRunFileIds,
      runExtraction,
      approveCandidate,
      rejectCandidate,
      bulkApproveCandidates,
      updateRequirement,
    ],
  );

  return (
    <RequirementContext.Provider value={value}>
      {children}
    </RequirementContext.Provider>
  );
}
