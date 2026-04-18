import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ExtractionRunPanel } from "@/components/requirements/ExtractionRunPanel";
import { ExtractionSourcePicker } from "@/components/requirements/ExtractionSourcePicker";
import { RequirementApprovalPanel } from "@/components/requirements/RequirementApprovalPanel";
import { RequirementCandidateTable } from "@/components/requirements/RequirementCandidateTable";
import { useRequirements } from "@/context/useRequirements";
import { useWorkspace } from "@/context/useWorkspace";
import type { RequirementCandidate } from "@/types";

export function RequirementExtractionPage() {
  const { files } = useWorkspace();
  const {
    pendingCandidatesByFile,
    extractionRunFileIds,
    runExtraction,
    approveCandidate,
    rejectCandidate,
    bulkApproveCandidates,
  } = useRequirements();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<
    Record<string, Partial<RequirementCandidate>>
  >({});

  useEffect(() => {
    setExpandedId(null);
    setSelected(new Set());
    setDrafts({});
  }, [selectedFileId]);

  const selectedFile =
    files.find((f) => f.id === selectedFileId) ?? null;
  const candidates = selectedFileId
    ? (pendingCandidatesByFile[selectedFileId] ?? [])
    : [];
  const hasRun = selectedFileId
    ? extractionRunFileIds.has(selectedFileId)
    : false;

  const onDraftChange = (
    candidateId: string,
    patch: Partial<RequirementCandidate>,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [candidateId]: { ...prev[candidateId], ...patch },
    }));
  };

  const toggleSelect = (id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAll = (on: boolean) => {
    if (!on) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(candidates.map((c) => c.id)));
  };

  const handleApprove = (candidateId: string) => {
    if (!selectedFileId) return;
    approveCandidate(selectedFileId, candidateId, drafts[candidateId]);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(candidateId);
      return next;
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[candidateId];
      return next;
    });
    if (expandedId === candidateId) setExpandedId(null);
  };

  const handleReject = (candidateId: string) => {
    if (!selectedFileId) return;
    rejectCandidate(selectedFileId, candidateId);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(candidateId);
      return next;
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[candidateId];
      return next;
    });
    if (expandedId === candidateId) setExpandedId(null);
  };

  const handleBulkApprove = () => {
    if (!selectedFileId || selected.size === 0) return;
    bulkApproveCandidates(
      selectedFileId,
      Array.from(selected),
      (id) => drafts[id],
    );
    setSelected(new Set());
    setDrafts({});
    setExpandedId(null);
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Requirement extraction
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Human-in-the-loop intake: run a mock job, review structured
              candidates, edit fields as needed, then approve into the
              compliance matrix.
            </p>
          </div>
          <Link to="/requirements" className="shrink-0">
            <Button type="button" variant="secondary">
              Back to matrix
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ExtractionSourcePicker
            files={files}
            selectedFileId={selectedFileId}
            onSelect={setSelectedFileId}
          />
          <ExtractionRunPanel
            selectedFile={selectedFile}
            hasRun={hasRun}
            candidateCount={candidates.length}
            onRun={() => {
              if (selectedFileId) runExtraction(selectedFileId);
            }}
          />
        </div>

        <div className="space-y-4">
          <RequirementApprovalPanel
            selectedCount={selected.size}
            onApproveSelected={handleBulkApprove}
            onClearSelection={() => setSelected(new Set())}
          />
          <RequirementCandidateTable
            candidates={candidates}
            selectedIds={selected}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            expandedId={expandedId}
            onToggleExpand={(id) =>
              setExpandedId((prev) => (prev === id ? null : id))
            }
            drafts={drafts}
            onDraftChange={onDraftChange}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </div>
    </div>
  );
}
